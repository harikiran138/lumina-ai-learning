'use client';

import { useState } from 'react';
import {
    User,
    Bell,
    Lock,
    Globe,
    Moon,
    Shield,
    LogOut,
    ChevronRight,
    ToggleLeft,
    ToggleRight,
    Smartphone,
    Mail
} from 'lucide-react';
import { api } from '@/lib/api';

export default function StudentSettings() {
    const [activeSection, setActiveSection] = useState('profile');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        updates: false,
        marketing: false
    });
    const [theme, setTheme] = useState('dark');

    const handleLogout = async () => {
        await api.logout();
        window.location.href = '/login';
    };

    const sections = [
        { id: 'profile', label: 'Edit Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'appearance', label: 'Appearance', icon: Moon },
        { id: 'language', label: 'Language', icon: Globe },
        { id: 'privacy', label: 'Privacy', icon: Shield },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)]">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-64 flex-shrink-0">
                <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
                <nav className="space-y-1">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeSection === section.id
                                ? 'bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <section.icon className="w-5 h-5" />
                                <span className="font-medium">{section.label}</span>
                            </div>
                            {activeSection === section.id && <ChevronRight className="w-4 h-4" />}
                        </button>
                    ))}

                    <div className="pt-6 mt-6 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 glass-card p-6 lg:p-10">
                {/* Profile Settings */}
                {activeSection === 'profile' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Edit Profile</h2>
                            <p className="text-gray-400 text-sm">Update your personal information</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-white/10 overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=Student+User&background=0D8ABC&color=fff&size=128" alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium">Change Avatar</button>
                                <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max 1MB.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Full Name</label>
                                <input type="text" defaultValue="Student User" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lumina-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Username</label>
                                <input type="text" defaultValue="@student_123" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lumina-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Email Address</label>
                                <input type="email" defaultValue="student@lumina.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lumina-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Phone Number</label>
                                <input type="tel" defaultValue="+1 (555) 000-0000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lumina-primary/50" />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button className="px-6 py-2.5 bg-lumina-primary text-black font-bold rounded-lg hover:bg-lumina-secondary transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* Notifications Settings */}
                {activeSection === 'notifications' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Notifications</h2>
                            <p className="text-gray-400 text-sm">Manage how you receive updates</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Email Notifications</h3>
                                        <p className="text-xs text-gray-400">Receive daily summaries and important alerts</p>
                                    </div>
                                </div>
                                <button onClick={() => setNotifications({ ...notifications, email: !notifications.email })}>
                                    {notifications.email ? <ToggleRight className="w-8 h-8 text-lumina-primary" /> : <ToggleLeft className="w-8 h-8 text-gray-500" />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Push Notifications</h3>
                                        <p className="text-xs text-gray-400">Receive real-time alerts on your device</p>
                                    </div>
                                </div>
                                <button onClick={() => setNotifications({ ...notifications, push: !notifications.push })}>
                                    {notifications.push ? <ToggleRight className="w-8 h-8 text-lumina-primary" /> : <ToggleLeft className="w-8 h-8 text-gray-500" />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Marketing Updates</h3>
                                        <p className="text-xs text-gray-400">Receive news about new courses and features</p>
                                    </div>
                                </div>
                                <button onClick={() => setNotifications({ ...notifications, marketing: !notifications.marketing })}>
                                    {notifications.marketing ? <ToggleRight className="w-8 h-8 text-lumina-primary" /> : <ToggleLeft className="w-8 h-8 text-gray-500" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Other sections can be placeholders for now */}
                {['security', 'appearance', 'language', 'privacy'].includes(activeSection) && (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-white font-medium mb-2">Coming Soon</h3>
                        <p className="text-gray-400 text-sm max-w-xs">This section is currently under development. Check back later for updates.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
