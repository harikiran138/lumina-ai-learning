#!/usr/bin/env python3
"""
Lumina Institute of Technology - Full Ecosystem Seed
Run: python3 scripts/seed_full_ecosystem.py
"""
import psycopg2, bcrypt, uuid, csv, json
from datetime import datetime, timedelta

import os
DB_URL = os.environ.get("DATABASE_URL",
    "postgresql://postgres:CHANGE_ME@db.odyjksznsdeyweylovzl.supabase.co:5432/postgres")

def hp(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=12)).decode()

def uid():
    return str(uuid.uuid4())

def concepts(title):
    words = [w for w in title.replace(',',' ').replace(':',' ').split() if len(w) > 4][:8]
    return [' '.join(words[i:i+2]) for i in range(0, min(len(words)-1, 4))]

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()
creds = []

print("\n=== LUMINA FULL ECOSYSTEM SEED ===\n")

# ── 0. WIPE ────────────────────────────────────────────────────────────────────
print("0. Wiping all data...")
cur.execute("""DO $$ BEGIN
  EXECUTE (SELECT string_agg('TRUNCATE TABLE public.' || tablename || ' CASCADE', '; ')
           FROM pg_tables
           WHERE schemaname='public'
             AND tablename NOT IN ('schema_migrations'));
END $$;""")
conn.commit()
print("   ✓ Cleared\n")

# ── 1. ROLES ───────────────────────────────────────────────────────────────────
role_ids = {}
for r in ['super_admin','admin','hod','teacher','student','parent','counselor',
          'mentor','peer_tutor','content_creator','researcher','alumni']:
    cur.execute("INSERT INTO roles(id,name) VALUES(%s,%s) RETURNING id", (uid(),r))
    role_ids[r] = cur.fetchone()[0]
conn.commit()
print(f"1. ✓ {len(role_ids)} roles\n")

# ── 2. INSTITUTION ─────────────────────────────────────────────────────────────
inst_id = uid()
cur.execute("""INSERT INTO institutions(id,institution_name,email,onboarding_status,
    password_hash,code,is_active,login_policy,academic_year)
    VALUES(%s,'Lumina Institute of Technology','admin@luminalit.edu','ACTIVE',
    %s,'LIT',true,'email_only','2025-2026')""", (inst_id, hp('admin@luminalit.edu')))
cur.execute("""INSERT INTO institution_details(institution_id,type,status,established_year,
    affiliation,address,city,state,country,vision,mission)
    VALUES(%s,'Engineering College','Active',2005,'AICTE / Anna University',
    '#42 Tech Park Road, Electronic City','Bangalore','Karnataka','India',
    'Globally recognized institution nurturing innovation in technology',
    'Quality technical education through cutting-edge research and industry collaboration')""", (inst_id,))
conn.commit()
print(f"2. ✓ Institution: Lumina Institute of Technology\n")

# ── 3. ADMIN ───────────────────────────────────────────────────────────────────
admin_id = uid()
cur.execute("""INSERT INTO users(id,email,name,role,password_hash,phone,status,is_active,
    college_id,employee_id,onboarding_step)
    VALUES(%s,'admin@lumina.com','Admin LIT','admin',%s,'+91-9000000000','active',true,%s,'EMP-ADMIN-001',5)""",
    (admin_id, hp('admin@lumina.com'), inst_id))
cur.execute("INSERT INTO user_roles VALUES(%s,%s,%s)", (admin_id, role_ids['admin'], inst_id))
conn.commit()
creds.append(['admin','Admin LIT','admin@lumina.com','admin@lumina.com','Admin Dashboard','Institution Admin','LIT','—'])
print(f"3. ✓ Admin: admin@lumina.com\n")

# ── 4. DEPARTMENT + HOD ────────────────────────────────────────────────────────
hod_id = uid()
cur.execute("""INSERT INTO users(id,email,name,role,password_hash,phone,status,is_active,
    college_id,employee_id,full_name,onboarding_step)
    VALUES(%s,'hod.cse@lumina.com','Dr. Rajesh Kumar','hod',%s,'+91-9000000001',
    'active',true,%s,'EMP-HOD-001','Dr. Rajesh Kumar',5)""",
    (hod_id, hp('hod.cse@lumina.com'), inst_id))
cur.execute("INSERT INTO user_roles VALUES(%s,%s,%s)", (hod_id, role_ids['hod'], inst_id))

dept_id = uid()
cur.execute("""INSERT INTO departments(id,institution_id,department_name,description,hod_id,
    code,abbreviation,intake_strength,established_year,teacher_limit,class_limit,course_limit,metadata)
    VALUES(%s,%s,'Computer Science and Engineering',
    'B.Tech CSE: AI, Systems, Networks, Software Engineering',
    %s,'CSE','CSE',60,2005,20,8,60,'{}')""", (dept_id, inst_id, hod_id))
cur.execute("UPDATE users SET department_id=%s, dept_id=%s WHERE id=%s", (dept_id, dept_id, hod_id))
conn.commit()
creds.append(['hod','Dr. Rajesh Kumar','hod.cse@lumina.com','hod.cse@lumina.com','HOD Portal','Compiler Design, Theory of Computation','CSE','—'])
print(f"4. ✓ Department: CSE | HOD: hod.cse@lumina.com\n")

# ── 5. PROGRAM ─────────────────────────────────────────────────────────────────
prog_id = uid()
cur.execute("""INSERT INTO programs(id,institution_id,department_id,program_name,degree,
    level,intake,status,duration_years)
    VALUES(%s,%s,%s,'B.Tech Computer Science and Engineering','B.Tech','UG',60,'active',4)""",
    (prog_id, inst_id, dept_id))
conn.commit()
print(f"5. ✓ Program: B.Tech CSE\n")

# ── 6. SEMESTERS ───────────────────────────────────────────────────────────────
sem_ids = {}
for n, title in {
    1:'Semester I - Foundation', 2:'Semester II - Foundation',
    3:'Semester III - Engineering Base', 4:'Semester IV - Engineering Base',
    5:'Semester V - Professional Core', 6:'Semester VI - Professional Core',
    7:'Semester VII - Specialization', 8:'Semester VIII - Capstone'
}.items():
    s = uid()
    sem_ids[n] = s
    cur.execute("INSERT INTO semesters(id,program_id,semester_number,title) VALUES(%s,%s,%s,%s)",
                (s, prog_id, n, title))
conn.commit()
print(f"6. ✓ 8 semesters\n")

# ── 7. BATCHES + CLASSES ───────────────────────────────────────────────────────
# Year 1=admitted 2025, Year 2=2024, Year 3=2023, Year 4=2022
batches = [
    {'yr':2025,'label':'2025-2029','cur_sem':1,'yos':1},
    {'yr':2024,'label':'2024-2028','cur_sem':3,'yos':2},
    {'yr':2023,'label':'2023-2027','cur_sem':5,'yos':3},
    {'yr':2022,'label':'2022-2026','cur_sem':7,'yos':4},
]
batch_ids = {}
class_ids = {}
for b in batches:
    bid = uid()
    batch_ids[b['yr']] = bid
    cur.execute("""INSERT INTO batches(id,college_id,dept_id,year,label,sections,
        current_semester,is_lateral) VALUES(%s,%s,%s,%s,%s,'{A}',%s,false)""",
        (bid, inst_id, dept_id, b['yr'], b['label'], b['cur_sem']))
    cid = uid()
    class_ids[b['yr']] = cid
    cur.execute("""INSERT INTO classes(id,program_id,semester_id,section_name,academic_year,
        batch_name,class_name,batch,section,department_id,batch_year,batch_id,student_limit,teacher_limit)
        VALUES(%s,%s,%s,'A',%s,%s,%s,%s,'A',%s,%s,%s,60,10)""",
        (cid, prog_id, sem_ids[b['cur_sem']], b['label'], b['label'],
         f"CSE-{b['yr']}-A", b['label'], dept_id, str(b['yr']), bid))
conn.commit()
print(f"7. ✓ 4 batches + 4 class sections\n")

# ── 8. FACULTY (15) ────────────────────────────────────────────────────────────
faculty = [
    ('Prof. Priya Sharma',   'priya.sharma',   'EMP-002','teacher','AI & Machine Learning'),
    ('Prof. Arjun Patel',    'arjun.patel',    'EMP-003','teacher','Data Structures & Algorithms'),
    ('Prof. Sunita Rao',     'sunita.rao',     'EMP-004','teacher','Database Systems'),
    ('Prof. Vikram Singh',   'vikram.singh',   'EMP-005','teacher','OS & Computer Architecture'),
    ('Prof. Meera Nair',     'meera.nair',     'EMP-006','teacher','Web Technologies & Full Stack'),
    ('Prof. Anand Krishnan', 'anand.krishnan', 'EMP-007','teacher','Software Engineering & OOP'),
    ('Prof. Deepa Mehta',    'deepa.mehta',    'EMP-008','teacher','Computer Networks & DevOps'),
    ('Prof. Rahul Gupta',    'rahul.gupta',    'EMP-009','teacher','Information Security & Cyber'),
    ('Prof. Kavitha Iyer',   'kavitha.iyer',   'EMP-010','teacher','Deep Learning & Generative AI'),
    ('Dr. Suresh Babu',      'suresh.babu',    'EMP-011','teacher','Mathematics'),
    ('Dr. Lakshmi Devi',     'lakshmi.devi',   'EMP-012','teacher','Engineering Sciences'),
    ('Prof. Ravi Teja',      'ravi.teja',      'EMP-013','teacher','Distributed Systems & Cloud'),
    ('Prof. Nisha Joshi',    'nisha.joshi',    'EMP-014','teacher','Humanities & Social Sciences'),
    ('Prof. Sanjay Varma',   'sanjay.varma',   'EMP-015','teacher','Big Data & Cloud Engineering'),
    ('Prof. Divya Menon',    'divya.menon',    'EMP-016','teacher','Computer Organization & Digital Logic'),
]
fac_ids = {'hod': hod_id}
for (name, prefix, emp, role, spec) in faculty:
    email = f"{prefix}@lumina.com"
    fid = uid()
    fac_ids[prefix] = fid
    cur.execute("""INSERT INTO users(id,email,name,role,password_hash,phone,status,is_active,
        college_id,department_id,dept_id,employee_id,full_name,onboarding_step)
        VALUES(%s,%s,%s,%s,%s,%s,'active',true,%s,%s,%s,%s,%s,5)""",
        (fid, email, name, role, hp(email), f'+91-90000{emp[-3:]}',
         inst_id, dept_id, dept_id, emp, name))
    cur.execute("INSERT INTO user_roles VALUES(%s,%s,%s)", (fid, role_ids[role], inst_id))
    creds.append(['teacher', name, email, email, 'Teacher Portal', spec, 'CSE', '—'])
conn.commit()
print(f"8. ✓ 15 faculty\n")

# ── 9. STUDENTS (10 per batch) ─────────────────────────────────────────────────
student_names = {
    2025:[('Aarav Sharma','aarav.sharma'),('Ananya Patel','ananya.patel'),
          ('Arjun Reddy','arjun.reddy'),('Bhavya Nair','bhavya.nair'),
          ('Chirag Mehta','chirag.mehta'),('Diya Krishnan','diya.krishnan'),
          ('Gaurav Singh','gaurav.singh'),('Harini Rao','harini.rao'),
          ('Ishaan Gupta','ishaan.gupta'),('Jyoti Iyer','jyoti.iyer')],
    2024:[('Karan Verma','karan.verma'),('Lavanya Menon','lavanya.menon'),
          ('Manish Tiwari','manish.tiwari'),('Nandini Pillai','nandini.pillai'),
          ('Omkar Desai','omkar.desai'),('Pallavi Joshi','pallavi.joshi'),
          ('Rahul Kumar','rahul.kumar'),('Sakshi Dubey','sakshi.dubey'),
          ('Tarun Bhat','tarun.bhat'),('Uma Chandra','uma.chandra')],
    2023:[('Varun Agarwal','varun.agarwal'),('Vidya Suresh','vidya.suresh'),
          ('Vishal Pandey','vishal.pandey'),('Yashika Sinha','yashika.sinha'),
          ('Zara Khan','zara.khan'),('Abhishek Roy','abhishek.roy'),
          ('Akanksha Mishra','akanksha.mishra'),('Alok Tiwari','alok.tiwari'),
          ('Amrita Bose','amrita.bose'),('Anil Kapoor','anil.kapoor')],
    2022:[('Ayesha Siddiqui','ayesha.siddiqui'),('Balaji Rajan','balaji.rajan'),
          ('Chandan Yadav','chandan.yadav'),('Deepika Nambiar','deepika.nambiar'),
          ('Eshan Malhotra','eshan.malhotra'),('Farhan Shaikh','farhan.shaikh'),
          ('Geeta Pillai','geeta.pillai'),('Harshit Agrawal','harshit.agrawal'),
          ('Isha Saxena','isha.saxena'),('Jayant Mehrotra','jayant.mehrotra')],
}
stu_ids = {yr:[] for yr in [2025,2024,2023,2022]}
for b in batches:
    yr = b['yr']
    for i,(name,prefix) in enumerate(student_names[yr]):
        email = f"{prefix}@lumina.com"
        sid = uid()
        roll = f"CSE{yr}{str(i+1).zfill(3)}"
        stu_ids[yr].append(sid)
        cur.execute("""INSERT INTO users(id,email,name,role,password_hash,phone,status,is_active,
            college_id,department_id,dept_id,batch_id,section,student_roll,full_name,onboarding_step)
            VALUES(%s,%s,%s,'student',%s,%s,'active',true,%s,%s,%s,%s,'A',%s,%s,5)""",
            (sid,email,name,hp(email),f'+91-8000{yr}{str(i+1).zfill(3)}',
             inst_id,dept_id,dept_id,batch_ids[yr],roll,name))
        cur.execute("INSERT INTO user_roles VALUES(%s,%s,%s)", (sid,role_ids['student'],inst_id))
        cur.execute("""INSERT INTO student_enrollments(id,student_id,program_id,
            current_semester_id,class_id,year_of_study,status)
            VALUES(%s,%s,%s,%s,%s,%s,'active')""",
            (uid(),sid,prog_id,sem_ids[b['cur_sem']],class_ids[yr],b['yos']))
        cur.execute("""INSERT INTO learner_profiles(user_id,role,grade_level,goals,preferences,
            learning_style,strengths,weaknesses)
            VALUES(%s,'student',%s,%s,'{"theme":"dark","lang":"en"}','visual',
            '["Coding","Problem Solving"]','["Time Management"]') ON CONFLICT DO NOTHING""",
            (sid, f"Year {b['yos']}",
             json.dumps([f'Complete B.Tech Year {b["yos"]} with distinction','Industry-ready skills'])))
        creds.append(['student',name,email,email,'Student Portal',
                      f"Year {b['yos']} | Sem {b['cur_sem']}",'CSE',roll])
conn.commit()
print(f"9. ✓ 40 students created & enrolled\n")

# ── 10. COURSES FROM CURRICULUM ────────────────────────────────────────────────
# (title, code, credits, category, sem, faculty_prefix)
curriculum = [
    # SEM 1 ─ Foundation
    ('Calculus, Differential Equations and Transform Methods for Computational Systems',
     'CSE-S1-01',4,'BS',1,'suresh.babu'),
    ('Engineering Chemistry: Materials Science, Electrochemistry and Corrosion Engineering',
     'CSE-S1-02',3,'BS',1,'lakshmi.devi'),
    ('Engineering Physics: Wave Mechanics, Optics and Electromagnetic Theory',
     'CSE-S1-03',3,'BS',1,'lakshmi.devi'),
    ('Linear Algebra, Vector Spaces and Matrix Computation for Engineers',
     'CSE-S1-04',3,'BS',1,'suresh.babu'),
    ('Computer Organization, Microarchitecture and Assembly Language Programming',
     'CSE-S1-05',3,'ES',1,'divya.menon'),
    ('Data Structures, Graph Algorithms and Efficient Computing Techniques',
     'CSE-S1-06',3,'ES',1,'arjun.patel'),
    ('Digital Logic Design, Boolean Algebra and Sequential Circuit Systems',
     'CSE-S1-07',3,'ES',1,'divya.menon'),
    ('Structured Programming, Algorithms and Computational Problem Solving',
     'CSE-S1-08',3,'ES',1,'arjun.patel'),
    ('Communicative English, Technical Writing and Presentation Skills',
     'CSE-S1-09',3,'HS',1,'nisha.joshi'),
    ('Professional Ethics, Human Values and Engineering Society',
     'CSE-S1-10',3,'HS',1,'nisha.joshi'),
    # SEM 2 ─ Foundation
    ('Biology for Engineers: Principles of Life Sciences and Biotechnology',
     'CSE-S2-01',3,'BS',2,'lakshmi.devi'),
    ('Engineering Chemistry: Materials Science, Electrochemistry and Corrosion Engineering 2',
     'CSE-S2-02',3,'BS',2,'lakshmi.devi'),
    ('Object-Oriented Design, Software Modelling and Programming Patterns',
     'CSE-S2-03',3,'ES',2,'anand.krishnan'),
    ('Object-Oriented Design, Software Modelling and Programming Patterns 2',
     'CSE-S2-04',3,'ES',2,'anand.krishnan'),
    ('Structured Programming, Algorithms and Computational Problem Solving 2',
     'CSE-S2-05',2,'ES',2,'arjun.patel'),
    ('Web Programming Fundamentals: HTML, CSS, JavaScript and DOM Manipulation',
     'CSE-S2-06',3,'ES',2,'meera.nair'),
    ('Web Programming Fundamentals: HTML, CSS, JavaScript and DOM Manipulation 2',
     'CSE-S2-07',3,'ES',2,'meera.nair'),
    ('Constitution of India, Fundamental Rights and Democratic Governance',
     'CSE-S2-08',3,'HS',2,'nisha.joshi'),
    ('Environmental Science, Ecology and Sustainable Engineering Practices',
     'CSE-S2-09',3,'HS',2,'nisha.joshi'),
    ('Communication Skills, Soft Skills and Professional Personality Development',
     'CSE-S2-10',3,'AE',2,'nisha.joshi'),
    # SEM 3 ─ Engineering Base
    ('Discrete Mathematics, Graph Theory and Combinatorial Optimization',
     'CSE-S3-01',3,'BS',3,'suresh.babu'),
    ('Psychology for Engineers: Behavioral Science, Team Dynamics and Leadership',
     'CSE-S3-02',2,'HS',3,'nisha.joshi'),
    ('Compiler Design, Lexical Analysis and Code Optimization Techniques',
     'CSE-S3-03',3,'PC',3,'hod'),
    ('Computer Architecture, Instruction Set Design and Pipelined Processor Systems',
     'CSE-S3-04',3,'PC',3,'vikram.singh'),
    ('Information Security, Cryptography and Secure Software Systems',
     'CSE-S3-05',3,'PC',3,'rahul.gupta'),
    ('Software Engineering, Software Lifecycle Management and Agile Development',
     'CSE-S3-06',3,'PC',3,'anand.krishnan'),
    ('Theory of Computation, Automata and Formal Language Theory',
     'CSE-S3-07',3,'PC',3,'hod'),
    # SEM 4 ─ Engineering Base
    ('Artificial Intelligence, Knowledge Representation and Intelligent Decision Systems',
     'CSE-S4-01',3,'PC',4,'priya.sharma'),
    ('Database Systems, Transaction Processing and Data Storage Architectures',
     'CSE-S4-02',3,'PC',4,'sunita.rao'),
    ('Distributed Systems, Microservices and Fault-Tolerant Computing',
     'CSE-S4-03',3,'PC',4,'ravi.teja'),
    ('Operating System Architecture, Process Management and Concurrent Computing',
     'CSE-S4-04',3,'PC',4,'vikram.singh'),
    ('Web Technologies, Full Stack Development and RESTful API Architecture',
     'CSE-S4-05',3,'PC',4,'meera.nair'),
    ('Quantitative Aptitude, Logical Reasoning and Analytical Problem Solving',
     'CSE-S4-06',3,'AE',4,'suresh.babu'),
    ('Minor Project: Prototype Design and Technical Problem Solving',
     'CSE-S4-07',3,'PR',4,'anand.krishnan'),
    # SEM 5 ─ Professional Core
    ('Computer Networking, Internet Protocols and Distributed Communication Systems',
     'CSE-S5-01',3,'PC',5,'deepa.mehta'),
    ('Design and Analysis of Algorithms for Efficient Computing',
     'CSE-S5-02',3,'PC',5,'arjun.patel'),
    ('Distributed Systems, Microservices and Fault-Tolerant Computing 2',
     'CSE-S5-03',3,'PC',5,'ravi.teja'),
    ('Web Technologies, Full Stack Development and RESTful API Architecture 2',
     'CSE-S5-04',3,'PC',5,'meera.nair'),
    ('Generative AI Systems, Large Language Models and Prompt Engineering',
     'CSE-S5-05',4,'PE',5,'kavitha.iyer'),
    ('Design Thinking, User Experience and Product Innovation',
     'CSE-S5-06',3,'OE',5,'anand.krishnan'),
    ('DevOps, CI/CD and Cloud Deployment Lab using AWS/GCP',
     'CSE-S5-07',4,'SEC',5,'deepa.mehta'),
    # SEM 6 ─ Professional Core
    ('Database Systems, Transaction Processing and Data Storage Architectures 2',
     'CSE-S6-01',2,'PC',6,'sunita.rao'),
    ('Distributed Systems, Microservices and Fault-Tolerant Computing 3',
     'CSE-S6-02',3,'PC',6,'ravi.teja'),
    ('Web Technologies, Full Stack Development and RESTful API Architecture 3',
     'CSE-S6-03',3,'PC',6,'meera.nair'),
    ('Machine Learning Algorithms, Statistical Models and Predictive Analytics',
     'CSE-S6-04',3,'PE',6,'priya.sharma'),
    # SEM 7 ─ Specialization
    ('Big Data Engineering, Data Warehousing and Distributed Data Processing',
     'CSE-S7-01',3,'PE',7,'sanjay.varma'),
    ('Cyber Security, Ethical Hacking and Secure Network Systems',
     'CSE-S7-02',3,'PE',7,'rahul.gupta'),
    ('Deep Learning, Neural Network Architectures and AI Model Training',
     'CSE-S7-03',3,'PE',7,'kavitha.iyer'),
    ('Sustainable Smart Cities, Urban Technology and Green Infrastructure',
     'CSE-S7-04',3,'OE',7,'nisha.joshi'),
    ('Industry Internship: Professional Experience and Applied Engineering',
     'CSE-S7-05',3,'PR',7,'anand.krishnan'),
    # SEM 8 ─ Capstone
    ('Supply Chain Management, Logistics Technology and Global Operations',
     'CSE-S8-01',2,'OE',8,'nisha.joshi'),
    ('Capstone Project Phase I: Research, Design and System Architecture',
     'CSE-S8-02',3,'PR',8,'priya.sharma'),
    ('Capstone Project Phase I: Research, Design and System Architecture 2',
     'CSE-S8-03',2,'PR',8,'priya.sharma'),
    ('Capstone Project Phase II: Implementation, Testing and Deployment',
     'CSE-S8-04',3,'PR',8,'kavitha.iyer'),
]

course_ids = {}
for (title, code, credits, cat, sem, fp) in curriculum:
    cid = uid()
    course_ids[code] = cid
    cur.execute("""INSERT INTO courses(id,teacher_id,title,course_name,name,code,course_code,
        credits,category,semester_id,program_id,department_id,is_published,college_id,metadata)
        VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true,%s,%s)""",
        (cid, fac_ids.get(fp, hod_id), title, title, title[:60], code, code,
         credits, cat, sem_ids[sem], prog_id, dept_id, inst_id,
         json.dumps({'semester': sem, 'category': cat, 'credits': credits})))
    for c in concepts(title):
        cur.execute("INSERT INTO course_concepts(id,course_id,concept_name) VALUES(%s,%s,%s)",
                    (uid(), cid, c))
conn.commit()
print(f"10. ✓ {len(curriculum)} courses from curriculum\n")

# ── 11. TEACHER ASSIGNMENTS ────────────────────────────────────────────────────
for (title, code, credits, cat, sem, fp) in curriculum:
    cid = course_ids[code]
    fid = fac_ids.get(fp, hod_id)
    for b in batches:
        if sem <= b['cur_sem']:
            cur.execute("""INSERT INTO teacher_assignments(id,teacher_id,course_id,class_id,
                is_primary,batch_id,section,academic_year)
                VALUES(%s,%s,%s,%s,true,%s,'A',%s) ON CONFLICT DO NOTHING""",
                (uid(), fid, cid, class_ids[b['yr']], batch_ids[b['yr']], b['label']))
conn.commit()
print(f"11. ✓ Teacher assignments\n")

# ── 12. STUDENT COURSE ENROLLMENTS ─────────────────────────────────────────────
enr = 0
for (title, code, credits, cat, sem, fp) in curriculum:
    cid = course_ids[code]
    for b in batches:
        if sem <= b['cur_sem']:
            for sid in stu_ids[b['yr']]:
                cur.execute("""INSERT INTO enrollments(id,student_id,course_id,status,progress)
                    VALUES(%s,%s,%s,'active','{}') ON CONFLICT DO NOTHING""",
                    (uid(), sid, cid))
                if sem == b['cur_sem']:
                    cur.execute("INSERT INTO student_subjects VALUES(%s,%s) ON CONFLICT DO NOTHING",
                                (sid, cid))
                enr += 1
conn.commit()
print(f"12. ✓ {enr} enrollments\n")

# ── 13. TIMETABLE ──────────────────────────────────────────────────────────────
time_slots = [
    ('08:00','09:00'),('09:00','10:00'),('10:15','11:15'),('11:15','12:15'),
    ('13:00','14:00'),('14:00','15:00'),('15:15','16:15'),('16:15','17:00')
]
days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

for b in batches:
    yr, cur_s = b['yr'], b['cur_sem']
    active = [(t,c,fp) for (t,c,cr,cat,s,fp) in curriculum if s == cur_s]
    timetable = []
    idx = 0
    for day in days:
        for ts, te in time_slots:
            t, c, fp = active[idx % len(active)]
            timetable.append({
                'day': day, 'start': ts, 'end': te,
                'course_code': c, 'course_title': t[:45],
                'faculty_email': f"{fp}@lumina.com",
                'room': f'CSE-{101 + (idx % 5)}'
            })
            idx += 1
    cur.execute("UPDATE classes SET metadata=%s WHERE id=%s",
                (json.dumps({'timetable': timetable, 'academic_year': b['label'],
                             'current_semester': cur_s, 'batch_year': yr}),
                 class_ids[yr]))
conn.commit()
print(f"13. ✓ Timetables for all 4 batches\n")

# ── 14. ASSIGNMENTS ────────────────────────────────────────────────────────────
asgn = 0
for (title, code, credits, cat, sem, fp) in curriculum:
    cid = course_ids[code]
    fid = fac_ids.get(fp, hod_id)
    for b in batches:
        if sem == b['cur_sem']:
            bid = batch_ids[b['yr']]
            for (aname, days_due, marks) in [
                (f'Assignment 1 – {title[:40]}', 14, 100),
                (f'Mid-Semester Quiz – {title[:35]}', 35, 50),
                (f'Project Submission – {title[:33]}', 60, 100),
            ]:
                cur.execute("""INSERT INTO assignments(id,course_id,teacher_id,batch_id,section,
                    title,description,due_date,max_marks)
                    VALUES(%s,%s,%s,%s,'A',%s,%s,%s,%s)""",
                    (uid(), cid, fid, bid, aname,
                     f'Course: {title[:60]}',
                     datetime.now() + timedelta(days=days_due), marks))
                asgn += 1
conn.commit()
print(f"14. ✓ {asgn} assignments\n")

# ── 15. CREDENTIALS CSV ────────────────────────────────────────────────────────
csv_path = '/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/clever-jemison/LUMINA_CREDENTIALS.csv'
with open(csv_path, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['Role','Full Name','Email (Login)','Password','Portal','Specialization/Year','Dept','Roll No'])
    w.writerows(creds)

# ── FINAL COUNTS ───────────────────────────────────────────────────────────────
cur.execute("SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role")
counts = dict(cur.fetchall())

print("=" * 52)
print("   LUMINA LMS ECOSYSTEM — COMPLETE")
print("=" * 52)
print(f"  Institution  : Lumina Institute of Technology")
print(f"  Department   : Computer Science & Engineering")
print(f"  Batches      : 4 (Year 1–4), 1 section each")
print(f"  Admin        : admin@lumina.com")
print(f"  HOD          : hod.cse@lumina.com")
print(f"  Teachers     : {counts.get('teacher', 0)} (+ 1 HOD)")
print(f"  Students     : {counts.get('student', 0)} (10/batch × 4 batches)")
print(f"  Courses      : {len(curriculum)} across 8 semesters")
print(f"  Enrollments  : {enr}")
print(f"  Assignments  : {asgn}")
print(f"  Timetables   : 4 active (one per batch)")
print(f"  All passwords: = Email ID")
print(f"  Credentials  : LUMINA_CREDENTIALS.csv")
print("=" * 52)

cur.close()
conn.close()
