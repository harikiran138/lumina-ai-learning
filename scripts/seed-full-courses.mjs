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

const FULL_COURSES = [
    {
        name: "Advanced React Patterns",
        description: "Master advanced React concepts, hooks, and performance optimization techniques.",
        expandedDescription: "This comprehensive course takes you beyond the basics of React. You will learn how to build reusable, flexible, and performant components using advanced patterns like Compound Components, Control Props, and Custom Hooks. Perfect for developers looking to level up their React skills.",
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
        level: "Advanced",
        status: "Active",
        modules: [
            {
                id: "mod_1",
                title: "Compound Components",
                duration: "45 min",
                lessons: [
                    {
                        id: "les_1_1",
                        title: "Concept: Implicit State Sharing",
                        type: "text",
                        duration: "10 min",
                        completed: false,
                        content: `
# Implicit State Sharing in Compound Components

Compound components are a pattern where components work together to form a complete UI, sharing state implicitly. Think of HTML's \`<select>\` and \`<option>\` elements. They don't need you to pass the state to each option explicitly; they just "know" about each other.

### Why use them?
- **Cleaner API**: Users of your component don't need to manage internal state.
- **Flexibility**: Users can rearrange child components (e.g., put the Toggle Button before or after the Label).

### The Magic: React.Context
The core mechanism usually involves \`React.createContext\`. The parent component (e.g., \`<Toggle>\`) creates a provider, and the children (e.g., \`<Toggle.On>\`) consume that context.

\`\`\`jsx
const ToggleContext = React.createContext();

function Toggle({ children }) {
  const [on, setOn] = React.useState(false);
  const toggle = () => setOn(!on);
  
  return (
    <ToggleContext.Provider value={{ on, toggle }}>
      {children}
    </ToggleContext.Provider>
  );
}
\`\`\`
            `
                    },
                    {
                        id: "les_1_2",
                        title: "Building the Toggle Component",
                        type: "text",
                        duration: "20 min",
                        completed: false,
                        content: `
# Building a Flexible Toggle

Now that we understand the concept, let's build the prompt components.

## The Requirements
1.  **Toggle**: The wrapper that holds state.
2.  **Toggle.On**: Displays children only when state is ON.
3.  **Toggle.Off**: Displays children only when state is OFF.
4.  **Toggle.Button**: The switch that flips the state.

## Implementation Steps

1.  **Create Context**: As seen in the previous lesson.
2.  **Create Consumers**:
    *   \`Toggle.On\` checks \`context.on\`. If true, render children.
    *   \`Toggle.Off\` checks \`!context.on\`.

\`\`\`jsx
Toggle.On = ({ children }) => {
  const { on } = useContext(ToggleContext);
  return on ? children : null;
}
\`\`\`

This pattern allows consumers of your component to write semantic, readable code:

\`\`\`jsx
<Toggle>
  <Toggle.On>The light is ON</Toggle.On>
  <Toggle.Button />
</Toggle>
\`\`\`
            `
                    },
                    {
                        id: "quiz_1",
                        title: "Compound Components Quiz",
                        type: "quiz",
                        duration: "15 min",
                        completed: false,
                        questions: [
                            {
                                id: "q1",
                                question: "What is the main benefit of Compound Components?",
                                options: [
                                    "They render faster",
                                    "They allow flexible arrangement of child components",
                                    "They replace Redux",
                                    "They enforce strict structure"
                                ],
                                correctAnswer: 1
                            },
                            {
                                id: "q2",
                                question: "Which React API is commonly used to share state in Compound Components?",
                                options: [
                                    "useState",
                                    "useEffect",
                                    "Context API",
                                    "useReducer"
                                ],
                                correctAnswer: 2
                            }
                        ]
                    }
                ]
            },
            {
                id: "mod_2",
                title: "Custom Hooks & Logic Reuse",
                duration: "1 hour",
                lessons: [
                    {
                        id: "les_2_1",
                        title: "Extracting Logic to Hooks",
                        type: "video",
                        duration: "15 min"
                    },
                    {
                        id: "quiz_2",
                        title: "Hooks Mastery Quiz",
                        type: "quiz",
                        duration: "10 min",
                        questions: [
                            {
                                id: "q1",
                                question: "Rules of Hooks dictate that hooks must be called from...",
                                options: [
                                    "Loops and conditions",
                                    "Class components",
                                    "Top level of functional components",
                                    "Anywhere"
                                ],
                                correctAnswer: 2
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        name: "Python for Data Science",
        description: "Learn Python through real-world data science projects.",
        expandedDescription: "From Pandas to NumPy, this course covers the essential libraries for data analysis in Python. You'll work with real datasets (Titanic, Housing Prices) and learn how to visualize data effectively using Matplotlib and Seaborn.",
        thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=3274&auto=format&fit=crop",
        level: "Intermediate",
        status: "Active",
        modules: [
            {
                id: "py_mod_1",
                title: "NumPy Basics",
                duration: "30 min",
                lessons: [
                    { id: "py_1", title: "Arrays vs Lists", type: "video", duration: "10 min" },
                    {
                        id: "py_quiz_1",
                        title: "NumPy Check",
                        type: "quiz",
                        questions: [
                            { id: "q1", question: "NumPy arrays are...", options: ["Slower than lists", "Homogeneous & Fast", "Heterogeneous", "Immutable"], correctAnswer: 1 }
                        ]
                    }
                ]
            }
        ]
    },
    {
        name: "Machine Learning Basics",
        description: "Introduction to ML algorithms and concepts.",
        expandedDescription: "Understand the fundamentals of Supervised and Unsupervised learning. We cover Linear Regression, Logistic Regression, and K-Means Clustering with hands-on examples.",
        thumbnail: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop",
        level: "Beginner",
        status: "Active",
        modules: [
            {
                id: "ml_mod_1",
                title: "What is Machine Learning?",
                duration: "20 min",
                lessons: [
                    { id: "ml_1", title: "Supervised vs Unsupervised", type: "video", duration: "10 min" },
                    {
                        id: "ml_quiz_1",
                        title: "ML Concepts Quiz",
                        type: "quiz",
                        questions: [
                            { id: "q1", question: "Spam filtering is an example of...", options: ["Clustering", "Supervised Learning", "Reinforcement Learning"], correctAnswer: 1 }
                        ]
                    }
                ]
            }
        ]
    }
];

async function seed() {
    try {
        console.log("Connecting...");
        await client.connect();
        const db = client.db("lumina-database");

        // Get a teacher ID
        const teacher = await db.collection("users").findOne({ role: "teacher" });
        const teacherId = teacher ? teacher._id.toString() : new ObjectId().toString();

        console.log("Seeding detailed courses...");

        for (const courseData of FULL_COURSES) {
            const { name, ...rest } = courseData;

            await db.collection("courses").updateOne(
                { name: name },
                {
                    $set: {
                        name,
                        instructorId: teacherId,
                        enrolledCount: 0, // Reset for clean state or keep? Let's keep existing count if possible, but simplest is set
                        createdAt: new Date(),
                        ...rest
                    },
                    // Ensure we don't overwrite enrolledCount if we want to preserve it, 
                    // but user asked to "add courses", implying fresh or updated data.
                    // I'll set enrolledCount to 0 for these specific "New" courses to match the fresh data structure.
                },
                { upsert: true }
            );
            console.log(`✅ Updated/Inserted: ${name}`);
        }

        console.log("🎉 Full course content seeded!");

    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

seed();
