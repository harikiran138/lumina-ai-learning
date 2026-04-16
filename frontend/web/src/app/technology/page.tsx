"use client";

import Link from "next/link";
import { 
  Zap, 
  Cpu, 
  Database, 
  Lock, 
  Code2, 
  Globe,
  ArrowRight,
  Sparkles,
  Server,
  Workflow
} from "lucide-react";
import { DottedSurface } from "@/components/ui/DottedSurface";
import Footer from "@/components/layout/Footer";

export default function TechnologyPage() {
  return (
    <div className="text-foreground min-h-screen bg-background selection:bg-primary/20 selection:text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="text-2xl font-black text-foreground flex items-center font-display tracking-tight">
              <span className="gradient-text">Lumina</span>
              <span className="ml-1 text-lumina-highlight">AI</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/platform" className="text-xs font-bold uppercase tracking-widest text-text-muted hover:text-foreground transition-colors">Platform</Link>
              <Link href="/technology" className="text-xs font-bold uppercase tracking-widest text-foreground">Technology</Link>
              <Link href="/pricing" className="text-xs font-bold uppercase tracking-widest text-text-muted hover:text-foreground transition-colors">Pricing</Link>
            </nav>

            <Link
              href="/login"
              className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] py-3 px-6 rounded-xl hover:scale-[1.05] active:scale-[0.98] transition-all shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32">
        {/* Technology Hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-lumina-highlight mb-4">
              AI Engine & Infrastructure
            </p>
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-8 leading-[1.1]">
              Privacy-first <br />
              <span className="text-lumina-highlight border-b-8 border-lumina-highlight/20">Learning Intelligence.</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mb-12">
              We separate student identity from their learning patterns, ensuring the highest standards of FERPA/GDPR compliance without sacrificing AI personalization.
            </p>
          </div>
        </section>

        {/* Tech Stack Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TechCard 
              icon={Cpu}
              title="LLM Agnostic"
              detail="Orchestrating between specialized fine-tuned models and generic LLMs."
            />
            <TechCard 
              icon={Database}
              title="Vector Mastery"
              detail="Storing multi-dimensional mastery state in semantic vector databases."
            />
            <TechCard 
              icon={Lock}
              title="Zero-Trust Data"
              detail="Identity remains encrypted at the institution level. AI only sees anonymous cognitive IDs."
            />
            <TechCard 
              icon={Globe}
              title="Edge Native"
              detail="High-speed inference delivered close to the user for zero-latency chat."
            />
          </div>
        </section>

        {/* The Lumina Engine Diagram Segment */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="glass-v2 rounded-[48px] border border-border p-12 lg:p-24 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-lumina-highlight/5 to-transparent pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  Machine Learning Engine
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">Mastery Modeling <br /> redefined.</h2>
                <p className="text-text-secondary text-lg leading-relaxed">
                  Our core innovation is the Neural Learning Graph. It maps 10,000+ knowledge points to student interactions, detecting exactly where a concept breaks down.
                </p>
                
                <div className="pt-4 grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-3xl font-display font-bold text-foreground mb-1">98.4%</h3>
                    <p className="text-xs text-text-muted uppercase tracking-widest">Prediction Accuracy</p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-display font-bold text-foreground mb-1">&lt;200ms</h3>
                    <p className="text-xs text-text-muted uppercase tracking-widest">Inference Latency</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="relative w-full aspect-square max-w-sm">
                   <div className="absolute inset-0 rounded-full border border-border animate-spin-slow" />
                   <div className="absolute inset-4 rounded-full border border-border animate-reverse-spin-slow" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-24 w-24 bg-primary rounded-3xl rotate-12 flex items-center justify-center text-primary-foreground shadow-[0_0_50px_rgba(245,158,11,0.25)]">
                        <Workflow className="w-12 h-12" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security / Compliance */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-display font-bold mb-12">Standard-Setting Governance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-border bg-surface-elevated">
              <h4 className="font-bold text-foreground mb-2">FERPA / SOC2</h4>
              <p className="text-sm text-text-secondary">Every byte of student data is encrypted in transit and at rest with institutional keys.</p>
            </div>
            <div className="p-8 rounded-3xl border border-border bg-surface-elevated">
              <h4 className="font-bold text-foreground mb-2">Human-in-the-loop</h4>
              <p className="text-sm text-text-secondary">Teachers have final override on AI-generated grades and feedback suggestions.</p>
            </div>
            <div className="p-8 rounded-3xl border border-border bg-surface-elevated">
              <h4 className="font-bold text-foreground mb-2">Explainable AI</h4>
              <p className="text-sm text-text-secondary">We provide the evidence link for every AI intervention, explaining exactly why a student was flagged.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <DottedSurface />
    </div>
  );
}

function TechCard({ icon: Icon, title, detail }: { icon: any, title: string, detail: string }) {
  return (
    <div className="p-8 rounded-[32px] border border-border bg-surface-elevated hover:bg-surface transition-all group">
      <div className="h-12 w-12 rounded-xl bg-surface flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors mb-6">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{detail}</p>
    </div>
  );
}
