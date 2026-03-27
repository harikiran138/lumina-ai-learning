-- Academic core tables for Lumina spec alignment

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id),
  teacher_id uuid REFERENCES public.users(id),
  batch_id uuid REFERENCES public.batches(id),
  section text,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  max_marks integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Extend submissions for FK-based integrity (keep legacy columns)
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS assignment_uuid uuid REFERENCES public.assignments(id),
ADD COLUMN IF NOT EXISTS student_uuid uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS content_url text,
ADD COLUMN IF NOT EXISTS text_content text,
ADD COLUMN IF NOT EXISTS marks integer,
ADD COLUMN IF NOT EXISTS graded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_uuid ON public.submissions(assignment_uuid);
CREATE INDEX IF NOT EXISTS idx_submissions_student_uuid ON public.submissions(student_uuid);

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  teacher_id uuid NOT NULL REFERENCES public.users(id),
  student_id uuid NOT NULL REFERENCES public.users(id),
  batch_id uuid NOT NULL REFERENCES public.batches(id),
  section text NOT NULL,
  class_date date NOT NULL,
  is_present boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id, class_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON public.attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);

-- Course materials
CREATE TABLE IF NOT EXISTS public.course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  teacher_id uuid NOT NULL REFERENCES public.users(id),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'notes' CHECK (type IN ('syllabus','notes','reference','lab_manual')),
  file_url text,
  link_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON public.course_materials(course_id);
