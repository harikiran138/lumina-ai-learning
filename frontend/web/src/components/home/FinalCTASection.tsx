"use client";

import Link from "next/link";
import { MoveRight, Shield, Zap, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { getRoleHome } from "@/lib/role-routing";

const bullets = [
  "15-minute PDF-to-course pipeline",
  "100% teacher-verified AI answers",
  "Handwritten OCR grading",
  "Self-hosted, privacy-first",
  "11 roles, one platform",
  "FSRS spaced repetition",
];

export default function FinalCTASection() {
  const { user, isLoading: isAuthLoading } = useAuthStore();

  return (
    <section id="cta" className="py-28 relative overflow-hidden bg-black">
      {/* Ambient layers */}
      <div className="absolute inset-0 neural-mesh opacity-[0.04] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-lumina-highlight/[0.06] rounded-full blur-[180px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative glass-panel p-12 lg:p-20 overflow-hidden border-lumina-highlight/15 shadow-[0_0_80px_rgba(255,215,0,0.05)]">
            {/* Top gold rule */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-lumina-highlight to-transparent" />

            <div className="relative z-10 text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lumina-highlight/10 border border-lumina-highlight/25">
                <Zap className="h-4 w-4 text-lumina-highlight" />
                <span className="text-xs font-black text-lumina-highlight uppercase tracking-[0.2em]">
                  Deploy Lumina at Your Institution
                </span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-[72px] font-black text-white leading-[1.0] tracking-tight font-display">
                Stop Compromising.
                <br />
                <span className="gradient-text-gold">Build the Real Thing.</span>
              </h2>

              <p className="text-lg text-zinc-400 font-sans max-w-xl mx-auto leading-relaxed">
                Lumina is fully open, self-hostable, and production-ready. Your data
                stays on your servers. Your teachers stay in control.
              </p>

              {/* Feature bullets */}
              <div className="flex flex-wrap items-center justify-center gap-3 py-2">
                {bullets.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-lumina-highlight/15 bg-lumina-highlight/5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-lumina-highlight flex-shrink-0" />
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      {b}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                {!isAuthLoading && user ? (
                  <Link
                    href={user.onboardingCompleted ? getRoleHome(user.role) : "/onboarding"}
                    className="glass-button-highlight inline-flex items-center gap-2 text-black font-black text-sm uppercase tracking-[0.15em] h-14 px-12 rounded-xl shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:shadow-[0_0_60px_rgba(255,215,0,0.45)] hover:scale-[1.04] active:scale-[0.97] transition-all"
                  >
                    {user.onboardingCompleted ? "Go to Dashboard" : "Continue Setup"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="glass-button-highlight inline-flex items-center gap-2 text-black font-black text-sm uppercase tracking-[0.15em] h-14 px-12 rounded-xl shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:shadow-[0_0_60px_rgba(255,215,0,0.45)] hover:scale-[1.04] active:scale-[0.97] transition-all"
                    >
                      Launch Lumina
                      <MoveRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/login?logout=true"
                      className="inline-flex items-center gap-2 text-zinc-300 font-bold text-sm uppercase tracking-[0.15em] h-14 px-12 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20 transition-all hover:text-white"
                    >
                      <Shield className="h-4 w-4" />
                      Sign In to Platform
                    </Link>
                  </>
                )}
              </div>

              {/* Trust note */}
              <p className="text-[11px] text-zinc-600 font-sans uppercase tracking-wider">
                No vendor lock-in · No cloud required · Open source compatible
              </p>
            </div>

            {/* Corner glows */}
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-lumina-highlight/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-amber-500/8 rounded-full blur-[100px] pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
