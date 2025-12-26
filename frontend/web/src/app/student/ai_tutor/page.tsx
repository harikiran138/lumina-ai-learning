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
    AlertTriangle,
    ChevronRight,
    SidebarClose,
    SidebarOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { A2UIRenderer } from '@/components/advanced/A2UIRenderer';

// Switched to Llama-3.2-1B (Tiny) to prevent "Device Lost" GPU crashes
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
    const [provider, setProvider] = useState<'lumina' | 'gemini' | 'local' | 'chrome' | 'ollama'>('lumina');

    // Context State
    const [userContext, setUserContext] = useState<string>('');

    // Session Management
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [sessions, setSessions] = useState<Record<string, any[]>>({});

    // UI Features
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
    
    // Capability Tags (Action-oriented)
    const CAPABILITY_TAGS = [
        "Create Quiz on React",
        "Make Flashcards for SQL",
        "Draw Timeline of AI History",
        "Compare TCP vs UDP",
        "Show my Progress Chart", 
        "Code Snippet for API Fetch"
    ];

    // Load Context & Fake Data Injection
    useEffect(() => {
        const loadContext = async () => {
            try {
                const user = await api.getCurrentUser();
                const dashboard = await api.getDashboardData('student');
                const profile = await api.getStudentProfile();
                const notes = await api.getNotes();

                // Mock Real-time stats (In production, fetch from analytics API)
                const studentStats = {
                   attendance: [90, 85, 92, 88, 95], // Last 5 weeks
                   moduleScores: { "Python": 85, "React": 70, "SQL": 92, "Data Structures": 60 },
                   weeklyActivity: [2, 4, 1, 3, 5, 2, 0], // Hours per day (Mon-Sun)
                   averageScore: 78
                };

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

                // Inject Data for Visualization
                context += `\n[REAL-TIME STUDENT DATA FOR VISUALIZATION]\n`;
                context += `Module Scores: ${JSON.stringify(studentStats.moduleScores)}\n`;
                context += `Weekly Activity (Hours): ${JSON.stringify(studentStats.weeklyActivity)}\n`;
                context += `Attendance Trends: ${JSON.stringify(studentStats.attendance)}\n`;
                context += `Average Score: ${studentStats.averageScore}%\n`;
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
                } else {
                    context += "\nNo courses enrolled yet.\n";
                }

                if (notes && notes.length > 0) {
                    context += "\nUser Notes (Knowledge Base):\n";
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

    // Auto-send function (Internal)
    const sendMessageInternal = async (text: string, isHidden: boolean = false) => {
        const userMsg = { sender: 'me', text: text, timestamp: new Date(), sessionId: currentSessionId, isHidden };
        // If not hidden, show in UI
        if (!isHidden) {
             setMessages(prev => [...prev, userMsg]);
        }
        updateSessionsState(currentSessionId, userMsg);
        setIsLoading(true);

        // ... Reuse core logic or call handleSendMessage with fake event 
        // For simplicity, we just call the core API/Logic here since handleSendMessage is tied to UI state 'input'
        
        try {
            await processAIResponse(text, userMsg);
        } catch (e) {
            console.error(e);
            setIsLoading(false);
        }
    };

    // Core AI Logic extracted
    const processAIResponse = async (textInput: string, userMsg: any) => {
         try {
            let replyText = "";
            let source = "api";

            // A2UI System Prompt
            const a2uiPrompt = `You are Lumina, a helpful AI assistant.
You have access to a special UI rendering protocol called A2UI.
Instead of just text, you can render rich components by outputting a code block starting with \`\`\`a2ui.

Supported Components:
1. Quiz:
\`\`\`a2ui
{ "component": "Quiz", "props": { "question": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0, "explanation": "..." } }
\`\`\`
CONSTRAINT: For 'Quiz', provide EXACTLY 4 options. Never more, never less.

2. Flashcard:
\`\`\`a2ui
{ "component": "Flashcard", "props": { "front": "Term", "back": "Definition" } }
\`\`\`

3. CourseCard:
\`\`\`a2ui
{ "component": "CourseCard", "props": { "title": "...", "code": "...", "description": "..." } }
\`\`\`

4. YoutubeVideo:
\`\`\`a2ui
{ "component": "YoutubeVideo", "props": { "videoId": "...", "title": "..." } }
\`\`\`

5. CodeBlock (Use this for code snippets):
\`\`\`a2ui
{ "component": "CodeBlock", "props": { "code": "print('hello')", "language": "python", "filename": "hello.py" } }
\`\`\`

6. Timeline (Use this for history or sequences):
\`\`\`a2ui
{ "component": "Timeline", "props": { "events": [{ "date": "1991", "title": "Python Released", "description": "Guido van Rossum released Python 0.9.0" }] } }
\`\`\`

7. ComparisonTable (Use this to compare two things):
\`\`\`a2ui
{ "component": "ComparisonTable", "props": { "title": "TCP vs UDP", "headers": ["TCP", "UDP"], "rows": [{ "feature": "Reliability", "left": "High", "right": "Low" }] } }
\`\`\`
CONSTRAINT: For 'ComparisonTable', provide comprehensive details. Include at least 5-7 rows covering key differences like Performance, Usage, Syntax, Pros, and Cons.

8. Chart (Use this for visualizing data):
\`\`\`a2ui
{ "component": "Chart", "props": { "type": "bar", "title": "Python Usage", "labels": ["2020", "2021", "2022"], "data": [40, 60, 80], "label": "Users (M)" } }
\`\`\`

9. Table (Use this for general data lists):
\`\`\`a2ui
{ "component": "Table", "props": { "title": "Top Presidents", "headers": ["Name", "Years"], "rows": [["George Washington", "1789-1797"], ["Abraham Lincoln", "1861-1865"]] } }
\`\`\`

Use these whenever valid to make learning interactive.

10. Mermaid (Use this for flowcharts, sequence diagrams, class diagrams):
\`\`\`a2ui
{ "component": "Mermaid", "props": { "chart": "graph TD; A[Start] --> B{Is it working?}; B -- Yes --> C[Great!]; B -- No --> D[Debug];" } }
\`\`\`

IMPORTANT:
- ONLY use the components listed above. DO NOT invent new components like "Question", "Answer", or "List".
- If you want to create a quiz with multiple questions, output multiple separate \`Quiz\` blocks.
- If you want to create multiple flashcards, output multiple separate \`Flashcard\` blocks.
- If no component fits, just use standard Markdown text.`;

            // FORCE A2UI usage for specific keywords
            let finalUserContent = textInput;
            const lowerInput = textInput.toLowerCase();
            if (lowerInput.includes('quiz')) {
                finalUserContent += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Quiz' component. IMPORTANT: Generate ONLY ONE question. Do NOT generate multiple questions in one response. Wait for the user to answer before generating the next one.]`;
            } else if (lowerInput.includes('flashcard')) {
                finalUserContent += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Flashcard' component. If the user asked for a specific number (e.g. '5 flashcards'), you MUST generate exactly that many separate Flashcard blocks.]`;
            } else if (lowerInput.includes('compare') || lowerInput.includes('vs')) {
                finalUserContent += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'ComparisonTable' component. Ensure the table is detailed (5+ rows) and comprehensive, covering all major differences.]`;
            } else if (lowerInput.includes('timeline') || lowerInput.includes('history')) {
                finalUserContent += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Timeline' component. Ensure dates are HISTORICALLY ACCURATE. Descriptions must be specific to that event, NOT generic repeated text.]`;
            } else if (lowerInput.includes('chart') || lowerInput.includes('graph') || lowerInput.includes('progress')) {
                finalUserContent += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Chart' component based on available data.]`;
            } else if (lowerInput.includes('table') || lowerInput.includes('list')) {
                finalUserContent += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Table' component.]`;
            } else if (lowerInput.includes('flow') || lowerInput.includes('diagram') || lowerInput.includes('structure') || lowerInput.includes('process')) {
                finalUserContent += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Mermaid' component to visualize this process/structure.]`;
            }

            if (provider === 'chrome') {
                 // Experimental Chrome AI (Gemini Nano)
                 const ai = (window as any).ai; 
                 
                 if (!ai) {
                     replyText = "⚠️ **Chrome AI Not Detected**\n\nTo use Google Edge mode, you need Chrome Canary/Dev/Beta with the 'Prompt API' enabled in `chrome://flags`.\n\n*Falling back to Standard Mode...*";
                     // Optional: Auto-switch provider here if we have access to setProvider, 
                     // but processAIResponse is outside component scope mostly or complicated.
                     // Just returning text is safe.
                     source = "system";
                 } else {
                    try {
                        const session = await ai.createTextSession(); // Or languageModel.create() depending on version
                        const systemPrompt = `You are Lumina Edge (Chrome Native).\n` + a2uiPrompt + `\n\nUser Context:\n${userContext}`;
                        const response = await session.prompt(systemPrompt + "\n\nUser: " + finalUserContent);
                        
                        replyText = response;
                        source = "chrome-nano";
                        session.destroy();
                    } catch (e) {
                        console.warn("Chrome AI Interaction Failed", e);
                        replyText = "⚠️ **Chrome AI Error**: Failed to generate response. Please try a different provider.";
                        source = "system";
                    }
                 }

            } else if (provider === 'ollama') {
                 // Local Backend (Ollama)
                 const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
                 
                 // Prepend context to message since we are bypassing standard RAG or augmenting it
                 const fullMessage = `[User Context]\n${userContext}\n\n[Message]\n${finalUserContent}`;

                 try {
                     const res = await fetch(`${apiBase}/api/assessment/tutor/chat`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ 
                             message: fullMessage, 
                             user_id: "current-user",
                             session_id: currentSessionId, // [NEW] Pass Session ID
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
                
                let identityPrompt = a2uiPrompt;
                if (provider === 'local') {
                    // PREPEND identity but KEEP rules
                    identityPrompt = `You are Lumina Edge, a private, on-device AI Tutor.\n` + a2uiPrompt;
                }

                const systemPrompt = `${identityPrompt}\nUser Context:\n${userContext}`;

                const completion = await engine.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...messages.map(m => ({
                            role: (m.sender === 'me' ? 'user' : 'assistant') as "user" | "assistant" | "system",
                            content: m.text
                        })),
                        { role: "user", content: finalUserContent }
                    ],
                    temperature: 0.7,
                });
                replyText = completion.choices[0].message.content || "";
                source = "webllm";
            } else {
                // Cloud / Gemini Router
                let enhancedContext = `${a2uiPrompt}\n\n${userContext}`;
                // Also inject system instruction for cloud if needed, though they are usually smarter
                const lowerInput = textInput.toLowerCase();
                if (lowerInput.includes('quiz') || lowerInput.includes('flashcard')) {
                     enhancedContext += `\n\n[SYSTEM: If the user asks for a quiz or flashcard, strictly use the A2UI JSON protocol. Do not output plain text.]`;
                }
                
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

            // Generate Dynamic Suggestions based on response content
            const newSuggestions: string[] = [];
            const text = replyText.toLowerCase();
            if (text.includes('python')) newSuggestions.push("Quiz me on Python");
            if (text.includes('react') || text.includes('javascript')) newSuggestions.push("Explain React Hooks");
            if (text.includes('database') || text.includes('sql')) newSuggestions.push("Create a SQL Flashcard");
            
            // Only update if we have new suggestions
            if (newSuggestions.length > 0) {
                 setDynamicSuggestions(newSuggestions);
            }

            setMessages(prev => [...prev, aiMsg]);
            updateSessionsState(currentSessionId, aiMsg);

            await api.saveChatMessage({ sender: 'AI Tutor', text: replyText, sessionId: currentSessionId });
            // Only log if not hidden message
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

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg = { sender: 'me', text: input, timestamp: new Date(), sessionId: currentSessionId };
        setMessages(prev => [...prev, userMsg]);
        updateSessionsState(currentSessionId, userMsg);
        setInput('');
        setIsLoading(true);

        await api.saveChatMessage({ sender: 'me', text: userMsg.text, sessionId: currentSessionId });

        await processAIResponse(input, userMsg);
    };

    // Track used questions to prevent repeats
    const usedQuestionsRef = useRef<Set<string>>(new Set());
    // Clear used questions when session or topic changes (optional, for now just clear on hard reset)
    // We could add logic to detect topic change, but relying on unique set is robust enough for a session.

    const handleAction = async (action: string, data: any) => {
        console.log("Action Triggered:", action, data);
        if (action === 'quiz_answer') {
            // Store this question to avoid repetition
            if (data.question) {
                usedQuestionsRef.current.add(data.question);
            }

            try {
                // 1. Log to Backend
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/assessment/quick-log`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: "current-user", 
                        topic: "General", 
                        is_correct: data.isCorrect
                    })
                });
                if (response.ok) {
                    console.log("Mastery Updated");
                }
            } catch (e) {
                console.error("Failed to log answer", e);
            }
        } else if (action === 'quiz_next') {
            // Trigger AI to generate next question
        } else if (action === 'quiz_next') {
            // Trigger AI to generate next question
            const usedList = Array.from(usedQuestionsRef.current).slice(-10); // Check last 10
            const avoidContext = usedList.length > 0 
                ? `\n\n[SYSTEM CONSTRAINT: You are STRICTLY FORBIDDEN from asking any of the following questions again:\n${JSON.stringify(usedList)}.\nGenerate a NEW, UNIQUE question on a similar but DISTINCT sub-topic.]` 
                : "";
            
            // Add randomness to prompt to prevent caching
            const randomSeed = Math.floor(Math.random() * 10000);

            await sendMessageInternal(
                `Generate the next multiple-choice question. ${avoidContext}\n\nEnsure variety in difficulty and concept coverage. (Request ID: ${randomSeed})`, 
                true
            );
        } else if (action === 'quiz_end') {
            // Trigger AI to show summary
            await sendMessageInternal("I'm done with the quiz. Show me my updated Progress Chart.", false);
        }
    };

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
            {/* Sidebar - History */}
            {isSidebarOpen && (
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
            )}

            {/* Main Chat Area */}
            <div className="flex-1 glass-card flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors mr-1"
                            title={isSidebarOpen ? "Maximize Chat" : "Show History"}
                        >
                            {isSidebarOpen ? <SidebarClose className="w-5 h-5"/> : <SidebarOpen className="w-5 h-5"/>}
                        </button>

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

                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        <button suppressHydrationWarning onClick={() => setProvider('lumina')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'lumina' ? 'bg-lumina-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                            <Sparkles className="w-3.5 h-3.5" /> <span className="hidden md:inline">Lumina Fast</span>
                        </button>
                        <button suppressHydrationWarning onClick={() => setProvider('gemini')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${provider === 'gemini' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                            <Cloud className="w-3.5 h-3.5" /> <span className="hidden md:inline">Pro</span>
                        </button>
                        <button suppressHydrationWarning onClick={() => setProvider('ollama')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${provider === 'ollama' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            <Cpu className="w-3.5 h-3.5" /> <span className="hidden md:inline">Ollama</span>
                        </button>
                        <button suppressHydrationWarning onClick={() => setProvider('local')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${provider === 'local' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            <Cpu className="w-3.5 h-3.5" /> <span className="hidden md:inline">Lumina Edge</span>
                        </button>
                         <button suppressHydrationWarning onClick={() => setProvider('chrome')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'chrome' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            <Globe className="w-3.5 h-3.5" /> <span className="hidden md:inline">Google Edge</span>
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
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-4 ${msg.sender === 'me' ? 'flex-row-reverse' : ''} ${msg.isHidden ? 'hidden' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'me' ? 'bg-gray-700' : 'bg-lumina-primary/20 text-lumina-primary'}`}>
                                    {msg.sender === 'me' ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    <div className={`p-4 rounded-2xl relative group ${msg.sender === 'me' ? 'bg-lumina-primary text-black rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'}`}>
                                        <A2UIRenderer content={msg.text} onAction={handleAction} />
                                        
                                        {msg.sender !== 'me' && (
                                            <div className="absolute -bottom-8 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => addToNotes(msg.text)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white">
                                                    <FileText className="w-3 h-3" /> Add to Notes
                                                </button>
                                                <button onClick={() => navigator.clipboard.writeText(msg.text)} className="p-1.5 bg-gray-800 border border-white/10 rounded-full text-gray-400 hover:text-white">
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

                {/* Input Area + Suggestions */}
                <div className="p-4 bg-black/20 border-t border-white/10 flex flex-col gap-3">
                     
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {(dynamicSuggestions.length > 0 ? dynamicSuggestions : CAPABILITY_TAGS).map((s, i) => (
                            <button 
                                key={i} 
                                onClick={() => setInput(s)} 
                                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 hover:border-lumina-primary/50 transition-all shadow-sm"
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            suppressHydrationWarning
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Start a conversation..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white placeholder:text-gray-500 focus:border-lumina-primary focus:bg-white/10 outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-lumina-primary text-black rounded-lg hover:bg-lumina-secondary disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
