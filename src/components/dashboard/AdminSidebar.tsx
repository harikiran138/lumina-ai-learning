
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, Database, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'System', href: '/admin/system', icon: Database },
    { name: 'Security', href: '/admin/security', icon: Shield },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    const router = useRouter();

    const handleLogout = async () => {
        await api.logout();
        router.push('/login');
    };

    return (
        <aside className="fixed left-4 top-4 bottom-4 w-64 backdrop-blur-3xl bg-black/20 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-30 hidden lg:flex flex-col rounded-3xl transition-all duration-300">
            <div className="flex items-center justify-center h-16 border-b border-white/10">
                <Link href="/" className="text-2xl font-bold">
                    <span className="gradient-text">Lumina</span> ✨
                </Link>
            </div>
            <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            suppressHydrationWarning
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300",
                                isActive
                                    ? "bg-lumina-primary/20 text-lumina-primary shadow-[0_0_15px_rgba(255,215,0,0.1)] border border-lumina-primary/10"
                                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200 hover:translate-x-1"
                            )}
                        >
                            <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-lumina-primary" : "text-gray-500 group-hover:text-gray-300")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
                <button
                    onClick={handleLogout}
                    suppressHydrationWarning
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-300"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
