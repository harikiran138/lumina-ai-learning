# Behavioral & Learning Patterns Dictionary

This document defines 50+ distinct behavioral and learning patterns that the **Pathway Agent** can detect and respond to. These patterns are derived from user interaction data, performance metrics, and temporal habits.

## 1. Engagement & Attention Patterns (1-10)

| ID | Pattern Name | Signal Description | Agent Reaction |
|----|--------------|--------------------|----------------|
| **BP01** | **The Flow State** | High accuracy (>90%), fast response times (<2s above avg), sustained session (>15m). | **Sustain**: Do not interrupt. Suppress non-critical notifications. Slightly increase difficulty to maintain challenge. |
| **BP02** | **The Boredom Loop** | High accuracy, extremely fast response times, erratic clicking or "toy" interaction. | **Advance**: Immediate difficulty spike or topic switch. "You're crushing this, let's try something harder." |
| **BP03** | **The Frustration Spiral** | Rapid decline in accuracy, increased click force (if detectable), rage clicks, shorter time between wrong answers. | **Intervene**: Suggest a "Rest" or "Review" of a simpler concept. Offer a hint. |
| **BP04** | **The Zoning Out** | Long dwell times on simple screens, no mouse movement, followed by wrong answer or timeout. | **Re-engage**: Interactive prompt ("Still with us?"). Switch to active learning (quiz) from passive (reading). |
| **BP05** | **The Micro-Learner** | Consistently short sessions (<5 mins) but high frequency (5+ times/day). | **Adapt**: Break content into "bite-sized" atomic units. Prioritize quick wins. |
| **BP06** | **The Marathoner** | Rare logins but extremely long duration sessions (>2 hours). | **Pace**: Enforce breaks to prevent cognitive overload. Suggest summary milestones. |
| **BP07** | **The Scanner** | Rapidly scrolls through content, low dwell time on text, jumps to questions immediately. | **Summarize**: Provide high-level summaries/bullet points. Focus on active testing. |
| **BP08** | **The Deep Diver** | Expands every "Learn More" accordion, clicks all reference links, high dwell time on diagrams. | **Enrich**: Offer bonus material, "Deep Dive" side quests, and primary source links. |
| **BP09** | **The Streak Protector** | Logs in only to do the minimum required to keep a streak alive, then leaves. | **Challenge**: "Streak froze? Double XP for one more lesson." Push gently for slightly more. |
| **BP10** | **The Weekend Warrior** | Zero activity Mon-Fri, massive activity Sat-Sun. | **Schedule**: Send "Prep for Weekend" digests on Friday. Assign larger project work for weekends. |

## 2. Cognitive & Learning Styles (11-20)

| ID | Pattern Name | Signal Description | Agent Reaction |
|----|--------------|--------------------|----------------|
| **BP11** | **Visual Learner** | Higher retention/engagement with video/diagrams vs. text blocks. | **Format**: Prioritize infographics and video explanations over long text. |
| **BP12** | **Textual Learner** | Skips videos, reads transcripts, high performance on text-heavy questions. | **Format**: Provide transcripts by default. Focus on detailed written explanations. |
| **BP13** | **Example-First Learner** | Jumps straight to examples/code snippets before reading theory. | **Structure**: Show "Worked Example" first, then explain the theory ("Inductive Learning"). |
| **BP14** | **Theory-First Learner** | Reads all theory sections thoroughly before attempting any practice. | **Structure**: Ensure solid theoretical grounding before unlocking practice mode. |
| **BP15** | **The Tinkerer** | Interacts heavily with simulations/sandboxes, trial-and-error approach to quizzes. | **Enable**: Unlock "Sandbox Mode" early. Encourage experimentation. |
| **BP16** | **The Serialist** | Follows the curriculum strictly linearly, never skips, gets anxious if order is disrupted. | **Guide**: Provide clear, linear progress bars. avoid "random" recommendations. |
| **BP17** | **The Holist** | Jumps around topics effectively, building a "big picture" web of knowledge. | **Map**: Show the "Knowledge Graph". Suggest connections between disparate topics. |
| **BP18** | **The Crammer** | Massive activity spike before deadlines (if applicable) or self-set goals. | **Support**: "High Yield" summaries. Focus on highest-value concepts rapidly. |
| **BP19** | **The Slow Burner** | Slow, steady progress. Never rushes, consistent pace, moderate chunks. | **Affirm**: "Consistency is key." Validate this sustainable pace. |
| **BP20** | **The Reflector** | Long pauses after feedback (correct or incorrect) before moving to next item. | **Space**: Don't auto-advance instantly. Allow time for "Cognitive Digest". |

## 3. Performance & Confidence Patterns (21-30)

| ID | Pattern Name | Signal Description | Agent Reaction |
|----|--------------|--------------------|----------------|
| **BP21** | **The Lucky Guesser** | Correct answers but extremely fast time (unrealistic reading time). | **Verify**: "Double Check" prompt. "Explain why you chose that?" |
| **BP22** | **The Second-Guesser** | Selects correct answer, unselects, selects wrong answer. | **Confidence**: "Trust your gut." Highlight initial instinct accuracy stats. |
| **BP23** | **The Perfectionist** | Retries modules immediately if score is <100%. Obsessed with "Gold Stars". | **Relax**: Emphasize "Growth Mindset". "Mistakes are learning opportunities." |
| **BP24** | **The Quitter** | Abandons session immediately after 1-2 wrong answers. | **Scaffold**: "Failure Recovery" mode. Give an easy win immediately after a failure. |
| **BP25** | **The Overconfident** | High self-reported confidence, low actual accuracy. | **Calibrate**: Show peer comparison. "Most people find this tricky." Reality check. |
| **BP26** | **The Underconfident** | Low self-reported confidence, high actual accuracy (Impostor Syndrome). | **Boost**: "You know this!" explicit validation of mastery. |
| **BP27** | **The Cliff Hanger** | Performs well until a specific difficulty threshold, then crashes hard. | **Bridge**: Detect the "Cliff". Insert stepping-stone bridge content. |
| **BP28** | **The Plateau-er** | Stuck at same mastery level for long period despite practice. | **Pivot**: Change teaching method completely (e.g., switch from text to video). |
| **BP29** | **The Rusty Pro** | High mastery historically, but low performance on recent re-entry. | **Refresh**: "Quick Refresher" course rather than full re-teaching. |
| **BP30** | **The Master** | consistently >98% accuracy, high speed. | **Fast-Track**: Offer "Test Out" options. "Skip to Advanced?" |

## 4. Social & Emotional Patterns (31-40)

| ID | Pattern Name | Signal Description | Agent Reaction |
|----|--------------|--------------------|----------------|
| **BP31** | **The Competitor** | Checks leaderboard constantly, motivated by rank changes. | **Gamify**: Show "You passed 500 users!" messages. Emphasize rank. |
| **BP32** | **The Lone Wolf** | Opts out of social features, ignores comparisons. | **Personalize**: Focus on "Self-Improvement" stats (vs. past self) only. |
| **BP33** | **The Helper** | (If forum exists) Answers others' questions, high engagement in community. | **Empower**: "Teach to Learn". Suggest explaining concepts to the AI. |
| **BP34** | **The Complainer** | Frequent negative feedback flags, "This is unclear". | **Listen**: Acknowledge frustration. Route to specific "Clarification" flows. |
| **BP35** | **The Validator** | Seeks reassurance, checks "Am I on track?" frequently. | **Reassure**: Visual progress maps. "You are here, doing great." |
| **BP36** | **The Late Bloomer** | Struggles initially with new concepts, then rapid mastery (Hockey Stick). | **Patience**: Suppress early failure warnings. Give time to click. |
| **BP37** | **The Early Peaker** | Gets it immediately but forgets quickly (low long-term retention). | **Retain**: Aggressive Spaced Repetition scheduling. |
| **BP38** | **The Anxiety Looper** | Freezes on "Test" modes vs. "Practice" modes. | **De-escalate**: Rename "Test" to "Check-in". Reduce timer visibility. |
| **BP39** | **The Reward Seeker** | Motivation correlates 1:1 with badges/unlocks. | **Incentivize**: Clear "Next Reward" visibility. Micro-rewards. |
| **BP40** | **The Purist** | Dislikes "Gamification", prefers clean, raw information. | **Simplify**: "Zen Mode". Strip away points/badges UI. |

## 5. Temporal & Environmental Patterns (41-50+)

| ID | Pattern Name | Signal Description | Agent Reaction |
|----|--------------|--------------------|----------------|
| **BP41** | **The Night Owl** | Peak performance 11 PM - 4 AM. | **Schedule**: Send notifications at night. Don't ping at 9 AM. |
| **BP42** | **The Early Bird** | Peak performance 5 AM - 8 AM. | **Schedule**: "Morning Coffee" digest. |
| **BP43** | **The Commuter** | Regular mobile usage, short bursts, specific times (8am/5pm). | **Format**: Audio-only or one-thumb interaction mode. |
| **BP44** | **The Lunch Breaker** | Consistent 12-1pm activity. | **Size**: Ensure lessons fit in 20 min slots. |
| **BP45** | **The Exam Season** | Seasonal spike in activity (e.g., Finals, Cert renewal). | **Focus**: Exam-prep specific mode. "High Yield" topics. |
| **BP46** | **The Deterministic** | Logs in exactly at the same time every day. | **Routine**: Build habit stack. "It's 2 PM, time for Study." |
| **BP47** | **The Erratic** | Completely random usage patterns. | **Trigger**: Opportunity-based notifications. "Got 5 mins?" |
| **BP48** | **The Multitasker** | Frequent tab switching, background status. | **Focus**: "Focus Mode" prompt. Timer challenges to hold attention. |
| **BP49** | **The Mobile-First** | 100% usage on mobile device. | **Optimize**: Mobile-native UI. No complex typing/coding tasks. |
| **BP50** | **The Desktop-First** | 100% usage on large screen. | **Expand**: richer dashboards, multi-column views. |
| **BP51** | **The Cross-Platform** | Starts on mobile, finishes on desktop. | **Sync**: "Continue where you left off" handoff is critical. |

