import { getCachedResponse, cacheResponse } from "./cache";
import { RealAPI } from "@/lib/api";

export interface ChatResponse {
  text: string;
  source: "cache" | "api" | "rule" | "fallback";
  latency?: number;
  personalization?: {
    behavior?: string;
    recommendation?: string;
  };
}

export interface ProcessMessageOptions {
  userContext?: string;
  userId?: string;
  sessionId?: string;
  provider?: string;
  topic?: string;
  subject?: string;
  lessonContext?: Record<string, any>;
  assignmentContext?: Record<string, any>;
  history?: Array<{ sender: string; text: string; timestamp?: string | Date }>;
}

const WAITING_MESSAGES: Record<string, string> = {
  SAFE_INSTANT: "Thinking…",
  ACADEMIC_VERIFIED: "Teacher is reviewing your answer",
  RESTRICTED: "Processing…",
};
const STUDENT_TUTOR_WAITING_MESSAGE = WAITING_MESSAGES.ACADEMIC_VERIFIED;
const POLL_INTERVAL_MS = 1200;
const MAX_POLL_ATTEMPTS = 35;

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const inferMode = (question: string): "explain" | "quiz" | "code" | "interactive" => {
  const lowered = question.toLowerCase();
  if (/(quiz|test me|mcq|multiple choice)/.test(lowered)) return "quiz";
  if (/(code|debug|function|script|algorithm|python|javascript|java|sql)/.test(lowered)) {
    return "code";
  }
  if (/(hint|guide me|don't tell me|dont tell me|help me think)/.test(lowered)) {
    return "interactive";
  }
  return "explain";
};

const extractAnswerText = (payload: any): string => {
  // Check every path the backend might put the answer — ordered by specificity
  const candidates = [
    payload?.answer?.content,    // GET /tutor/answer: answer.content
    payload?.content,            // GET /tutor/answer: content (alias added by fix)
    payload?.response,           // GET /tutor/answer: response field
    payload?.answer?.response,   // legacy shape
    payload?.data?.response,     // deep legacy shape
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
};

const extractAnswerType = (payload: any, content: string): string | undefined => {
  const directType = payload?.answer?.type || payload?.type;
  if (typeof directType === "string" && directType.trim()) {
    return directType.trim();
  }

  try {
    const parsed = JSON.parse(content);
    const firstType = parsed?.flow?.[0]?.type;
    return typeof firstType === "string" && firstType.trim() ? firstType.trim() : undefined;
  } catch {
    return undefined;
  }
};

export const processMessage = async (
  question: string,
  options: ProcessMessageOptions = {},
): Promise<ChatResponse> => {
  const startTime = performance.now();
  const {
    userContext,
    userId,
    sessionId,
    provider = "auto",
    topic,
    subject,
    lessonContext,
    assignmentContext,
    history = [],
  } = options;

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

  while (attempts < maxAttempts) {
    try {
      const api = RealAPI.getInstance();
      const mode = inferMode(question);
      const askResponse = await api.fetchAuthorized("/api/student/tutor/ask", {
        method: "POST",
        body: JSON.stringify({
          prompt: question,
          question,
          message: question,
          user_id: userId || "guest",
          session_id: sessionId || "default-session",
          provider,
          mode,
          topic,
          subject,
          history: history.slice(-8).map((item) => ({
            sender: item.sender,
            text: item.text,
            timestamp: item.timestamp,
          })),
          context_filters:
            userContext || topic || lessonContext || assignmentContext || subject
              ? {
                  context: userContext,
                  topic,
                  subject,
                  lesson: lessonContext,
                  assignment: assignmentContext,
                }
              : undefined,
        }),
      }, 20000);

      if (!askResponse.ok) {
        const rawText = await askResponse.text();
        throw new Error(`HTTP ${askResponse.status}: ${rawText}`);
      }

      const askData = await askResponse.json();
      const answerId = askData?.id || askData?.answer_id;
      if (typeof answerId !== "string" || !answerId.trim()) {
        throw new Error("Tutor API did not return an answer id");
      }

      // Determine the tier-specific poll interval:
      // SAFE_INSTANT resolves quickly (~3-5s) so poll faster.
      const tier: string = askData?.tier || "ACADEMIC_VERIFIED";
      const pollInterval = tier === "SAFE_INSTANT" ? 800 : POLL_INTERVAL_MS;
      const maxAttempts = tier === "SAFE_INSTANT" ? 20 : MAX_POLL_ATTEMPTS;

      let answerText = "";
      let answerType: string | undefined;
      let answerPayload: any = null;

      for (let pollAttempt = 0; pollAttempt < maxAttempts; pollAttempt++) {
        const pollResponse = await api.fetchAuthorized(
          `/api/student/tutor/answer/${answerId}`,
          { method: "GET" },
          20000,
        );

        if (!pollResponse.ok) {
          const rawText = await pollResponse.text();
          throw new Error(`HTTP ${pollResponse.status}: ${rawText}`);
        }

        const pollData = await pollResponse.json();
        const status = String(pollData?.status || "").toLowerCase();

        if (status === "completed") {
          answerText = extractAnswerText(pollData);
          answerType = extractAnswerType(pollData, answerText);
          answerPayload = pollData;
          break;
        }

        if (status === "failed") {
          throw new Error(
            pollData?.message || "Tutor answer generation failed.",
          );
        }

        await sleep(pollInterval);
      }

      if (!answerText.trim()) {
        // Polling exhausted — answer isn't ready yet.
        // Return the tier-specific waiting message; do NOT retry the ask.
        const latency = Math.round(performance.now() - startTime);
        const tierMsg = WAITING_MESSAGES[tier] ?? STUDENT_TUTOR_WAITING_MESSAGE;
        const waitingText =
          answerPayload?.message ||
          `${tierMsg}. Check back shortly for the full answer.`;
        sendTelemetry("ai_response_time", latency, { source: "waiting", tier });
        return { text: waitingText, source: "fallback", latency };
      }

      // Success
      const latency = Math.round(performance.now() - startTime);
      sendTelemetry("ai_response_time", latency, {
        source: "api",
        attempt: (attempts + 1).toString(),
      });

      // Cache the result
      cacheResponse(question, answerText).catch((e) =>
        console.warn("Cache write failed", e),
      );

      return {
        text: answerText,
        source: "api",
        latency,
        personalization:
          answerPayload?.personalization ||
          (answerType ? { recommendation: answerType } : undefined),
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
