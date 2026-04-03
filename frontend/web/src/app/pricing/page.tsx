"use client";

import Link from "next/link";
import { 
  Check, 
  ArrowRight, 
  Building, 
  School, 
  Globe2,
  Lock,
  Zap,
  Bot
} from "lucide-react";
import { DottedSurface } from "@/components/ui/DottedSurface";
import Footer from "@/components/layout/Footer";

export default function PricingPage() {
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
              <Link href="/pricing" className="text-xs font-bold uppercase tracking-widest text-white">Pricing</Link>
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
        {/* Pricing Header */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-lumina-highlight mb-4">
            Institutional Tiers
          </p>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-8">
            Scale AI with <span className="text-lumina-highlight">Confidence.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Flexible deployment options for single departments, multi-site school districts, or global university systems.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard 
                icon={School}
                title="Departmental"
                price="Pilot"
                description="Perfect for individual research labs or specific course tracks testing AI adoption."
                features={[
                    "Up to 50 active learners",
                    "Course-specific AI Tutor",
                    "Teacher Verification Dashboard",
                    "Standard FERPA compliance",
                    "Web-based support"
                ]}
                cta="Start Pilot"
            />
            
            <PricingCard 
                highlight
                icon={Building}
                title="Institutional"
                price="Growth"
                description="Unified AI infrastructure for entire schools or colleges with central governance."
                features={[
                    "Unlimited learners",
                    "Custom Knowledge Graphs",
                    "Intervention Analytics",
                    "SAML / SSO Integration",
                    "Dedicated Onboarding",
                    "Privacy Governance controls"
                ]}
                cta="Contact Sales"
            />

            <PricingCard 
                icon={Globe2}
                title="Enterprise"
                price="Global"
                description="Distributed intelligence for large-scale university systems and ministries of education."
                features={[
                    "Multi-tenant management",
                    "Custom LLM Fine-tuning",
                    "API access for research",
                    "Data Residency options",
                    "24/7 Premium SLA",
                    "White-label options"
                ]}
                cta="Talk to Enterprise"
            />
          </div>
        </section>

        {/* FAQ Preview / Trust */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
              <div>
                 <h2 className="text-3xl font-display font-bold mb-6">Frequently Asked</h2>
                 <div className="space-y-8">
                    <FaqItem 
                        q="Is student identity protected?"
                        a="Yes. Lumina uses a Zero-Trust architecture where the AI engine never sees PII. Data is pseudonymized at the institution level."
                    />
                    <FaqItem 
                        q="Do we own the Knowledge Graph?"
                        a="Absolutely. Your institutional knowledge and custom pedagogical rules are your intellectual property, stored in your private vector space."
                    />
                 </div>
              </div>
              <div className="glass-v2 p-10 rounded-[40px] border border-white/10">
                 <Lock className="w-8 h-8 text-lumina-highlight mb-4" />
                 <h3 className="text-xl font-bold mb-4">Institutional Sovereignty</h3>
                 <p className="text-gray-400 text-sm leading-relaxed">
                    We believe institutions should own their AI future. Lumina provides the rails, but you own the car, the engine, and the destination. No hidden data-harvesting or generic training on your private curriculum.
                 </p>
              </div>
           </div>
        </section>
      </main>

      <Footer />
      <DottedSurface />
    </div>
  );
}

function PricingCard({ 
    icon: Icon, 
    title, 
    price, 
    description, 
    features, 
    cta, 
    highlight = false 
}: { 
    icon: any, 
    title: string, 
    price: string, 
    description: string, 
    features: string[], 
    cta: string,
    highlight?: boolean
}) {
    return (
        <div className={`relative p-1 rounded-[40px] transition-all duration-500 ${highlight ? 'bg-gradient-to-b from-lumina-highlight to-transparent scale-[1.05] z-10 shadow-2xl' : 'glass-v2'}`}>
            <div className="bg-neutral-950 rounded-[38px] p-10 h-full flex flex-col">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-8 ${highlight ? 'bg-lumina-highlight text-black' : 'bg-white/5 text-gray-400'}`}>
                    <Icon className="w-7 h-7" />
                </div>
                
                <h3 className="text-2xl font-display font-bold mb-2">{title}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-lg font-bold text-gray-400 uppercase tracking-widest">{price}</span>
                </div>
                
                <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
                    {description}
                </p>
                
                <div className="space-y-4 mb-10">
                    {features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Check className={`w-4 h-4 ${highlight ? 'text-lumina-highlight' : 'text-gray-500'}`} />
                            <span className="text-sm text-gray-300">{feature}</span>
                        </div>
                    ))}
                </div>
                
                <Link href="/contact" className={`w-full py-4 rounded-2xl font-bold text-sm transition-all text-center ${highlight ? 'bg-lumina-highlight text-black hover:scale-[1.02]' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                    {cta}
                </Link>
            </div>
        </div>
    );
}

function FaqItem({ q, a }: { q: string, a: string }) {
    return (
        <div>
            <h4 className="text-white font-bold mb-2 tracking-tight">{q}</h4>
            <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
        </div>
    );
}
