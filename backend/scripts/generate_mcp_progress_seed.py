import os
import sys
import json
import random

def generate_sql():
    # Use standard UUIDs locally to generate SQL string
    students = ['2aad2f75-56b1-4715-b4a3-6f4c404ea51c', '637a9c1b-33ac-4813-91a6-ffad66de27e9', '5a36dca7-71b9-4d7e-a46d-92081d829460', '0e6736c0-0d1b-4477-a24b-3be9a06a4861', 'ff70440d-8fc9-4388-af8a-5e2c94816036', 'a30aa3bf-119b-402d-9980-5c2569c27b8b'] # using known student IDs
    courses = ['26b443d2-a7d1-4a59-b992-ee38484df5dd', 'ea825838-5182-4aa8-92f7-ad540b904128', 'b271be2b-3f71-4d25-a6f3-c262929d423a', '56e9c490-6430-4eaf-bad6-eb422501ab52', '6cd90867-0c75-43a9-a7ed-f25b29dbf5c3', 'f0739c94-fcf6-4d51-a2cc-4df536db6d18', '75b2de34-b258-47ac-a15d-5fb901fcfdd7', '38a6ec89-ec12-401d-abea-d8cbfe39cc61'] # sample known courses
    
    sql = []
    
    for student_id in students:
        enrolled_courses = random.sample(courses, min(len(courses), random.randint(3, 5)))
        
        for course_id in enrolled_courses:
            r = random.random()
            
            if r < 0.2:
                hours = round(random.uniform(10.0, 20.0), 2)
                mod_idx = 3
                less_idx = 0
                comp_lessons = ["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"]
            elif r < 0.7:
                hours = round(random.uniform(1.0, 9.0), 2)
                mod_idx = 1
                less_idx = 1
                comp_lessons = ["00000000-0000-0000-0000-000000000001"]
            else:
                hours = 0.0
                mod_idx = 0
                less_idx = 0
                comp_lessons = []
                
            sql.append(f"""
            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('{student_id}', '{course_id}', '{json.dumps(comp_lessons)}'::jsonb, {hours}, {mod_idx}, {less_idx})
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            """)
            
    with open('progress_seed_mcp.sql', 'w') as f:
        f.write('\n'.join(sql))
        
generate_sql()
