import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { contacts, messages as initialMessages } from './data/mock';
import { MessageSquare, ShieldCheck, Laptop, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeContactId, setActiveContactId] = useState(1);
  const [allMessages, setAllMessages] = useState(initialMessages);

  const activeContact = contacts.find(c => c.id === activeContactId);
  const activeMessages = allMessages[activeContactId] || [];

  const handleSendMessage = (text) => {
    const newMessage = {
      id: Date.now(),
      sender: "Eu",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setAllMessages(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMessage]
    }));
  };

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
                    Conecte-se com rapidez e segurança. Seus dados estão protegidos com criptografia de ponta a ponta.
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

                  <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                    <Globe size={14} />
                    Conexão Global • Versão Desktop v2.4
                  </div>
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
