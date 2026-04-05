-- LUMINA ACADEMIC FORMALIZATION MIGRATION
-- Migration 014

-- 1. Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "2025-26"
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Formal Sections Table (Refinement of Classes/Batches)
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "A", "B", "C"
    room_number TEXT,
    capacity INT DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, name)
);

-- 3. Update Batches to link to Academic Years
ALTER TABLE batches ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- 4. Update Classes (Legacy) to link to formal Sections and Academic Years
-- Note: 'classes' in this project often represents a Section.
ALTER TABLE classes ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- 5. Student Enrollment Refinement
-- Many students are already in student_enrollments. Let's ensure it links to the hierarchy.
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- 6. Teacher Assignment Refinement
ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- 7. Course Section Mapping
-- Which course is taught in which section?
CREATE TABLE IF NOT EXISTS course_section_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE(course_id, section_id, academic_year_id)
);

-- 8. Enable RLS
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_section_mapping ENABLE ROW LEVEL SECURITY;

-- 9. Basic RLS Policies
CREATE POLICY "Anyone can view academic years" ON academic_years FOR SELECT USING (true);
CREATE POLICY "Anyone can view sections" ON sections FOR SELECT USING (true);
CREATE POLICY "Anyone can view course mappings" ON course_section_mapping FOR SELECT USING (true);

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_sections_batch ON sections(batch_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_section ON student_enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_section ON teacher_assignments(section_id);
