import asyncio
from services.pathway_generator import LearningPathwayGenerator

async def test_comprehensive_difficulty():
    generator = LearningPathwayGenerator()

    print("=== Comprehensive Difficulty Testing ===\n")

    # Test 1: Content adaptation for different difficulties
    print("1. Testing content adaptation for different difficulties:")
    test_content = [{"content_type": "text", "difficulty": "intermediate"}]

    for difficulty in ["beginner", "intermediate", "advanced"]:
        adapted = generator._adapt_difficulty(test_content, difficulty, 0.0)
        print(f"  {difficulty}: adaptation_type = {adapted[0].get('adaptation_type', 'none')}")
        if difficulty == "beginner":
            print(f"    Has scaffolding: {'scaffolding' in adapted[0]}")
        elif difficulty == "advanced":
            print(f"    Has challenges: {'additional_challenges' in adapted[0]}")

    print()

    # Test 2: Time estimates for different difficulties
    print("2. Testing time estimates for different difficulties:")
    for difficulty in ["beginner", "intermediate", "advanced"]:
        time_est = generator._estimate_skill_time("python_basics", 0.0)
        target_mastery = generator._get_target_mastery(difficulty)
        print(f"  {difficulty}: target_mastery = {target_mastery}, estimated_time = {time_est} min")

    print()

    # Test 3: Edge cases - invalid difficulty
    print("3. Testing edge cases - invalid difficulty:")
    try:
        result = await generator.generate_pathway(
            student_id="test1",
            current_skills=["python_basics"],
            target_skills=["classes"],
            learning_style="visual",
            difficulty="invalid"
        )
        print("  ERROR: Should have raised ValueError for invalid difficulty")
    except ValueError as e:
        print(f"  SUCCESS: Correctly raised ValueError: {e}")
    except Exception as e:
        print(f"  UNEXPECTED ERROR: {e}")

    print()

    # Test 4: Integration with learning style
    print("4. Testing integration with learning style:")
    for learning_style in ["visual", "auditory", "reading"]:
        for difficulty in ["beginner", "advanced"]:
            try:
                result = await generator.generate_pathway(
                    student_id="test1",
                    current_skills=["python_basics"],
                    target_skills=["classes"],
                    learning_style=learning_style,
                    difficulty=difficulty
                )
                metadata = result.get("metadata", {})
                print(f"  {learning_style}/{difficulty}: metadata difficulty = {metadata.get('difficulty')}, style = {metadata.get('learning_style')}")
            except Exception as e:
                print(f"  ERROR for {learning_style}/{difficulty}: {e}")

    print()

    # Test 5: Persistence through full pathway generation
    print("5. Testing persistence through full pathway generation:")
    test_cases = [
        {"difficulty": "beginner", "expected_mastery": 60},
        {"difficulty": "intermediate", "expected_mastery": 75},
        {"difficulty": "advanced", "expected_mastery": 85}
    ]

    for case in test_cases:
        try:
            result = await generator.generate_pathway(
                student_id="test1",
                current_skills=["python_basics"],
                target_skills=["classes"],
                learning_style="visual",
                difficulty=case["difficulty"]
            )
            metadata = result.get("metadata", {})
            pathway = result.get("pathway", [])
            print(f"  {case['difficulty']}: metadata_difficulty = {metadata.get('difficulty')}, pathway_steps = {len(pathway)}")
            if pathway:
                print(f"    First step level: {pathway[0].get('level')}")
        except Exception as e:
            print(f"  ERROR for {case['difficulty']}: {e}")

    print("\n=== Testing Complete ===")

if __name__ == "__main__":
    asyncio.run(test_comprehensive_difficulty())
