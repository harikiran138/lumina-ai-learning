import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";

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
                {children}
                {/* Global Scripts */}
                <Script src="/js/utils.js?v=3" strategy="beforeInteractive" />
                <Script src="/js/database.js?v=3" strategy="beforeInteractive" />
                <Script src="/js/api.js?v=3" strategy="beforeInteractive" />
            </body>
        </html>
    );
}
