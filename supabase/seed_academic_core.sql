-- Seed academic core data (assignments, submissions, attendance, materials)

-- 1) Ensure batches exist for each department
INSERT INTO public.batches (college_id, dept_id, year, label, sections, current_semester)
SELECT d.institution_id, d.id, 2023, '2023-27', ARRAY['A','B'], 3
FROM public.departments d
WHERE NOT EXISTS (
  SELECT 1 FROM public.batches b WHERE b.dept_id = d.id
);

-- 2) Attach students to batches (if missing)
UPDATE public.users u
SET batch_id = b.id,
    section = COALESCE(u.section, 'A'),
    student_roll = COALESCE(u.student_roll, 'ROLL' || substring(u.id::text, 1, 5))
FROM public.batches b
WHERE u.role = 'student'
  AND u.batch_id IS NULL
  AND u.dept_id = b.dept_id;

-- 3) Create one assignment per course (if not exists)
WITH course_teacher AS (
  SELECT
    c.id AS course_id,
    COALESCE(ta.teacher_id, c.teacher_id) AS teacher_id,
    c.department_id AS dept_id
  FROM public.courses c
  LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id
)
INSERT INTO public.assignments (course_id, teacher_id, batch_id, section, title, description, due_date, max_marks)
SELECT
  ct.course_id,
  ct.teacher_id,
  b.id AS batch_id,
  'A' AS section,
  'Assignment 1: Core Concepts',
  'Solve the attached problems based on recent lectures.',
  now() + interval '7 days',
  20
FROM course_teacher ct
JOIN public.batches b ON b.dept_id = ct.dept_id
WHERE ct.teacher_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.assignments a WHERE a.course_id = ct.course_id
  );

-- 4) Submissions for top 3 students per course
WITH ranked_students AS (
  SELECT
    a.id AS assignment_id,
    c.department_id AS dept_id,
    u.id AS student_id,
    row_number() OVER (PARTITION BY a.id ORDER BY u.created_at) AS rn
  FROM public.assignments a
  JOIN public.courses c ON c.id = a.course_id
  JOIN public.users u ON u.role = 'student' AND u.dept_id = c.department_id
)
INSERT INTO public.submissions (assignment_id, assignment_uuid, student_id, student_uuid, status, submitted_at, marks, feedback, graded_at)
SELECT
  rs.assignment_id::text,
  rs.assignment_id,
  rs.student_id::text,
  rs.student_id,
  'graded',
  now() - interval '1 day',
  17,
  'Good work. Keep it up.',
  now() - interval '1 day'
FROM ranked_students rs
WHERE rs.rn <= 3
  AND NOT EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.assignment_uuid = rs.assignment_id
      AND s.student_uuid = rs.student_id
  );

-- 5) Attendance for top 3 students per course over last 3 days
WITH course_teacher AS (
  SELECT
    c.id AS course_id,
    COALESCE(ta.teacher_id, c.teacher_id) AS teacher_id,
    c.department_id AS dept_id
  FROM public.courses c
  LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id
),
ranked_students AS (
  SELECT
    u.id AS student_id,
    u.dept_id,
    u.batch_id,
    u.section,
    row_number() OVER (PARTITION BY u.dept_id ORDER BY u.created_at) AS rn
  FROM public.users u
  WHERE u.role = 'student'
),
dates AS (
  SELECT (current_date - offs) AS class_date
  FROM generate_series(0, 2) AS offs
)
INSERT INTO public.attendance (course_id, teacher_id, student_id, batch_id, section, class_date, is_present)
SELECT
  ct.course_id,
  ct.teacher_id,
  rs.student_id,
  COALESCE(rs.batch_id, b.id),
  COALESCE(rs.section, 'A'),
  d.class_date,
  (random() > 0.2)
FROM course_teacher ct
JOIN public.batches b ON b.dept_id = ct.dept_id
JOIN ranked_students rs ON rs.dept_id = ct.dept_id AND rs.rn <= 3
CROSS JOIN dates d
WHERE ct.teacher_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.attendance a
    WHERE a.course_id = ct.course_id
      AND a.student_id = rs.student_id
      AND a.class_date = d.class_date
  );

-- 6) Course materials (one syllabus + one notes per course)
INSERT INTO public.course_materials (course_id, teacher_id, title, type, link_url)
SELECT
  c.id,
  COALESCE(ta.teacher_id, c.teacher_id),
  'Syllabus',
  'syllabus',
  'https://placeholder.lumina.app/syllabus.pdf'
FROM public.courses c
LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id
WHERE COALESCE(ta.teacher_id, c.teacher_id) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.course_materials m WHERE m.course_id = c.id AND m.type = 'syllabus'
  );

INSERT INTO public.course_materials (course_id, teacher_id, title, type, link_url)
SELECT
  c.id,
  COALESCE(ta.teacher_id, c.teacher_id),
  'Lecture Notes',
  'notes',
  'https://placeholder.lumina.app/notes.pdf'
FROM public.courses c
LEFT JOIN public.teacher_assignments ta ON ta.course_id = c.id
WHERE COALESCE(ta.teacher_id, c.teacher_id) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.course_materials m WHERE m.course_id = c.id AND m.type = 'notes'
  );
