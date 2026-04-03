"use client";

import Link from "next/link";
import { 
  Mail, 
  MessageSquare, 
  Globe, 
  ArrowRight,
  Send,
  Building2,
  Users2,
  Sparkles
} from "lucide-react";
import { DottedSurface } from "@/components/ui/DottedSurface";
import Footer from "@/components/layout/Footer";

export default function ContactPage() {
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
              <Link href="/contact" className="text-xs font-bold uppercase tracking-widest text-white">Contact</Link>
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
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div>
                 <p className="text-xs font-bold uppercase tracking-[0.4em] text-lumina-highlight mb-4">
                   Deployment Support
                 </p>
                 <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-8">
                   Talk to our <br />
                   <span className="text-lumina-highlight">Experts.</span>
                 </h1>
                 <p className="text-xl text-gray-400 leading-relaxed mb-12">
                   Whether you&apos;re an IT director planning a district-wide rollout or a researcher interested in cognitive modeling, we&apos;re here to help.
                 </p>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <ContactDetail 
                       icon={Mail}
                       label="General Inquiries"
                       value="hello@lumina-ai.com"
                    />
                    <ContactDetail 
                       icon={Users2}
                       label="Institutional Sales"
                       value="deploy@lumina-ai.com"
                    />
                    <ContactDetail 
                       icon={Building2}
                       label="Corporate Office"
                       value="Silicon Valley, CA"
                    />
                    <ContactDetail 
                       icon={Sparkles}
                       label="Research Lab"
                       value="lab@lumina-ai.com"
                    />
                 </div>
              </div>
              
              <div className="glass-card-premium p-10 md:p-12 relative overflow-hidden group">
                 <div className="absolute -top-32 -right-32 w-64 h-64 bg-lumina-highlight/10 blur-[100px] border border-lumina-highlight/10 rounded-full" />
                 
                 <h2 className="text-2xl font-bold mb-8">Send a Message</h2>
                 <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">First Name</label>
                          <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-lumina-highlight transition-colors" placeholder="John" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Last Name</label>
                          <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-lumina-highlight transition-colors" placeholder="Doe" />
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Work Email</label>
                       <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-lumina-highlight transition-colors" placeholder="j.doe@university.edu" />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">How can we help?</label>
                       <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-lumina-highlight transition-colors appearance-none">
                          <option className="bg-neutral-900">Request Institutional Demo</option>
                          <option className="bg-neutral-900">Research Partnership</option>
                          <option className="bg-neutral-900">Technical Support</option>
                          <option className="bg-neutral-900">Other</option>
                       </select>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Message</label>
                       <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-lumina-highlight transition-colors" placeholder="Tell us about your institution..." />
                    </div>
                    
                    <button className="w-full py-4 bg-lumina-highlight text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all">
                       Submit Request
                       <Send className="w-4 h-4" />
                    </button>
                 </form>
              </div>
           </div>
        </section>
      </main>

      <Footer />
      <DottedSurface />
    </div>
  );
}

function ContactDetail({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
   return (
      <div className="space-y-3">
         <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-lumina-highlight">
            <Icon className="w-5 h-5" />
         </div>
         <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{label}</p>
            <p className="text-white font-bold">{value}</p>
         </div>
      </div>
   );
}
