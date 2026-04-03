import asyncio
import unittest
from unittest.mock import MagicMock, AsyncMock
from app.services.adaptive_onboarding import AdaptiveOnboardingEngine

class TestRAOIELogic(unittest.TestCase):
    def setUp(self):
        self.db = AsyncMock()
        self.engine = AdaptiveOnboardingEngine(self.db)
        # Mock LLM
        self.engine.llm = AsyncMock()
        self.engine.llm.agenerate = AsyncMock(return_value='{"knowledge_score": 0.85, "reasoning_score": 0.75, "confidence_score": 0.9, "extracted_topics": ["Calculus", "Derivatives"]}')
        self.engine.llm.generate = MagicMock(return_value="Tell me about derivatives.")

    async def test_ai_evaluate_response(self):
        result = await self.engine._ai_evaluate_response("student", "Math", "Calculus is the study of change.")
        self.assertIsNotNone(result)
        self.assertEqual(result["knowledge_score"], 0.85)

    async def test_calculate_result_with_ai(self):
        answers = [
            {
                "answer_text": "Calculus is great",
                "ai_evaluation": {"knowledge_score": 0.9, "reasoning_score": 0.8}
            },
            {
                "answer_text": "I like integration",
                "ai_evaluation": {"knowledge_score": 0.7, "reasoning_score": 0.6}
            }
        ]
        result = self.engine._calculate_result("student", {}, answers)
        # (0.9 + 0.7) / 2 = 0.8
        self.assertEqual(result["scores"]["knowledge_score"], 0.8)
        # (0.8 + 0.6) / 2 = 0.7
        self.assertEqual(result["scores"]["reasoning_score"], 0.7)

    async def test_build_knowledge_graph_with_ai_topics(self):
        answers = [
            {
                "answer_text": "...",
                "ai_evaluation": {"extracted_topics": ["Derivatives", "Integrals"]}
            }
        ]
        context = {"subject_rows": [{"id": "math101", "name": "Calculus"}]}
        kg = self.engine._build_knowledge_graph("student", context, answers, {}, 0.8, 0.7, 0.9)
        # concept_key should be based on ai_topics: "derivatives_integrals"
        self.assertIn("derivatives_integrals", kg["masteryMap"]["math101"]["concepts"])

def run_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestRAOIELogic)
    # Since we use async mocks, we need to wrap the test calls or use an async test runner
    # For simplicity in this environment, we just run the coroutines manually for a quick check
    test = TestRAOIELogic()
    test.setUp()
    
    print("Running RAOIE Logic Unit Tests...")
    
    async def run():
        await test.test_ai_evaluate_response()
        print("✅ test_ai_evaluate_response passed")
        await test.test_calculate_result_with_ai()
        print("✅ test_calculate_result_with_ai passed")
        await test.test_build_knowledge_graph_with_ai_topics()
        print("✅ test_build_knowledge_graph_with_ai_topics passed")
        print("\nAll RAOIE logic tests passed! 🚀")

    asyncio.run(run())

if __name__ == "__main__":
    run_tests()
