"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Scale, 
  FileText, 
  GlobeLock,
  ArrowRight,
  Fingerprint
} from "lucide-react";
import { DottedSurface } from "@/components/ui/DottedSurface";
import Footer from "@/components/layout/Footer";

export default function PrivacyPage() {
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
              <Link href="/platform" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Platform</Link>
              <Link href="/technology" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Technology</Link>
              <Link href="/privacy" className="text-xs font-bold uppercase tracking-widest text-white">Privacy</Link>
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
        {/* Privacy Hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-lumina-highlight mb-4">
              Governance & Compliance
            </p>
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-8 leading-[1.1]">
              Privacy is not a feature. <br />
              <span className="text-lumina-highlight border-b-8 border-lumina-highlight/20">It&apos;s the foundation.</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">
              Lumina was architected with a strict privacy-first mandate. We never sell student data, we don&apos;t use private content for general model training, and you maintain complete sovereignty.
            </p>
          </div>
        </section>

        {/* Principles Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <PrivacyCard 
               icon={EyeOff}
               title="Anonymized Learning"
               detail="Student cognitive patterns are linked to anonymous IDs, separate from their identifying school records."
            />
            <PrivacyCard 
               icon={ShieldCheck}
               title="FERPA / GDPR"
               detail="Full compliance with major educational and data protection frameworks around the globe."
            />
            <PrivacyCard 
               icon={GlobeLock}
               title="Data Sovereignty"
               detail="Select where your data lives. We support regional hosting to meet local institutional requirements."
            />
            <PrivacyCard 
               icon={Lock}
               title="End-to-End Encryption"
               detail="Interaction data is encrypted using keys that only your institution controls."
            />
          </div>
        </section>

        {/* Detailed Governance Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
           <div className="glass-card-premium p-12 md:p-20">
              <div className="max-w-3xl">
                 <h2 className="text-3xl font-display font-bold mb-10">Our Ethics & Governance Framework</h2>
                 
                 <div className="space-y-12">
                    <GovernanceItem 
                       icon={Fingerprint}
                       title="No Universal Bio-Tracking"
                       detail="We reject invasive bio-monitoring. Our 'Mastery Orb' is derived purely from interaction patterns and pedagogical feedback, never from unauthorized hardware sensors."
                    />
                    <GovernanceItem 
                       icon={Scale}
                       title="Algorithmic Transparency"
                       detail="We provide 'Why AI' cards for every nudge or intervention, ensuring administrators and teachers can audit the reasoning behind every automated interaction."
                    />
                    <GovernanceItem 
                       icon={FileText}
                       title="Clear Data Agreements"
                       detail="We use human-readable agreements. No fine print. You own your data. We provide the intelligence. You can export or delete your institutional graph at any time."
                    />
                 </div>
              </div>
           </div>
        </section>

        {/* Action / Links */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center mb-20">
            <h2 className="text-2xl font-display font-bold mb-8">Ready for a deeper dive?</h2>
            <div className="flex flex-wrap justify-center gap-6">
                <Link href="#" className="flex items-center gap-2 text-gray-400 hover:text-lumina-highlight transition-colors font-bold uppercase tracking-widest text-xs">
                   Download Privacy Whitepaper
                   <ArrowRight className="w-3 h-3" />
                </Link>
                <Link href="#" className="flex items-center gap-2 text-gray-400 hover:text-lumina-highlight transition-colors font-bold uppercase tracking-widest text-xs">
                   View Compliance Dashboard
                   <ArrowRight className="w-3 h-3" />
                </Link>
                <Link href="/contact" className="flex items-center gap-2 text-gray-400 hover:text-lumina-highlight transition-colors font-bold uppercase tracking-widest text-xs">
                   Question for our DPO
                   <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </section>
      </main>

      <Footer />
      <DottedSurface />
    </div>
  );
}

function PrivacyCard({ icon: Icon, title, detail }: { icon: any, title: string, detail: string }) {
    return (
        <div className="group">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-lumina-highlight transition-all border border-white/5 mb-6 group-hover:scale-110">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{detail}</p>
        </div>
    );
}

function GovernanceItem({ icon: Icon, title, detail }: { icon: any, title: string, detail: string }) {
    return (
        <div className="flex gap-6">
            <div className="flex-shrink-0 mt-1">
                <div className="h-10 w-10 rounded-xl bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight">
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div>
                <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
                <p className="text-gray-400 leading-relaxed">{detail}</p>
            </div>
        </div>
    );
}
