
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local manually
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (result.error) {
    console.error("Error loading .env.local:", result.error);
} else {
    console.log("Dotenv parsed:", Object.keys(result.parsed || {}));
}

console.log("lumina_MONGODB_URI exists:", !!process.env.lumina_MONGODB_URI);

async function test() {
    try {
        // Dynamic import to ensure env vars are loaded first
        const { default: clientPromise } = await import('../src/lib/mongodb');

        console.log("Connecting...");
        const client = await clientPromise;
        const db = client.db("lumina-database");
        console.log("Connected to DB:", db.databaseName);
        const count = await db.collection("users").countDocuments();
        console.log("Users count:", count);
        process.exit(0);
    } catch (e: any) {
        console.error("Connection failed:", e);
        if (e.message) console.error("Message:", e.message);
        process.exit(1);
    }
}

test();
