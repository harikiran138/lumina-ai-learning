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
  MessageSquare,
  History,
  Plus,
  MoreVertical,
  Cpu,
  Cloud,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { A2UIRenderer } from "@/components/advanced/A2UIRenderer";

interface Message {
  sender: "me" | "AI Tutor";
  text: string;
  timestamp: Date | string;
  source?: string;
  isHidden?: boolean;
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-lumina-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lumina-primary/20 to-lumina-primary/5 flex items-center justify-center mb-5 border border-lumina-primary/20 shadow-2xl shadow-lumina-primary/10">
                <Bot className="w-8 h-8 text-lumina-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                How can I assist you today?
              </h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-xs">
                I'm your Lumina AI Tutor. Ask me to explain concepts, create
                quizzes, or help with your assignments.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {[
                  "Create a Python quiz",
                  "Explain React Hooks",
                  "Summarize my notes",
                  "Help with SQL query",
                ].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => onSuggestionClick(hint)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:border-lumina-primary/30 transition-all text-left group"
                  >
                    <span className="group-hover:text-lumina-primary transition-colors">
                      {hint}
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
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex items-start gap-4 group",
                    msg.sender === "me" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                      msg.sender === "me"
                        ? "bg-white/5 border border-white/10"
                        : "bg-gradient-to-br from-lumina-primary to-lumina-primary/60 border border-lumina-primary/20",
                    )}
                  >
                    {msg.sender === "me" ? (
                      <User className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Bot className="w-5 h-5 text-black" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex flex-col max-w-[85%] md:max-w-[70%]",
                      msg.sender === "me" ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "p-3.5 rounded-2xl relative transition-all duration-300",
                        msg.sender === "me"
                          ? "bg-lumina-primary/10 border border-lumina-primary/20 text-white rounded-tr-none"
                          : "glass-card bg-white/5 border-white/10 text-gray-200 rounded-tl-none hover:bg-white/[0.07]",
                      )}
                    >
                      <div className="text-sm leading-relaxed">
                        <A2UIRenderer
                          content={msg.text}
                          onAction={onAction}
                          isUser={msg.sender === "me"}
                        />
                      </div>

                      {msg.sender !== "me" && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onAddToNotes(msg.text)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <FileText className="w-2.5 h-2.5" /> Save to Notes
                          </button>
                          <button
                            onClick={() => copyToClipboard(msg.text)}
                            className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 px-1">
                      <span className="text-[10px] text-gray-500 font-medium">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {msg.source && (
                        <>
                          <span className="text-gray-700">•</span>
                          <span className="text-[10px] text-lumina-primary/60 font-semibold uppercase tracking-widest">
                            {msg.source}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
          )}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-lumina-primary/10 flex items-center justify-center shrink-0 border border-lumina-primary/20">
              <Bot className="w-5 h-5 text-lumina-primary animate-pulse" />
            </div>
            <div className="glass-card bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-lumina-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 bg-lumina-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-1 bg-lumina-primary rounded-full animate-bounce"></span>
                </div>
                <span className="text-xs font-medium text-gray-500 tracking-wide">
                  Lumina is thinking...
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area Overlay */}
      <div className="px-4 pb-6 mt-auto relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {/* Suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-2 overflow-x-auto pb-1 no-scrollbar justify-center md:justify-start"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick(s)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full glass-card bg-white/5 border-white/10 text-[10px] font-bold text-gray-400 hover:bg-lumina-primary/10 hover:border-lumina-primary/40 hover:text-white transition-all active:scale-95 shadow-lg uppercase tracking-tight"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form
            onSubmit={onSendMessage}
            className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-xl p-1.5 flex items-center gap-2 shadow-2xl focus-within:border-lumina-primary/40 transition-all shadow-black/40"
          >
            <div className="flex items-center gap-2 px-2.5 border-r border-white/10 hidden md:flex">
              <Bot className="w-3.5 h-3.5 text-lumina-primary/60" />
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Message Lumina..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-500 text-sm py-3 px-2 outline-none"
            />

            <div className="flex items-center gap-2 p-1">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg active:scale-90",
                  input.trim() && !isLoading
                    ? "bg-lumina-primary text-black hover:scale-105"
                    : "bg-white/5 text-gray-600 cursor-not-allowed",
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

          <div className="flex items-center justify-center gap-6 px-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                {providerName}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 italic">
              Lumina AI can make mistakes. Verify important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
