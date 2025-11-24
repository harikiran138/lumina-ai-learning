/**
 * Dynamic Dashboard Content Renderer
 * Converts static dashboard content to use dynamic database data
 */

class DynamicDashboard {
    constructor() {
        this.api = window.luminaAPI;
        this.ui = window.luminaUI;
        this.loader = window.dashboardLoader;
        this.currentUser = null;
        this.dashboardData = null;
    }

    async initialize() {
        try {
            // Wait for database to be ready
            await this.waitForDatabase();
            
            // Get current user and role
            this.currentUser = await this.api.getCurrentUser();
            
            if (!this.currentUser) {
                window.location.href = '../login.html';
                return;
            }

            // Load role-specific dashboard
            await this.loadDashboard();
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.ui.showNotification('Failed to load dashboard', 'error');
        }
    }

    async waitForDatabase() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.luminaAPI || !window.luminaDB || attempts >= maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (attempts >= maxAttempts) {
            throw new Error('Database initialization timeout');
        }
    }

    async loadDashboard() {
        // Get dashboard data based on user role
        this.dashboardData = await this.api.getDashboardData(this.currentUser.role, this.currentUser.id);
        
        // Update user display
        this.updateUserDisplay();
        
        // Render role-specific content
        switch (this.currentUser.role) {
            case 'admin':
                await this.renderAdminDashboard();
                break;
            case 'teacher':
                await this.renderTeacherDashboard();
                break;
            case 'student':
                await this.renderStudentDashboard();
                break;
            default:
                throw new Error('Unknown user role: ' + this.currentUser.role);
        }
    }

    updateUserDisplay() {
        const userNameDisplay = document.getElementById('user-name-display');
        const userAvatarDisplay = document.getElementById('user-avatar-display');
        
        if (userNameDisplay) {
            const roleTitle = this.currentUser.role === 'admin' ? 'Admin' : 
                             this.currentUser.role === 'teacher' ? 'Teacher' : 'Student';
            userNameDisplay.textContent = `${this.currentUser.name} (${roleTitle})`;
        }
        
        if (userAvatarDisplay) {
            userAvatarDisplay.textContent = this.currentUser.name.charAt(0).toUpperCase();
        }
    }

    async renderAdminDashboard() {
        const container = document.getElementById('page-content-wrapper');
        if (!container) return;

        container.innerHTML = `
            <div class="p-6 space-y-6">
                <!-- Header Stats -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.totalUsers}</p>
                            </div>
                            <div class="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.activeUsers}</p>
                            </div>
                            <div class="p-3 bg-green-100 dark:bg-green-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.totalCourses}</p>
                            </div>
                            <div class="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Teachers</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.teachers}</p>
                            </div>
                            <div class="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Management Sections -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- User Management -->
                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl border border-gray-200 dark:border-gray-800">
                        <div class="p-6 border-b border-gray-200 dark:border-gray-800">
                            <h3 class="text-lg font-semibold">User Management</h3>
                        </div>
                        <div class="p-6">
                            <div class="space-y-4">
                                ${this.renderUserList()}
                            </div>
                        </div>
                    </div>

                    <!-- Course Management -->
                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl border border-gray-200 dark:border-gray-800">
                        <div class="p-6 border-b border-gray-200 dark:border-gray-800">
                            <h3 class="text-lg font-semibold">Course Management</h3>
                        </div>
                        <div class="p-6">
                            <div class="space-y-4">
                                ${this.renderCourseList()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderUserList() {
        if (!this.dashboardData.users || this.dashboardData.users.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No users found</p>';
        }

        return this.dashboardData.users.slice(0, 5).map(user => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-medium">${user.name}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${user.role}</p>
                    </div>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    ${user.status || 'active'}
                </div>
            </div>
        `).join('');
    }

    renderCourseList() {
        if (!this.dashboardData.courses || this.dashboardData.courses.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No courses found</p>';
        }

        return this.dashboardData.courses.slice(0, 5).map(course => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                    <p class="font-medium">${course.name}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${course.description}</p>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    ${course.members ? course.members.length : 0} members
                </div>
            </div>
        `).join('');
    }

    async renderTeacherDashboard() {
        const container = document.getElementById('page-content-wrapper');
        if (!container) return;

        container.innerHTML = `
            <div class="p-6 space-y-6">
                <!-- Header Stats -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.totalStudents}</p>
                            </div>
                            <div class="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Mastery</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.avgMastery}%</p>
                            </div>
                            <div class="p-3 bg-green-100 dark:bg-green-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Courses Managed</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.coursesManaged}</p>
                            </div>
                            <div class="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">To Grade</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.assessmentsToGrade}</p>
                            </div>
                            <div class="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Courses Section -->
                <div class="bg-white dark:bg-[#1C1C1C] rounded-xl border border-gray-200 dark:border-gray-800">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 class="text-lg font-semibold">Your Courses</h3>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${this.renderTeacherCourses()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTeacherCourses() {
        if (!this.dashboardData.courses || this.dashboardData.courses.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400 text-center py-8 col-span-full">No courses assigned</p>';
        }

        return this.dashboardData.courses.map(course => `
            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 class="font-semibold text-lg mb-2">${course.name}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${course.description}</p>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-blue-600 dark:text-blue-400">${course.members ? course.members.length : 0} students</span>
                    <button class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    async renderStudentDashboard() {
        const container = document.getElementById('page-content-wrapper');
        if (!container) return;

        container.innerHTML = `
            <div class="p-6 space-y-6">
                <!-- Header Stats -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Mastery</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.overallMastery}%</p>
                            </div>
                            <div class="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.currentStreak}</p>
                            </div>
                            <div class="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Courses Enrolled</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.enrolledCourses.length}</p>
                            </div>
                            <div class="p-3 bg-green-100 dark:bg-green-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${this.dashboardData.attendance}%</p>
                            </div>
                            <div class="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
                                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Courses Section -->
                <div class="bg-white dark:bg-[#1C1C1C] rounded-xl border border-gray-200 dark:border-gray-800">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 class="text-lg font-semibold">Your Courses</h3>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${this.renderStudentCourses()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStudentCourses() {
        if (!this.dashboardData.enrolledCourses || this.dashboardData.enrolledCourses.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400 text-center py-8 col-span-full">No courses enrolled</p>';
        }

        return this.dashboardData.enrolledCourses.map(course => {
            const progress = this.dashboardData.studentProgress.find(p => p.courseId === course.id);
            const mastery = progress ? progress.mastery : 0;
            const progressPercent = progress ? progress.progress : 0;

            return `
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h4 class="font-semibold text-lg mb-2">${course.name}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${course.description}</p>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>${progressPercent}%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>Mastery</span>
                            <span class="font-semibold">${mastery}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Refresh dashboard data
    async refresh() {
        await this.loadDashboard();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.dynamicDashboard = new DynamicDashboard();
    await window.dynamicDashboard.initialize();
});

// Make class available globally
window.DynamicDashboard = DynamicDashboard;