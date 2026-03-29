"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ArrowRight, 
  User, 
  GraduationCap, 
  School,
  Lock,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";

type Role = "student" | "faculty" | "admin";

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<Role>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const setUser = useAuthStore(state => state.setUser);
  const user = useAuthStore(state => state.user);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      const routes: Record<string, string> = {
        super_admin: "/admin/dashboard",
        college_admin: "/college",
        hod: "/hod",
        faculty: "/faculty",
        student: "/student/dashboard",
      };
      const redirectPath = routes[user.role] || "/dashboard";
      window.location.href = redirectPath;
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const loggedInUser = await api.login({
        identifier: identifier.trim(),
        password,
        role_hint: activeRole === "admin" ? "college_admin" : activeRole
      });

      if (loggedInUser) {
        setUser(loggedInUser);
        
        // Handle forcing password change
        if (loggedInUser.mustChangePassword) {
          window.location.href = "/change-password";
          return;
        }

        // Handle onboarding
        if (loggedInUser.onboardingStep !== undefined && loggedInUser.onboardingStep < 5) {
          window.location.href = "/onboarding";
          return;
        }

        // Role-based routing
        const routes: Record<string, string> = {
          super_admin: "/admin/dashboard",
          college_admin: "/college",
          hod: "/hod",
          faculty: "/faculty",
          student: "/student/dashboard",
        };
        
        window.location.href = routes[loggedInUser.role] || "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex overflow-hidden">
      {/* Left Panel: Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-stone-950">
        <Image 
          src="/images/hero-yellow.png"
          alt="Lumina Hero"
          fill
          className="object-cover opacity-60 mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-transparent" />
        
        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
          <div>
            <div className="flex items-center gap-3 mb-8 group cursor-pointer">
              <div className="relative w-12 h-12 transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-110">
                <Image src="/images/logo-yellow.png" alt="Lumina Logo" fill className="object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white font-display uppercase">Lumina</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black leading-[1.1] mb-6 font-display">
              <span className="gradient-text-gold">Elevate Learning </span><br />
              <span className="text-white">With Intelligence</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-sm leading-relaxed font-sans">
              Experience the next generation of digital education. Lumina fuses advanced AI with 
              human pedagogical integrity to empower every student.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 max-w-md font-display">
            <div className="flex flex-col gap-2">
              <div className="text-lumina-highlight text-4xl font-black">98%</div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Student Engagement</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-amber-500 text-4xl font-black">42%</div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Mastery Velocity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative bg-black">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-lumina-highlight/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
             <div className="relative w-10 h-10">
                <Image src="/images/logo-yellow.png" alt="Lumina Logo" fill className="object-contain" />
              </div>
            <span className="text-xl font-black tracking-tighter text-white font-display uppercase">Lumina</span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-white mb-3 font-display tracking-tight">Access Portal</h2>
            <p className="text-slate-500 font-sans">Sign in to sync your neural learning graph.</p>
          </div>

          {/* Role Switcher */}
          <div className="flex p-1.5 bg-stone-900/50 backdrop-blur-3xl rounded-2xl mb-8 border border-white/5">
            {[
              { id: "student", label: "Student", icon: GraduationCap },
              { id: "faculty", label: "Faculty", icon: School },
              { id: "admin", label: "Admin", icon: ShieldCheck },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id as Role)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 font-sans ${
                  activeRole === role.id
                    ? "bg-lumina-highlight text-black shadow-[0_8px_24px_rgba(250,204,21,0.25)]"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <role.icon size={16} />
                {role.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4 font-sans">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-lumina-highlight text-slate-600 transition-colors">
                  {activeRole === "student" ? <User size={20} /> : 
                   activeRole === "faculty" ? <Building2 size={20} /> : 
                   <Mail size={20} />}
                </div>
                <input
                  type="text"
                  placeholder={
                    activeRole === "student" ? "Roll Number / Student ID" : 
                    activeRole === "faculty" ? "Faculty ID or Portal Email" : 
                    "Administrator Identifier"
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-stone-900/40 border border-white/5 text-white rounded-2xl py-4.5 pl-14 pr-4 focus:ring-2 focus:ring-lumina-highlight/40 focus:border-lumina-highlight outline-none transition-all placeholder:text-slate-700 font-medium"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-lumina-highlight text-slate-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Security Key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-900/40 border border-white/5 text-white rounded-2xl py-4.5 pl-14 pr-14 focus:ring-2 focus:ring-lumina-highlight/40 focus:border-lumina-highlight outline-none transition-all placeholder:text-slate-700 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-600 hover:text-lumina-highlight transition-colors"
                >
                  {showPassword ? <span className="text-[10px] font-black uppercase tracking-widest">Hide</span> : <span className="text-[10px] font-black uppercase tracking-widest">Show</span>}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-red-500 mt-0.5" size={18} />
                <p className="text-sm text-red-200/80 leading-tight font-medium">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between py-1 font-sans">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <input type="checkbox" className="peer absolute opacity-0 w-full h-full cursor-pointer" />
                  <div className="w-5 h-5 rounded-lg border border-white/10 bg-stone-900 peer-checked:bg-lumina-highlight peer-checked:border-lumina-highlight transition-all flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={14} className="text-black scale-0 peer-checked:scale-100 transition-transform" />
                  </div>
                </div>
                <span className="text-sm text-slate-500 group-hover:text-slate-400 font-medium tracking-tight">Keep Session Active</span>
              </label>
              <button type="button" className="text-sm font-bold text-lumina-highlight hover:text-amber-400 transition-colors tracking-tight">
                Reset Access
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full glass-button-highlight disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] text-lg uppercase tracking-widest shadow-[0_20px_40px_rgba(250,204,21,0.2)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <span>Initialize Lumina</span>
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 text-center font-sans">
            <p className="text-slate-500 text-sm font-medium">
              Awaiting credentials? <br className="sm:hidden" />
              <button className="text-white font-bold hover:text-lumina-highlight transition-colors ml-1 inline-flex items-center gap-1 group">
                Contact Institution Administration
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
