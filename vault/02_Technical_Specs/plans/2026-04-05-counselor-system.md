# Counselor System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-grade Counselor system with zero-trust privacy, anonymized risk signals, and fail-safe human-first crisis intervention.

**Architecture:** Client-side encryption (AES-256-GCM) ensures sensitive data never reaches the server in plaintext. Anonymized views minimize data exposure by default, requiring audited "Reveal" actions for identification.

**Tech Stack:** FastAPI (Backend), Next.js/React (Frontend), PostgreSQL (Database), Web Crypto API (Client-side Encryption).

---

### Task 1: Database Schema Update

**Files:**
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/migrations/20260405_counselor_system.sql`
- Update: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/FINAL_DATABASE_SCHEMA.sql` (append)

**Step 1: Define counselor-specific tables**
- `counselor_notes`: encrypted_blob, iv, auth_tag.
- `risk_reveal_logs`: counselor_id, student_id, reason, revealed_at.
- `follow_up_tasks`: status, acknowledged_at, due_at, student_id, counselor_id.
- `risk_alerts`: student_id, signal_type, severity, suppression_status, suppression_expiry.

**Step 2: Commit schema changes**

---

### Task 2: Backend Models and Schemas

**Files:**
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/models/counselor.py`
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/api/schemas/counselor.py`

**Step 1: Implement Pydantic models for encrypted notes and logs**
- `EncodedNote`: blob, iv, auth_tag.
- `RevealRequest`: student_id, reason.

---

### Task 3: Anonymized Risk Alert API

**Files:**
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/api/endpoints/counselor.py`
- Modify: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/main.py` (mount router)

**Step 1: GET /risk-alerts**
- Return list of alerts with student name replaced by "Anonymized Student [ID_SUFFIX]".
- Filter by non-suppressed or currently active suppression.

**Step 2: POST /risk-alerts/{alert_id}/reveal**
- Validate reason.
- Log action in `risk_reveal_logs`.
- Return student identification (full name).

---

### Task 4: Client-Side Encryption Logic (AES-256-GCM)

**Files:**
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/frontend/lib/encryption.ts`

**Step 1: Implement key derivation (PBKDF2/Argon2)**
- Key derived from counselor credentials/secret.

**Step 2: Implement encrypt/decrypt using Web Crypto API**
- AES-256-GCM mode.

---

### Task 5: Counselor Dashboard UI (Anonymized View)

**Files:**
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/frontend/components/counselor/Dashboard.tsx`
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/frontend/components/counselor/RiskAlertList.tsx`

**Step 1: Build the risk list with "Reveal Identity" flow**
- Show risk signal and severity.
- Button to reveal identity with reason prompt.

---

### Task 6: Encrypted Notes Editor

**Files:**
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/frontend/components/counselor/NotesEditor.tsx`

**Step 1: Integrate encryption with editor**
- Encrypt on save.
- Decrypt on load (requires persistent key in session/memory).

---

### Task 7: Escalation and Follow-up Logic

**Files:**
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/tasks/escalation.py` (background job or cron)

**Step 1: Check for missed follow-ups**
- T+0 -> reminder.
- T+24h -> escalate to admin (email/notification).

---

### Task 8: E2E Integration and Testing

**Files:**
- Create: `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/tests/test_counselor_system.py`

**Step 1: Test encryption E2E**
- Verify server gets ciphertext.
- Verify reveal log entry is created.
- Verify suppression expiry logic.

---

**Plan complete and saved to `docs/plans/2026-04-05-counselor-system.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
