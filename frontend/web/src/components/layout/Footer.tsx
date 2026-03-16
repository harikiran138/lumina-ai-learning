"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, Globe, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative pt-24 pb-12 border-t border-white/5 bg-slate-950/80 backdrop-blur-2xl overflow-hidden">
      {/* Neural mesh background for footer */}
      <div className="absolute inset-0 neural-mesh opacity-5 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="text-2xl font-black text-white flex items-center font-display tracking-tight">
              <span className="gradient-text">Lumina</span>
              <span className="ml-1 text-lumina-accent">AI</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-sans">
              The privacy-first AI learning platform that adapts to every human through teacher-verified mastery modeling.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="w-10 h-10 rounded-xl glass-v2 flex items-center justify-center hover:bg-lumina-primary/20 transition-all">
                <Github className="h-5 w-5 text-slate-400 hover:text-white" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-xl glass-v2 flex items-center justify-center hover:bg-lumina-primary/20 transition-all">
                <Twitter className="h-5 w-5 text-slate-400 hover:text-white" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-xl glass-v2 flex items-center justify-center hover:bg-lumina-primary/20 transition-all">
                <Linkedin className="h-5 w-5 text-slate-400 hover:text-white" />
              </Link>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-[0.2em] text-[10px] font-display">Product</h4>
            <ul className="space-y-4">
              {[
                { label: "AI Engine", href: "#ai-engine" },
                { label: "Verification", href: "#verification" },
                { label: "Adaptive Learning", href: "#solution" },
                { label: "Product Screens", href: "#product-screens" }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-slate-500 hover:text-lumina-primary text-xs font-bold uppercase tracking-widest transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Roles Column */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-[0.2em] text-[10px] font-display">Roles</h4>
            <ul className="space-y-4">
              {[
                { label: "Student Home", href: "/roles/student" },
                { label: "Teacher Dashboard", href: "/roles/teacher" },
                { label: "Admin Portal", href: "/roles/admin" },
                { label: "Parent View", href: "/roles/parent" }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-slate-500 hover:text-lumina-primary text-xs font-bold uppercase tracking-widest transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-[0.2em] text-[10px] font-display">Resources</h4>
            <ul className="space-y-4">
              {[
                { label: "Research Lab", href: "#research" },
                { label: "Testimonials", href: "#testimonials" },
                { label: "Case Studies", href: "#" },
                { label: "Governance FAQ", href: "#" }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-slate-500 hover:text-lumina-primary text-xs font-bold uppercase tracking-widest transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            &copy; 2026 Nadimpalli Informatics LLP. All Rights Reserved.
          </p>
          <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                <Link href="#privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                <Link href="#" className="hover:text-white transition-colors">Security</Link>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
