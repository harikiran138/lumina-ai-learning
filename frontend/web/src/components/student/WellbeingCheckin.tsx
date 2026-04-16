"use client";

import { useState } from "react";
import { Heart, Smile, Meh, Frown, Send, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface WellbeingCheckinProps {
  studentId: string;
}

export function WellbeingCheckin({ studentId }: WellbeingCheckinProps) {
  const [mood, setMood] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  const moods = [
    { id: "awesome", icon: Heart, label: "Awesome", color: "text-accent", bg: "bg-accent/10" },
    { id: "good", icon: Smile, label: "Good", color: "text-primary", bg: "bg-primary/10" },
    { id: "okay", icon: Meh, label: "Okay", color: "text-primary", bg: "bg-primary/10" },
    { id: "struggling", icon: Frown, label: "Struggling", color: "text-text-muted", bg: "bg-surface" },
  ];

  const handleSubmit = async () => {
    if (!mood) return;
    setIsSubmitting(true);
    try {
      await api.studentSubmitWellbeing(studentId, mood, notes);
      toast.success("Mood metrics synchronized.");
      setMood(null);
      setNotes("");
    } catch (e) {
      toast.error("Failed to sync wellbeing data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-v2-gold rounded-[2.5rem] p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-display font-bold text-text">Biological Check-in</h3>
          <p className="text-text-secondary text-sm">How is your cognitive state today?</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-surface border border-border flex items-center justify-center text-lumina-highlight">
          <Heart className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {moods.map((m) => (
          <button
            key={m.id}
            onClick={() => setMood(m.id)}
            className={cn(
              "relative group p-6 rounded-3xl border-2 transition-all duration-500 overflow-hidden",
              mood === m.id 
                ? "border-primary bg-primary/5 scale-105" 
                : "border-border bg-surface hover:bg-surface-elevated hover:border-primary/40"
            )}
          >
            <div className={cn(
              "relative z-10 flex flex-col items-center gap-3",
              mood === m.id ? "text-text" : "text-text-secondary"
            )}>
              <m.icon className={cn("w-8 h-8 transition-transform group-hover:scale-110", m.color)} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{m.label}</span>
            </div>
            
            {mood === m.id && (
              <div className="absolute inset-0 bg-primary/10 animate-in fade-in duration-500" />
            )}
            
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
          </button>
        ))}
      </div>

      <div className="relative group">
        <textarea
          placeholder="Any mental blocks or specific challenges today?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-surface border border-border rounded-2xl p-4 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/40 transition-all resize-none min-h-[100px]"
        />
        <div className="absolute bottom-4 right-4 text-[10px] text-text-muted font-mono">
          SECURE CHANNEL
        </div>
      </div>

      {mood && (
        <div className="p-4 rounded-2xl bg-surface border border-border animate-in slide-in-from-bottom-2">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Smile className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-text uppercase tracking-widest">System Note</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {mood === "struggling" 
                  ? "Cognitive load warning detected. The AI tutor will adjust to a supportive, slower-paced interaction mode."
                  : "High momentum state active. Optimal period deeply complex neural connections and rapid learning."}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        disabled={!mood || isSubmitting}
        onClick={handleSubmit}
        className={cn(
          "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all active:scale-95",
          mood && !isSubmitting 
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
            : "bg-surface border border-border text-text-muted grayscale cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            Syncing...
          </>
        ) : (
          <>
            {mood ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            Submit Check-in
          </>
        )}
      </button>
    </div>
  );
}
