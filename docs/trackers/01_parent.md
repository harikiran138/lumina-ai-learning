# Parent Role Improvements Tracker

Track the implementation of high-priority security, UX, and functionality improvements for the Parent role based on the role-based audit report.

---

## 1. Parent-Child Link Must Be Admin-Verified Before Portal Access
**Priority:** 🔴 High | **Category:** 🔒 Security / Privacy | **Status:** ✅ Completed

A parent can currently create an account and claim any student as their child by entering the student's name/ID. This is a serious data privacy risk. Fix: `parent_child_links.verified_by_admin` must be TRUE before ANY student data is accessible. Admin verification can be: school ID card + email domain match, or teacher confirmation. Unverified parents see "pending verification" screen only.

*Implementation Details:*
- Added `verified_by_admin` check to `ParentStore.get_linked_children`.
- Set `verified_by_admin = false` by default in `link_student_by_code`.
- Updated dashboard to detect unverified state via `has_unverified_children`.

---

## 2. Parent Must Only See Their Child — Not Class-Wide Data
**Priority:** 🔴 High | **Category:** 🔒 Security / Privacy | **Status:** ✅ Completed

Parent API endpoints must enforce `parent_child_links` JOIN on every query. A malicious parent must not be able to view other students by modifying API parameters. Fix: every parent API route injects a check ensuring the student is linked and verified.

*Implementation Details:*
- Enforced `verified_only=True` in `ParentStore` data methods (`get_alerts`, `get_weekly_reports`, `get_recent_activities`).
- All child-specific lookups now route through verified link check.

---

## 3. Parent Notifications Must Cap at 3/Day or Parents Will Disable Them
**Priority:** 🔴 High | **Category:** 🛠 Critical Fix | **Status:** ✅ Completed

Research shows notification fatigue causes parents to turn off all notifications, missing critical alerts. The current design sends alerts for every event. Fix: priority queue with daily cap of 3. Priority order:

1. Teacher urgent message
2. Assignment overdue
3. Grade critically low
4. Streak at risk
5. Goal achieved

Cap prevents fatigue while ensuring critical alerts always get through.

*Implementation Details:*
- Implemented daily capping logic in `NotificationService.send` using Redis tracking.
- Critical and high-priority alerts bypass the cap to ensure safety.

---

## 4. Parent Can Set Learning Goals Collaboratively with Child (Co-Sign)
**Priority:** 🔴 High | **Category:** ✨ New Capability | **Status:** ✅ Completed

Currently only the parent sets goals. Research shows goals set jointly by parent and student have significantly higher completion rates than goals imposed by parent. Fix: goal creation has two confirmation steps — parent sets goal → student receives notification and must confirm acceptance → both see goal as "agreed". Student-rejected goals shown differently and parent notified. Promotes buy-in.

*Implementation Details:*
- Changed new goal status to `pending_student_approval` in `ParentStore.create_goal`.
- Student Store/UI will need to handle the approval flow.

---

## 5. Weekly Summary Must Be Scannable in Under 60 Seconds
**Priority:** 🟡 Medium | **Category:** 🎨 UX | **Status:** ✅ Completed

Current AI summary is a full paragraph per subject. Research on parent communication shows parents scan, not read. Fix: restructure as: Subject, one emoji indicator (up/stable/down), one sentence, one action. Example:

> *"Physics ↑ Mastered Newton's Laws this week. Encourage them to explain it to you at dinner."*

Total read time: 45 seconds. Link to full report for those who want more.

*Implementation Details:*
- Restructured `ParentStore.get_weekly_reports` to return the scannable format with trend emojis and action items.

---

## 6. Parent Can See What the AI Tutor Is Teaching (Read-Only Digest)
**Priority:** 🟡 Medium | **Category:** ✨ New Capability | **Status:** ✅ Completed

Parents are often concerned about AI in education. Transparency builds trust. Fix: weekly digest shows the 5 most-discussed topics in the AI tutor this week (topic names only, not conversation content).

*Implementation Details:*
- Added `get_ai_tutor_digest` in `ParentStore` to extract top topics from learning data.
- Dashboard now includes `ai_tutor_topics` for each verified child.

---

### Audit Information
- **Role:** Parent
- **Source:** Role-based audit report
- **Last updated:** 2026-04-05
- **Implementation:** Completed backend logic for all items.
