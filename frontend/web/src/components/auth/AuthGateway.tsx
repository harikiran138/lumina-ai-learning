"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  School,
  ShieldCheck,
  User,
} from "lucide-react";
import { api, type User as AuthUser } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

type LoginRole = "student" | "faculty" | "admin";
type SignupRole = "student" | "faculty";
type AuthMode = "login" | "signup";

type SignupForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: SignupRole;
};

const roleRoutes: Record<string, string> = {
  super_admin: "/admin/dashboard",
  college_admin: "/college",
  hod: "/hod/dashboard",
  faculty: "/faculty/dashboard",
  student: "/student/dashboard",
};

function redirectAfterAuth(user: AuthUser) {
  if (user.mustChangePassword) {
    window.location.href = "/change-password";
    return;
  }

  if (user.onboardingStep !== undefined && user.onboardingStep < 5) {
    window.location.href = "/onboarding";
    return;
  }

  window.location.href = roleRoutes[user.role] || "/dashboard";
}

export default function AuthGateway({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<LoginRole>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [signupForm, setSignupForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      window.location.href = roleRoutes[user.role] || "/dashboard";
    }
  }, [user]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const loggedInUser = await api.login({
        identifier: identifier.trim(),
        password,
        role_hint: activeRole === "admin" ? undefined : activeRole,
      });

      setUser(loggedInUser);
      redirectAfterAuth(loggedInUser);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (signupForm.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const createdUser = await api.createUser({
        name: signupForm.name.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
        role: signupForm.role,
      });

      setUser(createdUser);
      redirectAfterAuth(createdUser);
    } catch (err: any) {
      setError(err?.message || "Unable to create your account right now.");
    } finally {
      setIsLoading(false);
    }
  }

  const isSignup = mode === "signup";

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 flex overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-stone-950">
        <Image
          src="/images/hero-yellow.png"
          alt="Lumina Hero"
          fill
          className="object-cover opacity-60 mix-blend-luminosity grayscale transition-all duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/45 to-transparent" />

        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-lumina-highlight/30 bg-lumina-highlight/10 text-xl font-black text-lumina-highlight">
                L
              </div>
              <span className="text-2xl font-black tracking-tighter text-white font-display uppercase">Lumina</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-[1.1] mb-6 font-display">
              <span className="gradient-text-gold">{isSignup ? "Start Your " : "Elevate Learning "}</span>
              <br />
              <span className="text-white">{isSignup ? "Intelligent Journey" : "With Intelligence"}</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-sm leading-relaxed font-sans">
              {isSignup
                ? "Create your Lumina account and step into a guided onboarding flow built for modern students and faculty."
                : "Experience the next generation of digital education. Lumina fuses advanced AI with human pedagogical integrity to empower every learner."}
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative bg-black">
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-lumina-highlight/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {!isSignup ? (
            <button
              type="button"
              onClick={handleBack}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-lumina-highlight/40 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : null}

          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-lumina-highlight/30 bg-lumina-highlight/10 text-lg font-black text-lumina-highlight">
              L
            </div>
            <span className="text-xl font-black tracking-tighter text-white font-display uppercase">Lumina</span>
          </div>

          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="text-left">
              <h2 className="text-4xl font-black text-white mb-3 font-display tracking-tight">
                {isSignup ? "Create Account" : "Access Portal"}
              </h2>
              <p className="text-slate-500 font-sans">
                {isSignup ? "Set up your account to enter Lumina." : "Sign in to sync your learning graph."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-stone-900/60 p-1 flex items-center gap-1">
              <Link
                href="/login"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  !isSignup ? "bg-lumina-highlight text-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  isSignup ? "bg-lumina-highlight text-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up
              </Link>
            </div>
          </div>

          {!isSignup ? (
            <>
              <div className="flex p-1.5 bg-stone-900/50 backdrop-blur-3xl rounded-2xl mb-8 border border-white/5">
                {[
                  { id: "student", label: "Student", icon: GraduationCap },
                  { id: "faculty", label: "Faculty", icon: School },
                  { id: "admin", label: "Admin", icon: ShieldCheck },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setActiveRole(role.id as LoginRole)}
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
                      {activeRole === "student" ? <User size={20} /> : activeRole === "faculty" ? <Building2 size={20} /> : <Mail size={20} />}
                    </div>
                    <input
                      type="text"
                      placeholder={
                        activeRole === "student"
                          ? "Roll Number / Student ID / Email"
                          : activeRole === "faculty"
                            ? "Faculty ID or Portal Email"
                            : "Administrator Email"
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
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-600 hover:text-lumina-highlight transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{showPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-3">
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
                      <ArrowRight size={22} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="grid gap-4 font-sans">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-lumina-highlight text-slate-600 transition-colors">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-stone-900/40 border border-white/5 text-white rounded-2xl py-4.5 pl-14 pr-4 focus:ring-2 focus:ring-lumina-highlight/40 focus:border-lumina-highlight outline-none transition-all placeholder:text-slate-700 font-medium"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-lumina-highlight text-slate-600 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-stone-900/40 border border-white/5 text-white rounded-2xl py-4.5 pl-14 pr-4 focus:ring-2 focus:ring-lumina-highlight/40 focus:border-lumina-highlight outline-none transition-all placeholder:text-slate-700 font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-stone-900/50 p-1.5">
                  {([
                    { id: "student", label: "Student", icon: GraduationCap },
                    { id: "faculty", label: "Faculty", icon: School },
                  ] as const).map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSignupForm((prev) => ({ ...prev, role: role.id }))}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                        signupForm.role === role.id ? "bg-lumina-highlight text-black" : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <role.icon size={16} />
                      {role.label}
                    </button>
                  ))}
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-lumina-highlight text-slate-600 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="Create Password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-stone-900/40 border border-white/5 text-white rounded-2xl py-4.5 pl-14 pr-14 focus:ring-2 focus:ring-lumina-highlight/40 focus:border-lumina-highlight outline-none transition-all placeholder:text-slate-700 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-600 hover:text-lumina-highlight transition-colors"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{showSignupPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-lumina-highlight text-slate-600 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-stone-900/40 border border-white/5 text-white rounded-2xl py-4.5 pl-14 pr-14 focus:ring-2 focus:ring-lumina-highlight/40 focus:border-lumina-highlight outline-none transition-all placeholder:text-slate-700 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-600 hover:text-lumina-highlight transition-colors"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{showConfirmPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="text-red-500 mt-0.5" size={18} />
                  <p className="text-sm text-red-200/80 leading-tight font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full glass-button-highlight disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] text-lg uppercase tracking-widest shadow-[0_20px_40px_rgba(250,204,21,0.2)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={22} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-white/5 text-center font-sans">
            <p className="text-slate-500 text-sm font-medium">
              {isSignup ? "Already have credentials?" : "Need an account first?"}{" "}
              <Link href={isSignup ? "/login" : "/register"} className="text-white font-bold hover:text-lumina-highlight transition-colors inline-flex items-center gap-1 group">
                {isSignup ? "Return to Sign In" : "Create Your Account"}
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
