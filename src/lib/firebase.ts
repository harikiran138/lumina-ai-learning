import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    QueryConstraint,
    DocumentData,
    CollectionReference,
    addDoc,
    Timestamp,
    increment,
    arrayUnion,
    arrayRemove,
    WhereFilterOp
} from 'firebase/firestore';
import { db } from './firebase-config';

// Collection names
export const COLLECTIONS = {
    USERS: 'users',
    COURSES: 'courses',
    PROGRESS: 'progress',
    COMMUNITY_CHANNELS: 'community_channels',
    COMMUNITY_MESSAGES: 'community_messages'
} as const;

// Type-safe collection references
export const collections = {
    users: () => collection(db, COLLECTIONS.USERS),
    courses: () => collection(db, COLLECTIONS.COURSES),
    progress: () => collection(db, COLLECTIONS.PROGRESS),
    communityChannels: () => collection(db, COLLECTIONS.COMMUNITY_CHANNELS),
    communityMessages: () => collection(db, COLLECTIONS.COMMUNITY_MESSAGES)
};

// Helper function to get a document by ID
export async function getDocumentById<T = DocumentData>(
    collectionName: string,
    docId: string
): Promise<T | null> {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as T;
        }
        return null;
    } catch (error) {
        console.error(`Error getting document from ${collectionName}:`, error);
        return null;
    }
}

// Helper function to get documents with query
export async function getDocuments<T = DocumentData>(
    collectionName: string,
    queryConstraints: QueryConstraint[] = []
): Promise<T[]> {
    try {
        const collectionRef = collection(db, collectionName);
        const q = queryConstraints.length > 0
            ? query(collectionRef, ...queryConstraints)
            : query(collectionRef);

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as T[];
    } catch (error) {
        console.error(`Error getting documents from ${collectionName}:`, error);
        return [];
    }
}

// Helper function to create a document
export async function createDocument(
    collectionName: string,
    data: any,
    customId?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        if (customId) {
            const docRef = doc(db, collectionName, customId);
            await setDoc(docRef, data);
            return { success: true, id: customId };
        } else {
            const collectionRef = collection(db, collectionName);
            const docRef = await addDoc(collectionRef, data);
            return { success: true, id: docRef.id };
        }
    } catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        return { success: false, error: String(error) };
    }
}

// Helper function to update a document
export async function updateDocument(
    collectionName: string,
    docId: string,
    data: Partial<DocumentData>
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, data);
        return { success: true };
    } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        return { success: false, error: String(error) };
    }
}

// Helper function to delete a document
export async function deleteDocument(
    collectionName: string,
    docId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        return { success: false, error: String(error) };
    }
}

// Helper function to find a single document by field
export async function findDocumentByField<T = DocumentData>(
    collectionName: string,
    fieldName: string,
    value: any,
    operator: WhereFilterOp = '=='
): Promise<T | null> {
    try {
        const docs = await getDocuments<T>(
            collectionName,
            [where(fieldName, operator, value), limit(1)]
        );
        return docs.length > 0 ? docs[0] : null;
    } catch (error) {
        console.error(`Error finding document in ${collectionName}:`, error);
        return null;
    }
}

// Helper function to count documents
export async function countDocuments(
    collectionName: string,
    queryConstraints: QueryConstraint[] = []
): Promise<number> {
    try {
        const docs = await getDocuments(collectionName, queryConstraints);
        return docs.length;
    } catch (error) {
        console.error(`Error counting documents in ${collectionName}:`, error);
        return 0;
    }
}

// Export Firestore utilities
export {
    db,
    collection,
    doc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    increment,
    arrayUnion,
    arrayRemove,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    addDoc
};
