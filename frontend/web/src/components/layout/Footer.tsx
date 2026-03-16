"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, Globe, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative pt-24 pb-12 border-t border-white/5 bg-surface-950/80 backdrop-blur-sm overflow-hidden">
      {/* Neural mesh background for footer */}
      <div className="absolute inset-0 neural-mesh opacity-5 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="text-2xl font-bold text-white flex items-center">
              <span className="gradient-text">Lumina</span>
              <Sparkles className="h-5 w-5 ml-2 text-lumina-primary" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              The privacy-first AI learning platform that adapts to every student through teacher-verified knowledge modeling.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="w-10 h-10 rounded-full glass-v2 flex items-center justify-center hover:bg-lumina-primary/20 transition-all">
                <Github className="h-5 w-5 text-gray-400 hover:text-white" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full glass-v2 flex items-center justify-center hover:bg-lumina-primary/20 transition-all">
                <Twitter className="h-5 w-5 text-gray-400 hover:text-white" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full glass-v2 flex items-center justify-center hover:bg-lumina-primary/20 transition-all">
                <Linkedin className="h-5 w-5 text-gray-400 hover:text-white" />
              </Link>
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Platform</h4>
            <ul className="space-y-4">
              {["Features", "Roles", "AI Engine", "Security", "Documentation"].map((item) => (
                <li key={item}>
                  <Link href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-gray-500 hover:text-lumina-primary text-sm transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional Column */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Institutional</h4>
            <ul className="space-y-4">
              {["Pilot Programs", "Research Partners", "Case Studies", "Adoption Guide"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-500 hover:text-lumina-primary text-sm transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Company</h4>
            <ul className="space-y-4">
              {[
                { label: "About Lumina", href: "#about" },
                { label: "Our Services", href: "#services" },
                { label: "Privacy Policy", href: "#" },
                { label: "Contact", href: "#" },
                { label: "Trust Center", href: "#" }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-gray-500 hover:text-lumina-primary text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-gray-600 font-medium">
            &copy; 2026 Nadimpalli Informatics LLP. Lumina is a trademarked AI LearnTech product.
          </p>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-3 w-3 text-gray-600" />
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Global Instance: US/ASIA</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">System Status: Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
