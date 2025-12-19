import sys
import os
import random
import uuid
# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.assessment.engine.knowledge_tracing import KnowledgeTracingEngine
from app.assessment.engine.policy_engine import PolicyEngine, AssessmentAction
from app.assessment.question.selector import QuestionSelector
from app.assessment.models.schemas import MasteryState, StudentResponse, Question
from app.assessment.models.session import AssessmentSession

# --- SIMULATION ENGINE ---
# We replicate the API logic here purely in Python to avoid environment issues with httpx/TestClient

class SimulationRunner:
    def __init__(self):
        self.bkt = KnowledgeTracingEngine()
        self.policy = PolicyEngine()
        self.selector = QuestionSelector()
        self.sessions = {}

    def start_session(self, student_id: str):
        session = AssessmentSession(
            session_id=str(uuid.uuid4()),
            student_id=student_id,
            mastery_state=MasteryState(student_id=student_id)
        )
        self.sessions[session.session_id] = session
        return session.session_id

    def next_question(self, session_id: str):
        session = self.sessions[session_id]
        if session.is_completed:
            return {"status": "completed", "reason": session.completion_reason}
        
        # Policy
        # Reconstruct simplistic history for policy engine
        history_objs = [StudentResponse(**h) for h in session.history]
        decision = self.policy.decide_next_action(session.mastery_state, history_objs, "arrays") # Focus on arrays
        
        if decision.action == AssessmentAction.STOP:
            session.is_completed = True
            session.completion_reason = decision.reason
            return {"status": "completed", "reason": decision.reason}

        # Select
        question = self.selector.select_question(decision, session.seen_question_ids)
        if not question:
            session.is_completed = True
            session.completion_reason = "No more questions"
            return {"status": "completed", "reason": session.completion_reason}
        
        session.current_question = question
        session.seen_question_ids.append(question.id)
        return {"status": "in_progress", "question": question}

    def submit_answer(self, session_id: str, is_correct: bool, time_taken: float):
        session = self.sessions[session_id]
        q = session.current_question
        if not q:
            return None
        
        # Update BKT
        self.bkt.update_mastery(session.mastery_state, q.metadata.concepts, is_correct)
        
        # Save history
        resp = StudentResponse(
            question_id=q.id,
            selected_answer="SIMULATED",
            is_correct=is_correct,
            time_taken_seconds=time_taken
        )
        session.history.append(resp.dict())
        session.current_question = None
        
        return session.mastery_state.concept_mastery


class SimulatedStudent:
    def __init__(self, id: str, true_skill: float):
        self.id = id
        self.true_skill = true_skill 
        
    def answer(self, question: Question) -> bool:
        """Probabilistic answer based on Item Response Theory (IRT) approx"""
        diff = question.metadata.difficulty
        # P(Correct) = 1 / (1 + e^(-k*(Skill - Diff)))
        # Simplified:
        delta = self.true_skill - diff
        # Base prob roughly 0.5 + delta
        prob = 0.5 + (delta * 0.8) # 0.8 sensitivity
        prob = max(0.05, min(0.95, prob))
        return random.random() < prob

def main():
    print("Starting 50 Assessment Simulations (Direct Engine Mode)...")
    runner = SimulationRunner()
    results = []
    
    for i in range(50):
        skill = random.uniform(0.1, 0.95)
        # Randomize ID slightly to avoid confusion with previous runs
        student = SimulatedStudent(f"simV2_{i+1:02d}", skill)
        
        sid = runner.start_session(student.id)
        
        questions_answered = 0
        correct_count = 0
        
        while True:
            res = runner.next_question(sid)
            if res["status"] == "completed":
                break
                
            question = res["question"]
            is_correct = student.answer(question)
            
            # Submit
            mastery_map = runner.submit_answer(sid, is_correct, random.uniform(5, 20))
            
            questions_answered += 1
            if is_correct: correct_count += 1
            
            # Print minimal trace
            # print(f"  {student.id} Q{questions_answered} (D:{question.metadata.difficulty:.1f}) -> {'✅' if is_correct else '❌'}")
            
            if questions_answered > 15: # Safety
                break
        
        # Get final state
        sess = runner.sessions[sid]
        final_m = sess.mastery_state.concept_mastery
        
        results.append({
            "id": student.id,
            "skill": skill,
            "q_count": questions_answered,
            "acc": correct_count/questions_answered if questions_answered else 0,
            "mastery": final_m,
            "reason": sess.completion_reason
        })

    print(f"\n{'Student ID':<12} | {'True Skill':<10} | {'Questions':<10} | {'Accuracy':<10} | {'Stop Reason':<30} | {'Est. Mastery (Arrays)'}")
    print("-" * 110)
    
    # Sort by skill to see trend
    results.sort(key=lambda x: x["skill"])
    
    for r in results:
        arr_m = r['mastery'].get('arrays', 0.5)
        print(f"{r['id']:<12} | {r['skill']:<10.2f} | {r['q_count']:<10} | {r['acc']:<10.2f} | {str(r['reason']):<30} | {arr_m:.2f}")

if __name__ == "__main__":
    main()
