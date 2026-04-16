import React from "react";
import Link from "next/link";
import { roleRegistry } from "@/data/roleData";
import RoleCards from "@/components/home/RoleCards";
import Footer from "@/components/layout/Footer";
import RoleIndexHeader from "@/components/roles/RoleIndexHeader";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Role Ecosystem | Lumina AI",
  description: "Explore the 9 defined roles within the Lumina AI Learning Platform and how they collaborate to create a personalized educational experience.",
};

export default function RolesIndexPage() {
  return (
    <div className="min-h-screen bg-surface text-text selection:bg-primary/30">
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-surface/50 backdrop-blur-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-text flex items-center font-display tracking-tight group">
            <span className="transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">Lumina</span>
            <span className="ml-0.5 text-primary">AI</span>
          </Link>
          
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back Home</span>
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-20">
        <RoleIndexHeader />

        <RoleCards />

        <section className="py-20 border-t border-border">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="p-12 rounded-[2.5rem] bg-surface-elevated border border-border">
              <h2 className="text-3xl font-black mb-6 font-display tracking-tight text-text">Security-First <span className="text-primary">Design</span></h2>
              <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-text-secondary">
                <p>
                  Our role-based access control (RBAC) is more than just permissions. It is an architectural 
                  guarantee that student data remains private, teacher efforts are amplified, and 
                  institutional integrity is maintained.
                </p>
                <p>
                  Every role is backed by the Lumina Guardian Engine, ensuring AI interactions 
                  remain pedagogically sound and data interactions remain strictly compliant 
                  with global privacy standards.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
