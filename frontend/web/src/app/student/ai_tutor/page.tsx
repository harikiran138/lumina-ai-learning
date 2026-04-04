"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  processMessage,
  type ProcessMessageOptions,
} from "@/lib/ai-tutor/router";
import { extractA2UITopic } from "@/lib/a2ui-schema";
import { TutorLayout } from "@/components/ai/redesign/TutorLayout";
import { TutorSidebar } from "@/components/ai/redesign/TutorSidebar";
import { TutorConversation } from "@/components/ai/redesign/TutorConversation";

const DEFAULT_SUGGESTIONS = [
  "Explain my weakest topic simply",
  "Quiz me on my current course",
  "Summarize what I should study today",
  "Help me prepare for my next assignment",
];

interface TutorMessage {
  id: string;
  sender: "me" | "ai";
  text: string;
  timestamp: string;
  sessionId: string;
  source?: string;
  personalization?: Record<string, any>;
}

function resolveTutorProvider(): "auto" | "ollama" | "gemini" {
  const envProvider = process.env.NEXT_PUBLIC_TUTOR_PROVIDER;
  if (envProvider === "ollama" || envProvider === "gemini" || envProvider === "auto") {
    return envProvider;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "ollama";
    }
  }

  return "auto";
}

function createSessionId() {
  return `tutor-${Math.random().toString(36).slice(2, 10)}`;
}

function createMessage(
  sender: "me" | "ai",
  text: string,
  sessionId: string,
  extra: Partial<TutorMessage> = {},
): TutorMessage {
  return {
    id: `${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
    timestamp: new Date().toISOString(),
    sessionId,
    ...extra,
  };
}

function normalizeStoredMessages(history: any[]): TutorMessage[] {
  return history
    .map((item) => ({
      id:
        item.id ||
        `${item.sessionId || "legacy"}-${Math.random().toString(36).slice(2, 8)}`,
      sender:
        item.sender === "me" || item.sender === "ai"
          ? item.sender
          : item.sender === "AI Tutor"
            ? "ai"
            : "me",
      text: item.text || "",
      timestamp:
        typeof item.timestamp === "string"
          ? item.timestamp
          : new Date(item.timestamp || Date.now()).toISOString(),
      sessionId: item.sessionId || "legacy",
      source: item.source,
      personalization: item.personalization,
    }))
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState("");
  const [currentUserId, setCurrentUserId] = useState("guest");
  const [currentUserName, setCurrentUserName] = useState("Student");
  const [sidebarSubtitle, setSidebarSubtitle] = useState("Personal learning mode");
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [sessions, setSessions] = useState<Record<string, TutorMessage[]>>({});
  const [dynamicSuggestions, setDynamicSuggestions] =
    useState<string[]>(DEFAULT_SUGGESTIONS);
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [pendingAnswerCount, setPendingAnswerCount] = useState(0);
  const currentTopicRef = useRef<string>("General");

  useEffect(() => {
    let sessionId = sessionStorage.getItem("lumina_chat_session_id");
    if (!sessionId) {
      sessionId = createSessionId();
      sessionStorage.setItem("lumina_chat_session_id", sessionId);
    }
    setCurrentSessionId(sessionId);
    const resolvedId = sessionId;
    setSessions((prev) =>
      prev[resolvedId] ? prev : { ...prev, [resolvedId]: [] },
    );
  }, []);

  const generateContext = useCallback(
    (user: any, dashboard: any, profile: any, notes: any, allCourses: any[]) => {
      const learnerProfile = profile?.learner_profile || {};
      const weakTopics =
        dashboard?.weakTopics?.map((item: any) => item.topic).filter(Boolean) || [];
      const dueAssignments =
        dashboard?.dueAssignments
          ?.filter((item: any) => !item.submitted)
          .slice(0, 3)
          .map((item: any) => item.title) || [];
      const enrolledCourses =
        dashboard?.enrolledCourses?.map((course: any) => ({
          title: course.title || course.name,
          progress: course.progress,
        })) || [];

      const lines = [
        `Current User: ${user?.name || user?.full_name || "Student"}`,
        `Overall Mastery: ${dashboard?.overallMastery || 0}%`,
        `Current Streak: ${dashboard?.currentStreak || 0} days`,
        `Pending Assignments: ${dashboard?.pendingAssignments || 0}`,
      ];

      if (weakTopics.length > 0) {
        lines.push(`Weak Topics: ${weakTopics.join(", ")}`);
      }

      if (dueAssignments.length > 0) {
        lines.push(`Due Soon: ${dueAssignments.join(", ")}`);
      }

      if (learnerProfile.behavior_signals?.behavior_label) {
        lines.push(
          `Behavior Signal: ${learnerProfile.behavior_signals.behavior_label}`,
        );
      }

      if (learnerProfile.risk_summary?.risk_level) {
        lines.push(`Risk Level: ${learnerProfile.risk_summary.risk_level}`);
      }

      if (enrolledCourses.length > 0) {
        lines.push("Enrolled Courses:");
        enrolledCourses
          .slice(0, 5)
          .forEach((course: { title: string; progress?: number }) => {
          lines.push(`- ${course.title} (${course.progress || 0}% progress)`);
          });
      }

      if (allCourses.length > 0) {
        lines.push("Official Course Catalog:");
        allCourses.slice(0, 10).forEach((course) => {
          lines.push(`- ${course.name} (${course.code}): ${course.description}`);
        });
      }

      if (notes.length > 0) {
        lines.push("Recent Notes:");
        notes.slice(0, 3).forEach((note: any) => {
          lines.push(
            `- ${note.title || "Note"}: ${(note.content || "").slice(0, 120)}`,
          );
        });
      }

      return lines.join("\n").slice(0, 2200);
    },
    [],
  );

  const buildSuggestions = useCallback((dashboard: any) => {
    const suggestions = new Set<string>();
    const weakTopics =
      dashboard?.weakTopics?.map((item: any) => item.topic).filter(Boolean) || [];
    const nextAction = dashboard?.nextAction?.title;
    const resumeCourse = dashboard?.resumeCourse?.title;

    weakTopics.slice(0, 2).forEach((topic: string) => {
      suggestions.add(`Explain ${topic} in simple steps`);
      suggestions.add(`Quiz me on ${topic}`);
    });

    if (nextAction) suggestions.add(`Help me with ${nextAction}`);
    if (resumeCourse) suggestions.add(`Summarize ${resumeCourse}`);

    DEFAULT_SUGGESTIONS.forEach((item) => suggestions.add(item));
    return Array.from(suggestions).slice(0, 6);
  }, []);

  const groupMessages = useCallback((history: TutorMessage[]) => {
    const grouped: Record<string, TutorMessage[]> = {};
    history.forEach((message) => {
      const sessionId = message.sessionId || "legacy";
      if (!grouped[sessionId]) grouped[sessionId] = [];
      grouped[sessionId].push(message);
    });
    return grouped;
  }, []);

  useEffect(() => {
    const loadTutorState = async () => {
      try {
        const [user, dashboard, profile, notes, history, allCourses, questions] =
          await Promise.all([
            api.getCurrentUser().catch(() => null),
            api.getDashboardData("student").catch(() => null),
            api.getStudentProfile().catch(() => null),
            api.getNotes().catch(() => [] as any[]),
            api.getChatHistory().catch(() => [] as any[]),
            api.getAllCourses().catch(() => [] as any[]),
            api.getStudentQuestions().catch(() => [] as any[]),
          ]);

        const pendingCount = (questions || []).filter(
          (q: any) => q.queue_status === "pending" || q.queue_status === "escalated_to_faculty" || q.queue_status === "escalated_to_hod"
        ).length;
        setPendingAnswerCount(pendingCount);

        const normalizedHistory = normalizeStoredMessages(history || []);
        const grouped = groupMessages(normalizedHistory);

        let sessionId = sessionStorage.getItem("lumina_chat_session_id");
        if (!sessionId) {
          sessionId = Object.keys(grouped)[0] || createSessionId();
          sessionStorage.setItem("lumina_chat_session_id", sessionId);
        }

        setCurrentSessionId(sessionId);
        const mergedSessions = { ...grouped };
        if (!mergedSessions[sessionId]) mergedSessions[sessionId] = [];
        setSessions((prev) => {
          const next = { ...mergedSessions, ...prev };
          if (!next[sessionId]) next[sessionId] = [];
          return next;
        });
        setMessages((prev) =>
          prev.some((msg) => msg.sessionId === sessionId)
            ? prev
            : mergedSessions[sessionId] || [],
        );

        if (user?.id) setCurrentUserId(user.id);
        if (user?.name) {
          setCurrentUserName(user.name);
        }

        const weakTopics =
          dashboard?.weakTopics?.map((item: any) => item.topic).filter(Boolean) ||
          [];
        const currentBehavior =
          dashboard?.learningSignals?.behaviorLabel || "personal learning mode";
        setSidebarSubtitle(String(currentBehavior).replace(/_/g, " "));
        setFocusTopics(weakTopics);
        if (weakTopics[0]) {
          currentTopicRef.current = weakTopics[0];
        }
        setDynamicSuggestions(buildSuggestions(dashboard));
        setUserContext(
          generateContext(user, dashboard, profile, notes, allCourses || []),
        );
      } catch (error) {
        console.error("ai_tutor_load_failed", error);
        let fallbackId = sessionStorage.getItem("lumina_chat_session_id");
        if (!fallbackId) {
          fallbackId = createSessionId();
          sessionStorage.setItem("lumina_chat_session_id", fallbackId);
        }
        const resolvedId = fallbackId;
        setCurrentSessionId(resolvedId);
        setSessions((prev) =>
          prev[resolvedId] ? prev : { ...prev, [resolvedId]: [] },
        );
        setMessages([]);
      }
    };

    loadTutorState();
  }, [buildSuggestions, generateContext, groupMessages]);

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    sessionStorage.setItem("lumina_chat_session_id", sessionId);
    setMessages(sessions[sessionId] || []);
  };

  const startNewChat = () => {
    const sessionId = createSessionId();
    setCurrentSessionId(sessionId);
    sessionStorage.setItem("lumina_chat_session_id", sessionId);
    setMessages([]);
    setSessions((prev) => ({ ...prev, [sessionId]: [] }));
  };

  const updateSessionState = useCallback(
    (sessionId: string, message: TutorMessage) => {
      setSessions((prev) => {
        const next = {
          ...prev,
          [sessionId]: [...(prev[sessionId] || []), message],
        };
        return next;
      });
    },
    [],
  );

  const addToNotes = async (content: string, title = "Tutor Insight") => {
    try {
      await api.createNote({
        title,
        subject: currentTopicRef.current,
        content,
      });
    } catch (error) {
      console.error("save_tutor_note_failed", error);
    }
  };

  const handleAction = useCallback(
    async (action: string, data: any) => {
      if (action === "quiz_answer" && !data.isCorrect) {
        await addToNotes(
          `Question: ${data.question}\nSelected Answer: ${data.selectedOption}`,
          "Quiz Review",
        );
      }

      if (action === "save_note") {
        await addToNotes(data.content, data.title || "Saved Tutor Note");
      }
    },
    [],
  );

  const sendTutorMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = createSessionId();
        sessionStorage.setItem("lumina_chat_session_id", sessionId);
        setCurrentSessionId(sessionId);
        setSessions((prev) => ({
          ...prev,
          [sessionId]: prev[sessionId] || [],
        }));
      }

      const userMessage = createMessage("me", text.trim(), sessionId);
      setMessages((prev) => [...prev, userMessage]);
      updateSessionState(sessionId, userMessage);
      setInput("");
      setIsLoading(true);
      await api.saveChatMessage(userMessage);

      const matchedTopic =
        focusTopics.find((topic) => text.toLowerCase().includes(topic.toLowerCase())) ||
        currentTopicRef.current;
      currentTopicRef.current = matchedTopic || "General";

      const requestOptions: ProcessMessageOptions = {
        userContext,
        userId: currentUserId,
        sessionId: sessionId,
        provider: resolveTutorProvider(),
        topic: currentTopicRef.current,
        history: [...(sessions[sessionId] || []), userMessage].slice(-8),
      };

      try {
        const result = await processMessage(text.trim(), requestOptions);
        const resolvedTopic = extractA2UITopic(result.text);
        if (resolvedTopic) {
          currentTopicRef.current = resolvedTopic;
        }
        const aiMessage = createMessage("ai", result.text, sessionId, {
          source: result.source,
          personalization: result.personalization,
        });

        setMessages((prev) => [...prev, aiMessage]);
        updateSessionState(sessionId, aiMessage);
        await api.saveChatMessage(aiMessage);
        await api.logAIInteraction(userMessage.text, aiMessage.text);
      } catch (error) {
        console.error("tutor_send_failed", error);
        const fallbackMessage = createMessage(
          "ai",
          "I hit a problem while generating the reply. Please try the same question once more or ask for a simpler explanation.",
          sessionId,
          { source: "fallback" },
        );
        setMessages((prev) => [...prev, fallbackMessage]);
        updateSessionState(sessionId, fallbackMessage);
        await api.saveChatMessage(fallbackMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [
      currentSessionId,
      currentUserId,
      focusTopics,
      sessions,
      updateSessionState,
      userContext,
    ],
  );

  return (
    <TutorLayout
      sidebar={
        <TutorSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSwitchSession={switchSession}
          onNewChat={startNewChat}
          studentName={currentUserName}
          subtitle={sidebarSubtitle}
          pendingAnswerCount={pendingAnswerCount}
        />
      }
      conversation={
        <TutorConversation
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendTutorMessage}
          input={input}
          setInput={setInput}
          onAction={handleAction}
          suggestions={dynamicSuggestions}
          onSuggestionClick={(text) => sendTutorMessage(text)}
        />
      }
    />
  );
}
