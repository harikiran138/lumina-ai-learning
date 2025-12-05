/**
 * Lumina UI Utilities - Common functions for UI interactions
 */

class LuminaUI {
    constructor() {
        this.currentUser = null;
        this.api = window.luminaAPI;
    }

    // Initialize common UI components
    async init() {
        await this.loadCurrentUser();
        this.setupThemeToggle();
        this.setupMobileMenu();
        this.setupGlobalErrorHandler();
        this.requestNotificationPermission();
    }

    // Load current user and update UI
    async loadCurrentUser() {
        try {
            this.currentUser = await this.api.getCurrentUser();
            if (this.currentUser) {
                this.updateUserDisplay();
            }
        } catch (error) {
            console.error('Failed to load current user:', error);
        }
    }

    // Update user display in header
    updateUserDisplay() {
        const userNameEl = document.getElementById('user-name-display');
        const userAvatarEl = document.getElementById('user-avatar-display');
        
        if (userNameEl && this.currentUser) {
            userNameEl.textContent = this.currentUser.name;
        }
        
        if (userAvatarEl && this.currentUser) {
            userAvatarEl.textContent = this.currentUser.avatar;
            userAvatarEl.className = `w-10 h-10 rounded-full ${this.currentUser.color} flex items-center justify-center text-white font-bold text-lg`;
        }
    }

    // Theme management
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                const isDark = document.documentElement.classList.contains('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                
                // Dispatch custom event for theme change
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
            });
        }
    }

    // Mobile menu management
    setupMobileMenu() {
        const menuButton = document.getElementById('menu-button');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (menuButton && sidebar && overlay) {
            menuButton.addEventListener('click', () => {
                this.toggleSidebar();
            });

            overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content') || document.getElementById('main-content-container');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            if (mainContent) mainContent.classList.add('lg:translate-x-0', 'translate-x-64');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            if (mainContent) mainContent.classList.remove('lg:translate-x-0', 'translate-x-64');
            overlay.classList.add('hidden');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content') || document.getElementById('main-content-container');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.add('-translate-x-full');
        if (mainContent) mainContent.classList.remove('lg:translate-x-0', 'translate-x-64');
        overlay.classList.add('hidden');
    }

    // Modal management
    openModal(modalEl, contentEl) {
        modalEl.classList.remove('hidden');
        setTimeout(() => {
            contentEl.classList.remove('scale-95', 'opacity-0');
            contentEl.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    closeModal(modalEl, contentEl) {
        contentEl.classList.remove('scale-100', 'opacity-100');
        contentEl.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modalEl.classList.add('hidden');
        }, 200);
    }

    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-xl z-50 transition-all transform translate-x-full opacity-0`;
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.className += ' bg-green-500 text-white';
                break;
            case 'error':
                notification.className += ' bg-red-500 text-white';
                break;
            case 'warning':
                notification.className += ' bg-yellow-500 text-white';
                break;
            default:
                notification.className += ' bg-blue-500 text-white';
        }
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
            notification.classList.add('translate-x-0', 'opacity-100');
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        return notification;
    }

    // Loading states
    showLoading(element, text = 'Loading...') {
        const loader = document.createElement('div');
        loader.className = 'flex items-center justify-center p-4 text-gray-500';
        loader.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${text}
        `;
        
        element.innerHTML = '';
        element.appendChild(loader);
        return loader;
    }

    hideLoading(element) {
        const loader = element.querySelector('.animate-spin');
        if (loader) {
            loader.parentElement.remove();
        }
    }

    // Form validation
    validateForm(formElement) {
        const errors = [];
        const inputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                errors.push(`${input.placeholder || input.name || 'Field'} is required`);
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
            
            // Email validation
            if (input.type === 'email' && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    errors.push('Please enter a valid email address');
                    input.classList.add('border-red-500');
                }
            }
        });
        
        return errors;
    }

    // Data formatting utilities
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return `${this.formatDate(dateString)} ${this.formatTime(dateString)}`;
    }

    // Progress bar utility
    createProgressBar(percentage, className = '') {
        const progressBar = document.createElement('div');
        progressBar.className = `w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 ${className}`;
        
        const progressFill = document.createElement('div');
        progressFill.className = 'h-2.5 rounded-full transition-all duration-300';
        
        if (percentage >= 80) {
            progressFill.className += ' bg-green-500';
        } else if (percentage >= 60) {
            progressFill.className += ' bg-yellow-500';
        } else {
            progressFill.className += ' bg-red-500';
        }
        
        progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        progressBar.appendChild(progressFill);
        
        return progressBar;
    }

    // Avatar utility
    createAvatar(user, size = 'w-10 h-10') {
        const avatar = document.createElement('div');
        avatar.className = `${size} rounded-full ${user.color} flex items-center justify-center text-white font-bold flex-shrink-0`;
        avatar.textContent = user.avatar;
        return avatar;
    }

    // Error handling
    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showNotification('An error occurred. Please try again.', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showNotification('An error occurred. Please try again.', 'error');
        });
    }

    // Permission management
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    // Search functionality
    createSearchInput(placeholder, onSearch) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'relative';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = placeholder;
        searchInput.className = 'w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent';
        
        const searchIcon = document.createElement('div');
        searchIcon.className = 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400';
        searchIcon.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
        `;
        
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);
        
        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                onSearch(e.target.value);
            }, 300);
        });
        
        return searchContainer;
    }

    // Chart utilities (for Chart.js integration)
    getChartColors() {
        const isDark = document.documentElement.classList.contains('dark');
        return {
            primary: '#fbbf24',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            text: isDark ? '#d1d5db' : '#4b5563',
            grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            background: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.2)'
        };
    }

    // Authentication helpers
    redirectToLogin() {
        // Prevent multiple redirects
        if (this._redirecting) return;
        this._redirecting = true;
        
        console.log('Redirecting to login page');
        const currentPath = window.location.pathname;
        if (currentPath.includes('/admin/') || currentPath.includes('/teacher/') || currentPath.includes('/student/')) {
            window.location.href = '../login.html';
        } else {
            window.location.href = 'login.html';
        }
    }

    redirectToDashboard(role) {
        // Prevent multiple redirects
        if (this._redirecting) return;
        this._redirecting = true;
        
        console.log('Redirecting to dashboard for role:', role);
        const currentPath = window.location.pathname;
        let basePath = '';
        
        // Determine the base path based on current location
        if (currentPath.includes('/admin/') || currentPath.includes('/teacher/') || currentPath.includes('/student/')) {
            basePath = '../';
        } else {
            basePath = '';
        }
        
        const dashboardPaths = {
            admin: `${basePath}admin/dashboard.html`,
            teacher: `${basePath}teacher/dashboard.html`,
            student: `${basePath}student/dashboard.html`
        };
        
        const targetPath = dashboardPaths[role];
        if (targetPath) {
            console.log(`Redirecting ${role} to: ${targetPath}`);
            window.location.href = targetPath;
        } else {
            console.error(`Unknown role: ${role}`);
            this.redirectToLogin();
        }
    }

    // Local storage utilities
    setLocalData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    getLocalData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return null;
        }
    }

    removeLocalData(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    }
}

// Global UI utility instance
window.luminaUI = new LuminaUI();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for database to be ready
        let attempts = 0;
        while (!window.luminaDB && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.luminaDB) {
            await window.luminaUI.init();
        } else {
            console.warn('Database not available, skipping UI initialization');
        }
    } catch (error) {
        console.error('Failed to initialize UI utilities:', error);
    }
});

// Make utilities available globally
window.LuminaUI = LuminaUI;