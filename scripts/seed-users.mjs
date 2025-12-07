import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const uri = process.env.MONGODB_URI || process.env.lumina_MONGODB_URI;

if (!uri) {
    console.error("❌ MONGODB_URI is missing from .env.local");
    process.exit(1);
}

const client = new MongoClient(uri);

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await client.connect();
        const db = client.db("lumina-database");
        const usersCollection = db.collection("users");

        console.log("Connected! Preparing users...");

        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash("admin123", salt);
        const teacherPassword = await bcrypt.hash("teacher123", salt);
        const studentPassword = await bcrypt.hash("student123", salt);

        const users = [
            {
                email: "admin@lumina.com",
                password: adminPassword,
                name: "Admin User",
                role: "admin",
                status: "active",
                avatar: "https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff",
                createdAt: new Date().toISOString(),
                bio: "System Administrator",
                skills: ["Management", "System Architecture"],
                location: "Headquarters"
            },
            {
                email: "teacher@lumina.com",
                password: teacherPassword,
                name: "Sarah Teacher",
                role: "teacher",
                status: "active",
                avatar: "https://ui-avatars.com/api/?name=Sarah+Teacher&background=random",
                createdAt: new Date().toISOString(),
                bio: "Passionate educator with 10 years experience.",
                skills: ["Mathematics", "Physics", "Teaching"],
                location: "New York, USA"
            },
            {
                email: "student@lumina.com",
                password: studentPassword,
                name: "Alex Student",
                role: "student",
                status: "active",
                avatar: "https://ui-avatars.com/api/?name=Alex+Student&background=random",
                createdAt: new Date().toISOString(),
                bio: "Eager to learn AI and Machine Learning.",
                skills: ["Python", "JavaScript"],
                location: "London, UK"
            }
        ];

        for (const user of users) {
            // Upsert based on email
            const result = await usersCollection.updateOne(
                { email: user.email },
                { $set: user },
                { upsert: true }
            );
            console.log(`✅ Processed user: ${user.email} (${result.upsertedCount > 0 ? 'Created' : 'Updated'})`);
        }

        console.log("\n🎉 Seeding complete! You can now log in with:");
        console.log("   Admin:   admin@lumina.com   / admin123");
        console.log("   Teacher: teacher@lumina.com / teacher123");
        console.log("   Student: student@lumina.com / student123");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await client.close();
    }
}

seed();
