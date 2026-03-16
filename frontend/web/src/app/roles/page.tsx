"use client";

import Link from "next/link";
import { 
  User, 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  Sparkles,
  BookOpen,
  MessageSquare,
  Search,
  Settings,
  Heart
} from "lucide-react";
import { DottedSurface } from "@/components/ui/DottedSurface";
import Footer from "@/components/layout/Footer";

const roles = [
  {
    id: "student",
    title: "Student",
    description: "Personalized AI tutoring and mastery-based learning paths.",
    icon: GraduationCap,
    href: "/student/dashboard",
    color: "blue"
  },
  {
    id: "teacher",
    title: "Teacher",
    description: "Verification queue and live operational classroom insights.",
    icon: User,
    href: "/teacher/dashboard",
    color: "emerald"
  },
  {
    id: "admin",
    title: "Admin",
    description: "Enterprise governance, security, and institutional scaling.",
    icon: ShieldCheck,
    href: "/admin/dashboard",
    color: "gold"
  },
  {
    id: "parent",
    title: "Parent",
    description: "Privacy-safe progress monitoring and growth trajectory view.",
    icon: Heart,
    href: "/parent/dashboard",
    color: "rose"
  },
  {
    id: "mentor",
    title: "Mentor",
    description: "Guided support and advanced feedback for specialized learners.",
    icon: Users,
    href: "/mentor/dashboard",
    color: "indigo"
  },
  {
    id: "content-creator",
    title: "Content Creator",
    description: "Building blueprints and pedagogical rules for the AI engine.",
    icon: BookOpen,
    href: "/content-creator/dashboard",
    color: "purple"
  },
  {
    id: "counselor",
    title: "Counselor",
    description: "Well-being monitoring and intervention strategy support.",
    icon: MessageSquare,
    href: "/counselor/dashboard",
    color: "teal"
  },
  {
    id: "researcher",
    title: "Researcher",
    description: "Deep data access and cognitive modeling experimentation.",
    icon: Search,
    href: "/researcher/dashboard",
    color: "orange"
  },
  {
    id: "peer-tutor",
    title: "Peer Tutor",
    description: "Collaborative learning and verified peer-to-peer support.",
    icon: Clock,
    href: "/peer-tutor/dashboard",
    color: "cyan"
  },
  {
    id: "alumni",
    title: "Alumni",
    description: "Post-course resource access and lifelong learning graph.",
    icon: Sparkles,
    href: "/alumni/dashboard",
    color: "slate"
  }
];

export default function RolesPortalPage() {
  return (
    <div className="text-white min-h-screen bg-slate-950 selection:bg-lumina-highlight/30 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="text-2xl font-black text-white flex items-center font-display tracking-tight">
              <span className="gradient-text">Lumina</span>
              <span className="ml-1 text-lumina-highlight">AI</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/platform" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Platform</Link>
              <Link href="/roles" className="text-xs font-bold uppercase tracking-widest text-white">Roles</Link>
              <Link href="/contact" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Contact</Link>
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

      <main className="pt-32 pb-32">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-lumina-highlight mb-4">
            Unified Ecosystem
          </p>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-8">
            Tailored for every <br />
            <span className="text-lumina-highlight">Stakeholder.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            One platform, ten distinct interfaces. Lumina provides dedicated workspaces for everyone involved in the learning journey.
          </p>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Link 
                key={role.id} 
                href={role.href}
                className="glass-v2 border border-white/5 p-8 rounded-[32px] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-lumina-highlight/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className={`h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                   <role.icon className={`w-7 h-7 ${role.id === 'admin' ? 'text-lumina-highlight' : 'text-gray-400 group-hover:text-white'}`} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-lumina-highlight transition-colors flex items-center gap-2">
                   {role.title}
                   {role.id === 'admin' && <Sparkles className="w-3 h-3" />}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                   {role.description}
                </p>
                
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                   View Dashboard
                   <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <DottedSurface />
    </div>
  );
}
