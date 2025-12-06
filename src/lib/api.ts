// Mock Data API - Optimized for Simple Frontend Demo
// No database, no local storage, just static JSON.

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    status: 'active' | 'suspended' | 'inactive';
    avatar: string;
    createdAt: string;
    preferences?: any;
}

// Authentication API - Connected to MongoDB via Server Actions
import { authenticateUser, registerUser } from '@/app/actions/auth';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    status: 'active' | 'suspended' | 'inactive';
    avatar: string;
    createdAt: string;
    preferences?: any;
    password?: string; // Optional for internal use
}

class RealAPI {
    private static instance: RealAPI;
    private currentUser: User | null = null;

    private constructor() { }

    public static getInstance(): RealAPI {
        if (!RealAPI.instance) {
            RealAPI.instance = new RealAPI();
        }
        return RealAPI.instance;
    }

    async login(email: string, password?: string): Promise<User> {
        if (!password) {
            throw new Error("Password is required for login.");
        }

        const user = await authenticateUser(email, password);

        if (user) {
            this.currentUser = user;
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('lumina_user', JSON.stringify(user));
            }
            return user;
        }

        throw new Error("Invalid email or password.");
    }

    async getCurrentUser(): Promise<User | null> {
        // Check memory first
        if (this.currentUser) return this.currentUser;

        // Check session storage
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('lumina_user');
            if (stored) {
                this.currentUser = JSON.parse(stored);
                return this.currentUser;
            }
        }
        return null;
    }

    async createUser(userData: Partial<User> & { password?: string }): Promise<any> {
        if (!userData.password) {
            throw new Error("Password is required for signup.");
        }
        // Call server action
        const result = await registerUser(userData as Partial<User> & { password: string });

        if ('error' in result) {
            throw new Error(result.error as string);
        }

        return result;
    }

    // Dashboard Data - Hardcoded Mock Data (Remaining same for now)
    async getDashboardData(userRole: string, userId?: string): Promise<any> {
        // ... (Keep existing dashboard mock logic as is for now)
        await new Promise(resolve => setTimeout(resolve, 300));

        if (userRole === 'student') {
            return {
                overallMastery: 85,
                currentStreak: 12,
                enrolledCourses: [
                    {
                        id: 'qm_101',
                        name: 'Quantum Mechanics I',
                        progress: 75,
                        mastery: 90,
                        streak: 5,
                        thumbnail: '/images/course-qm.jpg',
                        description: 'Introduction to Quantum Mechanics'
                    },
                    {
                        id: 'bio_101',
                        name: 'Advanced Biology',
                        progress: 45,
                        mastery: 80,
                        streak: 3,
                        thumbnail: '/images/course-bio.jpg',
                        description: 'Cellular processes and genetics'
                    }
                ],
                studentProgress: [],
                recentActivity: [
                    { id: 1, type: 'lesson', title: 'Wave Function Collapse', time: '2 hours ago' },
                    { id: 2, type: 'quiz', title: 'Thermodynamics Quiz', time: '1 day ago' }
                ]
            };
        }
        return {};
    }

    async logout(): Promise<void> {
        this.currentUser = null;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('lumina_user');
        }
    }
}

export const api = RealAPI.getInstance();
