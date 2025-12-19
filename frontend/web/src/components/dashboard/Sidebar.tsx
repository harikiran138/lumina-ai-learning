'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, MessageSquare, BarChart2, User, Settings, LogOut, Bot, FileText, X, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const navItems = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Assignments', href: '/student/assignments', icon: FileText },
    { name: 'AI Tutor', href: '/student/ai_tutor', icon: Bot },
    { name: 'Assessment', href: '/student/assessment', icon: Brain },
    { name: 'My Courses', href: '/student/courses', icon: BookOpen },
    { name: 'My Notes', href: '/student/my_notes', icon: FileText },
    { name: 'Community', href: '/student/community', icon: MessageSquare },
    { name: 'Progress', href: '/student/progress', icon: BarChart2 },
    { name: 'Profile', href: '/student/profile', icon: User },
    { name: 'Settings', href: '/student/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await api.getCurrentUser();
            setUser(userData);
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await api.logout();
        router.push('/login');
    };

    return (
        <aside className={cn(
            "fixed left-4 top-4 bottom-4 w-64 backdrop-blur-3xl bg-black/20 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-50 rounded-3xl transition-transform duration-300 lg:translate-x-0 lg:flex flex-col",
            isOpen ? "translate-x-0 bg-black/90" : "-translate-x-[120%] lg:translate-x-0 hidden lg:flex"
        )}>
            <div className="flex items-center justify-between h-20 border-b border-white/10 px-6">
                <Link href="/" className="text-2xl font-bold flex items-center gap-2">
                    <span className="gradient-text">Lumina</span> ✨
                </Link>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="lg:hidden text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            suppressHydrationWarning
                            onClick={onClose} // Close sidebar on navigation on mobile
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

            <div className="p-4 border-t border-white/10 space-y-4">
                {/* User Profile Snippet */}
                {user && (
                    <Link href="/student/profile" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                            <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                    </Link>
                )}

                <button
                    onClick={handleLogout}
                    suppressHydrationWarning
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
