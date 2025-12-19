/**
 * Login Routing Debug Script
 * Helps debug login flow and routing issues
 */

class LoginDebugger {
    constructor() {
        this.api = window.luminaAPI;
        this.ui = window.luminaUI;
    }

    async debugLoginFlow() {
        console.log('🔍 Login Flow Debug Started...');
        
        // Check current page
        const currentPath = window.location.pathname;
        const currentDir = this.getCurrentDirectory();
        console.log(`📍 Current Page: ${currentPath}`);
        console.log(`📁 Current Directory: ${currentDir}`);
        
        // Check API availability
        if (!this.api) {
            console.error('❌ LuminaAPI not available');
            return;
        }
        
        if (!this.ui) {
            console.error('❌ LuminaUI not available');
            return;
        }
        
        console.log('✅ API and UI available');
        
        // Check current user session
        try {
            const currentUser = await this.api.getCurrentUser();
            if (currentUser) {
                console.log('👤 Current User:', currentUser);
                console.log(`🔐 User Role: ${currentUser.role}`);
                
                // Test redirect paths
                this.testRedirectPaths(currentUser.role);
            } else {
                console.log('👤 No current user session');
            }
        } catch (error) {
            console.log('👤 No current user:', error.message);
        }
        
        // Test login with demo accounts
        await this.testDemoLogins();
        
        // Test redirect function
        this.testRedirectFunction();
    }

    getCurrentDirectory() {
        const path = window.location.pathname;
        if (path.includes('/admin/')) return 'admin';
        if (path.includes('/teacher/')) return 'teacher';
        if (path.includes('/student/')) return 'student';
        return 'root';
    }

    testRedirectPaths(role) {
        console.log('🔄 Testing redirect paths...');
        
        const currentPath = window.location.pathname;
        let basePath = '';
        
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
        
        console.log(`📋 Expected redirect for ${role}: ${dashboardPaths[role]}`);
        
        // Test if the path exists (basic check)
        const testPath = dashboardPaths[role];
        console.log(`🔗 Testing path: ${testPath}`);
        
        // Create a test link to validate path
        const testLink = document.createElement('a');
        testLink.href = testPath;
        const resolvedURL = testLink.href;
        console.log(`🌐 Resolved URL: ${resolvedURL}`);
    }

    async testDemoLogins() {
        console.log('🧪 Testing demo login accounts...');
        
        const demoAccounts = [
            { email: 'admin@lumina.edu', password: 'admin', expectedRole: 'admin' },
            { email: 'teacher@lumina.edu', password: 'teacher', expectedRole: 'teacher' },
            { email: 'student@lumina.edu', password: 'student', expectedRole: 'student' }
        ];
        
        for (const account of demoAccounts) {
            try {
                console.log(`🔐 Testing login: ${account.email}`);
                
                // Don't actually login (to avoid changing current state)
                // Just check if user exists
                const users = await this.api.getAllUsers();
                const user = users.find(u => u.email === account.email);
                
                if (user) {
                    console.log(`✅ Account exists: ${account.email} (${user.role})`);
                    if (user.role !== account.expectedRole) {
                        console.warn(`⚠️ Role mismatch: expected ${account.expectedRole}, found ${user.role}`);
                    }
                } else {
                    console.error(`❌ Account not found: ${account.email}`);
                }
                
            } catch (error) {
                console.error(`❌ Failed to check account ${account.email}:`, error.message);
            }
        }
    }

    testRedirectFunction() {
        console.log('🔄 Testing redirect function...');
        
        if (typeof this.ui.redirectToDashboard === 'function') {
            console.log('✅ redirectToDashboard function exists');
            
            // Test path generation without actually redirecting
            const testRoles = ['admin', 'teacher', 'student'];
            testRoles.forEach(role => {
                console.log(`📍 Testing redirect path for ${role}:`);
                
                const currentPath = window.location.pathname;
                let basePath = '';
                
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
                
                console.log(`   → ${dashboardPaths[role]}`);
            });
        } else {
            console.error('❌ redirectToDashboard function not found');
        }
    }

    // Test manual redirect to see if it works
    async testManualRedirect(role) {
        console.log(`🚀 Testing manual redirect for role: ${role}`);
        
        const currentPath = window.location.pathname;
        let basePath = '';
        
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
        console.log(`🎯 Target path: ${targetPath}`);
        
        // Confirm before redirecting
        if (confirm(`Redirect to ${targetPath}?`)) {
            window.location.href = targetPath;
        }
    }

    // Quick login test (without redirect)
    async quickLoginTest(role) {
        const accounts = {
            admin: { email: 'admin@lumina.edu', password: 'admin' },
            teacher: { email: 'teacher@lumina.edu', password: 'teacher' },
            student: { email: 'student@lumina.edu', password: 'student' }
        };
        
        const account = accounts[role];
        if (!account) {
            console.error(`❌ Unknown role: ${role}`);
            return;
        }
        
        try {
            console.log(`🔐 Attempting login as ${role}...`);
            const user = await this.api.login(account.email, account.password);
            console.log('✅ Login successful:', user);
            
            // Test redirect path generation
            this.testRedirectPaths(user.role);
            
            return user;
        } catch (error) {
            console.error(`❌ Login failed:`, error.message);
        }
    }
}

// Make debugger available globally
window.LoginDebugger = LoginDebugger;

// Quick debug commands
window.debugLogin = () => {
    const loginDebugger = new LoginDebugger();
    return loginDebugger.debugLoginFlow();
};

window.testRedirect = (role) => {
    const loginDebugger = new LoginDebugger();
    return loginDebugger.testManualRedirect(role);
};

window.testQuickLogin = (role) => {
    const loginDebugger = new LoginDebugger();
    return loginDebugger.quickLoginTest(role);
};

// Auto-run debug if requested
if (window.location.search.includes('debug-login=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            debugLogin();
        }, 1000);
    });
}

console.log('🔧 Login Debug Tools loaded. Use debugLogin(), testRedirect(role), or testQuickLogin(role) in console.');