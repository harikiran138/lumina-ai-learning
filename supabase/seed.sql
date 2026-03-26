DO $$
DECLARE
    v_inst_id UUID := gen_random_uuid();
    v_admin_id UUID := gen_random_uuid();
    v_password_hash TEXT;
    
    dept_names TEXT[] := ARRAY['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
    d_name TEXT;
    d_id UUID;
    v_prog_id UUID;
    v_hod_id UUID;
    
    v_sem_ids UUID[];
    v_sem_id UUID;
    v_class_id UUID;
    v_teacher_id UUID;
    v_student_id UUID;
    v_course_id UUID;
    
    sem_idx INT;
    t_idx INT;
    y_idx INT;
    s_idx INT;
    sec_name TEXT;
    
    v_role_admin UUID;
    v_role_hod UUID;
    v_role_teacher UUID;
    v_role_student UUID;
BEGIN
    SELECT id INTO v_role_admin FROM roles WHERE name = 'admin';
    SELECT id INTO v_role_hod FROM roles WHERE name = 'hod';
    SELECT id INTO v_role_teacher FROM roles WHERE name = 'teacher';
    SELECT id INTO v_role_student FROM roles WHERE name = 'student';

    v_password_hash := extensions.crypt('password', extensions.gen_salt('bf'));

    INSERT INTO institutions (id, institution_name, email, onboarding_status)
    VALUES (v_inst_id, 'NSRIT (Mass Test ' || (random()*1000)::int || ')', 'admin_mass@nsrit.edu', 'COMPLETED');

    INSERT INTO institution_details (institution_id, established_year, type, status, address, city, state, country)
    VALUES (v_inst_id, 2008, 'Private', 'Autonomous', 'Visakhapatnam, AP', 'Vizag', 'AP', 'India');

    -- Admin
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_mass@nsrit.edu', v_password_hash, now(), '{"provider": "email"}', '{"role": "admin"}', now(), now());
    
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    VALUES (gen_random_uuid(), v_admin_id, v_admin_id, format('{"sub":"%s","email":"%s"}', v_admin_id, 'admin_mass@nsrit.edu')::jsonb, 'email', now(), now());

    INSERT INTO public.users (id, name, email, role, password_hash)
    VALUES (v_admin_id, 'Main Admin (Test)', 'admin_mass@nsrit.edu', 'admin', v_password_hash);

    INSERT INTO user_roles (user_id, role_id, institution_id) VALUES (v_admin_id, v_role_admin, v_inst_id);

    FOR i IN 1..array_length(dept_names, 1) LOOP
        d_name := dept_names[i];
        d_id := gen_random_uuid();
        
        -- Dept
        INSERT INTO departments (id, institution_id, department_name)
        VALUES (d_id, v_inst_id, d_name || ' Test');
        
        -- HOD
        v_hod_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (v_hod_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', lower(d_name) || '_hod_mass@nsrit.edu', v_password_hash, now(), '{"provider": "email"}', '{"role": "hod"}', now(), now());
        
        INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
        VALUES (gen_random_uuid(), v_hod_id, v_hod_id, format('{"sub":"%s","email":"%s"}', v_hod_id, lower(d_name) || '_hod_mass@nsrit.edu')::jsonb, 'email', now(), now());

        INSERT INTO public.users (id, name, email, role, department_id, password_hash)
        VALUES (v_hod_id, 'HOD ' || d_name || ' Test', lower(d_name) || '_hod_mass@nsrit.edu', 'hod', d_id, v_password_hash);

        INSERT INTO user_roles (user_id, role_id, institution_id) VALUES (v_hod_id, v_role_hod, v_inst_id);
        UPDATE departments SET hod_id = v_hod_id WHERE id = d_id;

        -- Program
        v_prog_id := gen_random_uuid();
        INSERT INTO programs (id, institution_id, department_id, program_name, degree, level, duration_years, intake)
        VALUES (v_prog_id, v_inst_id, d_id, 'B.Tech ' || d_name || ' Test', 'B.Tech', 'UG', 4, 60);

        v_sem_ids := ARRAY[]::UUID[];
        FOR sem_idx IN 1..8 LOOP
            v_sem_id := gen_random_uuid();
            v_sem_ids := array_append(v_sem_ids, v_sem_id);
            INSERT INTO semesters (id, program_id, semester_number, title)
            VALUES (v_sem_id, v_prog_id, sem_idx, 'Semester ' || sem_idx);

            FOR t_idx IN 1..6 LOOP
                v_teacher_id := gen_random_uuid();
                INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
                VALUES (v_teacher_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', lower(d_name) || '_mass_t' || sem_idx || '_' || t_idx || '_' || floor(random()*9999)::int || '@nsrit.edu', v_password_hash, now(), '{"provider": "email"}', '{"role": "teacher"}', now(), now());
                
                INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
                VALUES (gen_random_uuid(), v_teacher_id, v_teacher_id, format('{"sub":"%s","email":"%s"}', v_teacher_id, lower(d_name) || '_mass_t' || sem_idx || '_' || t_idx || '@nsrit.edu')::jsonb, 'email', now(), now());

                INSERT INTO public.users (id, name, email, role, department_id, password_hash)
                VALUES (v_teacher_id, 'Teacher ' || d_name || ' Sem' || sem_idx || '-' || t_idx, lower(d_name) || '_mass_t' || sem_idx || '_' || t_idx || '_' || floor(random()*9999)::int || '@nsrit.edu', 'teacher', d_id, v_password_hash);
                
                INSERT INTO user_roles (user_id, role_id, institution_id) VALUES (v_teacher_id, v_role_teacher, v_inst_id);

                v_course_id := gen_random_uuid();
                INSERT INTO courses (id, program_id, semester_id, department_id, teacher_id, course_code, course_name, name, credits, category)
                VALUES (v_course_id, v_prog_id, v_sem_id, d_id, v_teacher_id, d_name || 'M' || sem_idx || t_idx, 'Mass Subject ' || t_idx, 'Mass Subject Name ' || t_idx, 3, 'Core');
            END LOOP;
        END LOOP;

        FOR y_idx IN 1..4 LOOP
            FOREACH sec_name IN ARRAY ARRAY['A', 'B'] LOOP
                v_class_id := gen_random_uuid();
                INSERT INTO classes (id, program_id, department_id, semester_id, section_name, academic_year, batch_name, batch_year)
                VALUES (v_class_id, v_prog_id, d_id, v_sem_ids[(2*y_idx - 1)], sec_name, '2023-24', 'Batch ' || (2023 - y_idx + 1), (2023 - y_idx + 1)::text || '-' || (2027 - y_idx + 1)::text);
            END LOOP;
        END LOOP;
    END LOOP;

    FOR s_idx IN 1..5000 LOOP
        v_student_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (v_student_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student_mass' || s_idx || '_' || floor(random()*9999)::int || '@nsrit.edu', v_password_hash, now(), '{"provider": "email"}', '{"role": "student"}', now(), now());
        
        INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
        VALUES (gen_random_uuid(), v_student_id, v_student_id, format('{"sub":"%s","email":"%s"}', v_student_id, 'student_mass' || s_idx || '@nsrit.edu')::jsonb, 'email', now(), now());

        INSERT INTO public.users (id, name, email, role, password_hash)
        VALUES (v_student_id, 'Student Mass ' || s_idx, 'student_mass' || s_idx || '_' || floor(random()*9999)::int || '@nsrit.edu', 'student', v_password_hash);
        
        INSERT INTO user_roles (user_id, role_id, institution_id) VALUES (v_student_id, v_role_student, v_inst_id);
    END LOOP;
    
    INSERT INTO student_enrollments (id, student_id, class_id, program_id, current_semester_id, year_of_study, status)
    SELECT gen_random_uuid(), u.id, cl.id, cl.program_id, cl.semester_id, 1, 'active'
    FROM public.users u
    CROSS JOIN LATERAL (
        SELECT id, program_id, semester_id FROM classes WHERE program_id IN (SELECT id FROM programs WHERE institution_id = v_inst_id) ORDER BY random() LIMIT 1
    ) cl
    WHERE u.role = 'student' AND u.id IN (SELECT user_id FROM user_roles WHERE institution_id = v_inst_id);

    INSERT INTO teacher_assignments (id, teacher_id, course_id, class_id, is_primary)
    SELECT gen_random_uuid(), c.teacher_id, c.id, cl.id, TRUE
    FROM courses c
    JOIN departments d ON d.id = c.department_id
    CROSS JOIN LATERAL (
        SELECT id FROM classes cl WHERE cl.department_id = d.id ORDER BY random() LIMIT 1
    ) cl
    WHERE d.institution_id = v_inst_id;
    
    INSERT INTO student_subjects (student_id, subject_id)
    SELECT se.student_id, cr.id
    FROM student_enrollments se
    JOIN public.users u ON u.id = se.student_id
    CROSS JOIN LATERAL (
        SELECT id FROM courses cr WHERE cr.program_id = se.program_id ORDER BY random() LIMIT 5
    ) cr
    WHERE u.id IN (SELECT user_id FROM user_roles WHERE institution_id = v_inst_id)
    ON CONFLICT DO NOTHING;

END $$;
