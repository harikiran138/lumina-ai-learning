
'use client';

import AdminSidebar from '@/components/dashboard/AdminSidebar';
import TopNav from '@/components/dashboard/TopNav';
import { BGPattern } from '@/components/ui/BGPattern';
import { useState } from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen relative overflow-hidden bg-black text-gray-100">
            <BGPattern
                variant="grid"
                size={32}
                fill="rgba(100, 100, 100, 0.05)"
                className="fixed inset-0 z-0 pointer-events-none"
            />

            <AdminSidebar />
            <TopNav
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                user={{ name: 'Admin User', role: 'Administrator', initial: 'A' }}
            />

            {/* Mobile Sidebar Overlay */}
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
