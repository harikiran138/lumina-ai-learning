# Lumina Academic Hierarchy, Onboarding, Permissions, and Curriculum Mapping

This document defines the **logical hierarchy**, **role permissions**, and **onboarding flow** for a B.Tech CSE program, based on the curriculum in `B.Tech_Computer_Science_and_Engineering_1772866979750_Curriculum.pdf`.

The design enforces:
- Students only see courses in their assigned semester.
- Teachers only see courses/semester(s) they are assigned to teach.
- Admin has full visibility and control across all semesters and users.

---

## 1. Core Hierarchy (Logical Structure)

1. Institution
2. Program (e.g., B.Tech CSE)
3. Academic Year
4. Semester
5. Course
6. Section/Batch (optional if needed)
7. Users (Admin, Teacher, Student)
8. Enrollments and Teaching Assignments

---

## 2. Roles and Scope Rules

### Admin
- Full access to all programs, semesters, courses, users, and data.
- Creates semesters, courses, and batch structures.
- Approves teacher requests and assigns teachers to courses.

### Teacher
- Sees only the semester(s) and course(s) they teach.
- Can manage content and assessments only within their assigned course(s).
- Can access only students enrolled in their assigned course(s) or semester(s).

### Student
- Sees only their assigned semester and its courses.
- Can only interact with teacher content and assignments for those courses.

---

## 3. Permission Matrix (Summary)

1. Admin
- Create/Edit semesters and courses
- Assign teachers
- View all students and data
- Override access if needed

2. Teacher
- View assigned semesters and courses
- Create course content and assessments
- View enrolled students only
- Request access to new courses/semesters

3. Student
- View assigned semester and courses
- Submit assignments and interact with AI tutor
- No visibility into other semesters/courses

---

## 4. Onboarding Flow (Logical Steps)

### Admin Setup
1. Create Program: B.Tech CSE
2. Create Semesters (I to VIII)
3. Load courses from curriculum for each semester
4. Create sections/batches if required

### Teacher Onboarding
1. Teacher account created by Admin (or invited)
2. Teacher requests access to Semester(s) or Course(s)
3. Admin approves and assigns
4. Teacher gains visibility only for assigned scope

### Student Onboarding
1. Student account created or imported by Admin
2. Student assigned to Semester (example: Semester I)
3. Student auto-enrolled in all courses of that semester
4. Student sees only that semester’s courses

---

## 5. Data Model (Schema-Level Structure)

### Entities
1. Program
- `id`, `name`, `duration_years`

2. Semester
- `id`, `program_id`, `number`, `title`, `year`

3. Course
- `id`, `semester_id`, `code`, `title`, `category`, `credits`

4. User
- `id`, `name`, `email`, `role`

5. Enrollment
- `student_id`, `semester_id`, `course_id`

6. TeachingAssignment
- `teacher_id`, `semester_id`, `course_id`

7. AccessRequest
- `user_id`, `request_type`, `target_semester`, `target_course`, `status`

---

## 6. Curriculum Mapping (B.Tech CSE)

**Course code convention (internal):** `CSE-S{semester}-NN`  
This is an internal placeholder format. Replace with official university codes if provided.

### Semester I (Foundation)

| Code | Course | Credits | Category |
| --- | --- | --- | --- |
| CSE-S1-01 | Differential Equations and Transform Calculus | 3 | BS |
| CSE-S1-02 | Engineering Chemistry: Material Science | 3 | BS |
| CSE-S1-03 | Engineering Physics: Waves and Quantum Mechanics | 3 | BS |
| CSE-S1-04 | Linear Algebra and Calculus | 4 | BS |
| CSE-S1-05 | Computer Organization | 3 | ES |
| CSE-S1-06 | Data Structures | 3 | ES |
| CSE-S1-07 | Digital Logic Design | 3 | ES |
| CSE-S1-08 | Programming Fundamentals | 3 | ES |
| CSE-S1-09 | Communicative English | 3 | HS |
| CSE-S1-10 | Professional Ethics and Human Values | 3 | HS |

### Semester II (Foundation)

| Code | Course | Credits | Category |
| --- | --- | --- | --- |
| CSE-S2-01 | Biology for Engineers | 3 | BS |
| CSE-S2-02 | Advanced Engineering Chemistry: Nanomaterials and Catalysis | 3 | BS |
| CSE-S2-03 | Object Oriented Programming | 3 | ES |
| CSE-S2-04 | Operating System Concepts | 3 | ES |
| CSE-S2-05 | Software Tools and Practices | 3 | ES |
| CSE-S2-06 | Web Programming Basics | 3 | ES |
| CSE-S2-07 | Advanced Web Development Frameworks | 2 | ES |
| CSE-S2-08 | Constitution of India | 3 | HS |
| CSE-S2-09 | Environmental Science and Sustainability | 3 | HS |
| CSE-S2-10 | Soft Skills | 3 | AE |

### Semester III (Engineering Base)

| Code | Course | Credits | Category |
| --- | --- | --- | --- |
| CSE-S3-01 | Discrete Mathematics and Graph Theory | 3 | BS |
| CSE-S3-02 | Psychology for Engineers | 2 | HS |
| CSE-S3-03 | Compiler Design | 3 | PC |
| CSE-S3-04 | Distributed Systems | 3 | PC |
| CSE-S3-05 | Information Security | 3 | PC |
| CSE-S3-06 | Software Engineering | 3 | PC |
| CSE-S3-07 | Theory of Computation | 3 | PC |

### Semester IV (Engineering Base)

| Code | Course | Credits | Category |
| --- | --- | --- | --- |
| CSE-S4-01 | Computer Networks | 3 | PC |
| CSE-S4-02 | Database Management Systems | 3 | PC |
| CSE-S4-03 | Design and Analysis of Algorithms | 3 | PC |
| CSE-S4-04 | Operating Systems | 3 | PC |
| CSE-S4-05 | Web Technologies | 3 | PC |
| CSE-S4-06 | Quantitative Aptitude | 3 | AE |
| CSE-S4-07 | Minor Project | 3 | PR |

### Semester V (Professional Core)

| Code | Course | Credits | Category |
| --- | --- | --- | --- |
| CSE-S5-01 | Advanced Database Systems and NoSQL | 3 | PC |
| CSE-S5-02 | Cloud-Native Distributed Systems | 3 | PC |
| CSE-S5-03 | Advanced Operating System Internals | 3 | PC |
| CSE-S5-04 | Full-Stack Web Development | 3 | PC |
| CSE-S5-05 | Artificial Intelligence | 4 | PE |
| CSE-S5-06 | Entrepreneurship Development | 3 | OE |
| CSE-S5-07 | Data Analytics Practice | 4 | SEC |

### Semester VI (Professional Core)

| Code | Course | Credits | Category |
| --- | --- | --- | --- |
| CSE-S6-01 | Network Security and Protocols | 2 | PC |
| CSE-S6-02 | Big Data Management and Warehousing | 3 | PC |
| CSE-S6-03 | Real-time and Embedded Operating Systems | 3 | PC |
| CSE-S6-04 | Cloud Computing | 3 | PE |

### Semester VII (Specialization)

| Code | Course | Credits | Category |
| --- | --- | --- | --- |
| CSE-S7-01 | Big Data Analytics | 3 | PE |
| CSE-S7-02 | Computer Vision | 3 | PE |
| CSE-S7-03 | Natural Language Processing | 3 | PE |
| CSE-S7-04 | Sustainable Smart Cities | 3 | OE |
| CSE-S7-05 | Industry Internship | 3 | PR |

### Semester VIII (Capstone)

| Code | Course | Credits | Category |
| --- | --- | --- | --- |
| CSE-S8-01 | Organizational Behavior | 2 | OE |
| CSE-S8-02 | Capstone Project Phase I | 3 | PR |
| CSE-S8-03 | Capstone Project Planning and Design | 2 | PR |
| CSE-S8-04 | Capstone Project Phase II | 3 | PR |

---

## 7. Enforcement Rules (Critical)

1. **If a student is assigned to Semester I, they must only see Semester I courses.**
2. **If a teacher is assigned to Semester I courses, they must only see students and courses in Semester I.**
3. **Teachers can hold assignments across multiple semesters, but only those specific assigned courses are visible.**
4. **Admin always has full access.**

---

## 8. Permissions and Requests (Workflow)

### Teacher Request Flow
1. Teacher requests access to Semester/Course.
2. Admin reviews and approves.
3. System creates TeachingAssignment records.
4. Teacher access updates immediately.

### Student Transfer Flow
1. Admin updates student semester assignment.
2. Old course enrollments closed.
3. New semester courses auto-enrolled.

---

## 9. Implementation Notes

1. Enrollment must be **semester-driven**.  
2. Student dashboards should query only **their semester_id**.  
3. Teacher dashboards should query only **assigned courses/semesters**.  
4. Admin dashboards can query **everything**.  

---

## 10. Recommended UI Enforcement

1. Student Sidebar → only shows courses for assigned semester.  
2. Teacher Sidebar → only shows courses/sections assigned.  
3. Admin can see all semesters and courses for management.  

---

## 11. UI Menu Filtering Rules (Teacher/Student Sidebar)

### Student Sidebar
1. If the student has **zero enrolled courses**, hide course-dependent menu items:
   - Assignments
   - AI Tutor
   - Assessment
   - Progress
2. Always show:
   - Dashboard
   - My Courses (for enrollment)
   - Profile
   - Settings
   - Community

### Teacher Sidebar
1. If the teacher has **zero assigned courses**, hide course-dependent menu items:
   - Courses
   - Students
   - Gradebook
   - Assignments
   - Create Assignment
   - Grading
   - AI Course Creator
   - Resources
   - Analytics
2. Always show:
   - Dashboard
   - Calendar
   - Settings
