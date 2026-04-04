"use client";

import { Send, Paperclip, Mic, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { A2UIRendererV2 } from "@/components/a2ui/A2UIRendererV2";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender: "me" | "ai";
  text: string;
  timestamp: Date | string;
  a2ui_component?: any; // For structured blocks rendering
}

interface TutorConversationProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  input: string;
  setInput: (t: string) => void;
  onAction?: (action: string, data: any) => void;
  suggestions?: string[];
  onSuggestionClick?: (text: string) => void;
}

export function TutorConversation({
  messages,
  isLoading,
  onSendMessage,
  input,
  setInput,
  suggestions = [],
  onSuggestionClick,
}: TutorConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full relative font-sans">
      {/* Chat Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-[5%] md:px-[10%] xl:px-[15%] py-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-lumina-primary/10 to-transparent border border-lumina-primary/20 flex items-center justify-center mb-8 shadow-[0_0_50px_-12px_rgba(255,215,0,0.3)] animate-float">
                <Bot className="w-10 h-10 text-lumina-primary" />
              </div>
              <h3 className="text-3xl font-light text-white mb-3 tracking-tight">
                Lumina Tutor{" "}
                <span className="font-semibold text-lumina-primary">AI</span>
              </h3>
              <p className="text-sm text-gray-400 max-w-sm mb-10 leading-relaxed">
                Your personal AI mentor for mastering concepts, assignments, and
                study plans. Ask me to{" "}
                <span className="text-gray-200 border-b border-white/10 pb-0.5">
                  explain concepts
                </span>
                ,{" "}
                <span className="text-gray-200 border-b border-white/10 pb-0.5">
                  build a quiz
                </span>
                , or{" "}
                <span className="text-gray-200 border-b border-white/10 pb-0.5">
                  simplify a difficult topic
                </span>
                .
              </p>

              {suggestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg w-full">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => onSuggestionClick?.(s)}
                      className="p-4 text-sm text-gray-400 glass-card bg-surface-800/40 hover:bg-surface-800/80 transition-all duration-300 text-left flex items-center gap-3 group border-white/5 hover:border-lumina-primary/30"
                    >
                      <div className="w-2 h-2 rounded-full bg-lumina-primary/30 group-hover:bg-lumina-primary group-hover:shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all" />
                      <span className="group-hover:text-white transition-colors">
                        {s}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "w-full flex flex-col gap-1",
                msg.sender === "me" ? "items-end" : "items-start",
              )}
            >
              <div className="flex items-center gap-2 mb-1 px-1 opacity-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {msg.sender === "me" ? "You" : "Lumina AI"}
                </span>
                <span className="text-[10px] text-gray-600">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {msg.sender === "me" ? (
                <div className="chat-bubble-me max-w-[85%] text-sm leading-relaxed shadow-lg shadow-lumina-primary/5">
                  {msg.text}
                </div>
              ) : (
                <div className="w-full max-w-3xl flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="w-8 h-8 rounded-xl bg-surface-800 border border-white/10 flex-shrink-0 flex items-center justify-center mt-1 shadow-lg">
                    <Bot className="w-4 h-4 text-lumina-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="chat-bubble-ai text-sm leading-relaxed glass-panel !bg-surface-900/40 !border-white/5 shadow-none">
                      <A2UIRendererV2 content={msg.text} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-4 w-full max-w-3xl pl-1"
            >
              <div className="w-8 h-8 rounded-xl bg-surface-800 border border-white/10 flex-shrink-0 flex items-center justify-center shadow-lg">
                <Bot className="w-4 h-4 text-lumina-primary animate-pulse" />
              </div>
              <div className="chat-bubble-ai flex items-center gap-3 px-5 py-4 glass-panel !bg-surface-900/40 !border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-lumina-primary/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-lumina-primary/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-lumina-primary/80 rounded-full animate-bounce" />
                </div>
                <span className="text-xs text-gray-500 font-medium tracking-wide">
                  Teacher is reviewing your answer
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area (Sticky Bottom) */}
      <div className="p-6 pb-8 bg-gradient-to-t from-[#02040a] via-[#02040a] to-transparent z-10 w-full flex flex-col items-center gap-4 backdrop-blur-sm">
        {/* Dynamic Suggestions */}
        {messages.length > 0 && suggestions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto max-w-3xl w-full pb-2 scrollbar-none mask-fade-sides">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(s)}
                className="px-4 py-1.5 text-xs font-medium text-gray-400 bg-surface-800/50 border border-white/10 rounded-full hover:bg-lumina-primary/10 hover:border-lumina-primary/30 hover:text-white transition-all whitespace-nowrap backdrop-blur-md"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl relative flex items-center gap-2 glass-panel !rounded-2xl p-2 !bg-surface-900/60 transition-all focus-within:border-lumina-primary/30 focus-within:shadow-[0_0_30px_-10px_rgba(255,215,0,0.1)] focus-within:bg-black/80"
        >
          <button
            type="button"
            className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors group"
          >
            <Paperclip className="w-5 h-5 group-hover:text-lumina-primary transition-colors" />
          </button>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Ask Lumina Tutor"
            placeholder="Ask about a concept, assignment, weak topic, or quiz..."
            className="flex-1 bg-transparent border-none outline-none text-base text-gray-100 placeholder-gray-600 h-10 px-2 font-light tracking-wide focus:ring-0"
          />

          <button
            type="button"
            className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors group"
          >
            <Mic className="w-5 h-5 group-hover:text-lumina-primary transition-colors" />
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className={cn(
              "p-3 rounded-xl transition-all duration-300 flex items-center justify-center",
              input.trim() && !isLoading
                ? "bg-lumina-primary text-black shadow-lg shadow-lumina-primary/20 hover:scale-105 active:scale-95 hover:bg-lumina-secondary"
                : "bg-white/5 text-gray-600 cursor-not-allowed",
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <p className="text-[10px] text-gray-600 font-medium tracking-wide">
          Lumina AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}
