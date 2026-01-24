import React from 'react';
import { Search, MoreVertical, Plus, MessageSquare, Settings, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ contacts, onSelect, activeId }) => {
    return (
        <div className="w-[400px] h-full flex flex-col bg-white border-r border-slate-100 transition-sidebar shadow-sm z-20">
            {/* Header Profile Area */}
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop"
                            className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-white"
                            alt="Me"
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">Seu Perfil</h2>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">ONLINE</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                        <Plus size={20} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-5 mb-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar conversas..."
                        className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50/50 outline-none text-sm transition-all text-slate-600"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide">
                {['Tudo', 'Grupos', 'Não lidas', 'Arquivados'].map((tab, i) => (
                    <button
                        key={tab}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${i === 0
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
                <AnimatePresence>
                    {contacts.map((contact) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={contact.id}
                            onClick={() => onSelect(contact.id)}
                            className={`
                group relative flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300
                ${activeId === contact.id
                                    ? 'bg-slate-50 border-white shadow-sm'
                                    : 'hover:bg-slate-50/50'
                                }
              `}
                        >
                            {activeId === contact.id && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute left-0 w-1 h-10 bg-primary-600 rounded-r-full"
                                />
                            )}

                            <div className="relative flex-shrink-0">
                                <img
                                    src={contact.avatar}
                                    className={`w-14 h-14 rounded-2xl object-cover transition-transform duration-300 ${activeId === contact.id ? 'scale-110 shadow-lg' : 'group-hover:scale-105'}`}
                                    alt={contact.name}
                                />
                                {contact.online && (
                                    <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                                )}
                            </div>

                            <div className="ml-4 flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className={`font-bold transition-colors ${activeId === contact.id ? 'text-primary-600' : 'text-slate-800'}`}>
                                        {contact.name}
                                    </h3>
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
                                        {contact.time}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-sm truncate ${contact.unread > 0 ? 'text-slate-800 font-semibold' : 'text-slate-400 font-medium'}`}>
                                        {contact.lastMessage}
                                    </p>
                                    {contact.unread > 0 && (
                                        <span className="ml-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md animate-pulse">
                                            {contact.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Sidebar;
