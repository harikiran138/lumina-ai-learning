import { openDB, DBSchema } from 'idb';

interface AITutorDB extends DBSchema {
    'user-profile': {
        key: string;
        value: {
            id: string; // 'current-user'
            grade: string;
            weakTopics: string[];
        };
    };
    'chat-history': {
        key: string;
        value: {
            id: string;
            role: 'user' | 'model';
            text: string;
            timestamp: number;
        };
        indexes: { 'timestamp': number };
    };
    'response-cache': {
        key: string; // Normalized question text
        value: {
            question: string;
            answer: string;
            timestamp: number;
        };
    };
}

const DB_NAME = 'ai-tutor-db';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB<AITutorDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('user-profile')) {
                db.createObjectStore('user-profile', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('chat-history')) {
                const store = db.createObjectStore('chat-history', { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp');
            }
            if (!db.objectStoreNames.contains('response-cache')) {
                db.createObjectStore('response-cache', { keyPath: 'question' });
            }
        },
    });
};

export const getCachedResponse = async (question: string) => {
    const db = await initDB();
    const normalizedKey = question.trim().toLowerCase();
    return db.get('response-cache', normalizedKey);
};

export const cacheResponse = async (question: string, answer: string) => {
    const db = await initDB();
    const normalizedKey = question.trim().toLowerCase();
    await db.put('response-cache', {
        question: normalizedKey,
        answer,
        timestamp: Date.now()
    });
};

export const saveMessage = async (role: 'user' | 'model', text: string) => {
    const db = await initDB();
    const id = crypto.randomUUID();
    await db.put('chat-history', {
        id,
        role,
        text,
        timestamp: Date.now(),
    });
    return id;
};

export const getHistory = async () => {
    const db = await initDB();
    const tx = db.transaction('chat-history', 'readonly');
    const index = tx.store.index('timestamp');
    const allMessages = await index.getAll();
    return allMessages; // sorted by timestamp by default
};

export const clearHistory = async () => {
    const db = await initDB();
    await db.clear('chat-history');
};
