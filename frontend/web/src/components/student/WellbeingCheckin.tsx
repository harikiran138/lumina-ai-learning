"use client";

import { useState } from "react";
import { Heart, Smile, Meh, Frown, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type Mood = "great" | "okay" | "struggling";

interface WellbeingCheckinProps {
  studentId: string;
  className?: string;
}

export function WellbeingCheckin({ studentId, className }: WellbeingCheckinProps) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!mood) return;
    setIsSubmitting(true);
    try {
      await api.submitWellbeingCheckin({ mood, notes: notes.trim() || null });
      setIsSubmitted(true);
    } catch (error) {
      console.error("wellbeing_checkin_failed", error);
      // Fallback/Silent error handling as per safeguarding policy:
      // "Always return the same response regardless of alert outcome" 
      // but if the network fails we might show a retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={cn("glass-v2-gold p-8 rounded-[2.5rem] text-center space-y-4", className)}>
        <div className="w-16 h-16 bg-lumina-highlight/20 rounded-full flex items-center justify-center mx-auto text-lumina-highlight">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-display font-bold text-white">Mindset Logged</h3>
        <p className="text-gray-400 text-sm">
          Your emotional wellbeing is our priority. Your feedback helps us tailor your learning rhythm.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("glass-v2-gold p-8 rounded-[2.5rem] space-y-6", className)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight">
          <Heart className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-white">Daily Mindset Check</h3>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">Safeguarding & Support</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MoodButton 
          active={mood === "great"} 
          onClick={() => setMood("great")}
          icon={Smile}
          label="Great"
          color="text-emerald-400"
          bg="bg-emerald-400/10"
        />
        <MoodButton 
          active={mood === "okay"} 
          onClick={() => setMood("okay")}
          icon={Meh}
          label="Okay"
          color="text-amber-400"
          bg="bg-amber-400/10"
        />
        <MoodButton 
          active={mood === "struggling"} 
          onClick={() => setMood("struggling")}
          icon={Frown}
          label="Struggling"
          color="text-red-400"
          bg="bg-red-400/10"
        />
      </div>

      <div className="relative group">
        <textarea
          placeholder="Optional: Anything on your mind? (Private note)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-lumina-highlight/30 transition-all resize-none min-h-[100px]"
        />
        <div className="absolute bottom-4 right-4 text-[10px] text-gray-700 font-mono">
          SECURE CHANNEL
        </div>
      </div>

      <button
        disabled={!mood || isSubmitting}
        onClick={handleSubmit}
        className={cn(
          "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all active:scale-95",
          mood && !isSubmitting 
            ? "bg-lumina-highlight text-black shadow-lg shadow-lumina-highlight/10" 
            : "bg-white/[0.04] border border-white/5 text-gray-600 grayscale cursor-not-allowed"
        )}
      >
        {isSubmitting ? "Syncing..." : "Submit Check-in"}
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

function MoodButton({ active, onClick, icon: Icon, label, color, bg }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 group",
        active 
          ? `${bg} border-white/20 scale-105 shadow-xl shadow-black/20` 
          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
      )}
    >
      <Icon className={cn("w-8 h-8 transition-transform group-hover:scale-110", active ? color : "text-gray-500")} />
      <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-white" : "text-gray-600")}>
        {label}
      </span>
    </button>
  );
}
