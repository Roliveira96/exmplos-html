# Mensageiro Zap v2

Um clone do WhatsApp com tema azul e suporte a mensagens de grupos e pessoas, utilizando React no Frontend e NestJS no Backend.

## Estrutura

- **frontend/**: Interface do usuário (React + Vite).
- **backend/**: Servidor API (NestJS).

## Como Rodar

Este projeto foi configurado para rodar localmente.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Acesse em: `http://localhost:5173/`

### Backend
```bash
cd backend
npm install
npm run start:dev
```
Acesse em: `http://localhost:3005/` (Porta alterada para evitar conflitos)

## Detalhes
- O frontend utiliza dados mocados (`src/data/mock.js`) para simular a interação.
- A interface segue o pedido de "cores azuis" e layout similar ao WhatsApp Web.
