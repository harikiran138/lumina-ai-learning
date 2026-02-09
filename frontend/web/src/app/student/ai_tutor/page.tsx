"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { processMessage } from "@/lib/ai-tutor/router"; // Integrated Router
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm"; // WebLLM
import { Sparkles, History, Bot, Cloud, Cpu, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { A2UIRenderer } from "@/components/advanced/A2UIRenderer";
import { AITutorChat } from "@/components/ai/AITutorChat";
import { AITutorSidebar } from "@/components/ai/AITutorSidebar";

// Switched to q4f16_1 for better memory stability
const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export default function AITutorPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebLLM State
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [isModelLoading, setIsModelLoading] = useState(false);

  // AI Provider State - Default to 'gemini' for stability
  const [provider, setProvider] = useState<
    "lumina" | "gemini" | "local" | "chrome" | "ollama"
  >("gemini");

  // Context State
  const [userContext, setUserContext] = useState<string>("");
  const [studentStats, setStudentStats] = useState({
    attendance: [90, 85, 92, 88, 95], // Last 5 weeks
    moduleScores: {
      Python: 85,
      React: 70,
      SQL: 92,
      "Data Structures": 60,
    } as Record<string, number>,
    weeklyActivity: [2, 4, 1, 3, 5, 2, 0], // Hours per day (Mon-Sun)
    averageScore: 78,
  });

  // Session Management
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [sessions, setSessions] = useState<Record<string, any[]>>({});

  // UI Features
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);

  // Topic & Quiz Tracking
  const currentTopicRef = useRef<string>("General");
  const usedQuestionsRef = useRef<Set<string>>(new Set());

  // Track current quiz session stats
  const [quizSessionStats, setQuizSessionStats] = useState({
    total: 0,
    correct: 0,
  });
  const CAPABILITY_TAGS = [
    "Create Quiz on React",
    "Make Flashcards for SQL",
    "Draw Timeline of AI History",
    "Compare TCP vs UDP",
    "Show my Progress Chart",
    "Code Snippet for API Fetch",
  ];

  const generateContext = useCallback(
    (
      user: any,
      dashboard: any,
      profile: any,
      notes: any,
      allCourses: any,
      stats: any,
    ) => {
      let context = `Current User: ${user?.name || "Student"}\n`;

      // Inject Data for Visualization
      context += `\n[REAL-TIME STUDENT DATA FOR VISUALIZATION]\n`;
      context += `Module Scores: ${JSON.stringify(stats.moduleScores)}\n`;
      context += `Weekly Activity (Hours): ${JSON.stringify(
        stats.weeklyActivity,
      )}\n`;
      context += `Attendance Trends: ${JSON.stringify(stats.attendance)}\n`;
      context += `Average Score: ${stats.averageScore}%\n`;
      context += `[INSTRUCTION: If asked about progress/stats, use the 'Chart' component to visualize this data.]\n`;

      if (allCourses.length > 0) {
        context +=
          "\nOfficial Course Catalog (Only recommend or discuss courses from this list):\n";
        allCourses.forEach((c: any) => {
          context += `- ${c.name} (${c.code}): ${c.description}\n`;
        });
      }

      if (profile) {
        if (profile.bio) context += `\nBio: ${profile.bio}\n`;
        if (profile.skills && profile.skills.length > 0)
          context += `Skills: ${profile.skills.join(", ")}\n`;
        if (profile.preferences) {
          context += `Learning Style: ${
            profile.preferences.learningStyle || "Visual"
          }\n`;
          context += `Interests: ${
            profile.preferences.interests?.join(", ") || "General"
          }\n`;
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
          context += `- [${new Date(
            n.createdAt,
          ).toLocaleDateString()}] ${n.content.substring(0, 100)}...\n`;
        });
      }

      return context.substring(0, 1500); // Increased limit slightly
    },
    [],
  );

  // Load user context initial
  useEffect(() => {
    const loadContext = async () => {
      try {
        const [user, dashboard, profile, notes] = await Promise.all([
          api.getCurrentUser(),
          api.getDashboardData("student"),
          api.getStudentProfile(),
          api.getNotes(),
        ]);

        let allCourses = [];
        try {
          const apiBase =
            process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
          const res = await fetch(`${apiBase}/api/courses/list`, {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          if (res.ok) allCourses = await res.json();
        } catch (ce) {}

        const context = generateContext(
          user,
          dashboard,
          profile,
          notes,
          allCourses,
          studentStats,
        );
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
      setUserContext((prev) => {
        const statsBlock = `\n[REAL-TIME STUDENT DATA FOR VISUALIZATION]\nModule Scores: ${JSON.stringify(
          studentStats.moduleScores,
        )}\nWeekly Activity (Hours): ${JSON.stringify(
          studentStats.weeklyActivity,
        )}\nAttendance Trends: ${JSON.stringify(
          studentStats.attendance,
        )}\nAverage Score: ${studentStats.averageScore}%\n`;
        const startMarker = `\n[REAL-TIME STUDENT DATA FOR VISUALIZATION]\n`;
        const endMarker = `[INSTRUCTION: If asked about progress/stats, use the 'Chart' component to visualize this data.]\n`;

        if (prev.includes(startMarker) && prev.includes(endMarker)) {
          const parts = prev.split(startMarker);
          const afterParts = parts[1].split(endMarker);
          if (afterParts.length > 1) {
            return (
              parts[0] + startMarker + statsBlock + endMarker + afterParts[1]
            );
          }
        }
        return prev;
      });
    }
  }, [studentStats]);

  // Initial load history
  useEffect(() => {
    let sessionId = sessionStorage.getItem("lumina_chat_session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(7);
      sessionStorage.setItem("lumina_chat_session_id", sessionId);
    }
    setCurrentSessionId(sessionId);

    const loadData = async () => {
      const history = await api.getChatHistory();
      if (history) {
        const grouped: Record<string, any[]> = {};
        history.forEach((msg: any) => {
          const sId = msg.sessionId || "legacy";
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
    sessionStorage.setItem("lumina_chat_session_id", sessionId);
    setMessages(sessions[sessionId] || []);
    if (window.innerWidth < 1024) setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const startNewChat = () => {
    const newSessionId = Math.random().toString(36).substring(7);
    setCurrentSessionId(newSessionId);
    sessionStorage.setItem("lumina_chat_session_id", newSessionId);
    setMessages([]);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const updateSessionsState = (sessionId: string, newMsg: any) => {
    setSessions((prev) => {
      const sessionMsgs = prev[sessionId]
        ? [...prev[sessionId], newMsg]
        : [newMsg];
      return { ...prev, [sessionId]: sessionMsgs };
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Initialize WebLLM
  useEffect(() => {
    const initWebLLM = async () => {
      if (
        (provider === "lumina" || provider === "local") &&
        !engine &&
        !isModelLoading
      ) {
        setIsModelLoading(true);
        try {
          const newEngine = await CreateMLCEngine(SELECTED_MODEL, {
            initProgressCallback: (report) => setProgress(report.text),
            logLevel: "INFO",
          });
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
{ "component": "Mermaid", "props": { "chart": "graph TD;\\n  A-->B;\\n  B-->C;", "title": "Diagram Title" } }
\`\`\`
CONSTRAINT: The 'chart' prop MUST be a valid Mermaid syntax string. Newlines MUST be escaped as \\n.

IMPORTANT RULES FOR A2UI:
- Output MUST be valid JSON inside the code block.
- ESCAPE ALL NEWLINES in string content (e.g., "line 1\\nline 2").
- ESCAPE ALL DOUBLE QUOTES inside strings (e.g., "content": "She said \\"Hello\\"").
- Do NOT add comments inside the JSON.
- If you want to create a quiz with multiple questions, output multiple separate \`Quiz\` blocks.
- If no component fits, just use standard Markdown text.
`;

  const getEnhancedContext = (textInput: string) => {
    let enhanced = A2UI_SYSTEM_PROMPT;
    const lower = textInput.toLowerCase();

    if (lower.includes("quiz")) {
      enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Quiz' component. ONE question only.]`;
    } else if (lower.includes("flashcard")) {
      enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Flashcard' component.]`;
    } else if (lower.includes("compare") || lower.includes("vs")) {
      enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'ComparisonTable' component.]`;
    } else if (lower.includes("timeline")) {
      enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Timeline' component.]`;
    } else if (lower.includes("chart") || lower.includes("graph")) {
      enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Chart' component.]`;
    } else if (lower.includes("table")) {
      enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Table' component.]`;
    } else if (lower.includes("flow") || lower.includes("diagram")) {
      enhanced += `\n\n[SYSTEM: You MUST return a JSON \`\`\`a2ui block using the 'Mermaid' component.]`;
    } else if (
      lower.includes("ppt") ||
      lower.includes("powerpoint") ||
      lower.includes("presentation") ||
      lower.includes("slides")
    ) {
      // PPT requests are handled separately via API
      enhanced += `\n\n[SYSTEM: User is requesting a PowerPoint presentation. This will be handled by the backend API.]`;
    }

    return enhanced;
  };

  const processAIResponse = async (textInput: string, userMsg: any) => {
    try {
      // Check if this is a PPT request
      const lower = textInput.toLowerCase();
      const isPPTRequest =
        lower.includes("ppt") ||
        lower.includes("powerpoint") ||
        lower.includes("presentation") ||
        lower.includes("slides");

      if (isPPTRequest) {
        // Extract topic from request
        const topicMatch = textInput.match(
          /(?:ppt|powerpoint|presentation|slides)\s+(?:on|about|for)\s+([\w\s]+)/i,
        );
        const topic = topicMatch
          ? topicMatch[1].trim()
          : textInput
              .replace(
                /(?:create|make|generate|ppt|powerpoint|presentation|slides|on|about|for)/gi,
                "",
              )
              .trim();

        setIsLoading(true);

        try {
          const apiBase =
            process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
          const res = await fetch(`${apiBase}/api/tutor/generate-ppt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic,
              slides_count: 8,
              user_id: "current-user",
            }),
          });

          if (!res.ok) throw new Error("PPT generation failed");
          const data = await res.json();

          // Create A2UI response
          const pptComponent = `\`\`\`a2ui\n${JSON.stringify({
            component: "PPTDownload",
            props: {
              topic:
                data.message
                  .replace("Presentation '", "")
                  .replace("' generated successfully!", "") || topic,
              slideCount: data.slide_count,
              downloadUrl: data.download_url,
              filename: data.filename,
              fileSize: data.file_size,
              slideTitles: data.slide_titles,
              slideData: data.content_structure,
            },
          })}\n\`\`\``;

          const aiMsg = {
            sender: "AI Tutor",
            text: `I've created a professional PowerPoint presentation on "${topic}" for you! 📊\n\n${pptComponent}`,
            timestamp: new Date(),
            sessionId: currentSessionId,
            source: "ppt-generator",
          };

          setMessages((prev) => [...prev, aiMsg]);
          updateSessionsState(currentSessionId, aiMsg);
          await api.saveChatMessage({
            sender: "AI Tutor",
            text: aiMsg.text,
            sessionId: currentSessionId,
          });

          setIsLoading(false);
          return;
        } catch (error) {
          console.error("PPT Generation Error:", error);
          const errorMsg = {
            sender: "AI Tutor",
            text: "Sorry, I couldn't generate the presentation. Please try again.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMsg]);
          setIsLoading(false);
          return;
        }
      }

      let replyText = "";
      let source = "api";
      const enhancedContext =
        getEnhancedContext(textInput) + `\n\nUser Context:\n${userContext}`;

      if (provider === "chrome") {
        try {
          const ai = (window as any).ai;
          if (!ai) throw new Error("Chrome AI Not Detected");
          const session = await ai.createTextSession();
          const systemPrompt =
            `You are Lumina Edge (Chrome Native).\n` + enhancedContext;
          const response = await session.prompt(
            systemPrompt + "\n\nUser: " + textInput,
          );
          replyText = response;
          source = "chrome-nano";
          session.destroy();
        } catch (e) {
          console.warn("Chrome AI Interaction Failed", e);
          replyText =
            "⚠️ **Chrome AI Error**: Failed to generate response. Please try a different provider.";
          source = "system";
        }
      } else if (provider === "ollama") {
        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
        const fullMessage = `[User Context]\n${userContext}\n\n[Message]\n${textInput}\n\n${enhancedContext}`; // Injected prompt

        try {
          const res = await fetch(`${apiBase}/api/tutor/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: fullMessage,
              user_id: "current-user",
              session_id: currentSessionId,
              provider: "ollama",
            }),
          });

          if (!res.ok) throw new Error("Backend Connection Failed");
          const data = await res.json();
          replyText = data.response;
          source = "local-ollama";
        } catch (e) {
          console.error("Ollama Error", e);
          replyText =
            "⚠️ **Ollama Error**: Could not connect to local server. Make sure `ollama serve` is running.";
          source = "system";
        }
      } else if ((provider === "lumina" || provider === "local") && engine) {
        const identityPrompt =
          provider === "local"
            ? `You are Lumina Edge, a private, on-device AI Tutor.`
            : `You are Lumina, a helpful AI assistant.`;

        const systemPrompt = `${identityPrompt}\n${enhancedContext}`;

        const completion = await engine.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({
              role: (m.sender === "me" ? "user" : "assistant") as any,
              content: m.text,
            })),
            { role: "user", content: textInput },
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
        sender: "AI Tutor",
        text: replyText,
        timestamp: new Date(),
        sessionId: currentSessionId,
        source: source,
      };

      // Suggestions
      const newSuggestions: string[] = [];
      const lowerText = replyText.toLowerCase();
      if (lowerText.includes("python"))
        newSuggestions.push("Quiz me on Python");
      if (lowerText.includes("react") || lowerText.includes("javascript"))
        newSuggestions.push("Explain React Hooks");
      if (lowerText.includes("database") || lowerText.includes("sql"))
        newSuggestions.push("Create a SQL Flashcard");
      if (newSuggestions.length > 0) setDynamicSuggestions(newSuggestions);

      setMessages((prev) => [...prev, aiMsg]);
      updateSessionsState(currentSessionId, aiMsg);

      await api.saveChatMessage({
        sender: "AI Tutor",
        text: replyText,
        sessionId: currentSessionId,
      });
      if (!userMsg.isHidden) {
        await api.logAIInteraction(userMsg.text, aiMsg.text);
      }
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg = {
        sender: "AI Tutor",
        text: "I'm having trouble thinking right now.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageInternal = useCallback(
    async (text: string, isHidden: boolean = false) => {
      const userMsg = {
        sender: "me",
        text: text,
        timestamp: new Date(),
        sessionId: currentSessionId,
        isHidden,
      };
      if (!isHidden) setMessages((prev) => [...prev, userMsg]);
      updateSessionsState(currentSessionId, userMsg);
      setIsLoading(true);
      await processAIResponse(text, userMsg);
    },
    [currentSessionId, userContext, provider, engine],
  );

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      sender: "me",
      text: input,
      timestamp: new Date(),
      sessionId: currentSessionId,
    };

    // Detect Quiz Topic
    const quizMatch = input.match(
      /(?:quiz|test|exam) (?:me )?(?:on|about|for) ([\w\s]+)/i,
    );
    if (quizMatch) {
      currentTopicRef.current = quizMatch[1].trim();
      usedQuestionsRef.current.clear();
      setQuizSessionStats({ total: 0, correct: 0 }); // Reset stats for new quiz
    }

    setMessages((prev) => [...prev, userMsg]);
    updateSessionsState(currentSessionId, userMsg);
    setInput("");
    setIsLoading(true);

    await api.saveChatMessage({
      sender: "me",
      text: userMsg.text,
      sessionId: currentSessionId,
    });
    await processAIResponse(input, userMsg);
  };

  const handleAction = useCallback(
    async (action: string, data: any) => {
      if (action === "quiz_answer") {
        if (data.question) usedQuestionsRef.current.add(data.question);

        setStudentStats((prev) => {
          const matchedTopic = currentTopicRef.current || "General";
          const newScores = { ...prev.moduleScores };
          if (data.isCorrect) {
            newScores[matchedTopic] = Math.min(
              100,
              (newScores[matchedTopic] || 50) + 5,
            );
          } else {
            newScores[matchedTopic] = Math.max(
              0,
              (newScores[matchedTopic] || 50) - 3,
            );
          }
          const scores = Object.values(newScores);
          const avg = Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length,
          );
          return { ...prev, moduleScores: newScores, averageScore: avg };
        });

        // Update current session stats
        setQuizSessionStats((prev) => ({
          total: prev.total + 1,
          correct: prev.correct + (data.isCorrect ? 1 : 0),
        }));

        api
          .saveQuizResult({
            user_id: "current_student", // In real app, fetch from auth context
            topic: data.topic || currentTopicRef.current || "General",
            score: data.isCorrect ? 100 : 0,
            total_questions: 1,
            correct_count: data.isCorrect ? 1 : 0,
            difficulty: data.difficulty || "medium",
            details: { question: data.question },
          })
          .catch(console.error);
      } else if (action === "quiz_next") {
        const usedList = Array.from(usedQuestionsRef.current).slice(-10);
        const avoidContext =
          usedList.length > 0
            ? `\n\n[SYSTEM CONSTRAINT: DO NOT repeat: ${JSON.stringify(
                usedList,
              )}.]`
            : "";
        await sendMessageInternal(
          `Generate the next multiple-choice question on ${
            currentTopicRef.current || "General"
          }. Use the 'Quiz' component. ${avoidContext}\n\nSTRICT: Respond ONLY with the A2UI JSON code block. No conversational filler.`,
          true,
        );
      } else if (action === "quiz_end") {
        // Forcefully show the quiz summary card
        const percentage =
          quizSessionStats.total > 0
            ? Math.round(
                (quizSessionStats.correct / quizSessionStats.total) * 100,
              )
            : 0;

        const scoreCardData = {
          component: "ScoreCard",
          props: {
            title: "Quiz Complete!",
            score: `${quizSessionStats.correct}/${quizSessionStats.total}`,
            percentage: percentage,
            correctCount: quizSessionStats.correct,
            totalCount: quizSessionStats.total,
            topic: currentTopicRef.current || "General",
            message:
              percentage >= 80
                ? "Outstanding performance! You've mastered this topic."
                : percentage >= 50
                  ? "Good effort! A little more practice and you'll be a pro."
                  : "Keep practicing! Review the material and try again.",
          },
        };

        const aiMsg = {
          sender: "AI Tutor",
          text: `You've finished the quiz! Here is your summary:\n\n\`\`\`a2ui\n${JSON.stringify(
            scoreCardData,
          )}\n\`\`\``,
          timestamp: new Date(),
          sessionId: currentSessionId,
          source: "system",
        };

        const userMsg = {
          sender: "me",
          text: "I'm done with the quiz.",
          timestamp: new Date(),
          sessionId: currentSessionId,
        };

        setMessages((prev) => [...prev, userMsg, aiMsg]);
        updateSessionsState(currentSessionId, userMsg);
        updateSessionsState(currentSessionId, aiMsg);

        await api.saveChatMessage({
          sender: "me",
          text: userMsg.text,
          sessionId: currentSessionId,
        });
        await api.saveChatMessage({
          sender: "AI Tutor",
          text: aiMsg.text,
          sessionId: currentSessionId,
        });

        // Reset stats after showing summary
        setQuizSessionStats({ total: 0, correct: 0 });
      }
    },
    [sendMessageInternal, studentStats, currentSessionId, quizSessionStats],
  );

  const addToNotes = async (text: string) => {
    await api.saveNote(text);
    alert("Saved to notes!");
  };

  const getProviderName = (p: string) => {
    if (p === "gemini") return "Lumina Pro";
    if (p === "local") return "Lumina Edge";
    if (p === "chrome") return "Google Edge (Nano)";
    if (p === "ollama") return "Local Server (Ollama)";
    return "Lumina Fast";
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden font-inter">
      <AITutorSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSwitchSession={switchSession}
        onNewChat={startNewChat}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Premium Header */}
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-3xl px-5 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 transition-all active:scale-95"
              >
                <History className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lumina-primary to-emerald-500 p-[1px]">
                <div className="w-full h-full rounded-[7px] bg-black flex items-center justify-center">
                  <Bot className="w-4 h-4 text-lumina-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  Lumina AI Tutor
                </h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    {getProviderName(provider)} Engine Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/10 shadow-inner">
            <button
              onClick={() => setProvider("lumina")}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-300",
                provider === "lumina"
                  ? "bg-lumina-primary text-black shadow-lg shadow-lumina-primary/20"
                  : "text-gray-500 hover:text-gray-300",
              )}
            >
              <Sparkles className="w-3 h-3" />
              FAST
            </button>
            <button
              onClick={() => setProvider("gemini")}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-300",
                provider === "gemini"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-500 hover:text-gray-300",
              )}
            >
              <Cloud className="w-3 h-3" />
              PRO
            </button>
            <button
              onClick={() => setProvider("ollama")}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-300",
                provider === "ollama"
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                  : "text-gray-500 hover:text-gray-300",
              )}
            >
              <Cpu className="w-3 h-3" />
              LOCAL
            </button>
          </div>
        </header>

        <AITutorChat
          messages={messages}
          isLoading={isLoading}
          input={input}
          setInput={setInput}
          onSendMessage={handleSendMessage}
          onSuggestionClick={(s) => setInput(s)}
          suggestions={
            dynamicSuggestions.length > 0 ? dynamicSuggestions : CAPABILITY_TAGS
          }
          provider={provider}
          providerName={getProviderName(provider)}
          onAction={handleAction}
          onAddToNotes={addToNotes}
          onNewChat={startNewChat}
        />
      </div>
    </div>
  );
}
