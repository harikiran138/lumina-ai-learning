# Lumina Engineering Architecture

Last updated: 16 April 2026
Status: Canonical architecture reference for runtime design and academic data flow

## 1. Purpose

This document is the single architecture source for:

1. System layers
2. Canonical academic model
3. API ownership boundaries
4. End-to-end data flow (Admin -> Teacher -> Student)

If another top-level note conflicts with this file, this file wins.

## 2. System Architecture

```text
Frontend (Next.js: frontend/web)
        ->
Backend API (FastAPI: backend/app/routers)
        ->
Service Layer (backend/app/services)
        ->
Store Layer (backend/app/store)
        ->
Database (Supabase/PostgreSQL)
```

### Layer responsibilities

1. Frontend layer
- UI only
- Role-aware routing
- No business decisions

2. Router layer
- Request validation
- Auth/role dependency checks
- Delegation to service/store

3. Service layer
- Business rules
- Workflow orchestration
- Cross-domain actions

4. Store layer
- Data access only
- Query composition
- No workflow branching

5. Database layer
- Persistence
- Constraints and indexes
- Canonical relationship enforcement

## 3. Canonical Academic Model

This is the only approved runtime model.

```text
Student
  -> student_enrollments
  -> Class
  -> Course
  -> teacher_assignments
  -> Teacher
```

### Relationship rules

1. A student is scoped by class enrollment.
2. A class maps to a course context.
3. A teacher is authorized by (course_id + class_id) assignment.
4. Student data visibility must resolve through class assignment, not broad course lookup.

## 4. Canonical Tables

Core academic tables:

1. users
2. courses
3. classes
4. student_enrollments
5. teacher_assignments

Supporting academic tables:

1. programs
2. semesters
3. departments
4. batches

## 5. Legacy and deprecation policy

The following are treated as legacy or transitional and must not be used for new feature design:

1. sections (legacy path)
2. enrollments (parallel enrollment model)

Policy:

1. New endpoints must use classes + student_enrollments.
2. Existing endpoints that still use sections or enrollments are migration targets.
3. No new schema additions should extend legacy paths.

## 6. API Ownership Boundaries

### Admin domain

Owns academic setup and governance.

1. Create course
2. Create class linked to course
3. Assign teacher to course + class
4. Manage global academic metadata

### Teacher domain

Owns instruction and supervision for assigned classes only.

1. View assigned classes and courses
2. Manage assignments and grading in assigned contexts
3. Teacher intervention only for linked students

### Student domain

Owns self-only experience.

1. View own class-scoped courses
2. Submit assignments and responses
3. Receive AI assistance in allowed course scope

## 7. End-to-End Data Flow

```text
1) Admin creates Course
        ->
2) Admin creates Class linked to Course
        ->
3) Admin approves Teacher assignment for (Course + Class)
        ->
4) Student is enrolled in Class (student_enrollments)
        ->
5) Student dashboard resolves Class -> Course
        ->
6) Teacher operations resolve Teacher -> (Course + Class)
        ->
7) Student/Teacher interaction remains scoped and auditable
```

## 8. Runtime Mapping (Code)

Primary runtime folders:

1. frontend/web
2. backend/app
3. supabase/migrations
4. vault/01_Core

Current creation and linkage surfaces:

1. Class creation API: backend/app/routers/admin.py
2. Class store write path: backend/app/store/academic_store.py
3. Teacher assignment path: backend/app/store/teacher_store.py
4. Student class enrollment checks: backend/app/store/academic_store.py
5. Class-course hardening migration: supabase/migrations/20260415000001_class_course_relationship_hardening.sql

## 9. Security and Access Rules

1. Student endpoints must resolve current user only.
2. Teacher endpoints must verify teacher-student link via class assignment.
3. Admin endpoints require college admin or higher role checks.
4. Cross-class access is forbidden unless elevated role explicitly allows it.

## 10. Engineering Quality Rules

1. One concept, one model, one source.
2. No duplicated models for the same lifecycle.
3. No business rules in frontend components.
4. No store-level logic that bypasses role scoping.
5. Every new endpoint must map to canonical academic model.

## 11. Migration Backlog (Required for full consistency)

1. Remove or map remaining sections paths to classes.
2. Remove or map remaining enrollments paths to student_enrollments.
3. Audit all student course queries to ensure class-scoped resolution.
4. Audit all teacher actions to ensure teacher_assignments-based authorization.

## 12. Definition of done for architecture

Architecture is considered clean when:

1. All academic flows use classes and student_enrollments.
2. No endpoint relies on duplicate enrollment model.
3. Teacher access checks are class-linked everywhere.
4. Documentation and runtime behavior match exactly.
