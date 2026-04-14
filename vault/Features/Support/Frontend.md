# Support Ecosystem: Frontend Implementation

The Support interfaces are designed for **Collaboration**, providing a non-technical, high-impact view of the student's academic and emotional wellbeing.

## 👪 Parent Portal
Located in `frontend/web/src/app/(parent)/`. This portal focuses on clarity and motivation.

### Key Views
- **Multi-Child Dashboard**: `(parent)/dashboard/` - A unified switchboard for parents with multiple children enrolled in the system.
- **Progress Tracker**: `(parent)/progress/` - Uses simplified card-based views rather than complex heatmaps to show "Topic Completion" and "Upcoming Targets."
- **Goal Studio**: `(parent)/goals/` - An interactive form for parents to set motivational goals (e.g., "Family Trip if Math consistency > 90%").
- **Weekly Reports**: `(parent)/weekly-reports/` - Displays the AI-generated weekly digest in a scannable, mobile-friendly format.

## 🤝 Mentor Portal
Located in `frontend/web/src/app/(mentor)/`. This portal is designed for high-touch student management.

### Key Modules
- **Mentor Dashboard**: `(mentor)/dashboard/` - Prioritizes students with "Burnout Signals" or "Declining Engagement."
- **Match Center**: `(mentor)/matches/` - Interface for reviewing assigned students and their behavioral profiles.
- **Session Manager**: `(mentor)/sessions/` - Tracking of 1-on-1 pastoral care sessions and their outcomes.

## 🖼 Design Principles
- **Simplified Visuals**: Avoids deep architectural diagrams; uses progress bars, emoji-based status, and clear conversational text.
- **Mobile-First**: Designed primarily for mobile usage (parents checking progress on-the-go).
- **Empathy-Led**: The UI highlights "Growth" and "Effort" metrics alongside traditional grades to reduce academic anxiety.

---
[[Support/Overview]] | [[Support/API]] | [[Support/Backend]] | [[Support/Flow]]
