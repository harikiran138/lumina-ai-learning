"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Brain,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AssessmentPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "question" | "feedback" | "completed"
  >("idle");
  const [question, setQuestion] = useState<any>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [telemetry, setTelemetry] = useState({
    paste_detected: false,
    backspace_count: 0,
    typing_variance: 0,
    char_count: 0,
  });

  const [feedback, setFeedback] = useState<any>(null);
  const [completionReason, setCompletionReason] = useState<string>("");
  const [report, setReport] = useState<any>(null);
  const [topic, setTopic] = useState<string>("Python Programming");
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      setTelemetry((prev) => ({ ...prev, backspace_count: prev.backspace_count + 1 }));
    }
  };

  const handlePaste = () => {
    setTelemetry((prev) => ({ ...prev, paste_detected: true }));
  };

  // API Base URL - fallback to 8001 if env not set
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE
    ? `${process.env.NEXT_PUBLIC_API_BASE}/api/assessment`
    : "http://localhost:8000/api/assessment";

  const startAssessment = async () => {
    console.log("Starting assessment, connecting to:", API_BASE);
    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: "demo_student",
          topic: topic,
          num_questions: numQuestions,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `API Error: ${res.status} ${res.statusText} - ${errorText}`,
        );
      }

      const data = await res.json();
      setSessionId(data.id); // Updated from data.session_id
      await loadNextQuestion(data.id);
    } catch (err) {
      console.error("Assessment start failed:", err);
      setCompletionReason(
        `Failed to connect to assessment server (${API_BASE}). Ensure backend is running on port 8001.`,
      );
      setStatus("completed");
    }
  };

  const fetchReport = async (sid: string) => {
    try {
      const res = await fetch(`${API_BASE}/report/${sid}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Report error: ${res.status} ${txt}`);
      }
      const data = await res.json();
      setReport(data);
      setCompletionReason(data.summary ?? "Assessment finished.");
    } catch (err) {
      console.error("Failed to load report:", err);
      setCompletionReason(
        "Assessment finished. (Could not load detailed report.)",
      );
    } finally {
      setStatus("completed");
    }
  };

  const [startTime, setStartTime] = useState<number>(0);

  const loadNextQuestion = async (sid: string) => {
    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/next-question/${sid}`);

      if (!res.ok) {
        if (res.status === 404) {
          setCompletionReason("Session not found or expired.");
        } else {
          setCompletionReason(`Server error (${res.status})`);
        }
        setStatus("completed");
        return;
      }

      const data = await res.json();

      if (!data) {
        // Assessment complete (Backend returned null which means no more questions)
        if (sid) {
          await fetchReport(sid);
        } else {
          setCompletionReason("Assessment Finished!");
          setStatus("completed");
        }
        return;
      }

      setQuestion(data);
      setStartTime(Date.now());
      setSelectedOptionId("");
      setSelectedAnswer("");
      setTelemetry({
        paste_detected: false,
        backspace_count: 0,
        typing_variance: 0.1, // mock
        char_count: 0,
      });
      setFeedback(null);
      setReport(null);
      setStatus("question");
    } catch (err) {
      console.error(err);
      setCompletionReason("Error loading question.");
      setStatus("completed");
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || !question) return;

    const isMCQ = question.format === "mcq";
    if (isMCQ && !selectedOptionId) return;
    if (!isMCQ && !selectedAnswer) return;

    setStatus("loading");

    const timeTaken = (Date.now() - startTime) / 1000;
    const finalTelemetry = {
      ...telemetry,
      char_count: selectedAnswer.length || 0,
      think_time_seconds: timeTaken,
    };

    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          selected_option_id: isMCQ ? selectedOptionId : null,
          selected_answer: isMCQ ? null : selectedAnswer,
          telemetry: finalTelemetry,
          time_taken: timeTaken,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Submit failed: ${res.status} ${errText}`);
      }

      const data = await res.json();
      const lastResponse = data.responses[data.responses.length - 1];

      const feedbackData = {
        is_correct: lastResponse.is_correct,
        score: lastResponse.score,
        explanation: lastResponse.analysis?.feedback || question.explanation,
        mastery_update: { current_difficulty: data.current_difficulty },
      };

      setFeedback(feedbackData);
      setStatus("feedback");
    } catch (err) {
      console.error(err);
      setStatus("question"); // Allow retry on error
    }
  };

  const finishAssessment = async () => {
    if (!sessionId) return;
    if (confirm("Are you sure you want to end the assessment early?")) {
      setStatus("loading");
      try {
        await fetch(`${API_BASE}/complete/${sessionId}`, { method: "POST" });
        // After manual completion, load the summary report
        await fetchReport(sessionId);
      } catch (err) {
        console.error("Failed to finish:", err);
        // Force complete
        setStatus("completed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 pl-80">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
            Adaptive Assessment
          </h1>
          <p className="text-gray-400">
            AI-powered personalized testing engine
          </p>
        </header>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                    <Brain className="w-8 h-8 text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl text-white">
                    Ready for your assessment?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-400 space-y-4">
                  <p>Configure your adaptive assessment session:</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <input
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Quantum Physics, History, Python"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Questions</Label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                        value={numQuestions}
                        onChange={(e) =>
                          setNumQuestions(parseInt(e.target.value) || 5)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={startAssessment}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    Start Assessment <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {status === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center py-20"
            >
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            </motion.div>
          )}

          {status === "question" && question && (
            <motion.div
              key="question"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                    <span>Difficulty: {question.difficulty}</span>
                    <span className="px-2 py-1 rounded bg-white/10">
                      {question.topic}
                    </span>
                  </div>
                  <CardTitle className="text-xl text-white leading-relaxed">
                    {question.text}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {question.format === "mcq" ? (
                    <RadioGroup
                      value={selectedOptionId}
                      onValueChange={setSelectedOptionId}
                      className="space-y-4"
                    >
                      {question.options.map((opt: any, i: number) => (
                        <div
                          key={opt.id}
                          className="flex items-center space-x-2 p-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <RadioGroupItem
                            value={opt.id}
                            id={`opt-${opt.id}`}
                            className="border-white/20 text-purple-500"
                          />
                          <Label
                            htmlFor={`opt-${opt.id}`}
                            className="text-gray-300 font-normal cursor-pointer flex-1"
                          >
                            {opt.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono text-sm"
                        placeholder="Type your answer here..."
                        value={selectedAnswer}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                      />
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        Semantic Analysis Active
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end pt-4">
                  <Button
                    onClick={submitAnswer}
                    disabled={question.format === "mcq" ? !selectedOptionId : !selectedAnswer}
                    className="bg-purple-600 hover:bg-purple-700 ml-4"
                  >
                    Submit Answer
                  </Button>
                  <Button
                    onClick={finishAssessment}
                    variant="ghost"
                    className="text-gray-400 hover:text-white mr-auto"
                  >
                    End Test
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {status === "feedback" && feedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card
                className={`border backdrop-blur-xl ${
                  feedback.is_correct
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {feedback.is_correct ? (
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-400" />
                    )}
                    <CardTitle className="text-white">
                      {feedback.is_correct ? "Excellent!" : "Not quite right"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-yellow-400 text-sm font-semibold mb-1">
                      Feedback
                    </p>
                    <p className="text-gray-300">{feedback.explanation}</p>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    New Difficulty Level:{" "}
                    {feedback?.mastery_update?.current_difficulty?.toFixed(2) ??
                      "N/A"}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => loadNextQuestion(sessionId!)}
                    className="w-full bg-white text-black hover:bg-gray-200"
                  >
                    Next Question <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {status === "completed" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 space-y-6"
            >
              <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-glow">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Assessment Completed
                </h2>
                <p className="text-gray-400 max-w-md mx-auto mb-4">
                  {completionReason}
                </p>
                {report && (
                  <div className="max-w-md mx-auto text-sm text-left bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                    <p className="text-gray-300">
                      <span className="font-semibold">Accuracy:</span>{" "}
                      {(report.accuracy * 100).toFixed(0)}%
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold">Correct:</span>{" "}
                      {report.correct_answers} / {report.total_questions}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold">Level:</span>{" "}
                      {report.level}
                    </p>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  setStatus("idle");
                  setReport(null);
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Return to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
