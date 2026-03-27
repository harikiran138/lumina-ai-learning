"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from "@/lib/schemas/auth";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors, isSubmitting: isSigningIn },
    setValue: setSignInValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors, isSubmitting: isSigningUp },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "student" },
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          window.location.href = `/${user.role}/dashboard`;
        }
      } catch (e) {
        console.error("Session check failed:", e);
      }
    };
    checkSession();
  }, []);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    try {
      const user = await api.login(loginEmail, loginPassword);
      
      // Perform an onboarding check via Supabase
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      let needsOnboarding = false;
      if (user && (user.role === "student" || user.role === "teacher" || user.role === "hod")) {
        const { data: userMeta } = await supabase
          .from("user_data")
          .select("progress")
          .eq("user_id", user.id)
          .maybeSingle();
        const progress = (userMeta?.progress as Record<string, any>) || {};
        if (progress?.onboarding_status === "COMPLETED") {
          needsOnboarding = false;
        } else if (user.role === "student") {
          const { data } = await supabase
            .from("student_enrollments")
            .select("id")
            .eq("student_id", user.id)
            .limit(1);
          if (!data || data.length === 0) needsOnboarding = true;
        } else {
          const { data } = await supabase
            .from("users")
            .select("department_id")
            .eq("id", user.id)
            .single();
          if (!data?.department_id) needsOnboarding = true;
        }
      }

      if (needsOnboarding) {
        window.location.href = "/onboarding";
        return;
      }
      
      if (user && user.role) {
        window.location.href = `/${user.role}/dashboard`;
      } else {
        window.location.href = "/student/dashboard";
      }
    } catch (error: any) {
      const message = error.message || "Login failed";
      toast.error(message);
    }
  };

  const onSignIn = async (data: LoginFormData) => {
    await performLogin(data.email, data.password);
  };

  const onSignUp = async (data: RegisterFormData) => {
    try {
      const newUser = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role ?? "student",
        status: "active" as const,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
        preferences: { theme: "dark", notifications: true },
        createdAt: new Date().toISOString(),
      };
      const user = await api.createUser(newUser);
      if (user?.role === "student" || user?.role === "teacher" || user?.role === "hod") {
        window.location.href = "/onboarding";
      } else if (user && user.role) {
        window.location.href = `/${user.role}/dashboard`;
      } else {
        window.location.href = "/student/dashboard";
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    }
  };

  const quickLogin = async (role: string) => {
    const defaultUsers: Record<string, { email: string; password: string }> = {
      admin: { email: "admin@lumina.ai", password: "DemoPassword123!" },
      teacher: { email: "teacher@lumina.ai", password: "DemoPassword123!" },
      student: { email: "student@lumina.ai", password: "DemoPassword123!" },
      parent: { email: "parent@lumina.ai", password: "DemoPassword123!" },
      mentor: { email: "mentor@lumina.ai", password: "DemoPassword123!" },
      counselor: { email: "counselor@lumina.ai", password: "DemoPassword123!" },
      researcher: { email: "researcher@lumina.ai", password: "DemoPassword123!" },
      content_creator: { email: "creator@lumina.ai", password: "DemoPassword123!" },
    };
    const userData = defaultUsers[role];
    if (userData) {
      await performLogin(userData.email, userData.password);
    }
  };

  const isLoading = isSigningIn || isSigningUp;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black text-white transition-colors duration-300 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lumina-primary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lumina-secondary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button
          id="theme-toggle"
          suppressHydrationWarning
          className="p-2 rounded-lg glass text-lumina-primary hover:bg-lumina-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary"
          aria-label="Toggle theme"
        >
          <span className="text-xl" aria-hidden="true">🌓</span>
        </button>
      </div>

      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="p-2 rounded-lg flex items-center text-gray-400 hover:text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
          <span className="font-medium">Back</span>
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10 backdrop-blur-2xl bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div>
          <Link href="/" className="flex justify-center text-3xl font-bold">
            <span className="gradient-text">Lumina</span> ✨
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {activeTab === "signin" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {activeTab === "signin"
              ? "Enter your details to access your dashboard"
              : "Join our learning community today"}
          </p>
        </div>

        <div className="flex justify-center rounded-xl bg-black/40 p-1 border border-white/10">
          <button
            suppressHydrationWarning
            onClick={() => setActiveTab("signin")}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary ${activeTab === "signin"
                ? "bg-lumina-primary text-black shadow-lg shadow-lumina-primary/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            Sign In
          </button>
          <button
            suppressHydrationWarning
            onClick={() => setActiveTab("signup")}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary ${activeTab === "signup"
                ? "bg-lumina-primary text-black shadow-lg shadow-lumina-primary/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Demo Login Buttons — only visible when NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true */}
        {process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === 'true' && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <button type="button" suppressHydrationWarning onClick={() => quickLogin("student")} className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded border border-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lumina-primary">Student</button>
          <button type="button" suppressHydrationWarning onClick={() => quickLogin("teacher")} className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded border border-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lumina-primary">Teacher</button>
          <button type="button" suppressHydrationWarning onClick={() => quickLogin("parent")} className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded border border-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lumina-primary">Parent</button>
          <button type="button" suppressHydrationWarning onClick={() => quickLogin("mentor")} className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded border border-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lumina-primary">Mentor</button>
          <button type="button" suppressHydrationWarning onClick={() => quickLogin("counselor")} className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded border border-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lumina-primary">Counselor</button>
          <button type="button" suppressHydrationWarning onClick={() => quickLogin("researcher")} className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded border border-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lumina-primary">Researcher</button>
          <button type="button" suppressHydrationWarning onClick={() => quickLogin("content_creator")} className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded border border-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lumina-primary">Creator</button>
        </div>
        )}

        {activeTab === "signin" ? (
          <form
            id="signin-form"
            className="mt-8 space-y-6"
            onSubmit={handleSignInSubmit(onSignIn)}
            noValidate
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="signin-email" className="sr-only">Email address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" aria-hidden="true" />
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    suppressHydrationWarning
                    {...registerSignIn("email")}
                    aria-describedby={signInErrors.email ? "signin-email-error" : undefined}
                    aria-invalid={!!signInErrors.email}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-lumina-primary/50 focus-visible:border-lumina-primary outline-none transition-all placeholder:text-sm"
                    placeholder="Email address"
                  />
                </div>
                {signInErrors.email && (
                  <p id="signin-email-error" className="text-sm text-red-400 mt-1" role="alert">
                    {signInErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="signin-password" className="sr-only">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" aria-hidden="true" />
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    suppressHydrationWarning
                    {...registerSignIn("password")}
                    aria-describedby={signInErrors.password ? "signin-password-error" : undefined}
                    aria-invalid={!!signInErrors.password}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-lumina-primary/50 focus-visible:border-lumina-primary outline-none transition-all placeholder:text-sm"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-lumina-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary rounded"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
                {signInErrors.password && (
                  <p id="signin-password-error" className="text-sm text-red-400 mt-1" role="alert">
                    {signInErrors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  suppressHydrationWarning
                  className="h-4 w-4 rounded border-gray-700 bg-white/5 text-lumina-primary focus:ring-lumina-primary/50"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-400">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-lumina-primary hover:text-yellow-400 text-xs">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                suppressHydrationWarning
                className="glass-button w-full flex justify-center py-3 px-4 text-sm font-bold shadow-lg shadow-lumina-primary/20 transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        ) : (
          <form
            id="signup-form"
            className="mt-8 space-y-6"
            onSubmit={handleSignUpSubmit(onSignUp)}
            noValidate
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="signup-name" className="sr-only">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" aria-hidden="true" />
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    suppressHydrationWarning
                    {...registerSignUp("name")}
                    aria-describedby={signUpErrors.name ? "signup-name-error" : undefined}
                    aria-invalid={!!signUpErrors.name}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-lumina-primary/50 focus-visible:border-lumina-primary outline-none transition-all placeholder:text-sm"
                    placeholder="Full Name"
                  />
                </div>
                {signUpErrors.name && (
                  <p id="signup-name-error" className="text-sm text-red-400 mt-1" role="alert">
                    {signUpErrors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="signup-email" className="sr-only">Email address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" aria-hidden="true" />
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    suppressHydrationWarning
                    {...registerSignUp("email")}
                    aria-describedby={signUpErrors.email ? "signup-email-error" : undefined}
                    aria-invalid={!!signUpErrors.email}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-lumina-primary/50 focus-visible:border-lumina-primary outline-none transition-all placeholder:text-sm"
                    placeholder="Email address"
                  />
                </div>
                {signUpErrors.email && (
                  <p id="signup-email-error" className="text-sm text-red-400 mt-1" role="alert">
                    {signUpErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="signup-password" className="sr-only">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" aria-hidden="true" />
                  <input
                    id="signup-password"
                    type={showSignupPassword ? "text" : "password"}
                    autoComplete="new-password"
                    suppressHydrationWarning
                    {...registerSignUp("password")}
                    aria-describedby={signUpErrors.password ? "signup-password-error" : undefined}
                    aria-invalid={!!signUpErrors.password}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-lumina-primary/50 focus-visible:border-lumina-primary outline-none transition-all placeholder:text-sm"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    aria-label={showSignupPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-lumina-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary rounded"
                  >
                    {showSignupPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
                {signUpErrors.password && (
                  <p id="signup-password-error" className="text-sm text-red-400 mt-1" role="alert">
                    {signUpErrors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="sr-only">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" aria-hidden="true" />
                  <input
                    id="signup-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    suppressHydrationWarning
                    {...registerSignUp("confirmPassword")}
                    aria-describedby={signUpErrors.confirmPassword ? "signup-confirm-error" : undefined}
                    aria-invalid={!!signUpErrors.confirmPassword}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-lumina-primary/50 focus-visible:border-lumina-primary outline-none transition-all placeholder:text-sm"
                    placeholder="Confirm Password"
                  />
                </div>
                {signUpErrors.confirmPassword && (
                  <p id="signup-confirm-error" className="text-sm text-red-400 mt-1" role="alert">
                    {signUpErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="sr-only">Select your role</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" aria-hidden="true" />
                  <select
                    id="role"
                    {...registerSignUp("role")}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-lumina-primary/50 focus-visible:border-lumina-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-gray-900 text-gray-400">Select your role</option>
                    <option value="student" className="bg-gray-900 text-white">Student</option>
                    <option value="teacher" className="bg-gray-900 text-white">Teacher</option>
                    <option value="parent" className="bg-gray-900 text-white">Parent</option>
                    <option value="mentor" className="bg-gray-900 text-white">Industry Mentor</option>
                    <option value="counselor" className="bg-gray-900 text-white">Counselor</option>
                    <option value="researcher" className="bg-gray-900 text-white">Researcher</option>
                    <option value="content_creator" className="bg-gray-900 text-white">Content Creator</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                suppressHydrationWarning
                className="glass-button w-full flex justify-center py-3 px-4 text-sm font-bold shadow-lg shadow-lumina-primary/20 transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSigningUp ? (
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
