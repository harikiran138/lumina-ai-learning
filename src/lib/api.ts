import { db, User, Course, Message, ChatRoom, StudentProgress, SystemHealth } from './db';

class LuminaAPI {
    private static instance: LuminaAPI;
    private currentUser: User | null = null;

    private constructor() { }

    public static getInstance(): LuminaAPI {
        if (!LuminaAPI.instance) {
            LuminaAPI.instance = new LuminaAPI();
        }
        return LuminaAPI.instance;
    }

    // Authentication methods
    async login(email: string, password?: string, role?: string): Promise<User> {
        try {
            let users = await db.getAll<User>('users');
            let user = users.find(u => u.email === email && u.status === 'active');

            if (!user) {
                // Auto-seed if it's a demo account and missing (parity with legacy API)
                const demoEmails = ['admin@lumina.com', 'teacher@lumina.com', 'student@lumina.com'];
                if (demoEmails.includes(email)) {
                    console.log('Demo user not found in modern API, attempting to seed...');
                    await db.seedInitialData(true);
                    users = await db.getAll<User>('users');
                    user = users.find(u => u.email === email && u.status === 'active');
                }
            }

            if (!user) {
                throw new Error('User not found or account suspended');
            }

            // Check password (simple check for demo)
            if (user.password && user.password !== password) {
                throw new Error('Invalid password');
            }

            if (role && user.role !== role) {
                throw new Error('Invalid role for this user');
            }

            await db.setCurrentUser(user);
            this.currentUser = user;

            // Update last active time
            await db.put('users', { ...user, lastActive: new Date().toISOString() });

            return user;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async getCurrentUser(): Promise<User | null> {
        if (!this.currentUser) {
            this.currentUser = await db.getCurrentUser();
        }
        return this.currentUser;
    }

    async logout(): Promise<void> {
        await db.logout();
        this.currentUser = null;
    }

    // User management
    async getAllUsers(): Promise<User[]> {
        return db.getAll<User>('users');
    }

    async createUser(userData: Partial<User>): Promise<IDBValidKey> {
        return db.createUser(userData);
    }

    // Course management
    async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
        return db.getByIndex<Course>('courses', 'teacherId', teacherId);
    }

    async getAllCourses(): Promise<Course[]> {
        return db.getAll<Course>('courses');
    }

    // Dashboard Data
    async getDashboardData(userRole: string, userId?: string): Promise<any> {
        const currentUser = userId ? await db.get<User>('users', userId) : await this.getCurrentUser();
        if (!currentUser) throw new Error('User not found');

        switch (userRole) {
            case 'student':
                return this.getStudentDashboardData(currentUser.id);
            case 'teacher':
                return this.getTeacherDashboardData(currentUser.id);
            case 'admin':
                return this.getAdminDashboardData();
            default:
                throw new Error('Invalid user role');
        }
    }

    private async getStudentDashboardData(studentId: string) {
        const allProgress = await db.getAll<StudentProgress>('progress');
        const studentProgress = allProgress.filter(p => p.studentId === studentId);

        const courses = await db.getAll<Course>('courses');
        const enrolledCourses = courses.filter(c => c.members.includes(studentId));

        // Calculate stats
        let overallMastery = 0;
        let currentStreak = 0;

        if (studentProgress.length > 0) {
            overallMastery = studentProgress.reduce((sum, p) => sum + p.mastery, 0) / studentProgress.length;
            currentStreak = Math.max(...studentProgress.map(p => p.streak));
        }

        // Enhance enrolled courses with progress
        const enhancedCourses = enrolledCourses.map(course => {
            const progress = studentProgress.find(p => p.courseId === course.id);
            return {
                ...course,
                progress: progress?.progress || 0,
                mastery: progress?.mastery || 0,
                streak: progress?.streak || 0
            };
        });

        return {
            enrolledCourses: enhancedCourses,
            overallMastery: Math.round(overallMastery),
            currentStreak,
            studentProgress
        };
    }

    private async getTeacherDashboardData(teacherId: string) {
        // Implementation for teacher dashboard
        return {};
    }

    private async getAdminDashboardData() {
        // Implementation for admin dashboard
        return {};
    }
}

export const api = LuminaAPI.getInstance();
