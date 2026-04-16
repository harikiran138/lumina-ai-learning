"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Settings,
  User,
  Bell,
  Shield,
  Zap,
  Cpu,
  Globe,
  Palette,
  Save,
  ChevronRight,
  Sparkles,
  Database,
  Lock,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export default function TeacherSettingsPage() {
  const [activeSection, setActiveSection] = useState("AI Configuration");
  const [userName, setUserName] = useState("Teacher");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("T");

  useEffect(() => {
    api.getCurrentUser().then((user) => {
      if (user) {
        setUserName(user.name || "Teacher");
        setUserEmail(user.email || "");
        setUserInitials(
          (user.name || "T")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        );
      }
    });
  }, []);

  const sections = [
    { name: "Profile", icon: User },
    { name: "Notifications", icon: Bell },
    { name: "AI Configuration", icon: Cpu },
    { name: "Privacy & Security", icon: Shield },
    { name: "Content Defaults", icon: Database },
    { name: "Appearance", icon: Palette },
  ];

  return (
    <div className="min-h-screen space-y-8 p-8 flex flex-col">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">Settings</h1>
          <p className="mt-2 text-text-muted">Configure your teaching environment, AI sensitivity, and notification preferences.</p>
        </div>
        <button className="flex items-center gap-2 rounded-2xl bg-warning px-6 py-3 font-bold text-warning-foreground hover:bg-warning/80 transition-all shadow-[0_0_30px_rgba(251,191,36,0.2)]">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </header>

      <div className="grid lg:grid-cols-[300px_1fr] gap-12 flex-1">
        <aside className="space-y-2">
          {sections.map(section => (
            <button
              key={section.name}
              onClick={() => setActiveSection(section.name)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                activeSection === section.name 
                  ? "bg-warning text-warning-foreground shadow-[0_0_20px_rgba(251,191,36,0.1)]" 
                  : "text-text-muted hover:text-foreground hover:bg-surface"
              )}
            >
              <section.icon className="h-5 w-5" />
              {section.name}
            </button>
          ))}
        </aside>

        <main className="glass-v2 border-border rounded-3xl p-10 space-y-12">
          {activeSection === "AI Configuration" && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground uppercase tracking-tight mb-2">AI Pedagogical Engine</h3>
                <p className="text-sm text-text-muted">Fine-tune how Lumina AI interacts with your students and grades assignments.</p>
              </div>

              <div className="space-y-8">
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground uppercase mb-1">Grading Strictness</p>
                      <p className="text-xs text-text-secondary">Controls semantic similarity thresholds for auto-grading.</p>
                    </div>
                    <span className="text-warning font-display font-bold text-xl">High</span>
                  </div>
                  <input type="range" className="w-full accent-warning" />
                  <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    <span>Lenient</span>
                    <span>Balanced</span>
                    <span>Strict</span>
                  </div>
                </section>

                <div className="h-px bg-border" />

                <section className="space-y-4">
                   <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                           <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground uppercase">AI Tutor Proactivity</p>
                          <p className="text-xs text-text-secondary">Let AI suggest interventions before student asks.</p>
                        </div>
                      </div>
                      <div className="h-6 w-11 rounded-full bg-warning relative p-1 cursor-pointer">
                        <div className="h-4 w-4 rounded-full bg-background ml-auto" />
                      </div>
                   </div>

                   <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                           <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground uppercase">Causal Inference Model</p>
                          <p className="text-xs text-text-secondary">Use deep behavioral analytics for A/B testing.</p>
                        </div>
                      </div>
                      <div className="h-6 w-11 rounded-full bg-surface-elevated relative p-1 cursor-pointer">
                        <div className="h-4 w-4 rounded-full bg-text-secondary" />
                      </div>
                   </div>
                </section>

                <div className="p-6 rounded-3xl bg-warning/10 border border-warning/20 flex gap-4">
                  <Sparkles className="h-6 w-6 text-warning shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-warning uppercase">Self-Learning Mode</p>
                    <p className="text-xs text-text-muted leading-relaxed italic">
                      Lumina is currently calibrating based on 124 manual grading overrides from the last 30 days. Your specific pedagogical style is being mapped into the LLM context.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === "Profile" && (
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-8"
            >
              <div className="flex items-center gap-8">
                 <div className="h-24 w-24 rounded-full bg-gradient-to-br from-surface to-surface-elevated border border-border flex items-center justify-center text-3xl font-bold text-foreground uppercase italic">
                    {userInitials}
                 </div>
                 <button className="px-6 py-2 rounded-xl bg-surface border border-border text-sm font-bold text-foreground hover:bg-surface-elevated transition-all">
                   Change Avatar
                 </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full rounded-2xl bg-surface border border-border p-4 text-sm text-foreground focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full rounded-2xl bg-surface border border-border p-4 text-sm text-foreground focus:outline-none" />
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
