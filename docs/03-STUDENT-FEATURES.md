# 03 — Student Features

**Module:** Student Learning Experience
**Version:** 1.0
**Status:** Phase 1 (core) + Phase 2 (enhanced)

---

## Overview

The student experience in Lumina is built around one principle: **every student gets a completely different learning path based on who they are**, while the system remains transparent, safe, and respectful of their effort. Students learn actively — writing, thinking, struggling productively — not passively consuming AI-generated content.

---

## 1. Student Dashboard

### What students see on login

```
WELCOME BACK, RAHUL

Today's plan                              Streak: 12 days 🔥
─────────────────────────────────────────────────────
📖 Physics — Newton's Laws                    [Continue]
   Progress: 65% mastered | Next: Practice problems

📝 Assignment Due: March 20                   [View]
   Chemistry: Atomic Structure — On paper

📅 Scheduled Review: 3 concepts              [Start]
   Spaced repetition due today

🏆 Peer Study Group: 4pm today               [Join]
   With Priya and Aarav

MASTERY OVERVIEW
┌─────────────┬──────────────────────────────────────┐
│ Physics     │ ████████░░░░  65% │ Growing ↑       │
│ Chemistry   │ ██████████░░  82% │ Strong ✓        │
│ Mathematics │ █████░░░░░░░  43% │ Needs work ↓    │
│ Biology     │ ████████████  97% │ Mastered ★       │
└─────────────┴──────────────────────────────────────┘
```

---

## 2. AI Tutor Chat Interface

### How students interact with the AI tutor

The AI tutor is the student's primary learning companion. It uses the teacher-verified Q&A bank and the student's own knowledge profile to personalise every response.

```
AI TUTOR — Physics: Newton's Laws

Rahul: Why does a ball slow down when thrown up?

Tutor: [Thinking about your question...]

        Your teacher is reviewing my answer. While you wait:
        
        Can you guess the answer first? What force do you
        think acts on the ball when it's in the air?
        
        [Write your thinking here...]

        [2 minutes later]

        ✓ Your teacher approved my answer:

        Great question! When you throw a ball upward, gravity
        pulls it down with a force of about 9.8 N for every
        kilogram. Since this force acts opposite to the ball's
        upward motion, it slows the ball down — exactly 9.8 m/s²
        slower each second. When it reaches the top, its speed
        is zero. Then gravity keeps pulling, and it falls back.

        Think of it this way: the ball at the top is like 
        pausing a video — for just an instant, velocity = 0,
        but the force (gravity) never pauses.

        [Was this helpful?] [Ask a follow-up] [Practice a question]
```

### Tutor modes by student state

| Student state | Tutor behaviour |
|--------------|----------------|
| Mastery < 0.4 | Explains concept, uses examples matching student interest |
| Mastery 0.4–0.65 | Guided questions, hints before explanations |
| Mastery 0.65–0.80 | Socratic method — leads student to discover answer |
| Mastery > 0.80 | Teach-back mode — asks student to explain to the tutor |
| Confused/frustrated detected | Switches to simpler language + encouragement |
| Active assignment in progress | Study mode only — helps with concepts, not answers |
| After 3 wrong attempts | Breaks problem into smaller steps |

### Student explanation style preferences

```
MY LEARNING STYLE                                [Update]

I learn best with:
  Story / narrative mode          ██████████  (highest success)
  Real-world examples             █████████   
  Analogies                       ████████    
  Formulae and precision          ████        
  Jokes and humour                ███         
  Poems/rhymes                    ██          

(This is based on 34 sessions of learning data, not a quiz.)
```

The student can manually override the AI's style choice at any time.

---

## 3. Adaptive Question Engine

### How questions are chosen for each student

Every question the student sees is selected based on their current mastery level for the specific concept being tested:

| Mastery level | Question type | Difficulty |
|--------------|---------------|------------|
| < 0.30 | MCQ with elimination hints | Very easy |
| 0.30–0.50 | MCQ + fill in the blank | Easy |
| 0.50–0.65 | Short answer (2–3 sentences) | Medium |
| 0.65–0.80 | Long answer + diagram | Hard |
| > 0.80 | Teach-back / project-based | Challenging |

### Q2 always generated from Q1's answer

The most important mechanism: the AI reads the student's answer to the first question and generates the second question specifically targeting what's missing or wrong.

```
Q1: Define Newton's First Law.
Student answered: "Objects stay in motion forever unless stopped."

→ AI detects: Student missed "at rest" case and "external force" qualifier
→ Q2 generated: "A bicycle is standing still. According to Newton's First 
   Law, what would happen to it if no force is applied? What would change 
   this situation?"
```

---

## 4. Gamification System

### Points and streaks

| Activity | XP earned |
|----------|-----------|
| Complete a lesson | 50 XP |
| Correct answer (first attempt) | 20 XP |
| Correct after 1 wrong attempt | 10 XP |
| Complete physical assignment | 100 XP |
| Help a peer (peer tutoring session) | 75 XP |
| Daily login | 10 XP |
| 7-day streak maintained | 200 XP bonus |
| Concept mastered | 150 XP |

### Leaderboard system

Students compete in **groups of 10 with similar activity levels**, not globally. This prevents demotivation from seeing top students with 10x more XP.

```
YOUR LEAGUE — BRONZE TIER                     This week

  1. Priya K.      ████████████  1,240 XP    ▲ 1
  2. Rahul S.      ████████████  1,180 XP    — (You)
  3. Aarav M.      ███████████   1,090 XP    ▼ 1
  4. Sneha P.      ██████████      980 XP    
  ...

Top 2 advance to Silver Tier next week.
```

### Badge system

Badges are earned for genuine learning milestones, not participation:

| Badge | How to earn |
|-------|------------|
| First Concept Mastered | Master any single concept |
| Deep Thinker | Ask 20 questions in the AI tutor |
| Perfect Paper | Score 100% on a physical assignment |
| Teach the Teacher | Successfully explain a concept in teach-back mode |
| Streak 7 | 7 consecutive days of learning |
| Peer Helper | Complete 5 peer tutoring sessions as a tutor |
| Multi-Language | Ask questions in a regional language |

---

## 5. Spaced Repetition System

### How it works

Every concept a student learns is automatically scheduled for review using the FSRS algorithm. The schedule is based on when the student is most likely to forget:

```
REVIEW SCHEDULE — Today, March 14

Due now (3 concepts):
  ⊙ Newton's First Law        Last seen 7 days ago     [Review now]
  ⊙ Atomic number             Last seen 14 days ago    [Review now]
  ⊙ Photosynthesis equation   Last seen 3 days ago     [Review now]

Coming up this week:
  Tomorrow:    Laws of Motion (3 concepts)
  March 16:    Chemical bonding (5 concepts)
  March 18:    Algebra — quadratics (2 concepts)
```

Students who complete their daily reviews consistently show 25% higher retention on term exams than those who skip reviews.

### Review format

Reviews use the quickest effective format — usually a 10-second question:
```
QUICK REVIEW

What is the SI unit of force?

[I know this well]  [Okay, I remember]  [I forgot]

→ Answer: Newton (N)
```

---

## 6. Assignment Dashboard for Students

### Seeing and managing assignments

```
MY ASSIGNMENTS

Active:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Newton's Laws — Problem Set 1          DUE: 20 Mar
  Physical paper submission              [View Questions]
  Status: Not yet submitted
  
  ⚠ AI tutor is in study-mode for this assignment.
    I can help you understand concepts, not give answers.
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Completed & Returned:
  Atomic Structure — Worksheet 2          Marked: 17/20
  Teacher comment: "Good work on Q1-4. Review Q5."    [View Feedback]
  
  Laws of Motion — MCQ Quiz               Marked: 9/10
  [View Feedback]
```

### After receiving marked assignment back

When the teacher returns a marked physical assignment:

```
ASSIGNMENT RETURNED: Newton's Laws — Problem Set 1

Your score: 14/20

Question-by-question feedback:

Q1 (3/3) ✓ — "Well explained! Clear use of the term 'external force'."
Q2 (2/4) ~ — "Your calculation was right but you forgot to include units.
              Always write m/s² after acceleration values."
              [Teacher's model answer ▼]
              [Review this concept with AI tutor →]

Q3 (0/3) ✗ — "This answer describes momentum, not inertia. These are
              related but different."
              [Teacher's model answer ▼]
              [Review: Inertia vs Momentum →]

What to study next:
  → Units in physics calculations    [Start review]
  → Inertia vs momentum distinction  [Start review]
```

---

## 7. Student Knowledge Graph View

### My learning map

```
MY KNOWLEDGE MAP — Physics

                    ┌─────────────────────┐
                    │     MECHANICS       │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                   │                    │
    ┌─────▼──────┐    ┌───────▼──────┐    ┌───────▼──────┐
    │   Motion   │    │ Newton's Laws│    │  Work &      │
    │   ████ 85% │    │  ████░ 65%  │    │  Energy      │
    └─────┬──────┘    └───────┬──────┘    │  ██░░ 40%   │
          │                   │           └──────────────┘
    ┌─────▼──────┐    ┌───────▼──────┐
    │  Scalars & │    │ Gravitation  │
    │  Vectors   │    │  ░░░░ 10%   │
    │  ██████ 92%│    └──────────────┘
    └────────────┘

Legend: ████ Mastered  ███░ Learning  ██░░ Struggling  ░░░░ Not started
```

Students can click any node to:
- See their mastery history graph
- Start a review session
- See which concepts are prerequisites
- Understand why they need to learn it

---

## 8. Social Learning Features

### Peer study groups

```
MY STUDY GROUPS

Physics Study Group — Class 10B      [4 members]
  Next session: Today, 4:00 PM
  Topic: Newton's Laws revision
  [Join session]  [View notes]  [Chat]

Math Revision Group                   [3 members]
  Next session: Not scheduled
  [Schedule session]  [Chat]

[Join a group]  [Create group]
```

### Peer tutoring (students helping students)

Students with mastery > 0.80 on a concept unlock the option to help peers:

```
PEER TUTOR OPPORTUNITY

You've mastered Newton's First Law (94% mastery).
Aarav M. is struggling with this concept.

Would you like to tutor Aarav? The AI will guide you.

[Yes, I'll help]  [Not now]

---

During the session:
AI quietly suggests to peer tutor:
"Good start! Instead of giving the answer, try asking: 
'What do you think happens to the ball's speed if no force acts on it?'"
```

---

## 9. Student Mental Wellbeing Features

### Stress and overwhelm detection

The system monitors:
- Session duration (unusually long = potential stress)
- Wrong answer streaks (5+ in a row = struggling)
- Login frequency drops (sudden absence = concern)
- Language sentiment in chat messages

When signals fire:

```
HEY RAHUL,

You've been working hard today — 2 hours on Newton's Laws.
Your brain needs a break to consolidate what you've learned.

Take a 10-minute break and come back fresh.

[Take a break — pause all reminders for 15 mins]
[Tell me how you're feeling]
[Talk to someone] ← routes to school counselor contact
```

### Positive reinforcement

```
MILESTONE ACHIEVED!

You just mastered your first concept in 
Mechanics — Newton's First Law!

This concept took you 8 sessions over 3 weeks.
That's real perseverance. Well done, Rahul.

[Share with parent]  [Add to portfolio]  [Continue learning]
```

---

## 10. Offline Learning Mode

When internet is unavailable:

```
OFFLINE MODE — Content cached for 7 days

Available offline:
  ✓ Physics Lessons 1–12
  ✓ Spaced repetition reviews
  ✓ Assignment questions (can write in app, submit when online)
  ✗ AI tutor chat (requires internet for teacher verification)
  ✗ Live peer sessions

[Sync when online] — Last synced: 2 hours ago
```

All offline activity (lesson completion, review responses, practice questions) is stored locally and syncs automatically when connectivity returns.

---

## 11. Student API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/dashboard` | Dashboard data — streak, assignments, KPIs |
| GET | `/api/student/courses` | Enrolled courses list |
| GET | `/api/student/knowledge-graph` | Personal knowledge graph with mastery levels |
| POST | `/api/student/tutor/ask` | Submit question to AI tutor |
| GET | `/api/student/tutor/answer/{question_id}` | Poll for verified answer |
| GET | `/api/student/assignments` | All assignments, statuses |
| POST | `/api/student/assignments/{id}/submit-scan` | Upload photo of handwritten work |
| GET | `/api/student/reviews/due` | Spaced repetition reviews due today |
| POST | `/api/student/reviews/respond` | Submit review response (FSRS update) |
| GET | `/api/student/xp-and-badges` | Gamification data |
| GET | `/api/student/leaderboard` | Tiered leaderboard for student's group |
| GET | `/api/student/study-groups` | Study group memberships |
| POST | `/api/student/peer-tutor/session` | Start peer tutoring session |
