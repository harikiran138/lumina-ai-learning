# Lumina Research Foundation

Research checked on 2026-03-08.

This document lists the external references that should shape Lumina’s product and engineering decisions.

## 1. Responsible AI in Education

### U.S. Department of Education

Source:
[Artificial Intelligence and the Future of Teaching and Learning](https://www.ed.gov/sites/ed/files/documents/ai-report/ai-report.pdf)

What it means for Lumina:

- keep humans in the loop
- make AI outputs explainable and overridable
- align AI systems to real teaching and learning goals
- involve educators in the design and rollout of AI features

Product implication:

Lumina should not auto-grade, auto-route, or auto-intervene without confidence scores and clear teacher review paths.

### UNESCO

Source:
[Guidance for generative AI in education and research](https://unesdoc.unesco.org/ark:/48223/pf0000386693)

What it means for Lumina:

- design for human agency, equity, and inclusion
- treat governance and policy as part of the product, not an afterthought
- protect learner data and reduce bias

Product implication:

Lumina needs explicit policy controls, audit logs, transparency, and age-appropriate AI usage rules.

### UNESCO institutional-readiness signal

Source:
[UNESCO survey: Less than 10% of schools and universities have formal guidance on AI](https://www.unesco.org/en/articles/unesco-survey-less-10-schools-and-universities-have-formal-guidance-ai)

What it means for Lumina:

- many institutions are still operationally unprepared for AI
- governance support is a product requirement

Product implication:

Admin tooling should include AI policy templates, approved-model controls, usage logs, and escalation workflows.

## 2. Adaptive Learning and Assessment

### OECD Digital Education Outlook 2023

Sources:

- [OECD Digital Education Outlook 2023](https://www.oecd.org/en/publications/2023/12/oecd-digital-education-outlook-2023_c827b81a.html)
- [Digital teaching and learning resources](https://www.oecd.org/en/publications/oecd-digital-education-outlook-2023_c74f03de-en/full-report/digital-teaching-and-learning-resources_5651654d.html)
- [Digital assessment](https://www.oecd.org/en/publications/oecd-digital-education-outlook-2023_c74f03de-en/full-report/digital-assessment_a102e604.html)

What it means for Lumina:

- adaptive learning systems and intelligent tutoring systems are a meaningful part of modern digital education
- digital assessment still underuses adaptive techniques in many systems
- system-wide design matters more than isolated AI widgets

Product implication:

Lumina should connect tutor, assessment, course content, and teacher insights as one system, not separate modules.

## 3. Knowledge Tracing and Learner Modeling

### Deep Knowledge Tracing

Source:
[Deep Knowledge Tracing](https://arxiv.org/abs/1506.05908)

What it means for Lumina:

- student learning should be modeled as a sequence, not only as isolated scores
- recent history matters for prediction

Product implication:

Assessment, tutor quizzes, and assignment evidence should feed the same sequential learner model.

### Bayesian Knowledge Tracing

Sources:

- [pyBKT: An Accessible Python Library of Bayesian Knowledge Tracing Models](https://arxiv.org/abs/2105.00385)
- [An Introduction to Bayesian Knowledge Tracing with pyBKT](https://www.mdpi.com/2624-8611/5/3/770)

What it means for Lumina:

- interpretable mastery models are still valuable
- concept-level state estimates are useful for teacher-facing explanations

Product implication:

Lumina should keep a concept mastery map that can be shown to teachers and used by the pathway engine.

## 4. Retrieval Practice and Long-Term Retention

### Retrieval practice

Source:
[Retrieval Practice Consistently Benefits Student Learning: a Systematic Review of Applied Research in Schools and Classrooms](https://link.springer.com/article/10.1007/s10648-021-09595-9)

What it means for Lumina:

- low-stakes recall activities should be built into the system
- practice should not only happen at exam time

Product implication:

The tutor, lesson page, and assessment system should generate short retrieval prompts continuously, not only full quizzes.

### Spacing and study design

Source:
[Spaced Practice](https://www.learningscientists.org/spaced-practice)

What it means for Lumina:

- revision needs to be distributed over time
- review timing matters as much as content coverage

Product implication:

Lumina should schedule reviews and reminders based on forgetting risk, not only due dates.

## 5. Product Requirements Derived From Research

Based on the sources above, Lumina should include the following non-negotiable requirements:

1. Human-overridable AI for high-stakes decisions.
2. Concept-level learner modeling, not only course-level progress.
3. Retrieval and spaced review in the student workflow.
4. Explainable teacher recommendations.
5. Governance and audit features at the admin layer.
6. Shared learner state across tutor, assessment, assignments, and recommendations.

## 6. Research-Informed Feature Ideas

The most research-aligned advanced features for Lumina are:

- mastery-based intervention queues
- confidence-aware grading
- concept-linked question generation
- spaced review automation
- teacher-facing explanations for AI recommendations
- subject-constrained tutor modes
