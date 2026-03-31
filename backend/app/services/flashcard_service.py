import math
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db

class FlashcardService:
    """
    Service for managing flashcards and spaced repetition using FSRS (Free Spaced Repetition Scheduler) logic.
    """
    
    # FSRS default parameters (simplified)
    W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]

    async def get_student_deck(self, student_id: str, course_id: str) -> List[Dict[str, Any]]:
        """Fetch flashcards due for review for a specific student and course."""
        client = supabase_db.get_client()
        
        # 1. Join flashcards with student progress
        # Since Supabase client join syntax can be tricky, we fetch flashcards first
        flashcards = client.table("flashcards").select("*").eq("course_id", course_id).execute().data or []
        card_ids = [c["id"] for c in flashcards]
        
        if not card_ids:
            return []
            
        progress_data = client.table("student_flashcard_progress")\
            .select("*")\
            .eq("student_id", student_id)\
            .in_("flashcard_id", card_ids)\
            .execute().data or []
            
        progress_map = {p["flashcard_id"]: p for p in progress_data}
        
        # 2. Filter by due date
        now = datetime.now(timezone.utc)
        deck = []
        for card in flashcards:
            prog = progress_map.get(card["id"])
            is_due = False
            if not prog:
                is_due = True # New card
            else:
                next_rev = datetime.fromisoformat(prog["next_review"].replace("Z", "+00:00"))
                if next_rev <= now:
                    is_due = True
            
            if is_due:
                deck.append({
                    **card,
                    "progress": prog or {
                        "stability": 0.0,
                        "difficulty": 0.0,
                        "state": 0, # New
                        "last_review": None,
                        "next_review": now.isoformat()
                    }
                })
        
        return deck

    async def review_card(self, student_id: str, flashcard_id: str, rating: int) -> Dict[str, Any]:
        """
        Record a review for a flashcard and schedule the next review using FSRS logic.
        Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
        """
        client = supabase_db.get_client()
        
        # 1. Fetch current progress
        prog = client.table("student_flashcard_progress")\
            .select("*")\
            .eq("student_id", student_id)\
            .eq("flashcard_id", flashcard_id)\
            .execute().data
            
        prog = prog[0] if prog else None
        
        now = datetime.now(timezone.utc)
        
        if not prog:
            # First time review
            stability = self.W[rating - 1]
            difficulty = self.W[4] - (rating - 3) * self.W[5]
            state = 1 if rating == 1 else 2 # 1=Learning, 2=Review
            elapsed_days = 0
        else:
            # Subsequent review
            s = prog["stability"]
            d = prog["difficulty"]
            elapsed_days = (now - datetime.fromisoformat(prog["last_review"].replace("Z", "+00:00"))).days
            
            # Simplified FSRS update logic
            if rating == 1: # Again
                stability = self.W[0] * math.exp(-self.W[1] * elapsed_days)
                state = 3 # Relearning
            else:
                # Retrievability
                retrievability = math.exp(math.log(0.9) * elapsed_days / s) if s > 0 else 0.9
                # Update stability
                stability = s * (1 + math.exp(self.W[6]) * (11 - d) * math.pow(s, -self.W[7]) * (math.exp((1 - retrievability) * self.W[8]) - 1))
                state = 2 # Review
            
            difficulty = d - self.W[5] * (rating - 3)
            difficulty = max(1.0, min(10.0, difficulty))

        # Schedule next review
        # Interval in days = Stability * log(9) / log(0.9) approx Stability * 1
        # For simplicity in this demo, let's use stability as days directly or scale it
        interval = max(1, round(stability))
        next_review = now + timedelta(days=interval)
        
        updated_prog = {
            "student_id": student_id,
            "flashcard_id": flashcard_id,
            "stability": stability,
            "difficulty": difficulty,
            "elapsed_days": elapsed_days,
            "scheduled_days": interval,
            "last_review": now.isoformat(),
            "next_review": next_review.isoformat(),
            "state": state
        }
        
        await supabase_db.upsert("student_flashcard_progress", updated_prog, on_conflict="student_id,flashcard_id")
        
        return updated_prog

    async def generate_flashcards(self, course_id: str, institution_id: str, topic: str, content: str) -> List[Dict[str, Any]]:
        """
        Mock AI-powered flashcard generation. 
        In actual implementation, calls a LLM (Gemini) to parse the content.
        """
        # Placeholder for AI logic
        mock_cards = [
            {"question": f"What is a core concept of {topic}?", "answer": "This is a generated answer based on the content provided."},
            {"question": f"Key Term in {topic}?", "answer": "A specific definition extracted from the lesson notes."}
        ]
        
        created_cards = []
        for card in mock_cards:
            new_card = await supabase_db.insert("flashcards", {
                "course_id": course_id,
                "question": card["question"],
                "answer": card["answer"],
                "institution_id": institution_id,
                "concept_id": topic.lower().replace(" ", "_")
            })
            if new_card:
                created_cards.append(new_card)
        
        return created_cards

def get_flashcard_service():
    return FlashcardService()
