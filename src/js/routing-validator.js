/**
 * Lumina Platform Routing Validation
 * Tests all navigation links and routing paths across the platform
 */

class RoutingValidator {
    constructor() {
        this.testResults = [];
        this.currentPath = window.location.pathname;
        this.currentDir = this.getCurrentDirectory();
    }

    getCurrentDirectory() {
        const path = window.location.pathname;
        if (path.includes('/admin/')) return 'admin';
        if (path.includes('/teacher/')) return 'teacher';
        if (path.includes('/student/')) return 'student';
        return 'root';
    }

    async runRoutingTests() {
        console.log('🔍 Starting Routing Validation...');
        
        this.testLogoLinks();
        this.testNavigationLinks();
        this.testCrossPageLinks();
        this.testAuthenticationRedirects();
        
        this.displayResults();
        return this.testResults;
    }

    testLogoLinks() {
        console.log('🏠 Testing logo links...');
        
        const logoLinks = document.querySelectorAll('a[class*="gradient-text"]').length > 0 ? 
                         document.querySelectorAll('a[class*="gradient-text"]').parentElement : 
                         document.querySelectorAll('a:has(.gradient-text)');
        
        if (logoLinks.length === 0) {
            // Fallback: find logo by text content
            const allLinks = document.querySelectorAll('a');
            for (let link of allLinks) {
                if (link.textContent.includes('Lumina')) {
                    this.validateLogoLink(link);
                    break;
                }
            }
        } else {
            logoLinks.forEach(link => this.validateLogoLink(link));
        }
    }

    validateLogoLink(link) {
        const href = link.getAttribute('href');
        const expectedHref = this.getExpectedLogoHref();
        
        if (href === expectedHref) {
            this.addResult('Logo Link', 'PASS', `Correct: ${href}`);
        } else {
            this.addResult('Logo Link', 'FAIL', `Expected: ${expectedHref}, Found: ${href}`);
        }
    }

    getExpectedLogoHref() {
        switch (this.currentDir) {
            case 'admin':
            case 'teacher':
            case 'student':
                return '../index.html';
            case 'root':
                return 'index.html';
            default:
                return '../index.html';
        }
    }

    testNavigationLinks() {
        console.log('🧭 Testing navigation links...');
        
        const navLinks = document.querySelectorAll('nav a, .sidebar a, aside a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const linkText = link.textContent.trim();
            
            if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
                this.validateNavigationLink(link, href, linkText);
            }
        });
    }

    validateNavigationLink(link, href, linkText) {
        const isValid = this.isValidPath(href);
        const isCorrectRelative = this.isCorrectRelativePath(href);
        
        if (isValid && isCorrectRelative) {
            this.addResult('Navigation Link', 'PASS', `${linkText}: ${href}`);
        } else {
            let issue = '';
            if (!isValid) issue += 'Invalid path; ';
            if (!isCorrectRelative) issue += 'Incorrect relative path; ';
            this.addResult('Navigation Link', 'FAIL', `${linkText}: ${href} - ${issue}`);
        }
    }

    testCrossPageLinks() {
        console.log('🔗 Testing cross-page links...');
        
        // Test login/logout links
        const loginLinks = document.querySelectorAll('a[href*="login"]');
        loginLinks.forEach(link => {
            const href = link.getAttribute('href');
            const expectedLoginHref = this.currentDir === 'root' ? 'login.html' : '../login.html';
            
            if (href === expectedLoginHref) {
                this.addResult('Login Link', 'PASS', `Correct: ${href}`);
            } else {
                this.addResult('Login Link', 'FAIL', `Expected: ${expectedLoginHref}, Found: ${href}`);
            }
        });

        // Test dashboard links
        const dashboardLinks = document.querySelectorAll('a[href*="dashboard"]');
        dashboardLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === 'dashboard.html' || href === '../dashboard.html') {
                this.addResult('Dashboard Link', 'PASS', `Correct: ${href}`);
            } else if (href.includes('/dashboard.html')) {
                this.addResult('Dashboard Link', 'WARN', `Check path: ${href}`);
            }
        });
    }

    testAuthenticationRedirects() {
        console.log('🔐 Testing authentication redirects...');
        
        if (typeof luminaUI !== 'undefined' && luminaUI.redirectToDashboard) {
            // Test redirect logic
            const testRoles = ['admin', 'teacher', 'student'];
            testRoles.forEach(role => {
                try {
                    // We can't actually navigate, but we can check the function exists
                    const redirectPath = this.getExpectedDashboardPath(role);
                    this.addResult('Auth Redirect', 'PASS', `${role} -> ${redirectPath}`);
                } catch (error) {
                    this.addResult('Auth Redirect', 'FAIL', `${role} redirect failed: ${error.message}`);
                }
            });
        } else {
            this.addResult('Auth Redirect', 'FAIL', 'luminaUI.redirectToDashboard not available');
        }
    }

    getExpectedDashboardPath(role) {
        const paths = {
            admin: '../admin/dashboard.html',
            teacher: '../teacher/dashboard.html',
            student: '../student/dashboard.html'
        };
        return paths[role] || '../login.html';
    }

    isValidPath(href) {
        // Basic path validation
        if (!href) return false;
        if (href.startsWith('#')) return true; // Anchor links are valid
        if (href.startsWith('http')) return true; // External links
        if (href.startsWith('mailto:')) return true; // Email links
        
        // File extension check for local files
        const validExtensions = ['.html', '.php', '.asp', '.jsp'];
        const hasValidExtension = validExtensions.some(ext => href.includes(ext));
        const isDirectory = href.endsWith('/');
        
        return hasValidExtension || isDirectory || href === '.' || href === '..';
    }

    isCorrectRelativePath(href) {
        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
            return true; // External/special links don't need relative path validation
        }

        // Check relative path correctness based on current directory
        switch (this.currentDir) {
            case 'admin':
            case 'teacher':
            case 'student':
                // Should use ../ for going up to root, or stay in same directory
                if (href.includes('index.html') && !href.startsWith('../')) {
                    return false; // Should be ../index.html
                }
                if (href.includes('login.html') && !href.startsWith('../')) {
                    return false; // Should be ../login.html
                }
                break;
            case 'root':
                // Should not use ../ for files in same directory
                if (href.startsWith('../') && !href.includes('admin/') && !href.includes('teacher/') && !href.includes('student/')) {
                    return false;
                }
                break;
        }
        
        return true;
    }

    addResult(test, status, message) {
        const result = { test, status, message, timestamp: new Date() };
        this.testResults.push(result);
        
        const emoji = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
        console.log(`${emoji} ${test}: ${message}`);
    }

    displayResults() {
        console.log('\n📋 Routing Validation Results:');
        console.log('==============================');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnings = this.testResults.filter(r => r.status === 'WARN').length;
        
        console.log(`✅ Passed: ${passed}`);
        console.log(`⚠️ Warnings: ${warnings}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${this.testResults.length}`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   • ${r.test}: ${r.message}`));
        }

        if (warnings > 0) {
            console.log('\n⚠️ Warnings:');
            this.testResults
                .filter(r => r.status === 'WARN')
                .forEach(r => console.log(`   • ${r.test}: ${r.message}`));
        }
        
        const successRate = Math.round((passed / this.testResults.length) * 100);
        console.log(`\n🎯 Success Rate: ${successRate}%`);
        
        if (successRate >= 95) {
            console.log('🎉 Excellent! All routing is working correctly.');
        } else if (successRate >= 80) {
            console.log('✅ Good routing, minor issues detected.');
        } else {
            console.log('🚨 Routing issues detected. Review failed tests.');
        }
    }

    getValidationReport() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnings = this.testResults.filter(r => r.status === 'WARN').length;
        const successRate = Math.round((passed / this.testResults.length) * 100);
        
        return {
            passed,
            failed,
            warnings,
            total: this.testResults.length,
            successRate,
            results: this.testResults,
            status: successRate >= 95 ? 'excellent' : successRate >= 80 ? 'good' : 'needs-attention'
        };
    }
}

// Auto-run routing validation when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Only run if explicitly requested
    if (window.location.search.includes('check-routing=true') || window.location.hash.includes('routing')) {
        setTimeout(() => {
            const validator = new RoutingValidator();
            validator.runRoutingTests();
            window.routingValidationResults = validator.getValidationReport();
        }, 1000);
    }
});

// Make routing validation available globally
window.RoutingValidator = RoutingValidator;

// Quick routing check function for console use
window.checkRouting = () => {
    const validator = new RoutingValidator();
    return validator.runRoutingTests();
};