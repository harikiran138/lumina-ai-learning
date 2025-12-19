
import { MongoClient } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const uri = process.env.MONGODB_URI || process.env.lumina_MONGODB_URI || "";
const options = {};

if (!uri && process.env.NODE_ENV === "production") {
    // Log but don't crash top-level - this allows the build/import to succeed
    console.error('CRITICAL: MONGODB_URI is not defined in Environment Variables.');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        if (uri) {
            client = new MongoClient(uri, options);
            // Attach connection pool management for Vercel Functions
            attachDatabasePool(client);
            globalWithMongo._mongoClientPromise = client.connect();
        } else {
            console.warn("MongoDB URI not found. Database features will be disabled.");
            globalWithMongo._mongoClientPromise = Promise.reject(new Error("MongoDB URI is not defined"));
        }
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    if (uri) {
        client = new MongoClient(uri, options);
        // Attach connection pool management for Vercel Functions
        attachDatabasePool(client);
        clientPromise = client.connect();
    } else {
        console.warn("MongoDB URI not found. Database features will be disabled.");
        clientPromise = Promise.reject(new Error("MongoDB URI is not defined"));
    }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
