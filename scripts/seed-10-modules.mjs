
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from .env.local in root
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
}

const client = new MongoClient(uri);

// Helper to generate 10 related questions
function generateQuestions(moduleTitle) {
    const questions = [];
    for (let i = 1; i <= 10; i++) {
        questions.push({
            id: `q_${Date.now()}_${i}`,
            question: `Question ${i} about ${moduleTitle}: What is the key takeaway?`,
            options: [
                `Option A: It is essential for ${moduleTitle}`,
                "Option B: It is irrelevant",
                "Option C: It depends on the weather",
                "Option D: None of the above"
            ],
            correctAnswer: 0
        });
    }
    // Add some specific ones for realism if needed, but this ensures 10
    questions[0].question = `What is the primary purpose of ${moduleTitle}?`;
    questions[1].question = `Which scenario is best suited for ${moduleTitle}?`;
    questions[9].question = `Advanced: How does ${moduleTitle} impact performance?`;

    return questions;
}

async function seed() {
    try {
        await client.connect();
        console.log("Connected to MongoDB...");
        const db = client.db("lumina-database");

        // Module Titles
        const moduleTitles = [
            "Compound Components",
            "Control Props Pattern",
            "Custom Hooks Pattern",
            "React Context Deep Dive",
            "Performance Tuning (useMemo)",
            "React Server Components",
            "Advanced Patterns: Render Props",
            "State Reducers",
            "Testing React Applications",
            "Building a Design System"
        ];

        const richModules = moduleTitles.map((title, idx) => {
            const modId = `mod_${idx + 1}`;
            return {
                id: modId,
                title: title,
                duration: "1h 30m",
                lessons: [
                    {
                        id: `${modId}_les_1`,
                        title: `Introduction to ${title}`,
                        type: "video",
                        duration: "15 min",
                        completed: false
                    },
                    {
                        id: `${modId}_les_2`,
                        title: `Core Concepts: ${title}`,
                        type: "text",
                        duration: "20 min",
                        completed: false,
                        content: `
# ${title}: Core Concepts

Welcome to this deep dive into **${title}**. In this lesson, we explore the fundamental principles.

## Key Concepts
1. **Abstraction**: Hiding complexity.
2. **Composition**: Building complex UIs from simple blocks.
3. **Inversion of Control**: Giving control back to the user.

### Example
\`\`\`jsx
// ${title} Example
const element = <${title.replace(/\s/g, '')} />;
\`\`\`
                        `
                    },
                    {
                        id: `${modId}_les_3`,
                        title: `${title} Visual Guide`,
                        type: "slides",
                        duration: "10 min",
                        completed: false,
                        slides: [
                            {
                                title: `Understanding ${title}`,
                                text: "A visual breakdown of how data flows in this pattern.",
                                image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80"
                            },
                            {
                                title: "Architecture",
                                text: "The structural design.",
                                image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80"
                            },
                            {
                                title: "Best Practices",
                                text: "Do's and Don'ts.",
                                image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80"
                            }
                        ]
                    },
                    {
                        id: `${modId}_quiz`,
                        title: `${title} Quiz`,
                        type: "quiz",
                        duration: "20 min",
                        completed: false,
                        questions: generateQuestions(title)
                    }
                ]
            };
        });

        // Specific fix for Module 1 Quiz (Compound Components) to have specific questions + filled to 10
        const compoundQuiz = richModules[0].lessons.find(l => l.type === 'quiz');
        if (compoundQuiz) {
            compoundQuiz.questions[0].question = "What is the main benefit of Compound Components?";
            compoundQuiz.questions[0].options = ["Flexible Layout", "Faster Rendering", "Less Code", "Global State"];
            compoundQuiz.questions[0].correctAnswer = 0;

            compoundQuiz.questions[1].question = "Which API is key for Compound Components?";
            compoundQuiz.questions[1].options = ["useState", "useEffect", "Context API", "Redux"];
            compoundQuiz.questions[1].correctAnswer = 2;
        }

        const courses = [
            {
                name: "Advanced React Patterns",
                description: "Master modern React with advanced patterns and performance tuning.",
                expandedDescription: "10 Modules containing Video, Text, Slides, and comprehensive Quizzes.",
                thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80",
                instructorId: "admin_placeholder",
                level: "Advanced",
                status: "Active",
                enrolledCount: 1250,
                modules: richModules
            }
        ];

        // Upsert
        const courseColl = db.collection("courses");
        // Clear old demo courses only
        await courseColl.deleteMany({ name: "Advanced React Patterns" });

        const user = await db.collection("users").findOne({ role: "teacher" });
        const instructorId = user ? user._id.toString() : new ObjectId().toString();

        for (const course of courses) {
            course.instructorId = instructorId;
            course.createdAt = new Date();
            await courseColl.insertOne(course);
        }

        console.log("Database seeded with 10 modules & 10 questions/quiz!");

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

seed();
