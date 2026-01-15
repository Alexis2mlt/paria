import React, { useState, useEffect, useRef } from 'react';

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Bonjour ! Je suis votre assistant IA spécialisé dans les paris sportifs. Je connais tous les détails du match. Posez-moi vos questions ! 🎯",
            sender: 'ai'
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: text,
            sender: 'user'
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue("");
        
        // Mock AI response for now (to be replaced with Ollama later)
        setTimeout(() => {
             const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "Désolé, je ne suis pas encore connecté à mon cerveau (Ollama). Mais j'ai bien reçu : " + text,
                sender: 'ai'
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div className="relative w-full max-w-md h-full bg-[#0B1120] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0B1120]/95 backdrop-blur absolute top-0 w-full z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-white font-bold font-spartan">Assistant IA</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-slate-400 text-xs font-medium">En ligne</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 pt-28 pb-32 space-y-6">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${
                                    msg.sender === 'ai' 
                                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                                        : 'bg-paria/20 text-paria border border-paria/30'
                                }`}>
                                     {msg.sender === 'ai' ? (
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                     ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                     )}
                                </div>

                                {/* Bubble */}
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                    msg.sender === 'ai'
                                        ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                                        : 'bg-paria text-slate-950 font-medium rounded-tr-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 w-full p-6 bg-[#0B1120] border-t border-slate-800">
                    {/* Suggestion Chips */}
                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                         <button 
                            onClick={() => handleSendMessage("Fais moi un prono")}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-paria text-slate-300 hover:text-paria px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap"
                        >
                            🎯 Fais moi un prono
                         </button>
                    </div>

                    <div className="relative">
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                            placeholder="Posez votre question..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-paria transition-colors"
                        />
                        <button 
                            onClick={() => handleSendMessage(inputValue)}
                            className="absolute right-2 top-2 bottom-2 w-10 bg-paria hover:bg-white text-slate-950 rounded-lg flex items-center justify-center transition-all"
                        >
                            <svg className="w-5 h-5 transform -rotate-45 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatDrawer;
