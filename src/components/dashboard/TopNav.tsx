'use client';

import ThemeToggle from '@/components/ui/ThemeToggle';
import { Bell, Search, Menu } from 'lucide-react';

export default function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
    return (
        <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center">
                <button
                    onClick={onMenuClick}
                    suppressHydrationWarning
                    className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 mr-4"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="relative hidden sm:block w-64">
                    <input
                        type="text"
                        placeholder="Search..."
                        suppressHydrationWarning
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <button
                    suppressHydrationWarning
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <ThemeToggle />
                <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-gray-700 pl-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Student User</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Student</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                        S
                    </div>
                </div>
            </div>
        </header>
    );
}
