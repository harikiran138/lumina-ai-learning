import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import GlobalErrorBoundary from "@/components/layout/GlobalErrorBoundary";

// Optimize font loading with display swap
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Lumina | The AI Learning Platform That Adapts to Every Student",
  description:
    "A privacy-first, teacher-verified AI learning system that personalizes education for every learner through adaptive knowledge modeling and Human-in-the-Loop verification.",
  keywords: [
    "AI learning platform",
    "adaptive education",
    "AI tutor",
    "smart classroom",
    "learning analytics",
    "teacher verification system",
    "personalized learning pathways",
    "k-anonymity",
    "BKT mastery tracking",
    "DKT deep knowledge modeling"
  ],
  authors: [{ name: "Lumina Team" }],
  openGraph: {
    title: "Lumina | The AI Learning Platform That Adapts to Every Student",
    description: "Privacy-first, teacher-verified AI learning system that personalizes education for every learner.",
    type: "website",
    url: "https://lumina.ai",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lumina AI Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumina | The AI Learning Platform That Adapts to Every Student",
    description: "Privacy-first, teacher-verified AI learning system that personalizes education for every learner.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <GlobalErrorBoundary>{children}</GlobalErrorBoundary>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
