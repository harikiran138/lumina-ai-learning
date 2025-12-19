
"use client";

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { DottedSurface } from '@/components/ui/DottedSurface';

// Lazy load heavy sections
const FeaturesSection = dynamic(() => import('@/components/home/FeaturesSection'), {
    loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading Features...</div>,
});
const ForWhoSection = dynamic(() => import('@/components/home/ForWhoSection'), {
    loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading Content...</div>,
});
const HowItWorksSection = dynamic(() => import('@/components/home/HowItWorksSection'), {
    loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading Workflow...</div>,
});
const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection'), {
    loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading Testimonials...</div>,
});

export default function Home() {
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize Web Worker
        workerRef.current = new Worker('/analytics.worker.js');

        // Log initial page view via worker
        workerRef.current.postMessage({
            type: 'PROCESS_ANALYTICS',
            data: {
                timestamp: Date.now(),
                page: 'Home',
                action: 'View'
            }
        });

        workerRef.current.onmessage = (e) => {
            console.log('Worker response:', e.data);
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    return (
        <div className="text-white min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0">
                            <Link href="/" className="text-2xl font-bold text-white">
                                <span className="gradient-text">Lumina</span> ✨
                            </Link>
                        </div>
                        <div className="hidden md:flex md:items-center md:space-x-8">
                            <Link href="#features" className="text-gray-300 hover:text-amber-400 transition-colors">
                                Features
                            </Link>
                            <Link href="#for-who" className="text-gray-300 hover:text-amber-400 transition-colors">
                                For Who?
                            </Link>
                            <Link href="#testimonials" className="text-gray-300 hover:text-amber-400 transition-colors">
                                Testimonials
                            </Link>
                            <Link href="/login" className="text-gray-300 hover:text-amber-400 transition-colors">
                                Sign In
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="hidden md:inline-block bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">
                                Get Started
                            </Link>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                    <DottedSurface />
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center py-16">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                            The Future of Learning, <br /> <span className="gradient-text">Personalized for You.</span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300">
                            Lumina is an AI-driven, self-hosted platform that transforms your course materials into adaptive
                            learning pathways, automated assessments, and engaging experiences.
                        </p>
                        <div className="mt-8 flex justify-center space-x-4">
                            <Link href="/login" className="bg-amber-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-amber-600 transition-colors text-lg shadow-lg shadow-amber-500/20">
                                Start Learning
                            </Link>
                            <Link href="#features" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 px-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-lg shadow-lg dark:shadow-white/5">
                                Learn More
                            </Link>
                        </div>
                    </div>
                </section>

                <FeaturesSection />
                <ForWhoSection />
                <HowItWorksSection />
                <TestimonialsSection />

            </main>

            {/* Footer */}
            <footer className="bg-white/5 backdrop-blur-sm border-t border-white/10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-600 dark:text-gray-400">
                        <span className="gradient-text font-semibold">&copy; 2025 Lumina. All rights reserved.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
