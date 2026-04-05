# Restoration Plan: Schema Hardening & Wellbeing Restoration


Restore the missing peripheral modules and missing persistence layers for the Intelligence Core features.

## 1. Phase 1: Database Schema Expansion

Create a unified migration script `migrations/20260405_system_hardening.sql` that adds:

- `fsrs_cards`: Stores flashcard scheduling (stability, difficulty, interval).
- `emotion_logs`: Tracking mood check-ins (student_id, mood, notes).
- `wellbeing_alerts`: Distress signals and severity tracking.
- `student_style_weights`: RL-driven preference weights for content delivery styles.
- `intervention_logs`: Records of pedagogical interventions triggered by the Adaptive Engine.
- `persistent_notifications`: Postgres-backed notification store for audit/history.

## 2. Phase 2: Restoration of `wellbeing` Service
Implement the missing logic in `backend/app/services/wellbeing.py` to handle:
- Mood check-in persistence.
- Distress signal detection (basic keyword/rule-based heuristics).
- Alert routing to teachers/counselors via Supabase.

## 3. Phase 3: FSRS Verification
- Verify that `backend/app/services/fsrs_engine.py` successfully connects to the new `fsrs_cards` table.
- Test card lesson and review update loop.

## 4. Phase 4: Integration
- Ensure `AdaptiveEngine` can log to `intervention_logs`.
- Ensure student check-ins from the frontend correctly route to the new wells-being service.
