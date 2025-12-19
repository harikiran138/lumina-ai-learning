import { v4 as uuidv4 } from 'uuid';

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'teacher' | 'student';
    status: 'active' | 'suspended' | 'inactive';
    avatar?: string;
    color?: string;
    createdAt: string;
    lastActive?: string;
    updatedAt?: string;
}

export interface Course {
    id: string;
    name: string;
    description: string;
    teacherId: string;
    status: 'active' | 'archived';
    members: string[];
    contentStatus: {
        vectorDB: string;
        pathways: string;
    };
    createdAt: string;
    settings?: any;
    updatedAt?: string;
}

export interface Message {
    id?: number;
    courseId?: string;
    roomId?: string;
    senderId: string;
    text: string;
    timestamp: string;
    type: 'text' | 'image' | 'file';
}

export interface ChatRoom {
    id: string;
    name: string;
    description: string;
    type: 'general' | 'course' | 'study-group';
    members: string[];
    createdBy: string;
    createdAt: string;
    lastActivity: string;
    avatar: string;
    color: string;
}

export interface StudentProgress {
    id: string;
    studentId: string;
    courseId: string;
    mastery: number;
    progress: number;
    streak: number;
    completedLessons: string[];
    assessmentScores: any[];
    lastActivity: string;
    struggling: boolean;
}

export interface SystemHealth {
    id: string;
    storage: string;
    storagePercent: number;
    dbConnections: number;
    totalUsers: number;
    newUsers: number;
    llm: any;
    vectorDb: any;
    workers: any;
    lastUpdated: string;
}

export interface AILog {
    id?: number;
    userId: string;
    userName: string;
    userRole: string;
    prompt: string;
    response: string;
    timestamp: string;
    tokensUsed?: number;
}

class LuminaDB {
    private dbName = 'LuminaDB';
    private version = 4; // Bump version for new store
    private db: IDBDatabase | null = null;
    private static instance: LuminaDB;

    public static getInstance(): LuminaDB {
        if (!LuminaDB.instance) {
            LuminaDB.instance = new LuminaDB();
        }
        return LuminaDB.instance;
    }

    async init(): Promise<void> {
        if (typeof window === 'undefined') return; // Server-side safety
        if (this.db) return;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                this.createStores(db);
            };
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };
            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    private createStores(db: IDBDatabase) {
        // ... (existing stores)

        // Chat Rooms store
        if (!db.objectStoreNames.contains('chatRooms')) {
            const chatStore = db.createObjectStore('chatRooms', { keyPath: 'id' });
            chatStore.createIndex('type', 'type', { unique: false });
            chatStore.createIndex('members', 'members', { unique: false, multiEntry: true });
            chatStore.createIndex('createdBy', 'createdBy', { unique: false });
        }

        // NEW: AI Logs store (Added in v4)
        if (!db.objectStoreNames.contains('aiLogs')) {
            const aiLogStore = db.createObjectStore('aiLogs', { keyPath: 'id', autoIncrement: true });
            aiLogStore.createIndex('userId', 'userId', { unique: false });
            aiLogStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
    }

    // Generic CRUD operations
    async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get<T>(storeName: string, key: string | number): Promise<T | undefined> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName: string, key: string | number): Promise<void> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Specific methods
    async createUser(userData: Partial<User>): Promise<IDBValidKey> {
        const user: User = {
            id: userData.id || this.generateId(),
            name: userData.name!,
            email: userData.email!,
            role: userData.role!,
            status: userData.status || 'active',
            avatar: userData.avatar || userData.name!.charAt(0).toUpperCase(),
            color: userData.color || this.getRandomColor(),
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            ...userData
        };
        return this.add('users', user);
    }

    async setCurrentUser(user: User): Promise<IDBValidKey> {
        const session = {
            id: 'current',
            user: user,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        return this.put('sessions', session);
    }

    async getCurrentUser(): Promise<User | null> {
        const session = await this.get<{ user: User }>('sessions', 'current');
        return session ? session.user : null;
    }

    async logout(): Promise<void> {
        return this.delete('sessions', 'current');
    }

    // Helper methods
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private getRandomColor(): string {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
            'bg-orange-500', 'bg-cyan-500'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Seeding (Simplified for brevity, can expand later)
    async seedInitialData(force = false) {
        if (typeof window === 'undefined') return;

        const users = await this.getAll<User>('users');
        if (users.length > 0 && !force) return;

        // ... (Add seeding logic here if needed, similar to original file)
        console.log('Seeding initial data...');
        // Add default users
        const defaultUsers: User[] = [
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
            }
        ];

        for (const user of defaultUsers) {
            try {
                await this.createUser(user);
            } catch (e) {
                // Ignore if exists
            }
        }
    }
}

export const db = LuminaDB.getInstance();
