'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import {
    Send,
    Bot,
    User,
    Sparkles,
    History,
    FileText,
    Plus,
    MoreVertical,
    Trash2,
    Copy,
    Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AITutorPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            const history = await api.getChatHistory();
            setMessages(history || []);
        };
        loadData();
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg = { sender: 'me', text: input, timestamp: new Date() };

        // Optimistic update
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Save to DB
        await api.saveChatMessage({ sender: 'me', text: userMsg.text });

        try {
            // Prepare messages for context
            const contextMessages = messages.slice(-10).map(m => ({
                role: m.sender === 'me' ? 'user' : 'assistant',
                content: m.text
            }));
            contextMessages.push({ role: 'user', content: userMsg.text });

            // Call Server Action
            const response = await api.chatWithAI(contextMessages);

            if (response.success) {
                const aiText = response.message;
                const aiMsg = { sender: 'AI Tutor', text: aiText, timestamp: new Date() };
                setMessages(prev => [...prev, aiMsg]);
                // Save AI response to DB
                await api.saveChatMessage({ sender: 'AI Tutor', text: aiText });
            } else {
                console.error('AI Error:', response.error);
                const errorMsg = {
                    sender: 'AI Tutor',
                    text: response.error === 'AI API Key is not configured on the server.'
                        ? "System Configuration Error: AI API Key is missing. Please contact the administrator."
                        : "I'm having trouble connecting right now. Please try again later.",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMsg]);
            }

        } catch (error) {
            console.error('AI Error:', error);
            const errorMsg = { sender: 'AI Tutor', text: "Error connecting to AI service.", timestamp: new Date() };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const addToNotes = async (text: string) => {
        await api.saveNote(text);
        alert("Saved to notes!"); // Replace with toast in real app
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6">
            {/* Sidebar - History */}
            <div className="w-80 glass-card flex flex-col hidden lg:flex">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <History className="w-5 h-5 text-lumina-primary" />
                        Chat History
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Group by Date (Mock grouping for now, just list) */}
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Previous Chats</p>
                        {messages.filter(m => m.sender === 'me').slice(-10).reverse().map((msg, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 transition-colors group">
                                <p className="text-sm text-gray-300 line-clamp-2">{msg.text}</p>
                                <span className="text-[10px] text-gray-500 mt-2 block">{new Date(msg.timestamp).toLocaleDateString()}</span>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <p className="text-sm text-gray-500 italic text-center py-4">No history yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 glass-card flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lumina-primary to-purple-600 flex items-center justify-center shadow-lg shadow-lumina-primary/20">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold">AI Tutor</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs text-gray-400">Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <Sparkles className="w-16 h-16 text-lumina-primary mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">How can I help you today?</h3>
                            <p className="text-gray-400 max-w-md">I can explain complex topics, create quizzes, or check your specific questions. Just type below!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-4 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'me' ? 'bg-gray-700' : 'bg-lumina-primary/20 text-lumina-primary'}`}>
                                    {msg.sender === 'me' ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    <div className={`flex items-center gap-2 mb-1 px-1 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-xs font-semibold text-gray-300">{msg.sender === 'me' ? 'You' : 'AI Tutor'}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl relative group ${msg.sender === 'me'
                                        ? 'bg-lumina-primary text-black rounded-tr-none'
                                        : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                                        }`}>
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>

                                        {/* Actions for Assistant Messages */}
                                        {msg.sender !== 'me' && (
                                            <div className="absolute -bottom-8 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => addToNotes(msg.text)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white hover:border-white/30 transition-all"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    Add to Notes
                                                </button>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(msg.text)}
                                                    className="p-1.5 bg-gray-800 border border-white/10 rounded-full text-gray-400 hover:text-white hover:border-white/30 transition-all"
                                                    title="Copy"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-lumina-primary/20 flex items-center justify-center shrink-0 text-lumina-primary">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/20 border-t border-white/10">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white placeholder:text-gray-500 focus:border-lumina-primary focus:bg-white/10 outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-lumina-primary text-black rounded-lg hover:bg-lumina-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-gray-500 mt-2">
                        AI Tutor can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
