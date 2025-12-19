// Mock Data API - Optimized for Simple Frontend Demo

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
    bio?: string;
    skills?: string[];
    location?: string;
}

// Authentication API - Connected to Firebase via Server Actions
import { authenticateUser, registerUser } from '@/app/actions/auth';

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

        // Auto-login on success
        this.currentUser = result;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('lumina_user', JSON.stringify(result));
        }

        return result;
    }

    // Dashboard Data - Connected to MongoDB
    async getDashboardData(userRole: string, userId?: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return {};

        if (userRole === 'student') {
            // Dynamically import server actions to avoid build issues if mixed
            const { getStudentDashboard } = await import('@/app/actions/data');
            const data = await getStudentDashboard(user.email);
            return data || {};
        }

        if (userRole === 'teacher') {
            const { getTeacherDashboard } = await import('@/app/actions/data');
            return await getTeacherDashboard(user.email);
        }

        if (userRole === 'admin') {
            const { getAdminDashboard } = await import('@/app/actions/data');
            return await getAdminDashboard(user.email);
        }

        return {};
    }

    async getStudentProfile(): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return null;
        const { getStudentProfile } = await import('@/app/actions/data');
        return await getStudentProfile(user.email);
    }

    async getStudentProgress(): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return null;
        const { getStudentProgress } = await import('@/app/actions/data');
        return await getStudentProgress(user.email);
    }

    async getStudentCertificates(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];
        const { getStudentCertificates } = await import('@/app/actions/data');
        return await getStudentCertificates(user.email);
    }

    async updateProfile(data: any): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { updateStudentProfile } = await import('@/app/actions/data');
        return await updateStudentProfile(user.email, data);
    }

    async completeLesson(courseId: string, moduleId: string, lessonId: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { completeLesson } = await import('@/app/actions/data');
        return await completeLesson(user.email, courseId, moduleId, lessonId);
    }

    async getStudentBadges(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];
        const { getStudentBadges } = await import('@/app/actions/data');
        return await getStudentBadges(user.email);
    }

    async getCourseDetails(courseId: string): Promise<any> {
        const { getCourseDetails } = await import('@/app/actions/data');
        return await getCourseDetails(courseId);
    }

    async getEnrolledCourses(): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return null;
        const { getStudentProgress } = await import('@/app/actions/data');
        return await getStudentProgress(user.email);
    }

    async getCommunityData(channelId?: string): Promise<any> {
        const { getCommunityData } = await import('@/app/actions/data');
        return await getCommunityData(channelId);
    }

    async sendCommunityMessage(channelId: string, content: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { sendCommunityMessage } = await import('@/app/actions/data');
        return await sendCommunityMessage(user.email, channelId, content);
    }

    async getTeacherStudents(): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return [];
        const { getTeacherStudents } = await import('@/app/actions/data');
        return await getTeacherStudents(user.email);
    }

    async getTeacherCourses(): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return [];
        const { getTeacherCourses } = await import('@/app/actions/data');
        return await getTeacherCourses(user.email);
    }

    async createCourse(courseData: any): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { createCourse } = await import('@/app/actions/data');
        return await createCourse(user.email, courseData);
    }

    async getAllCourses(): Promise<any[]> {
        const { getAllCourses } = await import('@/app/actions/data');
        return await getAllCourses();
    }

    async enrollInCourse(courseId: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { enrollInCourse } = await import('@/app/actions/data');
        return await enrollInCourse(user.email, courseId);
    }

    async getStudentCourses(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];
        const { getStudentCourses } = await import('@/app/actions/data');
        return await getStudentCourses(user.email);
    }

    async getExploreCourses(): Promise<{ enrolled: any[], recommended: any[] }> {
        const user = await this.getCurrentUser();
        if (!user) return { enrolled: [], recommended: [] };
        const { getExploreCourses } = await import('@/app/actions/data');
        return await getExploreCourses(user.email);
    }

    async publishCourse(courseId: string): Promise<any> {
        const { publishCourse } = await import('@/app/actions/data');
        return await publishCourse(courseId);
    }

    async updateCourseStructure(courseId: string, modules: any[]): Promise<any> {
        const { updateCourseStructure } = await import('@/app/actions/data');
        return await updateCourseStructure(courseId, modules);
    }

    async inviteStudent(studentEmail: string, courseId: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { inviteStudentToCourse } = await import('@/app/actions/data');
        return await inviteStudentToCourse(user.email, studentEmail, courseId);
    }

    async addModule(courseId: string, title: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { addModule } = await import('@/app/actions/data');
        return await addModule(user.email, courseId, title);
    }

    async addLesson(courseId: string, moduleId: string, title: string, content: string = '', type: 'text' | 'video' | 'quiz' = 'text'): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { addLesson } = await import('@/app/actions/data');
        return await addLesson(user.email, courseId, moduleId, title, content, type);
    }

    async deleteCourse(courseId: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { deleteCourse } = await import('@/app/actions/data');
        return await deleteCourse(user.email, courseId);
    }

    async deleteModule(courseId: string, moduleId: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { deleteModule } = await import('@/app/actions/data');
        return await deleteModule(user.email, courseId, moduleId);
    }

    async deleteLesson(courseId: string, moduleId: string, lessonId: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { deleteLesson } = await import('@/app/actions/data');
        return await deleteLesson(user.email, courseId, moduleId, lessonId);
    }

    async updateCourseDetails(courseId: string, updates: any): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { updateCourseDetails } = await import('@/app/actions/data');
        return await updateCourseDetails(user.email, courseId, updates);
    }

    async logout(): Promise<void> {
        this.currentUser = null;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('lumina_user');
        }
    }

    async updateProgress(courseId: string, percentIncrement: number): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false };
        // In a real app we'd call a server action. 
        // For now, let's assume we maintain a simple progress tracking or mock it if server action is missing.
        // But user asked for database connection. I should check if updateProgress exists in data.ts
        // It doesn't seem to. I'll need to create it.
        const { updateCourseProgress } = await import('@/app/actions/data');
        return await updateCourseProgress(user.email, courseId, percentIncrement);
    }
    async getChatHistory(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];
        const { getChatHistory } = await import('@/app/actions/data');
        return await getChatHistory(user.email);
    }

    async saveChatMessage(message: { sender: string, text: string, sessionId?: string }): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false };
        const { saveChatMessage } = await import('@/app/actions/data');
        return await saveChatMessage(user.email, message);
    }

    async saveNote(content: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false };
        const { saveNote } = await import('@/app/actions/data');
        return await saveNote(user.email, content);
    }

    async getNotes(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];
        const { getStudentNotes } = await import('@/app/actions/data');
        return await getStudentNotes(user.email);
    }

    async createNote(noteData: any): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { createStudentNote } = await import('@/app/actions/data');
        return await createStudentNote(user.email, noteData);
    }

    async deleteNote(noteId: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { deleteStudentNote } = await import('@/app/actions/data');
        return await deleteStudentNote(user.email, noteId);
    }

    async chatWithAI(messages: any[]): Promise<any> {
        const { chatWithAI } = await import('@/app/actions/ai');
        return await chatWithAI(messages);
    }

    // --- Admin API Methods ---

    async getAllUsers(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user || user.role !== 'admin') return [];
        const { getAllUsers } = await import('@/app/actions/data');
        return await getAllUsers();
    }

    async getAllCoursesAdmin(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user || user.role !== 'admin') return [];
        const { getAllCoursesAdmin } = await import('@/app/actions/data');
        return await getAllCoursesAdmin();
    }

    async getAllChatLogs(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user || user.role !== 'admin') return [];
        const { getAllChatLogsAdmin } = await import('@/app/actions/data');
        return await getAllChatLogsAdmin();
    }

    async getAllAILogs(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user || user.role !== 'admin') return [];
        const { getAllAILogsAdmin } = await import('@/app/actions/data');
        return await getAllAILogsAdmin();
    }

    async getAllStudentsWithProgress(): Promise<any[]> {
        const user = await this.getCurrentUser();
        if (!user || user.role !== 'admin') return [];
        const { getAllStudentsWithProgress } = await import('@/app/actions/data');
        return await getAllStudentsWithProgress();
    }

    async updateUserStatus(userId: string, status: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user || user.role !== 'admin') return { success: false };
        const { updateUserStatus } = await import('@/app/actions/data');
        return await updateUserStatus(user.email, userId, status);
    }

    async updateUserRole(userId: string, role: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user || user.role !== 'admin') return { success: false };
        const { updateUserRole } = await import('@/app/actions/data');
        return await updateUserRole(user.email, userId, role);
    }

    async logAIInteraction(prompt: string, response: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user) return { success: false };
        const { logAIInteraction } = await import('@/app/actions/data');
        return await logAIInteraction(user.email, prompt, response);
    }

    async deleteAILog(logId: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user || user.role !== 'admin') return { success: false };
        const { deleteAILog } = await import('@/app/actions/data');
        return await deleteAILog(user.email, logId);
    }

    async deleteUser(userId: string): Promise<any> {
        const user = await this.getCurrentUser();
        if (!user || user.role !== 'admin') return { success: false };
        const { deleteUser } = await import('@/app/actions/data');
        return await deleteUser(user.email, userId);
    }
}

export const api = RealAPI.getInstance();
