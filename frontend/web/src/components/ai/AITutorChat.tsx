"use client";

import React, { useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  FileText,
  Loader2,
  Plus,
  Cpu,
  Zap,
  BookOpen,
  MoreHorizontal,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { A2UIRenderer } from "@/components/advanced/A2UIRenderer";
import { CoreVisualizer } from "./CoreVisualizer";

function TypewriterText({
  text,
  speed = 10,
}: {
  text: string;
  speed?: number;
}) {
  const [displayedText, setDisplayedText] = React.useState("");

  React.useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

// [FIX] Abstracting Telemetry logic to avoid hydration mismatch
function useTelemetry(isActive: boolean) {
  const [stats, setStats] = React.useState({
    skills: { Analysis: 0, Synthesis: 0, Creativity: 0 },
    mounted: false,
  });

  React.useEffect(() => {
    setStats({
      skills: {
        Analysis: Math.floor(Math.random() * 20) + 75,
        Synthesis: Math.floor(Math.random() * 15) + 80,
        Creativity: Math.floor(Math.random() * 25) + 70,
      },
      mounted: true,
    });
  }, []);

  return stats;
}

interface Message {
  sender: "me" | "AI Tutor";
  text: string;
  timestamp: Date | string;
  source?: string;
  isHidden?: boolean;
  personalization?: {
    behavior?: string;
    recommendation?: string;
    cognitive_load?: number;
    mastery?: Record<string, number>;
  };
}

interface AITutorChatProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  setInput: (val: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onSuggestionClick: (suggestion: string) => void;
  suggestions: string[];
  provider: string;
  providerName: string;
  onAction: (action: string, data: any) => void;
  onAddToNotes: (text: string) => void;
  onNewChat: () => void;
}

export function AITutorChat({
  messages,
  isLoading,
  input,
  setInput,
  onSendMessage,
  onSuggestionClick,
  suggestions,
  provider,
  providerName,
  onAction,
  onAddToNotes,
  onNewChat,
}: AITutorChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const telemetry = useTelemetry(isLoading);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#121212] font-sans">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-lumina-primary/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" />

      {/* Header Bar */}
      <header className="relative z-20 px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lumina-primary/20 to-lumina-secondary/10 border border-lumina-primary/10 flex items-center justify-center shadow-lg shadow-lumina-primary/5">
            <Bot className="w-5 h-5 text-lumina-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">
              Lumina AI Tutor
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Powered by {providerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="hidden md:flex bg-white/5 border-white/10 text-gray-400 text-[10px] px-2 py-1 gap-1.5 font-medium"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLoading ? "bg-amber-400 animate-pulse" : "bg-yellow-500"
              }`}
            />
            {isLoading ? "Processing" : "Ready"}
          </Badge>

          <div className="h-4 w-px bg-white/10 mx-1 hidden md:block" />

          <button
            onClick={onNewChat}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10"
            title="Start New Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Chat Stream */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 md:px-20 py-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          >
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4"
                >
                  <div className="mb-8 relative group">
                    <div className="absolute inset-0 bg-lumina-primary/20 blur-[50px] rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-1000" />
                    <CoreVisualizer isActive={false} />
                  </div>

                  <h2 className="text-2xl font-light text-white mb-2 tracking-tight">
                    How can I help you learn today?
                  </h2>
                  <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                    I can explain complex topics, review your code, or help you
                    solve algorithmic problems.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                    {[
                      {
                        icon: <BookOpen className="w-4 h-4" />,
                        text: "Explain React Hooks",
                      },
                      {
                        icon: <Zap className="w-4 h-4" />,
                        text: "Optimize my SQL query",
                      },
                      {
                        icon: <Cpu className="w-4 h-4" />,
                        text: "Debug this Python script",
                      },
                      {
                        icon: <Lightbulb className="w-4 h-4" />,
                        text: "Generate a quiz on CSS",
                      },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => onSuggestionClick(item.text)}
                        className="flex items-center gap-3 p-3 text-left rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-lumina-primary group-hover:bg-lumina-primary/10 transition-colors">
                          {item.icon}
                        </div>
                        <span className="text-xs text-gray-300 group-hover:text-white font-medium">
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                messages
                  .filter((m) => !m.isHidden)
                  .map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-4 max-w-4xl mx-auto w-full",
                        msg.sender === "me" ? "justify-end" : "justify-start",
                      )}
                    >
                      {msg.sender === "AI Tutor" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lumina-primary/20 to-lumina-secondary/10 border border-lumina-primary/10 flex-shrink-0 flex items-center justify-center mt-1">
                          <Bot className="w-4 h-4 text-lumina-primary" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "flex flex-col gap-1 max-w-[85%]",
                          msg.sender === "me" ? "items-end" : "items-start",
                        )}
                      >
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-xs font-medium text-gray-500">
                            {msg.sender === "me" ? "You" : "Lumina Tutor"}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.sender === "me"
                              ? "bg-lumina-primary text-black font-medium rounded-tr-md"
                              : "bg-[#1A1A1A] border border-white/5 text-gray-200 rounded-tl-md",
                          )}
                        >
                          {msg.sender === "AI Tutor" &&
                          idx === messages.length - 1 &&
                          isLoading ? (
                            <TypewriterText text={msg.text} />
                          ) : (
                            <A2UIRenderer
                              content={msg.text}
                              onAction={onAction}
                              isUser={msg.sender === "me"}
                            />
                          )}
                        </div>

                        {msg.sender === "AI Tutor" && (
                          <div className="flex items-center gap-2 mt-1 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyToClipboard(msg.text)}
                              className="text-gray-600 hover:text-gray-400 p-1 transition-colors"
                              title="Copy"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onAddToNotes(msg.text)}
                              className="text-gray-600 hover:text-gray-400 p-1 transition-colors"
                              title="Add to Notes"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {msg.sender === "me" && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/5 flex-shrink-0 flex items-center justify-center mt-1">
                          <User className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </motion.div>
                  ))
              )}
            </AnimatePresence>

            {isLoading && messages.length > 0 && (
              <div className="flex gap-4 max-w-4xl mx-auto w-full">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lumina-primary/20 to-lumina-secondary/10 border border-lumina-primary/10 flex-shrink-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-lumina-primary animate-spin" />
                </div>
                <div className="flex items-center gap-2 h-10">
                  <span className="text-sm text-gray-500 animate-pulse">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Panel (Desktop Only) */}
        <aside className="hidden xl:flex w-80 flex-col gap-6 p-6 border-l border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#151515] border border-white/5 rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Real-time Analytics
            </h3>

            <div className="space-y-5">
              {/* Cognitive Load Indicator */}
              {messages.length > 0 && messages[messages.length - 1].personalization?.cognitive_load !== undefined ? (
                <div>
                  <div className="flex justify-between text-xs mb-1.5 px-0.5">
                    <span className="text-gray-500">Cognitive Load</span>
                    <span className={cn(
                      "font-mono",
                      (messages[messages.length - 1].personalization?.cognitive_load ?? 0) > 70 ? "text-red-400" : "text-lumina-primary"
                    )}>
                      {messages[messages.length - 1].personalization?.cognitive_load}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full",
                        (messages[messages.length - 1].personalization?.cognitive_load ?? 0) > 70 ? "bg-red-500/80" : "bg-lumina-primary/80"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${messages[messages.length - 1].personalization?.cognitive_load}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              ) : (
                /* Fallback Telemetry */
                Object.entries(telemetry.skills).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">{key}</span>
                      <span className="text-gray-300 font-mono">
                        {telemetry.mounted ? `${value}%` : "--"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-lumina-primary/80"
                        initial={{ width: 0 }}
                        animate={{ width: telemetry.mounted ? `${value}%` : 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))
              )}

              {/* Mastery Level Visualization */}
              {messages.length > 0 && messages[messages.length - 1].personalization?.mastery && (
                <div className="pt-2 border-t border-white/5">
                  <h4 className="text-[10px] font-bold text-gray-600 uppercase mb-3 px-0.5">Focus Areas Mastery</h4>
                  <div className="space-y-3">
                    {Object.entries(messages[messages.length - 1].personalization?.mastery || {}).map(([skill, level], i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400 truncate max-w-[120px]">{skill}</span>
                          <span className="text-white font-mono">{(level * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-lumina-secondary" 
                            initial={{ width: 0 }}
                            animate={{ width: `${level * 100}%` }}
                            transition={{ delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-lumina-primary/5 to-transparent border border-lumina-primary/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-lumina-primary" />
              <h3 className="text-xs font-semibold text-lumina-primary">
                Learning Tip
              </h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Start with specific questions to get more targeted examples. You
              can ask for code snippets, explanations, or debugging help.
            </p>
          </div>
        </aside>
      </div>

      {/* Input Area */}
      <div className="relative z-20 p-6 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={onSendMessage}
            className="relative flex items-end gap-3 p-2 bg-[#151515] border border-white/10 rounded-2xl focus-within:ring-1 focus-within:ring-lumina-primary/30 transition-all"
          >
            <div className="pl-3 pb-3 text-gray-500">
              <MoreHorizontal className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Ask anything about coding, algorithms, or system design..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-600 font-sans text-sm py-3 max-h-32 resize-none"
              style={{ minHeight: "44px", fieldSizing: "content" } as any}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 mb-1",
                input.trim() && !isLoading
                  ? "bg-lumina-primary text-black hover:bg-lumina-secondary shadow-lg shadow-lumina-primary/20"
                  : "bg-white/5 text-gray-600 cursor-not-allowed",
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center mt-3">
            <p className="text-[10px] text-gray-600">
              Lumina AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
