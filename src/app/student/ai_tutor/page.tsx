'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import {
    Send,
    Bot,
    User,
    Sparkles,
    History,
    FileText,
    Plus,
    Copy,
    Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Using the requested "Lumina" branding, but pointing to a real model
const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export default function AITutorPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // AI Engine State
    const engine = useRef<any>(null);
    const [isEngineReady, setIsEngineReady] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);

    // Context State
    const [userContext, setUserContext] = useState<string>('');

    // Session Management
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [sessions, setSessions] = useState<Record<string, any[]>>({});

    // Initialize WebLLM Engine (Restored)
    useEffect(() => {
        const initEngine = async () => {
            if (engine.current) return;

            try {
                setLoadingProgress('Initializing Lumina AI (WebLLM)...');
                engine.current = await CreateMLCEngine(
                    SELECTED_MODEL,
                    {
                        initProgressCallback: (report) => {
                            setLoadingProgress(report.text);
                            const match = report.text.match(/(\d+)%/);
                            if (match) {
                                setProgressPercent(parseInt(match[1]));
                            }
                        },
                    }
                );
                setIsEngineReady(true);
                setLoadingProgress('');
            } catch (err) {
                console.error("Failed to load WebLLM:", err);
                setLoadingProgress('Failed to load AI. Please check your connection and reload.');
            }
        };

        const loadContext = async () => {
            try {
                const user = await api.getCurrentUser();
                const dashboard = await api.getDashboardData('student');

                let context = `Current User: ${user?.name || 'Student'}\n`;
                if (dashboard.enrolledCourses && dashboard.enrolledCourses.length > 0) {
                    context += "Enrolled Courses:\n";
                    dashboard.enrolledCourses.forEach((c: any) => {
                        context += `- ${c.title} (Progress: ${c.progress}%)\n`;
                    });
                } else {
                    context += "No courses enrolled yet.\n";
                }

                if (dashboard.achievements && dashboard.achievements.length > 0) {
                    context += "Achievements: " + dashboard.achievements.map((a: any) => a.title).join(", ") + "\n";
                }

                setUserContext(context);
            } catch (e) {
                console.error("Failed to load user context", e);
            }
        };

        initEngine();
        loadContext();
    }, []);

    // Initial load history
    useEffect(() => {
        let sessionId = sessionStorage.getItem('lumina_chat_session_id');
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(7);
            sessionStorage.setItem('lumina_chat_session_id', sessionId);
        }
        setCurrentSessionId(sessionId);

        const loadData = async () => {
            const history = await api.getChatHistory();
            if (history) {
                const grouped: Record<string, any[]> = {};
                history.forEach((msg: any) => {
                    const sId = msg.sessionId || 'legacy';
                    if (!grouped[sId]) grouped[sId] = [];
                    grouped[sId].push(msg);
                });
                setSessions(grouped);

                if (grouped[sessionId]) {
                    setMessages(grouped[sessionId]);
                } else {
                    setMessages([]);
                }
            }
        };
        loadData();
    }, []);

    const switchSession = (sessionId: string) => {
        setCurrentSessionId(sessionId);
        sessionStorage.setItem('lumina_chat_session_id', sessionId);
        setMessages(sessions[sessionId] || []);
    };

    const startNewChat = () => {
        const newSessionId = Math.random().toString(36).substring(7);
        setCurrentSessionId(newSessionId);
        sessionStorage.setItem('lumina_chat_session_id', newSessionId);
        setMessages([]);
    };

    const updateSessionsState = (sessionId: string, newMsg: any) => {
        setSessions(prev => {
            const sessionMsgs = prev[sessionId] ? [...prev[sessionId], newMsg] : [newMsg];
            return { ...prev, [sessionId]: sessionMsgs };
        });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, loadingProgress]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        if (!isEngineReady) {
            alert("Lumina AI is still loading. Please wait a moment.");
            return;
        }

        const userMsg = { sender: 'me', text: input, timestamp: new Date(), sessionId: currentSessionId };

        setMessages(prev => [...prev, userMsg]);
        updateSessionsState(currentSessionId, userMsg);

        setInput('');
        setIsLoading(true);

        api.saveChatMessage({ sender: 'me', text: userMsg.text, sessionId: currentSessionId });

        try {
            const systemMessage = `You are Lumina, an AI Tutor for students. Be helpful, concise, and educational.\n\nContext:\n${userContext}`;

            const contextMessages = [
                { role: 'system', content: systemMessage },
                ...messages.slice(-10).map(m => ({
                    role: m.sender === 'me' ? 'user' : 'assistant',
                    content: m.text
                })),
                { role: 'user', content: userMsg.text }
            ];

            const reply = await engine.current.chat.completions.create({
                messages: contextMessages
            });
            const aiText = reply.choices[0].message.content;

            const aiMsg = { sender: 'AI Tutor', text: aiText, timestamp: new Date(), sessionId: currentSessionId };
            setMessages(prev => [...prev, aiMsg]);
            updateSessionsState(currentSessionId, aiMsg);

            await api.saveChatMessage({ sender: 'AI Tutor', text: aiText, sessionId: currentSessionId });

            // Log interaction for Admin Audit
            await api.logAIInteraction(userMsg.text, aiMsg.text);

        } catch (error) {
            console.error('AI Error:', error);
            const errorMsg = { sender: 'AI Tutor', text: "I'm having trouble thinking right now.", timestamp: new Date() };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const addToNotes = async (text: string) => {
        await api.saveNote(text);
        alert("Saved to notes!");
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
                    <button suppressHydrationWarning onClick={startNewChat} className="p-1.5 hover:bg-white/10 rounded-lg text-lumina-primary transition-colors" title="New Chat">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Previous Chats</p>
                        {Object.entries(sessions).reverse().map(([sId, msgs]) => {
                            if (msgs.length === 0) return null;
                            const firstMsg = msgs[0];
                            const lastMsg = msgs[msgs.length - 1];
                            const isActive = sId === currentSessionId;
                            return (
                                <div
                                    key={sId}
                                    onClick={() => switchSession(sId)}
                                    className={`p-3 rounded-xl cursor-pointer border transition-all group ${isActive ? 'bg-white/10 border-lumina-primary/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <p className="text-sm text-gray-300 line-clamp-1 font-medium">{firstMsg.text}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-gray-500">{new Date(lastMsg.timestamp).toLocaleDateString()}</span>
                                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{msgs.length} msgs</span>
                                    </div>
                                </div>
                            );
                        })}
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
                            <h1 className="text-white font-bold">Lumina AI Tutor</h1>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full animate-pulse ${isLoading ? 'bg-amber-500' : isEngineReady ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-xs text-gray-400">
                                    {isLoading ? 'Thinking...' : isEngineReady ? 'Online (WebLLM)' : 'Loading Model...'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {!isEngineReady && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4 text-center">
                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
                            <p className="text-blue-200 font-semibold text-sm mb-1">{loadingProgress || "Initializing..."}</p>
                            <p className="text-blue-300/60 text-xs">First load will download model data to your browser.</p>
                            {progressPercent > 0 && (
                                <div className="mt-2 h-1.5 w-full bg-blue-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                            )}
                        </div>
                    )}

                    {messages.length === 0 && isEngineReady ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <Sparkles className="w-16 h-16 text-lumina-primary mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">How can I help you learn?</h3>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-4 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'me' ? 'bg-gray-700' : 'bg-lumina-primary/20 text-lumina-primary'}`}>
                                    {msg.sender === 'me' ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    <div className={`flex items-center gap-2 mb-1 px-1 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-xs font-semibold text-gray-300">{msg.sender === 'me' ? 'You' : 'Lumina'}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl relative group ${msg.sender === 'me' ? 'bg-lumina-primary text-black rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'}`}>
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                        {msg.sender !== 'me' && (
                                            <div className="absolute -bottom-8 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => addToNotes(msg.text)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white hover:border-white/30 transition-all">
                                                    <FileText className="w-3 h-3" /> Add to Notes
                                                </button>
                                                <button onClick={() => navigator.clipboard.writeText(msg.text)} className="p-1.5 bg-gray-800 border border-white/10 rounded-full text-gray-400 hover:text-white hover:border-white/30 transition-all">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/20 border-t border-white/10">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            suppressHydrationWarning
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isEngineReady ? "Start a conversation..." : "Initializing AI..."}
                            disabled={!isEngineReady}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white placeholder:text-gray-500 focus:border-lumina-primary focus:bg-white/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading || !isEngineReady}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-lumina-primary text-black rounded-lg hover:bg-lumina-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-gray-500 mt-2">
                        Running Lumina AI directly in your browser (WebLLM).
                    </p>
                </div>
            </div>
        </div>
    );
}
