-- 1. Create HOD role in auth (handled by app logic, but good to have a placeholder if using custom roles table)

-- 2. Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    hod_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Link programs to departments
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 4. Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 5. Link users to departments
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 6. Basic RLS Policies for Departments
CREATE POLICY "Public read for authenticated users" ON public.departments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access" ON public.departments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 7. Seed Sample Departments for Verified Institute of Technology
-- Institution ID: 3d9a0e0a-7d72-4251-9b79-09382bc732be

INSERT INTO public.departments (institution_id, name, description)
VALUES 
('3d9a0e0a-7d72-4251-9b79-09382bc732be', 'Computer Science and Engineering', 'Department of CSE focusing on AI and Software Engineering.'),
('3d9a0e0a-7d72-4251-9b79-09382bc732be', 'Electronics and Communication Engineering', 'Department of ECE focusing on VLSI and Robotics.'),
('3d9a0e0a-7d72-4251-9b79-09382bc732be', 'Mechanical Engineering', 'Department of Mechanical focusing on Aerospace and Thermodynamics.')
ON CONFLICT DO NOTHING;

-- 8. Assign an HOD for CSE (teacher1@lumina.com)
-- Teacher ID: 4f71dfd4-f02e-4d8c-9444-6fd6a140214f

UPDATE public.users SET role = 'hod', department_id = (SELECT id FROM public.departments WHERE name = 'Computer Science and Engineering' LIMIT 1)
WHERE id = '4f71dfd4-f02e-4d8c-9444-6fd6a140214f';

UPDATE public.departments SET hod_id = '4f71dfd4-f02e-4d8c-9444-6fd6a140214f'
WHERE name = 'Computer Science and Engineering';

-- 9. Assign other teachers to CSE Department
UPDATE public.users SET department_id = (SELECT id FROM public.departments WHERE name = 'Computer Science and Engineering' LIMIT 1)
WHERE email IN ('teacher2@lumina.com', 'teacher3@lumina.com', 'teacher4@lumina.com');
