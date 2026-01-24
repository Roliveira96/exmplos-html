package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev
	},
}

type Message struct {
	Type    string `json:"type"` // "login", "message", "user_list"
	From    string `json:"from"`
	To      string `json:"to"`
	Content string `json:"content"`
	Time    string `json:"time"`
}

type Client struct {
	Conn  *websocket.Conn
	Email string
}

var (
	clients   = make(map[string]*Client)
	clientsMu sync.Mutex
)

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	clientEmail := ""

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			if clientEmail != "" {
				clientsMu.Lock()
				delete(clients, clientEmail)
				clientsMu.Unlock()
				log.Printf("User disconnected: %s", clientEmail)
				broadcastUserList()
			}
			break
		}

		switch msg.Type {
		case "login":
			clientEmail = msg.From
			clientsMu.Lock()
			clients[clientEmail] = &Client{Conn: ws, Email: clientEmail}
			clientsMu.Unlock()
			log.Printf("User logged in: %s", clientEmail)
			broadcastUserList()

		case "message":
			log.Printf("Message from %s to %s: %s", msg.From, msg.To, msg.Content)
			clientsMu.Lock()
			target, ok := clients[msg.To]
			clientsMu.Unlock()

			if ok {
				err := target.Conn.WriteJSON(msg)
				if err != nil {
					log.Printf("error: %v", err)
					target.Conn.Close()
					clientsMu.Lock()
					delete(clients, msg.To)
					clientsMu.Unlock()
				}
			} else {
				log.Printf("Target user %s not found", msg.To)
			}
		}
	}
}

func broadcastUserList() {
	clientsMu.Lock()
	emails := make([]string, 0, len(clients))
	for email := range clients {
		emails = append(emails, email)
	}

	msg := Message{
		Type:    "user_list",
		Content: "",
	}

	listJson, _ := json.Marshal(emails)
	msg.Content = string(listJson)

	for _, client := range clients {
		client.Conn.WriteJSON(msg)
	}
	clientsMu.Unlock()
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	fmt.Println("Server started on :9000")
	err := http.ListenAndServe(":9000", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
