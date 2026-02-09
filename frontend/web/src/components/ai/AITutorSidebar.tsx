"use client";

import React from "react";
import {
  History,
  Plus,
  MessageSquare,
  Calendar,
  Settings,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Session {
  id: string;
  messages: any[];
}

interface AITutorSidebarProps {
  sessions: Record<string, any[]>;
  currentSessionId: string;
  onSwitchSession: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function AITutorSidebar({
  sessions,
  currentSessionId,
  onSwitchSession,
  onNewChat,
  isOpen,
  onToggle,
}: AITutorSidebarProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const sessionEntries = Object.entries(sessions).reverse();

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          width: isOpen ? (isHovered ? "300px" : "64px") : "0px",
          x: isOpen ? 0 : -300,
        }}
        className={cn(
          "fixed lg:relative z-50 h-full bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col overflow-hidden transition-all duration-500 ease-in-out hide-scrollbar",
          !isOpen && "lg:w-0 border-none",
          isOpen && !isHovered && "items-center",
        )}
      >
        <div
          className={cn(
            "p-5 flex flex-col h-full transition-all duration-500",
            isOpen && !isHovered ? "w-16 items-center px-2" : "w-[300px]",
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center justify-between mb-6 transition-all duration-500",
              isOpen && !isHovered ? "flex-col gap-4" : "flex-row",
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-lumina-primary/20 flex items-center justify-center border border-lumina-primary/30 shadow-lg shadow-lumina-primary/10">
                <History className="w-4 h-4 text-lumina-primary" />
              </div>
              <h2
                className={cn(
                  "text-sm white font-bold tracking-tight transition-all duration-500 whitespace-nowrap overflow-hidden",
                  isOpen && !isHovered ? "opacity-0 w-0" : "opacity-100 w-auto",
                )}
              >
                Chat History
              </h2>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className={cn(
              "flex items-center bg-lumina-primary text-black rounded-xl font-bold text-xs mb-6 hover:bg-lumina-primary/90 transition-all shadow-lg shadow-lumina-primary/20 active:scale-95 group overflow-hidden whitespace-nowrap",
              isOpen && !isHovered
                ? "w-10 h-10 justify-center p-0"
                : "w-full px-3.5 py-2.5 gap-2.5",
            )}
          >
            <Plus
              className={cn(
                "w-4 h-4 group-hover:rotate-90 transition-transform duration-300 shrink-0",
              )}
            />
            <span
              className={cn(
                "transition-all duration-500",
                isOpen && !isHovered ? "opacity-0 w-0" : "opacity-100 w-auto",
              )}
            >
              New Chat Session
            </span>
          </button>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6 lg:pr-1">
            <div className="space-y-2">
              <p
                className={cn(
                  "text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 transition-all duration-500 whitespace-nowrap overflow-hidden",
                  isOpen && !isHovered
                    ? "opacity-0 h-0 my-0"
                    : "opacity-100 h-auto",
                )}
              >
                Recent Conversations
              </p>

              {sessionEntries.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p
                    className={cn(
                      "text-xs text-gray-600 italic transition-all duration-500 overflow-hidden",
                      isOpen && !isHovered
                        ? "opacity-0 h-0"
                        : "opacity-100 h-auto",
                    )}
                  >
                    No history yet
                  </p>
                </div>
              ) : (
                sessionEntries.map(([sId, msgs]) => {
                  if (msgs.length === 0) return null;
                  const isActive = sId === currentSessionId;
                  const lastMsg = msgs[msgs.length - 1];
                  const firstMsg = msgs[0];

                  return (
                    <motion.div
                      key={sId}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => onSwitchSession(sId)}
                      className={cn(
                        "group rounded-xl cursor-pointer transition-all duration-300 border relative",
                        isOpen && !isHovered
                          ? "w-10 h-10 flex items-center justify-center p-0 mx-auto"
                          : "p-3.5 w-full",
                        isActive
                          ? "bg-lumina-primary/10 border-lumina-primary/40 shadow-lg shadow-lumina-primary/5"
                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10",
                      )}
                    >
                      {isOpen && !isHovered ? (
                        <MessageSquare
                          className={cn(
                            "w-4 h-4 transition-colors",
                            isActive
                              ? "text-lumina-primary"
                              : "text-gray-500 group-hover:text-gray-300",
                          )}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-[11px] line-clamp-2 transition-colors leading-relaxed",
                                isActive
                                  ? "text-white font-bold"
                                  : "text-gray-400 group-hover:text-gray-200",
                              )}
                            >
                              {firstMsg.text}
                            </p>
                            <div
                              className={cn(
                                "w-1 h-1 rounded-full mt-1 shrink-0",
                                isActive
                                  ? "bg-lumina-primary shadow-[0_0_8px_rgba(255,215,0,0.6)]"
                                  : "bg-transparent",
                              )}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                              <Calendar className="w-2.5 h-2.5 opacity-50" />
                              {new Date(lastMsg.timestamp).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </div>
                            <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-gray-500 border border-white/5 font-bold">
                              {msgs.length} MSG
                            </span>
                          </div>
                        </>
                      )}

                      {/* Tooltip for mini mode */}
                      {isOpen && !isHovered && (
                        <div className="absolute left-full ml-4 px-2 py-1 bg-black/90 border border-white/10 rounded-md text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60]">
                          {firstMsg.text.substring(0, 30)}...
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Settings */}
          <div className="mt-auto pt-4 border-t border-white/5">
            <button
              className={cn(
                "flex items-center text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all text-xs font-bold group overflow-hidden whitespace-nowrap",
                isOpen && !isHovered
                  ? "w-10 h-10 justify-center p-0 mx-auto"
                  : "w-full px-3 py-2.5 gap-3",
              )}
            >
              <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform shrink-0" />
              <span
                className={cn(
                  "transition-all duration-500",
                  isOpen && !isHovered ? "opacity-0 w-0" : "opacity-100 w-auto",
                )}
              >
                Tutor Preferences
              </span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
