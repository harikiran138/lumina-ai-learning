import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from pathway.inference_engine import PathwayInferenceEngine

def test_inference():
    print("Initializing Inference Engine...")
    engine = PathwayInferenceEngine(model_path="models/tkt_v1.pt", num_skills=20)
    
    # Test 1: Good student history
    # Repeating same skill, correct every time
    skills = [1, 1, 1, 1, 1]
    correct = [1, 1, 1, 1, 1]
    pred = engine.predict_mastery(skills, correct)
    print(f"History (All Correct): {correct} -> Prediction: {pred:.4f}")
    
    # Test 2: Struggling student
    # Repeating same skill, incorrect
    skills_bad = [1, 1, 1, 1, 1]
    correct_bad = [0, 0, 0, 0, 0]
    pred_bad = engine.predict_mastery(skills_bad, correct_bad)
    print(f"History (All Wrong): {correct_bad} -> Prediction: {pred_bad:.4f}")

    assert pred > pred_bad, "Model should predict higher mastery for correct history."
    print("Verification Passed: Model discriminates between success/failure.")

if __name__ == "__main__":
    test_inference()
