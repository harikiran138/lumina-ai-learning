import { getCachedResponse, cacheResponse } from "./cache";

export interface ChatResponse {
  text: string;
  source: "cache" | "api" | "rule" | "fallback";
  latency?: number;
  personalization?: {
    behavior?: string;
    recommendation?: string;
  };
}

// Simple rule-based matcher for common questions (Sub-5ms response)
const checkRules = (question: string): string | null => {
  const lower = question.toLowerCase();
  if (lower === "hello" || lower === "hi")
    return "Hello! I'm your AI Tutor. Ready to learn something new?";
  if (lower.includes("who are you"))
    return "I am Lumina, your personal AI learning assistant.";
  if (lower.includes("help"))
    return "I can help you create quizzes, explain complex topics, or track your study progress. Try asking 'Quiz me on React'!";
  return null;
};

const sendTelemetry = (
  metric: string,
  value: number,
  tags: Record<string, string> = {},
) => {
  // Placeholder for real telemetry (e.g. PostHog, Mixpanel)
  // For now, structured log
  console.log(`[TELEMETRY] ${metric}: ${value}ms`, tags);
};

export const processMessage = async (
  question: string,
  userContext?: string,
  userId?: string,
): Promise<ChatResponse> => {
  const startTime = performance.now();

  // 1. Check local cache (Instant)
  try {
    const cached = await getCachedResponse(question);
    if (cached) {
      const latency = Math.round(performance.now() - startTime);
      sendTelemetry("ai_response_time", latency, { source: "cache" });
      return { text: cached.answer, source: "cache", latency };
    }
  } catch (e) {
    console.warn("Cache read failed", e);
  }

  // 2. Check simple rules (Instant)
  const ruleAnswer = checkRules(question);
  if (ruleAnswer) {
    const latency = Math.round(performance.now() - startTime);
    sendTelemetry("ai_response_time", latency, { source: "rule" });
    return { text: ruleAnswer, source: "rule", latency };
  }

  // 3. Fallback to Cloud API (RAG + LLM)
  // Retry logic: 1 Retry
  let attempts = 0;
  const maxAttempts = 2;

  // Determine API Base URL
  const API_BASE =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8000"
      : process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  while (attempts < maxAttempts) {
    try {
      // Updated to match backend 'ai.py' endpoint /api/tutor/chat
      const response = await fetch(`${API_BASE}/api/tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          user_id: userId || "guest",
          session_id: "default-session",
          context_filters: userContext ? { context: userContext } : undefined,
        }),
      });

      if (!response.ok) {
        const rawText = await response.text();
        throw new Error(`HTTP ${response.status}: ${rawText}`);
      }

      const data = await response.json();

      // Success
      const latency = Math.round(performance.now() - startTime);
      sendTelemetry("ai_response_time", latency, {
        source: "api",
        attempt: (attempts + 1).toString(),
      });

      // Backend returns 'response', frontend library likely expects 'answer' based on cache line below
      const answerText = data.response;

      // Cache the result
      cacheResponse(question, answerText).catch((e) =>
        console.warn("Cache write failed", e),
      );

      return {
        text: answerText,
        source: "api",
        latency,
        personalization: data.personalization,
      };
    } catch (e: any) {
      attempts++;
      console.warn(`API Attempt ${attempts} failed:`, e); // Log full error for debugging

      if (attempts >= maxAttempts) {
        const latency = Math.round(performance.now() - startTime);
        sendTelemetry("ai_failure", latency, { error: e.message });

        // Fallback Message
        return {
          text: "I'm having trouble connecting to the cloud right now. Please check your internet connection or try asking a simpler question.",
          source: "fallback",
          latency,
        };
      }
      // Wait 500ms before retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return { text: "System Error.", source: "fallback" };
};
