import uuid
import datetime
from app.core.security import get_password_hash

# Generate SQL
sql = []

# 1. Update existing Institution (assuming single institution)
sql.append(f"""  # nosec B608
UPDATE public.institutions
SET institution_name = 'Nadimpalli Satyanarayana Raju Institute of Technology',
    email = 'contact@nsrit.edu.in',
    onboarding_status = 'ACTIVE';
""")

# Get the institution ID dynamically into a temp table / CTE for subsequent inserts isn't strictly necessary if we do it via PL/pgSQL
# Using DO block
sql.append("DO $$")
sql.append("DECLARE")
sql.append("    inst_id UUID;")
sql.append("    dept_cse_id UUID := gen_random_uuid();")
sql.append("    dept_ece_id UUID := gen_random_uuid();")
sql.append("    dept_mech_id UUID := gen_random_uuid();")
sql.append("    dept_civil_id UUID := gen_random_uuid();")
sql.append("    prog_cse_id UUID := gen_random_uuid();")
sql.append("    prog_ece_id UUID := gen_random_uuid();")
sql.append("    prog_mech_id UUID := gen_random_uuid();")
sql.append("    prog_civil_id UUID := gen_random_uuid();")
sql.append("    hod_cse_id UUID := gen_random_uuid();")
sql.append("    hod_ece_id UUID := gen_random_uuid();")
sql.append("    hod_mech_id UUID := gen_random_uuid();")
sql.append("    hod_civil_id UUID := gen_random_uuid();")
sql.append("    fac_id UUID;")
sql.append("BEGIN")
sql.append("    SELECT id INTO inst_id FROM public.institutions LIMIT 1;")
sql.append("    IF inst_id IS NULL THEN")
sql.append("        inst_id := gen_random_uuid();")
sql.append("        INSERT INTO public.institutions (id, institution_name, email, onboarding_status) VALUES (inst_id, 'Nadimpalli Satyanarayana Raju Institute of Technology', 'contact@nsrit.edu.in', 'ACTIVE');")
sql.append("    END IF;")

# Clear old mock data just in case to avoid duplicates
sql.append("    DELETE FROM public.semesters;")
sql.append("    DELETE FROM public.programs;")
sql.append("    DELETE FROM public.departments;")
sql.append("    DELETE FROM public.users WHERE role IN ('hod', 'teacher');")

# Departments
departments = [
    ("Computer Science and Engineering", "CSE", "dept_cse_id", "hod_cse_id"),
    ("Electronics and Communication Engineering", "ECE", "dept_ece_id", "hod_ece_id"),
    ("Mechanical Engineering", "MECH", "dept_mech_id", "hod_mech_id"),
    ("Civil Engineering", "CIVIL", "dept_civil_id", "hod_civil_id")
]

for name, code, d_id_var, h_id_var in departments:
    # Insert Department
    sql.append(f"""    INSERT INTO public.departments (id, institution_id, department_name, code, description) VALUES ({d_id_var}, inst_id, '{name}', '{code}', 'Department of {name} at NSRIT');""")  # nosec B608

    
    # Insert HOD User
    email = f"hod.{code.lower()}@nsrit.edu.in"
    pw_hash = get_password_hash(f"hod{code}123")
    sql.append(f"""    INSERT INTO public.users (id, role, email, name, password_hash, is_active, department_id, created_at, updated_at) VALUES ({h_id_var}, 'hod', '{email}', 'HOD {code}', '{pw_hash}', true, {d_id_var}, now(), now());""")  # nosec B608


    # Update Department with HOD
    sql.append(f"""    UPDATE public.departments SET hod_id = {h_id_var} WHERE id = {d_id_var};""")  # nosec B608


    # Insert Program
    prog_name = f"B.Tech in {name}"
    p_id_var = f"prog_{code.lower()}_id"
    sql.append(f"""    INSERT INTO public.programs (id, institution_id, department_id, program_name, level, duration_years) VALUES ({p_id_var}, inst_id, {d_id_var}, '{prog_name}', 'Undergraduate', 4);""")  # nosec B608


    # Insert Semesters
    for sem in range(1, 9):
        sem_name = f"Semester {sem}"
        sql.append(f"""    INSERT INTO public.semesters (id, program_id, term_name, semester_number, credits_required) VALUES (gen_random_uuid(), {p_id_var}, '{sem_name}', {sem}, 24);""")  # nosec B608


    # Insert Faculty (6 per department)
    for i in range(1, 7):
        fac_email = f"faculty{i}.{code.lower()}@nsrit.edu.in"
        fac_pw_hash = get_password_hash("faculty123")
        sql.append(f"""    fac_id := gen_random_uuid();""")
        sql.append(f"""    INSERT INTO public.users (id, role, email, name, password_hash, is_active, department_id, created_at, updated_at) VALUES (fac_id, 'teacher', '{fac_email}', '{code} Professor {i}', '{fac_pw_hash}', true, {d_id_var}, now(), now());""")  # nosec B608


sql.append("END $$;")

with open("tmp/seed_nsrit.sql", "w") as f:
    f.write("\\n".join(sql))
print("Successfully generated tmp/seed_nsrit.sql")
