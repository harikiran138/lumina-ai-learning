/**
 * Lumina User Profile Management
 * Handles user profiles, avatars, and preferences
 */

class ProfileManager {
    constructor() {
        this.currentUserProfile = null;
    }

    async init() {
        const currentUser = await window.luminaDB.getCurrentUser();
        if (currentUser) {
            this.currentUserProfile = currentUser;
        }
    }

    /**
     * Get user profile by ID
     */
    async getUserProfile(userId) {
        return await window.luminaDB.get('users', userId);
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updates) {
        const user = await window.luminaDB.get('users', userId);
        if (!user) throw new Error('User not found');

        const updatedUser = {
            ...user,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await window.luminaDB.put('users', updatedUser);
        this.currentUserProfile = updatedUser;
        return updatedUser;
    }

    /**
     * Upload avatar (base64 encoded)
     */
    async uploadAvatar(userId, avatarData) {
        return await this.updateProfile(userId, {
            avatar: avatarData,
            avatarType: 'image'
        });
    }

    /**
     * Set avatar to initials
     */
    async setInitialAvatar(userId, name) {
        const initials = name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);

        return await this.updateProfile(userId, {
            avatar: initials,
            avatarType: 'initials'
        });
    }

    /**
     * Update user bio
     */
    async updateBio(userId, bio) {
        return await this.updateProfile(userId, { bio });
    }

    /**
     * Update social links
     */
    async updateSocialLinks(userId, socialLinks) {
        return await this.updateProfile(userId, { socialLinks });
    }

    /**
     * Get user achievements/badges
     */
    async getUserBadges(userId) {
        const user = await window.luminaDB.get('users', userId);
        return user?.badges || [];
    }

    /**
     * Award badge to user
     */
    async awardBadge(userId, badge) {
        const user = await window.luminaDB.get('users', userId);
        if (!user) throw new Error('User not found');

        if (!user.badges) user.badges = [];
        if (!user.badges.find(b => b.id === badge.id)) {
            user.badges.push({
                ...badge,
                awardedAt: new Date().toISOString()
            });
            await window.luminaDB.put('users', user);
        }

        return user.badges;
    }

    /**
     * Get user statistics
     */
    async getUserStatistics(userId) {
        const progressData = await window.luminaDB.getByIndex('progress', 'studentId', userId);
        const notes = await window.luminaDB.getByIndex('notes', 'studentId', userId);
        const enrolledCourses = progressData.length;
        const totalHoursLearned = progressData.reduce((sum, p) => sum + (p.progress || 0), 0);
        const averageMastery = progressData.length > 0 
            ? Math.round(progressData.reduce((sum, p) => sum + (p.mastery || 0), 0) / progressData.length)
            : 0;

        return {
            enrolledCourses,
            totalHoursLearned: Math.round(totalHoursLearned),
            averageMastery,
            notesCount: notes.length,
            streak: progressData.reduce((max, p) => Math.max(max, p.streak || 0), 0)
        };
    }

    /**
     * Set notification preferences
     */
    async setNotificationPreferences(userId, preferences) {
        return await this.updateProfile(userId, { preferences });
    }

    /**
     * Get notification preferences
     */
    async getNotificationPreferences(userId) {
        const user = await window.luminaDB.get('users', userId);
        return user?.preferences || {
            emailNotifications: true,
            pushNotifications: true,
            messageNotifications: true,
            courseUpdates: true,
            weeklyDigest: true
        };
    }

    /**
     * Get user courses
     */
    async getUserCourses(userId) {
        const progressData = await window.luminaDB.getByIndex('progress', 'studentId', userId);
        const courseIds = progressData.map(p => p.courseId);
        const courses = [];
        
        for (const courseId of courseIds) {
            const course = getAllCourses().find(c => c.id === courseId);
            if (course) {
                const progress = progressData.find(p => p.courseId === courseId);
                courses.push({
                    ...course,
                    progress: progress?.progress || 0,
                    mastery: progress?.mastery || 0,
                    streak: progress?.streak || 0
                });
            }
        }
        
        return courses;
    }

    /**
     * Verify user credentials
     */
    async verifyCredentials(email, password) {
        const users = await window.luminaDB.getByIndex('users', 'email', email);
        if (users.length === 0) return null;
        
        const user = users[0];
        // In a real app, use proper password hashing
        if (user.password === password) {
            return user;
        }
        return null;
    }

    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        const user = await window.luminaDB.get('users', userId);
        if (!user) throw new Error('User not found');

        // Verify old password (in real app, use proper hashing)
        if (user.password !== oldPassword) {
            throw new Error('Old password is incorrect');
        }

        return await this.updateProfile(userId, { password: newPassword });
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        const users = await window.luminaDB.getByIndex('users', 'email', email);
        return users.length > 0 ? users[0] : null;
    }

    /**
     * Search users
     */
    async searchUsers(query) {
        const allUsers = await window.luminaDB.getAll('users');
        const q = query.toLowerCase();
        return allUsers.filter(user =>
            user.name.toLowerCase().includes(q) ||
            user.email.toLowerCase().includes(q)
        );
    }
}

// Global instance
window.profileManager = new ProfileManager();
