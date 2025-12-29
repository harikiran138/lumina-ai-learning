'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
    Cloud,
    SidebarClose,
    SidebarOpen,
    Menu
} from 'lucide-react';
import { A2UIRenderer } from '@/components/advanced/A2UIRenderer';

// Switched to q4f16_1 for better memory stability
const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export default function AITutorPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // WebLLM State
    const [engine, setEngine] = useState<MLCEngine | null>(null);
    const [progress, setProgress] = useState<string>('');
    const [isModelLoading, setIsModelLoading] = useState(false);

    // AI Provider State - Default to 'gemini' for stability
    const [provider, setProvider] = useState<'lumina' | 'gemini' | 'local' | 'chrome' | 'ollama'>('gemini');

    // Context State
    const [userContext, setUserContext] = useState<string>('');
    const [studentStats, setStudentStats] = useState({
        attendance: [90, 85, 92, 88, 95], // Last 5 weeks
        moduleScores: { "Python": 85, "React": 70, "SQL": 92, "Data Structures": 60 } as Record<string, number>,
        weeklyActivity: [2, 4, 1, 3, 5, 2, 0], // Hours per day (Mon-Sun)
        averageScore: 78
    });

    // Session Management
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [sessions, setSessions] = useState<Record<string, any[]>>({});

    // UI Features
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
    
    // Topic & Quiz Tracking
    const currentTopicRef = useRef<string>("General");
    const usedQuestionsRef = useRef<Set<string>>(new Set());
    
    const CAPABILITY_TAGS = [
        "Create Quiz on React",
        "Make Flashcards for SQL",
        "Draw Timeline of AI History",
        "Compare TCP vs UDP",
        "Show my Progress Chart", 
        "Code Snippet for API Fetch"
    ];

    const generateContext = useCallback((user: any, dashboard: any, profile: any, notes: any, allCourses: any, stats: any) => {
        let context = `Current User: ${user?.name || 'Student'}\n`;

        // Inject Data for Visualization
        context += `\n[REAL-TIME STUDENT DATA FOR VISUALIZATION]\n`;
        context += `Module Scores: ${JSON.stringify(stats.moduleScores)}\n`;
        context += `Weekly Activity (Hours): ${JSON.stringify(stats.weeklyActivity)}\n`;
        context += `Attendance Trends: ${JSON.stringify(stats.attendance)}\n`;
        context += `Average Score: ${stats.averageScore}%\n`;
        context += `[INSTRUCTION: If asked about progress/stats, use the 'Chart' component to visualize this data.]\n`;

        if (allCourses.length > 0) {
            context += "\nOfficial Course Catalog (Only recommend or discuss courses from this list):\n";
            allCourses.forEach((c: any) => {
                context += `- ${c.name} (${c.code}): ${c.description}\n`;
            });
        }

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
        }

        if (notes && notes.length > 0) {
            context += "\nUser Notes (Knowledge Base):\n";
            notes.slice(0, 3).forEach((n: any) => {
                context += `- [${new Date(n.createdAt).toLocaleDateString()}] ${n.content.substring(0, 100)}...\n`;
            });
        }

        return context.substring(0, 1500); // Increased limit slightly
    }, []);

    // Load user context initial
    useEffect(() => {
        const loadContext = async () => {
            try {
                const [user, dashboard, profile, notes] = await Promise.all([
                    api.getCurrentUser(),
                    api.getDashboardData('student'),
                    api.getStudentProfile(),
                    api.getNotes()
                ]);

                let allCourses = [];
                try {
                    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
                    const res = await fetch(`${apiBase}/api/courses/list`, { 
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        cache: 'no-store'
                    });
                    if (res.ok) allCourses = await res.json();
                } catch (ce) {}

                const context = generateContext(user, dashboard, profile, notes, allCourses, studentStats);
                setUserContext(context);
            } catch (e) {
                console.error("Failed to load user context", e);
            }
        };
        loadContext();
    }, [generateContext]);

    // Update context when stats change
    useEffect(() => {
        if (userContext) {
            setUserContext(prev => {
                const statsBlock = `\n[REAL-TIME STUDENT DATA FOR VISUALIZATION]\nModule Scores: ${JSON.stringify(studentStats.moduleScores)}\nWeekly Activity (Hours): ${JSON.stringify(studentStats.weeklyActivity)}\nAttendance Trends: ${JSON.stringify(studentStats.attendance)}\nAverage Score: ${studentStats.averageScore}%\n`;
                const startMarker = `\n[REAL-TIME STUDENT DATA FOR VISUALIZATION]\n`;
                const endMarker = `[INSTRUCTION: If asked about progress/stats, use the 'Chart' component to visualize this data.]\n`;
                
                if (prev.includes(startMarker) && prev.includes(endMarker)) {
                    const parts = prev.split(startMarker);
                    const afterParts = parts[1].split(endMarker);
                    if (afterParts.length > 1) {
                        return parts[0] + startMarker + statsBlock + endMarker + afterParts[1];
                    }
                }
                return prev;
            });
        }
    }, [studentStats]);

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
        if (window.innerWidth < 1024) setIsSidebarOpen(false); // Close sidebar on mobile
    };

    const startNewChat = () => {
        const newSessionId = Math.random().toString(36).substring(7);
        setCurrentSessionId(newSessionId);
        sessionStorage.setItem('lumina_chat_session_id', newSessionId);
        setMessages([]);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
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

    // Initialize WebLLM
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

    // A2UI System Prompt - STRICT
    const A2UI_SYSTEM_PROMPT = `
You are Lumina, a helpful AI assistant.
You have access to a special UI rendering protocol called A2UI.
Instead of just text, you can render rich components by outputting a code block starting with \`\`\`a2ui.

A2UI COMPONENT SCHEMAS (Strict JSON):

1. Quiz
\`\`\`a2ui
{ "component": "Quiz", "props": { "question": "Question text?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0, "explanation": "Why correct...", "topic": "Topic Name", "difficulty": "easy" } }
\`\`\`
CONSTRAINT: Exactly 4 options. 'difficulty' must be "easy", "medium", or "hard".

2. Flashcard
\`\`\`a2ui
{ "component": "Flashcard", "props": { "front": "Front text", "back": "Back text", "subject": "Subject Area" } }
\`\`\`
CONSTRAINT: Use a JSON Array \`[{...}, {...}]\` for multiple cards.

3. Chart
\`\`\`a2ui
{ "component": "Chart", "props": { "type": "bar", "title": "Chart Title", "labels": ["Lab1", "Lab2"], "data": [10, 20], "datasetLabel": "Metric Name", "colors": ["#ff0000"] } }
\`\`\`
Valid types: "bar", "line", "pie", "doughnut".

4. Timeline
\`\`\`a2ui
{ "component": "Timeline", "props": { "title": "Timeline Title", "events": [{ "date": "1990", "title": "Event", "description": "Details..." }] } }
\`\`\`

5. ComparisonTable
\`\`\`a2ui
{ "component": "ComparisonTable", "props": { "title": "Comparison Title", "headers": ["Feature", "Item A", "Item B"], "rows": [{ "feature": "Speed", "values": ["Fast", "Slow"] }] } }
\`\`\`

6. CodeBlock
\`\`\`a2ui
{ "component": "CodeBlock", "props": { "code": "print('hi')", "language": "python", "filename": "script.py", "explanation": "Code explanation..." } }
\`\`\`

7. Mermaid
\`\`\`a2ui
{ "component": "Mermaid", "props": { "chart": "graph TD; A-->B;", "title": "Diagram Title" } }
\`\`\`

IMPORTANT:
- ONLY use the components listed above.
- If you want to create a quiz with multiple questions, output multiple separate \`Quiz\` blocks.
- If no component fits, just use standard Markdown text.
`;

    const getEnhancedContext = (textInput: string) => {
        let enhanced = A2UI_SYSTEM_PROMPT;
        const lower = textInput.toLowerCase();
        
        if (lower.includes('quiz')) {
            enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Quiz' component. ONE question only.]`;
        } else if (lower.includes('flashcard')) {
            enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Flashcard' component.]`;
        } else if (lower.includes('compare') || lower.includes('vs')) {
            enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'ComparisonTable' component.]`;
        } else if (lower.includes('timeline')) {
            enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Timeline' component.]`;
        } else if (lower.includes('chart') || lower.includes('graph')) {
            enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Chart' component.]`;
        } else if (lower.includes('table')) {
            enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Table' component.]`;
        } else if (lower.includes('flow') || lower.includes('diagram')) {
            enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Mermaid' component.]`;
        }
        
        return enhanced;
    };

    const processAIResponse = async (textInput: string, userMsg: any) => {
         try {
            let replyText = "";
            let source = "api";
            const enhancedContext = getEnhancedContext(textInput) + `\n\nUser Context:\n${userContext}`;

            if (provider === 'chrome') {
                 try {
                     const ai = (window as any).ai; 
                     if (!ai) throw new Error("Chrome AI Not Detected");
                     const session = await ai.createTextSession(); 
                     const systemPrompt = `You are Lumina Edge (Chrome Native).\n` + enhancedContext;
                     const response = await session.prompt(systemPrompt + "\n\nUser: " + textInput);
                     replyText = response;
                     source = "chrome-nano";
                     session.destroy();
                 } catch (e) {
                     console.warn("Chrome AI Interaction Failed", e);
                     replyText = "⚠️ **Chrome AI Error**: Failed to generate response. Please try a different provider.";
                     source = "system";
                 }
            } else if (provider === 'ollama') {
                 const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
                 const fullMessage = `[User Context]\n${userContext}\n\n[Message]\n${textInput}\n\n${enhancedContext}`; // Injected prompt

                 try {
                     const res = await fetch(`${apiBase}/api/tutor/chat`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ 
                             message: fullMessage, 
                             user_id: "current-user",
                             session_id: currentSessionId, 
                             provider: 'ollama' 
                         })
                     });
                     
                     if (!res.ok) throw new Error("Backend Connection Failed");
                     const data = await res.json();
                     replyText = data.response;
                     source = 'local-ollama';
                 } catch (e) {
                     console.error("Ollama Error", e);
                     replyText = "⚠️ **Ollama Error**: Could not connect to local server. Make sure `ollama serve` is running.";
                     source = "system";
                 }

            } else if ((provider === 'lumina' || provider === 'local') && engine) {
                const identityPrompt = provider === 'local' 
                    ? `You are Lumina Edge, a private, on-device AI Tutor.` 
                    : `You are Lumina, a helpful AI assistant.`;
                
                const systemPrompt = `${identityPrompt}\n${enhancedContext}`;

                const completion = await engine.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...messages.map(m => ({
                            role: (m.sender === 'me' ? 'user' : 'assistant') as any,
                            content: m.text
                        })),
                        { role: "user", content: textInput }
                    ],
                    temperature: 0.7,
                });
                replyText = completion.choices[0].message.content || "";
                source = "webllm";
            } else {
                // Cloud Router
                const result = await processMessage(textInput, enhancedContext);
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

            // Suggestions
            const newSuggestions: string[] = [];
            const lowerText = replyText.toLowerCase();
            if (lowerText.includes('python')) newSuggestions.push("Quiz me on Python");
            if (lowerText.includes('react') || lowerText.includes('javascript')) newSuggestions.push("Explain React Hooks");
            if (lowerText.includes('database') || lowerText.includes('sql')) newSuggestions.push("Create a SQL Flashcard");
            if (newSuggestions.length > 0) setDynamicSuggestions(newSuggestions);

            setMessages(prev => [...prev, aiMsg]);
            updateSessionsState(currentSessionId, aiMsg);

            await api.saveChatMessage({ sender: 'AI Tutor', text: replyText, sessionId: currentSessionId });
            if (!userMsg.isHidden) {
                await api.logAIInteraction(userMsg.text, aiMsg.text);
            }

        } catch (error) {
            console.error('AI Error:', error);
            const errorMsg = { sender: 'AI Tutor', text: "I'm having trouble thinking right now.", timestamp: new Date() };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessageInternal = useCallback(async (text: string, isHidden: boolean = false) => {
        const userMsg = { sender: 'me', text: text, timestamp: new Date(), sessionId: currentSessionId, isHidden };
        if (!isHidden) setMessages(prev => [...prev, userMsg]);
        updateSessionsState(currentSessionId, userMsg);
        setIsLoading(true);
        await processAIResponse(text, userMsg);
    }, [currentSessionId, userContext, provider, engine]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg = { sender: 'me', text: input, timestamp: new Date(), sessionId: currentSessionId };
        
        // Detect Quiz Topic
        const quizMatch = input.match(/(?:quiz|test|exam) (?:me )?(?:on|about|for) ([\w\s]+)/i);
        if (quizMatch) {
            currentTopicRef.current = quizMatch[1].trim();
            usedQuestionsRef.current.clear();
        }

        setMessages(prev => [...prev, userMsg]);
        updateSessionsState(currentSessionId, userMsg);
        setInput('');
        setIsLoading(true);

        await api.saveChatMessage({ sender: 'me', text: userMsg.text, sessionId: currentSessionId });
        await processAIResponse(input, userMsg);
    };

    const handleAction = useCallback(async (action: string, data: any) => {
        if (action === 'quiz_answer') {
            if (data.question) usedQuestionsRef.current.add(data.question);

            setStudentStats(prev => {
                const matchedTopic = currentTopicRef.current || "General";
                const newScores = { ...prev.moduleScores };
                if (data.isCorrect) {
                     newScores[matchedTopic] = Math.min(100, (newScores[matchedTopic] || 50) + 5);
                } else {
                     newScores[matchedTopic] = Math.max(0, (newScores[matchedTopic] || 50) - 3);
                }
                const scores = Object.values(newScores);
                const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                return { ...prev, moduleScores: newScores, averageScore: avg };
            });

            api.saveQuizResult({
                user_id: "current_student", // In real app, fetch from auth context
                topic: data.topic || currentTopicRef.current || "General",
                score: data.isCorrect ? 100 : 0,
                total_questions: 1,
                correct_count: data.isCorrect ? 1 : 0,
                difficulty: data.difficulty || "medium",
                details: { question: data.question }
            }).catch(console.error);

        } else if (action === 'quiz_next') {
            const usedList = Array.from(usedQuestionsRef.current).slice(-10);
            const avoidContext = usedList.length > 0 ? `\n\n[SYSTEM CONSTRAINT: DO NOT repeat: ${JSON.stringify(usedList)}.]` : "";
            await sendMessageInternal(
                `Generate the next multiple-choice question on ${currentTopicRef.current || 'General'}. Use the 'Quiz' component. ${avoidContext}\n\nSTRICT: Respond ONLY with the A2UI JSON code block. No conversational filler.`, 
                true
            );
        } else if (action === 'quiz_end') {
            await sendMessageInternal("I'm done with the quiz. Show me my updated Progress Chart.", false);
        }
    }, [sendMessageInternal]);

    const addToNotes = async (text: string) => {
        await api.saveNote(text);
        alert("Saved to notes!");
    };

    const getProviderName = (p: string) => {
        if (p === 'gemini') return 'Lumina Pro';
        if (p === 'local') return 'Lumina Edge';
        if (p === 'chrome') return 'Google Edge (Nano)';
        if (p === 'ollama') return 'Local Server (Ollama)';
        return 'Lumina Fast';
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6">
            {/* Sidebar */}
            <div className={`
                ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none'} 
                glass-card flex flex-col transition-all duration-300 ease-in-out absolute lg:relative z-20 h-full bg-[#0a0a0f]/95 backdrop-blur-xl lg:bg-transparent
            `}>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <History className="w-5 h-5 text-lumina-primary" />
                        Chat History
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={startNewChat} className="p-1.5 hover:bg-white/10 rounded-lg text-lumina-primary transition-colors" title="New Chat" aria-label="New Chat">
                            <Plus className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg text-gray-400" aria-label="Close Sidebar">
                            <SidebarClose className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Previous Chats</p>
                        {Object.entries(sessions).reverse().map(([sId, msgs]) => {
                            if (msgs.length === 0) return null;
                            const isActive = sId === currentSessionId;
                            return (
                                <div
                                    key={sId}
                                    onClick={() => switchSession(sId)}
                                    className={`p-3 rounded-xl cursor-pointer border transition-all ${isActive ? 'bg-white/10 border-lumina-primary/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <p className="text-sm text-gray-300 line-clamp-1 font-medium">{msgs[0].text}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-gray-500">{new Date(msgs[msgs.length - 1].timestamp).toLocaleDateString()}</span>
                                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{msgs.length} msgs</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 glass-card flex flex-col relative overflow-hidden min-w-0">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors mr-1"
                            title={isSidebarOpen ? "Maximize Chat" : "Show History"}
                            aria-label="Toggle Sidebar"
                        >
                            {isSidebarOpen ? <SidebarClose className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
                        </button>

                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lumina-primary to-purple-600 flex items-center justify-center shadow-lg shadow-lumina-primary/20">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-sm md:text-base">Lumina AI Tutor</h1>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full animate-pulse ${isLoading ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                                <span className="text-[10px] md:text-xs text-gray-400">
                                    {isLoading ? 'Thinking...' : `Online (${getProviderName(provider)})`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10 overflow-x-auto scrollbar-hide max-w-[50%] md:max-w-none">
                        <button onClick={() => setProvider('lumina')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'lumina' ? 'bg-lumina-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                            <Sparkles className="w-3.5 h-3.5" /> <span className="hidden md:inline">Lumina Fast</span>
                        </button>
                        <button onClick={() => setProvider('gemini')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'gemini' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                            <Cloud className="w-3.5 h-3.5" /> <span className="hidden md:inline">Pro</span>
                        </button>
                        <button onClick={() => setProvider('ollama')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'ollama' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            <Cpu className="w-3.5 h-3.5" /> <span className="hidden md:inline">Ollama</span>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <Sparkles className="w-16 h-16 text-lumina-primary mb-4 animate-pulse" />
                            <h3 className="text-xl font-bold text-white mb-2">How can I help you learn?</h3>
                            <p className="text-sm text-gray-400">Current Mode: {getProviderName(provider)}</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-4 ${msg.sender === 'me' ? 'flex-row-reverse' : ''} ${msg.isHidden ? 'hidden' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'me' ? 'bg-gray-700' : 'bg-lumina-primary/20 text-lumina-primary'}`}>
                                    {msg.sender === 'me' ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%]`}>
                                    <div className={`p-4 rounded-2xl relative group ${msg.sender === 'me' ? 'bg-lumina-primary text-black rounded-tr-none shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'}`}>
                                        <A2UIRenderer content={msg.text} onAction={handleAction} />
                                        
                                        {msg.sender !== 'me' && (
                                            <div className="absolute -bottom-8 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => addToNotes(msg.text)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white transition-colors" aria-label="Add to Notes">
                                                    <FileText className="w-3 h-3" /> Add to Notes
                                                </button>
                                                <button onClick={() => navigator.clipboard.writeText(msg.text)} className="p-1.5 bg-gray-800 border border-white/10 rounded-full text-gray-400 hover:text-white transition-colors" aria-label="Copy to Clipboard">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-600 mt-1 px-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {msg.source && ` • ${msg.source}`}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    
                    {isLoading && (
                        <div className="flex items-start gap-4">
                             <div className="w-8 h-8 rounded-full bg-lumina-primary/20 text-lumina-primary flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-start bg-white/5 rounded-2xl p-4 rounded-tl-none border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-lumina-primary animate-spin" />
                                    <span className="text-sm text-gray-400">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area + Suggestions */}
                <div className="p-4 bg-black/20 border-t border-white/10 flex flex-col gap-3 relative z-10 backdrop-blur-md">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {(dynamicSuggestions.length > 0 ? dynamicSuggestions : CAPABILITY_TAGS).map((s, i) => (
                            <button 
                                key={i} 
                                onClick={() => setInput(s)} 
                                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 hover:border-lumina-primary/50 transition-all shadow-sm active:scale-95"
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Ask me anything about your courses..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white placeholder:text-gray-500 focus:border-lumina-primary focus:bg-white/10 outline-none transition-all focus:shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                            aria-label="Chat Input"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-lumina-primary text-black rounded-lg hover:bg-lumina-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                            aria-label="Send Message"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
