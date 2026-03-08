# Feature Requirements Checklist

Last updated: 2026-03-08

This document is the complete feature checklist for turning Lumina into a full AI LMS.

Use this as a program-level requirements list.

## 1. Student Experience Requirements

### Must-have student foundations

- authentication and role-aware onboarding
- personal dashboard with real progress, not placeholder metrics
- course catalog, enrollment, and lesson progression
- lesson player for text, slides, video, quiz, and downloadable assets
- personal notes and study history
- progress timeline and mastery history
- settings and profile preferences

### Must-have personalized learning features

- learner profile per student
- concept-level mastery map
- weak-topic detection
- recommendation engine for next lesson, next quiz, next practice
- spaced review reminders
- personalized revision queue
- low-confidence topic review
- student patience and study-behavior profiling

### Must-have student AI features

- AI tutor available inside lessons and course pages
- subject-specialized tutor modes
- tutor memory across sessions
- lesson-aware tutor context
- assignment-aware tutor context
- assessment-aware tutor context
- hint generation
- practice question generation
- flashcard generation
- explanation reformatting by difficulty level

## 2. Teacher Experience Requirements

### Must-have teaching workflows

- create and manage courses
- create and manage modules and lessons
- create assignments and rubrics
- create assessments and question banks
- publish and update learning resources
- invite and manage students

### Must-have teacher intelligence

- class dashboard
- student-by-student progress drilldown
- risk queue
- misconception summaries
- intervention recommendations
- teacher approval for AI-generated actions
- confidence labels on AI outputs
- weekly teacher digest
- suggested regrouping or support clusters

### Must-have teacher productivity features

- AI course generator
- AI assignment generator
- AI rubric draft generator
- AI PPT generator
- AI remediation-plan generator
- AI feedback draft generator
- AI lesson-summary generator

## 3. Assessment Requirements

### Must-have assessment engine

- start, continue, complete assessment session
- difficulty adaptation
- concept-linked question metadata
- concept mastery update after each answer
- time-aware response logging
- weakness detection
- report generation
- mastery API for student and teacher views

### Must-have advanced assessment features

- Bloom-level tagging
- diagnostic pre-tests
- review quizzes
- adaptive practice sessions
- low-stakes retrieval practice mode
- confidence-based questioning
- misconception classification
- mastery threshold definitions

## 4. Assignment And Scoring Requirements

### Must-have assignment workflows

- assignment creation
- file submission
- status tracking
- grading queue
- report view
- teacher override

### Must-have scoring features

- rubric-aware scoring
- criterion-level score breakdown
- confidence score
- explanation or evidence for score
- OCR/text extraction quality checks
- manual review fallback
- resubmission handling
- remediation suggestions from poor performance

## 5. Learner Profile Requirements

### Must-have profile fields

- identity and role metadata
- goals
- course enrollments
- concept mastery map
- weak topics
- recent mistakes
- study behavior patterns
- engagement trend
- frustration or struggle signals
- preferred learning modality
- preferred difficulty band
- recent tutor interactions
- assignment performance history

### Must-have profile behaviors

- update profile after quiz
- update profile after assessment
- update profile after assignment
- update profile after tutor session
- update profile after lesson completion
- update profile after inactivity or drop in engagement

## 6. AI Tutor Requirements

### Must-have tutor base capabilities

- answer questions with course context
- answer with learner profile context
- refuse unsafe content
- maintain session memory
- avoid repeated questions when asked to generate practice
- explain using different levels of detail
- create short assessments from current lesson

### Must-have specialization

- math tutor
- science tutor
- coding tutor
- writing tutor
- language tutor
- exam-prep tutor

### Must-have tutor actions

- explain
- quiz
- hint
- summarize
- convert notes to flashcards
- create study plan
- create review deck
- suggest next practice

## 7. Automation Requirements

### Must-have academic automations

- weekly class summary for teacher
- weekly student learning summary
- post-assessment remediation generation
- post-assignment feedback packet generation
- PPT generation for a lesson or course
- student risk alert creation
- inactivity intervention reminders
- mastery snapshot generation

## 8. Admin And Governance Requirements

### Must-have admin controls

- user management
- role management
- platform health view
- AI usage logs
- AI action audit trail
- content moderation visibility
- model/provider configuration
- feature flagging

### Must-have governance

- teacher review for high-stakes AI outputs
- confidence labels
- policy notes on AI-generated content
- auditability for grades and recommendations
- exportable logs
- privacy controls
- institution-level settings

## 9. Data And Platform Requirements

### Must-have platform foundations

- reliable persistence for all learner state
- event logging
- metrics and monitoring
- health checks
- background jobs
- upload and artifact storage
- caching
- API auth and rate limiting

### Must-have data model quality

- one learner profile source of truth
- consistent course schema
- consistent assignment and rubric schema
- concept ids shared across assessment and pathway systems
- teacher-facing analytics generated from real learner data

## 10. Product Readiness Gates

Lumina should not be considered a full AI LMS until these gates are true:

- learner profile is unified
- teacher intervention queue is live
- assessments write concept-level mastery
- assignments produce rubric and confidence outputs
- tutor specialization is active
- automation layer is active
- governance and auditability are visible
