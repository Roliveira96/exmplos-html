import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreHorizontal, Paperclip, Smile, Mic, Send, CheckCheck, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWindow = ({ contact, messages, onSendMessage }) => {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (inputText.trim() === '') return;
        onSendMessage(inputText);
        setInputText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative">
            {/* Premium Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={contact.id}
                    >
                        <img src={contact.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt={contact.name} />
                    </motion.div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg leading-none mb-1">{contact.name}</h2>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${contact.online ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                            <span className="text-xs font-semibold text-slate-400">
                                {contact.online ? 'Online agora' : `Visto por último ${contact.time}`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all">
                        <Phone size={20} />
                    </button>
                    <button className="p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all">
                        <Video size={20} />
                    </button>
                    <div className="w-[1px] h-6 bg-slate-100 mx-2"></div>
                    <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">
                        <Search size={20} />
                    </button>
                    <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-chat-pattern relative">
                <AnimatePresence mode="popLayout">
                    {messages.map((msg, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            key={msg.id}
                            className={`flex w-full ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`
                max-w-[70%] px-4 py-3 relative group
                ${msg.isMe ? 'chat-bubble-out' : 'chat-bubble-in'}
              `}>
                                {!msg.isMe && contact.type === 'group' && (
                                    <p className="text-[11px] font-bold text-primary-600 mb-1 leading-none">{msg.sender}</p>
                                )}

                                <p className="text-sm leading-relaxed font-medium">
                                    {msg.text}
                                </p>

                                <div className={`mt-1 flex items-center justify-end gap-1.5 opacity-60`}>
                                    <span className="text-[10px] font-bold">
                                        {msg.time}
                                    </span>
                                    {msg.isMe && (
                                        <CheckCheck size={14} className="text-primary-100" />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Modern Footer Input */}
            <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-transparent focus-within:border-primary-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary-50/50 transition-all">
                    <button className="p-2 text-slate-400 hover:text-primary-600 rounded-xl transition-colors">
                        <Smile size={22} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-primary-600 rounded-xl transition-colors">
                        <Paperclip size={22} />
                    </button>

                    <input
                        type="text"
                        placeholder="Escreva sua mensagem..."
                        className="flex-1 bg-transparent py-3 outline-none text-slate-600 font-medium placeholder:text-slate-400"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <AnimatePresence mode="wait">
                        {inputText ? (
                            <motion.button
                                key="send"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                onClick={handleSend}
                                className="bg-primary-600 text-white p-3 rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Send size={20} />
                            </motion.button>
                        ) : (
                            <motion.button
                                key="mic"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="p-3 text-slate-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all"
                            >
                                <Mic size={22} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
