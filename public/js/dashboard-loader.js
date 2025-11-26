/**
 * Dashboard Loader - Common functionality for all dashboard pages
 */

class DashboardLoader {
    constructor() {
        this.currentUser = null;
        this.api = window.luminaAPI;
        this.ui = window.luminaUI;
    }

    async init(requiredRole = null) {
        try {
            console.log('Dashboard loader initializing for role:', requiredRole);
            
            // Wait for API to be ready
            if (!this.api) {
                console.log('Waiting for API...');
                await this.waitForAPI();
            }

            // Load current user
            console.log('Loading current user...');
            await this.loadCurrentUser();
            console.log('Current user loaded:', this.currentUser);

            // Check role permissions
            if (requiredRole && this.currentUser.role !== requiredRole && this.currentUser.role !== 'admin') {
                console.log(`Access denied: required ${requiredRole}, user has ${this.currentUser.role}`);
                this.ui.showNotification('Access denied', 'error');
                this.ui.redirectToLogin();
                return false;
            }

            console.log('Role check passed');
            
            // Update UI with user info
            this.updateUserInterface();

            console.log('Dashboard initialization completed successfully');
            return true;
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.ui.showNotification('Authentication required', 'warning');
            this.ui.redirectToLogin();
            return false;
        }
    }

    async waitForAPI() {
        return new Promise((resolve) => {
            const checkAPI = () => {
                if (window.luminaAPI) {
                    this.api = window.luminaAPI;
                    this.ui = window.luminaUI;
                    resolve();
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        });
    }

    async loadCurrentUser() {
        this.currentUser = await this.api.getCurrentUser();
        if (!this.currentUser || !this.currentUser.id || !this.currentUser.role) {
            console.log('Invalid or missing user session');
            throw new Error('No valid user session found');
        }
        console.log('Valid user session loaded:', this.currentUser.role);
    }

    updateUserInterface() {
        // Update user display
        const userNameEl = document.getElementById('user-name-display');
        const userAvatarEl = document.getElementById('user-avatar-display');

        if (userNameEl && this.currentUser) {
            let displayName = this.currentUser.name;
            if (this.currentUser.role === 'admin') {
                displayName += ' (Admin)';
            }
            userNameEl.textContent = displayName;
        }

        if (userAvatarEl && this.currentUser) {
            userAvatarEl.textContent = this.currentUser.avatar;
            userAvatarEl.className = `w-10 h-10 rounded-full ${this.currentUser.color} flex items-center justify-center text-white font-bold text-lg`;
        }

        // Update navigation active states
        this.updateNavigationState();
    }

    updateNavigationState() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href.split('/').pop())) {
                link.classList.add('bg-amber-50', 'dark:bg-amber-500/10', 'text-amber-600', 'dark:text-amber-300');
                link.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
            } else {
                link.classList.remove('bg-amber-50', 'dark:bg-amber-500/10', 'text-amber-600', 'dark:text-amber-300');
                link.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
            }
        });
    }

    async logout() {
        try {
            await this.api.logout();
            this.ui.showNotification('Logged out successfully', 'success');
            this.ui.redirectToLogin();
        } catch (error) {
            console.error('Logout failed:', error);
            this.ui.redirectToLogin();
        }
    }

    // Data loading helpers for different dashboard types
    async loadAdminData() {
        return this.api.getDashboardData('admin');
    }

    async loadTeacherData() {
        return this.api.getDashboardData('teacher', this.currentUser.id);
    }

    async loadStudentData() {
        return this.api.getDashboardData('student', this.currentUser.id);
    }

    // Generic data refresh method
    async refreshData(callback) {
        const refreshBtn = document.querySelector('[data-refresh]');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
        }

        try {
            await callback();
            this.ui.showNotification('Data refreshed', 'success', 1000);
        } catch (error) {
            console.error('Data refresh failed:', error);
            this.ui.showNotification('Failed to refresh data', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = 'Refresh';
            }
        }
    }

    // Chart color helper
    getChartColors() {
        return this.ui.getChartColors();
    }

    // Setup logout handlers
    setupLogoutHandlers() {
        const logoutLinks = document.querySelectorAll('a[href*="login.html"]');
        logoutLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }

    // Setup common event listeners
    setupCommonEventListeners() {
        this.setupLogoutHandlers();

        // Handle theme changes for charts
        window.addEventListener('themeChanged', (e) => {
            // Trigger chart redraws if needed
            const event = new CustomEvent('chartThemeUpdate', { detail: e.detail });
            window.dispatchEvent(event);
        });
    }
}

// Create global instance
window.dashboardLoader = new DashboardLoader();

// Auto-initialize for dashboard pages
if (window.location.pathname.includes('dashboard.html') || 
    window.location.pathname.includes('community.html') ||
    window.location.pathname.includes('reports.html') ||
    window.location.pathname.includes('assessment') ||
    window.location.pathname.includes('content_upload.html') ||
    window.location.pathname.includes('progress') ||
    window.location.pathname.includes('leaderboard') ||
    window.location.pathname.includes('ai_tutor') ||
    window.location.pathname.includes('course_explorer') ||
    window.location.pathname.includes('my_notes')) {
    
    document.addEventListener('DOMContentLoaded', async () => {
        // Determine required role based on URL
        let requiredRole = null;
        if (window.location.pathname.includes('/admin/')) {
            requiredRole = 'admin';
        } else if (window.location.pathname.includes('/teacher/')) {
            requiredRole = 'teacher';
        } else if (window.location.pathname.includes('/student/')) {
            requiredRole = 'student';
        }

        const initialized = await window.dashboardLoader.init(requiredRole);
        if (initialized) {
            window.dashboardLoader.setupCommonEventListeners();
        }
    });
}

// Make available globally
window.DashboardLoader = DashboardLoader;