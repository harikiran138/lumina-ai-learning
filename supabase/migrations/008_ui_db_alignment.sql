-- Align UI/UX payloads with legacy course/class fields

-- 1) Courses: keep title/code/course_name/course_code in sync
CREATE OR REPLACE FUNCTION public.sync_course_fields() RETURNS trigger AS $$
BEGIN
  NEW.course_name := COALESCE(NEW.course_name, NEW.title, NEW.name);
  NEW.title := COALESCE(NEW.title, NEW.course_name, NEW.name);
  NEW.course_code := COALESCE(NEW.course_code, NEW.code);
  NEW.code := COALESCE(NEW.code, NEW.course_code);
  NEW.name := COALESCE(NEW.name, NEW.course_name, NEW.title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courses_sync_fields ON public.courses;
CREATE TRIGGER courses_sync_fields
BEFORE INSERT OR UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.sync_course_fields();

-- Backfill existing rows
UPDATE public.courses
SET
  course_name = COALESCE(course_name, title, name),
  title = COALESCE(title, course_name, name),
  course_code = COALESCE(course_code, code),
  code = COALESCE(code, course_code),
  name = COALESCE(name, course_name, title)
WHERE
  course_name IS NULL OR title IS NULL OR course_code IS NULL OR code IS NULL OR name IS NULL;

-- 2) Classes: sync section_name/batch_name with class_name/batch/section
CREATE OR REPLACE FUNCTION public.sync_class_fields() RETURNS trigger AS $$
BEGIN
  NEW.section_name := COALESCE(NEW.section_name, NEW.class_name, NEW.section);
  NEW.class_name := COALESCE(NEW.class_name, NEW.section_name);
  NEW.batch_name := COALESCE(NEW.batch_name, NEW.batch, NEW.batch_year);
  NEW.batch := COALESCE(NEW.batch, NEW.batch_name);
  NEW.section := COALESCE(NEW.section, NEW.section_name);
  NEW.academic_year := COALESCE(NEW.academic_year, NEW.batch_year, NEW.batch_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS classes_sync_fields ON public.classes;
CREATE TRIGGER classes_sync_fields
BEFORE INSERT OR UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.sync_class_fields();

-- Backfill existing rows
UPDATE public.classes
SET
  section_name = COALESCE(section_name, class_name, section),
  class_name = COALESCE(class_name, section_name),
  batch_name = COALESCE(batch_name, batch, batch_year),
  batch = COALESCE(batch, batch_name),
  section = COALESCE(section, section_name),
  academic_year = COALESCE(academic_year, batch_year, batch_name)
WHERE
  section_name IS NULL OR class_name IS NULL OR batch_name IS NULL OR batch IS NULL OR section IS NULL OR academic_year IS NULL;
