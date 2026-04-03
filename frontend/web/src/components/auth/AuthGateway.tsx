"use client";

import React, { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Compass,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Loader2,
  Lock,
  Mail,
  School,
  ShieldCheck,
  User,
  Users,
  Heart,
  Crown,
} from "lucide-react";
import { api, type User as AuthUser } from "@/lib/api";
import { getRoleHome, ROLE_HOME_ROUTES } from "@/lib/role-routing";
import { useAuthStore } from "@/store/useAuthStore";

type LoginRole = "student" | "teacher" | "faculty" | "hod" | "admin" | "parent" | "mentor" | "peer_tutor" | "counselor" | "researcher";
type SignupRole = "student" | "teacher" | "faculty" | "parent" | "mentor" | "peer_tutor" | "researcher";
type AuthMode = "login" | "signup";

type SignupForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: SignupRole;
};

const loginRoleHints: Array<{
  id: LoginRole;
  label: string;
  icon: typeof GraduationCap;
  helper: string;
}> = [
  { id: "student", label: "Student", icon: GraduationCap, helper: "Roll number or student email" },
  { id: "teacher", label: "Teacher", icon: BookOpen, helper: "Teacher email or ID" },
  { id: "faculty", label: "Faculty", icon: School, helper: "Faculty ID or institutional email" },
  { id: "hod", label: "HOD", icon: Crown, helper: "Department head credentials" },
  { id: "admin", label: "Admin", icon: ShieldCheck, helper: "Administrative email access" },
  { id: "parent", label: "Parent", icon: Users, helper: "Parent portal email" },
  { id: "mentor", label: "Mentor", icon: Compass, helper: "Mentor email" },
  { id: "counselor", label: "Counselor", icon: Heart, helper: "Counselor email" },
  { id: "researcher", label: "Researcher", icon: FlaskConical, helper: "Research portal email" },
];

const signupRoleOptions: Array<{ id: SignupRole; label: string; icon: typeof GraduationCap; desc: string }> = [
  { id: "student", label: "Student", icon: GraduationCap, desc: "Adaptive learning & AI tutor" },
  { id: "teacher", label: "Teacher", icon: BookOpen, desc: "Content creation & AI verification" },
  { id: "faculty", label: "Faculty", icon: School, desc: "Course oversight & grading" },
  { id: "parent", label: "Parent", icon: Users, desc: "Monitor child progress" },
  { id: "mentor", label: "Mentor", icon: Compass, desc: "Guidance & support" },
  { id: "peer_tutor", label: "Peer Tutor", icon: HeartHandshake, desc: "Collaborative learning" },
  { id: "researcher", label: "Researcher", icon: FlaskConical, desc: "Educational impact studies" },
];

const featurePillars = [
  "Teacher-verified AI learning support",
  "Role-aware dashboards and onboarding",
  "Secure session handling with guided setup",
];

function fieldClass(hasError: boolean) {
  return [
    "w-full rounded-2xl border bg-stone-900/50 text-white outline-none transition-all font-medium",
    "py-4 pl-14 pr-14 placeholder:text-slate-600",
    hasError
      ? "border-red-500/40 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
      : "border-white/8 focus:border-lumina-highlight focus:ring-2 focus:ring-lumina-highlight/20",
  ].join(" ");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function redirectAfterAuth(router: ReturnType<typeof useRouter>, user: AuthUser) {
  const destination = user.mustChangePassword
    ? "/change-password"
    : user.onboardingStep !== undefined && user.onboardingStep < 5 && user.role !== "super_admin"
      ? "/onboarding"
      : getRoleHome(user.role);

  // Force a full location reload to clear Next.js internal router state, 
  // ensuring the middleware sees the NEW cookie and doesn't flicker 
  // with a cached version of the previous role's dashboard.
  window.location.href = destination;
}

export default function AuthGateway({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<LoginRole | null>(null);
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRoleHints, setShowRoleHints] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const isSignup = mode === "signup";
  const selectedHint = activeRole ? loginRoleHints.find((item) => item.id === activeRole) : null;

  const loginValidationError = useMemo(() => {
    if (!identifier.trim()) return "Enter your email, roll number, or employee ID.";
    if (!password) return "Enter your password.";
    return null;
  }, [identifier, password]);

  const signupValidationError = useMemo(() => {
    if (!signupForm.name.trim()) return "Enter your full name.";
    if (!isValidEmail(signupForm.email)) return "Enter a valid email address.";
    if (signupForm.password.length < 8) return "Password must be at least 8 characters.";
    if (signupForm.password !== signupForm.confirmPassword) return "Passwords do not match.";
    return null;
  }, [signupForm]);

  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (reason === "session_expired" || reason === "unauthorized" || reason === "session_sync_required") {
      // BREAK REDIRECT LOOP: If the middleware just sent us here for a reason,
      // it means our session is likely invalid. Clear the store and stay here.
      clearAuth();
      return;
    }

    if (user) {
      redirectAfterAuth(router, user as AuthUser);
    }
  }, [router, user, reason, clearAuth]);

  useEffect(() => {
    router.prefetch("/login");
    router.prefetch("/register");
    router.prefetch("/onboarding");
    router.prefetch("/change-password");
    Array.from(new Set(Object.values(ROLE_HOME_ROUTES))).forEach((route) => router.prefetch(route));
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (loginValidationError) {
      setError(loginValidationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage("Signing you in...");

    try {
      const loggedInUser = await api.login({
        identifier: identifier.trim(),
        password,
        role_hint: activeRole ?? undefined,
      });

      setStatusMessage("Redirecting to your workspace...");
      setUser(loggedInUser);
      redirectAfterAuth(router, loggedInUser);
    } catch (err: any) {
      console.error("Login error:", err);
      // More descriptive error messages based on context
      let message = err.message || "Invalid credentials. Please try again.";
      
      if (message.includes("401") || message.toLowerCase().includes("invalid") || message.toLowerCase().includes("credentials")) {
        message = `Incorrect password for ${identifier}. Please try again.`;
      } else if (message.includes("404") || message.toLowerCase().includes("not found")) {
        message = `Account not found for ${identifier}. Check your email or sign up.`;
      }
      
      setError(message);
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (signupValidationError) {
      setError(signupValidationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage("Creating your account...");

    try {
      const createdUser = await api.createUser({
        name: signupForm.name.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
        role: signupForm.role,
      });

      setStatusMessage("Launching onboarding...");
      setUser(createdUser);
      redirectAfterAuth(router, createdUser);
    } catch (err: any) {
      setError(err?.message || "Unable to create your account right now.");
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[#060606] text-slate-100 flex overflow-hidden">
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden border-r border-white/6 bg-[#0b0b0b]">
        <Image
          src="/images/hero-yellow.png"
          alt="Lumina login preview"
          fill
          priority
          sizes="(min-width: 1024px) 44vw, 0px"
          quality={70}
          className="object-cover opacity-28 scale-105"
        />
        <div className="absolute inset-0 bg-[linear-gradient(165deg,rgba(6,6,6,1)_0%,rgba(6,6,6,0.85)_40%,rgba(250,204,21,0.08)_100%)]" />

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-14">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-lumina-highlight/30 bg-lumina-highlight/10 text-xl font-black text-lumina-highlight shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                L
              </div>
              <span className="font-display text-2xl font-black uppercase tracking-tight text-white drop-shadow-sm">Lumina</span>
            </div>

            <div className="space-y-6 max-w-xl">
              <div className="inline-flex items-center rounded-full border border-lumina-highlight/20 bg-lumina-highlight/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-lumina-highlight">
                Production Auth Flow
              </div>
              <h1 className="font-display text-5xl font-black leading-tight tracking-tight text-white">
                {isSignup ? "Create your Lumina account." : "Log in without the friction."}
              </h1>
              <p className="max-w-md text-base leading-7 text-slate-400">
                {isSignup
                  ? "Start with a clean account setup, then move directly into role-based onboarding and your assigned workspace."
                  : "Use your email, roll number, or employee ID. Lumina will route you to the right dashboard and restore your session cleanly."}
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            {featurePillars.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lumina-highlight" />
                <p className="text-sm leading-6 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center bg-[#060606] px-6 py-12 sm:px-8 lg:w-[56%] lg:px-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_55%)]" />
        <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-lumina-highlight/8 blur-[100px]" />

        <div className="relative z-10 w-full max-w-lg">
          {!isSignup ? (
            <button
              type="button"
              onClick={handleBack}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-lumina-highlight/35 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : null}

          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-lumina-highlight/30 bg-lumina-highlight/10 text-lg font-black text-lumina-highlight">
                  L
                </div>
                <span className="font-display text-xl font-black uppercase tracking-tight text-white">Lumina</span>
              </div>
              <h2 className="font-display text-4xl font-black tracking-tight text-white">
                {isSignup ? "Create account" : "Login to Lumina"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isSignup
                  ? "Choose your role once, set a password, and continue to guided onboarding."
                  : "Your account type can be detected automatically. Add a role hint only if you want to narrow the sign-in path."}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-2xl border border-white/8 bg-stone-900/70 p-1">
              <Link
                href="/login"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  !isSignup ? "bg-lumina-highlight text-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Login
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
            <form onSubmit={handleLogin} className="space-y-6 rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Account</p>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Primary action</span>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  Enter your email, roll number, or employee ID. Lumina will handle the routing after authentication.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Email, Roll Number, or Employee ID
                  </span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                      {activeRole === "faculty" ? <Building2 size={18} /> : activeRole === "student" ? <User size={18} /> : <Mail size={18} />}
                    </div>
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder={selectedHint?.helper || "name@college.edu or 22NU..."}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className={fieldClass(Boolean(error && !identifier.trim()))}
                      aria-invalid={Boolean(error && !identifier.trim())}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Password
                  </span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={fieldClass(Boolean(error && !password))}
                      aria-invalid={Boolean(error && !password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 pr-5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 transition-colors hover:text-lumina-highlight"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
              </div>

               <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Routing Mode</span>
                  <button
                    type="button"
                    onClick={() => setShowRoleHints(!showRoleHints)}
                    className="text-xs font-bold text-lumina-highlight transition-colors hover:text-amber-400"
                  >
                    {showRoleHints ? "Auto-detect only" : "Specific role hint?"}
                  </button>
                </div>

                {showRoleHints ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs leading-5 text-slate-400">
                      Selecting a role narrows the sign-in path and speeds up workspace routing.
                    </p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {loginRoleHints.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setActiveRole((current) => (current === role.id ? null : role.id))}
                          className={`flex flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition-all ${
                            activeRole === role.id
                              ? "border-lumina-highlight/40 bg-lumina-highlight/10 text-white shadow-[0_0_20px_rgba(250,204,21,0.1)]"
                              : "border-white/6 bg-black/40 text-slate-500 hover:border-white/12 hover:text-slate-300"
                          }`}
                        >
                          <role.icon className={`mb-2 h-5 w-5 ${activeRole === role.id ? "text-lumina-highlight" : ""}`} />
                          <span className="text-[13px] font-bold">{role.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : activeRole ? (
                  <div className="flex items-center gap-2 rounded-xl bg-lumina-highlight/10 px-3 py-2 text-xs font-bold text-lumina-highlight border border-lumina-highlight/20">
                    <CheckCircle2 size={14} />
                    <span>Role hint set: {activeRole}</span>
                    <button 
                      type="button" 
                      onClick={() => setActiveRole(null)}
                      className="ml-auto hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
              </div>

              {reason === "session_expired" && !error && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-sm font-bold text-amber-100">Session Expired</p>
                      <p className="mt-1 text-xs leading-5 text-amber-200/80">
                        Your session has timed out for security. Please log in again to continue.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {reason === "unauthorized" && !error && (
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                    <div>
                      <p className="text-sm font-bold text-blue-100">Authorization Required</p>
                      <p className="mt-1 text-xs leading-5 text-blue-200/80" id="login-auth-required-msg">
                        Please sign in to access the requested page.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    <p className="text-sm leading-6 text-red-100">{error}</p>
                  </div>
                </div>
              ) : null}

              {statusMessage ? (
                <div className="rounded-2xl border border-lumina-highlight/20 bg-lumina-highlight/8 px-4 py-3 text-sm text-lumina-highlight">
                  {statusMessage}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-slate-500">Secure session cookies are enabled automatically.</p>
                <Link
                  href="/auth/reset-password"
                  className="font-semibold text-lumina-highlight transition-colors hover:text-amber-400"
                >
                  Reset password
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-lumina-highlight px-5 py-4 text-base font-black text-black transition-all hover:translate-y-[-1px] hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6 rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-8">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white">Account setup</p>
                <p className="text-sm leading-6 text-slate-400">
                  Create your credentials first. Role-based onboarding continues immediately after account creation.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Full name</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm((prev) => ({ ...prev, name: e.target.value }))}
                      className={fieldClass(Boolean(error && !signupForm.name.trim()))}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Email</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="name@college.edu"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
                      className={fieldClass(Boolean(error && !isValidEmail(signupForm.email)))}
                    />
                  </div>
                </label>

                <div className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Select your role</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 rounded-2xl border border-white/8 bg-black/20 p-2">
                  {signupRoleOptions.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSignupForm((prev) => ({ ...prev, role: role.id }))}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-center transition-all ${
                        signupForm.role === role.id ? "bg-lumina-highlight text-black shadow-[0_0_16px_rgba(250,204,21,0.15)]" : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <role.icon size={18} />
                      <span className="text-[11px] font-bold leading-tight">{role.label}</span>
                    </button>
                  ))}
                  </div>
                  {signupForm.role && (
                    <p className="text-xs text-slate-500 pl-1">
                      {signupRoleOptions.find(r => r.id === signupForm.role)?.desc}
                    </p>
                  )}
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Password</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
                      className={fieldClass(Boolean(error && signupForm.password.length < 8))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 pr-5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 transition-colors hover:text-lumina-highlight"
                    >
                      {showSignupPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Confirm password</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className={fieldClass(Boolean(error && signupForm.password !== signupForm.confirmPassword))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 pr-5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 transition-colors hover:text-lumina-highlight"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    <p className="text-sm leading-6 text-red-100">{error}</p>
                  </div>
                </div>
              ) : null}

              {statusMessage ? (
                <div className="rounded-2xl border border-lumina-highlight/20 bg-lumina-highlight/8 px-4 py-3 text-sm text-lumina-highlight">
                  {statusMessage}
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">What happens next</p>
                <ul className="mt-3 space-y-2">
                  <li className="text-sm text-slate-300">You create credentials and keep a secure session.</li>
                  <li className="text-sm text-slate-300">Lumina routes you into onboarding for your role.</li>
                  <li className="text-sm text-slate-300">Your dashboard opens after onboarding is complete.</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-lumina-highlight px-5 py-4 text-base font-black text-black transition-all hover:translate-y-[-1px] hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-10 border-t border-white/6 pt-8 text-center">
            <p className="text-sm font-medium text-slate-500">
              {isSignup ? "Already have credentials?" : "Need an account first?"}{" "}
              <Link
                href={isSignup ? "/login" : "/register"}
                className="group inline-flex items-center gap-1 font-semibold text-white transition-colors hover:text-lumina-highlight"
              >
                {isSignup ? "Return to login" : "Create your account"}
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
