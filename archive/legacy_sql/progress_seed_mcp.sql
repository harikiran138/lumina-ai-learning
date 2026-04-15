
            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('2aad2f75-56b1-4715-b4a3-6f4c404ea51c', '6cd90867-0c75-43a9-a7ed-f25b29dbf5c3', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 6.57, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('2aad2f75-56b1-4715-b4a3-6f4c404ea51c', '38a6ec89-ec12-401d-abea-d8cbfe39cc61', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 5.57, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('2aad2f75-56b1-4715-b4a3-6f4c404ea51c', 'f0739c94-fcf6-4d51-a2cc-4df536db6d18', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 4.75, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('637a9c1b-33ac-4813-91a6-ffad66de27e9', 'f0739c94-fcf6-4d51-a2cc-4df536db6d18', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 8.35, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('637a9c1b-33ac-4813-91a6-ffad66de27e9', 'ea825838-5182-4aa8-92f7-ad540b904128', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 2.97, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('637a9c1b-33ac-4813-91a6-ffad66de27e9', '75b2de34-b258-47ac-a15d-5fb901fcfdd7', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 4.68, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('637a9c1b-33ac-4813-91a6-ffad66de27e9', '6cd90867-0c75-43a9-a7ed-f25b29dbf5c3', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 4.31, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5a36dca7-71b9-4d7e-a46d-92081d829460', 'f0739c94-fcf6-4d51-a2cc-4df536db6d18', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 2.59, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5a36dca7-71b9-4d7e-a46d-92081d829460', '75b2de34-b258-47ac-a15d-5fb901fcfdd7', '[]'::jsonb, 0.0, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5a36dca7-71b9-4d7e-a46d-92081d829460', 'b271be2b-3f71-4d25-a6f3-c262929d423a', '[]'::jsonb, 0.0, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5a36dca7-71b9-4d7e-a46d-92081d829460', 'ea825838-5182-4aa8-92f7-ad540b904128', '[]'::jsonb, 0.0, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('5a36dca7-71b9-4d7e-a46d-92081d829460', '56e9c490-6430-4eaf-bad6-eb422501ab52', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 5.35, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0e6736c0-0d1b-4477-a24b-3be9a06a4861', 'ea825838-5182-4aa8-92f7-ad540b904128', '[]'::jsonb, 0.0, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0e6736c0-0d1b-4477-a24b-3be9a06a4861', '75b2de34-b258-47ac-a15d-5fb901fcfdd7', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 8.38, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('0e6736c0-0d1b-4477-a24b-3be9a06a4861', '6cd90867-0c75-43a9-a7ed-f25b29dbf5c3', '["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"]'::jsonb, 14.43, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ff70440d-8fc9-4388-af8a-5e2c94816036', '56e9c490-6430-4eaf-bad6-eb422501ab52', '["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"]'::jsonb, 14.48, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ff70440d-8fc9-4388-af8a-5e2c94816036', '38a6ec89-ec12-401d-abea-d8cbfe39cc61', '["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"]'::jsonb, 17.23, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ff70440d-8fc9-4388-af8a-5e2c94816036', '26b443d2-a7d1-4a59-b992-ee38484df5dd', '[]'::jsonb, 0.0, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('ff70440d-8fc9-4388-af8a-5e2c94816036', 'b271be2b-3f71-4d25-a6f3-c262929d423a', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 5.77, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a30aa3bf-119b-402d-9980-5c2569c27b8b', 'b271be2b-3f71-4d25-a6f3-c262929d423a', '["00000000-0000-0000-0000-000000000001"]'::jsonb, 4.98, 1, 1)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a30aa3bf-119b-402d-9980-5c2569c27b8b', '38a6ec89-ec12-401d-abea-d8cbfe39cc61', '["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"]'::jsonb, 19.28, 3, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            

            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('a30aa3bf-119b-402d-9980-5c2569c27b8b', '56e9c490-6430-4eaf-bad6-eb422501ab52', '[]'::jsonb, 0.0, 0, 0)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            