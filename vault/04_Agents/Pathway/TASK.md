# 🧭 Lumina – Pathway Agent

## `TASK.md` — Detailed Build Plan

---

## 🎯 Objective

Build the **Pathway Agent**, the central decision-making intelligence of Lumina, responsible for **continuously selecting the learner’s next best action** (continue, review, advance, rest) by optimizing **learning efficiency, engagement, and retention** using shared context and policy optimization.

---

## 📌 Scope

This task covers:

* Agent responsibilities and boundaries
* Input/output contracts
* Decision logic
* Reinforcement learning policy
* Optimization strategy
* Integration with other agents
* Explainability and auditability

This task **does not** include:

* Content generation
* Assessment logic
* UI implementation

---

## 🧩 Phase 0: Conceptual Foundations

### Task 0.1 – Define Decision Authority

* [x] Document that the agent decides **actions**, not content
* [x] Enumerate allowed actions:

  * Continue
  * Review
  * Advance
  * Rest
* [x] Explicitly forbid content generation and grading

**Output:**
`docs/pathway-agent/decision-authority.md`

---

### Task 0.2 – Define Optimization Objective

* [x] Define learning efficiency
* [x] Define engagement
* [x] Define retention
* [x] Define trade-offs between them

**Output:**
`docs/pathway-agent/objectives.md`

---

## 🧠 Phase 1: MCP Interface & Contracts

### Task 1.1 – MCP Input Schema (Pathway Context)

Define all data the Pathway Agent consumes.

* [x] Mastery state (per concept)
* [x] Confidence & stability
* [x] Engagement metrics
* [x] Cognitive load
* [x] Time-of-day
* [x] Recent performance
* [x] Constraints (time left, energy)

**Output:**
`schemas/mcp/pathway_input.schema.json`

---

### Task 1.2 – MCP Output Schema (Decision)

Define the decision output structure.

* [x] Next action
* [x] Target concept
* [x] Priority
* [x] Reasoning summary

**Output:**
`schemas/mcp/pathway_output.schema.json`

---

### Task 1.3 – Agent Boundary Contract

* [x] What the agent can request
* [x] What it cannot override
* [x] Enforcement rules

**Output:**
`docs/pathway-agent/boundaries.md`

---

## 📊 Phase 2: State Representation

### Task 2.1 – Define State Space

The agent’s internal state must include:

* [x] Mastery confidence
* [x] Mastery stability
* [x] Engagement level
* [x] Cognitive load
* [x] Fatigue
* [x] Session progress
* [x] Historical actions

**Output:**
`pathway/state_definition.md`

---

### Task 2.2 – State Normalization

* [x] Normalize all signals to comparable ranges
* [x] Handle missing or delayed signals
* [x] Define default fallbacks

**Output:**
`pathway/state_normalization.md`

---

## 🔁 Phase 3: Action Space & Transitions

### Task 3.1 – Define Action Space

* [x] Continue
* [x] Review
* [x] Advance
* [x] Rest

For each action:

* [x] Preconditions
* [x] Expected outcomes
* [x] Risk factors

**Output:**
`pathway/action_space.md`

---

### Task 3.2 – Transition Modeling

* [x] Estimate likely outcome of each action
* [x] Define short-term vs long-term effects
* [x] Link transitions to reward function

**Output:**
`pathway/transition_model.md`

---

## 🤖 Phase 4: Reinforcement Learning Policy

### Task 4.1 – Learning Environment Definition

* [x] Simulated learner states
* [x] Action → outcome mapping
* [x] Episode termination conditions

**Output:**
`rl/learning_environment.md`

---

### Task 4.2 – Reward Function Design

Reward must balance:

* [x] Learning efficiency
* [x] Engagement
* [x] Retention
* [x] Fatigue
* [x] Over-review
* [x] Premature advancement

**Output:**
`rl/reward_function.md`

---

### Task 4.3 – Policy Optimization

* [x] Choose PPO as baseline
* [x] Define observation space
* [x] Define action probabilities
* [x] Train on simulated learners

**Output:**
`rl/pathway_policy.md`

---

## ⚛️ Phase 5: Curriculum Optimization (Offline)

### Task 5.1 – Curriculum Graph Construction

* [x] Concepts as nodes
* [x] Prerequisites as edges
* [x] Difficulty weighting

**Output:**
`optimization/curriculum_graph.md`

---

### Task 5.2 – Quantum-Inspired Optimization

* [x] Use simulated annealing
* [x] Generate near-optimal paths
* [x] Store candidate sequences

**Output:**
`optimization/path_candidates.md`

---

### Task 5.3 – Runtime Adaptation Strategy

* [x] Use optimized paths as priors
* [x] Allow deviations in real time
* [x] Track divergence reasons

**Output:**
`optimization/runtime_adaptation.md`

---

## 🔄 Phase 6: Agent Orchestration Logic

### Task 6.1 – Decision Loop

* [x] Receive MCP context
* [x] Build internal state
* [x] Evaluate actions
* [x] Select next action
* [x] Emit MCP output

**Output:**
`agents/pathway_agent.md`

---

### Task 6.2 – Uncertainty Handling

* [x] Low confidence → review
* [x] High fatigue → rest
* [x] Stable mastery → advance

**Output:**
`agents/pathway_uncertainty.md`

---

## 🔍 Phase 7: Explainability & Audit

### Task 7.1 – Decision Trace Logging

Log for every decision:

* [x] State snapshot
* [x] Chosen action
* [x] Top alternative actions
* [x] Reward estimate

**Output:**
`logs/pathway_decisions.log`

---

### Task 7.2 – Explainability Interface

* [x] Human-readable reasoning
* [x] Agent-level explanation
* [x] Debug view for admins

**Output:**
`api/explain/pathway.md`

---

## 🧪 Phase 8: Testing & Validation

### Task 8.1 – Simulation Tests

* [x] Fast learner
* [x] Struggling learner
* [x] Fatigued learner
* [x] Inconsistent learner

---

### Task 8.2 – Safety Tests

* [x] Prevent infinite loops
* [x] Prevent over-advancement
* [x] Prevent assessment abuse

---

## 🔗 Phase 9: Integration

### Task 9.1 – Assessment Agent Integration

* [x] Consume mastery diagnostics
* [x] Request assessments conditionally

---

### Task 9.2 – Tutor & Content Integration

* [x] Pass target concept
* [x] Pass pacing signal
* [x] Pass explanation depth hint

---

## 📦 Final Deliverables

* [x] Pathway Agent service
* [x] MCP schemas
* [x] RL policy
* [x] Curriculum optimizer
* [x] Explainability logs
* [x] Documentation

---

## 🧠 Final Engineering Definition

> **The Pathway Agent is Lumina’s policy engine that continuously selects the learner’s next best action by optimizing long-term mastery, engagement, and retention using shared context and reinforcement learning.**
