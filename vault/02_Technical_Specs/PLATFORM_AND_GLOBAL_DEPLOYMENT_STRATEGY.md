# Platform And Global Deployment Strategy

Last updated: 2026-03-14

## Purpose

This document defines the system-level recommendations that support Lumina's long-term product strategy.

It connects:

- model architecture
- retrieval architecture
- privacy architecture
- global deployment constraints

## 1. Algorithm Stack Direction

Lumina already has strong foundations in BKT, DKT, pathway logic, and adaptive tutoring.

The recommended next-step architecture is:

1. BKT for cold start and lightweight concept updates
2. attention-based DKT or AKT-style sequence modeling for richer student-state prediction
3. knowledge graph and GNN augmentation for prerequisite structure
4. graph-constrained RL or PPO for pathway optimization

## BKT Direction

Recommended role for BKT:

- low-data cold start
- interpretable concept mastery updates
- fallback when richer models lack evidence

Recommended upgrade:

- incorporate forgetting-aware variants where appropriate

## DKT Direction

Recommended role for DKT-family models:

- predict near-term concept success
- estimate readiness for next difficulty or concept
- improve sequencing beyond binary mastery

Recommended direction:

- move from plain LSTM-only framing toward attention-based variants that can better use sequence context

## Knowledge Graph And GNN Direction

The knowledge graph should be a first-class system asset.

It should capture:

- prerequisite edges
- similarity edges
- curriculum structure
- resource-to-concept mapping
- assessment-to-concept mapping

Recommended use:

- graph-aware retrieval
- concept neighborhood reasoning
- spaced repetition scheduling
- structured candidate generation for pathway decisions

## RL Or PPO Direction

The current repo should describe RL as a target-state optimization layer, not as the fully live production engine.

Recommended direction:

- constrain the action space using the knowledge graph
- use heuristic and graph-based candidate generation first
- let RL refine ordering and next-best-action choice within safe bounds

## 2. RAG Stack Direction

The tutoring and generation systems should move toward a more educationally trustworthy RAG stack.

Recommended components:

- vector search
- keyword search
- knowledge-graph retrieval
- curriculum-aware chunking
- confidence scoring
- explicit source attribution

## Recommended Retrieval Pattern

Use hybrid retrieval instead of single-method retrieval:

```text
vector search + keyword search + concept-graph lookup -> rerank -> answer with attribution
```

## Curriculum-Aware Chunking

Chunking should respect:

- lesson boundaries
- concept boundaries
- worked-example boundaries
- rubric or standard boundaries

Avoid arbitrary token slicing when it breaks pedagogy.

## Confidence And Abstention

If retrieval confidence is low, the system should:

- say it is unsure
- ask a clarification question
- route to teacher review when needed

It should not confidently invent unsupported instructional claims.

## 3. Model Routing Strategy

Lumina should support a tiered model strategy rather than one model for every task.

## Suggested tiers

| Tier | Best for | Example direction |
| --- | --- | --- |
| local or on-device small model | routine prompts, offline assistance, privacy-sensitive preprocessing | compact on-device models |
| efficient cloud model | high-volume tutoring and simple generation | low-cost cloud inference |
| flagship reasoning model | complex Socratic tutoring, assessment drafting, difficult content generation | premium reasoning model |

Design rule:

- route by task complexity, privacy need, and cost budget

## 4. Privacy-First Architecture

Lumina's strongest platform promise should be trustworthy personalization.

## Required rules

- data minimization by design
- role-based access controls
- purpose limitation
- explicit audit logging for high-impact AI actions
- privacy-preserving research exports
- default separation of identifiable student data from aggregate analytics

## Recommended privacy techniques

- on-device preprocessing for sensitive behavioral signals where possible
- differential privacy for aggregate reporting and research access
- federated learning for cross-institution model improvement when mature enough
- synthetic or de-identified datasets for experimentation where feasible

## 5. Offline-First And Low-Bandwidth Delivery

Offline-first behavior is not an optimization for some markets. It is a core product requirement.

Lumina should support:

- cached lessons
- local progress queueing
- background sync when connectivity returns
- small payload budgets
- degraded tutor behavior when cloud access fails

Recommended content heuristics:

- text-first when bandwidth is weak
- compact audio where useful
- short modular lessons instead of only long sessions

## 6. Multilingual And Voice-First Support

Lumina should support multilingual learning both in UI and in tutor behavior.

Recommended priorities:

- multilingual interface strings
- multilingual tutor prompts and outputs
- translation and transliteration support
- speech-to-text and text-to-speech
- handwriting and OCR workflows that respect local-language text

India-focused opportunity:

- integrate open multilingual stacks where possible
- design for code-switching and language confidence fallbacks

## 7. India And Global South Deployment

Recommended strategic priorities:

- mobile-first and low-bandwidth design
- multilingual support from day one
- competitive exam pathways where appropriate
- standards and curriculum interoperability
- optional integration path for Indian public digital education infrastructure

## Competitive Exam Support

Lumina is well-suited for:

- weakness-driven remediation
- mock test analytics
- rank or readiness indicators
- targeted doubt-solving
- spaced revision

## Interoperability Direction

The platform should plan for:

- curriculum standards mapping
- institution export and audit needs
- optional NDEAR or Sunbird-style interoperability when targeting public-sector adoption

## 8. Experimentation And Evaluation

Lumina should treat experimentation as a product capability, not a side analytics project.

Recommended capabilities:

- A or B testing for pedagogy and sequencing
- treatment effect analysis
- explanation policy comparisons
- risk-model evaluation with reason codes
- offline replay harnesses over recorded traces

## Definition Of Done

This platform strategy is materially in place when:

- the knowledge graph is part of learner and content intelligence
- the RAG stack is hybrid, attributed, and confidence-aware
- privacy controls are enforceable and auditable
- offline and multilingual delivery work as first-class product behaviors
- evaluation and experimentation can guide model and policy changes safely

## Companion Docs

- `docs/WORLD_CLASS_AI_LMS_STRATEGY.md`
- `docs/VISION_ALIGNMENT_AUDIT.md`
- `docs/STUDENT_INTELLIGENCE_LOOP.md`
- `docs/FEATURE_REQUIREMENTS_CHECKLIST.md`
- `docs/DELIVERY_ROADMAP_AND_PHASES.md`
- `docs/AGENT_BUILD_BACKLOG.md`
