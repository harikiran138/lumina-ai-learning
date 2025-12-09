
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local
try {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.log("Could not load .env.local");
}

const uri = process.env.MONGODB_URI || process.env.lumina_MONGODB_URI;

if (!uri) {
    console.error("❌ MONGODB_URI is missing from .env.local");
    process.exit(1);
}

const client = new MongoClient(uri);

async function deleteUser() {
    try {
        console.log("Connecting to MongoDB...");
        await client.connect();
        const db = client.db("lumina-database");

        const targetEmail = "sricharishma20@gmail.com";
        console.log(`Searching for user: ${targetEmail}`);

        const user = await db.collection("users").findOne({ email: targetEmail });

        if (!user) {
            console.log("❌ User not found.");
            return;
        }

        const userId = user._id; // ObjectId

        console.log(`Found user: ${user.name} (${userId})`);

        // Delete User
        await db.collection("users").deleteOne({ _id: userId });
        console.log("✅ User record deleted.");

        // Cleanup related data (using string ID for simplicity in others if stored as string, but best to clean up)
        const userIdStr = userId.toString();

        const r1 = await db.collection("progress").deleteMany({ userId: userIdStr });
        console.log(`Deleted ${r1.deletedCount} progress records.`);

        const r2 = await db.collection("notes").deleteMany({ userId: userIdStr });
        console.log(`Deleted ${r2.deletedCount} notes.`);

        const r3 = await db.collection("chat_history").deleteMany({ userId: userIdStr });
        console.log(`Deleted ${r3.deletedCount} chat logs.`);

        const r4 = await db.collection("ai_logs").deleteMany({ userId: userIdStr });
        console.log(`Deleted ${r4.deletedCount} AI logs.`);

        console.log("🎉 Deletion complete.");

    } catch (error) {
        console.error("❌ Deletion failed:", error);
    } finally {
        await client.close();
    }
}

deleteUser();
