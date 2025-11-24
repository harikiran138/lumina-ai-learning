import asyncio
from services.pathway_generator import LearningPathwayGenerator

async def test_endpoint():
    generator = LearningPathwayGenerator()

    # Test with different difficulty levels
    test_cases = [
        {'student_id': 'test1', 'current_skills': ['basic_math'], 'target_skills': ['algebra'], 'learning_style': 'visual', 'difficulty': 'beginner'},
        {'student_id': 'test2', 'current_skills': ['basic_math'], 'target_skills': ['algebra'], 'learning_style': 'visual', 'difficulty': 'intermediate'},
        {'student_id': 'test3', 'current_skills': ['basic_math'], 'target_skills': ['algebra'], 'learning_style': 'visual', 'difficulty': 'advanced'}
    ]

    for i, case in enumerate(test_cases):
        print(f'Testing case {i+1}: difficulty={case["difficulty"]}')
        try:
            result = await generator.generate_pathway(**case)
            print(f'  Success: pathway generated with {len(result["pathway"])} steps')
            # Check if difficulty is used (should be in metadata or pathway)
            if 'metadata' in result and 'difficulty' in result['metadata']:
                print(f'  Difficulty in metadata: {result["metadata"]["difficulty"]}')
            else:
                print('  Difficulty not found in metadata')
        except Exception as e:
            print(f'  Error: {e}')
        print()

if __name__ == "__main__":
    asyncio.run(test_endpoint())
