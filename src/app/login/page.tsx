'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('student');

    useEffect(() => {
        // Check for existing session
        const checkSession = async () => {
            // Robust check for API availability
            if (typeof window !== 'undefined' && (window as any).luminaAPI && typeof (window as any).luminaAPI.getCurrentUser === 'function') {
                try {
                    const user = await (window as any).luminaAPI.getCurrentUser();
                    if (user) {
                        // Auto-redirect disabled to prevent loops
                        // (window as any).luminaUI.redirectToDashboard(user.role);
                        console.log('User already logged in:', user);
                    }
                } catch (e) {
                    console.error('Session check failed:', e);
                }
            } else {
                // If API not ready, retry once after a short delay
                console.log('API not ready, retrying checkSession...');
                setTimeout(checkSession, 500);
            }
        };
        // Wait for scripts to load
        const timer = setTimeout(checkSession, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Sign in button clicked');
        setIsLoading(true);

        try {
            console.log('Checking for luminaAPI...');
            // Robust check before usage
            if ((window as any).luminaAPI && typeof (window as any).luminaAPI.login === 'function') {
                console.log('Attempting login with:', email);
                const user = await (window as any).luminaAPI.login(email, password);
                console.log('Login successful:', user);

                // Use robust redirect
                if (user && user.role) {
                    const targetPath = `/${user.role}/dashboard`;
                    console.log('Redirecting to:', targetPath);
                    window.location.href = targetPath;
                } else {
                    console.error('User role undefined, defaulting to student');
                    window.location.href = '/student/dashboard';
                }
            } else {
                console.error('LuminaAPI not fully initialized');
                alert('System is initializing, please try again in a moment.');
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error('Login failed:', error);

            // Self-healing: If user not found and it's a demo account, try to seed again
            if (error.message && (error.message.includes('User not found') || error.message.includes('suspended'))) {
                const demoEmails = ['admin@lumina.com', 'teacher@lumina.com', 'student@lumina.com'];
                if (demoEmails.includes(email)) {
                    console.log('Demo account missing, attempting self-healing (force seeding)...');
                    try {
                        if ((window as any).luminaDB) {
                            await (window as any).luminaDB.seedInitialData(true);
                            console.log('Force seeding complete, retrying login...');

                            // Retry login once
                            const user = await (window as any).luminaAPI.login(email, password);
                            if (user) {
                                console.log('Recovery successful!');
                                window.location.href = `/${user.role}/dashboard`;
                                return;
                            }
                        }
                    } catch (retryError) {
                        console.error('Self-healing failed:', retryError);
                    }
                }
            }

            if ((window as any).luminaUI) {
                (window as any).luminaUI.showNotification(error.message || 'Login failed', 'error');
            } else {
                alert(error.message || 'Login failed');
            }
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if ((window as any).luminaAPI) {
                const userData = {
                    name,
                    email,
                    role,
                    status: 'active'
                };
                await (window as any).luminaAPI.createUser(userData);
                const user = await (window as any).luminaAPI.login(email, password);

                (window as any).luminaUI.showNotification(`Account created successfully! Welcome, ${user.name}!`, 'success');
                setTimeout(() => {
                    (window as any).luminaUI.redirectToDashboard(user.role);
                }, 1500);
            }
        } catch (error: any) {
            console.error('Signup failed:', error);
            let errorMessage = 'Failed to create account';
            if (error.message && error.message.includes('email')) {
                errorMessage = 'An account with this email already exists';
            }
            if ((window as any).luminaUI) {
                (window as any).luminaUI.showNotification(errorMessage, 'error');
            }
            setIsLoading(false);
        }
    };

    const quickLogin = (role: string) => {
        const defaultUsers: any = {
            admin: { email: 'admin@lumina.com', password: 'admin123' },
            teacher: { email: 'teacher@lumina.com', password: 'teacher123' },
            student: { email: 'student@lumina.com', password: 'student123' }
        };
        const userData = defaultUsers[role];
        if (userData) {
            setEmail(userData.email);
            setPassword(userData.password);
            // Auto submit
            setTimeout(() => {
                const form = document.getElementById('signin-form') as HTMLFormElement;
                if (form) form.requestSubmit();
            }, 100);
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
                        onClick={() => setActiveTab('signin')}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'signin' ? 'bg-lumina-primary text-black shadow-gold-glow' : 'text-lumina-accent/60 hover:text-lumina-primary'}`}
                    >
                        Sign In
                    </button>
                    <button
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
                                <button type="button" onClick={() => quickLogin('admin')} className="text-xs px-2 py-1 bg-red-900/50 border border-red-500/50 text-red-200 rounded hover:bg-red-900/80 transition-colors">Admin</button>
                                <button type="button" onClick={() => quickLogin('teacher')} className="text-xs px-2 py-1 bg-green-900/50 border border-green-500/50 text-green-200 rounded hover:bg-green-900/80 transition-colors">Teacher</button>
                                <button type="button" onClick={() => quickLogin('student')} className="text-xs px-2 py-1 bg-blue-900/50 border border-blue-500/50 text-blue-200 rounded hover:bg-blue-900/80 transition-colors">Student</button>
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
                                    onChange={(e) => setRole(e.target.value)}
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
