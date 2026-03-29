#!/usr/bin/env python3
"""
Lumina Institute of Technology — Full Multi-Department Ecosystem Seed
Departments: CSE, ECE, EEE, ME, CE, IT, AIDS, AIML
Each dept: 1 HOD + 10 Faculty + 40 Students (10/batch × 4 years) + all courses
All passwords = Email ID | Student email: name@lumina.com
"""
import psycopg2, bcrypt, uuid, csv, json
from datetime import datetime, timedelta

import os
DB_URL = os.environ.get("DATABASE_URL",
    "postgresql://postgres:CHANGE_ME@db.odyjksznsdeyweylovzl.supabase.co:5432/postgres")

def hp(pw):  return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=10)).decode()
def uid():   return str(uuid.uuid4())
def con(t):  # extract concepts from title
    words = [w for w in t.replace(',',' ').replace(':',' ').split() if len(w)>4][:8]
    return [' '.join(words[i:i+2]) for i in range(0,min(len(words)-1,4))]

conn = psycopg2.connect(DB_URL)
cur  = conn.cursor()
creds = []

print("\n=== LUMINA ALL-DEPARTMENTS SEED ===\n")

# ── 0. WIPE ─────────────────────────────────────────────────────────────────
print("0. Wiping all existing data...")
tables = [
    'audit_logs','concept_edges','course_concepts','course_materials',
    'correction_requests','student_progress','student_subjects','user_roles',
    'skill_mastery','quiz_attempts','quizzes','conversations','user_data',
    'student_pathways','learning_events','intervention_recommendations',
    'automation_job_logs','submission_scorecards','assignment_submissions',
    'assignment_rubrics','assessment_sessions','learner_profiles',
    'physical_submissions','ai_answer_queue','content_uploads','stakeholders',
    'teacher_assignments','teacher_requests','student_credits',
    'student_enrollments','enrollments','attendance','submissions',
    'assignments','knowledge_nodes','invite_tokens','enrollment_codes',
    'batches','classes','semesters','programs','departments',
    'institution_details','institutions','roles','users'
]
for t in tables:
    cur.execute(f"TRUNCATE TABLE {t} CASCADE")
conn.commit()
print("   ✓ Cleared\n")

# ── 1. ROLES ─────────────────────────────────────────────────────────────────
role_ids = {}
for r in ['super_admin','admin','hod','teacher','student','parent',
          'counselor','mentor','peer_tutor','content_creator','researcher','alumni']:
    cur.execute("INSERT INTO roles(id,name) VALUES(%s,%s) RETURNING id",(uid(),r))
    role_ids[r] = cur.fetchone()[0]
conn.commit()
print(f"1. ✓ {len(role_ids)} roles\n")

# ── 2. INSTITUTION ───────────────────────────────────────────────────────────
inst_id = uid()
cur.execute("""INSERT INTO institutions(id,institution_name,email,onboarding_status,
    password_hash,code,is_active,login_policy,academic_year)
    VALUES(%s,'Lumina Institute of Technology','admin@luminalit.edu','ACTIVE',
    %s,'LIT',true,'email_only','2025-2026')""",(inst_id,hp('admin@luminalit.edu')))
cur.execute("""INSERT INTO institution_details(institution_id,type,status,established_year,
    affiliation,address,city,state,country,vision,mission)
    VALUES(%s,'Engineering College','Active',2005,'AICTE / Anna University',
    '#42 Tech Park Road, Electronic City','Bangalore','Karnataka','India',
    'Globally recognized institution nurturing innovation in technology',
    'Quality technical education through cutting-edge research and industry collaboration')""",(inst_id,))
conn.commit()
print("2. ✓ Institution: Lumina Institute of Technology\n")

# ── 3. ADMIN ─────────────────────────────────────────────────────────────────
admin_id = uid()
cur.execute("""INSERT INTO users(id,email,name,role,password_hash,phone,status,is_active,
    college_id,employee_id,onboarding_step)
    VALUES(%s,'admin@lumina.com','Admin LIT','admin',%s,'+91-9000000000','active',true,%s,'EMP-ADMIN-001',5)""",
    (admin_id,hp('admin@lumina.com'),inst_id))
cur.execute("INSERT INTO user_roles VALUES(%s,%s,%s)",(admin_id,role_ids['admin'],inst_id))
conn.commit()
creds.append(['admin','Admin LIT','admin@lumina.com','admin@lumina.com',
              'Admin Dashboard','All Departments','LIT','—'])
print("3. ✓ Admin: admin@lumina.com\n")

# ── 4. DEPARTMENT DEFINITIONS ────────────────────────────────────────────────
# Each dept: (code, name, abbr, hod_name, hod_prefix, emp_prefix)
DEPTS = [
    ('CSE','Computer Science and Engineering',         'CSE','Dr. Rajesh Kumar',      'rajesh.kumar',    'HOD-CSE'),
    ('ECE','Electronics and Communication Engineering','ECE','Dr. Anita Sharma',      'anita.sharma',    'HOD-ECE'),
    ('EEE','Electrical and Electronics Engineering',  'EEE','Dr. Mohan Reddy',       'mohan.reddy',     'HOD-EEE'),
    ('ME', 'Mechanical Engineering',                  'ME', 'Dr. Suresh Pillai',     'suresh.pillai',   'HOD-ME'),
    ('CE', 'Civil Engineering',                       'CE', 'Dr. Kavitha Nair',      'kavitha.nair',    'HOD-CE'),
    ('IT', 'Information Technology',                  'IT', 'Dr. Venkat Raman',      'venkat.raman',    'HOD-IT'),
    ('AIDS','Artificial Intelligence & Data Science', 'AIDS','Dr. Preethi Iyer',    'preethi.iyer',    'HOD-AIDS'),
    ('AIML','Artificial Intelligence & Machine Learning','AIML','Dr. Ravi Shankar', 'ravi.shankar',    'HOD-AIML'),
]

# Faculty per department (prefix, name, specialization)
FACULTY = {
'CSE':[
    ('priya.sharma','Prof. Priya Sharma','AI & Machine Learning'),
    ('arjun.patel','Prof. Arjun Patel','Data Structures & Algorithms'),
    ('sunita.rao','Prof. Sunita Rao','Database Systems'),
    ('vikram.singh','Prof. Vikram Singh','OS & Computer Architecture'),
    ('meera.nair','Prof. Meera Nair','Web Technologies & Full Stack'),
    ('anand.krishnan','Prof. Anand Krishnan','Software Engineering & OOP'),
    ('deepa.mehta','Prof. Deepa Mehta','Computer Networks & DevOps'),
    ('rahul.gupta','Prof. Rahul Gupta','Information Security & Cyber'),
    ('kavitha.iyer','Prof. Kavitha Iyer','Deep Learning & Generative AI'),
    ('suresh.babu','Dr. Suresh Babu','Mathematics'),
],
'ECE':[
    ('arun.kumar','Prof. Arun Kumar','VLSI & Semiconductor Devices'),
    ('bhanu.prasad','Prof. Bhanu Prasad','Signal Processing & Communications'),
    ('chitra.rao','Prof. Chitra Rao','Embedded Systems & Microcontrollers'),
    ('dinesh.nair','Prof. Dinesh Nair','Antenna Design & RF Engineering'),
    ('esha.mehta','Prof. Esha Mehta','Digital Communication Systems'),
    ('farooq.ali','Prof. Farooq Ali','Optical Fiber & Photonics'),
    ('geetha.krishnan','Prof. Geetha Krishnan','Control Systems'),
    ('hari.babu','Prof. Hari Babu','Wireless Networks & 5G'),
    ('indira.pillai','Prof. Indira Pillai','Engineering Mathematics'),
    ('jagadeesh.reddy','Prof. Jagadeesh Reddy','Digital Electronics & HDL'),
],
'EEE':[
    ('kalyan.rao','Prof. Kalyan Rao','Power Systems & Switchgear'),
    ('latha.sharma','Prof. Latha Sharma','Electrical Machines & Drives'),
    ('manohar.gupta','Prof. Manohar Gupta','Power Electronics & Converters'),
    ('nalini.iyer','Prof. Nalini Iyer','Control Systems & PLC'),
    ('om.prakash','Prof. Om Prakash','Smart Grid & Renewable Energy'),
    ('padma.reddy','Prof. Padma Reddy','High Voltage Engineering'),
    ('qadir.ali','Prof. Qadir Ali','Electric Vehicles & Energy Storage'),
    ('ramesh.nair','Prof. Ramesh Nair','Circuit Theory & Network Analysis'),
    ('savitha.menon','Prof. Savitha Menon','Engineering Mathematics'),
    ('thirumal.pillai','Prof. Thirumal Pillai','Instrumentation & Measurement'),
],
'ME':[
    ('uday.kumar','Prof. Uday Kumar','Thermodynamics & Heat Transfer'),
    ('vijaya.lakshmi','Prof. Vijaya Lakshmi','Manufacturing & CNC Machining'),
    ('wasim.khan','Prof. Wasim Khan','Fluid Mechanics & Hydraulics'),
    ('xavier.george','Prof. Xavier George','Machine Design & CAD/CAM'),
    ('yamini.devi','Prof. Yamini Devi','Robotics & Automation'),
    ('zubair.shaikh','Prof. Zubair Shaikh','Materials Science & Metallurgy'),
    ('aakash.tiwari','Prof. Aakash Tiwari','Strength of Materials & SOM'),
    ('babita.joshi','Prof. Babita Joshi','Industrial Engineering & Management'),
    ('chinmay.varma','Prof. Chinmay Varma','Engineering Mechanics & Dynamics'),
    ('devika.bose','Prof. Devika Bose','Engineering Mathematics'),
],
'CE':[
    ('elan.murugan','Prof. Elan Murugan','Structural Analysis & Design'),
    ('falguni.shah','Prof. Falguni Shah','Geotechnical & Foundation Engineering'),
    ('girish.naidu','Prof. Girish Naidu','Transportation & Highway Engineering'),
    ('hema.patel','Prof. Hema Patel','Environmental & Water Resources Engg'),
    ('irfan.siddiqui','Prof. Irfan Siddiqui','Concrete Technology & Construction'),
    ('jhansi.rani','Prof. Jhansi Rani','Remote Sensing & GIS'),
    ('kiran.babu','Prof. Kiran Babu','Surveying & Geodesy'),
    ('lalitha.nair','Prof. Lalitha Nair','Fluid Mechanics & Hydraulics'),
    ('madan.lal','Prof. Madan Lal','Engineering Mathematics'),
    ('naresh.kumar','Prof. Naresh Kumar','Smart Infrastructure & Urban Planning'),
],
'IT':[
    ('ojas.mishra','Prof. Ojas Mishra','Cloud Computing & Virtualization'),
    ('parvathy.menon','Prof. Parvathy Menon','Network Administration & Security'),
    ('qasim.khan','Prof. Qasim Khan','Web Development & CMS'),
    ('revathi.iyer','Prof. Revathi Iyer','Database Administration & SQL'),
    ('sathya.narayana','Prof. Sathya Narayana','Software Testing & QA'),
    ('tara.singh','Prof. Tara Singh','Mobile App Development'),
    ('ujwal.patil','Prof. Ujwal Patil','IT Project Management & Agile'),
    ('vani.desai','Prof. Vani Desai','Cybersecurity & Ethical Hacking'),
    ('william.dcosta','Prof. William DCosta','Artificial Intelligence for IT'),
    ('xavier.thomas','Prof. Xavier Thomas','Engineering Mathematics'),
],
'AIDS':[
    ('yashodha.rao','Prof. Yashodha Rao','Statistical Learning & Probability'),
    ('zaheer.hussain','Prof. Zaheer Hussain','Big Data Analytics & Hadoop'),
    ('amala.george','Prof. Amala George','Data Visualization & Storytelling'),
    ('benoy.mathew','Prof. Benoy Mathew','Natural Language Processing'),
    ('chetna.srivastava','Prof. Chetna Srivastava','Computer Vision & Image Processing'),
    ('dilip.garg','Prof. Dilip Garg','Reinforcement Learning'),
    ('elsa.john','Prof. Elsa John','Data Engineering & ETL Pipelines'),
    ('fiona.dsouza','Prof. Fiona DSouza','AI Ethics & Responsible AI'),
    ('ganesh.babu','Prof. Ganesh Babu','Engineering Mathematics & Statistics'),
    ('hemalatha.rao','Prof. Hemalatha Rao','Deep Learning Applications'),
],
'AIML':[
    ('ibrahim.shaikh','Prof. Ibrahim Shaikh','Machine Learning Theory & Practice'),
    ('janaki.krishna','Prof. Janaki Krishna','Deep Neural Networks & Architectures'),
    ('karthik.suresh','Prof. Karthik Suresh','Generative Models & GANs'),
    ('leela.devi','Prof. Leela Devi','MLOps & Model Deployment'),
    ('madhavan.nair','Prof. Madhavan Nair','Federated Learning & Privacy-Preserving AI'),
    ('nalini.sharma','Prof. Nalini Sharma','Computer Vision & 3D Vision'),
    ('omprakash.mehta','Prof. Omprakash Mehta','Robotics & Autonomous Systems'),
    ('padmini.iyer','Prof. Padmini Iyer','Time Series & Forecasting'),
    ('rajeev.nambiar','Prof. Rajeev Nambiar','Engineering Mathematics'),
    ('sujatha.pillai','Prof. Sujatha Pillai','AI for Healthcare & Bioinformatics'),
],
}

# ── 5. CURRICULA PER DEPARTMENT (title, code_suffix, credits, category, sem, fac_idx) ──
# fac_idx = index into FACULTY[dept] list (0-based); -1 = HOD
CURRICULUM = {
'CSE':[
    # SEM 1
    ('Calculus, Differential Equations and Transform Methods','CSE-S1-01',4,'BS',1,9),
    ('Engineering Chemistry: Materials Science and Electrochemistry','CSE-S1-02',3,'BS',1,9),
    ('Engineering Physics: Wave Mechanics, Optics and Electromagnetics','CSE-S1-03',3,'BS',1,9),
    ('Linear Algebra, Vector Spaces and Matrix Computation','CSE-S1-04',3,'BS',1,9),
    ('Computer Organization, Microarchitecture and Assembly Programming','CSE-S1-05',3,'ES',1,8),
    ('Data Structures, Graph Algorithms and Efficient Computing','CSE-S1-06',3,'ES',1,1),
    ('Digital Logic Design, Boolean Algebra and Sequential Circuits','CSE-S1-07',3,'ES',1,8),
    ('Structured Programming, Algorithms and Problem Solving','CSE-S1-08',3,'ES',1,1),
    ('Communicative English, Technical Writing and Presentation Skills','CSE-S1-09',3,'HS',1,5),
    ('Professional Ethics, Human Values and Engineering Society','CSE-S1-10',3,'HS',1,5),
    # SEM 2
    ('Biology for Engineers: Life Sciences and Biotechnology','CSE-S2-01',3,'BS',2,9),
    ('Engineering Chemistry 2: Electrochemistry and Corrosion Engineering','CSE-S2-02',3,'BS',2,9),
    ('Object-Oriented Design, Software Modelling and Programming Patterns','CSE-S2-03',3,'ES',2,5),
    ('Object-Oriented Design, Software Modelling and Patterns 2','CSE-S2-04',3,'ES',2,5),
    ('Structured Programming, Algorithms and Problem Solving 2','CSE-S2-05',2,'ES',2,1),
    ('Web Programming Fundamentals: HTML, CSS, JavaScript and DOM','CSE-S2-06',3,'ES',2,4),
    ('Web Programming Fundamentals 2: JavaScript and DOM Manipulation','CSE-S2-07',3,'ES',2,4),
    ('Constitution of India, Fundamental Rights and Democratic Governance','CSE-S2-08',3,'HS',2,5),
    ('Environmental Science, Ecology and Sustainable Engineering','CSE-S2-09',3,'HS',2,5),
    ('Communication Skills and Professional Personality Development','CSE-S2-10',3,'AE',2,5),
    # SEM 3
    ('Discrete Mathematics, Graph Theory and Combinatorial Optimization','CSE-S3-01',3,'BS',3,9),
    ('Psychology for Engineers: Behavioral Science and Team Dynamics','CSE-S3-02',2,'HS',3,5),
    ('Compiler Design, Lexical Analysis and Code Optimization','CSE-S3-03',3,'PC',3,-1),
    ('Computer Architecture, Instruction Set Design and Pipelining','CSE-S3-04',3,'PC',3,3),
    ('Information Security, Cryptography and Secure Software Systems','CSE-S3-05',3,'PC',3,7),
    ('Software Engineering, Lifecycle Management and Agile Development','CSE-S3-06',3,'PC',3,5),
    ('Theory of Computation, Automata and Formal Language Theory','CSE-S3-07',3,'PC',3,-1),
    # SEM 4
    ('Artificial Intelligence, Knowledge Representation and Decision Systems','CSE-S4-01',3,'PC',4,0),
    ('Database Systems, Transaction Processing and Data Storage','CSE-S4-02',3,'PC',4,2),
    ('Distributed Systems, Microservices and Fault-Tolerant Computing','CSE-S4-03',3,'PC',4,6),
    ('Operating System Architecture, Process Management and Concurrency','CSE-S4-04',3,'PC',4,3),
    ('Web Technologies, Full Stack Development and RESTful API','CSE-S4-05',3,'PC',4,4),
    ('Quantitative Aptitude, Logical Reasoning and Problem Solving','CSE-S4-06',3,'AE',4,9),
    ('Minor Project: Prototype Design and Technical Problem Solving','CSE-S4-07',3,'PR',4,5),
    # SEM 5
    ('Computer Networking, Internet Protocols and Distributed Communication','CSE-S5-01',3,'PC',5,6),
    ('Design and Analysis of Algorithms for Efficient Computing','CSE-S5-02',3,'PC',5,1),
    ('Distributed Systems, Microservices and Fault-Tolerant Computing 2','CSE-S5-03',3,'PC',5,6),
    ('Web Technologies, Full Stack Development and RESTful API 2','CSE-S5-04',3,'PC',5,4),
    ('Generative AI Systems, Large Language Models and Prompt Engineering','CSE-S5-05',4,'PE',5,8),
    ('Design Thinking, User Experience and Product Innovation','CSE-S5-06',3,'OE',5,5),
    ('DevOps, CI/CD and Cloud Deployment Lab using AWS/GCP','CSE-S5-07',4,'SEC',5,6),
    # SEM 6
    ('Database Systems and Data Storage Architectures 2','CSE-S6-01',2,'PC',6,2),
    ('Distributed Systems, Microservices and Fault-Tolerant Computing 3','CSE-S6-02',3,'PC',6,6),
    ('Web Technologies, Full Stack Development and RESTful API 3','CSE-S6-03',3,'PC',6,4),
    ('Machine Learning Algorithms, Statistical Models and Predictive Analytics','CSE-S6-04',3,'PE',6,0),
    # SEM 7
    ('Big Data Engineering, Data Warehousing and Distributed Data Processing','CSE-S7-01',3,'PE',7,9),
    ('Cyber Security, Ethical Hacking and Secure Network Systems','CSE-S7-02',3,'PE',7,7),
    ('Deep Learning, Neural Network Architectures and AI Model Training','CSE-S7-03',3,'PE',7,8),
    ('Sustainable Smart Cities, Urban Technology and Green Infrastructure','CSE-S7-04',3,'OE',7,5),
    ('Industry Internship: Professional Experience and Applied Engineering','CSE-S7-05',3,'PR',7,5),
    # SEM 8
    ('Supply Chain Management, Logistics Technology and Global Operations','CSE-S8-01',2,'OE',8,5),
    ('Capstone Project Phase I: Research, Design and System Architecture','CSE-S8-02',3,'PR',8,0),
    ('Capstone Project Phase I: Research, Design and System Architecture 2','CSE-S8-03',2,'PR',8,0),
    ('Capstone Project Phase II: Implementation, Testing and Deployment','CSE-S8-04',3,'PR',8,8),
],
'ECE':[
    # SEM 1
    ('Calculus, Differential Equations and Transform Methods','ECE-S1-01',4,'BS',1,8),
    ('Engineering Physics: Wave Mechanics, Optics and Electromagnetic Theory','ECE-S1-02',3,'BS',1,8),
    ('Engineering Chemistry: Materials Science and Electrochemistry','ECE-S1-03',3,'BS',1,8),
    ('Linear Algebra and Numerical Methods for Engineers','ECE-S1-04',3,'BS',1,8),
    ('Basic Electrical Engineering: Circuits, Networks and Theorems','ECE-S1-05',3,'ES',1,7),
    ('Electronic Devices: Semiconductors, Diodes and Transistors','ECE-S1-06',3,'ES',1,9),
    ('Digital Electronics: Logic Gates, Flip-Flops and Counters','ECE-S1-07',3,'ES',1,9),
    ('Programming for Engineers: C and Python Fundamentals','ECE-S1-08',3,'ES',1,1),
    ('Communicative English and Technical Writing','ECE-S1-09',3,'HS',1,8),
    ('Professional Ethics and Engineering in Society','ECE-S1-10',3,'HS',1,8),
    # SEM 2
    ('Signals and Systems: Continuous and Discrete Time Analysis','ECE-S2-01',3,'PC',2,1),
    ('Network Analysis: Two-Port, Filters and Resonance','ECE-S2-02',3,'PC',2,7),
    ('Analog Electronics: Amplifiers, Oscillators and Feedback','ECE-S2-03',3,'PC',2,9),
    ('Electromagnetic Fields and Waves: Maxwell Equations','ECE-S2-04',3,'PC',2,3),
    ('Data Structures and Algorithms for ECE','ECE-S2-05',3,'ES',2,1),
    ('Object-Oriented Programming with C++ and Java','ECE-S2-06',3,'ES',2,1),
    ('Environmental Science and Sustainable Engineering','ECE-S2-07',3,'HS',2,8),
    ('Constitution of India and Democratic Governance','ECE-S2-08',3,'HS',2,8),
    ('Communication Skills and Soft Skills Development','ECE-S2-09',3,'AE',2,8),
    # SEM 3
    ('Digital Signal Processing: Z-Transform, FFT and Filters','ECE-S3-01',3,'PC',3,1),
    ('Control Systems: Transfer Functions, Stability and PID','ECE-S3-02',3,'PC',3,6),
    ('Electronic Circuits: Op-Amps, Active Filters and Power Amplifiers','ECE-S3-03',3,'PC',3,9),
    ('Microprocessors and Microcontrollers: 8085, 8051 and ARM','ECE-S3-04',3,'PC',3,2),
    ('Communication Systems: AM, FM and Digital Modulation','ECE-S3-05',3,'PC',3,4),
    ('VLSI Design: CMOS, Logic Synthesis and Layout','ECE-S3-06',3,'PC',3,0),
    ('Probability Theory and Random Processes','ECE-S3-07',3,'BS',3,8),
    # SEM 4
    ('Digital Communication: Baseband, Passband and Error Control','ECE-S4-01',3,'PC',4,4),
    ('Antenna Theory and Propagation: Arrays and Link Budget','ECE-S4-02',3,'PC',4,3),
    ('Microwave Engineering: Waveguides, Resonators and Filters','ECE-S4-03',3,'PC',4,5),
    ('Embedded Systems Design: RTOS and Interfacing','ECE-S4-04',3,'PC',4,2),
    ('Digital Image Processing: Enhancement, Segmentation and Recognition','ECE-S4-05',3,'PC',4,1),
    ('Information Theory and Coding: Entropy and Channel Capacity','ECE-S4-06',3,'PC',4,4),
    ('Minor Project: Electronics System Design','ECE-S4-07',3,'PR',4,-1),
    # SEM 5
    ('Wireless Communication: 4G, 5G and mmWave Systems','ECE-S5-01',3,'PC',5,7),
    ('VLSI Physical Design: Floorplanning, Routing and Verification','ECE-S5-02',3,'PC',5,0),
    ('Optical Fiber Communication: Lasers, Receivers and Networks','ECE-S5-03',3,'PC',5,5),
    ('IoT and Sensor Networks: Architecture and Protocols','ECE-S5-04',3,'PE',5,2),
    ('Machine Learning for Signal Processing','ECE-S5-05',3,'PE',5,1),
    ('RF and Microwave Circuit Design Lab','ECE-S5-06',3,'SEC',5,3),
    ('Design Thinking and Product Innovation','ECE-S5-07',3,'OE',5,8),
    # SEM 6
    ('Advanced VLSI: SoC Design and Verification','ECE-S6-01',3,'PC',6,0),
    ('Satellite Communication and Navigation Systems','ECE-S6-02',3,'PC',6,3),
    ('Speech and Audio Processing','ECE-S6-03',3,'PE',6,1),
    ('Radar Systems and Applications','ECE-S6-04',3,'PE',6,5),
    # SEM 7
    ('5G and Beyond: Network Slicing and Massive MIMO','ECE-S7-01',3,'PE',7,7),
    ('Cyber Physical Systems and AIoT','ECE-S7-02',3,'PE',7,2),
    ('Deep Learning for Computer Vision and Signal Processing','ECE-S7-03',3,'PE',7,1),
    ('Smart Electronics and Wearable Technology','ECE-S7-04',3,'OE',7,8),
    ('Industry Internship: Applied Electronics Engineering','ECE-S7-05',3,'PR',7,-1),
    # SEM 8
    ('Autonomous Vehicles and Sensor Fusion','ECE-S8-01',2,'OE',8,8),
    ('Capstone Project Phase I: Research and System Design','ECE-S8-02',3,'PR',8,-1),
    ('Capstone Project Phase I: Prototype Development','ECE-S8-03',2,'PR',8,-1),
    ('Capstone Project Phase II: Implementation and Testing','ECE-S8-04',3,'PR',8,-1),
],
'EEE':[
    # SEM 1
    ('Calculus and Differential Equations for Electrical Engineers','EEE-S1-01',4,'BS',1,8),
    ('Engineering Physics: Electrostatics, Magnetism and Material Properties','EEE-S1-02',3,'BS',1,8),
    ('Engineering Chemistry: Batteries, Fuel Cells and Corrosion','EEE-S1-03',3,'BS',1,8),
    ('Linear Algebra and Complex Analysis for Engineers','EEE-S1-04',3,'BS',1,8),
    ('Basic Electronics: Diodes, Transistors and Op-Amps','EEE-S1-05',3,'ES',1,7),
    ('Circuit Theory: KVL, KCL, Mesh and Nodal Analysis','EEE-S1-06',3,'ES',1,7),
    ('Digital Electronics: Logic Circuits, Flip-Flops and Memories','EEE-S1-07',3,'ES',1,9),
    ('Programming for Electrical Engineers: C and MATLAB','EEE-S1-08',3,'ES',1,7),
    ('Communicative English and Technical Documentation','EEE-S1-09',3,'HS',1,8),
    ('Professional Ethics and Engineering in Society','EEE-S1-10',3,'HS',1,8),
    # SEM 2
    ('Electromagnetic Fields: Gauss, Faraday and Maxwell Laws','EEE-S2-01',3,'PC',2,7),
    ('Network Analysis: Laplace, Two-Port Networks and Filters','EEE-S2-02',3,'PC',2,7),
    ('Electrical Machines I: DC Machines, Transformers','EEE-S2-03',3,'PC',2,1),
    ('Signals and Systems: Fourier, Laplace and Z-Transforms','EEE-S2-04',3,'PC',2,0),
    ('Electrical Measurements and Instrumentation','EEE-S2-05',3,'PC',2,9),
    ('Environmental Science and Sustainable Energy','EEE-S2-06',3,'HS',2,8),
    ('Constitution of India and Democratic Governance','EEE-S2-07',3,'HS',2,8),
    ('Communication Skills and Leadership Development','EEE-S2-08',3,'AE',2,8),
    # SEM 3
    ('Electrical Machines II: AC Machines and Synchronous Generators','EEE-S3-01',3,'PC',3,1),
    ('Power Systems I: Generation, Transmission and Distribution','EEE-S3-02',3,'PC',3,0),
    ('Control Systems: Root Locus, Bode Plot and State Space','EEE-S3-03',3,'PC',3,3),
    ('Power Electronics: Converters, Inverters and Choppers','EEE-S3-04',3,'PC',3,2),
    ('Microprocessors for EEE: 8085 and ARM Cortex Applications','EEE-S3-05',3,'PC',3,7),
    ('Probability and Random Processes for Electrical Engineers','EEE-S3-06',3,'BS',3,8),
    ('Digital Signal Processing: FIR, IIR Filters and FFT','EEE-S3-07',3,'PC',3,0),
    # SEM 4
    ('Power Systems II: Load Flow, Fault Analysis and Protection','EEE-S4-01',3,'PC',4,0),
    ('High Voltage Engineering: Breakdown, Insulation and Testing','EEE-S4-02',3,'PC',4,5),
    ('Switchgear and Protection: Relays, CBs and Grounding','EEE-S4-03',3,'PC',4,0),
    ('Electric Drives: Variable Speed, VFD and PLC','EEE-S4-04',3,'PC',4,1),
    ('Renewable Energy Systems: Solar, Wind and Hydro','EEE-S4-05',3,'PE',4,4),
    ('Industrial Automation and SCADA Systems','EEE-S4-06',3,'PC',4,3),
    ('Minor Project: Electrical System Design','EEE-S4-07',3,'PR',4,-1),
    # SEM 5
    ('Smart Grid and Energy Management Systems','EEE-S5-01',3,'PC',5,4),
    ('Flexible AC Transmission Systems (FACTS)','EEE-S5-02',3,'PC',5,2),
    ('Digital Protection and Substation Automation','EEE-S5-03',3,'PC',5,0),
    ('Electric Vehicles and Charging Infrastructure','EEE-S5-04',3,'PE',5,6),
    ('Power Quality and Energy Efficiency','EEE-S5-05',3,'PE',5,9),
    ('IoT for Smart Electrical Systems','EEE-S5-06',3,'OE',5,3),
    ('Power System Simulation Lab using MATLAB/PSS','EEE-S5-07',3,'SEC',5,0),
    # SEM 6
    ('HVDC Transmission and Grid Interconnections','EEE-S6-01',3,'PC',6,5),
    ('Energy Storage Systems: Batteries and Supercapacitors','EEE-S6-02',3,'PC',6,6),
    ('Machine Learning Applications in Power Systems','EEE-S6-03',3,'PE',6,4),
    ('Distributed Generation and Microgrid Operation','EEE-S6-04',3,'PE',6,4),
    # SEM 7
    ('Offshore Wind Energy Systems and Grid Integration','EEE-S7-01',3,'PE',7,4),
    ('AI-driven Predictive Maintenance in Electrical Systems','EEE-S7-02',3,'PE',7,6),
    ('Power Electronics for EV Powertrains','EEE-S7-03',3,'PE',7,6),
    ('Industry 4.0 and Digital Twin for Power Plants','EEE-S7-04',3,'OE',7,8),
    ('Industry Internship: Applied Electrical Engineering','EEE-S7-05',3,'PR',7,-1),
    # SEM 8
    ('Energy Policy, Carbon Trading and Sustainability','EEE-S8-01',2,'OE',8,8),
    ('Capstone Project Phase I: Research and Power System Design','EEE-S8-02',3,'PR',8,-1),
    ('Capstone Project Phase I: Prototype and Simulation','EEE-S8-03',2,'PR',8,-1),
    ('Capstone Project Phase II: Implementation and Commissioning','EEE-S8-04',3,'PR',8,-1),
],
'ME':[
    # SEM 1
    ('Calculus, Differential Equations and Numerical Methods','ME-S1-01',4,'BS',1,9),
    ('Engineering Physics: Mechanics of Materials and Thermodynamics','ME-S1-02',3,'BS',1,9),
    ('Engineering Chemistry: Fuels, Lubricants and Polymers','ME-S1-03',3,'BS',1,9),
    ('Linear Algebra and Transforms for Mechanical Engineers','ME-S1-04',3,'BS',1,9),
    ('Engineering Graphics: Projections, Sections and Isometric Views','ME-S1-05',3,'ES',1,7),
    ('Workshop Practice: Fitting, Welding and Sheet Metal','ME-S1-06',3,'ES',1,5),
    ('Programming for Mechanical Engineers: Python and MATLAB','ME-S1-07',3,'ES',1,8),
    ('Basic Electrical Engineering and Electronics','ME-S1-08',3,'ES',1,7),
    ('Communicative English and Technical Presentation','ME-S1-09',3,'HS',1,7),
    ('Professional Ethics and Environmental Engineering','ME-S1-10',3,'HS',1,7),
    # SEM 2
    ('Engineering Mechanics: Statics, Dynamics and Kinematics','ME-S2-01',3,'PC',2,8),
    ('Strength of Materials: Stress, Strain and Deflection','ME-S2-02',3,'PC',2,6),
    ('Thermodynamics: Laws, Cycles and Properties of Steam','ME-S2-03',3,'PC',2,0),
    ('Manufacturing Technology I: Casting, Forging and Forming','ME-S2-04',3,'PC',2,1),
    ('Fluid Mechanics: Continuity, Bernoulli and Flow Measurement','ME-S2-05',3,'PC',2,2),
    ('Material Science: Crystal Structure, Phase Diagrams','ME-S2-06',3,'PC',2,5),
    ('Environmental Science and Sustainable Manufacturing','ME-S2-07',3,'HS',2,7),
    ('Communication Skills and Team Dynamics','ME-S2-08',3,'AE',2,7),
    # SEM 3
    ('Applied Thermodynamics: IC Engines, Turbines and Compressors','ME-S3-01',3,'PC',3,0),
    ('Heat Transfer: Conduction, Convection and Radiation','ME-S3-02',3,'PC',3,0),
    ('Machine Design I: Shafts, Keys, Couplings and Bearings','ME-S3-03',3,'PC',3,3),
    ('Manufacturing Technology II: CNC, EDM and Laser Machining','ME-S3-04',3,'PC',3,1),
    ('Metrology and Quality Control: GD&T and Six Sigma','ME-S3-05',3,'PC',3,7),
    ('Theory of Machines: Mechanisms, Cams and Gears','ME-S3-06',3,'PC',3,8),
    ('Probability, Statistics and Operations Research','ME-S3-07',3,'BS',3,9),
    # SEM 4
    ('Machine Design II: Springs, Gears and Pressure Vessels','ME-S4-01',3,'PC',4,3),
    ('Fluid Machinery: Pumps, Turbines and Compressors','ME-S4-02',3,'PC',4,2),
    ('Refrigeration and Air Conditioning: Vapour Compression and Absorption','ME-S4-03',3,'PC',4,0),
    ('Industrial Engineering: Work Study, Plant Layout and Scheduling','ME-S4-04',3,'PC',4,7),
    ('Finite Element Analysis: Meshing, FEM and Structural Analysis','ME-S4-05',3,'PC',4,3),
    ('Computer-Aided Design: Solid Modelling with CATIA/SolidWorks','ME-S4-06',3,'PC',4,3),
    ('Minor Project: Product Design and Fabrication','ME-S4-07',3,'PR',4,-1),
    # SEM 5
    ('Robotics and Automation: Kinematics, Sensors and PLC','ME-S5-01',3,'PC',5,4),
    ('Advanced Manufacturing: Additive Manufacturing and Industry 4.0','ME-S5-02',3,'PC',5,1),
    ('Computational Fluid Dynamics and ANSYS Simulation','ME-S5-03',3,'PC',5,2),
    ('Composite Materials and Smart Structures','ME-S5-04',3,'PE',5,5),
    ('Supply Chain Management and Lean Manufacturing','ME-S5-05',3,'PE',5,7),
    ('Product Lifecycle Management (PLM) and ERP','ME-S5-06',3,'OE',5,7),
    ('CAD/CAM Lab and CNC Programming','ME-S5-07',3,'SEC',5,3),
    # SEM 6
    ('Vehicle Dynamics and Automotive Engineering','ME-S6-01',3,'PC',6,4),
    ('Non-Destructive Testing and Failure Analysis','ME-S6-02',3,'PC',6,5),
    ('Renewable Energy Systems: Solar Thermal and Biomass','ME-S6-03',3,'PE',6,0),
    ('Project Management and Entrepreneurship','ME-S6-04',3,'OE',6,7),
    # SEM 7
    ('Micro and Nano Manufacturing Technologies','ME-S7-01',3,'PE',7,1),
    ('AI and ML Applications in Mechanical Engineering','ME-S7-02',3,'PE',7,9),
    ('Drone Technology and UAV Systems','ME-S7-03',3,'PE',7,4),
    ('Sustainable Design and Green Manufacturing','ME-S7-04',3,'OE',7,7),
    ('Industry Internship: Applied Mechanical Engineering','ME-S7-05',3,'PR',7,-1),
    # SEM 8
    ('Technology Management and Intellectual Property Rights','ME-S8-01',2,'OE',8,7),
    ('Capstone Project Phase I: Research and Mechanical Design','ME-S8-02',3,'PR',8,-1),
    ('Capstone Project Phase I: Analysis and Prototype','ME-S8-03',2,'PR',8,-1),
    ('Capstone Project Phase II: Fabrication, Testing and Deployment','ME-S8-04',3,'PR',8,-1),
],
'CE':[
    # SEM 1
    ('Calculus, Differential Equations and Linear Algebra','CE-S1-01',4,'BS',1,8),
    ('Engineering Physics: Mechanics and Material Properties','CE-S1-02',3,'BS',1,8),
    ('Engineering Chemistry: Water Treatment and Building Materials','CE-S1-03',3,'BS',1,8),
    ('Statistics and Probability for Civil Engineers','CE-S1-04',3,'BS',1,8),
    ('Engineering Graphics: Projections, Plans and Elevations','CE-S1-05',3,'ES',1,6),
    ('Building Materials: Cement, Steel, Brick and Timber','CE-S1-06',3,'ES',1,4),
    ('Survey Camp I: Chain and Compass Surveying','CE-S1-07',3,'ES',1,6),
    ('Programming for Civil Engineers: AutoCAD and Python','CE-S1-08',3,'ES',1,9),
    ('Communicative English and Technical Report Writing','CE-S1-09',3,'HS',1,8),
    ('Professional Ethics and Disaster Management','CE-S1-10',3,'HS',1,8),
    # SEM 2
    ('Fluid Mechanics: Hydrostatics, Pipe Flow and Open Channels','CE-S2-01',3,'PC',2,7),
    ('Strength of Materials: Axial, Bending, Torsion and Buckling','CE-S2-02',3,'PC',2,0),
    ('Structural Analysis I: Trusses, Beams and Portal Frames','CE-S2-03',3,'PC',2,0),
    ('Soil Mechanics: Classification, Permeability and Shear Strength','CE-S2-04',3,'PC',2,1),
    ('Surveying II: Theodolite, Total Station and GPS','CE-S2-05',3,'PC',2,6),
    ('Concrete Technology: Mix Design, Admixtures and Testing','CE-S2-06',3,'PC',2,4),
    ('Environmental Science and Ecology','CE-S2-07',3,'HS',2,8),
    ('Communication Skills and Soft Skills','CE-S2-08',3,'AE',2,8),
    # SEM 3
    ('Structural Analysis II: Moment Distribution and Matrix Methods','CE-S3-01',3,'PC',3,0),
    ('Foundation Engineering: Bearing Capacity and Pile Design','CE-S3-02',3,'PC',3,1),
    ('Hydraulics and Hydraulic Machinery: Channels and Pumps','CE-S3-03',3,'PC',3,7),
    ('Transportation Engineering I: Geometric Design of Highways','CE-S3-04',3,'PC',3,2),
    ('Environmental Engineering I: Water Supply and Treatment','CE-S3-05',3,'PC',3,3),
    ('Construction Planning and Project Management','CE-S3-06',3,'PC',3,9),
    ('Numerical Methods and Structural Software (STAAD/SAP)','CE-S3-07',3,'BS',3,8),
    # SEM 4
    ('Design of Reinforced Concrete Structures: Slabs, Beams and Columns','CE-S4-01',3,'PC',4,0),
    ('Design of Steel Structures: Tension, Compression and Beams','CE-S4-02',3,'PC',4,0),
    ('Transportation Engineering II: Pavement, Railways and Airports','CE-S4-03',3,'PC',4,2),
    ('Environmental Engineering II: Sewage and Solid Waste Management','CE-S4-04',3,'PC',4,3),
    ('Remote Sensing, GIS and GPS Applications','CE-S4-05',3,'PC',4,5),
    ('Earthquake Engineering and Seismic Design','CE-S4-06',3,'PC',4,0),
    ('Minor Project: Structural and Geotechnical Analysis','CE-S4-07',3,'PR',4,-1),
    # SEM 5
    ('Advanced Structural Design: Prestressed Concrete and Composite','CE-S5-01',3,'PC',5,0),
    ('Ground Improvement Techniques and Retaining Walls','CE-S5-02',3,'PC',5,1),
    ('Water Resources Engineering: Irrigation and Hydrology','CE-S5-03',3,'PC',5,7),
    ('Smart Infrastructure and Urban Planning','CE-S5-04',3,'PE',5,9),
    ('Building Information Modelling (BIM) and Revit','CE-S5-05',3,'PE',5,5),
    ('Construction Estimating, Tendering and Contracts','CE-S5-06',3,'OE',5,9),
    ('Structural Analysis Lab using ETABS and ANSYS','CE-S5-07',3,'SEC',5,0),
    # SEM 6
    ('High-Rise and Special Structures: Shells and Folded Plates','CE-S6-01',3,'PC',6,0),
    ('Coastal and Offshore Engineering','CE-S6-02',3,'PC',6,7),
    ('Green Building and Sustainable Construction','CE-S6-03',3,'PE',6,3),
    ('Traffic Engineering and Intelligent Transport Systems','CE-S6-04',3,'PE',6,2),
    # SEM 7
    ('Heritage Structures: Conservation, Retrofitting and Restoration','CE-S7-01',3,'PE',7,0),
    ('Disaster Risk Reduction and Resilient Infrastructure','CE-S7-02',3,'PE',7,9),
    ('AI and Machine Learning for Structural Health Monitoring','CE-S7-03',3,'PE',7,9),
    ('Smart Cities: Digital Infrastructure and Governance','CE-S7-04',3,'OE',7,9),
    ('Industry Internship: Applied Civil Engineering','CE-S7-05',3,'PR',7,-1),
    # SEM 8
    ('Environmental Impact Assessment and Sustainability','CE-S8-01',2,'OE',8,3),
    ('Capstone Project Phase I: Research and Structural Design','CE-S8-02',3,'PR',8,-1),
    ('Capstone Project Phase I: Site Investigation and Analysis','CE-S8-03',2,'PR',8,-1),
    ('Capstone Project Phase II: Construction and Evaluation','CE-S8-04',3,'PR',8,-1),
],
'IT':[
    # SEM 1
    ('Calculus, Transforms and Discrete Mathematics','IT-S1-01',4,'BS',1,9),
    ('Engineering Physics: Semiconductor Physics and Nanotechnology','IT-S1-02',3,'BS',1,9),
    ('Engineering Chemistry: Materials for IT Applications','IT-S1-03',3,'BS',1,9),
    ('Linear Algebra and Probability for IT','IT-S1-04',3,'BS',1,9),
    ('Programming in C: Fundamentals and Problem Solving','IT-S1-05',3,'ES',1,6),
    ('Digital Logic and Computer Organisation','IT-S1-06',3,'ES',1,9),
    ('Data Structures: Arrays, Stacks, Queues and Trees','IT-S1-07',3,'ES',1,9),
    ('Web Fundamentals: HTML5, CSS3 and Bootstrap','IT-S1-08',3,'ES',1,2),
    ('Communicative English and Technical Writing','IT-S1-09',3,'HS',1,9),
    ('Professional Ethics and IT Governance','IT-S1-10',3,'HS',1,9),
    # SEM 2
    ('Object-Oriented Programming: Java and Design Patterns','IT-S2-01',3,'PC',2,2),
    ('Computer Networks: OSI, TCP/IP and LAN/WAN','IT-S2-02',3,'PC',2,1),
    ('Database Management: SQL, NoSQL and Normalization','IT-S2-03',3,'PC',2,3),
    ('Operating Systems: Processes, Memory and File Systems','IT-S2-04',3,'PC',2,9),
    ('JavaScript, Node.js and RESTful API Development','IT-S2-05',3,'ES',2,2),
    ('Linux Administration and Shell Scripting','IT-S2-06',3,'ES',2,1),
    ('Environmental Science and Green IT','IT-S2-07',3,'HS',2,9),
    ('Constitution of India and Democratic Governance','IT-S2-08',3,'HS',2,9),
    ('Communication Skills and Professional Development','IT-S2-09',3,'AE',2,9),
    # SEM 3
    ('Software Engineering: SDLC, Agile and DevOps','IT-S3-01',3,'PC',3,6),
    ('Cloud Computing: AWS, Azure and Google Cloud','IT-S3-02',3,'PC',3,0),
    ('Network Security: Firewalls, VPN and IDS/IPS','IT-S3-03',3,'PC',3,7),
    ('Advanced Database: Transactions, Indexing and Query Optimization','IT-S3-04',3,'PC',3,3),
    ('Mobile Application Development: Android and React Native','IT-S3-05',3,'PC',3,5),
    ('Data Analytics: Python, Pandas and Visualization','IT-S3-06',3,'PC',3,0),
    ('Probability, Statistics and Numerical Methods','IT-S3-07',3,'BS',3,9),
    # SEM 4
    ('Artificial Intelligence and Machine Learning for IT','IT-S4-01',3,'PC',4,8),
    ('Microservices, Docker and Kubernetes','IT-S4-02',3,'PC',4,0),
    ('Software Testing: Manual, Automation and Performance','IT-S4-03',3,'PC',4,4),
    ('Information Security Management: ISO 27001 and GDPR','IT-S4-04',3,'PC',4,7),
    ('Full Stack Development: React, Spring Boot and MongoDB','IT-S4-05',3,'PC',4,2),
    ('IT Project Management: PMP, Scrum and Kanban','IT-S4-06',3,'PC',4,6),
    ('Minor Project: Enterprise Application Development','IT-S4-07',3,'PR',4,-1),
    # SEM 5
    ('DevSecOps: Security in CI/CD and Pipelines','IT-S5-01',3,'PC',5,7),
    ('Blockchain Technology and Decentralized Applications','IT-S5-02',3,'PC',5,0),
    ('IoT Application Development and Edge Computing','IT-S5-03',3,'PC',5,0),
    ('Generative AI and Prompt Engineering for Enterprise','IT-S5-04',4,'PE',5,8),
    ('UI/UX Design: Figma, Prototyping and Usability Testing','IT-S5-05',3,'OE',5,2),
    ('Digital Forensics and Incident Response','IT-S5-06',3,'PE',5,7),
    ('Cloud Architecture and Deployment Lab','IT-S5-07',4,'SEC',5,0),
    # SEM 6
    ('Serverless Computing and Function-as-a-Service','IT-S6-01',2,'PC',6,0),
    ('Advanced Cybersecurity: Penetration Testing and Threat Intelligence','IT-S6-02',3,'PC',6,7),
    ('Data Engineering: Kafka, Spark and Data Warehousing','IT-S6-03',3,'PE',6,1),
    ('IT Service Management: ITIL and SLA','IT-S6-04',3,'PE',6,6),
    # SEM 7
    ('Quantum Computing Fundamentals and Qiskit','IT-S7-01',3,'PE',7,9),
    ('AI-Driven Cybersecurity and Threat Hunting','IT-S7-02',3,'PE',7,7),
    ('Extended Reality: AR, VR and Metaverse Technologies','IT-S7-03',3,'PE',7,2),
    ('Sustainable IT and Green Data Centers','IT-S7-04',3,'OE',7,9),
    ('Industry Internship: Applied IT Engineering','IT-S7-05',3,'PR',7,-1),
    # SEM 8
    ('Technology Entrepreneurship and Start-Up Ecosystem','IT-S8-01',2,'OE',8,6),
    ('Capstone Project Phase I: Research and IT System Design','IT-S8-02',3,'PR',8,-1),
    ('Capstone Project Phase I: Architecture and Prototype','IT-S8-03',2,'PR',8,-1),
    ('Capstone Project Phase II: Development and Deployment','IT-S8-04',3,'PR',8,-1),
],
'AIDS':[
    # SEM 1
    ('Calculus, Linear Algebra and Optimization for AI','AIDS-S1-01',4,'BS',1,8),
    ('Statistics and Probability: Foundations for Data Science','AIDS-S1-02',3,'BS',1,0),
    ('Engineering Chemistry: Biomolecules and Nanomaterials','AIDS-S1-03',3,'BS',1,8),
    ('Discrete Mathematics: Logic, Sets and Graph Theory','AIDS-S1-04',3,'BS',1,8),
    ('Programming in Python: Fundamentals and Scientific Computing','AIDS-S1-05',3,'ES',1,6),
    ('Data Structures and Algorithms in Python','AIDS-S1-06',3,'ES',1,6),
    ('Introduction to Databases: SQL and Data Modelling','AIDS-S1-07',3,'ES',1,3),
    ('Digital Logic and Computer Organisation','AIDS-S1-08',3,'ES',1,8),
    ('Communicative English and Data Storytelling','AIDS-S1-09',3,'HS',1,8),
    ('AI Ethics, Society and Responsible Innovation','AIDS-S1-10',3,'HS',1,7),
    # SEM 2
    ('Machine Learning Fundamentals: Supervised and Unsupervised','AIDS-S2-01',3,'PC',2,0),
    ('Statistical Inference: Hypothesis Testing and Bayesian Analysis','AIDS-S2-02',3,'PC',2,0),
    ('Data Engineering: ETL, Pipelines and Data Lakes','AIDS-S2-03',3,'PC',2,6),
    ('Database Systems: NoSQL, Graph DB and Time-Series','AIDS-S2-04',3,'PC',2,3),
    ('Visualization: Matplotlib, Seaborn, Tableau and Power BI','AIDS-S2-05',3,'PC',2,2),
    ('Linux for Data Scientists and Cloud Platforms','AIDS-S2-06',3,'ES',2,6),
    ('Environmental Science and Sustainable AI','AIDS-S2-07',3,'HS',2,8),
    ('Constitution of India and Tech Policy','AIDS-S2-08',3,'HS',2,8),
    ('Communication Skills and Data Presentation','AIDS-S2-09',3,'AE',2,8),
    # SEM 3
    ('Deep Learning: CNN, RNN, LSTM and Transformers','AIDS-S3-01',3,'PC',3,9),
    ('Natural Language Processing: Tokenization, Embeddings and BERT','AIDS-S3-02',3,'PC',3,3),
    ('Computer Vision: Image Classification and Object Detection','AIDS-S3-03',3,'PC',3,4),
    ('Big Data Technologies: Hadoop, Spark and Hive','AIDS-S3-04',3,'PC',3,1),
    ('Feature Engineering and Model Selection','AIDS-S3-05',3,'PC',3,0),
    ('MLOps: Experiment Tracking, CI/CD and Model Registry','AIDS-S3-06',3,'PC',3,6),
    ('Probability Graphs and Causal Inference','AIDS-S3-07',3,'BS',3,0),
    # SEM 4
    ('Reinforcement Learning: MDP, Q-Learning and Policy Gradient','AIDS-S4-01',3,'PC',4,5),
    ('Advanced NLP: LLMs, Fine-Tuning and RAG','AIDS-S4-02',3,'PC',4,3),
    ('Time Series Analysis and Forecasting','AIDS-S4-03',3,'PC',4,0),
    ('Cloud AI Services: AWS SageMaker, GCP Vertex AI','AIDS-S4-04',3,'PC',4,6),
    ('Explainable AI and Model Interpretability','AIDS-S4-05',3,'PC',4,7),
    ('Data Governance, Privacy and Regulatory Compliance','AIDS-S4-06',3,'PC',4,7),
    ('Minor Project: Data Science Application','AIDS-S4-07',3,'PR',4,-1),
    # SEM 5
    ('Generative AI: GANs, VAEs and Diffusion Models','AIDS-S5-01',3,'PC',5,9),
    ('Graph Neural Networks and Knowledge Graphs','AIDS-S5-02',3,'PC',5,3),
    ('AI for Healthcare: Medical Imaging and Drug Discovery','AIDS-S5-03',3,'PE',5,9),
    ('Federated Learning and Privacy-Preserving ML','AIDS-S5-04',3,'PE',5,5),
    ('Recommender Systems and Personalization Engines','AIDS-S5-05',3,'PE',5,0),
    ('Business Intelligence and Decision Analytics','AIDS-S5-06',3,'OE',5,2),
    ('End-to-End ML Pipeline and Production Deployment Lab','AIDS-S5-07',4,'SEC',5,6),
    # SEM 6
    ('AI for Climate Change and Environmental Monitoring','AIDS-S6-01',3,'PE',6,7),
    ('Quantum Machine Learning Fundamentals','AIDS-S6-02',3,'PE',6,8),
    ('Real-Time Analytics: Stream Processing with Kafka','AIDS-S6-03',3,'PC',6,1),
    ('AI Product Management and Go-to-Market Strategy','AIDS-S6-04',3,'OE',6,7),
    # SEM 7
    ('Multimodal AI: Vision, Language and Audio Fusion','AIDS-S7-01',3,'PE',7,9),
    ('Autonomous Systems and Self-Supervised Learning','AIDS-S7-02',3,'PE',7,5),
    ('AI Regulation, Governance and Global Standards','AIDS-S7-03',3,'PE',7,7),
    ('Smart Agriculture, Fintech and AI Applications','AIDS-S7-04',3,'OE',7,8),
    ('Industry Internship: Applied Data Science','AIDS-S7-05',3,'PR',7,-1),
    # SEM 8
    ('Technology Entrepreneurship and AI Start-Ups','AIDS-S8-01',2,'OE',8,7),
    ('Capstone Project Phase I: Research and DS System Design','AIDS-S8-02',3,'PR',8,-1),
    ('Capstone Project Phase I: Data Collection and Modelling','AIDS-S8-03',2,'PR',8,-1),
    ('Capstone Project Phase II: Deployment and Impact Analysis','AIDS-S8-04',3,'PR',8,-1),
],
'AIML':[
    # SEM 1
    ('Calculus, Linear Algebra and Mathematical Optimization','AIML-S1-01',4,'BS',1,8),
    ('Statistics, Probability and Stochastic Processes','AIML-S1-02',3,'BS',1,8),
    ('Engineering Chemistry: Smart Materials and Nanoscience','AIML-S1-03',3,'BS',1,8),
    ('Discrete Mathematics and Formal Logic for AI','AIML-S1-04',3,'BS',1,8),
    ('Python Programming: OOP, Functional and Scientific','AIML-S1-05',3,'ES',1,1),
    ('Data Structures and Algorithm Design','AIML-S1-06',3,'ES',1,1),
    ('Database Systems: SQL, ORM and Data Modelling','AIML-S1-07',3,'ES',1,1),
    ('Introduction to Machine Learning Concepts','AIML-S1-08',3,'ES',1,0),
    ('AI Ethics, Bias and Responsible Computing','AIML-S1-09',3,'HS',1,8),
    ('Communicative English and Research Writing','AIML-S1-10',3,'HS',1,8),
    # SEM 2
    ('Supervised Learning: Regression, Classification and Ensembles','AIML-S2-01',3,'PC',2,0),
    ('Unsupervised Learning: Clustering, PCA and Anomaly Detection','AIML-S2-02',3,'PC',2,0),
    ('Neural Networks: Perceptron, Backpropagation and Activation','AIML-S2-03',3,'PC',2,1),
    ('Feature Engineering and Preprocessing Pipelines','AIML-S2-04',3,'PC',2,0),
    ('Data Wrangling: Pandas, NumPy and SciPy','AIML-S2-05',3,'PC',2,1),
    ('Cloud Computing and MLaaS Platforms','AIML-S2-06',3,'ES',2,3),
    ('Environmental Science and Sustainable AI','AIML-S2-07',3,'HS',2,8),
    ('Communication Skills and Professional Development','AIML-S2-08',3,'AE',2,8),
    # SEM 3
    ('Deep Learning: CNN Architectures and Image Recognition','AIML-S3-01',3,'PC',3,1),
    ('Recurrent Networks: RNN, LSTM, GRU and Seq2Seq','AIML-S3-02',3,'PC',3,1),
    ('Transformers and Attention Mechanisms: BERT, GPT','AIML-S3-03',3,'PC',3,2),
    ('Computer Vision: Detection, Segmentation and Tracking','AIML-S3-04',3,'PC',3,5),
    ('Natural Language Processing: NER, Sentiment and Translation','AIML-S3-05',3,'PC',3,2),
    ('MLOps: Experiment Tracking, Pipelines and Model Registry','AIML-S3-06',3,'PC',3,3),
    ('Bayesian Machine Learning and Probabilistic Programming','AIML-S3-07',3,'BS',3,8),
    # SEM 4
    ('Reinforcement Learning: Policy Optimization and Deep RL','AIML-S4-01',3,'PC',4,4),
    ('Generative Models: GANs, VAEs and Diffusion Networks','AIML-S4-02',3,'PC',4,2),
    ('Graph Neural Networks and Relational Learning','AIML-S4-03',3,'PC',4,1),
    ('Large Language Models: Fine-Tuning, RLHF and RAG','AIML-S4-04',3,'PC',4,2),
    ('Model Optimization: Pruning, Quantization and Knowledge Distillation','AIML-S4-05',3,'PC',4,3),
    ('AI for Healthcare, Finance and Autonomous Systems','AIML-S4-06',3,'PE',4,9),
    ('Minor Project: Applied ML System','AIML-S4-07',3,'PR',4,-1),
    # SEM 5
    ('Federated Learning and Privacy in AI','AIML-S5-01',3,'PC',5,4),
    ('Causal Inference and Counterfactual Reasoning','AIML-S5-02',3,'PC',5,8),
    ('AI System Design: Scalable Architectures and Serving','AIML-S5-03',3,'PC',5,3),
    ('Multimodal Learning: Vision, Language and Audio','AIML-S5-04',4,'PE',5,5),
    ('Robotics and Autonomous Agents: ROS and Perception','AIML-S5-05',3,'PE',5,6),
    ('AI Product Design and Human-AI Interaction','AIML-S5-06',3,'OE',5,8),
    ('End-to-End ML Engineering Lab: AWS/GCP/Azure','AIML-S5-07',4,'SEC',5,3),
    # SEM 6
    ('Meta-Learning and Few-Shot Generalization','AIML-S6-01',3,'PC',6,1),
    ('Trustworthy AI: Safety, Robustness and Interpretability','AIML-S6-02',3,'PC',6,8),
    ('AI for Edge Devices: TinyML and FPGA Deployment','AIML-S6-03',3,'PE',6,3),
    ('Research Methods, Paper Writing and Patent Filing','AIML-S6-04',3,'OE',6,8),
    # SEM 7
    ('Foundation Models: GPT-4, Gemini and Llama Architectures','AIML-S7-01',3,'PE',7,2),
    ('AI Regulation, Ethics Boards and Global Policy','AIML-S7-02',3,'PE',7,8),
    ('Neuromorphic Computing and Brain-Inspired AI','AIML-S7-03',3,'PE',7,1),
    ('AI for Climate, Sustainability and SDGs','AIML-S7-04',3,'OE',7,8),
    ('Industry Internship: Applied AI/ML Engineering','AIML-S7-05',3,'PR',7,-1),
    # SEM 8
    ('Technology Entrepreneurship and AI Ventures','AIML-S8-01',2,'OE',8,8),
    ('Capstone Project Phase I: Research and ML System Design','AIML-S8-02',3,'PR',8,-1),
    ('Capstone Project Phase I: Model Development and Validation','AIML-S8-03',2,'PR',8,-1),
    ('Capstone Project Phase II: Deployment, Evaluation and Impact','AIML-S8-04',3,'PR',8,-1),
],
}

# ── STUDENT NAMES PER DEPT (40 per dept: 10 per batch × 4 batches) ───────────
STUDENT_NAMES = {
'CSE':{
    2025:[('Aarav Sharma','aarav.sharma.cse'),('Ananya Patel','ananya.patel.cse'),
          ('Arjun Reddy','arjun.reddy.cse'),('Bhavya Nair','bhavya.nair.cse'),
          ('Chirag Mehta','chirag.mehta.cse'),('Diya Krishnan','diya.krishnan.cse'),
          ('Gaurav Singh','gaurav.singh.cse'),('Harini Rao','harini.rao.cse'),
          ('Ishaan Gupta','ishaan.gupta.cse'),('Jyoti Iyer','jyoti.iyer.cse')],
    2024:[('Karan Verma','karan.verma.cse'),('Lavanya Menon','lavanya.menon.cse'),
          ('Manish Tiwari','manish.tiwari.cse'),('Nandini Pillai','nandini.pillai.cse'),
          ('Omkar Desai','omkar.desai.cse'),('Pallavi Joshi','pallavi.joshi.cse'),
          ('Rahul Kumar','rahul.kumar.cse'),('Sakshi Dubey','sakshi.dubey.cse'),
          ('Tarun Bhat','tarun.bhat.cse'),('Uma Chandra','uma.chandra.cse')],
    2023:[('Varun Agarwal','varun.agarwal.cse'),('Vidya Suresh','vidya.suresh.cse'),
          ('Vishal Pandey','vishal.pandey.cse'),('Yashika Sinha','yashika.sinha.cse'),
          ('Zara Khan','zara.khan.cse'),('Abhishek Roy','abhishek.roy.cse'),
          ('Akanksha Mishra','akanksha.mishra.cse'),('Alok Tiwari','alok.tiwari.cse'),
          ('Amrita Bose','amrita.bose.cse'),('Anil Kapoor','anil.kapoor.cse')],
    2022:[('Ayesha Siddiqui','ayesha.siddiqui.cse'),('Balaji Rajan','balaji.rajan.cse'),
          ('Chandan Yadav','chandan.yadav.cse'),('Deepika Nambiar','deepika.nambiar.cse'),
          ('Eshan Malhotra','eshan.malhotra.cse'),('Farhan Shaikh','farhan.shaikh.cse'),
          ('Geeta Pillai','geeta.pillai.cse'),('Harshit Agrawal','harshit.agrawal.cse'),
          ('Isha Saxena','isha.saxena.cse'),('Jayant Mehrotra','jayant.mehrotra.cse')],
},
'ECE':{
    2025:[('Aditi Sharma','aditi.sharma.ece'),('Aditya Kumar','aditya.kumar.ece'),
          ('Akshay Nair','akshay.nair.ece'),('Anjali Reddy','anjali.reddy.ece'),
          ('Aniket Patel','aniket.patel.ece'),('Deepak Menon','deepak.menon.ece'),
          ('Dhruv Singh','dhruv.singh.ece'),('Ekta Joshi','ekta.joshi.ece'),
          ('Farida Khan','farida.khan.ece'),('Ganesh Rao','ganesh.rao.ece')],
    2024:[('Heena Gupta','heena.gupta.ece'),('Hemant Pillai','hemant.pillai.ece'),
          ('Indra Mishra','indra.mishra.ece'),('Jatin Bose','jatin.bose.ece'),
          ('Kavita Iyer','kavita.iyer.ece'),('Kishore Mehta','kishore.mehta.ece'),
          ('Lakshmi Nambiar','lakshmi.nambiar.ece'),('Madhuri Tiwari','madhuri.tiwari.ece'),
          ('Naveen Saxena','naveen.saxena.ece'),('Neha Yadav','neha.yadav.ece')],
    2023:[('Nikhil Kapoor','nikhil.kapoor.ece'),('Nitin Verma','nitin.verma.ece'),
          ('Pooja Desai','pooja.desai.ece'),('Pradeep Bhat','pradeep.bhat.ece'),
          ('Pranav Chandra','pranav.chandra.ece'),('Preeti Agarwal','preeti.agarwal.ece'),
          ('Priya Suresh','priya.suresh.ece'),('Rahil Pandey','rahil.pandey.ece'),
          ('Rashida Sinha','rashida.sinha.ece'),('Ritesh Khan','ritesh.khan.ece')],
    2022:[('Rohan Roy','rohan.roy.ece'),('Rohini Mishra','rohini.mishra.ece'),
          ('Sahil Tiwari','sahil.tiwari.ece'),('Sameer Bose','sameer.bose.ece'),
          ('Sandhya Kapoor','sandhya.kapoor.ece'),('Sanjay Verma','sanjay.verma.ece'),
          ('Sara Menon','sara.menon.ece'),('Shubham Rao','shubham.rao.ece'),
          ('Sneha Nair','sneha.nair.ece'),('Sonam Joshi','sonam.joshi.ece')],
},
'EEE':{
    2025:[('Sriram Pillai','sriram.pillai.eee'),('Suraj Reddy','suraj.reddy.eee'),
          ('Swati Singh','swati.singh.eee'),('Tanmay Kumar','tanmay.kumar.eee'),
          ('Tanya Sharma','tanya.sharma.eee'),('Tejas Nair','tejas.nair.eee'),
          ('Usha Mehta','usha.mehta.eee'),('Utkarsh Iyer','utkarsh.iyer.eee'),
          ('Varsha Rao','varsha.rao.eee'),('Veer Gupta','veer.gupta.eee')],
    2024:[('Vijay Menon','vijay.menon.eee'),('Vinay Patel','vinay.patel.eee'),
          ('Vipin Mishra','vipin.mishra.eee'),('Vivek Bose','vivek.bose.eee'),
          ('Waseem Khan','waseem.khan.eee'),('Yamini Desai','yamini.desai.eee'),
          ('Yash Kapoor','yash.kapoor.eee'),('Yogesh Tiwari','yogesh.tiwari.eee'),
          ('Zainab Siddiqui','zainab.siddiqui.eee'),('Zenith Sharma','zenith.sharma.eee')],
    2023:[('Abhinav Reddy','abhinav.reddy.eee'),('Achyut Nair','achyut.nair.eee'),
          ('Adithi Pillai','adithi.pillai.eee'),('Ajay Singh','ajay.singh.eee'),
          ('Ajit Kumar','ajit.kumar.eee'),('Akash Mehta','akash.mehta.eee'),
          ('Akhil Iyer','akhil.iyer.eee'),('Alka Rao','alka.rao.eee'),
          ('Amol Gupta','amol.gupta.eee'),('Amrutha Menon','amrutha.menon.eee')],
    2022:[('Anand Patel','anand.patel.eee'),('Anitha Mishra','anitha.mishra.eee'),
          ('Ankita Bose','ankita.bose.eee'),('Anoop Khan','anoop.khan.eee'),
          ('Anupama Desai','anupama.desai.eee'),('Aparna Kapoor','aparna.kapoor.eee'),
          ('Arathi Tiwari','arathi.tiwari.eee'),('Aravind Sharma','aravind.sharma.eee'),
          ('Archana Reddy','archana.reddy.eee'),('Arshad Nair','arshad.nair.eee')],
},
'ME':{
    2025:[('Arvind Pillai','arvind.pillai.me'),('Ashish Singh','ashish.singh.me'),
          ('Ashok Kumar','ashok.kumar.me'),('Astha Mehta','astha.mehta.me'),
          ('Athira Iyer','athira.iyer.me'),('Atif Rao','atif.rao.me'),
          ('Atulya Gupta','atulya.gupta.me'),('Avni Menon','avni.menon.me'),
          ('Ayaan Patel','ayaan.patel.me'),('Ayushi Mishra','ayushi.mishra.me')],
    2024:[('Azhar Bose','azhar.bose.me'),('Bablu Khan','bablu.khan.me'),
          ('Badrinarayan Desai','badrinarayan.desai.me'),('Bandita Kapoor','bandita.kapoor.me'),
          ('Bhaskar Tiwari','bhaskar.tiwari.me'),('Bhavna Sharma','bhavna.sharma.me'),
          ('Bhuvan Reddy','bhuvan.reddy.me'),('Bindu Nair','bindu.nair.me'),
          ('Bipin Pillai','bipin.pillai.me'),('Brijesh Singh','brijesh.singh.me')],
    2023:[('Chandni Kumar','chandni.kumar.me'),('Chetan Mehta','chetan.mehta.me'),
          ('Chethan Iyer','chethan.iyer.me'),('Chintu Rao','chintu.rao.me'),
          ('Daksh Gupta','daksh.gupta.me'),('Darshan Menon','darshan.menon.me'),
          ('Deepak Patel','deepak.patel.me'),('Deepthi Mishra','deepthi.mishra.me'),
          ('Dev Bose','dev.bose.me'),('Devadath Khan','devadath.khan.me')],
    2022:[('Dhananjay Desai','dhananjay.desai.me'),('Dhanya Kapoor','dhanya.kapoor.me'),
          ('Dhriti Tiwari','dhriti.tiwari.me'),('Diksha Sharma','diksha.sharma.me'),
          ('Dilnoza Reddy','dilnoza.reddy.me'),('Dinesh Nair','dinesh.nair.me'),
          ('Divya Pillai','divya.pillai.me'),('Diya Singh','diya.singh.me'),
          ('Durgesh Kumar','durgesh.kumar.me'),('Edwina Mehta','edwina.mehta.me')],
},
'CE':{
    2025:[('Eklavya Iyer','eklavya.iyer.ce'),('Elango Rao','elango.rao.ce'),
          ('Elizabeth Gupta','elizabeth.gupta.ce'),('Elsa Menon','elsa.menon.ce'),
          ('Emmanuel Patel','emmanuel.patel.ce'),('Eswar Mishra','eswar.mishra.ce'),
          ('Faisal Bose','faisal.bose.ce'),('Falguni Khan','falguni.khan.ce'),
          ('Farida Desai','farida.desai.ce'),('Fathima Kapoor','fathima.kapoor.ce')],
    2024:[('Gaurangi Tiwari','gaurangi.tiwari.ce'),('Girish Sharma','girish.sharma.ce'),
          ('Gitanjali Reddy','gitanjali.reddy.ce'),('Gopal Nair','gopal.nair.ce'),
          ('Govind Pillai','govind.pillai.ce'),('Gracy Singh','gracy.singh.ce'),
          ('Gulshan Kumar','gulshan.kumar.ce'),('Gurmeet Mehta','gurmeet.mehta.ce'),
          ('Gyana Iyer','gyana.iyer.ce'),('Hana Rao','hana.rao.ce')],
    2023:[('Harika Gupta','harika.gupta.ce'),('Harish Menon','harish.menon.ce'),
          ('Harshavardhana Patel','harshavardhana.patel.ce'),('Hemanth Mishra','hemanth.mishra.ce'),
          ('Himani Bose','himani.bose.ce'),('Hiren Khan','hiren.khan.ce'),
          ('Hitesh Desai','hitesh.desai.ce'),('Hritika Kapoor','hritika.kapoor.ce'),
          ('Hussain Tiwari','hussain.tiwari.ce'),('Ila Sharma','ila.sharma.ce')],
    2022:[('Iliyas Reddy','iliyas.reddy.ce'),('Imran Nair','imran.nair.ce'),
          ('Indu Pillai','indu.pillai.ce'),('Indumathi Singh','indumathi.singh.ce'),
          ('Ishan Kumar','ishan.kumar.ce'),('Ishita Mehta','ishita.mehta.ce'),
          ('Jagadish Iyer','jagadish.iyer.ce'),('Jagjit Rao','jagjit.rao.ce'),
          ('Jalpa Gupta','jalpa.gupta.ce'),('Janvi Menon','janvi.menon.ce')],
},
'IT':{
    2025:[('Jasmine Patel','jasmine.patel.it'),('Javed Mishra','javed.mishra.it'),
          ('Jayalakshmi Bose','jayalakshmi.bose.it'),('Jayesh Khan','jayesh.khan.it'),
          ('Jayashree Desai','jayashree.desai.it'),('Jeeva Kapoor','jeeva.kapoor.it'),
          ('Jitin Tiwari','jitin.tiwari.it'),('Joel Sharma','joel.sharma.it'),
          ('Johny Reddy','johny.reddy.it'),('Jyothika Nair','jyothika.nair.it')],
    2024:[('Kabir Pillai','kabir.pillai.it'),('Kalyani Singh','kalyani.singh.it'),
          ('Kamini Kumar','kamini.kumar.it'),('Kanchan Mehta','kanchan.mehta.it'),
          ('Kanishk Iyer','kanishk.iyer.it'),('Karthika Rao','karthika.rao.it'),
          ('Kavitha Gupta','kavitha.gupta.it'),('Kavya Menon','kavya.menon.it'),
          ('Keerthi Patel','keerthi.patel.it'),('Kevin Mishra','kevin.mishra.it')],
    2023:[('Khushi Bose','khushi.bose.it'),('Kiran Khan','kiran.khan.it'),
          ('Kishor Desai','kishor.desai.it'),('Komal Kapoor','komal.kapoor.it'),
          ('Kriti Tiwari','kriti.tiwari.it'),('Krithika Sharma','krithika.sharma.it'),
          ('Kumar Reddy','kumar.reddy.it'),('Kumari Nair','kumari.nair.it'),
          ('Kunal Pillai','kunal.pillai.it'),('Kushal Singh','kushal.singh.it')],
    2022:[('Lara Kumar','lara.kumar.it'),('Latheef Mehta','latheef.mehta.it'),
          ('Laya Iyer','laya.iyer.it'),('Leena Rao','leena.rao.it'),
          ('Lenin Gupta','lenin.gupta.it'),('Lijo Menon','lijo.menon.it'),
          ('Lina Patel','lina.patel.it'),('Lintu Mishra','lintu.mishra.it'),
          ('Lipi Bose','lipi.bose.it'),('Lokesh Khan','lokesh.khan.it')],
},
'AIDS':{
    2025:[('Lopa Desai','lopa.desai.aids'),('Lovely Kapoor','lovely.kapoor.aids'),
          ('Madhav Tiwari','madhav.tiwari.aids'),('Madhu Sharma','madhu.sharma.aids'),
          ('Maheswari Reddy','maheswari.reddy.aids'),('Malini Nair','malini.nair.aids'),
          ('Mallika Pillai','mallika.pillai.aids'),('Manasa Singh','manasa.singh.aids'),
          ('Mani Kumar','mani.kumar.aids'),('Manikandan Mehta','manikandan.mehta.aids')],
    2024:[('Manju Iyer','manju.iyer.aids'),('Manjunath Rao','manjunath.rao.aids'),
          ('Mansi Gupta','mansi.gupta.aids'),('Manya Menon','manya.menon.aids'),
          ('Mary Patel','mary.patel.aids'),('Mayur Mishra','mayur.mishra.aids'),
          ('Meghna Bose','meghna.bose.aids'),('Milan Khan','milan.khan.aids'),
          ('Minu Desai','minu.desai.aids'),('Mira Kapoor','mira.kapoor.aids')],
    2023:[('Mohan Tiwari','mohan.tiwari.aids'),('Mohana Sharma','mohana.sharma.aids'),
          ('Mohit Reddy','mohit.reddy.aids'),('Monalisa Nair','monalisa.nair.aids'),
          ('Mridula Pillai','mridula.pillai.aids'),('Mudra Singh','mudra.singh.aids'),
          ('Mukesh Kumar','mukesh.kumar.aids'),('Mythili Mehta','mythili.mehta.aids'),
          ('Nagalakshmi Iyer','nagalakshmi.iyer.aids'),('Nagaraj Rao','nagaraj.rao.aids')],
    2022:[('Nandita Gupta','nandita.gupta.aids'),('Naresh Menon','naresh.menon.aids'),
          ('Navya Patel','navya.patel.aids'),('Neeraja Mishra','neeraja.mishra.aids'),
          ('Neetu Bose','neetu.bose.aids'),('Niharika Khan','niharika.khan.aids'),
          ('Nikita Desai','nikita.desai.aids'),('Nila Kapoor','nila.kapoor.aids'),
          ('Niraj Tiwari','niraj.tiwari.aids'),('Nirmala Sharma','nirmala.sharma.aids')],
},
'AIML':{
    2025:[('Nishant Reddy','nishant.reddy.aiml'),('Nitesh Nair','nitesh.nair.aiml'),
          ('Nithya Pillai','nithya.pillai.aiml'),('Nivedha Singh','nivedha.singh.aiml'),
          ('Noel Kumar','noel.kumar.aiml'),('Noopur Mehta','noopur.mehta.aiml'),
          ('Nrupesh Iyer','nrupesh.iyer.aiml'),('Nutan Rao','nutan.rao.aiml'),
          ('Nutan Gupta','nutan.gupta.aiml'),('Nysa Menon','nysa.menon.aiml')],
    2024:[('Ojasvi Patel','ojasvi.patel.aiml'),('Omkar Mishra','omkar.mishra.aiml'),
          ('Onam Bose','onam.bose.aiml'),('Padma Khan','padma.khan.aiml'),
          ('Pallavi Desai','pallavi.desai.aiml'),('Pankaj Kapoor','pankaj.kapoor.aiml'),
          ('Parth Tiwari','parth.tiwari.aiml'),('Pavithra Sharma','pavithra.sharma.aiml'),
          ('Piyush Reddy','piyush.reddy.aiml'),('Poornima Nair','poornima.nair.aiml')],
    2023:[('Prabha Pillai','prabha.pillai.aiml'),('Pradeep Singh','pradeep.singh.aiml'),
          ('Prajakta Kumar','prajakta.kumar.aiml'),('Prasad Mehta','prasad.mehta.aiml'),
          ('Pratibha Iyer','pratibha.iyer.aiml'),('Pravin Rao','pravin.rao.aiml'),
          ('Preksha Gupta','preksha.gupta.aiml'),('Priyanka Menon','priyanka.menon.aiml'),
          ('Punam Patel','punam.patel.aiml'),('Purva Mishra','purva.mishra.aiml')],
    2022:[('Rachana Bose','rachana.bose.aiml'),('Raheem Khan','raheem.khan.aiml'),
          ('Rajalakshmi Desai','rajalakshmi.desai.aiml'),('Rajan Kapoor','rajan.kapoor.aiml'),
          ('Rajani Tiwari','rajani.tiwari.aiml'),('Rajesh Sharma','rajesh.sharma.aiml'),
          ('Raji Reddy','raji.reddy.aiml'),('Rajika Nair','rajika.nair.aiml'),
          ('Rajkumar Pillai','rajkumar.pillai.aiml'),('Rakesh Singh','rakesh.singh.aiml')],
},
}

batches = [
    {'yr':2025,'label':'2025-2029','cur_sem':1,'yos':1},
    {'yr':2024,'label':'2024-2028','cur_sem':3,'yos':2},
    {'yr':2023,'label':'2023-2027','cur_sem':5,'yos':3},
    {'yr':2022,'label':'2022-2026','cur_sem':7,'yos':4},
]

# ── PER-DEPARTMENT SEEDING ────────────────────────────────────────────────────
for (dcode,dname,dabbr,hod_name,hod_prefix,hod_emp) in DEPTS:
    print(f"\n--- Seeding Department: {dcode} ---")

    # Department HOD
    hod_id  = uid()
    hod_email = f"{hod_prefix}@lumina.com"
    cur.execute("""INSERT INTO users(id,email,name,role,password_hash,phone,status,is_active,
        college_id,employee_id,full_name,onboarding_step)
        VALUES(%s,%s,%s,'hod',%s,%s,'active',true,%s,%s,%s,5)""",
        (hod_id,hod_email,hod_name,hp(hod_email),
         f'+91-9100000{DEPTS.index((dcode,dname,dabbr,hod_name,hod_prefix,hod_emp))+1:02d}',
         inst_id,hod_emp,hod_name))
    cur.execute("INSERT INTO user_roles VALUES(%s,%s,%s)",(hod_id,role_ids['hod'],inst_id))
    creds.append(['hod',hod_name,hod_email,hod_email,'HOD Portal',f'HOD - {dname}',dcode,'—'])

    # Department
    dept_id = uid()
    cur.execute("""INSERT INTO departments(id,institution_id,department_name,description,hod_id,
        code,abbreviation,intake_strength,established_year,teacher_limit,class_limit,course_limit,metadata)
        VALUES(%s,%s,%s,%s,%s,%s,%s,60,2005,15,8,60,'{}')""",
        (dept_id,inst_id,dname,f'Department of {dabbr} - B.Tech Program',
         hod_id,dcode,dabbr))
    cur.execute("UPDATE users SET department_id=%s, dept_id=%s WHERE id=%s",
                (dept_id,dept_id,hod_id))

    # Program
    prog_id = uid()
    cur.execute("""INSERT INTO programs(id,institution_id,department_id,program_name,degree,
        level,intake,status,duration_years)
        VALUES(%s,%s,%s,%s,'B.Tech','UG',60,'active',4)""",
        (prog_id,inst_id,dept_id,f'B.Tech {dname}'))

    # Semesters
    sem_ids = {}
    titles = {1:'Semester I - Foundation',2:'Semester II - Foundation',
              3:'Semester III - Engineering Base',4:'Semester IV - Engineering Base',
              5:'Semester V - Professional Core',6:'Semester VI - Professional Core',
              7:'Semester VII - Specialization',8:'Semester VIII - Capstone'}
    for n in range(1,9):
        s = uid(); sem_ids[n] = s
        cur.execute("INSERT INTO semesters(id,program_id,semester_number,title) VALUES(%s,%s,%s,%s)",
                    (s,prog_id,n,titles[n]))

    # Batches + Classes
    batch_ids_d = {}; class_ids_d = {}
    for b in batches:
        bid = uid(); batch_ids_d[b['yr']] = bid
        cur.execute("""INSERT INTO batches(id,college_id,dept_id,year,label,sections,
            current_semester,is_lateral) VALUES(%s,%s,%s,%s,%s,'{A}',%s,false)""",
            (bid,inst_id,dept_id,b['yr'],b['label'],b['cur_sem']))
        cid = uid(); class_ids_d[b['yr']] = cid
        cur.execute("""INSERT INTO classes(id,program_id,semester_id,section_name,academic_year,
            batch_name,class_name,batch,section,department_id,batch_year,batch_id,student_limit,teacher_limit)
            VALUES(%s,%s,%s,'A',%s,%s,%s,%s,'A',%s,%s,%s,60,10)""",
            (cid,prog_id,sem_ids[b['cur_sem']],b['label'],b['label'],
             f"{dcode}-{b['yr']}-A",b['label'],dept_id,str(b['yr']),bid))

    # Faculty
    fac_list = FACULTY[dcode]
    fac_ids_d = {-1: hod_id}  # -1 = HOD
    for i,(fp,fname,fspec) in enumerate(fac_list):
        email = f"{fp}@lumina.com"
        fid = uid(); fac_ids_d[i] = fid
        cur.execute("""INSERT INTO users(id,email,name,role,password_hash,phone,status,is_active,
            college_id,department_id,dept_id,employee_id,full_name,onboarding_step)
            VALUES(%s,%s,%s,'teacher',%s,%s,'active',true,%s,%s,%s,%s,%s,5)""",
            (fid,email,fname,hp(email),f'+91-9200{dcode}{i:02d}',
             inst_id,dept_id,dept_id,f'EMP-{dcode}-{i+1:03d}',fname))
        cur.execute("INSERT INTO user_roles VALUES(%s,%s,%s)",(fid,role_ids['teacher'],inst_id))
        creds.append(['teacher',fname,email,email,'Teacher Portal',fspec,dcode,'—'])

    # Courses
    course_ids_d = {}
    for (title,code,credits,cat,sem,fi) in CURRICULUM[dcode]:
        cid = uid(); course_ids_d[code] = cid
        fid = fac_ids_d.get(fi, hod_id)
        cur.execute("""INSERT INTO courses(id,teacher_id,title,course_name,name,code,course_code,
            credits,category,semester_id,program_id,department_id,is_published,college_id,metadata)
            VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true,%s,%s)""",
            (cid,fid,title,title,title[:60],code,code,credits,cat,
             sem_ids[sem],prog_id,dept_id,inst_id,
             json.dumps({'semester':sem,'category':cat,'credits':credits,'dept':dcode})))
        for c in con(title):
            cur.execute("INSERT INTO course_concepts(id,course_id,concept_name) VALUES(%s,%s,%s)",
                        (uid(),cid,c))

    # Students + Enrollments
    stu_ids_d = {yr:[] for yr in [2025,2024,2023,2022]}
    for b in batches:
        yr = b['yr']
        for i,(name,prefix) in enumerate(STUDENT_NAMES[dcode][yr]):
            email = f"{prefix}@lumina.com"
            sid = uid(); stu_ids_d[yr].append(sid)
            roll = f"{dcode}{yr}{i+1:03d}"
            cur.execute("""INSERT INTO users(id,email,name,role,password_hash,phone,status,is_active,
                college_id,department_id,dept_id,batch_id,section,student_roll,full_name,onboarding_step)
                VALUES(%s,%s,%s,'student',%s,%s,'active',true,%s,%s,%s,%s,'A',%s,%s,5)""",
                (sid,email,name,hp(email),f'+91-8{dcode[:1]}{yr}{i+1:03d}',
                 inst_id,dept_id,dept_id,batch_ids_d[yr],roll,name))
            cur.execute("INSERT INTO user_roles VALUES(%s,%s,%s)",(sid,role_ids['student'],inst_id))
            cur.execute("""INSERT INTO student_enrollments(id,student_id,program_id,
                current_semester_id,class_id,year_of_study,status)
                VALUES(%s,%s,%s,%s,%s,%s,'active')""",
                (uid(),sid,prog_id,sem_ids[b['cur_sem']],class_ids_d[yr],b['yos']))
            cur.execute("""INSERT INTO learner_profiles(user_id,role,grade_level,goals,preferences,
                learning_style,strengths,weaknesses)
                VALUES(%s,'student',%s,%s,'{"theme":"dark"}','visual',
                '["Problem Solving"]','["Time Management"]') ON CONFLICT DO NOTHING""",
                (sid,f"Year {b['yos']}",json.dumps([f'Complete B.Tech {dcode}','Industry-ready skills'])))
            creds.append(['student',name,email,email,'Student Portal',
                          f"Year {b['yos']} | Sem {b['cur_sem']}",dcode,roll])

    # Teacher Assignments + Course Enrollments
    for (title,code,credits,cat,sem,fi) in CURRICULUM[dcode]:
        cid = course_ids_d[code]
        fid = fac_ids_d.get(fi, hod_id)
        for b in batches:
            if sem <= b['cur_sem']:
                cur.execute("""INSERT INTO teacher_assignments(id,teacher_id,course_id,class_id,
                    is_primary,batch_id,section,academic_year)
                    VALUES(%s,%s,%s,%s,true,%s,'A',%s) ON CONFLICT DO NOTHING""",
                    (uid(),fid,cid,class_ids_d[b['yr']],batch_ids_d[b['yr']],b['label']))
                for sid in stu_ids_d[b['yr']]:
                    cur.execute("""INSERT INTO enrollments(id,student_id,course_id,status,progress)
                        VALUES(%s,%s,%s,'active','{}') ON CONFLICT DO NOTHING""",
                        (uid(),sid,cid))
                    if sem == b['cur_sem']:
                        cur.execute("INSERT INTO student_subjects VALUES(%s,%s) ON CONFLICT DO NOTHING",
                                    (sid,cid))

    # Assignments
    for (title,code,credits,cat,sem,fi) in CURRICULUM[dcode]:
        cid = course_ids_d[code]
        fid = fac_ids_d.get(fi, hod_id)
        for b in batches:
            if sem == b['cur_sem']:
                for (aname,dd,mk) in [
                    (f'Assignment 1 – {title[:38]}',14,100),
                    (f'Mid-Sem Quiz – {title[:40]}',35,50),
                    (f'Project – {title[:45]}',60,100)]:
                    cur.execute("""INSERT INTO assignments(id,course_id,teacher_id,batch_id,section,
                        title,description,due_date,max_marks)
                        VALUES(%s,%s,%s,%s,'A',%s,%s,%s,%s)""",
                        (uid(),cid,fid,batch_ids_d[b['yr']],aname,
                         f'Course: {title[:60]}',
                         datetime.now()+timedelta(days=dd),mk))

    # Timetable
    time_slots=[('08:00','09:00'),('09:00','10:00'),('10:15','11:15'),('11:15','12:15'),
                ('13:00','14:00'),('14:00','15:00'),('15:15','16:15'),('16:15','17:00')]
    days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    for b in batches:
        active=[(t,c,fi) for (t,c,cr,cat,s,fi) in CURRICULUM[dcode] if s==b['cur_sem']]
        tt=[]; idx=0
        for day in days:
            for ts,te in time_slots:
                t,c,fi=active[idx%len(active)]
                tt.append({'day':day,'start':ts,'end':te,'course_code':c,
                           'course_title':t[:42],'room':f'{dcode}-{101+(idx%5)}'})
                idx+=1
        cur.execute("UPDATE classes SET metadata=%s WHERE id=%s",
                    (json.dumps({'timetable':tt,'academic_year':b['label'],
                                 'current_semester':b['cur_sem'],'batch_year':b['yr']}),
                     class_ids_d[b['yr']]))

    conn.commit()
    print(f"    ✓ {dcode}: HOD + {len(fac_list)} faculty + 40 students + "
          f"{len(CURRICULUM[dcode])} courses")

# ── CREDENTIALS CSV ───────────────────────────────────────────────────────────
csv_path = '/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/clever-jemison/LUMINA_ALL_CREDENTIALS.csv'
with open(csv_path,'w',newline='') as f:
    w = csv.writer(f)
    w.writerow(['Role','Full Name','Email (Login)','Password','Portal','Specialization/Year','Dept','Roll No'])
    w.writerows(creds)

# ── FINAL SUMMARY ─────────────────────────────────────────────────────────────
cur.execute("SELECT role,COUNT(*) FROM users GROUP BY role ORDER BY role")
counts = dict(cur.fetchall())
cur.execute("SELECT COUNT(*) FROM courses"); cc = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM enrollments"); ec = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM assignments"); ac = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM departments"); dc = cur.fetchone()[0]

print("\n" + "="*56)
print("   LUMINA LMS — ALL DEPARTMENTS COMPLETE")
print("="*56)
print(f"  Institution  : Lumina Institute of Technology")
print(f"  Departments  : {dc} (CSE,ECE,EEE,ME,CE,IT,AIDS,AIML)")
print(f"  Admin        : admin@lumina.com / admin@lumina.com")
print(f"  HODs         : {counts.get('hod',0)} (one per department)")
print(f"  Faculty      : {counts.get('teacher',0)} (10 per department)")
print(f"  Students     : {counts.get('student',0)} (40 per dept × 8 depts)")
print(f"  Courses      : {cc} (8 semesters × 8 depts)")
print(f"  Enrollments  : {ec}")
print(f"  Assignments  : {ac}")
print(f"  All passwords: = Email ID")
print(f"  Credentials  : LUMINA_ALL_CREDENTIALS.csv")
print("="*56)

cur.close()
conn.close()
