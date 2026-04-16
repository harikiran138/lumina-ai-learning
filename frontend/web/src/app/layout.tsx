import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
            try {
              var theme = localStorage.getItem("theme");
              var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              var finalTheme = theme || (prefersDark ? "dark" : "light");
              document.documentElement.setAttribute("data-theme", finalTheme);
              document.documentElement.classList.toggle("dark", finalTheme === "dark");
            } catch (error) {}
          })();`}
        </Script>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          enableColorScheme
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
