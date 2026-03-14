from app.database.supabase_manager import supabase_db
import uuid

def seed_knowledge_nodes():
    client = supabase_db.get_client()
    if not client:
        print("Error: Could not initialize Supabase client.")
        return

    # Using 'Smoke Algebra' course if it exists, otherwise use a new UUID or None
    course_id = "1b0cad70-6c9e-4607-a0db-7c57814f8c55"
    
    nodes = [
        {
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "concept": "Variables and Expressions",
            "subject": "Algebra",
            "difficulty": "beginner",
            "description": "Introduction to letters as numbers and basic algebraic expressions.",
            "prerequisites": [],
            "learning_outcomes": ["Identify variables", "Evaluate simple expressions"]
        },
        {
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "concept": "Single-Variable Equations",
            "subject": "Algebra",
            "difficulty": "beginner",
            "description": "Solving equations with one variable using addition and subtraction.",
            "prerequisites": ["Variables and Expressions"],
            "learning_outcomes": ["Solve x + a = b", "Solve x - a = b"]
        },
        {
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "concept": "Multi-Step Equations",
            "subject": "Algebra",
            "difficulty": "intermediate",
            "description": "Solving complex equations requiring multiple steps and distribution.",
            "prerequisites": ["Single-Variable Equations"],
            "learning_outcomes": ["Solve ax + b = c", "Use distributive property in equations"]
        },
        {
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "concept": "Linear Inequalities",
            "subject": "Algebra",
            "difficulty": "intermediate",
            "description": "Understanding and solving inequalities and graphing them on a number line.",
            "prerequisites": ["Single-Variable Equations"],
            "learning_outcomes": ["Solve ax > b", "Graph inequalities"]
        },
        {
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "concept": "Systems of Linear Equations",
            "subject": "Algebra",
            "difficulty": "advanced",
            "description": "Solving sets of two or more linear equations simultaneously.",
            "prerequisites": ["Multi-Step Equations"],
            "learning_outcomes": ["Solve by substitution", "Solve by elimination"]
        }
    ]

    print(f"Seeding {len(nodes)} knowledge nodes...")
    try:
        response = client.table("knowledge_nodes").insert(nodes).execute()
        print(f"Successfully seeded {len(response.data)} nodes.")
    except Exception as e:
        print(f"Error seeding nodes: {e}")

if __name__ == "__main__":
    seed_knowledge_nodes()
