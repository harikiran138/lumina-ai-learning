-- Seeding Analytics Data for Lumina
-- This script populates learner_profiles, progress, and knowledge_nodes

BEGIN;

-- 1. Knowledge Nodes for Quantum Physics 101
INSERT INTO public.knowledge_nodes (id, course_id, concept, subject, difficulty, description)
VALUES 
    (gen_random_uuid(), 'a3e31f1d-de71-4df6-a851-988a95df19ff', 'Wave-Particle Duality', 'Physics', 'beginner', 'Light and matter exhibit both wave-like and particle-like properties.'),
    (gen_random_uuid(), 'a3e31f1d-de71-4df6-a851-988a95df19ff', 'Schrödinger Equation', 'Physics', 'intermediate', 'The fundamental equation of quantum mechanics describing how the quantum state of a physical system changes with time.'),
    (gen_random_uuid(), 'a3e31f1d-de71-4df6-a851-988a95df19ff', 'Quantum Entanglement', 'Physics', 'advanced', 'A physical phenomenon where particles become correlated in such a way that the state of one cannot be described independently of the others.'),
    (gen_random_uuid(), 'a3e31f1d-de71-4df6-a851-988a95df19ff', 'Uncertainty Principle', 'Physics', 'beginner', 'Heisenberg principle stating that certain pairs of physical properties cannot be known simultaneously to arbitrary precision.'),
    (gen_random_uuid(), 'a3e31f1d-de71-4df6-a851-988a95df19ff', 'Superposition', 'Physics', 'intermediate', 'A principle of quantum mechanics that states a physical system exists in all its theoretically possible states simultaneously.');

-- 2. Progress for Students
-- Student 1: Test User
INSERT INTO public.progress (user_id, course_id, mastery, daily_streak, hours_spent)
VALUES ('ebcc1071-beac-4403-ac6e-f289b9912cc1', 'a3e31f1d-de71-4df6-a851-988a95df19ff', 0.65, 5, 12.5);

-- Student 2: V2 Student A
INSERT INTO public.progress (user_id, course_id, mastery, daily_streak, hours_spent)
VALUES ('7ef85bff-ed97-4fb5-9941-bb3feefaa857', 'a3e31f1d-de71-4df6-a851-988a95df19ff', 0.12, 1, 2.0);

-- Student 3: V2 Student B
INSERT INTO public.progress (user_id, course_id, mastery, daily_streak, hours_spent)
VALUES ('42541f97-5c12-4e56-b07a-728955424448', 'a3e31f1d-de71-4df6-a851-988a95df19ff', 0.88, 14, 45.0);

-- 3. Learner Profiles (Rich Data for Analytics)
-- Student 1: High growth, but has misconceptions about wave-particle duality
INSERT INTO public.learner_profiles (user_id, mastery_state, behavior_signals, risk_summary, kpi_history, misconception_summary)
VALUES (
    'ebcc1071-beac-4403-ac6e-f289b9912cc1',
    '{"Physics": 0.65}',
    '{"focus_score": 85, "consistency": "high"}',
    '{"risk_level": "low"}',
    '[
        {"date": "2026-03-01", "mastery": 0.1},
        {"date": "2026-03-05", "mastery": 0.3},
        {"date": "2026-03-10", "mastery": 0.5},
        {"date": "2026-03-15", "mastery": 0.65}
    ]',
    '{"topic": "Wave-Particle Duality", "label": "Confusing partial waves with particle paths"}'
);

-- Student 2: Struggling, high risk
INSERT INTO public.learner_profiles (user_id, mastery_state, behavior_signals, risk_summary, kpi_history, misconception_summary)
VALUES (
    '7ef85bff-ed97-4fb5-9941-bb3feefaa857',
    '{"Physics": 0.12}',
    '{"focus_score": 30, "consistency": "low"}',
    '{"risk_level": "high", "reasons": ["Low activity", "Low quiz scores"]}',
    '[
        {"date": "2026-03-01", "mastery": 0.1},
        {"date": "2026-03-10", "mastery": 0.11},
        {"date": "2026-03-15", "mastery": 0.12}
    ]',
    '{"topic": "Uncertainty Principle", "label": "Assuming it is an experimental measurement limitation"}'
);

-- Student 3: Top performer, ready for advanced topics
INSERT INTO public.learner_profiles (user_id, mastery_state, behavior_signals, risk_summary, kpi_history, misconception_summary)
VALUES (
    '42541f97-5c12-4e56-b07a-728955424448',
    '{"Physics": 0.88}',
    '{"focus_score": 95, "consistency": "exceptional"}',
    '{"risk_level": "low"}',
    '[
        {"date": "2026-03-01", "mastery": 0.4},
        {"date": "2026-03-05", "mastery": 0.6},
        {"date": "2026-03-10", "mastery": 0.8},
        {"date": "2026-03-15", "mastery": 0.88}
    ]',
    '{}'
);

COMMIT;
