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
        

