from app.pathway.optimizer import CurriculumOptimizer
import asyncio

async def test_optimizer():
    # 'Smoke Algebra' course id from previous check
    course_id = "1b0cad70-6c9e-4607-a0db-7c57814f8c55"
    
    print(f"Initializing CurriculumOptimizer for course: {course_id}")
    optimizer = CurriculumOptimizer(course_id=course_id)
    
    # 1. Start with no mastered concepts
    mastered = []
    next_concept = optimizer.get_optimal_next_concept(mastered)
    print(f"Mastered: {mastered} -> Next Concept: {next_concept}")
    assert next_concept == "Variables and Expressions", "Should start with 'Variables and Expressions'"

    # 2. Master the first concept
    mastered = ["Variables and Expressions"]
    next_concept = optimizer.get_optimal_next_concept(mastered)
    print(f"Mastered: {mastered} -> Next Concept: {next_concept}")
    assert next_concept == "Single-Variable Equations", "Should follow with 'Single-Variable Equations'"

    # 3. Master basic equations, check branching/difficulty
    mastered = ["Variables and Expressions", "Single-Variable Equations"]
    next_concept = optimizer.get_optimal_next_concept(mastered)
    print(f"Mastered: {mastered} -> Next Concept: {next_concept}")
    # Both 'Multi-Step Equations' and 'Linear Inequalities' have 'Single-Variable Equations' as prereq.
    # 'Multi-Step Equations' and 'Linear Inequalities' both have 'intermediate' difficulty (0.5).
    # Sorting by difficulty will return one of them.
    assert next_concept in ["Multi-Step Equations", "Linear Inequalities"], "Should choose an intermediate concept"

    # 4. Master everything except advanced
    mastered = ["Variables and Expressions", "Single-Variable Equations", "Multi-Step Equations", "Linear Inequalities"]
    next_concept = optimizer.get_optimal_next_concept(mastered)
    print(f"Mastered: {mastered} -> Next Concept: {next_concept}")
    assert next_concept == "Systems of Linear Equations", "Should finish with 'Systems of Linear Equations'"

    print("\nVerification successful!")

if __name__ == "__main__":
    asyncio.run(test_optimizer())
