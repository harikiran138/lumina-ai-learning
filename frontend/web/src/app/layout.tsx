import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import GlobalErrorBoundary from "@/components/layout/GlobalErrorBoundary";
import { ThemedToaster } from "@/components/providers/themed-toaster";

export const metadata: Metadata = {
  title: "Lumina AI",
  description: "Teacher-verified AI tutoring and adaptive learning platform.",
};

import { AuthProvider } from "@/components/providers/auth-provider";
import { OfflineBanner } from "@/components/shared/OfflineBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalErrorBoundary>
            <AuthProvider>
              <OfflineBanner />
              {children}
              <ThemedToaster />
            </AuthProvider>
          </GlobalErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
