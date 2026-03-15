-- Lumina AI Learning Ecosystem Seed Script
-- Make sure pgcrypto is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;
BEGIN;

-- 1. Create Users

    INSERT INTO public.users (id, email, password_hash, name, role, is_active)
    VALUES ('b9e9989d-ce1f-4389-b458-e77f87f0051d', 'admin.system@lumina.com', crypt('Admin@123', gen_salt('bf')), 'System Admin', 'admin', true)
    ON CONFLICT (email) DO NOTHING;
    

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('4f71dfd4-f02e-4d8c-9444-6fd6a140214f', 'teacher1@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 1', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('63aa82cb-1b43-427c-b0f9-b0312d70ca7c', 'teacher2@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 2', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('4d3ace23-3458-42e5-a144-7e9170092109', 'teacher3@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 3', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('bd9cd0ac-8119-48b9-8c24-aaac7957e4c6', 'teacher4@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 4', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('e7156b52-8829-4a73-86a3-c0a37c93c7bf', 'teacher5@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 5', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('3f06084f-1a98-40f0-b0f5-483212533ba8', 'teacher6@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 6', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('53aa3020-676b-462c-94d9-4923bc6afd48', 'teacher7@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 7', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('8a61a7b4-fc71-4ce0-9bf9-81e154dc2ba1', 'teacher8@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 8', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('866de2fe-476f-4a95-8cd1-1ef1597d65d1', 'teacher9@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 9', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('4f8c7940-9456-46bb-8239-360a9c094417', 'teacher10@lumina.com', crypt('teacher123', gen_salt('bf')), 'Teacher 10', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('d52aa46b-0357-4ac1-8b15-cc6631660f14', 'student1@lumina.com', crypt('student123', gen_salt('bf')), 'Student 1', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('7f70d8f9-4645-4ff4-9486-c9a9a1b13e3c', 'student2@lumina.com', crypt('student123', gen_salt('bf')), 'Student 2', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('2cbe77d5-bcfe-41a8-b7ba-364ce8faf6fb', 'student3@lumina.com', crypt('student123', gen_salt('bf')), 'Student 3', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('a412e221-7557-4597-8a94-8914b3a24171', 'student4@lumina.com', crypt('student123', gen_salt('bf')), 'Student 4', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('61552a48-0d4e-4027-8452-c92fb9f823ed', 'student5@lumina.com', crypt('student123', gen_salt('bf')), 'Student 5', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('bb74c75c-cb38-4a17-ae43-b890d7cc78fa', 'student6@lumina.com', crypt('student123', gen_salt('bf')), 'Student 6', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('48d7f4a8-dfb1-4066-ad9e-56d869d49af0', 'student7@lumina.com', crypt('student123', gen_salt('bf')), 'Student 7', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('a5348746-3089-4b5c-af61-7bbb6c8d08d4', 'student8@lumina.com', crypt('student123', gen_salt('bf')), 'Student 8', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('8c066184-2b25-4330-bf63-8bfab58b3752', 'student9@lumina.com', crypt('student123', gen_salt('bf')), 'Student 9', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('9b1342e6-44b1-46f4-842e-73cdb0064d26', 'student10@lumina.com', crypt('student123', gen_salt('bf')), 'Student 10', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('f5fbaeab-908a-4ec0-80aa-caaea8f1a3ee', 'student11@lumina.com', crypt('student123', gen_salt('bf')), 'Student 11', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('e089de8a-76dc-440b-bc4c-9de0da0748ba', 'student12@lumina.com', crypt('student123', gen_salt('bf')), 'Student 12', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('88241a6d-0c71-4dc5-a269-d47cb65c6cbf', 'student13@lumina.com', crypt('student123', gen_salt('bf')), 'Student 13', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('8b595ef6-f1e7-4a23-ad4a-0668f5a8d144', 'student14@lumina.com', crypt('student123', gen_salt('bf')), 'Student 14', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('576f3824-0a40-46b2-9238-68474b626f4d', 'student15@lumina.com', crypt('student123', gen_salt('bf')), 'Student 15', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('bbc29458-af67-479e-ad66-55fcdd28c4ea', 'student16@lumina.com', crypt('student123', gen_salt('bf')), 'Student 16', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('ab357eb7-18f0-4a10-b24d-2d3871b59804', 'student17@lumina.com', crypt('student123', gen_salt('bf')), 'Student 17', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('a502eadb-4a0c-42ee-8cb5-85e89dbf12be', 'student18@lumina.com', crypt('student123', gen_salt('bf')), 'Student 18', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('8753be63-bca7-489e-8fb8-db7837474f89', 'student19@lumina.com', crypt('student123', gen_salt('bf')), 'Student 19', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('0dac0120-c697-4604-ad0f-28971550afec', 'student20@lumina.com', crypt('student123', gen_salt('bf')), 'Student 20', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('1181584a-fb5a-4fc4-b17f-62a59a6604d6', 'student21@lumina.com', crypt('student123', gen_salt('bf')), 'Student 21', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('cd178901-e300-4363-a34c-717c2e698676', 'student22@lumina.com', crypt('student123', gen_salt('bf')), 'Student 22', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('29703e86-4745-4c2e-b02f-9c134e78290a', 'student23@lumina.com', crypt('student123', gen_salt('bf')), 'Student 23', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('f3ae8299-e0be-4923-b747-be473a25e0d0', 'student24@lumina.com', crypt('student123', gen_salt('bf')), 'Student 24', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('946e8594-4d5c-42b0-97b1-5053ffe1096c', 'student25@lumina.com', crypt('student123', gen_salt('bf')), 'Student 25', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('ee75d2b6-f0fb-4d7e-8650-24a480e66f5e', 'student26@lumina.com', crypt('student123', gen_salt('bf')), 'Student 26', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('0fe750af-07cb-4a01-b5cf-6ab507875cb5', 'student27@lumina.com', crypt('student123', gen_salt('bf')), 'Student 27', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('132b5663-f3b0-44fa-8722-6b92539ef7c4', 'student28@lumina.com', crypt('student123', gen_salt('bf')), 'Student 28', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('a66fafd3-dc4a-45eb-8c38-8e885d77b4ae', 'student29@lumina.com', crypt('student123', gen_salt('bf')), 'Student 29', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('c86e7d19-dc83-43ea-a25f-7af2efa64511', 'student30@lumina.com', crypt('student123', gen_salt('bf')), 'Student 30', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('d1ca3794-6fda-4dcf-947a-5af0af5db466', 'student31@lumina.com', crypt('student123', gen_salt('bf')), 'Student 31', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('57f2db22-e9bd-4f12-8903-a94ecb7a8781', 'student32@lumina.com', crypt('student123', gen_salt('bf')), 'Student 32', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('ee2af132-e838-4c9d-9e1a-232b1dc174bb', 'student33@lumina.com', crypt('student123', gen_salt('bf')), 'Student 33', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('7a9f1e2c-4af6-4a37-9df2-015372954625', 'student34@lumina.com', crypt('student123', gen_salt('bf')), 'Student 34', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('df8f44f4-fb0d-454d-89c6-49012a3c3086', 'student35@lumina.com', crypt('student123', gen_salt('bf')), 'Student 35', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('cd4d01ff-bbbf-447c-bd2d-5e6f5989ddaf', 'student36@lumina.com', crypt('student123', gen_salt('bf')), 'Student 36', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('e0d81c38-86c3-4060-aea7-3ab6e14fe6f1', 'student37@lumina.com', crypt('student123', gen_salt('bf')), 'Student 37', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('294370f7-590a-41ec-901c-2778f02320e4', 'student38@lumina.com', crypt('student123', gen_salt('bf')), 'Student 38', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('69c7e20d-c37c-4f18-865e-69270273a18c', 'student39@lumina.com', crypt('student123', gen_salt('bf')), 'Student 39', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('98211652-c380-4008-8f29-fa1c28d22f9b', 'student40@lumina.com', crypt('student123', gen_salt('bf')), 'Student 40', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('897dce3f-aedc-4864-9e72-c268a4537b0c', 'student41@lumina.com', crypt('student123', gen_salt('bf')), 'Student 41', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('7fb91fe7-1dbc-40bb-8bbb-3e35fe79fba7', 'student42@lumina.com', crypt('student123', gen_salt('bf')), 'Student 42', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('3495ebb7-4fac-4f2b-8995-07bbcf736fab', 'student43@lumina.com', crypt('student123', gen_salt('bf')), 'Student 43', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('9de3070d-6f08-4214-8694-9823ab8a269e', 'student44@lumina.com', crypt('student123', gen_salt('bf')), 'Student 44', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('fb51cf19-b5c1-40aa-889a-aef59073ed80', 'student45@lumina.com', crypt('student123', gen_salt('bf')), 'Student 45', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('1f13b274-daf2-4b4e-8298-478865b040c7', 'student46@lumina.com', crypt('student123', gen_salt('bf')), 'Student 46', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('dee76e54-1ebe-421b-adc5-8eccb0409420', 'student47@lumina.com', crypt('student123', gen_salt('bf')), 'Student 47', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('c29b746b-f225-4590-8c03-3c3638cec752', 'student48@lumina.com', crypt('student123', gen_salt('bf')), 'Student 48', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('f216d02f-c7ba-4bbf-aa7a-9caeefb8c48b', 'student49@lumina.com', crypt('student123', gen_salt('bf')), 'Student 49', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('cf0c9e67-5849-467b-ae8c-d26ec9b724da', 'student50@lumina.com', crypt('student123', gen_salt('bf')), 'Student 50', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        

-- 2. Create Courses, Modules, and Lessons

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('fe7e19f7-bb9a-441d-a0d5-d78db6b60202', 'Course 1 by Teacher 1: Intro to Design', 'SUBJ-01', 'A comprehensive intermediate guide to design.', '4f71dfd4-f02e-4d8c-9444-6fd6a140214f', true, 'design', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('17039bf1-1fa2-46c4-9f19-3c6243067b0c', 'Course 2 by Teacher 1: Intro to Physics', 'SUBJ-02', 'A comprehensive intermediate guide to physics.', '4f71dfd4-f02e-4d8c-9444-6fd6a140214f', true, 'physics', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('f7eb3096-faec-4c65-96a9-dc4573991ec4', 'Course 1 by Teacher 2: Intro to Mathematics', 'SUBJ-11', 'A comprehensive beginner guide to mathematics.', '63aa82cb-1b43-427c-b0f9-b0312d70ca7c', true, 'mathematics', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('1459ed8f-2280-4c74-8b31-7ee0af23a6c7', 'Course 2 by Teacher 2: Intro to Mathematics', 'SUBJ-12', 'A comprehensive beginner guide to mathematics.', '63aa82cb-1b43-427c-b0f9-b0312d70ca7c', true, 'mathematics', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('f4532dab-4fda-4258-80fc-a0c479ce4814', 'Course 1 by Teacher 3: Intro to Design', 'SUBJ-21', 'A comprehensive advanced guide to design.', '4d3ace23-3458-42e5-a144-7e9170092109', true, 'design', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('542b5504-16d8-4339-b718-5f0149f8cedd', 'Course 2 by Teacher 3: Intro to Computer_science', 'SUBJ-22', 'A comprehensive beginner guide to computer_science.', '4d3ace23-3458-42e5-a144-7e9170092109', true, 'computer_science', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('51d1d603-9beb-4838-b367-2e29104e0954', 'Course 1 by Teacher 4: Intro to Business', 'SUBJ-31', 'A comprehensive intermediate guide to business.', 'bd9cd0ac-8119-48b9-8c24-aaac7957e4c6', true, 'business', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('5a5702cb-c561-4538-b288-8fb896548a70', 'Course 2 by Teacher 4: Intro to Business', 'SUBJ-32', 'A comprehensive advanced guide to business.', 'bd9cd0ac-8119-48b9-8c24-aaac7957e4c6', true, 'business', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('4c189ca9-eb35-49da-b53d-0269a124da60', 'Course 1 by Teacher 5: Intro to Computer_science', 'SUBJ-41', 'A comprehensive advanced guide to computer_science.', 'e7156b52-8829-4a73-86a3-c0a37c93c7bf', true, 'computer_science', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('06095791-6e47-4dc9-a028-77e3eb5542f4', 'Course 2 by Teacher 5: Intro to Business', 'SUBJ-42', 'A comprehensive intermediate guide to business.', 'e7156b52-8829-4a73-86a3-c0a37c93c7bf', true, 'business', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('e4805c2f-4917-4c94-ad64-2e741a33bf2c', 'Course 1 by Teacher 6: Intro to Business', 'SUBJ-51', 'A comprehensive intermediate guide to business.', '3f06084f-1a98-40f0-b0f5-483212533ba8', true, 'business', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('2e9cd46b-bd08-490b-ad85-e9775c274d47', 'Course 2 by Teacher 6: Intro to Computer_science', 'SUBJ-52', 'A comprehensive intermediate guide to computer_science.', '3f06084f-1a98-40f0-b0f5-483212533ba8', true, 'computer_science', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', 'Course 1 by Teacher 7: Intro to Design', 'SUBJ-61', 'A comprehensive beginner guide to design.', '53aa3020-676b-462c-94d9-4923bc6afd48', true, 'design', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('5ac90ddc-6540-4fae-93d0-5fab9942be09', 'Course 2 by Teacher 7: Intro to Computer_science', 'SUBJ-62', 'A comprehensive intermediate guide to computer_science.', '53aa3020-676b-462c-94d9-4923bc6afd48', true, 'computer_science', 'intermediate')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('78e4148b-47c1-4a54-ac46-78a30f315201', 'Course 1 by Teacher 8: Intro to Design', 'SUBJ-71', 'A comprehensive beginner guide to design.', '8a61a7b4-fc71-4ce0-9bf9-81e154dc2ba1', true, 'design', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('a2a6208d-c6e4-496f-a55f-1bf923540805', 'Course 2 by Teacher 8: Intro to Mathematics', 'SUBJ-72', 'A comprehensive advanced guide to mathematics.', '8a61a7b4-fc71-4ce0-9bf9-81e154dc2ba1', true, 'mathematics', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('c7488edb-018a-44d2-bfda-8ff3a75fc80d', 'Course 1 by Teacher 9: Intro to Business', 'SUBJ-81', 'A comprehensive beginner guide to business.', '866de2fe-476f-4a95-8cd1-1ef1597d65d1', true, 'business', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('15b75f41-f071-43db-b8ff-fc74a15f3b66', 'Course 2 by Teacher 9: Intro to Computer_science', 'SUBJ-82', 'A comprehensive beginner guide to computer_science.', '866de2fe-476f-4a95-8cd1-1ef1597d65d1', true, 'computer_science', 'beginner')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('4c1053da-9743-4c98-87c3-bab79d35323e', 'Course 1 by Teacher 10: Intro to Business', 'SUBJ-91', 'A comprehensive advanced guide to business.', '4f8c7940-9456-46bb-8239-360a9c094417', true, 'business', 'advanced')
            ON CONFLICT DO NOTHING;
            

            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('4f6e80e5-2384-4a44-a54e-f245d73996a2', 'Course 2 by Teacher 10: Intro to Computer_science', 'SUBJ-92', 'A comprehensive intermediate guide to computer_science.', '4f8c7940-9456-46bb-8239-360a9c094417', true, 'computer_science', 'intermediate')
            ON CONFLICT DO NOTHING;
            

-- 3. Create Enrollments and Progress (Logical Stories)

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d52aa46b-0357-4ac1-8b15-cc6631660f14', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d52aa46b-0357-4ac1-8b15-cc6631660f14', '4f6e80e5-2384-4a44-a54e-f245d73996a2', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d52aa46b-0357-4ac1-8b15-cc6631660f14', 'f7eb3096-faec-4c65-96a9-dc4573991ec4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7f70d8f9-4645-4ff4-9486-c9a9a1b13e3c', '5ac90ddc-6540-4fae-93d0-5fab9942be09', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7f70d8f9-4645-4ff4-9486-c9a9a1b13e3c', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '["b376d42a-2108-4750-8736-fb8830b6fa99", "394230c6-65bf-4e6a-bed6-9942fd3d6811"]'::jsonb, 6.53, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7f70d8f9-4645-4ff4-9486-c9a9a1b13e3c', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7f70d8f9-4645-4ff4-9486-c9a9a1b13e3c', '51d1d603-9beb-4838-b367-2e29104e0954', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('2cbe77d5-bcfe-41a8-b7ba-364ce8faf6fb', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["883de057-61b9-4436-a4f4-7bbb88d8c68c", "4e28ea82-e416-4636-98ce-d13a3aaaaf2e"]'::jsonb, 8.84, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('2cbe77d5-bcfe-41a8-b7ba-364ce8faf6fb', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["3d3a784b-c5e0-46a5-9ea9-3ebfd8d09547", "46f0346d-6f91-4b99-a2db-d55bb93462b7", "82a26a40-3b0b-4cb0-a843-29f0efed1d0b", "479074f8-6431-4dd0-9315-a6ba5d86628f", "5aef37e6-44aa-4808-9eac-83548b43ff07"]'::jsonb, 11.53, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('2cbe77d5-bcfe-41a8-b7ba-364ce8faf6fb', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["51f6fcaa-deb0-4aa7-8a2f-495b2e404405", "13810f72-8955-43fa-95fa-7a7d37c887bf"]'::jsonb, 8.34, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a412e221-7557-4597-8a94-8914b3a24171', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '["1258d1d1-4d3d-43d3-815c-64ce9e8765a5", "696a71e1-b66e-4889-8403-07df669e7bc4"]'::jsonb, 8.93, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a412e221-7557-4597-8a94-8914b3a24171', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["833b7e9f-c843-4fa3-8505-6b03b2994880", "1cc8b98c-c7df-4ad1-a121-ba0bc8ca9cfb", "7501d83d-e120-4c86-919c-17dd6d523ad2", "653f05b4-26b5-4476-b6a8-3bee1f06ce38", "67e4158d-4901-400e-a31b-1ccf14f6feab"]'::jsonb, 12.69, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a412e221-7557-4597-8a94-8914b3a24171', '78e4148b-47c1-4a54-ac46-78a30f315201', '["e9d9e91c-3fa3-482f-b03a-8ea1078f58d5", "836f83b5-f60a-4ace-ac91-de9f8aa19b38"]'::jsonb, 6.26, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a412e221-7557-4597-8a94-8914b3a24171', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('61552a48-0d4e-4027-8452-c92fb9f823ed', '51d1d603-9beb-4838-b367-2e29104e0954', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('61552a48-0d4e-4027-8452-c92fb9f823ed', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["ca114e0b-1ba9-46b3-a09d-f6ee2db485c4", "0e863bea-24e0-4810-b3ce-7c82cc1fee44", "96ad482e-7d68-4906-8ed6-23a68a215330", "cb40fb0b-396e-4fda-8ea3-7cfc7b592f70", "7ab2317c-000a-4db8-badc-ed93227b3bb4"]'::jsonb, 12.01, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('61552a48-0d4e-4027-8452-c92fb9f823ed', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["8d40f77b-a5cc-4933-afa6-c1f694b4da1e", "f0411f85-7061-4903-9309-63ae0f7d228e"]'::jsonb, 4.77, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('61552a48-0d4e-4027-8452-c92fb9f823ed', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '["b303c1be-7d91-49a2-a4ce-24b53ffaf4b6", "8c0fdad2-a936-4bc7-9ec8-fb68249643ec"]'::jsonb, 5.63, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('bb74c75c-cb38-4a17-ae43-b890d7cc78fa', 'c7488edb-018a-44d2-bfda-8ff3a75fc80d', '["a8dd0a76-f24c-418e-9aeb-7fa5ab7d42d9", "5c4852a5-b9a6-48ec-91a8-84ad7465de83"]'::jsonb, 7.87, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('bb74c75c-cb38-4a17-ae43-b890d7cc78fa', '5a5702cb-c561-4538-b288-8fb896548a70', '["77cbfe48-2a6a-42c9-85ce-5441d950ed1a", "f6bd80be-dd5b-4b8c-9997-82bd3411fbb5"]'::jsonb, 4.76, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('bb74c75c-cb38-4a17-ae43-b890d7cc78fa', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('48d7f4a8-dfb1-4066-ad9e-56d869d49af0', '5ac90ddc-6540-4fae-93d0-5fab9942be09', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('48d7f4a8-dfb1-4066-ad9e-56d869d49af0', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["2f913759-24f5-4d09-84f4-1ca6232f2fad", "33639060-7fa9-4316-a304-f9e67ff74230"]'::jsonb, 2.69, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('48d7f4a8-dfb1-4066-ad9e-56d869d49af0', '4f6e80e5-2384-4a44-a54e-f245d73996a2', '["97195516-ef87-41ae-91f3-7a5b23405ead", "c81813cc-e480-4d64-9286-08776804dbb3", "e647041b-7417-49da-819c-ae6bddbf106a", "05b4862b-a797-4bd9-8ba6-90827dd4862a", "983b0a32-29c4-45fa-a10f-ca59d0ea32c2"]'::jsonb, 19.37, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('48d7f4a8-dfb1-4066-ad9e-56d869d49af0', 'e4805c2f-4917-4c94-ad64-2e741a33bf2c', '["357f0e16-b115-4d05-8903-ba3c3d7d643c", "0bff72b4-e009-4849-b972-40e779bcc3b3"]'::jsonb, 7.42, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a5348746-3089-4b5c-af61-7bbb6c8d08d4', 'f7eb3096-faec-4c65-96a9-dc4573991ec4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a5348746-3089-4b5c-af61-7bbb6c8d08d4', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '["b12897ff-1bdd-4724-9f15-eb2b07caa425", "4294d950-51bd-4f30-862b-4448e14bb488"]'::jsonb, 6.92, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a5348746-3089-4b5c-af61-7bbb6c8d08d4', '4f6e80e5-2384-4a44-a54e-f245d73996a2', '["3e31f01d-44ed-4e79-9568-e4c13b336dbd", "c436415a-c466-4df8-bd0f-b9d6215e1f3d"]'::jsonb, 3.10, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a5348746-3089-4b5c-af61-7bbb6c8d08d4', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["7675fb61-9afe-4ce3-962c-e86508dec564", "2ee27e62-3115-4234-b753-dc41c48a0807"]'::jsonb, 5.24, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a5348746-3089-4b5c-af61-7bbb6c8d08d4', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '["ad429af8-a6f7-4826-815c-9ea62611fcaa", "883ca09c-9eed-4d9c-ab36-facd4bb961b8"]'::jsonb, 2.45, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8c066184-2b25-4330-bf63-8bfab58b3752', '1459ed8f-2280-4c74-8b31-7ee0af23a6c7', '["ffcda95a-1f05-45fe-a5cf-7d499428c89f", "bcf8cf70-25ea-4773-8411-e7c50d7f6ff4"]'::jsonb, 1.56, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8c066184-2b25-4330-bf63-8bfab58b3752', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '["76a33460-1070-41d4-9c21-67b7d26bca7d", "e4c811b3-1054-4bbe-a5e1-650d949c2c8e"]'::jsonb, 3.51, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8c066184-2b25-4330-bf63-8bfab58b3752', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('9b1342e6-44b1-46f4-842e-73cdb0064d26', 'f7eb3096-faec-4c65-96a9-dc4573991ec4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('9b1342e6-44b1-46f4-842e-73cdb0064d26', '5ac90ddc-6540-4fae-93d0-5fab9942be09', '["a040f38d-9f49-4a6d-9415-f7f6558aa8cc", "e752d9ee-ae8b-4e47-93fb-a05a469a71bd", "36f03fe7-ea22-4c60-9d68-2020e7c4c14d", "40f7af8e-36f2-46b8-b918-328c9d11f4ab", "b2baf352-e6a3-4169-bf0a-28e01975a168"]'::jsonb, 18.62, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('9b1342e6-44b1-46f4-842e-73cdb0064d26', '5a5702cb-c561-4538-b288-8fb896548a70', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('9b1342e6-44b1-46f4-842e-73cdb0064d26', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["7a433c15-cbf9-4b32-96ee-e26c7f9403b6", "9da2dfe5-5d68-407a-9cbc-1e6c1b2e4498", "61127c17-4ff2-448d-8baa-5f354d3c37f8", "958c931a-b627-4f66-bc08-026ec54180fc", "d0b4c053-fa66-447c-bd69-392de84ea886"]'::jsonb, 17.90, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('9b1342e6-44b1-46f4-842e-73cdb0064d26', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["627ae163-f022-4763-847b-f0cedefcdca9", "63f98ff3-0aac-4d23-a0fe-e260f80f2784", "b9883e31-7f5d-466a-8059-3ceb63d6b946", "a90414e0-db4f-4caf-a1a7-be226afc7f69", "ee9c3f66-b261-447d-a05f-651f81a761fb"]'::jsonb, 19.24, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f5fbaeab-908a-4ec0-80aa-caaea8f1a3ee', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f5fbaeab-908a-4ec0-80aa-caaea8f1a3ee', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '["c3cf55f8-32a3-44c5-a4c6-17f6a617826a", "0e3ff381-49f7-4e25-95b7-adb315803e9e"]'::jsonb, 5.70, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f5fbaeab-908a-4ec0-80aa-caaea8f1a3ee', '5a5702cb-c561-4538-b288-8fb896548a70', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f5fbaeab-908a-4ec0-80aa-caaea8f1a3ee', '5ac90ddc-6540-4fae-93d0-5fab9942be09', '["d3599aaa-6fdd-4696-99a7-487b429ef6ab", "f0ee153e-8a69-4c6e-b5db-a7f308454548", "c8209966-026a-49bc-8b6f-1c42b1347ee8", "21bf22e1-1c57-4e8a-816c-0527f31af427", "86fb589b-3b02-4723-84be-1a89fe5bba70"]'::jsonb, 14.05, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f5fbaeab-908a-4ec0-80aa-caaea8f1a3ee', 'f7eb3096-faec-4c65-96a9-dc4573991ec4', '["a549f9b6-5395-43f0-a39c-48e042117d66", "61533d9a-39fa-4c02-b853-d2d51d0920a4"]'::jsonb, 4.81, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e089de8a-76dc-440b-bc4c-9de0da0748ba', '5a5702cb-c561-4538-b288-8fb896548a70', '["3fe71147-cbd9-4042-8e4c-245d3ef5f311", "0b8685ae-e64e-4883-8c6c-259f3c6ee49b"]'::jsonb, 4.26, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e089de8a-76dc-440b-bc4c-9de0da0748ba', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '["b262a88a-3f42-4322-9f49-b1b3ad545ded", "fcb81b24-8edf-4dc5-ae09-cad23e0ceda0"]'::jsonb, 4.86, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e089de8a-76dc-440b-bc4c-9de0da0748ba', 'e4805c2f-4917-4c94-ad64-2e741a33bf2c', '["969589f2-5720-4fb5-bfdf-e70a5293c0d4", "d7994b59-f25a-4b0b-9fd2-d9f61cfa8e70"]'::jsonb, 8.85, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e089de8a-76dc-440b-bc4c-9de0da0748ba', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '["d6c9d046-248f-4d6a-9830-984138ee244a", "f77aa6c7-e931-459e-9cce-1f4da72571ed", "a3f7db46-6069-4a35-a22c-b20adb57ae95", "d40d96d5-0662-4c39-8863-50f8ec38b902", "388944e6-ea49-4327-b572-b3a622380c99"]'::jsonb, 19.62, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e089de8a-76dc-440b-bc4c-9de0da0748ba', '4c189ca9-eb35-49da-b53d-0269a124da60', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('88241a6d-0c71-4dc5-a269-d47cb65c6cbf', '4c189ca9-eb35-49da-b53d-0269a124da60', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('88241a6d-0c71-4dc5-a269-d47cb65c6cbf', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '["55e019ff-4bd6-4f42-93b6-afcab2be6dab", "ec79b096-d45b-4e91-a195-b694372d1915"]'::jsonb, 4.04, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('88241a6d-0c71-4dc5-a269-d47cb65c6cbf', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["98b4fe02-a425-4359-9aa3-7416bc595c98", "6ce31a2e-d831-4165-bb8a-ae863c641a03"]'::jsonb, 6.12, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8b595ef6-f1e7-4a23-ad4a-0668f5a8d144', 'f7eb3096-faec-4c65-96a9-dc4573991ec4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8b595ef6-f1e7-4a23-ad4a-0668f5a8d144', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '["73fb0e43-d5de-4ac6-a186-2900d757e997", "4bbaf9ff-11b8-4ead-bb3c-3ce46c196d07"]'::jsonb, 6.12, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8b595ef6-f1e7-4a23-ad4a-0668f5a8d144', '06095791-6e47-4dc9-a028-77e3eb5542f4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('576f3824-0a40-46b2-9238-68474b626f4d', '4c1053da-9743-4c98-87c3-bab79d35323e', '["7d1920b4-17c2-45e6-9914-538f7bb5193d", "2eedbcb9-ace9-45b2-a5e9-6f3b361f5da3"]'::jsonb, 1.56, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('576f3824-0a40-46b2-9238-68474b626f4d', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('576f3824-0a40-46b2-9238-68474b626f4d', '542b5504-16d8-4339-b718-5f0149f8cedd', '["04d4c673-be5a-41a1-ad09-6d73f2b24ec8", "7d280d21-5bb4-4a92-bff7-fd3018da9327"]'::jsonb, 7.75, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('576f3824-0a40-46b2-9238-68474b626f4d', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["22a11530-3f49-4a12-9501-5b758211a23f", "471052b5-453b-4859-950c-17123d0180f9"]'::jsonb, 4.66, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('bbc29458-af67-479e-ad66-55fcdd28c4ea', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('bbc29458-af67-479e-ad66-55fcdd28c4ea', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('bbc29458-af67-479e-ad66-55fcdd28c4ea', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["fbd2583b-71af-41be-8413-c74953927f5b", "875ddfed-aaec-4db3-a94a-06a02c88b308"]'::jsonb, 6.43, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('bbc29458-af67-479e-ad66-55fcdd28c4ea', 'e4805c2f-4917-4c94-ad64-2e741a33bf2c', '["bc1b6914-b0f5-4eb2-ad3e-0da844170cd0", "882f6268-7941-4c83-97fb-36fc86a72559"]'::jsonb, 3.81, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ab357eb7-18f0-4a10-b24d-2d3871b59804', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["b4087fa3-915e-455a-92e3-74a5ccb804a4", "3f42e5a7-dfe2-4891-9879-052ec855eb88"]'::jsonb, 2.13, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ab357eb7-18f0-4a10-b24d-2d3871b59804', 'f7eb3096-faec-4c65-96a9-dc4573991ec4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ab357eb7-18f0-4a10-b24d-2d3871b59804', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["0546fa33-2b1d-4176-ba14-965a4b747eb0", "41b37ea7-67e7-44a5-8a1f-233265d8470f"]'::jsonb, 6.88, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ab357eb7-18f0-4a10-b24d-2d3871b59804', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["dd9d9229-25e4-465a-bc12-7ddb181c63a4", "4d0cc388-bb7e-40d8-aff4-dc12bc8fd1e5"]'::jsonb, 4.16, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ab357eb7-18f0-4a10-b24d-2d3871b59804', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a502eadb-4a0c-42ee-8cb5-85e89dbf12be', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["c7444e6a-cb9a-4bb4-9a92-54b00ba0217f", "0acf12f4-eeac-44c0-8219-d1d5bfd13938"]'::jsonb, 2.67, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a502eadb-4a0c-42ee-8cb5-85e89dbf12be', '542b5504-16d8-4339-b718-5f0149f8cedd', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a502eadb-4a0c-42ee-8cb5-85e89dbf12be', '5ac90ddc-6540-4fae-93d0-5fab9942be09', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8753be63-bca7-489e-8fb8-db7837474f89', 'f7eb3096-faec-4c65-96a9-dc4573991ec4', '["d1eb971a-47b4-4f74-9a7f-a37059c27fa1", "93a92729-b531-46fb-9224-583593472bd4"]'::jsonb, 1.02, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8753be63-bca7-489e-8fb8-db7837474f89', 'c7488edb-018a-44d2-bfda-8ff3a75fc80d', '["5402c54c-6c23-455d-aba1-6cca37aa9495", "e511f321-6cea-4c57-9bca-81e8d118b670", "038edfc5-dbd1-434f-8b5a-7b86ea64869f", "3729dde4-06cd-4129-af6e-2ebfe5bb32be", "e8c43402-3dfc-48bf-8400-c886d712979a"]'::jsonb, 14.43, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('8753be63-bca7-489e-8fb8-db7837474f89', 'e4805c2f-4917-4c94-ad64-2e741a33bf2c', '["5373aa14-14ce-4bf6-9bdc-de42c515646b", "3b9b7cbe-2fe2-44d3-baed-c7ee052a53c8"]'::jsonb, 5.69, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0dac0120-c697-4604-ad0f-28971550afec', '542b5504-16d8-4339-b718-5f0149f8cedd', '["6b61ffef-9617-4342-bf69-0e67249afe1b", "725830e3-0d96-4732-9ed5-7a0e4bb22766"]'::jsonb, 7.97, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0dac0120-c697-4604-ad0f-28971550afec', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '["8eafefc3-eb9f-4121-8dab-258a96ae81f6", "3bfe89c0-b4f0-4e44-8d8b-6c187264f3ab"]'::jsonb, 8.71, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0dac0120-c697-4604-ad0f-28971550afec', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1181584a-fb5a-4fc4-b17f-62a59a6604d6', '1459ed8f-2280-4c74-8b31-7ee0af23a6c7', '["2a2c12c7-086c-4d11-b958-02b011b2be1c", "9e67429a-3812-4a9a-b5d3-1b82c1596b39"]'::jsonb, 1.54, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1181584a-fb5a-4fc4-b17f-62a59a6604d6', '06095791-6e47-4dc9-a028-77e3eb5542f4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1181584a-fb5a-4fc4-b17f-62a59a6604d6', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["a83df7f7-ab5d-49fc-be66-69cbab2aebeb", "5c266ff0-9403-461b-8e06-490b5e1ee228"]'::jsonb, 7.30, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cd178901-e300-4363-a34c-717c2e698676', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cd178901-e300-4363-a34c-717c2e698676', '4c1053da-9743-4c98-87c3-bab79d35323e', '["3813df29-a626-401d-ad09-fce1cd97d84f", "26e7f2ba-e81b-4219-bf6c-38254c8da27f"]'::jsonb, 3.73, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cd178901-e300-4363-a34c-717c2e698676', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '["6ea32d03-217f-4016-9244-01c79bb4d54c", "eee21b7a-fa30-4669-ab94-2110ab1e7a27"]'::jsonb, 8.06, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('29703e86-4745-4c2e-b02f-9c134e78290a', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('29703e86-4745-4c2e-b02f-9c134e78290a', 'e4805c2f-4917-4c94-ad64-2e741a33bf2c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('29703e86-4745-4c2e-b02f-9c134e78290a', 'f7eb3096-faec-4c65-96a9-dc4573991ec4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('29703e86-4745-4c2e-b02f-9c134e78290a', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f3ae8299-e0be-4923-b747-be473a25e0d0', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '["980655b6-32af-4d68-810d-298b6c72b25c", "73a909ea-9746-4b35-9ea9-16fbe78491e3"]'::jsonb, 2.63, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f3ae8299-e0be-4923-b747-be473a25e0d0', '06095791-6e47-4dc9-a028-77e3eb5542f4', '["c27c39ea-f52d-439d-8758-c9f5012446c4", "6f7fd9d6-5257-4623-83b6-d132ee42aff4", "88c06989-57dc-43b2-a8f2-5699e7e87260", "735635ca-6027-45db-9c5e-fd8da4647231", "2722a078-fb9a-461c-9ff3-5cfbf08ab79b"]'::jsonb, 14.88, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f3ae8299-e0be-4923-b747-be473a25e0d0', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["e38b1df0-c56d-44c0-bf93-a37149aa216f", "99485fd2-39ff-4233-933b-5ea7b4aa247c", "7f057392-2bc9-4ac2-9cda-f30aaa79877e", "83f76574-6ee2-436d-a399-225e3e8b8f80", "f9b9a6a3-33f0-4291-bea6-2abe5b50d00e"]'::jsonb, 19.97, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f3ae8299-e0be-4923-b747-be473a25e0d0', '5ac90ddc-6540-4fae-93d0-5fab9942be09', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('946e8594-4d5c-42b0-97b1-5053ffe1096c', 'c7488edb-018a-44d2-bfda-8ff3a75fc80d', '["e5726c9a-d573-41c2-81c8-5be7d56f5f1c", "a1c2cc0b-3853-4b1a-9194-fb0ee85e7c08"]'::jsonb, 1.50, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('946e8594-4d5c-42b0-97b1-5053ffe1096c', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '["4e59f951-0639-4725-aa72-73d6ede48ec5", "b4f4cf4e-e288-4c74-909d-b47c23d3ee90", "d6a2c623-ad40-4683-bf49-9d42aaef69d9", "488ced16-13fc-425b-9f35-3107e9cf2e5c", "47aad296-b80c-4b34-9e03-c8b5eda009f2"]'::jsonb, 11.24, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('946e8594-4d5c-42b0-97b1-5053ffe1096c', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('946e8594-4d5c-42b0-97b1-5053ffe1096c', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '["8cc07930-3ed2-45cf-bcc7-7f0975514fcb", "fbe8b961-41d1-4c95-a33c-815e7cfd2fb2"]'::jsonb, 2.74, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ee75d2b6-f0fb-4d7e-8650-24a480e66f5e', '4c1053da-9743-4c98-87c3-bab79d35323e', '["a49a77e7-1bd3-473b-a19a-076a8e5b8ba2", "26799155-e273-4471-99e4-938b41861dc5"]'::jsonb, 8.96, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ee75d2b6-f0fb-4d7e-8650-24a480e66f5e', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["c3201a92-d280-4759-987e-48abbae0cdf6", "beebcf4e-aee2-42e6-9eab-66f8e2443449", "9e047648-4754-4fb0-b73b-5bdc094bbfa1", "edd01a7f-7265-474a-b0ba-fc97a0d2e154", "9a1e82f4-887a-4d79-8323-1909b4ac9143"]'::jsonb, 10.42, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ee75d2b6-f0fb-4d7e-8650-24a480e66f5e', '06095791-6e47-4dc9-a028-77e3eb5542f4', '["285977cc-1383-4887-8448-92224de3b508", "355be6a7-a0f8-4821-b947-c6ca4615ca9c"]'::jsonb, 7.61, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ee75d2b6-f0fb-4d7e-8650-24a480e66f5e', 'c7488edb-018a-44d2-bfda-8ff3a75fc80d', '["0c548a0d-3f58-443e-b1db-908288f231bf", "c9d49362-28db-4524-b8a0-6c4bcf1737a5"]'::jsonb, 5.34, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ee75d2b6-f0fb-4d7e-8650-24a480e66f5e', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '["4d17091d-ca33-461e-9627-0c407e3eca90", "60b69be6-2049-47f0-8cd8-b0ab43afcefa"]'::jsonb, 4.42, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0fe750af-07cb-4a01-b5cf-6ab507875cb5', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '["175d74e2-7722-4c74-9a14-c544383d7b6e", "b2ab6752-0f8a-4a33-b6d5-e1fb169ee0fc"]'::jsonb, 7.36, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0fe750af-07cb-4a01-b5cf-6ab507875cb5', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '["bb85b80b-c8dc-42aa-80d6-9e904e82fae6", "826cc7c7-9266-4cc7-bf54-f55171615704"]'::jsonb, 1.13, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0fe750af-07cb-4a01-b5cf-6ab507875cb5', '4c189ca9-eb35-49da-b53d-0269a124da60', '["f7fe596b-b6be-480c-bd69-4fa4cfacd847", "654b958a-5330-4fd4-af9f-4e6a7690f2ef"]'::jsonb, 3.94, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0fe750af-07cb-4a01-b5cf-6ab507875cb5', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["ef2c2104-67e6-4c61-abad-29cbca75d213", "e2f86302-da1a-431a-9e57-1de02009eefb"]'::jsonb, 3.28, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0fe750af-07cb-4a01-b5cf-6ab507875cb5', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '["c79ff4f7-90be-4268-8ff3-f04edf53c6de", "c18fe28b-cb44-46a5-85ba-61a9b90f6f06"]'::jsonb, 6.92, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('132b5663-f3b0-44fa-8722-6b92539ef7c4', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '["2346b938-0dd5-4752-affb-d1c0a7af5f1a", "e73443b2-e0c8-45b3-80aa-e81c7ee76365"]'::jsonb, 2.01, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('132b5663-f3b0-44fa-8722-6b92539ef7c4', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('132b5663-f3b0-44fa-8722-6b92539ef7c4', '06095791-6e47-4dc9-a028-77e3eb5542f4', '["ba522e02-30cb-4b5f-bc50-21cf00424897", "fa8ac0e4-b4e7-4913-b880-5e88321bd6be"]'::jsonb, 4.25, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a66fafd3-dc4a-45eb-8c38-8e885d77b4ae', '542b5504-16d8-4339-b718-5f0149f8cedd', '["28841aaf-55da-4df6-8b64-8a5a20d024c9", "7b314a5a-52da-4b5f-937d-ece83f57858c", "e1973f18-9c4c-4c44-8b8e-da4503caef5a", "0e4da280-9d98-4bb3-b1e7-26050cd5a8fe", "cb632cc0-52da-419f-bac6-359683ae950b"]'::jsonb, 17.22, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a66fafd3-dc4a-45eb-8c38-8e885d77b4ae', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["b148a0d9-c838-4aca-bc7f-23ccc4997ced", "7d1d0ed8-a333-484b-b5a6-fc08a935bdb8", "805a08c9-09cc-446f-9c52-bfad6d60532e", "4846d3c5-f335-4682-a43b-84a4c6318776", "a7029224-6b65-4779-89c3-419a4159ebb4"]'::jsonb, 10.42, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a66fafd3-dc4a-45eb-8c38-8e885d77b4ae', 'e4805c2f-4917-4c94-ad64-2e741a33bf2c', '["9126e408-8667-4e20-89af-239af3ce41b3", "b5f0f4a8-c5ba-42d4-9c93-4fc3dd91d497"]'::jsonb, 4.33, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a66fafd3-dc4a-45eb-8c38-8e885d77b4ae', '5ac90ddc-6540-4fae-93d0-5fab9942be09', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('c86e7d19-dc83-43ea-a25f-7af2efa64511', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '["aad17f01-80b2-43c1-b303-936a4c4282a9", "5806226c-1689-4434-8dbe-b9948fb30b26"]'::jsonb, 3.57, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('c86e7d19-dc83-43ea-a25f-7af2efa64511', '5a5702cb-c561-4538-b288-8fb896548a70', '["af261305-f318-4011-acb5-d0e80e0a2558", "9088b81b-112d-4879-9c66-d1788fc32b2f", "fa2b2dca-7169-450e-977a-0bd4be4c03dd", "7429c25f-0fc6-4710-963a-53f7c7ead07a", "64a060d0-0c69-46bf-a744-80c07732ccfa"]'::jsonb, 11.24, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('c86e7d19-dc83-43ea-a25f-7af2efa64511', 'c7488edb-018a-44d2-bfda-8ff3a75fc80d', '["3e374656-1c7e-439e-93f2-682d1c943eee", "4367ea16-3eb0-4fd7-ba3e-5601ceb7665d"]'::jsonb, 3.73, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d1ca3794-6fda-4dcf-947a-5af0af5db466', 'f7eb3096-faec-4c65-96a9-dc4573991ec4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d1ca3794-6fda-4dcf-947a-5af0af5db466', '4c189ca9-eb35-49da-b53d-0269a124da60', '["e3b0edce-939a-4f24-8a8b-110f49f839e6", "16c7b32a-704c-4545-98f4-eee259f1c921", "0391d97c-415f-4b74-8732-f67f49f8d76c", "d3ca9396-b0c4-4bba-8fcb-67c3b0ec45ae", "1fded935-ceee-4db6-94e8-4a3f96bdaf6b"]'::jsonb, 12.91, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d1ca3794-6fda-4dcf-947a-5af0af5db466', '5ac90ddc-6540-4fae-93d0-5fab9942be09', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d1ca3794-6fda-4dcf-947a-5af0af5db466', '542b5504-16d8-4339-b718-5f0149f8cedd', '["d8818b43-4ff1-4612-93dc-b985bddc9560", "0c7f7bd9-3ad0-415b-b118-242efe085c07", "b7a3e91f-9b6a-43d1-962a-0fadda97dd40", "60217deb-dd68-44cf-b6aa-c3f16b568f44", "55a802da-188e-4e32-b96b-05632356125d"]'::jsonb, 11.72, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('d1ca3794-6fda-4dcf-947a-5af0af5db466', '4c1053da-9743-4c98-87c3-bab79d35323e', '["2b723b21-8cb6-4387-b97a-7d75a42a56c5", "aad222c3-be3f-4c9a-a1b8-45f0e312af41"]'::jsonb, 5.40, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('57f2db22-e9bd-4f12-8903-a94ecb7a8781', '06095791-6e47-4dc9-a028-77e3eb5542f4', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('57f2db22-e9bd-4f12-8903-a94ecb7a8781', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["71d2a8a4-11c1-426e-b4ff-466ba37066e5", "ab9411c5-04ea-4e7e-8aa7-f8eec2b6ceb0"]'::jsonb, 4.03, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('57f2db22-e9bd-4f12-8903-a94ecb7a8781', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '["1ff202db-aad5-4683-8745-8dcce5474e94", "99f88d9d-530a-49db-9995-198db1980309"]'::jsonb, 4.47, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('57f2db22-e9bd-4f12-8903-a94ecb7a8781', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["42deff39-2f08-47c3-b4e3-0ec29a34a56d", "3b831830-846c-4b86-80a3-52caa3c6d4b6", "687b0805-f303-422c-ad89-971c01249f7b", "dede0d7c-347b-473b-b6c1-7f8edb103334", "102671fc-ee84-4afe-9b7b-88c41b3f494b"]'::jsonb, 13.64, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('57f2db22-e9bd-4f12-8903-a94ecb7a8781', 'c7488edb-018a-44d2-bfda-8ff3a75fc80d', '["3a242363-3b3f-4672-be2e-8f72bcc1702a", "8b8138a2-280d-4bc7-920b-cf3eea1d7b88"]'::jsonb, 4.36, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ee2af132-e838-4c9d-9e1a-232b1dc174bb', '06095791-6e47-4dc9-a028-77e3eb5542f4', '["b66d8882-3c94-42dd-bd1f-4bdb6bcc2d78", "b969127d-1570-4211-95a4-622f7e22ddc9"]'::jsonb, 8.81, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ee2af132-e838-4c9d-9e1a-232b1dc174bb', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["635f605e-aa91-4f4a-848a-31d96ef3e985", "5a2c0732-d577-4f30-8ad3-8dd70cf40012"]'::jsonb, 3.40, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ee2af132-e838-4c9d-9e1a-232b1dc174bb', '51d1d603-9beb-4838-b367-2e29104e0954', '["5b649fbb-45f1-4ab7-9079-9fd41a43d4dd", "b84246c9-975c-4dee-a382-c0e46cb44d24"]'::jsonb, 8.81, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7a9f1e2c-4af6-4a37-9df2-015372954625', '542b5504-16d8-4339-b718-5f0149f8cedd', '["bbe15cbd-b2fa-46f4-8b98-99558cde840f", "c683cf31-d9e7-4f4b-9a24-006c955ce6e0", "9a9708c1-fb81-4280-ae77-846161a65820", "068c76a2-cb57-4b56-92ce-c41ae2fcd27a", "f02d2af9-ed18-435d-9c33-e4371fbd4358"]'::jsonb, 15.38, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7a9f1e2c-4af6-4a37-9df2-015372954625', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["c346e23b-f7e9-4fc2-86a1-141f65e09928", "d32cda8a-29b7-4f00-9699-e644d9329af1"]'::jsonb, 2.04, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7a9f1e2c-4af6-4a37-9df2-015372954625', 'c7488edb-018a-44d2-bfda-8ff3a75fc80d', '["53dc839e-318b-4b79-8976-70ca88a2d2d1", "a58b8e94-c430-4426-a40b-ba847e4f9add"]'::jsonb, 3.11, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('df8f44f4-fb0d-454d-89c6-49012a3c3086', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('df8f44f4-fb0d-454d-89c6-49012a3c3086', '4c189ca9-eb35-49da-b53d-0269a124da60', '["d2049ecd-0639-45ba-98fb-eb47a2a3d144", "2d6ae5dc-718d-4cfa-8f22-53d358f57b42"]'::jsonb, 1.64, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('df8f44f4-fb0d-454d-89c6-49012a3c3086', '51d1d603-9beb-4838-b367-2e29104e0954', '["6f1a809d-91d1-4dd7-a3fb-ef5f60423bf1", "f78060cf-83e4-4bbc-973f-f08717352ca1"]'::jsonb, 1.79, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('df8f44f4-fb0d-454d-89c6-49012a3c3086', '5ac90ddc-6540-4fae-93d0-5fab9942be09', '["45c3d9b0-59b0-4cfb-a096-97edf5b0aa41", "ffcd97c0-f630-4411-a1be-a79145c3bbb5"]'::jsonb, 4.75, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('df8f44f4-fb0d-454d-89c6-49012a3c3086', '4f6e80e5-2384-4a44-a54e-f245d73996a2', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cd4d01ff-bbbf-447c-bd2d-5e6f5989ddaf', '4c189ca9-eb35-49da-b53d-0269a124da60', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cd4d01ff-bbbf-447c-bd2d-5e6f5989ddaf', '4f6e80e5-2384-4a44-a54e-f245d73996a2', '["3b7578ee-db31-45b6-b2dc-573823ee778e", "29e806a7-a708-4d5b-8c49-4b248c13cff3", "b1ddeaad-42cb-4c85-8acc-8c652a387107", "03764956-214b-4556-8ed8-363e49cb68ec", "5cb9c74c-bc23-4246-9c26-c0ed8191a60a"]'::jsonb, 13.11, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cd4d01ff-bbbf-447c-bd2d-5e6f5989ddaf', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '["59128341-59c6-416d-b883-fdac260d5f92", "eb03be0c-111b-407f-a679-0be3a1cfd1a1"]'::jsonb, 5.50, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cd4d01ff-bbbf-447c-bd2d-5e6f5989ddaf', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["b8a9bb2b-2fa6-4e57-a117-c35a81fcaaa3", "1ec8cc17-0550-4c0e-8b4d-e8d0071f69ba"]'::jsonb, 7.97, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e0d81c38-86c3-4060-aea7-3ab6e14fe6f1', 'e4805c2f-4917-4c94-ad64-2e741a33bf2c', '["a255fd7b-3994-4fa9-9ae9-190264d69c33", "0d92ebbf-c211-403b-bdb4-888adb9a0a96"]'::jsonb, 8.58, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e0d81c38-86c3-4060-aea7-3ab6e14fe6f1', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('e0d81c38-86c3-4060-aea7-3ab6e14fe6f1', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('294370f7-590a-41ec-901c-2778f02320e4', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('294370f7-590a-41ec-901c-2778f02320e4', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '["80eb368a-31b0-4c8a-a028-300263e157ff", "b5109f1e-9e6a-4acd-8388-e2fe1c89d557", "f41e94d9-c447-4121-8a03-e8578323b8a3", "850219ba-b010-40b5-bff3-545d20708054", "f7ddf939-8b5a-4cee-9b60-7cf37c43d64c"]'::jsonb, 17.78, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('294370f7-590a-41ec-901c-2778f02320e4', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('294370f7-590a-41ec-901c-2778f02320e4', '1459ed8f-2280-4c74-8b31-7ee0af23a6c7', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('69c7e20d-c37c-4f18-865e-69270273a18c', '542b5504-16d8-4339-b718-5f0149f8cedd', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('69c7e20d-c37c-4f18-865e-69270273a18c', '4f6e80e5-2384-4a44-a54e-f245d73996a2', '["43f597dc-c021-4daf-af76-0d6d2ee6b8f6", "33a8bcdd-39e2-4697-b004-9db13987f9ec"]'::jsonb, 6.97, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('69c7e20d-c37c-4f18-865e-69270273a18c', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["b92247f8-098d-4e71-95ea-1567c6f4aff5", "a775cad6-fd2d-4378-8b27-579c5fe2c256"]'::jsonb, 5.31, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('69c7e20d-c37c-4f18-865e-69270273a18c', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('98211652-c380-4008-8f29-fa1c28d22f9b', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('98211652-c380-4008-8f29-fa1c28d22f9b', 'c7488edb-018a-44d2-bfda-8ff3a75fc80d', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('98211652-c380-4008-8f29-fa1c28d22f9b', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('897dce3f-aedc-4864-9e72-c268a4537b0c', '4c1053da-9743-4c98-87c3-bab79d35323e', '["cf4de22c-113d-4fc8-b4f7-8f0335a4581d", "a8f3363b-a374-4014-827e-cf26ad553a06", "9ea79365-54e1-4e77-92fc-281eb1a68b03", "6f82ab99-9e48-4eac-b934-09570d34e9dd", "915a4e74-6bdf-47ed-93d9-3f8272634314"]'::jsonb, 12.87, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('897dce3f-aedc-4864-9e72-c268a4537b0c', '17039bf1-1fa2-46c4-9f19-3c6243067b0c', '["2d383e66-c18c-4834-9087-b2e81f559c6e", "ff712ac9-42d0-4b06-a5a4-aea64f2c6c68", "21222aae-8fc2-4b0b-a12a-2148514d0d56", "e6b1a705-1599-4ee2-8bd4-60db6d30c4d6", "11ed2ff4-28b3-4fc5-b4ed-6595ba1b0421"]'::jsonb, 14.99, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('897dce3f-aedc-4864-9e72-c268a4537b0c', '542b5504-16d8-4339-b718-5f0149f8cedd', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('897dce3f-aedc-4864-9e72-c268a4537b0c', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '["7864ed46-aaed-4167-b142-b4a69b03edeb", "038c6760-8284-4c6a-9872-8075ae856d4f", "4de4285d-4fcb-4d0f-b1ea-654f9a347f6f", "dc43fbd8-5f6f-4a60-a08f-4139dcdb8ce8", "2fefbd88-4ab2-42d0-b4de-4400d929f72f"]'::jsonb, 10.52, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7fb91fe7-1dbc-40bb-8bbb-3e35fe79fba7', 'f4532dab-4fda-4258-80fc-a0c479ce4814', '["80e1d2e8-0ea3-48b8-94f4-d8cc7c54bbbf", "caf12e52-3b26-413d-aea7-209e23f2ae22"]'::jsonb, 7.66, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7fb91fe7-1dbc-40bb-8bbb-3e35fe79fba7', '4c189ca9-eb35-49da-b53d-0269a124da60', '["dd45e5ca-ba4f-459c-9a29-0c3d453df448", "9b5084ce-9658-4e90-af96-2d60e9da593d"]'::jsonb, 5.12, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('7fb91fe7-1dbc-40bb-8bbb-3e35fe79fba7', '4f6e80e5-2384-4a44-a54e-f245d73996a2', '["25da447d-ce4c-4bee-9b82-3c685d4e4bc1", "800b365a-e1d8-471e-8640-f91332e766a5"]'::jsonb, 8.52, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3495ebb7-4fac-4f2b-8995-07bbcf736fab', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3495ebb7-4fac-4f2b-8995-07bbcf736fab', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["9c45d3e0-dbc3-435c-b180-fc313d1fd803", "107a714e-3ae3-4f89-a2c0-b485cf399c5d", "6d66abe8-5acd-43fd-a815-f6b2aea80a3e", "36a735cf-16e1-4ce5-bf95-0f1181505253", "ac020091-84d5-430c-a2fa-bf6472f8f39b"]'::jsonb, 18.15, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3495ebb7-4fac-4f2b-8995-07bbcf736fab', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["8a88a5e7-251f-42af-b6de-175467083f63", "a729adab-c3c4-4cba-b96f-0c8d3f7f5c01"]'::jsonb, 5.66, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('3495ebb7-4fac-4f2b-8995-07bbcf736fab', '4c189ca9-eb35-49da-b53d-0269a124da60', '["e99a0845-1fda-4693-b94c-08728140e684", "4ba5f9fa-c382-430e-b8a8-ef58c0ca52e2"]'::jsonb, 7.37, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('9de3070d-6f08-4214-8694-9823ab8a269e', '78e4148b-47c1-4a54-ac46-78a30f315201', '["c90f12da-cd40-4766-bc44-dadf21227974", "cb918849-b0e3-4916-872e-c8cb16064baf"]'::jsonb, 4.95, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('9de3070d-6f08-4214-8694-9823ab8a269e', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('9de3070d-6f08-4214-8694-9823ab8a269e', '15b75f41-f071-43db-b8ff-fc74a15f3b66', '["0fb086ba-d5f5-4dbd-ae9f-996374563da8", "d3a0510e-752b-4758-8b6f-0203c65d0538"]'::jsonb, 7.55, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('9de3070d-6f08-4214-8694-9823ab8a269e', 'e4805c2f-4917-4c94-ad64-2e741a33bf2c', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('fb51cf19-b5c1-40aa-889a-aef59073ed80', '4c189ca9-eb35-49da-b53d-0269a124da60', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('fb51cf19-b5c1-40aa-889a-aef59073ed80', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('fb51cf19-b5c1-40aa-889a-aef59073ed80', '1459ed8f-2280-4c74-8b31-7ee0af23a6c7', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('fb51cf19-b5c1-40aa-889a-aef59073ed80', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["b9ad6350-86b4-46b5-844b-15c876c34d85", "0dd3092c-bd63-430c-984f-9cfc1649cb17", "fe1d648a-4387-4234-906c-bfa1a8ac4c9a", "8b700e1f-199e-42d5-bca9-6dcb223f2053", "49d95e4b-3cc6-47e8-8dc5-2793dbc16d9c"]'::jsonb, 19.67, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('fb51cf19-b5c1-40aa-889a-aef59073ed80', '4c1053da-9743-4c98-87c3-bab79d35323e', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1f13b274-daf2-4b4e-8298-478865b040c7', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1f13b274-daf2-4b4e-8298-478865b040c7', '51d1d603-9beb-4838-b367-2e29104e0954', '["16fbc674-6a6b-4939-ad98-ecd0f5e5b020", "766dec16-79fc-4065-becf-830919ab10c6"]'::jsonb, 7.22, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1f13b274-daf2-4b4e-8298-478865b040c7', '4f6e80e5-2384-4a44-a54e-f245d73996a2', '["3f25695f-a045-4911-9628-d48c7087cca2", "498dbc80-fbe4-40e4-b283-f7fd210f16d7"]'::jsonb, 8.46, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('1f13b274-daf2-4b4e-8298-478865b040c7', 'a2a6208d-c6e4-496f-a55f-1bf923540805', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dee76e54-1ebe-421b-adc5-8eccb0409420', '4c1053da-9743-4c98-87c3-bab79d35323e', '["0769e08e-2c59-4e25-bb94-c72609b0cce7", "45032618-02e0-47ce-874f-1649b1425f04", "ccd5ec5b-a908-40c9-b019-0be1821e3a5b", "2d0958a5-c6e8-43b4-b03c-4fe1bdcdc7c4", "f1c3d401-9147-493c-97a4-cd48df6f5b0d"]'::jsonb, 19.09, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dee76e54-1ebe-421b-adc5-8eccb0409420', '51d1d603-9beb-4838-b367-2e29104e0954', '["3eadbefe-1390-425e-ac3b-dd96d931fc27", "b2847d77-19d7-4c60-ac79-58ede0f8f415"]'::jsonb, 1.57, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('dee76e54-1ebe-421b-adc5-8eccb0409420', '1459ed8f-2280-4c74-8b31-7ee0af23a6c7', '["869c68de-441a-4f0f-8ef9-89a178cec20d", "7394b951-f10d-4f33-be5e-18a1e57cc9d9"]'::jsonb, 4.53, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('c29b746b-f225-4590-8c03-3c3638cec752', '5123da4e-7cdc-4fc7-bc8a-4ad8a6e14474', '["b3af4c1f-2fb0-4c97-9b57-7f70c2d15c09", "37a6ca84-740c-4c8e-95fd-3b372291ad10"]'::jsonb, 7.61, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('c29b746b-f225-4590-8c03-3c3638cec752', '4c189ca9-eb35-49da-b53d-0269a124da60', '["28169744-5b03-4a19-9334-5e347daa46eb", "300d7c19-1e1c-4647-a946-af3644c6b389"]'::jsonb, 7.40, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('c29b746b-f225-4590-8c03-3c3638cec752', 'fe7e19f7-bb9a-441d-a0d5-d78db6b60202', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f216d02f-c7ba-4bbf-aa7a-9caeefb8c48b', 'c7488edb-018a-44d2-bfda-8ff3a75fc80d', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f216d02f-c7ba-4bbf-aa7a-9caeefb8c48b', '4c189ca9-eb35-49da-b53d-0269a124da60', '["dd9d0421-ca08-4ad9-ba68-1de6b5d949a2", "37e31fd8-ac48-41dd-808a-50a75af19851"]'::jsonb, 1.71, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('f216d02f-c7ba-4bbf-aa7a-9caeefb8c48b', '4c1053da-9743-4c98-87c3-bab79d35323e', '["27ea61bb-11ff-4c5e-8e39-afcc9386cdeb", "8f89a70f-3555-4396-9cf8-e07c399d02f0"]'::jsonb, 2.48, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cf0c9e67-5849-467b-ae8c-d26ec9b724da', '4c1053da-9743-4c98-87c3-bab79d35323e', '["8aeec910-2680-4922-bb3e-b051bd69edfd", "378b7823-0899-4cb9-8cfd-d5cb6819cb3f"]'::jsonb, 7.03, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cf0c9e67-5849-467b-ae8c-d26ec9b724da', '2e9cd46b-bd08-490b-ad85-e9775c274d47', '["e41b7cbe-5d61-41c6-a253-b079a801ad56", "28e5a70d-2251-452b-b322-8fc15b8e6fff", "1aea490e-7411-4d89-ba2b-e3522bbe67fd", "c051e033-580e-4d22-adb6-487536046d49", "4090db52-cf16-4c9a-b481-5b358a1b38b5"]'::jsonb, 14.81, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('cf0c9e67-5849-467b-ae8c-d26ec9b724da', '51d1d603-9beb-4838-b367-2e29104e0954', '[]'::jsonb, 0.00, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            
COMMIT;