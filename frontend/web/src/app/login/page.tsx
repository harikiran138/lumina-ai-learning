import { Suspense } from "react";
import AuthGateway from "@/components/auth/AuthGateway";
import AuthSkeleton from "@/components/auth/AuthSkeleton";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthGateway mode="login" />
    </Suspense>
  );
}
