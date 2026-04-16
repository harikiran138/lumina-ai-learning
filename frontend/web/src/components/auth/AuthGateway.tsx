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
import { registerSchema } from "@/lib/schemas/auth";
import { getRoleHome, ROLE_HOME_ROUTES, normalizeRole } from "@/lib/role-routing";
import { useAuthStore } from "@/store/useAuthStore";
import { Role } from "@/lib/rbac/roles";

type LoginRole = Role;
type SignupRole = Role;
type AuthMode = "login" | "signup";

type SignupForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: SignupRole;
};

const loginRoleHints: Array<{
  id: Role;
  label: string;
  icon: typeof GraduationCap;
  helper: string;
}> = [
  { id: Role.STUDENT, label: "Student", icon: GraduationCap, helper: "Roll number or student email" },
  { id: Role.FACULTY, label: "Faculty", icon: BookOpen, helper: "Faculty ID or institutional email" },
  { id: Role.HOD, label: "HOD", icon: Crown, helper: "Department head credentials" },
  { id: Role.ADMIN, label: "Campus Admin", icon: ShieldCheck, helper: "Administrative access" },
  { id: Role.PARENT, label: "Parent", icon: Users, helper: "Linked email" },
  { id: Role.COUNSELOR, label: "Counselor", icon: Heart, helper: "Wellness portal email" },
  { id: Role.PEER_MENTOR, label: "Peer Mentor", icon: Compass, helper: "Mentor login" },
  { id: Role.ALUMNI, label: "Alumni", icon: School, helper: "Alumni ID" },
  { id: Role.SUPER_ADMIN, label: "Platform Admin", icon: Lock, helper: "Global root access" },
];

const signupRoleOptions: Array<{ id: Role; label: string; icon: typeof GraduationCap; desc: string }> = [
  { id: Role.STUDENT, label: "Student", icon: GraduationCap, desc: "Adaptive AI learning" },
  { id: Role.FACULTY, label: "Faculty", icon: BookOpen, desc: "Content & Verification" },
  { id: Role.PARENT, label: "Parent", icon: Users, desc: "Monitor your child" },
  { id: Role.COUNSELOR, label: "Counselor", icon: Heart, desc: "Wellness support" },
  { id: Role.PEER_MENTOR, label: "Peer Mentor", icon: Compass, desc: "Lead fellow scholars" },
  { id: Role.ALUMNI, label: "Alumni", icon: School, desc: "Legacy & Networking" },
];

const featurePillars = [
  "Teacher-verified AI learning support",
  "Role-aware dashboards and onboarding",
  "Secure session handling with guided setup",
];

function fieldClass(hasError: boolean) {
  return [
    "w-full rounded-2xl border bg-surface text-text outline-none transition-all font-medium",
    "py-4 pl-14 pr-14 placeholder:text-text-muted",
    hasError
      ? "border-red-500/40 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
      : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
  ].join(" ");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function redirectAfterAuth(router: ReturnType<typeof useRouter>, user: AuthUser) {
  // Use normalization to ensure we match correctly
  const canonicalRole = normalizeRole(user.role);
  
  // Platform admins and system roles usually bypass common onboarding or have special flows
  const bypassOnboarding = [Role.SUPER_ADMIN, Role.ADMIN].includes(canonicalRole as Role);
  
  // In our new 9-role system, onboarding is strictly defined in lib/role-onboarding.ts
  // The backend onboardingCompleted flag is the primary source of truth.
  let isComplete = user.onboardingCompleted;
  
  // Fallback for demo users or legacy sessions
  if (isComplete === undefined) {
    isComplete = (user.onboardingStep ?? 0) >= 2; // All roles now have at least 1-2 steps
  }

  const needsOnboarding = !bypassOnboarding && isComplete === false;

  const destination = user.mustChangePassword
    ? "/change-password"
    : needsOnboarding
      ? "/onboarding"
      : getRoleHome(user.role);

  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) {
    router.replace(destination);
    return;
  }

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
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    const result = registerSchema.safeParse(signupForm);
    if (!result.success) {
      return result.error.issues[0]?.message || "Check the information and try again.";
    }
    return null;
  }, [signupForm]);

  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthHydrating = useAuthStore((state) => state.isLoading);


  useEffect(() => {
    if (searchParams.get("logout") === "true") {
      api.logout();
      return;
    }

    if (reason === "session_expired" || reason === "unauthorized" || reason === "session_sync_required") {
      // BREAK REDIRECT LOOP: middleware sent us here because the session is invalid.
      // Clear any stale store state and stay on the login page.
      clearAuth();
      return;
    }

    // Wait until AuthProvider finishes its backend check before acting on
    // the store's user value — prevents redirecting on stale localStorage data.
    if (isAuthHydrating) return;

    if (user) {
      redirectAfterAuth(router, user as AuthUser);
    }
  }, [router, user, reason, clearAuth, isAuthHydrating]);

  useEffect(() => {
    router.prefetch("/login");
    router.prefetch("/register");
    router.prefetch("/onboarding");
    router.prefetch("/change-password");
    Array.from(new Set(Object.values(ROLE_HOME_ROUTES))).forEach((route) => router.prefetch(route));
  }, [router]);

  async function handleDemoLogin(email: string) {
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "Lumina@Demo2025";
    setIdentifier(email);
    setPassword(demoPassword);
    setIsLoading(true);
    setError(null);
    setStatusMessage("Logging in with demo account…");
    try {
      const loggedInUser = await api.login({
        identifier: email,
        password: demoPassword,
        role_hint: "student",
      });
      setUser(loggedInUser);
      redirectAfterAuth(router, loggedInUser);
    } catch (err: any) {
      setError(err?.message ?? "Demo login failed. Check NEXT_PUBLIC_DEMO_PASSWORD.");
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  }

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
      // 🔍 DEBUG: Log request body structure
      const loginPayload = {
        identifier: identifier.trim(),
        password,
        role_hint: activeRole || "student",
      };
      console.log("[AUTH] Login payload:", loginPayload);

      const loggedInUser = await api.login(loginPayload);

      console.log("[AUTH] Login successful:", loggedInUser.email, "Role:", loggedInUser.role);
      setStatusMessage("Redirecting to your workspace...");
      setUser(loggedInUser);
      redirectAfterAuth(router, loggedInUser);
    } catch (err: any) {
      console.error("[AUTH] Login error:", err);
      // More descriptive error messages based on context
      let message = err.message || "Invalid credentials. Please try again.";
      
      if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
        message = "Too many login attempts. Please wait a minute before trying again.";
      } else if (message.includes("401") || message.toLowerCase().includes("invalid") || message.toLowerCase().includes("credentials")) {
        message = `Incorrect password for ${identifier}. Please try again.`;
      } else if (message.includes("404") || message.toLowerCase().includes("not found")) {
        message = `Account not found for ${identifier}. Check your email or sign up.`;
      } else if (message.includes("422") || message.toLowerCase().includes("unprocessable")) {
        message = `Invalid login format. Please check your input and try again.`;
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
      // 🔍 DEBUG: Log signup payload
      const signupPayload = {
        name: signupForm.name.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
        role: signupForm.role || "student",
      };
      console.log("[AUTH] Signup payload:", signupPayload);

      const createdUser = await api.createUser(signupPayload);

      console.log("[AUTH] Signup successful:", createdUser.email, "Role:", createdUser.role);
      setStatusMessage("Launching onboarding...");
      setUser(createdUser);
      redirectAfterAuth(router, createdUser);
    } catch (err: any) {
      console.error("[AUTH] Signup error:", err);
      let message = err?.message || "Unable to create your account right now.";
      
      if (message.includes("400") || message.toLowerCase().includes("already exists") || message.toLowerCase().includes("email")) {
        message = `Email ${signupForm.email} is already registered. Please sign in instead.`;
      } else if (message.includes("422") || message.toLowerCase().includes("unprocessable") || message.toLowerCase().includes("field required")) {
        message = `Please check all required fields are filled correctly.`;
      } else if (message.includes("403") || message.toLowerCase().includes("requires an invitation")) {
        message = `Registration as '${signupForm.role}' requires an admin invitation.`;
      }
      
      setError(message);
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

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-surface text-text flex overflow-hidden">
        {/* Static Placeholder to prevent hydration flicker while maintaining layout structure */}
        <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden border-r border-border bg-surface-elevated">
          <div className="absolute inset-0 bg-surface" />
        </div>
        <div className="relative flex w-full items-center justify-center bg-surface px-6 py-12 lg:w-[56%]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-text flex overflow-hidden">
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden border-r border-border bg-surface-elevated">
        <Image
          src="/images/hero-yellow.png"
          alt="Lumina login preview"
          fill
          priority
          sizes="(min-width: 1024px) 44vw, 0px"
          quality={70}
          className="object-cover opacity-20 dark:opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface/90 to-primary/10" />

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-14">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-xl font-black text-primary shadow-sm">
                L
              </div>
              <span className="font-display text-2xl font-black uppercase tracking-tight text-text">Lumina</span>
            </div>

            <div className="space-y-6 max-w-xl">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Production Auth Flow
              </div>
              <h1 className="font-display text-5xl font-black leading-tight tracking-tight text-text">
                {isSignup ? "Create your Lumina account." : "Log in without the friction."}
              </h1>
              <p className="max-w-md text-base leading-7 text-text-secondary">
                {isSignup
                  ? "Start with a clean account setup, then move directly into role-based onboarding and your assigned workspace."
                  : "Use your email, roll number, or employee ID. Lumina will route you to the right dashboard and restore your session cleanly."}
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            {featurePillars.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-surface/50 px-4 py-4 backdrop-blur-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm leading-6 text-text-secondary">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center bg-surface px-6 py-12 sm:px-8 lg:w-[56%] lg:px-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,var(--primary-glow),transparent_55%)]" />
        <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary/5 blur-[100px]" />

        <div className="relative z-10 w-full max-w-lg">
          {!isSignup ? (
            <button
              type="button"
              onClick={handleBack}
              suppressHydrationWarning
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-primary/35 hover:text-text"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : null}

          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-lg font-black text-primary">
                  L
                </div>
                <span className="font-display text-xl font-black uppercase tracking-tight text-text">Lumina</span>
              </div>
              <h2 className="font-display text-4xl font-black tracking-tight text-text">
                {isSignup ? "Create account" : "Login to Lumina"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {isSignup
                  ? "Choose your role once, set a password, and continue to guided onboarding."
                  : "Your account type can be detected automatically. Add a role hint only if you want to narrow the sign-in path."}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-2xl border border-border bg-surface-elevated p-1">
              <Link
                href="/login"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  !isSignup ? "bg-primary text-primary-foreground shadow-sm" : "text-text-muted hover:text-text"
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  isSignup ? "bg-primary text-primary-foreground shadow-sm" : "text-text-muted hover:text-text"
                }`}
              >
                Sign Up
              </Link>
            </div>
          </div>

          {!isSignup ? (
            <form onSubmit={handleLogin} className="space-y-6 rounded-[2rem] border border-border bg-surface-elevated p-6 shadow-xl sm:p-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text">Account</p>
                  <span className="text-xs uppercase tracking-[0.24em] text-text-muted">Primary action</span>
                </div>
                <p className="text-sm leading-6 text-text-muted">
                  Enter your email, roll number, or employee ID. Lumina will handle the routing after authentication.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
                    Email, Roll Number, or Employee ID
                  </span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-text-muted">
                      {activeRole === "faculty" ? <Building2 size={18} /> : activeRole === "student" ? <User size={18} /> : <Mail size={18} />}
                    </div>
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder={selectedHint?.helper || "name@college.edu or 22NU..."}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      suppressHydrationWarning
                      className={fieldClass(Boolean(error && !identifier.trim()))}
                      aria-invalid={Boolean(error && !identifier.trim())}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
                    Password
                  </span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-text-muted">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      suppressHydrationWarning
                      className={fieldClass(Boolean(error && !password))}
                      aria-invalid={Boolean(error && !password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      suppressHydrationWarning
                      className="absolute inset-y-0 right-0 pr-5 text-[10px] font-black uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-primary"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
              </div>

               <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-text-muted">Routing Mode</span>
                  <button
                    type="button"
                    onClick={() => setShowRoleHints(!showRoleHints)}
                    suppressHydrationWarning
                    className="text-xs font-bold text-primary transition-colors hover:text-primary/80"
                  >
                    {showRoleHints ? "Auto-detect only" : "Specific role hint?"}
                  </button>
                </div>

                {showRoleHints ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs leading-5 text-text-muted">
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
                              ? "border-primary/40 bg-primary/10 text-text shadow-sm"
                              : "border-border bg-surface hover:border-text/20 hover:text-text"
                          }`}
                        >
                          <role.icon className={`mb-2 h-5 w-5 ${activeRole === role.id ? "text-primary" : "text-text-muted"}`} />
                          <span className="text-[13px] font-bold">{role.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : activeRole ? (
                  <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary border border-primary/20">
                    <CheckCircle2 size={14} />
                    <span>Role hint set: {activeRole}</span>
                    <button 
                      type="button" 
                      onClick={() => setActiveRole(null)}
                      className="ml-auto hover:text-text transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
              </div>

              {reason === "session_expired" && !error && (
                <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-bold text-primary">Session Expired</p>
                      <p className="mt-1 text-xs leading-5 text-text-secondary opacity-80">
                        Your session has timed out for security. Please log in again to continue.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {reason === "unauthorized" && !error && (
                <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-bold text-primary">Authorization Required</p>
                      <p className="mt-1 text-xs leading-5 text-text-secondary opacity-80" id="login-auth-required-msg">
                        Please sign in to access the requested page.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <p className="text-sm leading-6 text-red-700 dark:text-red-200">{error}</p>
                  </div>
                </div>
              ) : null}

              {statusMessage ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                  {statusMessage}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-text-muted">Secure session cookies are enabled automatically.</p>
                <Link
                  href="/auth/reset-password"
                  className="font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Reset password
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                suppressHydrationWarning
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 text-base font-black text-primary-foreground transition-all hover:translate-y-[-1px] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
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

              {/* ── Demo quick-login (visible only in DEMO_MODE) ─────────────── */}
              {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
                <div className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-[0.2em] mb-3 text-center">
                    Demo Quick Login
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { role: "Super Admin",  email: "superadmin@demo.lumina.ai",          color: "purple" },
                      { role: "Admin",        email: "admin@nsrit.demo.lumina.ai",          color: "blue"   },
                      { role: "HOD",          email: "hod@nsrit.demo.lumina.ai",            color: "indigo" },
                      { role: "Supervisor",   email: "supervisor@nsrit.demo.lumina.ai",     color: "teal"   },
                      { role: "Teacher",      email: "teacher@nsrit.demo.lumina.ai",        color: "green"  },
                      { role: "Student",      email: "student@nsrit.demo.lumina.ai",        color: "orange" },
                    ] as const).map(({ role, email, color }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleDemoLogin(email)}
                        disabled={isLoading}
                        className={`text-[11px] py-2 px-2 rounded-xl border transition-colors font-semibold disabled:opacity-40
                          text-${color}-400 bg-${color}-500/10 border-${color}-500/20 hover:bg-${color}-500/20`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6 rounded-[2rem] border border-border bg-surface-elevated p-6 shadow-xl sm:p-8">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-text">Account setup</p>
                <p className="text-sm leading-6 text-text-muted">
                  Create your credentials first. Role-based onboarding continues immediately after account creation.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Full name</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-text-muted">
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
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Email</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-text-muted">
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
                  <span className="block text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Select your role</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 rounded-2xl border border-border bg-surface p-2">
                  {signupRoleOptions.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSignupForm((prev) => ({ ...prev, role: role.id }))}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-center transition-all ${
                        signupForm.role === role.id ? "bg-primary text-primary-foreground shadow-sm" : "text-text-muted hover:bg-surface-elevated hover:text-text"
                      }`}
                    >
                      <role.icon size={18} />
                      <span className="text-[11px] font-bold leading-tight">{role.label}</span>
                    </button>
                  ))}
                  </div>
                  {signupForm.role && (
                    <p className="text-xs text-text-muted pl-1">
                      {signupRoleOptions.find(r => r.id === signupForm.role)?.desc}
                    </p>
                  )}
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Password</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-text-muted">
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
                      className="absolute inset-y-0 right-0 pr-5 text-[10px] font-black uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-primary"
                    >
                      {showSignupPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Confirm password</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-text-muted">
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
                      className="absolute inset-y-0 right-0 pr-5 text-[10px] font-black uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-primary"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <p className="text-sm leading-6 text-red-700 dark:text-red-200">{error}</p>
                  </div>
                </div>
              ) : null}

              {statusMessage ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                  {statusMessage}
                </div>
              ) : null}

              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">What happens next</p>
                <ul className="mt-3 space-y-2">
                  <li className="text-sm text-text-secondary">You create credentials and keep a secure session.</li>
                  <li className="text-sm text-text-secondary">Lumina routes you into onboarding for your role.</li>
                  <li className="text-sm text-text-secondary">Your dashboard opens after onboarding is complete.</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 text-base font-black text-primary-foreground transition-all hover:translate-y-[-1px] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="mt-10 border-t border-border pt-8 text-center">
            <p className="text-sm font-medium text-text-muted">
              {isSignup ? "Already have credentials?" : "Need an account first?"}{" "}
              <Link
                href={isSignup ? "/login" : "/register"}
                className="group inline-flex items-center gap-1 font-semibold text-text transition-colors hover:text-primary"
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
