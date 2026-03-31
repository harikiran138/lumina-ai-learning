-- Migration 015: Remaining functional modules

-- Video Analytics
CREATE TABLE IF NOT EXISTS public.video_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id),
  video_url text NOT NULL,
  transcript text,
  summary text,
  key_concepts jsonb DEFAULT '[]'::jsonb,
  institution_id uuid REFERENCES public.institutions(id),
  created_at timestamptz DEFAULT now()
);

-- AI Flashcards (FSRS-based)
CREATE TABLE IF NOT EXISTS public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id),
  question text NOT NULL,
  answer text NOT NULL,
  concept_id text, -- link back to knowledge graph
  institution_id uuid REFERENCES public.institutions(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_flashcard_progress (
  student_id uuid REFERENCES public.users(id),
  flashcard_id uuid REFERENCES public.flashcards(id),
  stability float DEFAULT 0.0,
  difficulty float DEFAULT 0.0,
  elapsed_days integer DEFAULT 0,
  scheduled_days integer DEFAULT 0,
  last_review timestamptz,
  next_review timestamptz DEFAULT now(),
  state integer DEFAULT 0, -- 0=New, 1=Learning, 2=Review, 3=Relearning
  PRIMARY KEY (student_id, flashcard_id)
);

-- Student Risk Analysis
CREATE TABLE IF NOT EXISTS public.student_risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.users(id),
  risk_score float NOT NULL, -- 0.0 to 100.0
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  reasons jsonb DEFAULT '[]'::jsonb, -- e.g. ["Low attendance: 40%", "Declining test scores"]
  detected_at timestamptz DEFAULT now(),
  institution_id uuid REFERENCES public.institutions(id)
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  subject text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category text, -- e.g. "technical", "academic", "billing"
  institution_id uuid REFERENCES public.institutions(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance and scoping
CREATE INDEX IF NOT EXISTS idx_video_analyses_institution ON public.video_analyses(institution_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_institution ON public.flashcards(institution_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_student ON public.student_risk_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_institution ON public.student_risk_scores(institution_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_institution ON public.support_tickets(institution_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
