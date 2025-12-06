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

const DEMO_USERS: User[] = [
    {
        id: 'student_demo',
        name: 'Student User',
        email: 'student@lumina.com',
        role: 'student',
        status: 'active',
        avatar: 'https://ui-avatars.com/api/?name=Student+User&background=0D8ABC&color=fff',
        createdAt: new Date().toISOString()
    },
    {
        id: 'teacher_demo',
        name: 'Teacher User',
        email: 'teacher@lumina.com',
        role: 'teacher',
        status: 'active',
        avatar: 'https://ui-avatars.com/api/?name=Teacher+User&background=27AE60&color=fff',
        createdAt: new Date().toISOString()
    },
    {
        id: 'admin_demo',
        name: 'Admin User',
        email: 'admin@lumina.com',
        role: 'admin',
        status: 'active',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=C0392B&color=fff',
        createdAt: new Date().toISOString()
    }
];

class MockAPI {
    private static instance: MockAPI;
    private currentUser: User | null = null; // In-memory session only

    private constructor() { }

    public static getInstance(): MockAPI {
        if (!MockAPI.instance) {
            MockAPI.instance = new MockAPI();
        }
        return MockAPI.instance;
    }

    async login(email: string, password?: string, role?: string): Promise<User> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const user = DEMO_USERS.find(u => u.email === email);

        if (user) {
            this.currentUser = user;
            // Persist to sessionStorage so reload works, but no DB
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('lumina_user', JSON.stringify(user));
            }
            return user;
        }

        // Auto-create for any other email to allow easy testing
        const newUser: User = {
            id: 'auto_user_' + Date.now(),
            name: email.split('@')[0],
            email: email,
            role: (role as any) || 'student',
            status: 'active',
            avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`,
            createdAt: new Date().toISOString()
        };
        this.currentUser = newUser;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('lumina_user', JSON.stringify(newUser));
        }
        return newUser;
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

    async createUser(userData: Partial<User>): Promise<any> {
        await new Promise(resolve => setTimeout(resolve, 500));
        // Just return success, we don't actually save it in this simple mode
        return "user_created";
    }

    // Dashboard Data - Hardcoded Mock Data
    async getDashboardData(userRole: string, userId?: string): Promise<any> {
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
                studentProgress: [], // Can be empty for now
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

export const api = MockAPI.getInstance();
