'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import TopNav from '@/components/dashboard/TopNav';
import { useState } from 'react';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Sidebar />
            <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            {/* Mobile Sidebar Overlay - simplified for now */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <main className="lg:ml-64 pt-16 min-h-screen transition-all duration-300">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
