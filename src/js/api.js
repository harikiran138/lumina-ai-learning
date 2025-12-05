/**
 * Lumina API Layer - Provides high-level methods for application functionality
 */

class LuminaAPI {
    constructor() {
        this.db = window.luminaDB;
        this.currentUser = null;
    }

    // Authentication methods
    async login(email, password, role = null) {
        try {
            let users = await this.db.getAll('users');
            const user = users.find(u => u.email === email && u.status === 'active');

            if (!user) {
                // Auto-seed if it's a demo account and missing
                const demoEmails = ['admin@lumina.com', 'teacher@lumina.com', 'student@lumina.com'];
                if (demoEmails.includes(email)) {
                    console.log('Demo user not found, attempting to seed...');
                    await this.db.seedInitialData(true);
                    users = await this.db.getAll('users');
                    user = users.find(u => u.email === email && u.status === 'active');
                }
            }

            if (!user) {
                throw new Error('User not found or account suspended');
            }

            // Check password (for demo accounts that have passwords, others accept any)
            if (user.password && user.password !== password) {
                throw new Error('Invalid password');
            }

            if (role && user.role !== role) {
                throw new Error('Invalid role for this user');
            }

            await this.db.setCurrentUser(user);
            this.currentUser = user;

            // Update last active time
            await this.db.updateUser(user.id, { lastActive: new Date().toISOString() });

            return user;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        if (!this.currentUser) {
            this.currentUser = await this.db.getCurrentUser();
        }
        return this.currentUser;
    }

    async logout() {
        await this.db.logout();
        this.currentUser = null;
    }

    // User management
    async getAllUsers() {
        return this.db.getAll('users');
    }

    async getUsersByRole(role) {
        return this.db.getUsersByRole(role);
    }

    async updateUserRole(userId, role) {
        return this.db.updateUser(userId, { role });
    }

    async updateUserStatus(userId, status) {
        return this.db.updateUser(userId, { status });
    }

    async createUser(userData) {
        return this.db.createUser(userData);
    }

    // Course management
    async getAllCourses() {
        return this.db.getAll('courses');
    }

    async getCoursesByTeacher(teacherId) {
        return this.db.getCoursesByTeacher(teacherId);
    }

    async getCourseById(courseId) {
        return this.db.get('courses', courseId);
    }

    async createCourse(courseData) {
        return this.db.createCourse(courseData);
    }

    async updateCourse(courseId, updates) {
        const course = await this.db.get('courses', courseId);
        if (course) {
            const updatedCourse = { ...course, ...updates, updatedAt: new Date().toISOString() };
            return this.db.put('courses', updatedCourse);
        }
        throw new Error('Course not found');
    }

    async deleteCourse(courseId) {
        return this.db.delete('courses', courseId);
    }

    async addUserToCourse(courseId, userId) {
        const course = await this.getCourseById(courseId);
        if (course && !course.members.includes(userId)) {
            course.members.push(userId);
            return this.db.put('courses', course);
        }
        return course;
    }

    async removeUserFromCourse(courseId, userId) {
        const course = await this.getCourseById(courseId);
        if (course) {
            course.members = course.members.filter(id => id !== userId);
            return this.db.put('courses', course);
        }
        return course;
    }

    // Message/Community management
    async sendMessage(courseId, text) {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        return this.db.addCourseMessage(courseId, currentUser.id, text);
    }

    async getCourseMessages(courseId) {
        const messages = await this.db.getCourseMessages(courseId);
        const users = await this.getAllUsers();

        // Enhance messages with user data
        return messages.map(msg => {
            const sender = users.find(u => u.id === msg.senderId);
            return {
                ...msg,
                sender: sender ? sender.name : 'Unknown User',
                senderAvatar: sender ? sender.avatar : '?',
                senderColor: sender ? sender.color : 'bg-gray-500',
                time: new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    // Chat Room management for community
    async createChatRoom(roomData) {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        roomData.createdBy = currentUser.id;
        if (!roomData.members) roomData.members = [currentUser.id];

        return this.db.createChatRoom(roomData);
    }

    async getAllChatRooms() {
        return this.db.getAllChatRooms();
    }

    async getChatRoom(roomId) {
        return this.db.getChatRoom(roomId);
    }

    async sendChatMessage(roomId, text) {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        return this.db.addChatMessage(roomId, currentUser.id, text);
    }

    async getChatMessages(roomId) {
        const messages = await this.db.getChatMessages(roomId);
        const users = await this.getAllUsers();

        // Enhance messages with user data
        return messages.map(msg => {
            const sender = users.find(u => u.id === msg.senderId);
            return {
                ...msg,
                sender: sender ? sender.name : 'Unknown User',
                senderAvatar: sender ? sender.avatar : '?',
                senderColor: sender ? sender.color : 'bg-gray-500',
                senderRole: sender ? sender.role : 'unknown',
                time: new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    async joinChatRoom(roomId) {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        return this.db.joinChatRoom(roomId, currentUser.id);
    }

    // Progress tracking
    async updateStudentProgress(studentId, courseId, progressData) {
        return this.db.updateProgress(studentId, courseId, progressData);
    }

    async getStudentProgress(studentId, courseId = null) {
        return this.db.getStudentProgress(studentId, courseId);
    }

    async getAllStudentProgress() {
        return this.db.getAll('progress');
    }

    // Dashboard data methods
    async getDashboardData(userRole, userId = null) {
        const currentUser = userId ? await this.db.get('users', userId) : await this.getCurrentUser();

        switch (userRole) {
            case 'admin':
                return this.getAdminDashboardData();
            case 'teacher':
                return this.getTeacherDashboardData(currentUser.id);
            case 'student':
                return this.getStudentDashboardData(currentUser.id);
            default:
                throw new Error('Invalid user role');
        }
    }

    async getAdminDashboardData() {
        const users = await this.getAllUsers();
        const courses = await this.getAllCourses();
        const systemHealth = await this.db.getSystemHealth();

        return {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.status === 'active').length,
            totalCourses: courses.length,
            teachers: users.filter(u => u.role === 'teacher').length,
            students: users.filter(u => u.role === 'student').length,
            systemHealth: systemHealth || {},
            users,
            courses
        };
    }

    async getTeacherDashboardData(teacherId) {
        const courses = await this.getCoursesByTeacher(teacherId);
        const allProgress = await this.getAllStudentProgress();
        const users = await this.getAllUsers();

        let totalStudents = 0;
        let avgMastery = 0;
        let assessmentsToGrade = 0;

        // Calculate statistics across all teacher's courses
        for (const course of courses) {
            totalStudents += course.members.filter(id =>
                users.find(u => u.id === id && u.role === 'student')
            ).length;
        }

        const studentProgress = allProgress.filter(p =>
            courses.some(c => c.id === p.courseId)
        );
        // Get courses the student is enrolled in
        const enrolledCourses = courses.filter(c => c.members.includes(studentId));

        // Calculate overall statistics
        let overallMastery = 0;
        let currentStreak = 0;

        if (Array.isArray(studentProgress) && studentProgress.length > 0) {
            overallMastery = studentProgress.reduce((sum, p) => sum + p.mastery, 0) / studentProgress.length;
            currentStreak = Math.max(...studentProgress.map(p => p.streak));
        }

        return {
            enrolledCourses,
            overallMastery: Math.round(overallMastery),
            currentStreak,
            attendance: 98, // Mock data
            studentProgress: Array.isArray(studentProgress) ? studentProgress : [studentProgress].filter(Boolean)
        };
    }

    // Assessment methods
    async createAssessment(assessmentData) {
        return this.db.createAssessment(assessmentData);
    }

    async getCourseAssessments(courseId) {
        return this.db.getCourseAssessments(courseId);
    }

    // Notes methods
    async createNote(noteData) {
        const currentUser = await this.getCurrentUser();
        return this.db.createNote({
            ...noteData,
            studentId: currentUser.id
        });
    }

    async getStudentNotes(studentId = null) {
        const userId = studentId || (await this.getCurrentUser()).id;
        return this.db.getStudentNotes(userId);
    }

    // System health methods
    async updateSystemHealth(healthData) {
        return this.db.updateSystemHealth(healthData);
    }

    async getSystemHealth() {
        return this.db.getSystemHealth();
    }

    // Utility methods
    async searchUsers(query) {
        const users = await this.getAllUsers();
        const lowercaseQuery = query.toLowerCase();

        return users.filter(user =>
            user.name.toLowerCase().includes(lowercaseQuery) ||
            user.email.toLowerCase().includes(lowercaseQuery)
        );
    }

    async searchCourses(query) {
        const courses = await this.getAllCourses();
        const lowercaseQuery = query.toLowerCase();

        return courses.filter(course =>
            course.name.toLowerCase().includes(lowercaseQuery) ||
            course.description.toLowerCase().includes(lowercaseQuery)
        );
    }

    // Notification system (mock)
    async createNotification(userId, message, type = 'info') {
        // In a real app, this would store notifications in the database
        console.log(`Notification for ${userId}: ${message} (${type})`);

        // Show browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Lumina', {
                body: message,
                icon: '/favicon.ico'
            });
        }
    }

    // Export/Import data methods
    async exportData() {
        const data = {
            users: await this.db.getAll('users'),
            courses: await this.db.getAll('courses'),
            messages: await this.db.getAll('messages'),
            progress: await this.db.getAll('progress'),
            assessments: await this.db.getAll('assessments'),
            notes: await this.db.getAll('notes'),
            systemHealth: await this.db.getSystemHealth(),
            exportDate: new Date().toISOString()
        };

        return JSON.stringify(data, null, 2);
    }

    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // Clear existing data first (optional)
            // await this.clearAllData();

            // Import each data type
            if (data.users) {
                for (const user of data.users) {
                    await this.db.put('users', user);
                }
            }

            if (data.courses) {
                for (const course of data.courses) {
                    await this.db.put('courses', course);
                }
            }

            if (data.messages) {
                for (const message of data.messages) {
                    await this.db.put('messages', message);
                }
            }

            if (data.progress) {
                for (const progress of data.progress) {
                    await this.db.put('progress', progress);
                }
            }

            if (data.systemHealth) {
                await this.db.put('systemHealth', data.systemHealth);
            }

            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            throw error;
        }
    }
}

// Global API instance
window.luminaAPI = new LuminaAPI();

// Make API available globally for development/debugging
window.LuminaAPI = LuminaAPI;