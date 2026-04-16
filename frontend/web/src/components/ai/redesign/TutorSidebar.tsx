"use client";

import { History, BookOpen, Plus, Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/BackButton";

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
    <div className="h-full flex flex-col bg-surface border-r border-border">
      {/* Back Button */}
      <div className="px-4 py-2">
        <BackButton href="/student/dashboard" label="Back to Dashboard" className="mb-0 text-xs" />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface-elevated">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="tracking-wide">MY LEARNING</span>
        </h2>
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-elevated transition-colors border border-border"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <div className="p-2 space-y-1 mt-2">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text hover:bg-surface-elevated transition-all text-left group">
          <History className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
          <span>Recent Activity</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text hover:bg-surface-elevated transition-all text-left group">
          <BookOpen className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
          <span>Saved Courses</span>
        </button>
      </div>

      {/* Pending answers badge */}
      {pendingAnswerCount > 0 && (
        <div className="mx-2 mt-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary">
              {pendingAnswerCount} answer{pendingAnswerCount > 1 ? "s" : ""} pending review
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Teacher is reviewing your questions
            </p>
          </div>
        </div>
      )}

      <div className="px-4 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest mt-4">
        History
      </div>

      {/* Scrollable History */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {sessionList.map((s) => (
          <button
            key={s.id}
            onClick={() => onSwitchSession(s.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border border-transparent group",
              s.id === currentSessionId
                ? "bg-primary/10 text-text border-primary/20 shadow-sm"
                : "text-text-secondary hover:bg-surface-elevated hover:text-text",
            )}
          >
            <div
              className={cn(
                "font-medium truncate",
                s.id === currentSessionId && "text-primary",
              )}
            >
              {s.preview}
            </div>
            <div className="text-[10px] text-text-muted mt-1 group-hover:text-text-secondary transition-colors">
              {new Date(s.timestamp).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-border bg-surface-elevated">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent border border-white/10" />
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-medium text-text truncate">
              {studentName}
            </div>
            <div className="text-xs text-text-secondary truncate">
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
