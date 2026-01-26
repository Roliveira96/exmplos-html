import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { contacts as initialContacts, messages as initialMessages } from './data/mock';
import { MessageSquare, ShieldCheck, Laptop, Globe, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [activeContactId, setActiveContactId] = useState(null);
  const [allMessages, setAllMessages] = useState(initialMessages);
  const [contacts, setContacts] = useState(initialContacts);
  const [ws, setWs] = useState(null);
  const [emailInput, setEmailInput] = useState('');

  // WebSocket Connection
  useEffect(() => {
    if (!userEmail) return;

    let socket;
    const connect = () => {
      socket = new WebSocket('ws://localhost:9000/ws');

      socket.onopen = () => {
        console.log('Connected to Go WebSocket');
        socket.send(JSON.stringify({
          type: 'login',
          from: userEmail
        }));
        setWs(socket);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        if (data.type === 'message') {
          const senderEmail = data.from;

          setContacts(prev => {
            const exists = prev.find(c => c.id === senderEmail);
            if (!exists) {
              return [{
                id: senderEmail,
                name: senderEmail.split('@')[0],
                avatar: `https://ui-avatars.com/api/?name=${senderEmail}&background=random`,
                lastMessage: data.content,
                time: data.time,
                type: 'user',
                unread: 1,
                online: true
              }, ...prev];
            }
            return prev.map(c => c.id === senderEmail ? { ...c, lastMessage: data.content, time: data.time, unread: (activeContactId === senderEmail ? 0 : (c.unread || 0) + 1) } : c);
          });

          const newMessage = {
            id: Date.now(),
            sender: data.from,
            text: data.content,
            time: data.time,
            isMe: false
          };

          setAllMessages(prev => ({
            ...prev,
            [senderEmail]: [...(prev[senderEmail] || []), newMessage]
          }));
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected. Retrying in 3s...');
        setWs(null);
        setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
    };
  }, [userEmail, activeContactId]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      localStorage.setItem('userEmail', emailInput);
      setUserEmail(emailInput);
    }
  };

  const handleSendMessage = (text) => {
    if (!activeContactId) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Attempt send
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        from: userEmail,
        to: activeContactId,
        content: text,
        time: time
      }));
    } else {
      console.warn("WebSocket not connected. Message only added locally.");
    }

    // Update locally always for WhatsApp feel
    const newMessage = {
      id: Date.now(),
      sender: "Eu",
      text: text,
      time: time,
      isMe: true
    };

    setAllMessages(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMessage]
    }));

    setContacts(prev => prev.map(c =>
      c.id === activeContactId ? { ...c, lastMessage: text, time: time } : c
    ));
  };

  const activeContact = contacts.find(c => c.id === activeContactId);
  const activeMessages = allMessages[activeContactId] || [];

  const handleNewConversation = () => {
    const targetEmail = prompt("Informe o e-mail da pessoa para conversar:");
    if (!targetEmail || targetEmail === userEmail) return;

    // Add to contacts if not exists
    const exists = contacts.find(c => c.id === targetEmail);
    if (!exists) {
      const newContact = {
        id: targetEmail,
        name: targetEmail.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${targetEmail}&background=random`,
        lastMessage: "Nova conversa iniciada",
        time: "Agora",
        type: 'user',
        unread: 0,
        online: false
      };
      setContacts([newContact, ...contacts]);
      setActiveContactId(targetEmail);
    } else {
      setActiveContactId(targetEmail);
    }
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-primary-200">
            <MessageSquare size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Bem-vindo ao Zap v2</h1>
          <p className="text-slate-400 mb-8">Insira seu e-mail para começar a conversar em tempo real.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="seu@email.com"
              required
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-200 transition-all text-slate-700 font-medium"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <button
              type="submit"
              className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Entrar no Chat
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-0 lg:p-10 font-sans selection:bg-primary-100 selection:text-primary-700">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full lg:h-[90vh] max-w-[1400px] flex overflow-hidden shadow-2xl shadow-slate-300 lg:rounded-[2.5rem] bg-white border border-white/50"
      >
        {/* Sidebar */}
        <Sidebar
          contacts={contacts}
          activeId={activeContactId}
          onSelect={setActiveContactId}
          onNewConversation={handleNewConversation}
          currentUser={userEmail}
        />

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-slate-50">
          <AnimatePresence mode="wait">
            {activeContact ? (
              <motion.div
                key={activeContact.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex-1 h-full"
              >
                <ChatWindow
                  contact={activeContact}
                  messages={activeMessages}
                  onSendMessage={handleSendMessage}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center p-12 text-center"
              >
                <div className="max-w-md">
                  <div className="w-24 h-24 bg-primary-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-primary-600 shadow-inner">
                    <MessageSquare size={44} strokeWidth={1.5} />
                  </div>
                  <h1 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">Mensageiro Zap v2</h1>
                  <p className="text-slate-400 font-medium leading-relaxed mb-10">
                    Logado como: <span className="text-primary-600 font-bold">{userEmail}</span><br />
                    Selecione uma conversa ao lado ou inicie uma nova com um e-mail.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                      <ShieldCheck className="text-primary-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-slate-600">Segurança Total</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                      <Laptop className="text-primary-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-slate-600">Multi-Plataforma</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { localStorage.removeItem('userEmail'); window.location.reload(); }}
                    className="mt-10 text-xs font-bold text-red-400 hover:text-red-500 underline uppercase tracking-widest"
                  >
                    Sair da conta
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
