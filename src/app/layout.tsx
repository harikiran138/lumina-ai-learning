import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Lumina - AI-Powered Learning",
    description: "Personalized learning pathways powered by AI",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    {/* Global Scripts */}
                    <Script src="/js/utils.js?v=4" strategy="beforeInteractive" />
                    <Script src="/js/database.js?v=4" strategy="beforeInteractive" />
                    <Script src="/js/api.js?v=4" strategy="beforeInteractive" />
                </ThemeProvider>
            </body>
        </html>
    );
}
