'use client';

import { useState, useRef, useEffect } from 'react';
import { processMessage, ChatResponse } from '@/lib/ai-tutor/router';
import { clearHistory } from '@/lib/ai-tutor/cache';

interface Message {
    role: 'user' | 'model';
    text: string;
    source?: 'cache' | 'api' | 'rule';
}

export default function AITutorTestPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState<'lumina' | 'gemini' | 'local'>('lumina');
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Logic:
            // 'local' -> Adds [LOCAL]
            // 'gemini' -> Standard (force cloud implies standard for now)
            // 'lumina' -> Standard (Auto)
            const query = provider === 'local' ? `[LOCAL] ${userMsg.text}` : userMsg.text;
            const response = await processMessage(query);
            setMessages(prev => [...prev, { role: 'model', text: response.text, source: response.source }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: "Error procesing request.", source: 'rule' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        await clearHistory();
        setMessages([]);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">

                {/* Chat Area */}
                <div className="col-span-2 bg-neutral-800 rounded-xl border border-neutral-700 flex flex-col h-[80vh] overflow-hidden">
                    <div className="p-4 border-b border-neutral-700 bg-neutral-800 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                Lumina AI Tutor (Test Mode)
                            </h1>
                            <div className="flex gap-2 mt-2">
                                <button
                                    suppressHydrationWarning
                                    onClick={() => setProvider('lumina')}
                                    className={`px-3 py-1 text-xs rounded-full transition-colors ${provider === 'lumina' ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-lg shadow-green-900/20' : 'bg-neutral-700 text-neutral-400 hover:text-neutral-200'}`}
                                >
                                    ✨ Lumina Algo
                                </button>
                                <button
                                    suppressHydrationWarning
                                    onClick={() => setProvider('gemini')}
                                    className={`px-3 py-1 text-xs rounded-full transition-colors ${provider === 'gemini' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-400 hover:text-neutral-200'}`}
                                >
                                    Gemini Cloud
                                </button>
                                <button
                                    suppressHydrationWarning
                                    onClick={() => setProvider('local')}
                                    className={`px-3 py-1 text-xs rounded-full transition-colors ${provider === 'local' ? 'bg-purple-600 text-white' : 'bg-neutral-700 text-neutral-400 hover:text-neutral-200'}`}
                                >
                                    Local LLM
                                </button>
                            </div>
                        </div>
                        <button onClick={handleClear} suppressHydrationWarning className="text-xs text-neutral-400 hover:text-white underline">
                            Reset Memory
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-neutral-500 mt-20">
                                <p>Ask a question to start.</p>
                                <p className="text-sm mt-2">Try: "What is Newton's First Law?"</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-neutral-700 text-neutral-200 rounded-bl-none'
                                    }`}>
                                    <p>{m.text}</p>
                                    {m.source && (
                                        <div className="mt-1 text-[10px] uppercase tracking-wider opacity-50 flex items-center gap-1">
                                            <span className={`w-2 h-2 rounded-full ${m.source === 'cache' ? 'bg-green-400' :
                                                m.source === 'api' ? 'bg-purple-400' : 'bg-yellow-400'
                                                }`}></span>
                                            {m.source}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-neutral-700 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 bg-neutral-800 border-t border-neutral-700">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything..."
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-full py-3 px-5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Panel */}
                <div className="col-span-1 bg-neutral-800 rounded-xl border border-neutral-700 p-6 h-[80vh] overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-4 text-neutral-300">System Status</h2>

                    <div className="space-y-6">
                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                            <h3 className="text-sm font-medium text-neutral-400 mb-2">Architecture</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Local Cache (IndexedDB)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Fast-Path Router
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Gemini Flash API
                                </li>
                            </ul>
                        </div>

                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                            <h3 className="text-sm font-medium text-neutral-400 mb-2">How to Test</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-300">
                                <li>Ask a question (e.g., "Define Mitosis")</li>
                                <li>Note the <span className="text-purple-400 font-bold">API</span> source tag.</li>
                                <li>Ask the <strong>same question</strong> again.</li>
                                <li>Note the <span className="text-green-400 font-bold">CACHE</span> source tag (Instant).</li>
                                <li>Ask "Hi there" to see <span className="text-yellow-400 font-bold">RULE</span> based response.</li>
                            </ol>
                        </div>

                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700/50">
                            <h3 className="text-sm font-medium text-neutral-400 mb-2">Metrics</h3>
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="bg-neutral-800 p-2 rounded">
                                    <div className="text-2xl font-bold text-green-400">{messages.filter(m => m.source === 'cache').length}</div>
                                    <div className="text-[10px] text-neutral-500">Cache Hits</div>
                                </div>
                                <div className="bg-neutral-800 p-2 rounded">
                                    <div className="text-2xl font-bold text-purple-400">{messages.filter(m => m.source === 'api').length}</div>
                                    <div className="text-[10px] text-neutral-500">API Calls</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
