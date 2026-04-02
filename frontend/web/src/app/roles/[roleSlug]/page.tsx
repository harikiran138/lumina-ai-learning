import React from "react";
import { notFound } from "next/navigation";
import { roleRegistry } from "@/data/roleData";
import RoleHero from "@/components/roles/RoleHero";
import RolePurpose from "@/components/roles/RolePurpose";
import RoleFeatures from "@/components/roles/RoleFeatures";
import RoleAccess from "@/components/roles/RoleAccess";
import RoleInteractions from "@/components/roles/RoleInteractions";
import RoleWorkflow from "@/components/roles/RoleWorkflow";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ roleSlug: string }> }) {
  const { roleSlug } = await params;
  const role = roleRegistry[roleSlug];
  if (!role) return { title: "Role Not Found | Lumina AI" };

  return {
    title: `${role.title} Role | Lumina AI Architecture`,
    description: `A standard overview of the ${role.title} role within the Lumina AI platform, including purpose, functionalities, and access privileges.`,
  };
}

export default async function RolePage({ params }: { params: Promise<{ roleSlug: string }> }) {
  const { roleSlug } = await params;
  const role = roleRegistry[roleSlug];

  if (!role) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-lumina-highlight/30">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-white flex items-center font-display tracking-tight group">
            <span className="gradient-text transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">Lumina</span>
            <span className="ml-0.5 text-lumina-highlight">AI</span>
          </Link>
          
          <Link 
            href="/#roles" 
            className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-lumina-highlight transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Roles</span>
          </Link>
        </div>
      </header>

      <main className="pt-20">
        <RoleHero 
          title={role.title} 
          tagline={role.tagline} 
          purpose={role.purpose} 
          iconName={role.iconName} 
        />
        
        <RolePurpose content={role.purpose} />
        
        <RoleFeatures features={role.functionalities} />
        
        <RoleAccess 
          see={role.access.see} 
          do={role.access.do} 
        />
        
        <RoleInteractions 
          interactions={role.interactions} 
        />
        
        <RoleWorkflow 
          steps={role.workflowSteps} 
        />

        {/* Action Section */}
        <section className="py-24 border-t border-white/5 bg-lumina-highlight/5 h-[400px] flex items-center justify-center">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-black mb-8 font-display">Ready to initialize the <span className="gradient-text-gold">{role.title}</span> boundary?</h2>
            <Link 
              href="/login" 
              className="glass-button-highlight text-black text-xs font-bold uppercase tracking-[0.2em] py-4 px-10 rounded-xl hover:scale-[1.05] active:scale-[0.98] transition-all inline-block"
            >
              Get Started Now
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(roleRegistry).map((roleSlug) => ({
    roleSlug,
  }));
}
