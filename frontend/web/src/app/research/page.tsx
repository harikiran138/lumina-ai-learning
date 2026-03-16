"use client";

import Link from "next/link";
import { 
  BookOpen, 
  Brain, 
  Lightbulb, 
  Microscope, 
  GraduationCap, 
  Search,
  ArrowRight,
  TrendingUp,
  FlaskConical
} from "lucide-react";
import { DottedSurface } from "@/components/ui/DottedSurface";
import Footer from "@/components/layout/Footer";

export default function ResearchPage() {
  return (
    <div className="text-white min-h-screen bg-slate-950 selection:bg-lumina-highlight/30 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="text-2xl font-black text-white flex items-center font-display tracking-tight">
              <span className="gradient-text">Lumina</span>
              <span className="ml-1 text-lumina-highlight">AI</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/platform" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Platform</Link>
              <Link href="/technology" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Technology</Link>
              <Link href="/research" className="text-xs font-bold uppercase tracking-widest text-white">Research</Link>
            </nav>

            <Link
              href="/login"
              className="bg-lumina-highlight text-black text-xs font-bold uppercase tracking-[0.2em] py-3 px-6 rounded-xl hover:scale-[1.05] active:scale-[0.98] transition-all shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32">
        {/* Research Hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-lumina-highlight mb-4">
              Pedagogical Innovation
            </p>
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-8 leading-[1.1]">
              Rooted in <br />
              <span className="text-lumina-highlight border-b-8 border-lumina-highlight/20">Learning Science.</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mb-12">
              Lumina isn&apos;t just about technology. We collaborate with cognitive scientists and academic researchers to build the next generation of mastery-based feedback loops.
            </p>
          </div>
        </section>

        {/* Research Pillars */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <ResearchCard 
                icon={Brain}
                title="Cognitive Modeling"
                description="Mapping the mental models of students to detect misconceptions before they lead to frustration."
              />
              <ResearchCard 
                icon={Lightbulb}
                title="Socratic Tutoring"
                description="Transitioning from direct-answer AI to inquiry-based scaffolding that builds long-term retention."
              />
              <ResearchCard 
                icon={TrendingUp}
                title="Growth Trajectories"
                description="Predicting student outcomes through heterogeneous interaction data and verification pulses."
              />
           </div>
        </section>

        {/* Lab Snapshot */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="glass-v2 p-1 rounded-[48px] overflow-hidden">
                 <div className="aspect-square bg-slate-900 flex items-center justify-center border border-white/5 rounded-[46px] group relative">
                    <div className="absolute inset-0 bg-lumina-highlight/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <FlaskConical className="w-32 h-32 text-lumina-highlight/20 group-hover:text-lumina-highlight/40 transition-colors" />
                    <p className="absolute bottom-10 text-xs font-bold uppercase tracking-widest text-gray-500">Live Research Sandbox</p>
                 </div>
              </div>
              
              <div>
                 <h2 className="text-4xl font-display font-bold mb-8">Bridging Theory & Practice.</h2>
                 <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                    Our 'Lumina Research Lab' provides anonymized datasets to authorized institutional researchers, enabling massive-scale studies on the impact of AI on learning outcomes.
                 </p>
                 
                 <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                       <h4 className="font-bold text-white mb-1">Active Study: LLM Bias in Socratic Dialogue</h4>
                       <p className="text-sm text-gray-500 mb-4">Partnering with Stanford GRAILE on reducing bias in automated tutoring scripts.</p>
                       <Link href="#" className="text-lumina-highlight text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          Read Abstract
                          <ArrowRight className="w-3 h-3" />
                       </Link>
                    </div>
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                       <h4 className="font-bold text-white mb-1">Impact Report: Teacher Verification vs. Raw AI</h4>
                       <p className="text-sm text-gray-500 mb-4">Investigating student confidence levels when interacting with audited vs. non-audited AI hints.</p>
                       <Link href="#" className="text-lumina-highlight text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          View Dataset
                          <ArrowRight className="w-3 h-3" />
                       </Link>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
           <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-display font-bold mb-6">Partner with our Lab</h2>
              <p className="text-xl text-gray-400 mb-10">We are actively seeking institutional partners for the 2026-2027 Research Cohort.</p>
              <Link href="/contact" className="inline-flex items-center gap-3 px-10 py-4 bg-lumina-highlight text-black font-bold rounded-2xl hover:scale-[1.05] transition-all">
                 Inquire about Research Access
                 <Search className="w-4 h-4" />
              </Link>
           </div>
        </section>
      </main>

      <Footer />
      <DottedSurface />
    </div>
  );
}

function ResearchCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="group">
           <div className="mb-6 h-12 w-12 rounded-xl bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight border border-lumina-highlight/20 group-hover:bg-lumina-highlight group-hover:text-black transition-all">
              <Icon className="w-6 h-6" />
           </div>
           <h3 className="text-xl font-bold text-white mb-4 tracking-tight">{title}</h3>
           <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
