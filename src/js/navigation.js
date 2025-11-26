/**
 * Lumina Navigation System
 * Unified navigation component for all pages
 */

class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.navContainer = null;
    }

    async init() {
        this.currentUser = await window.luminaDB.getCurrentUser();
    }

    /**
     * Generate top navigation HTML
     */
    generateTopNav(role = 'student') {
        const userName = this.currentUser?.name || 'User';
        const userRole = this.currentUser?.role || role;
        const unreadMessages = 0; // Would fetch from DB

        return `
            <header class="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md">
                <div class="container mx-auto px-4 py-4">
                    <div class="flex items-center justify-between h-16">
                        <!-- Logo -->
                        <div class="flex items-center gap-3">
                            <a href="dashboard.html" class="text-2xl font-bold">
                                <span class="gradient-text">Lumina</span> ✨
                            </a>
                        </div>

                        <!-- Center Navigation -->
                        <nav class="hidden md:flex items-center gap-8 ml-8">
                            ${this.getNavLinks(userRole)}
                        </nav>

                        <!-- Right Actions -->
                        <div class="flex items-center gap-4">
                            <!-- Search (hidden on mobile) -->
                            <div class="hidden lg:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                                <input type="text" placeholder="Search..." 
                                    class="bg-transparent outline-none w-32 text-sm dark:text-gray-200"
                                    id="search-input">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>

                            <!-- Notifications -->
                            <button class="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" id="notifications-btn">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                </svg>
                                <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            <!-- Messages -->
                            <button class="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" id="messages-btn">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                ${unreadMessages > 0 ? `<span class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">${unreadMessages}</span>` : ''}
                            </button>

                            <!-- Theme Toggle -->
                            <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" id="theme-toggle-nav">
                                <svg id="light-icon-nav" class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <svg id="dark-icon-nav" class="w-6 h-6 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            </button>

                            <!-- User Menu -->
                            <div class="relative">
                                <button class="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" id="user-menu-btn">
                                    <div class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
                                        ${userName.charAt(0)}
                                    </div>
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                                    </svg>
                                </button>

                                <!-- User Dropdown Menu -->
                                <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div class="p-3 border-b border-gray-200 dark:border-gray-700">
                                        <p class="font-semibold">${userName}</p>
                                        <p class="text-sm text-gray-500">${this.currentUser?.email}</p>
                                    </div>
                                    <nav class="py-2">
                                        <a href="profile.html" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            👤 My Profile
                                        </a>
                                        <a href="settings.html" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            ⚙️ Settings
                                        </a>
                                        <hr class="my-2 border-gray-200 dark:border-gray-700">
                                        <button id="logout-btn" class="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            🚪 Logout
                                        </button>
                                    </nav>
                                </div>
                            </div>

                            <!-- Mobile Menu Toggle -->
                            <button class="md:hidden p-2" id="mobile-menu-btn">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * Get navigation links based on role
     */
    getNavLinks(role) {
        const links = {
            student: [
                { href: '/student/dashboard.html', label: '📊 Dashboard', icon: '📊' },
                { href: '/student/course_explorer.html', label: '🎓 Courses', icon: '🎓' },
                { href: '/student/ai_tutor.html', label: '🤖 AI Tutor', icon: '🤖' },
                { href: '/student/assessment.html', label: '✏️ Assessments', icon: '✏️' },
                { href: '/student/community.html', label: '💬 Community', icon: '💬' }
            ],
            teacher: [
                { href: '/teacher/dashboard.html', label: '📊 Dashboard', icon: '📊' },
                { href: '/teacher/content_upload.html', label: '📤 Upload Content', icon: '📤' },
                { href: '/teacher/assessment_management.html', label: '✏️ Assessments', icon: '✏️' },
                { href: '/teacher/reports.html', label: '📈 Reports', icon: '📈' },
                { href: '/teacher/community.html', label: '💬 Community', icon: '💬' }
            ],
            admin: [
                { href: '/admin/dashboard.html', label: '🏛️ Dashboard', icon: '🏛️' },
                { href: '/admin/users.html', label: '👥 Users', icon: '👥' },
                { href: '/admin/courses.html', label: '📚 Courses', icon: '📚' },
                { href: '/admin/community.html', label: '💬 Community', icon: '💬' },
                { href: '/admin/system.html', label: '⚙️ System', icon: '⚙️' }
            ]
        };

        const navItems = links[role] || links.student;
        return navItems.map(item => `
            <a href="${item.href}" class="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium">
                ${item.label}
            </a>
        `).join('');
    }

    /**
     * Generate sidebar navigation (for more compact layout)
     */
    generateSidebar(role = 'student') {
        return `
            <aside class="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto hidden lg:block">
                <nav class="p-4 space-y-2">
                    ${this.getSidebarLinks(role)}
                </nav>
            </aside>
        `;
    }

    /**
     * Get sidebar navigation links
     */
    getSidebarLinks(role) {
        const links = {
            student: [
                { href: '/student/dashboard.html', label: 'Dashboard', icon: '📊' },
                { href: '/student/course_explorer.html', label: 'Courses', icon: '🎓' },
                { href: '/student/ai_tutor.html', label: 'AI Tutor', icon: '🤖' },
                { href: '/student/assessment.html', label: 'Assessments', icon: '✏️' },
                { href: '/student/lesson_page.html', label: 'Lessons', icon: '📖' },
                { href: '/student/my_notes.html', label: 'My Notes', icon: '📝' },
                { href: '/student/progress_streaks.html', label: 'Progress', icon: '🔥' },
                { href: '/student/leaderboard.html', label: 'Leaderboard', icon: '🏆' },
                { href: '/student/community.html', label: 'Community', icon: '💬' }
            ],
            teacher: [
                { href: '/teacher/dashboard.html', label: 'Dashboard', icon: '📊' },
                { href: '/teacher/content_upload.html', label: 'Upload Content', icon: '📤' },
                { href: '/teacher/assessment_management.html', label: 'Assessments', icon: '✏️' },
                { href: '/teacher/reports.html', label: 'Reports', icon: '📈' },
                { href: '/teacher/community.html', label: 'Community', icon: '💬' }
            ],
            admin: [
                { href: '/admin/dashboard.html', label: 'Dashboard', icon: '🏛️' },
                { href: '/admin/users.html', label: 'User Management', icon: '👥' },
                { href: '/admin/courses.html', label: 'Courses', icon: '📚' },
                { href: '/admin/community.html', label: 'Moderation', icon: '💬' },
                { href: '/admin/system.html', label: 'System Health', icon: '⚙️' }
            ]
        };

        const sidebarItems = links[role] || links.student;
        return sidebarItems.map(item => `
            <a href="${item.href}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <span class="text-xl">${item.icon}</span>
                <span>${item.label}</span>
            </a>
        `).join('');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle-nav');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const html = document.documentElement;
                html.classList.toggle('dark');
                localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
                this.updateThemeIcon();
            });
        }

        // User menu toggle
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', () => {
                userDropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await window.luminaDB.logout();
                window.location.href = '/login.html';
            });
        }

        // Notifications button
        const notificationsBtn = document.getElementById('notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                this.showNotificationsPanel();
            });
        }

        // Messages button
        const messagesBtn = document.getElementById('messages-btn');
        if (messagesBtn) {
            messagesBtn.addEventListener('click', () => {
                this.showMessagesPanel();
            });
        }

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                // Implement mobile menu toggle
            });
        }
    }

    /**
     * Update theme icon
     */
    updateThemeIcon() {
        const isDark = document.documentElement.classList.contains('dark');
        const lightIcon = document.getElementById('light-icon-nav');
        const darkIcon = document.getElementById('dark-icon-nav');

        if (lightIcon && darkIcon) {
            lightIcon.classList.toggle('hidden', isDark);
            darkIcon.classList.toggle('hidden', !isDark);
        }
    }

    /**
     * Show notifications panel
     */
    showNotificationsPanel() {
        const notifications = window.notificationsManager?.getNotifications() || [];
        console.log('Notifications:', notifications);
        // Implement UI for notifications panel
    }

    /**
     * Show messages panel
     */
    showMessagesPanel() {
        console.log('Opening messages panel');
        // Implement UI for messages panel
    }
}

// Global instance
window.navigationManager = new NavigationManager();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await window.navigationManager.init();
    window.navigationManager.setupEventListeners();
});
