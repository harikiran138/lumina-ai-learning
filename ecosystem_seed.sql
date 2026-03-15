-- Lumina AI Learning Ecosystem Seed Script
-- Make sure pgcrypto is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;
BEGIN;

-- 1. Create Users

    INSERT INTO public.users (id, email, password_hash, name, role, is_active)
    VALUES ('5e182ac2-f557-43e0-83fb-b74a4c22ceb0', 'admin.system@lumina.com', crypt('Admin@123', gen_salt('bf')), 'System Admin', 'admin', true)
    ON CONFLICT (email) DO NOTHING;
    

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('a5cecbf2-7278-481a-a231-07d511c55225', 'teacher1@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 1', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('aa3a6a26-bb4e-4a91-a90a-ac06bf9878bc', 'teacher2@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 2', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('18389d70-3573-4706-aa4d-263520282899', 'teacher3@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 3', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('9fbbea56-3c69-4790-bbde-2dd67ce18650', 'teacher4@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 4', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('2d55f81f-8a3b-4982-a969-08cbacadacb3', 'teacher5@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 5', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('bdc522e5-c26a-4cc9-b755-0b96ec855624', 'teacher6@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 6', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('7b375c7e-0133-45b6-b319-2c6992e9b001', 'teacher7@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 7', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('de35ec31-2519-4377-b3a6-430dd9f640d3', 'teacher8@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 8', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('76f444bd-a006-42b9-b6df-8068c3e521f0', 'teacher9@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 9', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('34887d0b-1ee5-4c27-9bfc-72b6474fcce6', 'teacher10@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 10', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('053cc264-0a8d-47b2-aae7-5b516789d50f', 'student1@lumina.com', crypt('student123', gen_salt('bf')), 'Student 1', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('1a85322d-290b-4a8e-826c-6f07892f583a', 'student2@lumina.com', crypt('student123', gen_salt('bf')), 'Student 2', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('a4cc8ae8-b5d4-457f-aca5-9ce6cd109797', 'student3@lumina.com', crypt('student123', gen_salt('bf')), 'Student 3', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('82994067-09ca-4393-82dc-54b2b2e591a2', 'student4@lumina.com', crypt('student123', gen_salt('bf')), 'Student 4', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('4d1d5025-dafb-4722-add8-72c26dc7e408', 'student5@lumina.com', crypt('student123', gen_salt('bf')), 'Student 5', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('edd398f7-40a1-4ef9-b565-dcdf711dca6f', 'student6@lumina.com', crypt('student123', gen_salt('bf')), 'Student 6', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('3a76efbe-69d8-4a68-94bc-fe7e9731776c', 'student7@lumina.com', crypt('student123', gen_salt('bf')), 'Student 7', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('361bb263-ce86-473a-8571-43200b7ef1f5', 'student8@lumina.com', crypt('student123', gen_salt('bf')), 'Student 8', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('85e571ff-5ac7-4c40-b352-47afe70b2b97', 'student9@lumina.com', crypt('student123', gen_salt('bf')), 'Student 9', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('dd036ca9-2547-4ff9-bbe5-7b87e1d6b517', 'student10@lumina.com', crypt('student123', gen_salt('bf')), 'Student 10', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('6c890993-f261-44be-bed7-26953caf7583', 'student11@lumina.com', crypt('student123', gen_salt('bf')), 'Student 11', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('d6404b0a-dc56-4f7b-a350-af8e22f7981a', 'student12@lumina.com', crypt('student123', gen_salt('bf')), 'Student 12', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('a0af060c-7d47-4d95-b2a6-eec52350d8d4', 'student13@lumina.com', crypt('student123', gen_salt('bf')), 'Student 13', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('e526cfef-2d3e-4f05-8003-22397c2eb863', 'student14@lumina.com', crypt('student123', gen_salt('bf')), 'Student 14', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('d2d42358-77a0-4a36-8896-27a6ab775f03', 'student15@lumina.com', crypt('student123', gen_salt('bf')), 'Student 15', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('3e3247d6-d6bf-4f27-a22f-e8da6f7ffe92', 'student16@lumina.com', crypt('student123', gen_salt('bf')), 'Student 16', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('8c609668-5e97-4656-8925-2ce78d6a8e2c', 'student17@lumina.com', crypt('student123', gen_salt('bf')), 'Student 17', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('02db39e8-18ca-4e49-9267-98412d009403', 'student18@lumina.com', crypt('student123', gen_salt('bf')), 'Student 18', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('299e3dee-d251-4ab4-8439-27e32fe3ca8b', 'student19@lumina.com', crypt('student123', gen_salt('bf')), 'Student 19', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('cdd133ff-8008-4d17-a042-64afb90832b9', 'student20@lumina.com', crypt('student123', gen_salt('bf')), 'Student 20', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('1819f59d-2e4d-49ab-a115-c436cf537a66', 'student21@lumina.com', crypt('student123', gen_salt('bf')), 'Student 21', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('e880d000-386d-43d0-adae-27eade65d1c9', 'student22@lumina.com', crypt('student123', gen_salt('bf')), 'Student 22', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('dbbfdd56-a906-4d76-8dee-54bda8882744', 'student23@lumina.com', crypt('student123', gen_salt('bf')), 'Student 23', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('36a6d1d0-69d6-48e5-9108-044e5ca47f53', 'student24@lumina.com', crypt('student123', gen_salt('bf')), 'Student 24', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('528a19da-0459-41eb-821a-2781f5c1c0c3', 'student25@lumina.com', crypt('student123', gen_salt('bf')), 'Student 25', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('601d2003-b9d4-4b31-8303-d115186d3575', 'student26@lumina.com', crypt('student123', gen_salt('bf')), 'Student 26', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('20f1b5d9-2941-4a80-a893-01f0d3c37744', 'student27@lumina.com', crypt('student123', gen_salt('bf')), 'Student 27', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('d0c9d02e-d5dc-48e0-a5a0-8cb35da34496', 'student28@lumina.com', crypt('student123', gen_salt('bf')), 'Student 28', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('7a1b0b43-1c78-433d-b4ad-4e4c55a67bb1', 'student29@lumina.com', crypt('student123', gen_salt('bf')), 'Student 29', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('59e47765-e1ce-427e-816b-482201bf2fb4', 'student30@lumina.com', crypt('student123', gen_salt('bf')), 'Student 30', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('4c8edccf-fb6f-41e1-b01a-8ae78b56a3b3', 'student31@lumina.com', crypt('student123', gen_salt('bf')), 'Student 31', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('441d8b44-9d91-4ac6-9d1e-1f08bd82af26', 'student32@lumina.com', crypt('student123', gen_salt('bf')), 'Student 32', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('51dc5266-7a54-4cb8-a1f9-cd39ee98561f', 'student33@lumina.com', crypt('student123', gen_salt('bf')), 'Student 33', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('8452d0e5-f3ef-4f8d-bcc9-e635a43b7d6a', 'student34@lumina.com', crypt('student123', gen_salt('bf')), 'Student 34', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('4e67e0ab-f5f8-4473-9ddd-c7ee977f55d4', 'student35@lumina.com', crypt('student123', gen_salt('bf')), 'Student 35', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('581008d4-c7c6-4db7-87d2-31c14541e461', 'student36@lumina.com', crypt('student123', gen_salt('bf')), 'Student 36', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('5f9925b9-99a7-4089-b3ac-5c5bca4c5124', 'student37@lumina.com', crypt('student123', gen_salt('bf')), 'Student 37', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('f6e10f1e-5170-4b7a-9c5c-d0f5e26c1e26', 'student38@lumina.com', crypt('student123', gen_salt('bf')), 'Student 38', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('96dd2f22-3157-467b-81ad-37b8f3541d1d', 'student39@lumina.com', crypt('student123', gen_salt('bf')), 'Student 39', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('d59e980c-c13b-41a2-981a-df3e600927b9', 'student40@lumina.com', crypt('student123', gen_salt('bf')), 'Student 40', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('d539fc5a-8543-4a86-ba67-f7daa4fec61f', 'student41@lumina.com', crypt('student123', gen_salt('bf')), 'Student 41', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('18daf791-02e0-44a6-a707-6cda16f6b46f', 'student42@lumina.com', crypt('student123', gen_salt('bf')), 'Student 42', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('f50b4abc-2afe-45f2-8fe0-7ba744a0e19d', 'student43@lumina.com', crypt('student123', gen_salt('bf')), 'Student 43', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('987ada41-ced4-4b80-ac3b-019212392574', 'student44@lumina.com', crypt('student123', gen_salt('bf')), 'Student 44', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('afe28730-19bb-47bf-bea3-256e421482db', 'student45@lumina.com', crypt('student123', gen_salt('bf')), 'Student 45', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('f3746a71-6e34-4795-a894-76d7e4fec553', 'student46@lumina.com', crypt('student123', gen_salt('bf')), 'Student 46', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('79467c17-1bf3-4e59-bdef-62389f43d81c', 'student47@lumina.com', crypt('student123', gen_salt('bf')), 'Student 47', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('42d0604e-294f-4058-b4b8-573349ce3292', 'student48@lumina.com', crypt('student123', gen_salt('bf')), 'Student 48', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('983f5793-77f4-4cd7-bb01-b6f410eeadd1', 'student49@lumina.com', crypt('student123', gen_salt('bf')), 'Student 49', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('987d9092-5443-4f78-92cb-431a544e8f61', 'student50@lumina.com', crypt('student123', gen_salt('bf')), 'Student 50', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

-- 2. Create Courses, Modules, and Lessons

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', 'Course 1 by Teacher 1: Intro to Computer_science', 'SUBJ-01', 'A comprehensive intermediate guide to computer_science.', 'a5cecbf2-7278-481a-a231-07d511c55225', true, 'computer_science', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('c60d131c-dcab-41c0-a8b4-6828ca09e2c0', 'Course 2 by Teacher 1: Intro to Design', 'SUBJ-02', 'A comprehensive advanced guide to design.', 'a5cecbf2-7278-481a-a231-07d511c55225', true, 'design', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('b2131724-bca1-4ed3-a645-a671955a7f98', 'Course 1 by Teacher 2: Intro to Physics', 'SUBJ-11', 'A comprehensive intermediate guide to physics.', 'aa3a6a26-bb4e-4a91-a90a-ac06bf9878bc', true, 'physics', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('e1f1a041-ba60-41e4-a470-b974b0970c34', 'Course 2 by Teacher 2: Intro to Mathematics', 'SUBJ-12', 'A comprehensive intermediate guide to mathematics.', 'aa3a6a26-bb4e-4a91-a90a-ac06bf9878bc', true, 'mathematics', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('9839811f-cbdf-4416-9a9c-b8cc87953991', 'Course 1 by Teacher 3: Intro to Mathematics', 'SUBJ-21', 'A comprehensive intermediate guide to mathematics.', '18389d70-3573-4706-aa4d-263520282899', true, 'mathematics', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('97960fea-531d-4d4f-aed0-bf8b0f3bc888', 'Course 2 by Teacher 3: Intro to Computer_science', 'SUBJ-22', 'A comprehensive beginner guide to computer_science.', '18389d70-3573-4706-aa4d-263520282899', true, 'computer_science', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('65bcbab0-a6c1-4f16-91af-ba939932e468', 'Course 1 by Teacher 4: Intro to Physics', 'SUBJ-31', 'A comprehensive intermediate guide to physics.', '9fbbea56-3c69-4790-bbde-2dd67ce18650', true, 'physics', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('aa81c026-694b-40f0-9bd1-bb8713635a24', 'Course 2 by Teacher 4: Intro to Physics', 'SUBJ-32', 'A comprehensive advanced guide to physics.', '9fbbea56-3c69-4790-bbde-2dd67ce18650', true, 'physics', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('48889be9-8789-403b-9633-de94c16c4c4d', 'Course 1 by Teacher 5: Intro to Computer_science', 'SUBJ-41', 'A comprehensive intermediate guide to computer_science.', '2d55f81f-8a3b-4982-a969-08cbacadacb3', true, 'computer_science', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', 'Course 2 by Teacher 5: Intro to Design', 'SUBJ-42', 'A comprehensive intermediate guide to design.', '2d55f81f-8a3b-4982-a969-08cbacadacb3', true, 'design', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('713ef8f7-5f98-4eef-88c2-165ad4057740', 'Course 1 by Teacher 6: Intro to Physics', 'SUBJ-51', 'A comprehensive advanced guide to physics.', 'bdc522e5-c26a-4cc9-b755-0b96ec855624', true, 'physics', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('c841eb86-1cde-49f1-a57f-4062b0cd465c', 'Course 2 by Teacher 6: Intro to Computer_science', 'SUBJ-52', 'A comprehensive beginner guide to computer_science.', 'bdc522e5-c26a-4cc9-b755-0b96ec855624', true, 'computer_science', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('6a0281d2-944e-404c-a300-d6000d62daf7', 'Course 1 by Teacher 7: Intro to Computer_science', 'SUBJ-61', 'A comprehensive intermediate guide to computer_science.', '7b375c7e-0133-45b6-b319-2c6992e9b001', true, 'computer_science', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('3033a7c7-231d-4a86-9975-73f42004b9c8', 'Course 2 by Teacher 7: Intro to Design', 'SUBJ-62', 'A comprehensive advanced guide to design.', '7b375c7e-0133-45b6-b319-2c6992e9b001', true, 'design', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('961e0ab4-b8f5-4fd2-8b6e-8182e6902e96', 'Course 1 by Teacher 8: Intro to Physics', 'SUBJ-71', 'A comprehensive beginner guide to physics.', 'de35ec31-2519-4377-b3a6-430dd9f640d3', true, 'physics', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('4883f3b7-c68a-4420-9fda-5a78f5cc08a6', 'Course 2 by Teacher 8: Intro to Design', 'SUBJ-72', 'A comprehensive advanced guide to design.', 'de35ec31-2519-4377-b3a6-430dd9f640d3', true, 'design', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('3993c4b6-8dd1-49ec-b71f-a8cb465a6429', 'Course 1 by Teacher 9: Intro to Computer_science', 'SUBJ-81', 'A comprehensive advanced guide to computer_science.', '76f444bd-a006-42b9-b6df-8068c3e521f0', true, 'computer_science', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('18c771e8-4593-4de9-9eb0-56a86b186bf8', 'Course 2 by Teacher 9: Intro to Mathematics', 'SUBJ-82', 'A comprehensive beginner guide to mathematics.', '76f444bd-a006-42b9-b6df-8068c3e521f0', true, 'mathematics', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('16b7ce4b-1373-469d-b5f7-1cc2d582a14b', 'Course 1 by Teacher 10: Intro to Design', 'SUBJ-91', 'A comprehensive advanced guide to design.', '34887d0b-1ee5-4c27-9bfc-72b6474fcce6', true, 'design', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('cbc20f35-7b23-4b0f-9718-30f10cc5aa95', 'Course 2 by Teacher 10: Intro to Design', 'SUBJ-92', 'A comprehensive beginner guide to design.', '34887d0b-1ee5-4c27-9bfc-72b6474fcce6', true, 'design', 'beginner')
            ON CONFLICT DO NOTHING;
            

-- 3. Create Enrollments and Progress (Logical Stories)

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('053cc264-0a8d-47b2-aae7-5b516789d50f', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["b25e9846-9b60-489c-81fd-4fb163370213", "8adcecfd-cbc7-470d-bfd8-b4ddeef50f8c"]'::jsonb, 2.92, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('053cc264-0a8d-47b2-aae7-5b516789d50f', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["1eab499f-935b-4b9a-be00-2b6f18f58d0d", "fcf7187b-0b8b-4e3f-a664-e303a327d575"]'::jsonb, 6.79, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('053cc264-0a8d-47b2-aae7-5b516789d50f', '65bcbab0-a6c1-4f16-91af-ba939932e468', '["daaf7726-6b10-47cb-af44-2164fa43cf00", "67c67190-34ff-4454-80a1-37fc6b9173fb"]'::jsonb, 6.31, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('053cc264-0a8d-47b2-aae7-5b516789d50f', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '["bc8a14fb-273b-4a57-a0cc-c54f81fe0f7e", "6c0e263a-e98f-4b13-87cb-c35db813c8aa"]'::jsonb, 7.42, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1a85322d-290b-4a8e-826c-6f07892f583a', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["d56771b5-ab66-409a-9114-276e414f7d19", "8fcfeb67-e2c5-4456-8c84-68c701bf690a", "70efdc15-23ed-4fc8-bfd2-1049daad0966", "ea5c7456-54c7-419e-8b18-f21495f30203", "3c1e1467-9c93-4f08-a175-dd72284ef857"]'::jsonb, 19.52, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1a85322d-290b-4a8e-826c-6f07892f583a', '18c771e8-4593-4de9-9eb0-56a86b186bf8', '["8a52814f-1993-4bfd-97ff-8081aeaaa9f7", "f1d0390c-62f9-4c52-b1db-788bf31a2fae"]'::jsonb, 5.73, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1a85322d-290b-4a8e-826c-6f07892f583a', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '["836eb01a-698c-445e-90ce-c61dd9be87b3", "ea9cae5e-1308-4634-a8b9-88e7c31cf44c"]'::jsonb, 2.42, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a4cc8ae8-b5d4-457f-aca5-9ce6cd109797', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a4cc8ae8-b5d4-457f-aca5-9ce6cd109797', '713ef8f7-5f98-4eef-88c2-165ad4057740', '["8d8a9b1f-4d1b-42dc-beac-d3c2d5f9d141", "ba613f32-0f30-4b83-8bed-67c04fd6b15c"]'::jsonb, 5.16, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a4cc8ae8-b5d4-457f-aca5-9ce6cd109797', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '["772d26f0-0378-4fa8-bba0-5c8a480cf0ab", "e221d479-537c-4d08-b1dd-4e68062c39c2"]'::jsonb, 2.40, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a4cc8ae8-b5d4-457f-aca5-9ce6cd109797', '961e0ab4-b8f5-4fd2-8b6e-8182e6902e96', '["ae129db1-ca9b-4f64-91dd-03cf75877d90", "21e2bb2e-d956-4489-aebf-118365a8fe37"]'::jsonb, 6.70, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a4cc8ae8-b5d4-457f-aca5-9ce6cd109797', '6a0281d2-944e-404c-a300-d6000d62daf7', '["0e1d9125-9d59-400f-99a7-ca725ab6e069", "8ccfd517-6d2f-4f76-8c7e-be4b5ac0adf7"]'::jsonb, 4.46, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('82994067-09ca-4393-82dc-54b2b2e591a2', 'cbc20f35-7b23-4b0f-9718-30f10cc5aa95', '["c7795d10-d551-403d-915e-f8531ca90945", "6b1c1902-5407-41af-8dfd-7a11127dc02b"]'::jsonb, 8.06, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('82994067-09ca-4393-82dc-54b2b2e591a2', '961e0ab4-b8f5-4fd2-8b6e-8182e6902e96', '["f71d26d8-be60-4f9e-9037-f75799a62357", "f158a949-6a59-4d45-8a75-582b71a9dddd"]'::jsonb, 8.00, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('82994067-09ca-4393-82dc-54b2b2e591a2', '97960fea-531d-4d4f-aed0-bf8b0f3bc888', '["a9485647-9e44-4ff9-931a-50c105b4b8a3", "240bb24e-f6e9-477f-bb06-9b081bdf3f95", "69e9eb95-96a4-442b-9ddc-d5e42e6fa9bb", "6a26eda4-257e-4b34-a9f7-fc5bc954a561", "f131900b-0117-416f-b96f-5114039bb6bc"]'::jsonb, 12.61, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('82994067-09ca-4393-82dc-54b2b2e591a2', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '["3135fc69-bb06-4b23-aa08-3337240eaa1a", "4282dca0-270f-4e8a-9951-ca27fcd38f21", "fc59ebe2-5206-4b3e-b0ec-3385e3b83082", "6821aa0d-7f56-4b00-a486-5e448de791f6", "bc08480f-2ad0-41cb-b703-f0c43a74fb89"]'::jsonb, 13.05, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('82994067-09ca-4393-82dc-54b2b2e591a2', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4d1d5025-dafb-4722-add8-72c26dc7e408', '18c771e8-4593-4de9-9eb0-56a86b186bf8', '["55c0780e-3ca9-49c7-8f70-9c2e5775e89a", "c240229a-3ddb-4cbe-b833-c6ba39584ee7"]'::jsonb, 8.76, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4d1d5025-dafb-4722-add8-72c26dc7e408', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '["10c72aab-9143-4dcc-8603-76f1e83f7e19", "bc8ce718-c3e4-437e-bff2-5c9e55ea495b"]'::jsonb, 7.75, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4d1d5025-dafb-4722-add8-72c26dc7e408', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '["5a161a61-0c02-4167-a744-cc02bc5553a1", "03904b08-a206-49cd-b90c-2a68522c1dc4"]'::jsonb, 5.36, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4d1d5025-dafb-4722-add8-72c26dc7e408', '6a0281d2-944e-404c-a300-d6000d62daf7', '["857dad70-d687-4846-beb9-39791b528c85", "cbc5def1-0518-4b35-afc0-03fad78a38fa"]'::jsonb, 1.52, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('edd398f7-40a1-4ef9-b565-dcdf711dca6f', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('edd398f7-40a1-4ef9-b565-dcdf711dca6f', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('edd398f7-40a1-4ef9-b565-dcdf711dca6f', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '["dcad7bab-bc17-4048-950a-24c7acd1d8c0", "d243f3be-0d26-4d46-8f4c-770296ea5431"]'::jsonb, 8.13, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3a76efbe-69d8-4a68-94bc-fe7e9731776c', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '["c901ea86-8af6-4afe-989e-d85c0e090464", "10f284ce-03e6-4a9b-b674-880c40557fe4"]'::jsonb, 1.96, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3a76efbe-69d8-4a68-94bc-fe7e9731776c', 'ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3a76efbe-69d8-4a68-94bc-fe7e9731776c', 'cbc20f35-7b23-4b0f-9718-30f10cc5aa95', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('361bb263-ce86-473a-8571-43200b7ef1f5', 'b2131724-bca1-4ed3-a645-a671955a7f98', '["ad3d7d5e-d933-4a01-9dd8-ac2bf1323bc9", "ee76ba56-4332-4ccd-9a4f-8e569ea270d8"]'::jsonb, 8.56, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('361bb263-ce86-473a-8571-43200b7ef1f5', '961e0ab4-b8f5-4fd2-8b6e-8182e6902e96', '["b4c44b83-c741-4cd5-96a0-e8f34620eec1", "e5c4cd63-5b69-467e-83b2-a736fc8133df"]'::jsonb, 5.62, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('361bb263-ce86-473a-8571-43200b7ef1f5', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '["1df9f750-51a3-42d4-b1c6-045290da8325", "3bcb4e68-655a-423e-b8a3-d0b57352e8fd", "7236e4af-a84d-4036-8153-6be929828633", "b944fa0d-a19d-4e65-b917-392489f2c0ba", "456fc1ef-7aa6-4f92-9013-a69cd9eefa39"]'::jsonb, 15.54, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('85e571ff-5ac7-4c40-b352-47afe70b2b97', '65bcbab0-a6c1-4f16-91af-ba939932e468', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('85e571ff-5ac7-4c40-b352-47afe70b2b97', '3033a7c7-231d-4a86-9975-73f42004b9c8', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('85e571ff-5ac7-4c40-b352-47afe70b2b97', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('85e571ff-5ac7-4c40-b352-47afe70b2b97', '6a0281d2-944e-404c-a300-d6000d62daf7', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dd036ca9-2547-4ff9-bbe5-7b87e1d6b517', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["d2b4ed4e-3562-4305-9d7e-ef4965e9fd62", "0d5175f1-394e-40e4-81c4-7c8271b2989a"]'::jsonb, 2.30, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dd036ca9-2547-4ff9-bbe5-7b87e1d6b517', 'b2131724-bca1-4ed3-a645-a671955a7f98', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dd036ca9-2547-4ff9-bbe5-7b87e1d6b517', '9839811f-cbdf-4416-9a9c-b8cc87953991', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dd036ca9-2547-4ff9-bbe5-7b87e1d6b517', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dd036ca9-2547-4ff9-bbe5-7b87e1d6b517', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('6c890993-f261-44be-bed7-26953caf7583', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '["fb6c7a98-4124-4433-89a7-75563cc5d159", "a583b4bf-b9a9-4094-9919-6eeb975489f7", "f312d276-c155-45ed-9b43-e6b6877fd6dd", "a265cbe8-d62e-4249-864c-d12cdd3d1af7", "0c2c0d55-9384-4124-ac33-67119212f305"]'::jsonb, 12.22, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('6c890993-f261-44be-bed7-26953caf7583', '6a0281d2-944e-404c-a300-d6000d62daf7', '["08d0f339-784d-433a-a32a-6a8e112fc045", "60aef6d8-22d2-4a10-b7a8-c5cf47b44ceb"]'::jsonb, 6.95, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('6c890993-f261-44be-bed7-26953caf7583', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '["1277f084-91e3-4d48-9d54-ac955a50bb73", "33c726c9-ad82-4b8c-8eaf-1afff6df6e1d"]'::jsonb, 3.61, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('6c890993-f261-44be-bed7-26953caf7583', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["0aa6eedb-9ea3-46f5-b115-3fafe83532b0", "86bf090c-354a-4a25-bd53-c9676b6c0aa6"]'::jsonb, 1.98, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('6c890993-f261-44be-bed7-26953caf7583', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '["16c3fdad-41be-4fb1-8a04-5dafb8022de1", "9a54660a-33c0-40b6-bca0-80b1f354b423"]'::jsonb, 7.43, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d6404b0a-dc56-4f7b-a350-af8e22f7981a', 'cbc20f35-7b23-4b0f-9718-30f10cc5aa95', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d6404b0a-dc56-4f7b-a350-af8e22f7981a', 'ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', '["aa859c0a-62f8-470c-8cc9-4e2092d288a9", "74251286-79d0-41e1-bd90-760d54e5cbaf", "221909bf-3772-43d7-bcd9-7ac2512c92a5", "e786045a-ce15-4aca-8b2e-5b7c940d737a", "46d3239c-4189-4e9d-a471-c279fbaf6a07"]'::jsonb, 18.13, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d6404b0a-dc56-4f7b-a350-af8e22f7981a', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["ac8c6f71-c5c3-4a8f-aac5-1dca82ffa46d", "51eb4df5-4195-4d3d-aab3-786b5eccda36"]'::jsonb, 5.64, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d6404b0a-dc56-4f7b-a350-af8e22f7981a', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '["868dd48f-b872-4e54-9b8a-f7f459458ac4", "d389b838-428d-488b-8bc0-c4cdfa63470f", "22f46e12-8897-450b-a400-1ec90e00dcd9", "df663f49-e4bf-4ff7-ab2f-58cd18ec3d20", "9dfff474-fa69-40b3-9db5-adc59b0a2962"]'::jsonb, 19.78, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a0af060c-7d47-4d95-b2a6-eec52350d8d4', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '["6f6c606e-5fcd-4fa1-84f4-7e1c9e094c7d", "c7aa45e0-c411-49e5-8c40-c395da5493b9"]'::jsonb, 7.18, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a0af060c-7d47-4d95-b2a6-eec52350d8d4', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["8f197988-5b68-48a0-8105-42ff7252bcbd", "b5a066c3-f1d4-4e96-ae52-831082e8e434"]'::jsonb, 4.29, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a0af060c-7d47-4d95-b2a6-eec52350d8d4', '18c771e8-4593-4de9-9eb0-56a86b186bf8', '["4dc86784-9def-4485-b26d-4f9bf3d43c94", "cb5dce53-cf1a-455e-aee5-8e9e2a72fef2"]'::jsonb, 5.38, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a0af060c-7d47-4d95-b2a6-eec52350d8d4', '97960fea-531d-4d4f-aed0-bf8b0f3bc888', '["e4371422-a2d5-43c5-bdcf-cce5e8d1a452", "252c5fb9-5c20-4875-adc6-9729ed7d9a0b"]'::jsonb, 4.22, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a0af060c-7d47-4d95-b2a6-eec52350d8d4', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e526cfef-2d3e-4f05-8003-22397c2eb863', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '["280e81d1-59ba-4dda-80ec-ee41c4b48e59", "889863ee-cd0d-4797-92ca-b67d38b3cc2d", "85f69157-53ce-434c-825f-799b6416ddd1", "4a3ae335-5afc-406f-8dd1-706ad59f069c", "f5171df7-0465-4f7b-a54b-412da62c9a84"]'::jsonb, 15.80, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e526cfef-2d3e-4f05-8003-22397c2eb863', '65bcbab0-a6c1-4f16-91af-ba939932e468', '["1a3acd5a-3799-4036-b16a-99e5d8818700", "1e0e36d9-d595-4874-a090-4ac02d1817a0"]'::jsonb, 4.57, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e526cfef-2d3e-4f05-8003-22397c2eb863', '3033a7c7-231d-4a86-9975-73f42004b9c8', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e526cfef-2d3e-4f05-8003-22397c2eb863', '97960fea-531d-4d4f-aed0-bf8b0f3bc888', '["a7ba8907-891f-47a3-b5ca-5ee6f79ade96", "e75313fa-c424-4833-8185-e0190b49a33e"]'::jsonb, 5.97, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e526cfef-2d3e-4f05-8003-22397c2eb863', '9839811f-cbdf-4416-9a9c-b8cc87953991', '["9d0109f6-c3e6-4ee4-a19a-3629bca1ed67", "6391eeac-a69d-4fa5-bc95-ae038280e9de"]'::jsonb, 4.71, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d2d42358-77a0-4a36-8896-27a6ab775f03', '48889be9-8789-403b-9633-de94c16c4c4d', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d2d42358-77a0-4a36-8896-27a6ab775f03', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["228a062a-66c6-4202-a70c-564b894eb462", "2dd2f905-2850-4307-b89b-c4962b04c8f3"]'::jsonb, 7.05, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d2d42358-77a0-4a36-8896-27a6ab775f03', '9839811f-cbdf-4416-9a9c-b8cc87953991', '["c813810e-a379-4932-86d8-a018854e803f", "61f73a81-421f-4441-8a63-69b0067398ca", "c5b5e671-9031-441a-a549-7386d8e09189", "9529ac2d-6c4c-4e0e-9c01-c2331b0a89ff", "67fa9a70-ec89-4653-b651-9c5ed9e69b61"]'::jsonb, 13.89, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3e3247d6-d6bf-4f27-a22f-e8da6f7ffe92', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3e3247d6-d6bf-4f27-a22f-e8da6f7ffe92', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '["6cb97d86-95e2-493a-96f1-ee7c51c6da7f", "6ee4e55a-5b96-4168-a3d1-b877a768d48d"]'::jsonb, 6.43, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3e3247d6-d6bf-4f27-a22f-e8da6f7ffe92', 'b2131724-bca1-4ed3-a645-a671955a7f98', '["cbf1071b-fa4e-45b1-a3a6-e549904acd06", "37efd1b7-dd2f-4335-9029-411002a4a910", "7d7bcf5a-8bd7-4167-8fe3-083f71d75c1c", "c562f82a-084b-46fa-9bed-fffd92aae69e", "b726c0d5-845d-49c1-9b32-3e15965d427b"]'::jsonb, 18.19, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3e3247d6-d6bf-4f27-a22f-e8da6f7ffe92', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8c609668-5e97-4656-8925-2ce78d6a8e2c', '97960fea-531d-4d4f-aed0-bf8b0f3bc888', '["746bad8f-0eff-4ab5-aa48-f02471b1dd27", "f33ae1d9-9cf7-4a62-8fe9-b342a15c74fc"]'::jsonb, 4.69, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8c609668-5e97-4656-8925-2ce78d6a8e2c', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '["bf04d998-c4c5-4352-a918-2f3248bedd0b", "2258604a-07e6-45a9-a47e-da3bd5b1eb28"]'::jsonb, 5.43, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8c609668-5e97-4656-8925-2ce78d6a8e2c', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '["c7950546-53b2-4a14-bd05-b57e85355dd8", "24a9e098-bf2c-4325-a434-1320ef54232d"]'::jsonb, 8.06, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8c609668-5e97-4656-8925-2ce78d6a8e2c', '9839811f-cbdf-4416-9a9c-b8cc87953991', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8c609668-5e97-4656-8925-2ce78d6a8e2c', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '["91c1be79-033e-4661-b052-48eea60868ff", "c2197b33-af76-49d2-8c69-03f86db9a345", "af1b66d6-8649-4a5a-b676-287b4a8269cf", "cb51958e-1269-4a65-a89f-cf7cdc1e8932", "90efb2b7-46fc-499b-bb79-86878c953a31"]'::jsonb, 15.19, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('02db39e8-18ca-4e49-9267-98412d009403', '65bcbab0-a6c1-4f16-91af-ba939932e468', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('02db39e8-18ca-4e49-9267-98412d009403', '9839811f-cbdf-4416-9a9c-b8cc87953991', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('02db39e8-18ca-4e49-9267-98412d009403', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["4d9e79e9-43cb-43ca-9ad3-75833d8186da", "5b5e1df0-d120-4b91-a5c4-fd3bf7a15ff8", "9be4e0ba-bdb8-4457-a68b-167c3f99b435", "38e2c3b8-ed2a-4eec-b1fc-599f47dac061", "301e13f9-825b-40e3-b12f-8cb033b292be"]'::jsonb, 13.45, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('02db39e8-18ca-4e49-9267-98412d009403', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["8695e125-0ff2-47fe-85ca-a4950c597a60", "5813e638-7683-407c-9e77-d1d960db01f1", "7cf648cc-17e2-42d6-a9a1-781990ff1a63", "3d45a614-be2c-4de9-9aa6-4cdc2d895903", "722a9249-fe81-41d6-a9b1-dda1bedc4f76"]'::jsonb, 15.74, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('02db39e8-18ca-4e49-9267-98412d009403', '3033a7c7-231d-4a86-9975-73f42004b9c8', '["cb4a32c4-6a07-46ed-b685-c1c5ec940a9a", "17005003-8f30-4fae-917b-439712d26664", "5c6b411c-5e9a-4481-8836-4f6882964d98", "3e61c245-3134-433e-982a-ec8e300dd394", "b2fe7224-726c-4155-b6fe-bbdce0fa5354"]'::jsonb, 15.34, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('299e3dee-d251-4ab4-8439-27e32fe3ca8b', '3033a7c7-231d-4a86-9975-73f42004b9c8', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('299e3dee-d251-4ab4-8439-27e32fe3ca8b', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('299e3dee-d251-4ab4-8439-27e32fe3ca8b', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '["a22d629b-c934-499b-a2d2-b16177d1a7f6", "da1c9cea-5c87-4cb1-87f5-372bc2761679"]'::jsonb, 1.54, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cdd133ff-8008-4d17-a042-64afb90832b9', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["8c5ce790-2b72-42dd-81b4-cb1abc9f780e", "372f9f88-eaa7-4bd1-8866-b9c6b2a68cf0", "9fc755a1-bd17-4625-a6e7-8b9a220be7e7", "c74741d1-645e-489b-b452-f88ef0172c3a", "899c5a8b-e94a-4dd6-80d5-1a694fd547a1"]'::jsonb, 13.60, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cdd133ff-8008-4d17-a042-64afb90832b9', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '["ca67e607-fd8f-4a88-87f9-4b21afcd97d9", "289a77c5-f89d-4eea-b664-e74d94197246", "2296dd74-5a40-4150-bb92-5a693c8bfb03", "88d4b131-69dd-4d7c-87ee-1506270124a6", "88e921f5-1840-4647-aed9-5658b9953502"]'::jsonb, 18.47, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cdd133ff-8008-4d17-a042-64afb90832b9', 'ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', '["b631479d-e44c-4696-a31f-b208a5f7ae30", "fd2de856-0789-478b-8bdd-1d9d7894d839", "af822a07-26a0-4af8-98a8-8e01b52b7b8d", "a71442e7-d78f-4f03-827f-3ae295615d86", "571b223e-eb3f-4a01-901b-cff714ec7e17"]'::jsonb, 16.90, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cdd133ff-8008-4d17-a042-64afb90832b9', '6a0281d2-944e-404c-a300-d6000d62daf7', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cdd133ff-8008-4d17-a042-64afb90832b9', '713ef8f7-5f98-4eef-88c2-165ad4057740', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1819f59d-2e4d-49ab-a115-c436cf537a66', '9839811f-cbdf-4416-9a9c-b8cc87953991', '["65e3aa8c-51b1-4518-abaf-9346a2a469a9", "a86dbbc9-35ab-4ea0-b505-682f1caeb84f"]'::jsonb, 8.79, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1819f59d-2e4d-49ab-a115-c436cf537a66', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1819f59d-2e4d-49ab-a115-c436cf537a66', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '["176ded08-096a-42dd-bbaa-746f38faf460", "f9f9c044-7c65-4aa4-aa73-587b16e77900"]'::jsonb, 4.13, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e880d000-386d-43d0-adae-27eade65d1c9', '961e0ab4-b8f5-4fd2-8b6e-8182e6902e96', '["306908a2-fc22-46fc-9cd3-78a4d8bdea3f", "a05cf28a-27d9-4f62-b6cf-716466a1cd03"]'::jsonb, 2.17, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e880d000-386d-43d0-adae-27eade65d1c9', '6a0281d2-944e-404c-a300-d6000d62daf7', '["626758f5-7406-4a52-8420-d6b5bbaeb70a", "e0179734-eb7d-4f08-9185-4dc74a495272", "bb958cb8-eb71-4861-b31f-d903776ae372", "9f5dce73-ff3f-47ae-b000-1564d5fa5c5f", "afc576b2-6b30-43a4-a0c5-0d01a84b09a2"]'::jsonb, 11.94, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e880d000-386d-43d0-adae-27eade65d1c9', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '["602b2a2e-c4fd-4b5a-bb1a-f908c7aa43d5", "1b259c30-95b0-47fb-9447-4e9355713c04"]'::jsonb, 1.43, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e880d000-386d-43d0-adae-27eade65d1c9', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["f5695b6c-7af1-4420-9a3c-8168279afa0b", "c71211f1-28d7-4188-bbca-64c6b735e2b8"]'::jsonb, 6.50, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dbbfdd56-a906-4d76-8dee-54bda8882744', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["63ecc2a7-8fc6-4e72-9168-76f607d93165", "9c42a82e-caa5-41a9-9252-4f74ea7c2abe"]'::jsonb, 4.92, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dbbfdd56-a906-4d76-8dee-54bda8882744', 'cbc20f35-7b23-4b0f-9718-30f10cc5aa95', '["9444354e-2a76-4bc6-b20f-365044f73926", "4e0cca93-306f-4dde-8f80-2fab4b558803"]'::jsonb, 8.22, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dbbfdd56-a906-4d76-8dee-54bda8882744', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '["84a14446-9522-4152-b418-84358037f9ca", "fec2fbbb-b4ed-4b79-afaf-9e40318f0752", "56497bab-e4fa-4de4-871c-04d32b4690db", "f37ff1d0-78df-4384-842a-796200c6016c", "2806dab6-25a7-4eab-b6f0-8580640da76c"]'::jsonb, 12.68, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dbbfdd56-a906-4d76-8dee-54bda8882744', '9839811f-cbdf-4416-9a9c-b8cc87953991', '["10253154-ac4e-4fcd-9b4c-a583b292a232", "bebb5e08-9210-401c-a0c0-ad7977ca84aa"]'::jsonb, 5.11, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('36a6d1d0-69d6-48e5-9108-044e5ca47f53', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '["98d07012-247d-41d9-a0ab-4844627c4573", "de12ba0d-398a-4ac2-86fb-356955bf1e24"]'::jsonb, 5.12, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('36a6d1d0-69d6-48e5-9108-044e5ca47f53', '9839811f-cbdf-4416-9a9c-b8cc87953991', '["8570ac16-4512-423a-a5f0-10301376350f", "99637c97-f8fd-43c8-9e31-3e39e7437d40", "37af60b1-e96d-4a38-a3ea-a6740f1b8c0c", "93459b50-a7f4-4b88-b6e0-a24a68ca08f8", "9ef34109-b00b-45c3-91d9-e320c4c64915"]'::jsonb, 10.73, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('36a6d1d0-69d6-48e5-9108-044e5ca47f53', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["dd927e17-2269-4372-ae45-24dbad0db3e9", "74d1b239-4d6c-45bd-979f-fb442118102f"]'::jsonb, 3.18, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('36a6d1d0-69d6-48e5-9108-044e5ca47f53', '713ef8f7-5f98-4eef-88c2-165ad4057740', '["ba7e9ed8-d481-4d2f-9be4-1918b56c8396", "6f092b53-a82b-4e45-aee7-f2c427e40399"]'::jsonb, 4.94, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('528a19da-0459-41eb-821a-2781f5c1c0c3', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '["91f2f9af-bcd8-4c4d-9669-77438a72d98c", "c7fad926-1cea-4a3c-8c3f-d654f71d99d3"]'::jsonb, 2.51, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('528a19da-0459-41eb-821a-2781f5c1c0c3', '65bcbab0-a6c1-4f16-91af-ba939932e468', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('528a19da-0459-41eb-821a-2781f5c1c0c3', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '["d0004eea-ef39-49cf-ac15-c1ae0511af7e", "bd9a3035-3571-4163-9084-1ddee49f65a7", "659984e5-58a8-4971-8288-e8c2d9c5fe3d", "42f99379-19b7-4c80-bb62-7beabb940809", "803efbff-c9f0-4047-ac9d-0a73378febd1"]'::jsonb, 14.32, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('601d2003-b9d4-4b31-8303-d115186d3575', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["e5c0b9d2-43a5-4c52-b771-643eba8fe345", "22b60d17-1694-43fc-98d3-52b0c0bb5047"]'::jsonb, 3.64, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('601d2003-b9d4-4b31-8303-d115186d3575', '3033a7c7-231d-4a86-9975-73f42004b9c8', '["5711e864-cdb7-412b-ae9f-98fe47179ff0", "94897253-833b-4274-884d-5575cfe97f34"]'::jsonb, 1.11, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('601d2003-b9d4-4b31-8303-d115186d3575', '6a0281d2-944e-404c-a300-d6000d62daf7', '["57e3aa3a-e7d2-4c3a-a1af-a48a78dff3b7", "92fb573e-b979-4741-bbd2-f2b4f3fb92e6"]'::jsonb, 5.70, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('20f1b5d9-2941-4a80-a893-01f0d3c37744', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["1ca3ee29-979b-4e09-bdbc-c9f0590ef507", "07563855-9757-478e-97bf-07bafad8b326"]'::jsonb, 7.22, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('20f1b5d9-2941-4a80-a893-01f0d3c37744', 'ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', '["4461ca46-96c8-4f37-9855-dc8f68f34faf", "ab4f9d8f-a23e-4bfd-b5cb-f0f5f6e8c1ed"]'::jsonb, 7.92, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('20f1b5d9-2941-4a80-a893-01f0d3c37744', '961e0ab4-b8f5-4fd2-8b6e-8182e6902e96', '["ee563938-2f86-40ea-a862-ef2947239965", "61161b4e-323c-48b7-a5d3-1029559e604c"]'::jsonb, 8.61, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('20f1b5d9-2941-4a80-a893-01f0d3c37744', '97960fea-531d-4d4f-aed0-bf8b0f3bc888', '["83c911e9-e29c-4659-b445-9f09d074d598", "7fa10cfb-b1d3-4353-bc75-71626493b11d"]'::jsonb, 3.40, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d0c9d02e-d5dc-48e0-a5a0-8cb35da34496', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["439d76a7-cd2a-4c0d-bfd1-9c63f027250b", "3a509246-b74a-4aea-9a2a-9cfb7017140b"]'::jsonb, 3.26, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d0c9d02e-d5dc-48e0-a5a0-8cb35da34496', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '["1ee459bb-04e4-4f23-be42-06d37e72c159", "1fb4e3bd-62ef-4823-a558-61d76e18683d", "add2029f-0e71-4813-a4ac-d96b6a090e44", "43503f66-ff40-4a83-9938-cfcc2b6ee072", "0229ff61-5efa-4854-a3de-e3d6d1d24151"]'::jsonb, 18.08, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d0c9d02e-d5dc-48e0-a5a0-8cb35da34496', '48889be9-8789-403b-9633-de94c16c4c4d', '["fc88c776-2162-4864-82d2-4f5eb824b521", "27b1ac91-3341-42d1-91e2-a098be5682db", "5ee424df-e44e-4fbb-b5a7-ed5089b12566", "407ec8b3-86bc-42e5-82c2-a066635c3b3c", "5d43ac09-9d89-421c-bc7e-bbdf9c15ff94"]'::jsonb, 17.31, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d0c9d02e-d5dc-48e0-a5a0-8cb35da34496', '713ef8f7-5f98-4eef-88c2-165ad4057740', '["f45b0390-f25e-4c6a-9674-0a5dcc3519af", "9274a43c-0cc8-45c2-87f4-e8214ce4b4d3"]'::jsonb, 7.28, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7a1b0b43-1c78-433d-b4ad-4e4c55a67bb1', '65bcbab0-a6c1-4f16-91af-ba939932e468', '["00e92568-36d5-4a12-b40d-b263ba24f3f3", "1814e9cd-1a2c-4718-ad1a-cf03ea770116"]'::jsonb, 7.01, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7a1b0b43-1c78-433d-b4ad-4e4c55a67bb1', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["4273f506-ac17-4e6f-8b25-46313972c9cf", "7cbfa6ca-3dde-4301-9a25-c3a4b709e0bb"]'::jsonb, 1.96, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7a1b0b43-1c78-433d-b4ad-4e4c55a67bb1', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7a1b0b43-1c78-433d-b4ad-4e4c55a67bb1', '713ef8f7-5f98-4eef-88c2-165ad4057740', '["66370ea1-2478-4977-995e-5e6855331694", "dfb12169-528f-4583-bad1-9bab3f859380"]'::jsonb, 3.14, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('59e47765-e1ce-427e-816b-482201bf2fb4', '9839811f-cbdf-4416-9a9c-b8cc87953991', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('59e47765-e1ce-427e-816b-482201bf2fb4', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('59e47765-e1ce-427e-816b-482201bf2fb4', 'cbc20f35-7b23-4b0f-9718-30f10cc5aa95', '["9fa13fd3-2f36-4e47-a02a-a00ee990a674", "29f3a57e-61a8-4103-addb-8225abfe6d88"]'::jsonb, 8.87, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('59e47765-e1ce-427e-816b-482201bf2fb4', '6a0281d2-944e-404c-a300-d6000d62daf7', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4c8edccf-fb6f-41e1-b01a-8ae78b56a3b3', '97960fea-531d-4d4f-aed0-bf8b0f3bc888', '["15ce2acb-3a02-4064-9e6f-3356c4d262f1", "18ad9348-c75f-4d2b-8e0a-b328e3adc305"]'::jsonb, 4.58, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4c8edccf-fb6f-41e1-b01a-8ae78b56a3b3', '9839811f-cbdf-4416-9a9c-b8cc87953991', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4c8edccf-fb6f-41e1-b01a-8ae78b56a3b3', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '["919ef7b5-9e77-4434-b319-7e86db60d65a", "95963305-ccde-441e-831f-388b0952a8d6"]'::jsonb, 4.97, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4c8edccf-fb6f-41e1-b01a-8ae78b56a3b3', 'ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', '["4d7ffbf0-9f10-4c7d-856a-5e6eabc20edc", "d0a659e5-a205-45f8-85d5-df47b7b9fa32"]'::jsonb, 7.37, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4c8edccf-fb6f-41e1-b01a-8ae78b56a3b3', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '["74c2543b-c624-4008-86d5-3b100546ffb1", "a123098d-b3a7-48dd-a0ab-7aba9b5efb43"]'::jsonb, 5.13, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('441d8b44-9d91-4ac6-9d1e-1f08bd82af26', '6a0281d2-944e-404c-a300-d6000d62daf7', '["b61698e1-7317-4c86-8192-e97e99fd552e", "ef519d33-6bd2-49ec-867a-2f6c4b195bbf"]'::jsonb, 7.54, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('441d8b44-9d91-4ac6-9d1e-1f08bd82af26', '18c771e8-4593-4de9-9eb0-56a86b186bf8', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('441d8b44-9d91-4ac6-9d1e-1f08bd82af26', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '["e3defdb0-de26-4d04-af69-92d71b7edb7a", "c48e3faf-6287-42f2-a715-4a28e2f637d0", "009a67c6-2def-424e-8435-d40275faef00", "e163ea1a-e7a3-4262-96cc-6ed1c7a41287", "e9337a55-52e1-4f26-b241-3d4641695bdd"]'::jsonb, 11.28, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('441d8b44-9d91-4ac6-9d1e-1f08bd82af26', 'b2131724-bca1-4ed3-a645-a671955a7f98', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('51dc5266-7a54-4cb8-a1f9-cd39ee98561f', '48889be9-8789-403b-9633-de94c16c4c4d', '["2b4275d9-ae20-4a0e-9fed-d440eba23258", "9eeb0713-d9c9-4992-b6c2-cf300e37750b", "b38863bb-90f9-4003-aed1-54c8ceb51844", "68b1d46b-434e-48d2-b8b3-74a95fb31c97", "649e8445-a4aa-488a-8cd0-417bb46c3f11"]'::jsonb, 11.04, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('51dc5266-7a54-4cb8-a1f9-cd39ee98561f', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('51dc5266-7a54-4cb8-a1f9-cd39ee98561f', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["32e1801a-b3df-4776-93fe-627577a8de9a", "2c727259-9f8e-45db-82d6-ef3b1d8c7a3c"]'::jsonb, 6.23, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('51dc5266-7a54-4cb8-a1f9-cd39ee98561f', 'b2131724-bca1-4ed3-a645-a671955a7f98', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('51dc5266-7a54-4cb8-a1f9-cd39ee98561f', '9839811f-cbdf-4416-9a9c-b8cc87953991', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8452d0e5-f3ef-4f8d-bcc9-e635a43b7d6a', '48889be9-8789-403b-9633-de94c16c4c4d', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8452d0e5-f3ef-4f8d-bcc9-e635a43b7d6a', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8452d0e5-f3ef-4f8d-bcc9-e635a43b7d6a', 'cbc20f35-7b23-4b0f-9718-30f10cc5aa95', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8452d0e5-f3ef-4f8d-bcc9-e635a43b7d6a', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '["c667d32d-8171-403a-876a-8e59ae0fc917", "a376511e-7bb0-4d5a-8da9-24789ebb6a43"]'::jsonb, 8.33, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4e67e0ab-f5f8-4473-9ddd-c7ee977f55d4', '9839811f-cbdf-4416-9a9c-b8cc87953991', '["6dd2a591-463b-4829-babe-7e00f936061a", "6a9a2f1d-d3c5-4910-95c7-505a6060f309"]'::jsonb, 5.56, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4e67e0ab-f5f8-4473-9ddd-c7ee977f55d4', '961e0ab4-b8f5-4fd2-8b6e-8182e6902e96', '["8242e4db-caf2-4f0a-8f8a-3674bd9c5077", "57b5be31-f6ea-47f5-9f4c-6ae5b7067b08", "07d9743a-b98a-4fb6-9a1f-04cdafa10154", "86292dec-bec1-412c-b6b9-3ce58df91c17", "89ac1a2f-3b05-4b40-98bb-f86c947ec6e9"]'::jsonb, 19.07, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('4e67e0ab-f5f8-4473-9ddd-c7ee977f55d4', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '["0961c8ce-7bd2-487f-8195-3e188bb0f01a", "61b85bf0-cf4f-4734-9bef-1a79e3f808e4"]'::jsonb, 7.57, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('581008d4-c7c6-4db7-87d2-31c14541e461', '3033a7c7-231d-4a86-9975-73f42004b9c8', '["f7b0d084-e826-4409-9034-d7ee335005ce", "e41a96b0-82eb-4157-b276-6dde13fc060d"]'::jsonb, 5.85, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('581008d4-c7c6-4db7-87d2-31c14541e461', '9839811f-cbdf-4416-9a9c-b8cc87953991', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('581008d4-c7c6-4db7-87d2-31c14541e461', 'ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5f9925b9-99a7-4089-b3ac-5c5bca4c5124', '65bcbab0-a6c1-4f16-91af-ba939932e468', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5f9925b9-99a7-4089-b3ac-5c5bca4c5124', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5f9925b9-99a7-4089-b3ac-5c5bca4c5124', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5f9925b9-99a7-4089-b3ac-5c5bca4c5124', 'b2131724-bca1-4ed3-a645-a671955a7f98', '["f52332ba-9ed5-4de2-a77e-4cdd1498b294", "84acb531-e89a-4ff2-b327-d09bffbca1fd", "748a7d55-8f61-48e5-b08a-0109670cb2d7", "6d943188-ec08-427a-96a4-6c79c85e2da5", "56365173-38ee-4642-a089-80403d237f8e"]'::jsonb, 15.50, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5f9925b9-99a7-4089-b3ac-5c5bca4c5124', '18c771e8-4593-4de9-9eb0-56a86b186bf8', '["1b2b6afa-a717-44e0-b98b-9eef8bb3b3d0", "2b85f517-8205-476b-8fdb-18430e9125eb"]'::jsonb, 6.50, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f6e10f1e-5170-4b7a-9c5c-d0f5e26c1e26', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '["56605ae1-7aa2-4d1c-a740-198ee778bcd9", "13989a15-6ea6-464f-8c48-927c4820c996"]'::jsonb, 6.94, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f6e10f1e-5170-4b7a-9c5c-d0f5e26c1e26', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f6e10f1e-5170-4b7a-9c5c-d0f5e26c1e26', '713ef8f7-5f98-4eef-88c2-165ad4057740', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('96dd2f22-3157-467b-81ad-37b8f3541d1d', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '["dbc5a00e-126b-4f15-8b0f-72bcb39aad71", "2cfeeea2-c6c7-41be-8653-1d32973d3cb4"]'::jsonb, 8.96, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('96dd2f22-3157-467b-81ad-37b8f3541d1d', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["600e91f7-9b42-4437-9d2a-67e6389a5d6c", "fa4b1341-d320-4f7b-8a41-78869b7e568a", "93d4ad8b-1c2f-408b-b0a1-84de608504e6", "bedd0d00-64a0-4c72-adc4-bf8ff4c3c36e", "d0785122-16ff-412d-a45a-c0224f89025e"]'::jsonb, 18.76, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('96dd2f22-3157-467b-81ad-37b8f3541d1d', '3033a7c7-231d-4a86-9975-73f42004b9c8', '["69b6b8ff-a96a-440b-8432-6b0a65250124", "daee8059-7ec3-4339-8463-5372e266fefa", "a7c416db-a812-4952-809d-e7c03075d9a0", "fca54774-4f6e-42ad-9e4d-d8d720ae1e33", "a00068dd-1713-4503-b9fe-8ce2a8de2b70"]'::jsonb, 15.48, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('96dd2f22-3157-467b-81ad-37b8f3541d1d', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '["97ae1ff5-9a3a-4fb1-ba80-ac40ed8079d4", "3366f66a-948d-45f8-a76c-11df1fa4f8ae", "9c4fb801-0ef0-4c83-8753-0879760a731f", "2fc44a7a-8acd-46c7-9a51-51a17f5bb024", "a0b36386-fd36-410c-b514-681ec23c2852"]'::jsonb, 19.20, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('96dd2f22-3157-467b-81ad-37b8f3541d1d', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '["9ae92020-1f24-45d0-8d05-56b1fb30b90b", "4f437fe0-e919-492d-81fb-8ddb983158c3"]'::jsonb, 7.25, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d59e980c-c13b-41a2-981a-df3e600927b9', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d59e980c-c13b-41a2-981a-df3e600927b9', '3033a7c7-231d-4a86-9975-73f42004b9c8', '["9dfe41e6-ce02-4c46-a167-82d552f9c825", "baa1ab00-cb1a-42ea-bfbd-5b22bc8d546f"]'::jsonb, 2.01, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d59e980c-c13b-41a2-981a-df3e600927b9', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '["968c4a30-13b3-4bd1-8e27-e47333bcb39f", "70a14da4-8fa8-43ec-99a8-45ccee863654"]'::jsonb, 6.32, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d59e980c-c13b-41a2-981a-df3e600927b9', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d59e980c-c13b-41a2-981a-df3e600927b9', '713ef8f7-5f98-4eef-88c2-165ad4057740', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d539fc5a-8543-4a86-ba67-f7daa4fec61f', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["ee4839e4-f606-46d2-a551-16f5a058dc53", "a4e9a24f-7c3a-446e-b35e-73e39eb4e989"]'::jsonb, 6.08, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d539fc5a-8543-4a86-ba67-f7daa4fec61f', 'ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d539fc5a-8543-4a86-ba67-f7daa4fec61f', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d539fc5a-8543-4a86-ba67-f7daa4fec61f', '6a0281d2-944e-404c-a300-d6000d62daf7', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('18daf791-02e0-44a6-a707-6cda16f6b46f', '713ef8f7-5f98-4eef-88c2-165ad4057740', '["f69d32ec-8d35-41fc-8656-7a58c71cb914", "d4951176-b6a8-431e-8c91-6ba27ecfb8c1"]'::jsonb, 7.42, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('18daf791-02e0-44a6-a707-6cda16f6b46f', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('18daf791-02e0-44a6-a707-6cda16f6b46f', 'cbc20f35-7b23-4b0f-9718-30f10cc5aa95', '["ecb15132-c438-4452-9d2f-4304cba53518", "a83efac3-549b-4346-a64d-fde09bc1df74"]'::jsonb, 7.70, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('18daf791-02e0-44a6-a707-6cda16f6b46f', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '["23281770-b9d7-4f8c-84bf-fe7b745a66a3", "68993262-44dc-42c0-b0a7-0f9b14de8ede"]'::jsonb, 8.86, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('18daf791-02e0-44a6-a707-6cda16f6b46f', '3033a7c7-231d-4a86-9975-73f42004b9c8', '["8146e18a-b15b-4701-935a-d9e4de8d8ed4", "f9e3ce77-9c3e-460b-b07b-585e7bf9af85", "3b5de589-177b-499d-8264-90a4350dcac5", "3d77a1e2-7a0e-4618-997d-511d590417ec", "00c7e96a-bf11-4674-9a6f-5a900096ab5c"]'::jsonb, 11.06, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f50b4abc-2afe-45f2-8fe0-7ba744a0e19d', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '["ede81517-5db8-46ac-bfac-74a4fe3b1333", "a8db8be3-b4e0-4fb8-9a78-60f45a138b7d"]'::jsonb, 8.05, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f50b4abc-2afe-45f2-8fe0-7ba744a0e19d', '97960fea-531d-4d4f-aed0-bf8b0f3bc888', '["9e8902b8-fa12-4ade-913e-a904f3d59109", "097a7e8c-2732-4ecd-8945-ee257f41629f"]'::jsonb, 2.12, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f50b4abc-2afe-45f2-8fe0-7ba744a0e19d', 'c60d131c-dcab-41c0-a8b4-6828ca09e2c0', '["06b85e6a-dd7d-431e-9f7c-25ea7d27e308", "647c7692-2b77-4099-bcaf-ee5ed2447bd7"]'::jsonb, 3.09, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f50b4abc-2afe-45f2-8fe0-7ba744a0e19d', 'b2131724-bca1-4ed3-a645-a671955a7f98', '["2b068f1b-cb55-4b94-b71a-97c66c93dc1b", "c6f64c97-9b03-4b82-8eed-8ea4edd7f8a9", "755cd15f-9b45-4069-b990-6ca4624253be", "b61764f0-12ea-4ed6-91fe-67d8c1d850df", "8c291a71-bd33-488d-85bc-07557d2d282c"]'::jsonb, 14.74, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('987ada41-ced4-4b80-ac3b-019212392574', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["b79a2118-7878-483f-a4b1-173d51a869f7", "97c834e6-13af-4714-8a8b-54727410d5ce"]'::jsonb, 5.74, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('987ada41-ced4-4b80-ac3b-019212392574', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('987ada41-ced4-4b80-ac3b-019212392574', '3993c4b6-8dd1-49ec-b71f-a8cb465a6429', '["024b530b-cd92-48dc-9187-f980e2cdf27c", "ea79ce72-e2c2-4f8d-b6dc-b7a620c15e51"]'::jsonb, 7.05, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('987ada41-ced4-4b80-ac3b-019212392574', '9839811f-cbdf-4416-9a9c-b8cc87953991', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('987ada41-ced4-4b80-ac3b-019212392574', '6a0281d2-944e-404c-a300-d6000d62daf7', '["6764de01-9c83-473d-b3eb-85a97f03ff5e", "ba3e7422-04d7-46e5-93a4-c91520531a76", "110ad6db-5796-4dc5-9504-7cdfea548e87", "7602d48e-2c0b-42e6-91ad-fea8067e800c", "f2e9af5d-cd04-4ae3-adad-b16dd7a50cfb"]'::jsonb, 15.53, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('afe28730-19bb-47bf-bea3-256e421482db', '6a0281d2-944e-404c-a300-d6000d62daf7', '["dbc46033-bcef-49ae-96a7-6a35d8caa6fc", "47c0d090-910c-4ea0-9485-a2a793bc7d9d"]'::jsonb, 1.80, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('afe28730-19bb-47bf-bea3-256e421482db', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('afe28730-19bb-47bf-bea3-256e421482db', 'b2131724-bca1-4ed3-a645-a671955a7f98', '["17cf9453-d2a4-4710-bdc2-17e91fd0d8f1", "c6213e96-f63f-479a-8225-620c2ba2d851"]'::jsonb, 8.45, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('afe28730-19bb-47bf-bea3-256e421482db', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["47b2bb63-d1b2-4b40-990c-eceb1557bb90", "914e4bd1-b8ce-45d8-9638-660c71d800ed"]'::jsonb, 1.46, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f3746a71-6e34-4795-a894-76d7e4fec553', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '["17847d3e-7cec-4fee-ba0f-ea1dea577503", "3957a893-3fb1-41dd-bec8-b81261a58bf7"]'::jsonb, 2.33, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f3746a71-6e34-4795-a894-76d7e4fec553', 'ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', '["05bb0007-463b-4195-b6c4-486dd0be3576", "bcf6907a-943b-42a7-a09c-7d1ff932e2d4"]'::jsonb, 1.57, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f3746a71-6e34-4795-a894-76d7e4fec553', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '["d1eb8d7b-15c4-4bb4-862e-f2fae56aec7a", "e3765c87-f268-4ed3-9a1a-958aa9fcfc9a"]'::jsonb, 1.19, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f3746a71-6e34-4795-a894-76d7e4fec553', '961e0ab4-b8f5-4fd2-8b6e-8182e6902e96', '["90ae7706-1af4-4d96-8e23-54438ac352f5", "3b38c210-3075-4af2-83f6-55b9d7cb144f"]'::jsonb, 1.79, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f3746a71-6e34-4795-a894-76d7e4fec553', 'dec3ec8b-4904-4af7-ba2f-c1ec7b892e6e', '["96f66afc-d3b6-4722-92d7-6729a22fda70", "de80fd29-cef4-46a6-980a-4caea40634f8", "afce50b7-fbfc-49a0-9b24-3d1e52bdd23a", "b3f51108-cc71-4bb2-894f-5da473bceb0f", "bc9283c1-c89b-4b23-842d-7d2a1e3a51c3"]'::jsonb, 19.01, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('79467c17-1bf3-4e59-bdef-62389f43d81c', '6a0281d2-944e-404c-a300-d6000d62daf7', '["1f214121-9bcc-4920-9a4c-e1e6e91f0644", "525fec1b-a24c-4762-9e71-54cc467243aa", "ca698065-905e-4c76-90e9-b91045c78805", "d38ca0e3-7ae6-4c29-a28e-494263c9c4ed", "a5ffd8dd-5a64-4a6a-acba-00cf6d34b33d"]'::jsonb, 14.21, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('79467c17-1bf3-4e59-bdef-62389f43d81c', '4883f3b7-c68a-4420-9fda-5a78f5cc08a6', '["1e518a08-40a9-48d7-b869-7594488baf1c", "d8454b15-d7b5-48c1-8059-8684443b6a60"]'::jsonb, 1.23, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('79467c17-1bf3-4e59-bdef-62389f43d81c', 'e1f1a041-ba60-41e4-a470-b974b0970c34', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('42d0604e-294f-4058-b4b8-573349ce3292', '6a0281d2-944e-404c-a300-d6000d62daf7', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('42d0604e-294f-4058-b4b8-573349ce3292', '48889be9-8789-403b-9633-de94c16c4c4d', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('42d0604e-294f-4058-b4b8-573349ce3292', 'aa81c026-694b-40f0-9bd1-bb8713635a24', '["12f3a29c-6dbd-4a01-ad72-d93db418d177", "c8aad793-234c-4e2f-b55a-39b4a14bc08a", "794d7f48-4f4a-4109-b62f-4f615a0434a6", "c9ee321a-bccc-480c-8b2f-2dd3ff6110f9", "ebcc558d-ac1a-43f3-814f-b43391fcc5d9"]'::jsonb, 18.45, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('42d0604e-294f-4058-b4b8-573349ce3292', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '["6938d214-f462-4ba6-be05-5a800975f714", "aa8460ab-1a56-451d-8ac3-a184c91564ab", "452c38a5-a642-486c-8cc7-6aeaabf33b18", "23608839-f56c-4bc0-9606-22aa45025810", "c20d2faa-7f76-4bfc-9cf2-e7dfbd97bf80"]'::jsonb, 17.61, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('42d0604e-294f-4058-b4b8-573349ce3292', 'ab9ab7e6-0607-4bce-a7a6-1c1480e094e2', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('983f5793-77f4-4cd7-bb01-b6f410eeadd1', '65bcbab0-a6c1-4f16-91af-ba939932e468', '["48006c54-37fc-45df-a9fd-45ef4e2249a4", "bc39b68e-9e5e-45e3-8aa5-e8b465959cbe"]'::jsonb, 5.17, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('983f5793-77f4-4cd7-bb01-b6f410eeadd1', '16b7ce4b-1373-469d-b5f7-1cc2d582a14b', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('983f5793-77f4-4cd7-bb01-b6f410eeadd1', 'c841eb86-1cde-49f1-a57f-4062b0cd465c', '["23dd3f90-60e8-4286-bacf-8bfdec8d3647", "3f7ff765-3632-491e-9051-a0e53fdf6d0d"]'::jsonb, 7.26, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('987d9092-5443-4f78-92cb-431a544e8f61', '961e0ab4-b8f5-4fd2-8b6e-8182e6902e96', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('987d9092-5443-4f78-92cb-431a544e8f61', '3033a7c7-231d-4a86-9975-73f42004b9c8', '["a942cc33-ab70-429f-9831-57891fe3543a", "e2c58b28-cc84-4c5d-91c7-063c7d238fe4"]'::jsonb, 8.12, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('987d9092-5443-4f78-92cb-431a544e8f61', '713ef8f7-5f98-4eef-88c2-165ad4057740', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            
COMMIT;