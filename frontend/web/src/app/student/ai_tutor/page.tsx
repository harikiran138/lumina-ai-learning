'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { processMessage } from '@/lib/ai-tutor/router'; // Integrated Router
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm"; // WebLLM
import {
    Send,
    Bot,
    User,
    Sparkles,
    History,
    FileText,
    Plus,
    Copy,
    Loader2,
    Cpu,
    Globe,
    Zap,
    Cloud,
    AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Switched to Llama-3.2-1B (Tiny) to prevent "Device Lost" GPU crashes
// Previous: "Llama-3-8B-Instruct-q4f32_1-MLC" (Too heavy for some GPUs)
const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

export default function AITutorPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // WebLLM State
    const [engine, setEngine] = useState<MLCEngine | null>(null);
    const [progress, setProgress] = useState<string>('');
    const [isModelLoading, setIsModelLoading] = useState(false);

    // AI Provider State
    // 'lumina' = WebLLM (Lumina Fast/Native)
    // 'gemini' = Cloud API (Lumina Pro)
    // 'local' = Python Server (Lumina Edge)
    const [provider, setProvider] = useState<'lumina' | 'gemini' | 'local'>('lumina');

    // Context State
    const [userContext, setUserContext] = useState<string>('');

    // Session Management
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [sessions, setSessions] = useState<Record<string, any[]>>({});

    // Load Context
    useEffect(() => {
        const loadContext = async () => {
            try {
                const user = await api.getCurrentUser();
                const dashboard = await api.getDashboardData('student');
                const profile = await api.getStudentProfile();
                const notes = await api.getNotes();

                // Fetch full course catalog from DB
                let allCourses = [];
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/courses/list`);
                    if (res.ok) {
                        allCourses = await res.json();
                    }
                } catch (ce) {
                    console.error("Failed to fetch course catalog", ce);
                }

                let context = `Current User: ${user?.name || 'Student'}\n`;

                // Add Full Course Catalog to Context
                if (allCourses.length > 0) {
                    context += "\nOfficial Course Catalog (Only recommend or discuss courses from this list):\n";
                    allCourses.forEach((c: any) => {
                        context += `- ${c.name} (${c.code}): ${c.description}\n`;
                    });
                }

                // Personalization Data
                if (profile) {
                    if (profile.bio) context += `\nBio: ${profile.bio}\n`;
                    if (profile.skills && profile.skills.length > 0) context += `Skills: ${profile.skills.join(', ')}\n`;
                    if (profile.preferences) {
                        context += `Learning Style: ${profile.preferences.learningStyle || 'Visual'}\n`;
                        context += `Interests: ${profile.preferences.interests?.join(', ') || 'General'}\n`;
                    }
                }

                if (dashboard.enrolledCourses && dashboard.enrolledCourses.length > 0) {
                    context += "\nEnrolled Courses (User is currently taking):\n";
                    dashboard.enrolledCourses.forEach((c: any) => {
                        context += `- ${c.title} (Progress: ${c.progress}%)\n`;
                    });
                } else {
                    context += "\nNo courses enrolled yet.\n";
                }

                // User Database RAG (Notes)
                if (notes && notes.length > 0) {
                    context += "\nUser Notes (Knowledge Base):\n";
                    // Take last 5 notes to avoid token limit overflow (Naive RAG)
                    notes.slice(0, 5).forEach((n: any) => {
                        context += `- [${new Date(n.createdAt).toLocaleDateString()}] ${n.content}\n`;
                    });
                }


                if (dashboard.achievements && dashboard.achievements.length > 0) {
                    context += "Achievements: " + dashboard.achievements.map((a: any) => a.title).join(", ") + "\n";
                }

                setUserContext(context);
            } catch (e) {
                console.error("Failed to load user context", e);
            }
        };
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
    }, [messages, isLoading]);

    // Initialize WebLLM when 'lumina' or 'local' mode is selected
    useEffect(() => {
        const initWebLLM = async () => {
            if ((provider === 'lumina' || provider === 'local') && !engine && !isModelLoading) {
                setIsModelLoading(true);
                try {
                    const newEngine = await CreateMLCEngine(
                        SELECTED_MODEL,
                        {
                            initProgressCallback: (report) => setProgress(report.text),
                            logLevel: "INFO",
                        }
                    );
                    setEngine(newEngine);
                    setProgress("Ready!");
                } catch (err) {
                    console.error("WebLLM Init Error", err);
                    setProgress("Failed to load model.");
                } finally {
                    setIsModelLoading(false);
                }
            }
        };
        initWebLLM();
    }, [provider, engine, isModelLoading]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg = { sender: 'me', text: input, timestamp: new Date(), sessionId: currentSessionId };

        setMessages(prev => [...prev, userMsg]);
        updateSessionsState(currentSessionId, userMsg);

        setInput('');
        setIsLoading(true);

        api.saveChatMessage({ sender: 'me', text: userMsg.text, sessionId: currentSessionId });

        try {
            let replyText = "";
            let source = "api";

            if ((provider === 'lumina' || provider === 'local') && engine) {
                // Use WebLLM (Lumina Fast OR Lumina Edge)
                let identityPrompt = "You are Lumina, a helpful AI assistant.";

                if (provider === 'local') {
                    identityPrompt = `You are Lumina Edge, a private, on-device AI Tutor.
You run entirely within the user's browser, ensuring maximum privacy.
You have full access to the user's context and should use it to provide personalized answers.`;
                }

                const systemPrompt = `${identityPrompt}
User Context:
${userContext}`;

                const completion = await engine.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...messages.map(m => ({
                            role: (m.sender === 'me' ? 'user' : 'assistant') as "user" | "assistant" | "system",
                            content: m.text
                        })),
                        { role: "user", content: userMsg.text }
                    ],
                    temperature: 0.7,
                });
                replyText = completion.choices[0].message.content || "";
                source = "webllm";
            } else {
                // Use Router (Cloud API)
                let query = userMsg.text;
                // No longer prefixing [LOCAL] since 'local' is handled by WebLLM above

                // Pass userContext to router
                const result = await processMessage(query, userContext);
                replyText = result.text;
                source = result.source;
            }

            const aiMsg = {
                sender: 'AI Tutor',
                text: replyText,
                timestamp: new Date(),
                sessionId: currentSessionId,
                source: source
            };

            setMessages(prev => [...prev, aiMsg]);
            updateSessionsState(currentSessionId, aiMsg);

            await api.saveChatMessage({ sender: 'AI Tutor', text: replyText, sessionId: currentSessionId });
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

    // Helper to get display name
    const getProviderName = (p: string) => {
        if (p === 'gemini') return 'Lumina Pro';
        if (p === 'local') return 'Lumina Edge';
        return 'Lumina Fast';
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
                                <span className={`w-2 h-2 rounded-full animate-pulse ${isLoading ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                                <span className="text-xs text-gray-400">
                                    {isLoading ? 'Thinking...' : `Online (${getProviderName(provider)})`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        <button
                            suppressHydrationWarning
                            onClick={() => setProvider('lumina')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'lumina'
                                ? 'bg-lumina-primary text-black shadow-lg shadow-lumina-primary/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Lumina Fast
                        </button>
                        <button
                            suppressHydrationWarning
                            onClick={() => setProvider('gemini')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'gemini'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Cloud className="w-3.5 h-3.5" />
                            Lumina Pro
                        </button>
                        <button
                            suppressHydrationWarning
                            onClick={() => setProvider('local')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'local'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Cpu className="w-3.5 h-3.5" />
                            Lumina Edge
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <Sparkles className="w-16 h-16 text-lumina-primary mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">How can I help you learn?</h3>
                            <p className="text-sm text-gray-400">Current Mode: {getProviderName(provider)}</p>
                            {(provider === 'lumina' || provider === 'local') && (
                                <p className="text-xs text-lumina-primary mt-2">
                                    {isModelLoading ? `Initializing Lumina Native AI (LLama 3.2 1B)... ${progress}` : "Lumina Native AI Ready"}
                                </p>
                            )}
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
                            placeholder="Start a conversation..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white placeholder:text-gray-500 focus:border-lumina-primary focus:bg-white/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        {provider === 'lumina' ? 'Running locally in-browser via WebLLM.' :
                            provider === 'local' ? 'Running on Lumina Edge (Offline capable, Llama 3.2 1B).' :
                                'Running via Lumina Cloud Intelligence.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
