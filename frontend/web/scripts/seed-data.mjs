import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("❌ MONGODB_URI is missing");
    process.exit(1);
}

const client = new MongoClient(uri);

async function seedData() {
    try {
        console.log("Connecting to MongoDB...");
        await client.connect();
        const db = client.db("lumina-database");

        // 1. Create Courses
        const courses = [
            {
                _id: new ObjectId(),
                name: "Advanced React Patterns",
                description: "Master advanced React concepts and patterns.",
                thumbnail: "https://via.placeholder.com/600x400?text=React+Patterns",
                level: "Advanced",
                instructorId: "teacher_id_placeholder", // Updated dynamically
                enrolledCount: 0,
                status: "Active"
            },
            {
                _id: new ObjectId(),
                name: "Python for Data Science",
                description: "Learn Python for data analysis and visualization.",
                thumbnail: "https://via.placeholder.com/600x400?text=Python+Data",
                level: "Intermediate",
                instructorId: "teacher_id_placeholder",
                enrolledCount: 0,
                status: "Active"
            },
            {
                _id: new ObjectId(),
                name: "Machine Learning Basics",
                description: "Introduction to ML algorithms and concepts.",
                thumbnail: "https://via.placeholder.com/600x400?text=ML+Basics",
                level: "Beginner",
                instructorId: "teacher_id_placeholder",
                enrolledCount: 0,
                status: "Active"
            }
        ];

        // Find a teacher to assign courses to
        const teacher = await db.collection("users").findOne({ role: "teacher" });
        const teacherId = teacher ? teacher._id.toString() : new ObjectId().toString();

        // Insert Courses
        for (const course of courses) {
            course.instructorId = teacherId;
            await db.collection("courses").updateOne(
                { name: course.name },
                { $set: course },
                { upsert: true }
            );
        }
        console.log("✅ Courses seeded.");

        const activeCourses = await db.collection("courses").find({}).toArray();

        // 2. Find All Students
        const students = await db.collection("users").find({ role: "student" }).toArray();
        console.log(`Found ${students.length} students.`);

        // 3. Create Progress for EACH student
        // Target: 12 Hours Total, ~85% Mastery, 5 Streak
        const progressData = [
            {
                hoursSpent: 5,
                mastery: 90,
                streak: 3,
                progress: 60
            },
            {
                hoursSpent: 4,
                mastery: 80,
                streak: 5, // Max streak
                progress: 45
            },
            {
                hoursSpent: 3, // Total 5+4+3 = 12
                mastery: 85, // Avg (90+80+85)/3 = 85
                streak: 2,
                progress: 30
            }
        ];

        for (const student of students) {
            const studentId = student._id.toString();

            for (let i = 0; i < activeCourses.length; i++) {
                const course = activeCourses[i];
                if (i >= progressData.length) break; // Only enroll in 3

                const stats = progressData[i];

                await db.collection("progress").updateOne(
                    { userId: studentId, courseId: course._id.toString() },
                    {
                        $set: {
                            userId: studentId,
                            courseId: course._id.toString(),
                            progress: stats.progress,
                            mastery: stats.mastery,
                            streak: stats.streak,
                            hoursSpent: stats.hoursSpent,
                            lastAccessed: new Date(),
                            enrolledAt: new Date()
                        }
                    },
                    { upsert: true }
                );

                // Update enrolled count
                await db.collection("courses").updateOne(
                    { _id: course._id },
                    { $inc: { enrolledCount: 1 } }
                );
            }
            console.log(`✅ Progress updated for student: ${student.email}`);
        }

        console.log("\n🎉 Data population complete! Metrics should now match request.");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await client.close();
    }
}

seedData();
