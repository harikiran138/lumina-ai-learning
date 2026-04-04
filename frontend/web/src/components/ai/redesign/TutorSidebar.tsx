"use client";

import { History, BookOpen, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorSidebarProps {
  sessions: Record<string, any[]>;
  currentSessionId: string;
  onSwitchSession: (id: string) => void;
  onNewChat: () => void;
  studentName?: string;
  subtitle?: string;
  pendingAnswerCount?: number;
}

export function TutorSidebar({
  sessions,
  currentSessionId,
  onSwitchSession,
  onNewChat,
  studentName = "Student",
  subtitle = "Personal learning mode",
  pendingAnswerCount = 0,
}: TutorSidebarProps) {
  const sessionList = Object.keys(sessions).map((sessionId) => {
    const msgs = sessions[sessionId];
    const lastMsg = msgs[msgs.length - 1];
    const firstMsg = msgs[0];
    const preview =
      firstMsg?.text?.substring(0, 30) ||
      `Session ${sessionId.substring(0, 5)}`;
    return {
      id: sessionId,
      preview,
      timestamp: lastMsg?.timestamp || new Date(),
    };
  });
  sessionList.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-lumina-primary" />
          <span className="tracking-wide">MY LEARNING</span>
        </h2>
        <button
          onClick={onNewChat}
          className="p-1.5 glass-button-secondary !border-0 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <div className="p-2 space-y-1 mt-2">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left group">
          <History className="w-4 h-4 text-gray-500 group-hover:text-lumina-primary transition-colors" />
          <span>Recent Activity</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left group">
          <BookOpen className="w-4 h-4 text-gray-500 group-hover:text-lumina-primary transition-colors" />
          <span>Saved Courses</span>
        </button>
      </div>

      {/* Pending answers badge */}
      {pendingAnswerCount > 0 && (
        <div className="mx-2 mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2.5 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-300">
              {pendingAnswerCount} answer{pendingAnswerCount > 1 ? "s" : ""} pending review
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Teacher is reviewing your questions
            </p>
          </div>
        </div>
      )}

      <div className="px-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-4">
        History
      </div>

      {/* Scrollable History */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {sessionList.map((s) => (
          <button
            key={s.id}
            onClick={() => onSwitchSession(s.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border border-transparent group",
              s.id === currentSessionId
                ? "bg-lumina-primary/10 text-white border-lumina-primary/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
            )}
          >
            <div
              className={cn(
                "font-medium truncate",
                s.id === currentSessionId && "text-lumina-primary",
              )}
            >
              {s.preview}
            </div>
            <div className="text-[10px] text-gray-600 mt-1 group-hover:text-gray-500">
              {new Date(s.timestamp).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lumina-primary to-lumina-secondary border border-white/10" />
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-medium text-white truncate">
              {studentName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
