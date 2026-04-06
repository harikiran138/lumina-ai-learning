"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);

  const resetToken = searchParams.get("token");
  const isTokenResetFlow = Boolean(resetToken);
  const isTempPasswordFlow = Boolean(tempToken);
  const isRequestResetFlow = !isTokenResetFlow && !isTempPasswordFlow;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setTempToken(sessionStorage.getItem("temp_token"));
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    try {
      if (resetToken) {
        await api.resetPassword(resetToken, data.password);
        toast.success("Password updated successfully. You can now log in.");
        router.push("/login");
        return;
      }

      await api.changePassword(data.password, tempToken);
      toast.success("Password updated successfully!");

      if (tempToken && typeof window !== "undefined") {
        sessionStorage.removeItem("temp_token");
      }

      const user = await api.getCurrentUser();
      if (user && (user as any).onboardingStep !== undefined && (user as any).onboardingStep < 5) {
        router.push("/onboarding");
      } else {
        const routes: Record<string, string> = {
          super_admin: "/admin",
          college_admin: "/college",
          hod: "/hod",
          faculty: "/teacher",
          student: "/student/dashboard",
        };
        router.push(routes[user?.role || ""] || "/student/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      toast.error("Enter your email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.forgotPassword(normalizedEmail);
      toast.success("If an account exists, a reset link has been sent.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isRequestResetFlow ? "Reset Your Password" : "Secure Your Account";
  const pageDescription = isRequestResetFlow
    ? "Enter your email and we'll send you a password reset link. You do not need your current password for this flow."
    : isTokenResetFlow
      ? "Choose a new password for your account. This reset link lets you update it directly without entering your current password."
      : "As this is your first login or your password was recently reset by an administrator, you are required to set a new secure password.";

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lumina-primary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lumina-highlight/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10 backdrop-blur-2xl bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-lumina-primary/10 border border-lumina-primary/20 mb-6">
                {isRequestResetFlow ? <Mail className="w-8 h-8 text-lumina-primary" /> : <ShieldCheck className="w-8 h-8 text-lumina-primary" />}
            </div>
          <h2 className="text-3xl font-extrabold text-white">{pageTitle}</h2>
          <p className="mt-4 text-sm text-gray-400 leading-relaxed">
            {pageDescription}
          </p>
        </div>

        {isRequestResetFlow ? (
          <form className="mt-8 space-y-6" onSubmit={onRequestReset}>
            <div>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary outline-none transition-all"
                  placeholder="Email address"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-lumina-primary text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-lumina-primary/20 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                Send Reset Link
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <label htmlFor="password" title="New Password" />
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary outline-none transition-all"
                    placeholder="New Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-lumina-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" title="Confirm Password" />
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" />
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary outline-none transition-all"
                    placeholder="Confirm New Password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-lumina-primary text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-lumina-primary/20 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                Update Password
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
