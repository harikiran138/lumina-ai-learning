"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, Globe, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative pt-24 pb-12 border-t border-border bg-background/90 backdrop-blur-2xl overflow-hidden text-foreground">
      {/* Neural mesh background for footer */}
      <div className="absolute inset-0 neural-mesh opacity-5 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="text-2xl font-black text-foreground flex items-center font-display tracking-tight">
              <span className="gradient-text">Lumina</span>
              <span className="ml-1 text-lumina-accent">AI</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs font-sans">
              The privacy-first AI learning platform that adapts to every human through teacher-verified mastery modeling.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="w-10 h-10 rounded-xl glass-v2 flex items-center justify-center hover:bg-lumina-primary/20 transition-all">
                <Github className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-xl glass-v2 flex items-center justify-center hover:bg-lumina-primary/20 transition-all">
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-xl glass-v2 flex items-center justify-center hover:bg-lumina-primary/20 transition-all">
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </Link>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-[0.2em] text-[10px] font-display">Product</h4>
            <ul className="space-y-4">
              {[
                { label: "AI Engine", href: "#ai-engine" },
                { label: "Verification", href: "#verification" },
                { label: "Adaptive Learning", href: "#solution" },
                { label: "Product Screens", href: "#product-screens" }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-muted-foreground hover:text-lumina-primary text-xs font-bold uppercase tracking-widest transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Roles Column */}
          <div>
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-[0.2em] text-[10px] font-display">Roles</h4>
            <ul className="space-y-4">
              {[
                { label: "Platform", href: "/platform" },
                { label: "Technology", href: "/technology" },
                { label: "Roles", href: "/roles" },
                { label: "Pricing", href: "/pricing" }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-muted-foreground hover:text-lumina-primary text-xs font-bold uppercase tracking-widest transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-[0.2em] text-[10px] font-display">Resources</h4>
            <ul className="space-y-4">
              {[
                { label: "Research Lab", href: "/research" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Contact Us", href: "/contact" },
                { label: "Governance FAQ", href: "/privacy" }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-muted-foreground hover:text-lumina-primary text-xs font-bold uppercase tracking-widest transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            &copy; 2026 Nadimpalli Informatics LLP. All Rights Reserved.
          </p>
          <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <Link href="#privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Security</Link>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
