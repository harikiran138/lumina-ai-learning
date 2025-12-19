/**
 * Lumina Database Layer - IndexedDB Implementation
 * Provides a local database for storing users, courses, assessments, and other data
 */

class LuminaDB {
    constructor() {
        this.dbName = 'LuminaDB';
        this.version = 3;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('role', 'role', { unique: false });
                    userStore.createIndex('email', 'email', { unique: true });
                    userStore.createIndex('status', 'status', { unique: false });
                }

                // Courses store
                if (!db.objectStoreNames.contains('courses')) {
                    const courseStore = db.createObjectStore('courses', { keyPath: 'id' });
                    courseStore.createIndex('teacherId', 'teacherId', { unique: false });
                    courseStore.createIndex('status', 'status', { unique: false });
                }

                // Messages store (for community chats)
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                    messageStore.createIndex('courseId', 'courseId', { unique: false });
                    messageStore.createIndex('roomId', 'roomId', { unique: false });
                    messageStore.createIndex('senderId', 'senderId', { unique: false });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Assessments store
                if (!db.objectStoreNames.contains('assessments')) {
                    const assessmentStore = db.createObjectStore('assessments', { keyPath: 'id' });
                    assessmentStore.createIndex('courseId', 'courseId', { unique: false });
                    assessmentStore.createIndex('type', 'type', { unique: false });
                }

                // Student Progress store
                if (!db.objectStoreNames.contains('progress')) {
                    const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
                    progressStore.createIndex('studentId', 'studentId', { unique: false });
                    progressStore.createIndex('courseId', 'courseId', { unique: false });
                }

                // System Health store
                if (!db.objectStoreNames.contains('systemHealth')) {
                    const healthStore = db.createObjectStore('systemHealth', { keyPath: 'id' });
                }

                // Notes store
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
                    notesStore.createIndex('studentId', 'studentId', { unique: false });
                    notesStore.createIndex('courseId', 'courseId', { unique: false });
                }

                // Sessions store (for current user session)
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
                }

                // Chat Rooms store (for community groups/channels)
                if (!db.objectStoreNames.contains('chatRooms')) {
                    const chatStore = db.createObjectStore('chatRooms', { keyPath: 'id' });
                    chatStore.createIndex('type', 'type', { unique: false }); // 'general', 'course', 'study-group'
                    chatStore.createIndex('members', 'members', { unique: false, multiEntry: true });
                    chatStore.createIndex('createdBy', 'createdBy', { unique: false });
                }
            };
        });
    }

    // Generic CRUD operations
    async add(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return store.add(data);
    }

    async put(storeName, data) {
        if (!this.db) {
            console.warn('Database not initialized, initializing now...');
            await this.init();
        }
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return store.put(data);
    }

    async get(storeName, key) {
        if (!this.db) {
            console.warn('Database not initialized, initializing now...');
            await this.init();
        }
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        if (!this.db) {
            console.warn('Database not initialized, initializing now...');
            await this.init();
        }
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        if (!this.db) {
            console.warn('Database not initialized, initializing now...');
            await this.init();
        }
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return store.delete(key);
    }

    async clear(storeName) {
        if (!this.db) {
            console.warn('Database not initialized, initializing now...');
            await this.init();
        }
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return store.clear();
    }

    async getByIndex(storeName, indexName, value) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // User management methods
    async createUser(userData) {
        const user = {
            id: userData.id || this.generateId(),
            name: userData.name,
            email: userData.email,
            role: userData.role,
            status: userData.status || 'active',
            avatar: userData.avatar || userData.name.charAt(0).toUpperCase(),
            color: userData.color || this.getRandomColor(),
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        return this.add('users', user);
    }

    async getUsersByRole(role) {
        return this.getByIndex('users', 'role', role);
    }

    async updateUser(userId, updates) {
        const user = await this.get('users', userId);
        if (user) {
            const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
            return this.put('users', updatedUser);
        }
        throw new Error('User not found');
    }

    // Course management methods
    async createCourse(courseData) {
        const course = {
            id: courseData.id || this.generateId(),
            name: courseData.name,
            description: courseData.description,
            teacherId: courseData.teacherId,
            status: courseData.status || 'active',
            members: courseData.members || [],
            contentStatus: courseData.contentStatus || { vectorDB: '0%', pathways: '0%' },
            createdAt: new Date().toISOString(),
            settings: courseData.settings || {}
        };
        return this.add('courses', course);
    }

    async getCoursesByTeacher(teacherId) {
        return this.getByIndex('courses', 'teacherId', teacherId);
    }

    async addCourseMessage(courseId, senderId, text) {
        const message = {
            courseId: courseId,
            senderId: senderId,
            text: text,
            timestamp: new Date().toISOString(),
            type: 'text'
        };
        return this.add('messages', message);
    }

    async getCourseMessages(courseId) {
        return this.getByIndex('messages', 'courseId', courseId);
    }

    // Chat Room methods for community messaging
    async createChatRoom(roomData) {
        const room = {
            id: roomData.id || `room_${Date.now()}`,
            name: roomData.name,
            description: roomData.description || '',
            type: roomData.type || 'general', // 'general', 'course', 'study-group'
            members: roomData.members || [],
            createdBy: roomData.createdBy,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            avatar: roomData.avatar || '💬',
            color: roomData.color || 'bg-blue-500'
        };
        return this.put('chatRooms', room);
    }

    async getAllChatRooms() {
        return this.getAll('chatRooms');
    }

    async getChatRoom(roomId) {
        return this.get('chatRooms', roomId);
    }

    async addChatMessage(roomId, senderId, text) {
        const message = {
            roomId: roomId,
            senderId: senderId,
            text: text,
            timestamp: new Date().toISOString(),
            type: 'text'
        };

        // Update room's last activity
        const room = await this.getChatRoom(roomId);
        if (room) {
            room.lastActivity = new Date().toISOString();
            await this.put('chatRooms', room);
        }

        return this.add('messages', message);
    }

    async getChatMessages(roomId) {
        return this.getByIndex('messages', 'roomId', roomId);
    }

    async joinChatRoom(roomId, userId) {
        const room = await this.getChatRoom(roomId);
        if (room && !room.members.includes(userId)) {
            room.members.push(userId);
            await this.put('chatRooms', room);
        }
        return room;
    }

    // Progress tracking methods
    async updateProgress(studentId, courseId, progressData) {
        const progressId = `${studentId}_${courseId}`;
        const progress = {
            id: progressId,
            studentId: studentId,
            courseId: courseId,
            mastery: progressData.mastery || 0,
            progress: progressData.progress || 0,
            streak: progressData.streak || 0,
            completedLessons: progressData.completedLessons || [],
            assessmentScores: progressData.assessmentScores || [],
            lastActivity: new Date().toISOString(),
            struggling: progressData.struggling || false
        };
        return this.put('progress', progress);
    }

    async getStudentProgress(studentId, courseId = null) {
        if (courseId) {
            return this.get('progress', `${studentId}_${courseId}`);
        }
        return this.getByIndex('progress', 'studentId', studentId);
    }

    // Assessment methods
    async createAssessment(assessmentData) {
        const assessment = {
            id: assessmentData.id || this.generateId(),
            courseId: assessmentData.courseId,
            title: assessmentData.title,
            type: assessmentData.type || 'quiz',
            questions: assessmentData.questions || [],
            timeLimit: assessmentData.timeLimit,
            maxAttempts: assessmentData.maxAttempts || 1,
            createdAt: new Date().toISOString(),
            status: assessmentData.status || 'active'
        };
        return this.add('assessments', assessment);
    }

    async getCourseAssessments(courseId) {
        return this.getByIndex('assessments', 'courseId', courseId);
    }

    // Notes methods
    async createNote(noteData) {
        const note = {
            studentId: noteData.studentId,
            courseId: noteData.courseId,
            title: noteData.title,
            content: noteData.content,
            tags: noteData.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return this.add('notes', note);
    }

    async getStudentNotes(studentId) {
        return this.getByIndex('notes', 'studentId', studentId);
    }

    // System health methods
    async updateSystemHealth(healthData) {
        const health = {
            id: 'current',
            storage: healthData.storage,
            storagePercent: healthData.storagePercent,
            dbConnections: healthData.dbConnections,
            totalUsers: healthData.totalUsers,
            newUsers: healthData.newUsers,
            llm: healthData.llm,
            vectorDb: healthData.vectorDb,
            workers: healthData.workers,
            lastUpdated: new Date().toISOString()
        };
        return this.put('systemHealth', health);
    }

    async getSystemHealth() {
        return this.get('systemHealth', 'current');
    }

    // Session management
    async setCurrentUser(user) {
        const session = {
            id: 'current',
            user: user,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        return this.put('sessions', session);
    }

    async getCurrentUser() {
        const session = await this.get('sessions', 'current');
        return session ? session.user : null;
    }

    async logout() {
        return this.delete('sessions', 'current');
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getRandomColor() {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
            'bg-orange-500', 'bg-cyan-500'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Data seeding methods for initial setup
    async seedInitialData(force = false) {
        // Check if data already exists
        const users = await this.getAll('users');

        // Check specifically for demo users and add them if missing
        const demoUsers = [
            { id: 'admin_demo', email: 'admin@lumina.com' },
            { id: 'teacher_demo', email: 'teacher@lumina.com' },
            { id: 'student_demo', email: 'student@lumina.com' }
        ];

        let needsSeeding = false;
        for (const demo of demoUsers) {
            const exists = users.find(u => u.email === demo.email);
            if (!exists) {
                needsSeeding = true;
                break;
            }
        }

        // If forcing or if critical demo users are missing
        if (force || needsSeeding) {
            console.log('Seeding missing demo users...');
            // Only add demo users if they don't exist
            const existingDemoAdmin = users.find(u => u.email === 'admin@lumina.com');
            const existingDemoTeacher = users.find(u => u.email === 'teacher@lumina.com');
            const existingDemoStudent = users.find(u => u.email === 'student@lumina.com');

            if (!existingDemoAdmin) {
                await this.put('users', {
                    id: 'admin_demo',
                    name: 'Admin User',
                    email: 'admin@lumina.com',
                    password: 'admin123',
                    role: 'admin',
                    status: 'active',
                    avatar: 'AU',
                    color: 'bg-red-600',
                    createdAt: new Date().toISOString()
                });
            }

            if (!existingDemoTeacher) {
                await this.put('users', {
                    id: 'teacher_demo',
                    name: 'Teacher User',
                    email: 'teacher@lumina.com',
                    password: 'teacher123',
                    role: 'teacher',
                    status: 'active',
                    avatar: 'TU',
                    color: 'bg-green-600',
                    createdAt: new Date().toISOString()
                });
            }

            if (!existingDemoStudent) {
                await this.put('users', {
                    id: 'student_demo',
                    name: 'Student User',
                    email: 'student@lumina.com',
                    password: 'student123',
                    role: 'student',
                    status: 'active',
                    avatar: 'SU',
                    color: 'bg-blue-600',
                    createdAt: new Date().toISOString()
                });
            }

            if (!force && users.length > 0) return;
        }

        if (users.length > 0 && !needsSeeding && !force) return;

        // Create default users
        const defaultUsers = [
            // Demo accounts for testing
            {
                id: 'admin_demo',
                name: 'Admin User',
                email: 'admin@lumina.com',
                password: 'admin123', // In real app, this would be hashed
                role: 'admin',
                status: 'active',
                avatar: 'AU',
                color: 'bg-red-600',
                createdAt: new Date().toISOString()
            },
            {
                id: 'teacher_demo',
                name: 'Teacher User',
                email: 'teacher@lumina.com',
                password: 'teacher123',
                role: 'teacher',
                status: 'active',
                avatar: 'TU',
                color: 'bg-green-600',
                createdAt: new Date().toISOString()
            },
            {
                id: 'student_demo',
                name: 'Student User',
                email: 'student@lumina.com',
                password: 'student123',
                role: 'student',
                status: 'active',
                avatar: 'SU',
                color: 'bg-blue-600',
                createdAt: new Date().toISOString()
            },
            // Original users
            {
                id: 'admin_001',
                name: 'Prof. Evelyn Reed',
                email: 'evelyn.reed@lumina.edu',
                role: 'admin',
                status: 'active',
                avatar: 'A',
                color: 'bg-red-600'
            },
            {
                id: 'teacher_001',
                name: 'Jane Doe',
                email: 'jane.doe@lumina.edu',
                role: 'teacher',
                status: 'active',
                avatar: 'J',
                color: 'bg-green-600'
            },
            {
                id: 'student_001',
                name: 'Alex Turner',
                email: 'alex.turner@student.lumina.edu',
                role: 'student',
                status: 'active',
                avatar: 'A',
                color: 'bg-amber-500'
            },
            {
                id: 'student_002',
                name: 'Sophia Chen',
                email: 'sophia.chen@student.lumina.edu',
                role: 'student',
                status: 'active',
                avatar: 'S',
                color: 'bg-teal-500'
            },
            {
                id: 'student_003',
                name: 'Liam Harris',
                email: 'liam.harris@student.lumina.edu',
                role: 'student',
                status: 'suspended',
                avatar: 'L',
                color: 'bg-purple-500'
            }
        ];

        for (const user of defaultUsers) {
            await this.createUser(user);
        }

        // Create default courses
        const defaultCourses = [
            {
                id: 'qm_001',
                name: 'Quantum Mechanics',
                description: 'Discussion on Chapter 1: Core Principles',
                teacherId: 'admin_001',
                members: ['admin_001', 'student_001', 'student_002', 'student_003'],
                contentStatus: { vectorDB: '100%', pathways: '95%' }
            },
            {
                id: 'thermo_001',
                name: 'Thermodynamics',
                description: 'Midterm study group',
                teacherId: 'teacher_001',
                members: ['teacher_001', 'student_001', 'student_002'],
                contentStatus: { vectorDB: '80%', pathways: '75%' }
            }
        ];

        for (const course of defaultCourses) {
            await this.createCourse(course);
        }

        // Create initial system health data
        await this.updateSystemHealth({
            storage: '1.2 GB',
            storagePercent: 80,
            dbConnections: 45,
            totalUsers: defaultUsers.length,
            newUsers: 1,
            llm: { status: 'Operational', latency: '400ms', model: 'LLaMA-3-8B' },
            vectorDb: { status: 'Healthy', latency: '12ms', size: '1.5M vectors' },
            workers: { status: 'Processing', queue: 5, pendingEmbeddings: 2 }
        });

        // Create sample progress data
        await this.updateProgress('student_001', 'qm_001', {
            mastery: 85,
            progress: 90,
            streak: 5,
            struggling: false
        });

        await this.updateProgress('student_002', 'qm_001', {
            mastery: 92,
            progress: 95,
            streak: 12,
            struggling: false
        });

        // Create default chat rooms
        const defaultChatRooms = [
            {
                id: 'general',
                name: 'General Discussion',
                description: 'Welcome to Lumina! Chat with students and teachers from all subjects.',
                type: 'general',
                members: ['admin_001', 'teacher_001', 'student_001', 'student_002', 'student_003'],
                createdBy: 'admin_001',
                avatar: '💬',
                color: 'bg-blue-500'
            },
            {
                id: 'study_buddies',
                name: 'Study Buddies',
                description: 'Find study partners and form study groups!',
                type: 'study-group',
                members: ['student_001', 'student_002', 'student_003'],
                createdBy: 'student_001',
                avatar: '📚',
                color: 'bg-green-500'
            },
            {
                id: 'physics_help',
                name: 'Physics Help Desk',
                description: 'Get help with physics concepts and homework.',
                type: 'course',
                members: ['admin_001', 'teacher_001', 'student_001', 'student_002'],
                createdBy: 'teacher_001',
                avatar: '⚛️',
                color: 'bg-purple-500'
            },
            {
                id: 'announcements',
                name: 'Announcements',
                description: 'Important updates and announcements from teachers and admins.',
                type: 'general',
                members: ['admin_001', 'teacher_001', 'student_001', 'student_002', 'student_003'],
                createdBy: 'admin_001',
                avatar: '📢',
                color: 'bg-amber-500'
            }
        ];

        for (const room of defaultChatRooms) {
            await this.createChatRoom(room);
        }

        // Add some sample messages to make it feel alive
        const sampleMessages = [
            { roomId: 'general', senderId: 'admin_001', text: 'Welcome to Lumina Community! 🎉 Feel free to introduce yourselves and connect with fellow learners.' },
            { roomId: 'general', senderId: 'student_001', text: 'Hi everyone! Excited to be here. Looking forward to learning together! 📚' },
            { roomId: 'study_buddies', senderId: 'student_002', text: 'Anyone want to form a study group for the upcoming physics exam?' },
            { roomId: 'physics_help', senderId: 'teacher_001', text: 'Physics help desk is now open! Drop your questions here and I\'ll help you out. 🔬' },
            { roomId: 'announcements', senderId: 'admin_001', text: '📢 New AI Tutor feature is now available! Check it out in the navigation menu.' }
        ];

        for (const msg of sampleMessages) {
            await this.addChatMessage(msg.roomId, msg.senderId, msg.text);
        }

        console.log('Initial data seeded successfully');
    }
}

// Global database instance
// Make class available globally
window.LuminaDatabase = LuminaDB;
window.LuminaDB = LuminaDB;

// Create global instance
window.luminaDB = new LuminaDB();

// Initialize database when DOM is loaded
// Initialize database helper
window.initLuminaDB = async () => {
    try {
        if (!window.luminaDB) {
            window.luminaDB = new LuminaDB();
        }
        await window.luminaDB.init();
        await window.luminaDB.seedInitialData();
        console.log('Lumina Database initialized and seeded successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return false;
    }
};

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    window.initLuminaDB();
}