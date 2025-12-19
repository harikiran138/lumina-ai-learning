'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api'; // Use modern API
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
    const [showPassword, setShowPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);

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
            // Simple alert for now
            alert(message);
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
            // Use modern API createUser (handles session automatically now)
            const user = await api.createUser(newUser);
            console.log('User created successfully:', user);

            if (user && user.role) {
                const targetPath = `/${user.role}/dashboard`;
                window.location.href = targetPath;
            } else {
                window.location.href = '/student/dashboard';
            }

        } catch (error: any) {
            console.error('Signup failed:', error);
            const message = error.message || 'Signup failed';

            // Simple alert for now
            alert(message);
            setIsLoading(false);
        }
    };

    const quickLogin = async (role: string) => {
        const defaultUsers: any = {
            admin: { email: 'admin@lumina.com', password: 'Admin@123' },
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
                    <span className="text-xl">🌓</span>
                </button>
            </div>

            <div className="absolute top-4 left-4 z-20">
                <Link href="/" className="p-2 rounded-lg flex items-center text-gray-400 hover:text-white transition-colors hover:bg-white/10">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className="font-medium">Back</span>
                </Link>
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10 backdrop-blur-2xl bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
                <div>
                    <Link href="/" className="flex justify-center text-3xl font-bold">
                        <span className="gradient-text">Lumina</span> ✨
                    </Link>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        {activeTab === 'signin' ? 'Enter your details to access your dashboard' : 'Join our learning community today'}
                    </p>
                </div>

                <div className="flex justify-center rounded-xl bg-black/40 p-1 border border-white/10">
                    <button
                        suppressHydrationWarning
                        onClick={() => setActiveTab('signin')}
                        className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'signin' ? 'bg-lumina-primary text-black shadow-lg shadow-lumina-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Sign In
                    </button>
                    <button
                        suppressHydrationWarning
                        onClick={() => setActiveTab('signup')}
                        className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'signup' ? 'bg-lumina-primary text-black shadow-lg shadow-lumina-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Sign Up
                    </button>

                </div>

                {/* Demo Login Buttons */}
                <div className="flex justify-center space-x-2 mt-4">
                    <button
                        type="button"
                        onClick={() => quickLogin('student')}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-3 rounded border border-gray-600 transition-colors"
                    >
                        Demo Student
                    </button>
                    <button
                        type="button"
                        onClick={() => quickLogin('teacher')}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-3 rounded border border-gray-600 transition-colors"
                    >
                        Demo Teacher
                    </button>
                    <button
                        type="button"
                        onClick={() => quickLogin('admin')}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-3 rounded border border-gray-600 transition-colors"
                    >
                        Demo Admin
                    </button>
                </div>

                {activeTab === 'signin' ? (
                    <form id="signin-form" className="mt-8 space-y-6" onSubmit={handleSignIn}>
                        <div className="space-y-5">
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" />
                                <input
                                    id="signin-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    suppressHydrationWarning
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary outline-none transition-all placeholder:text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" />
                                <input
                                    id="signin-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    suppressHydrationWarning
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary outline-none transition-all placeholder:text-sm"
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-lumina-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" suppressHydrationWarning className="h-4 w-4 rounded border-gray-700 bg-white/5 text-lumina-primary focus:ring-lumina-primary/50" />
                                <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-400">Remember me</label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-lumina-primary hover:text-yellow-400 text-xs">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                suppressHydrationWarning
                                className="glass-button w-full flex justify-center py-3 px-4 text-sm font-bold shadow-lg shadow-lumina-primary/20 transform hover:scale-[1.02]"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form id="signup-form" className="mt-8 space-y-6" onSubmit={handleSignUp}>
                        <div className="space-y-5">
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" />
                                <input
                                    id="signup-name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    suppressHydrationWarning
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary outline-none transition-all placeholder:text-sm"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" />
                                <input
                                    id="signup-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    suppressHydrationWarning
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary outline-none transition-all placeholder:text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" />
                                <input
                                    id="signup-password"
                                    name="password"
                                    type={showSignupPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    suppressHydrationWarning
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary outline-none transition-all placeholder:text-sm"
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-lumina-primary transition-colors focus:outline-none"
                                >
                                    {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-lumina-primary transition-colors w-5 h-5" />
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'student' | 'teacher' | 'admin')}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="bg-gray-900 text-gray-400">Select your role</option>
                                    <option value="student" className="bg-gray-900 text-white">Student</option>
                                    <option value="teacher" className="bg-gray-900 text-white">Teacher</option>

                                </select>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                suppressHydrationWarning
                                className="glass-button w-full flex justify-center py-3 px-4 text-sm font-bold shadow-lg shadow-lumina-primary/20 transform hover:scale-[1.02]"
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
