"use client";

import Link from "next/link";
import { MoveRight, Shield, Zap, FileText, CheckCircle } from "lucide-react";

const floatingCards = [
  {
    icon: CheckCircle,
    label: "AI Answer Verified",
    sub: "Teacher approved · 12s ago",
    color: "text-lumina-highlight",
    bg: "bg-lumina-highlight/10",
    border: "border-lumina-highlight/20",
  },
  {
    icon: FileText,
    label: "PDF → Course Ready",
    sub: "15 min · 8 modules generated",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    icon: Zap,
    label: "Dropout Risk Alert",
    sub: "3 students flagged · HOD notified",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
];

const stats = [
  { value: "11", label: "Role Types" },
  { value: "15m", label: "PDF → Course" },
  { value: "100%", label: "Teacher-Verified AI" },
  { value: "<200ms", label: "Load Time" },
  { value: "Self-Hosted", label: "Privacy-First" },
];

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-32 overflow-hidden bg-black">
      {/* Neural grid background */}
      <div className="absolute inset-0 neural-mesh opacity-[0.07] pointer-events-none" />

      {/* Gold ambient orbs */}
      <div className="absolute top-1/4 left-0 w-[700px] h-[700px] bg-lumina-highlight/8 rounded-full blur-[140px] pointer-events-none -translate-x-1/2" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/6 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/4" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/25 shadow-[0_0_30px_rgba(255,215,0,0.08)]">
            <span className="w-2 h-2 rounded-full bg-lumina-highlight animate-pulse" />
            <span className="text-xs font-black text-lumina-highlight uppercase tracking-[0.2em]">
              Lumina LMS · Now Live
            </span>
          </div>
        </div>

        {/* Main headline */}
        <div className="text-center max-w-5xl mx-auto mb-10">
          <h1 className="text-5xl sm:text-6xl lg:text-[88px] font-black text-white leading-[1.0] tracking-tight font-display mb-6">
            The LMS That{" "}
            <span className="gradient-text-gold">Never Lets AI</span>
            <br />
            Teach Alone
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-sans">
            Teacher-verified AI answers, PDF-to-course in 15 minutes, OCR-graded
            handwritten exams — built for engineering colleges that need more than a checkbox LMS.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="glass-button-highlight inline-flex items-center gap-2 text-black font-black text-sm uppercase tracking-[0.15em] h-14 px-10 rounded-xl shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:shadow-[0_0_60px_rgba(255,215,0,0.45)] hover:scale-[1.04] active:scale-[0.97] transition-all"
          >
            Get Started Free
            <MoveRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-lumina-highlight font-bold text-sm uppercase tracking-[0.15em] h-14 px-10 rounded-xl border border-lumina-highlight/25 bg-lumina-highlight/5 hover:bg-lumina-highlight/10 hover:border-lumina-highlight/40 transition-all"
          >
            <Shield className="h-4 w-4" />
            Sign In
          </Link>
        </div>

        {/* Floating Feature Cards */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 max-w-4xl mx-auto">
          {floatingCards.map((card, i) => (
            <div
              key={i}
              className={`flex-1 flex items-start gap-3 p-4 rounded-2xl border ${card.border} ${card.bg} backdrop-blur-sm shadow-lg min-w-[220px]`}
            >
              <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center ${card.bg} border ${card.border}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div>
                <p className={`text-xs font-black ${card.color} uppercase tracking-wide mb-0.5`}>
                  {card.label}
                </p>
                <p className="text-[10px] text-slate-500 font-sans">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 max-w-4xl mx-auto py-8 px-8 rounded-3xl border border-lumina-highlight/8 bg-white/[0.015] backdrop-blur-sm shadow-inner">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <span className="text-2xl sm:text-3xl font-black text-lumina-highlight font-display group-hover:drop-shadow-[0_0_12px_rgba(255,215,0,0.6)] transition-all">
                {stat.value}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
