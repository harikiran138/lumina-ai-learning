-- Step 1: Create semesters table
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    title TEXT, -- e.g., 'Semester 1'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(program_id, semester_number)
);

-- Step 2: Link courses to semesters (if not already linked)
-- Checking if courses table needs a semester_id
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;

-- Step 3: Create student enrollment tracking
-- This maps a student to their specific program and current semester
CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    current_semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    year_of_study INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, program_id)
);

-- Step 4: Seed some initial Semester data for existing programs
-- This is a helper for initial setup
INSERT INTO public.semesters (program_id, semester_number, title)
SELECT id, s, 'Semester ' || s
FROM public.programs, generate_series(1, 8) AS s
ON CONFLICT DO NOTHING;

-- Step 5: Enable RLS (standard practice for Lumina)
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- Simple policies for authenticated users
CREATE POLICY "Allow public read of semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Allow users to view their own enrollments" ON public.student_enrollments FOR SELECT USING (auth.uid() = student_id);
