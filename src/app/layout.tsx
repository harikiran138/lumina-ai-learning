import '@/app/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Lumina AI Learning - Intelligent Dashboard',
    description: 'Production-grade AI learning platform with multi-agent workflow intelligence',
    keywords: ['AI', 'Learning', 'Education', 'Multi-Agent', 'Dashboard'],
    authors: [{ name: 'Lumina Team' }],
    openGraph: {
        title: 'Lumina AI Learning',
        description: 'Intelligent AI Dashboard with Multi-Agent System',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} bg-lumina-dark text-white antialiased`}>
                {children}
                <Analytics />
            </body>
        </html>
    );
}
