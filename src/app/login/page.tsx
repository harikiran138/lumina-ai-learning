'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api'; // Use modern API

export default function LoginPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');

    useEffect(() => {
        // Check for existing session
        const checkSession = async () => {
            try {
                // Use modern API check
                const user = await api.getCurrentUser();
                if (user) {
                    console.log('User already logged in:', user);
                    const targetPath = `/${user.role}/dashboard`;
                    window.location.href = targetPath;
                }
            } catch (e) {
                console.error('Session check failed:', e);
            }
        };
        checkSession();
    }, []);

    const performLogin = async (loginEmail: string, loginPassword: string) => {
        setIsLoading(true);
        try {
            console.log('Attempting login with:', loginEmail);
            // Use modern API login (includes auto-seeding)
            const user = await api.login(loginEmail, loginPassword);
            console.log('Login successful:', user);

            if (user && user.role) {
                const targetPath = `/${user.role}/dashboard`;
                console.log('Redirecting to:', targetPath);
                window.location.href = targetPath;
            } else {
                console.error('User role undefined, defaulting to student');
                window.location.href = '/student/dashboard';
            }
        } catch (error: any) {
            console.error('Login failed:', error);
            const message = error.message || 'Login failed';

            // UI Notification
            if (typeof window !== 'undefined' && (window as any).luminaUI) {
                (window as any).luminaUI.showNotification(message, 'error');
            } else {
                alert(message);
            }
            setIsLoading(false);
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        await performLogin(email, password);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const newUser = {
                name,
                email,
                password,
                role,
                status: 'active' as const, // Type assertion for specific string literal
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                preferences: {
                    theme: 'dark',
                    notifications: true
                },
                createdAt: new Date().toISOString()
            };

            console.log('Creating new user:', newUser);
            // Use modern API createUser
            await api.createUser(newUser);
            console.log('User created successfully, logging in...');

            // Auto login after signup
            await performLogin(email, password);

        } catch (error: any) {
            console.error('Signup failed:', error);
            const message = error.message || 'Signup failed';

            if (typeof window !== 'undefined' && (window as any).luminaUI) {
                (window as any).luminaUI.showNotification(message, 'error');
            } else {
                alert(message);
            }
            setIsLoading(false);
        }
    };

    const quickLogin = async (role: string) => {
        const defaultUsers: any = {
            admin: { email: 'admin@lumina.com', password: 'admin123' },
            teacher: { email: 'teacher@lumina.com', password: 'teacher123' },
            student: { email: 'student@lumina.com', password: 'student123' }
        };
        const userData = defaultUsers[role];
        if (userData) {
            setEmail(userData.email);
            setPassword(userData.password);
            // Call login directly instead of simulating form submit
            await performLogin(userData.email, userData.password);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black text-white transition-colors duration-300 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lumina-primary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lumina-secondary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
            </div>

            <div className="absolute top-4 right-4 z-20">
                <button id="theme-toggle" suppressHydrationWarning className="p-2 rounded-lg glass text-lumina-primary hover:bg-lumina-primary/10">
                    {/* Theme toggle icon placeholder - logic handled by utils.js */}
                    <span className="text-xl">🌓</span>
                </button>
            </div>

            <div className="max-w-md w-full space-y-8 card z-10">
                <div>
                    <Link href="/" className="flex justify-center text-3xl font-bold">
                        <span className="bg-gradient-to-r from-lumina-primary to-lumina-secondary bg-clip-text text-transparent">Lumina</span> ✨
                    </Link>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        {activeTab === 'signin' ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>

                <div className="flex justify-center rounded-xl bg-lumina-dark-light p-1 border border-lumina-primary/20">
                    <button
                        suppressHydrationWarning
                        onClick={() => setActiveTab('signin')}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'signin' ? 'bg-lumina-primary text-black shadow-gold-glow' : 'text-lumina-accent/60 hover:text-lumina-primary'}`}
                    >
                        Sign In
                    </button>
                    <button
                        suppressHydrationWarning
                        onClick={() => setActiveTab('signup')}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'signup' ? 'bg-lumina-primary text-black shadow-gold-glow' : 'text-lumina-accent/60 hover:text-lumina-primary'}`}
                    >
                        Sign Up
                    </button>
                </div>

                {activeTab === 'signin' ? (
                    <form id="signin-form" className="mt-8 space-y-6" onSubmit={handleSignIn}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="signin-email" className="sr-only">Email address</label>
                                <input
                                    id="signin-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    suppressHydrationWarning
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label htmlFor="signin-password" className="sr-only">Password</label>
                                <input
                                    id="signin-password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    suppressHydrationWarning
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input"
                                    placeholder="Password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <a href="#" className="font-medium text-lumina-primary hover:text-lumina-secondary">
                                    Forgot your password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                suppressHydrationWarning
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-lumina-primary hover:bg-lumina-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumina-primary transition-all duration-300 shadow-gold-glow"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>

                        <div className="mt-4 p-3 bg-lumina-dark-light/50 rounded-xl border border-lumina-primary/10">
                            <p className="text-xs text-lumina-accent/60 mb-2">Quick Login (Demo):</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" suppressHydrationWarning onClick={() => quickLogin('admin')} className="text-xs px-2 py-1 bg-red-900/50 border border-red-500/50 text-red-200 rounded hover:bg-red-900/80 transition-colors">Admin</button>
                                <button type="button" suppressHydrationWarning onClick={() => quickLogin('teacher')} className="text-xs px-2 py-1 bg-green-900/50 border border-green-500/50 text-green-200 rounded hover:bg-green-900/80 transition-colors">Teacher</button>
                                <button type="button" suppressHydrationWarning onClick={() => quickLogin('student')} className="text-xs px-2 py-1 bg-blue-900/50 border border-blue-500/50 text-blue-200 rounded hover:bg-blue-900/80 transition-colors">Student</button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form id="signup-form" className="mt-8 space-y-6" onSubmit={handleSignUp}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="signup-name" className="sr-only">Full Name</label>
                                <input
                                    id="signup-name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    suppressHydrationWarning
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <label htmlFor="signup-email" className="sr-only">Email address</label>
                                <input
                                    id="signup-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    suppressHydrationWarning
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label htmlFor="signup-password" className="sr-only">Password</label>
                                <input
                                    id="signup-password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    suppressHydrationWarning
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input"
                                    placeholder="Password"
                                />
                            </div>
                            <div>
                                <label htmlFor="role" className="sr-only">Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'student' | 'teacher' | 'admin')}
                                    className="input bg-black text-white border border-lumina-primary/30 focus:border-lumina-primary"
                                >
                                    <option value="" disabled className="bg-black text-gray-400">Select your role</option>
                                    <option value="student" className="bg-black text-white">Student</option>
                                    <option value="teacher" className="bg-black text-white">Teacher</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                suppressHydrationWarning
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-lumina-primary hover:bg-lumina-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumina-primary transition-all duration-300 shadow-gold-glow"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
