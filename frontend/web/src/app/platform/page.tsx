"use client";

import Link from "next/link";
import { 
  Bot, 
  ShieldCheck, 
  Link2, 
  Zap, 
  BarChart3, 
  Clock,
  ArrowRight
} from "lucide-react";
import { DottedSurface } from "@/components/ui/DottedSurface";
import Footer from "@/components/layout/Footer";

export default function PlatformPage() {
  return (
    <div className="text-white min-h-screen bg-neutral-950 selection:bg-lumina-highlight/30 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-neutral-950/50 backdrop-blur-2xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="text-2xl font-black text-white flex items-center font-display tracking-tight">
              <span className="gradient-text">Lumina</span>
              <span className="ml-1 text-lumina-highlight">AI</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/platform" className="text-xs font-bold uppercase tracking-widest text-white">Platform</Link>
              <Link href="/technology" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Technology</Link>
              <Link href="/pricing" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Pricing</Link>
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
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-lumina-highlight mb-4">
              The Architecture of Learning
            </p>
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-8 leading-[1.1]">
              A unified platform for <br />
              <span className="text-lumina-highlight border-b-8 border-lumina-highlight/20">human-centered AI.</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mb-12">
              Lumina isn&apos;t just a chatbot. It&apos;s a distributed intelligence system that connects students, teachers, and institutions through verified mastery models.
            </p>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Bot}
              title="Adaptive Tutoring"
              description="Personalized 1-on-1 support that understands student misconceptions before they do."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Teacher Verification"
              description="AI outputs are audited by educators to ensure accuracy, pedagogical alignment, and safety."
            />
            <FeatureCard 
              icon={Link2}
              title="Role Synergy"
              description="Seamless workflows between students, mentors, parents, and administrative leads."
            />
          </div>
        </section>

        {/* Detailed Breakdown */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-white/[0.01]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-display font-bold mb-6">Built for Institutions, <br /> Loved by Students.</h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Most AI in education is a layer on top of old systems. Lumina is built from the ground up for the AI Era, prioritizing data sovereignty and verified mastery over simple completion.
              </p>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-lumina-highlight/20 flex items-center justify-center text-lumina-highlight flex-shrink-0">
                    <Zap className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">Real-time Intervention</h4>
                    <p className="text-gray-500 text-sm mt-1">Teachers receive alerts when a student displays cognitive overload or repetitive failure patterns.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-lumina-highlight/20 flex items-center justify-center text-lumina-highlight flex-shrink-0">
                    <BarChart3 className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">Actionable Analytics</h4>
                    <p className="text-gray-500 text-sm mt-1">Move beyond grades with deep insights into concept mastery and learning momentum.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-lumina-highlight/20 flex items-center justify-center text-lumina-highlight flex-shrink-0">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">24/7 Support</h4>
                    <p className="text-gray-500 text-sm mt-1">Students are never stuck. Our AI tutor is available around the clock with course-specific context.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="glass-v2 rounded-[40px] border border-white/10 p-2 overflow-hidden aspect-video relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-lumina-highlight/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="w-full h-full rounded-[32px] bg-neutral-900 flex items-center justify-center border border-white/5 relative z-10">
                <p className="text-gray-500 font-display italic">Interactive Platform Diagram Rendering...</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="max-w-3xl mx-auto glass-card-premium p-16 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-lumina-highlight/10 blur-[100px] group-hover:bg-lumina-highlight/20 transition-all duration-700" />
            <h2 className="text-4xl font-display font-bold mb-6">Ready to transform your institution?</h2>
            <p className="text-gray-400 text-lg mb-10">
              Join the growing list of universities and K-12 leads who chose privacy-first AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="w-full sm:w-auto px-10 py-4 bg-white text-black font-bold rounded-2xl hover:bg-lumina-highlight transition-colors flex items-center justify-center gap-2">
                Talk to Sales
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-10 py-4 glass-v2 order-first sm:order-last font-bold rounded-2xl hover:bg-white/5 transition-colors">
                Try Free Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <DottedSurface />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="glass-v2 border border-white/5 p-8 rounded-[32px] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 group">
      <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-lumina-highlight mb-6 group-hover:scale-110 transition-transform duration-500">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
