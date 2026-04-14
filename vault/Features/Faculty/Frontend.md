# Faculty & Academics: Frontend Implementation

The Faculty interface is designed as an **Instructional Command Center**, providing high-density data visualizations and real-time control over the learning environment.

## 🏗 Modular Architecture
- **Root Layout**: `frontend/web/src/app/(teacher)/layout.tsx` (Sidebar-driven navigation with Institutional context).
- **Primary View**: `(teacher)/dashboard/page.tsx` (Summarized KPIs: Active Students, Pending Grading, At-Risk Alerts).

## 🧩 Feature Modules
1. **Intervention Feed**: `(teacher)/alerts/` - A real-time notification system where teachers can "Acknowledge" or "Act" on student behavioral alerts.
2. **AI Verification Queue**: `(teacher)/verification-queue/` - A specialized interface for reviewing low-confidence AI responses before they are published to students.
3. **Analytics Studio**: `(teacher)/analytics/` - Interactive Recharts/D3 visualizations of **Concept Mastery Heatmaps** and **Growth Trajectories**.
4. **Live Teaching Tools**: `(teacher)/live-class/` - Controls for triggering "Live Interventions" and "Question Overrides" via WebSockets.
5. **Curriculum Studio**: `(teacher)/create-course/` - A wizard-based UI that uses AI to generate course scaffolds from uploaded syllabus PDFs.

## 🖼 Design Principles
- **Action-Oriented**: Every analytical insight (e.g., "Student is stuck") has a direct CTA (Call to Action) for the teacher to intervene.
- **Data Density**: Uses compact table views and "Sparkline" charts to allow teachers to scan entire batches of 60+ students at once.
- **Institutional Guardrails**: The UI prevents teachers from accidentally accessing cross-departmental or cross-college data based on the `college_id` in `useAuthStore`.

---
[[Faculty/Overview]] | [[Faculty/API]] | [[Faculty/Backend]] | [[Faculty/Flow]]
