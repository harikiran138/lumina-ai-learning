/**
 * Data Management Utilities - Export/Import and Backup functionality
 */

class DataManager {
    constructor() {
        this.api = window.luminaAPI;
        this.ui = window.luminaUI;
    }

    // Export all data as JSON
    async exportAllData() {
        try {
            this.ui.showNotification('Exporting data...', 'info');
            const jsonData = await this.api.exportData();
            
            // Create and download file
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lumina-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.ui.showNotification('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.ui.showNotification('Export failed', 'error');
        }
    }

    // Import data from JSON file
    async importData(file) {
        try {
            this.ui.showNotification('Importing data...', 'info');
            
            const text = await this.readFileAsText(file);
            await this.api.importData(text);
            
            this.ui.showNotification('Data imported successfully. Please refresh the page.', 'success');
            
            // Refresh after a delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Import failed:', error);
            this.ui.showNotification('Import failed: ' + error.message, 'error');
        }
    }

    // Helper to read file as text
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    // Create backup schedule (mock for now)
    setupAutoBackup(intervalHours = 24) {
        console.log(`Auto backup scheduled every ${intervalHours} hours`);
        // In a real app, this would set up a service worker or server-side job
        
        this.ui.showNotification(`Auto backup enabled (every ${intervalHours}h)`, 'success', 2000);
    }

    // Clear all data (dangerous operation)
    async clearAllData() {
        const confirmed = confirm(
            'WARNING: This will delete ALL data including users, courses, messages, and progress. This action cannot be undone. Are you sure?'
        );
        
        if (!confirmed) return;
        
        const doubleConfirmed = confirm('Are you ABSOLUTELY sure? This will erase everything!');
        if (!doubleConfirmed) return;

        try {
            // Close database and delete
            if (window.luminaDB && window.luminaDB.db) {
                window.luminaDB.db.close();
            }
            
            // Delete the database
            const deleteReq = indexedDB.deleteDatabase('LuminaDB');
            
            deleteReq.onsuccess = () => {
                this.ui.showNotification('All data cleared. Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '../login.html';
                }, 2000);
            };
            
            deleteReq.onerror = () => {
                this.ui.showNotification('Failed to clear data', 'error');
            };
            
        } catch (error) {
            console.error('Clear data failed:', error);
            this.ui.showNotification('Failed to clear data', 'error');
        }
    }

    // Generate sample data for testing
    async generateSampleData() {
        try {
            this.ui.showNotification('Generating sample data...', 'info');
            
            // Create additional sample users
            const sampleUsers = [
                { name: 'Emma Watson', email: 'emma.watson@student.lumina.edu', role: 'student' },
                { name: 'John Smith', email: 'john.smith@student.lumina.edu', role: 'student' },
                { name: 'Sarah Johnson', email: 'sarah.johnson@student.lumina.edu', role: 'student' },
                { name: 'Dr. Michael Brown', email: 'michael.brown@lumina.edu', role: 'teacher' },
                { name: 'Lisa Chen', email: 'lisa.chen@student.lumina.edu', role: 'student' }
            ];

            for (const userData of sampleUsers) {
                try {
                    await this.api.createUser(userData);
                } catch (error) {
                    // User might already exist, skip
                    console.log(`User ${userData.email} already exists`);
                }
            }

            // Create additional sample courses
            const sampleCourses = [
                {
                    name: 'Advanced Mathematics',
                    description: 'Calculus and Linear Algebra',
                    teacherId: 'teacher_001',
                    members: ['teacher_001', 'student_001', 'student_002', 'student_003']
                },
                {
                    name: 'Computer Science Fundamentals',
                    description: 'Introduction to Programming',
                    teacherId: 'admin_001',
                    members: ['admin_001', 'student_001', 'student_002']
                }
            ];

            for (const courseData of sampleCourses) {
                try {
                    await this.api.createCourse(courseData);
                } catch (error) {
                    console.log(`Course ${courseData.name} creation failed:`, error);
                }
            }

            // Generate sample progress data
            const users = await this.api.getAllUsers();
            const courses = await this.api.getAllCourses();
            const students = users.filter(u => u.role === 'student');

            for (const student of students) {
                for (const course of courses) {
                    if (course.members.includes(student.id)) {
                        await this.api.updateStudentProgress(student.id, course.id, {
                            mastery: Math.floor(Math.random() * 40) + 60, // 60-100%
                            progress: Math.floor(Math.random() * 30) + 70, // 70-100%
                            streak: Math.floor(Math.random() * 20),
                            struggling: Math.random() < 0.2 // 20% chance of struggling
                        });
                    }
                }
            }

            this.ui.showNotification('Sample data generated successfully', 'success');
            
        } catch (error) {
            console.error('Sample data generation failed:', error);
            this.ui.showNotification('Failed to generate sample data', 'error');
        }
    }

    // Database statistics
    async getDatabaseStats() {
        try {
            const stats = {
                users: (await this.api.getAllUsers()).length,
                courses: (await this.api.getAllCourses()).length,
                messages: (await window.luminaDB.getAll('messages')).length,
                progress: (await window.luminaDB.getAll('progress')).length,
                assessments: (await window.luminaDB.getAll('assessments')).length,
                notes: (await window.luminaDB.getAll('notes')).length
            };

            return stats;
        } catch (error) {
            console.error('Failed to get database stats:', error);
            return null;
        }
    }

    // Create data management modal
    createDataManagementModal() {
        const modal = document.createElement('div');
        modal.id = 'data-management-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 hidden';
        
        modal.innerHTML = `
            <div class="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 w-full max-w-lg transform transition-all scale-95 opacity-0">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold">Data Management</h3>
                    <button id="close-data-modal" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-2xl leading-none">&times;</button>
                </div>
                
                <div class="space-y-4">
                    <div class="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <h4 class="font-semibold text-blue-800 dark:text-blue-300 mb-2">Export & Backup</h4>
                        <div class="space-y-2">
                            <button id="export-data-btn" class="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600">
                                Export All Data
                            </button>
                            <button id="auto-backup-btn" class="w-full px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30">
                                Enable Auto Backup
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-4 bg-green-50 dark:bg-green-500/10 rounded-lg">
                        <h4 class="font-semibold text-green-800 dark:text-green-300 mb-2">Import Data</h4>
                        <input type="file" id="import-file-input" accept=".json" class="hidden">
                        <button id="import-data-btn" class="w-full px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600">
                            Import from File
                        </button>
                    </div>
                    
                    <div class="p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
                        <h4 class="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Development Tools</h4>
                        <button id="generate-sample-btn" class="w-full px-4 py-2 text-sm font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-500/30">
                            Generate Sample Data
                        </button>
                    </div>
                    
                    <div class="p-4 bg-red-50 dark:bg-red-500/10 rounded-lg">
                        <h4 class="font-semibold text-red-800 dark:text-red-300 mb-2">Danger Zone</h4>
                        <button id="clear-data-btn" class="w-full px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600">
                            Clear All Data
                        </button>
                        <p class="text-xs text-red-600 dark:text-red-400 mt-1">This action cannot be undone!</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupDataModalEventListeners(modal);
        
        return modal;
    }

    setupDataModalEventListeners(modal) {
        const closeBtn = modal.querySelector('#close-data-modal');
        const exportBtn = modal.querySelector('#export-data-btn');
        const importBtn = modal.querySelector('#import-data-btn');
        const fileInput = modal.querySelector('#import-file-input');
        const autoBackupBtn = modal.querySelector('#auto-backup-btn');
        const generateBtn = modal.querySelector('#generate-sample-btn');
        const clearBtn = modal.querySelector('#clear-data-btn');

        closeBtn.addEventListener('click', () => this.closeDataModal(modal));
        exportBtn.addEventListener('click', () => this.exportAllData());
        autoBackupBtn.addEventListener('click', () => this.setupAutoBackup());
        generateBtn.addEventListener('click', () => this.generateSampleData());
        clearBtn.addEventListener('click', () => this.clearAllData());
        
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importData(e.target.files[0]);
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDataModal(modal);
            }
        });
    }

    openDataModal() {
        let modal = document.getElementById('data-management-modal');
        if (!modal) {
            modal = this.createDataManagementModal();
        }
        
        this.ui.openModal(modal, modal.querySelector('div'));
    }

    closeDataModal(modal) {
        this.ui.closeModal(modal, modal.querySelector('div'));
    }
}

// Global instance
window.dataManager = new DataManager();

// Make class available globally
window.DataManager = DataManager;