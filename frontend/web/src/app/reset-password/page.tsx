import { redirect } from "next/navigation";

type LegacyResetPasswordPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LegacyResetPasswordPage({
  searchParams,
}: LegacyResetPasswordPageProps) {
  const token = Array.isArray(searchParams?.token) ? searchParams?.token[0] : searchParams?.token;
  const nextPath = token
    ? `/auth/reset-password?token=${encodeURIComponent(token)}`
    : "/auth/reset-password";

  redirect(nextPath);
}
