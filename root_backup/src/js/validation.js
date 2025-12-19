/**
 * Lumina Platform Validation Script
 * Tests all dynamic functionality across the platform
 */

class LuminaValidation {
    constructor() {
        this.testResults = [];
        this.api = window.luminaAPI;
        this.db = window.luminaDB;
    }

    async runAllTests() {
        console.log('🚀 Starting Lumina Platform Validation...');
        
        // Test database connectivity
        await this.testDatabaseConnection();
        
        // Test API functionality
        await this.testAPIFunctions();
        
        // Test authentication system
        await this.testAuthentication();
        
        // Test user management
        await this.testUserManagement();
        
        // Test course management
        await this.testCourseManagement();
        
        // Test progress tracking
        await this.testProgressTracking();
        
        // Test data export/import
        await this.testDataManagement();
        
        // Display results
        this.displayResults();
        
        return this.testResults;
    }

    async testDatabaseConnection() {
        try {
            console.log('🔗 Testing database connection...');
            
            // Check if database is initialized
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            
            // Test basic operations
            const testData = { id: 'test_' + Date.now(), name: 'Test User' };
            await this.db.add('users', testData);
            const retrieved = await this.db.getById('users', testData.id);
            
            if (retrieved && retrieved.name === 'Test User') {
                this.addResult('Database Connection', 'PASS', 'Basic CRUD operations working');
                await this.db.delete('users', testData.id); // Cleanup
            } else {
                throw new Error('Data integrity check failed');
            }
            
        } catch (error) {
            this.addResult('Database Connection', 'FAIL', error.message);
        }
    }

    async testAPIFunctions() {
        try {
            console.log('🔌 Testing API functions...');
            
            if (!this.api) {
                throw new Error('API not initialized');
            }
            
            // Test user retrieval
            const users = await this.api.getAllUsers();
            if (!Array.isArray(users)) {
                throw new Error('getAllUsers() did not return array');
            }
            
            // Test course retrieval
            const courses = await this.api.getAllCourses();
            if (!Array.isArray(courses)) {
                throw new Error('getAllCourses() did not return array');
            }
            
            this.addResult('API Functions', 'PASS', `Users: ${users.length}, Courses: ${courses.length}`);
            
        } catch (error) {
            this.addResult('API Functions', 'FAIL', error.message);
        }
    }

    async testAuthentication() {
        try {
            console.log('🔐 Testing authentication system...');
            
            // Test login with default admin
            const loginResult = await this.api.login('admin@lumina.edu', 'admin123');
            
            if (!loginResult || !loginResult.user) {
                throw new Error('Admin login failed');
            }
            
            // Test current user retrieval
            const currentUser = await this.api.getCurrentUser();
            if (!currentUser || currentUser.role !== 'admin') {
                throw new Error('Current user retrieval failed');
            }
            
            this.addResult('Authentication', 'PASS', `Logged in as ${currentUser.name}`);
            
        } catch (error) {
            this.addResult('Authentication', 'FAIL', error.message);
        }
    }

    async testUserManagement() {
        try {
            console.log('👥 Testing user management...');
            
            // Test user creation
            const testUser = {
                name: 'Test Student',
                email: 'test.student@test.com',
                role: 'student'
            };
            
            const createdUser = await this.api.createUser(testUser);
            if (!createdUser || !createdUser.id) {
                throw new Error('User creation failed');
            }
            
            // Test user search
            const searchResults = await this.api.searchUsers('Test Student');
            if (!searchResults.length || searchResults[0].email !== testUser.email) {
                throw new Error('User search failed');
            }
            
            this.addResult('User Management', 'PASS', 'Create and search operations working');
            
            // Cleanup
            await this.db.delete('users', createdUser.id);
            
        } catch (error) {
            this.addResult('User Management', 'FAIL', error.message);
        }
    }

    async testCourseManagement() {
        try {
            console.log('📚 Testing course management...');
            
            // Test course creation
            const testCourse = {
                name: 'Test Course',
                description: 'A test course for validation',
                teacherId: 'admin_001',
                members: ['admin_001']
            };
            
            const createdCourse = await this.api.createCourse(testCourse);
            if (!createdCourse || !createdCourse.id) {
                throw new Error('Course creation failed');
            }
            
            // Test course search
            const searchResults = await this.api.searchCourses('Test Course');
            if (!searchResults.length || searchResults[0].name !== testCourse.name) {
                throw new Error('Course search failed');
            }
            
            this.addResult('Course Management', 'PASS', 'Create and search operations working');
            
            // Cleanup
            await this.db.delete('courses', createdCourse.id);
            
        } catch (error) {
            this.addResult('Course Management', 'FAIL', error.message);
        }
    }

    async testProgressTracking() {
        try {
            console.log('📊 Testing progress tracking...');
            
            // Test progress update
            const progressData = {
                mastery: 85,
                progress: 90,
                streak: 5,
                struggling: false
            };
            
            const result = await this.api.updateStudentProgress('student_001', 'course_001', progressData);
            if (!result) {
                throw new Error('Progress update failed');
            }
            
            // Test progress retrieval
            const progress = await this.api.getStudentProgress('student_001', 'course_001');
            if (!progress || progress.mastery !== 85) {
                throw new Error('Progress retrieval failed');
            }
            
            this.addResult('Progress Tracking', 'PASS', 'Update and retrieval working');
            
        } catch (error) {
            this.addResult('Progress Tracking', 'FAIL', error.message);
        }
    }

    async testDataManagement() {
        try {
            console.log('💾 Testing data management...');
            
            // Test data export
            const exportData = await this.api.exportData();
            if (!exportData || typeof exportData !== 'string') {
                throw new Error('Data export failed');
            }
            
            const parsedData = JSON.parse(exportData);
            if (!parsedData.users || !parsedData.courses) {
                throw new Error('Exported data structure invalid');
            }
            
            this.addResult('Data Management', 'PASS', 'Export functionality working');
            
        } catch (error) {
            this.addResult('Data Management', 'FAIL', error.message);
        }
    }

    addResult(test, status, message) {
        const result = { test, status, message, timestamp: new Date() };
        this.testResults.push(result);
        
        const emoji = status === 'PASS' ? '✅' : '❌';
        console.log(`${emoji} ${test}: ${message}`);
    }

    displayResults() {
        console.log('\n📋 Validation Results Summary:');
        console.log('================================');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total:  ${this.testResults.length}`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   • ${r.test}: ${r.message}`));
        }
        
        const successRate = Math.round((passed / this.testResults.length) * 100);
        console.log(`\n🎯 Success Rate: ${successRate}%`);
        
        if (successRate >= 90) {
            console.log('🎉 Excellent! Platform is working correctly.');
        } else if (successRate >= 70) {
            console.log('⚠️  Good, but some issues need attention.');
        } else {
            console.log('🚨 Major issues detected. Review failed tests.');
        }
    }

    // Get validation report for display
    getValidationReport() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const successRate = Math.round((passed / this.testResults.length) * 100);
        
        return {
            passed,
            failed,
            total: this.testResults.length,
            successRate,
            results: this.testResults,
            status: successRate >= 90 ? 'excellent' : successRate >= 70 ? 'good' : 'needs-attention'
        };
    }
}

// Auto-run validation when script loads (optional)
document.addEventListener('DOMContentLoaded', async () => {
    // Only run validation if explicitly requested
    if (window.location.search.includes('validate=true') || window.location.hash.includes('validate')) {
        // Wait for all systems to initialize
        setTimeout(async () => {
            const validator = new LuminaValidation();
            await validator.runAllTests();
            window.luminaValidationResults = validator.getValidationReport();
        }, 2000);
    }
});

// Make validation available globally
window.LuminaValidation = LuminaValidation;

// Quick validation function for console use
window.validateLumina = async () => {
    const validator = new LuminaValidation();
    return await validator.runAllTests();
};