# Student Experience: Frontend Implementation

The Student interface is a high-interactivity Next.js 15 application designed for focus and engagement.

## 🏗 UI Architecture
- **Layout**: `frontend/web/src/app/(student)/layout.tsx` (Provides the "Lumina Core" sidebar and Top Navigation).
- **Dashboard**: `frontend/web/src/app/(student)/dashboard/page.tsx` (Central hub for recent courses and AI insights).

## 🧩 Key Modules
1. **AI Tutor**: `(student)/ai_tutor/` - A real-time chat interface with context persistence.
2. **Curriculum Viewer**: `(student)/lesson_page/` - Specialized video/text hybrid player with auto-tracking of progress.
3. **Assessment Hub**: `(student)/assessment/` - Timer-based quiz interface with LaTeX support for mathematical notation.
4. **Progress Visualizer**: `(student)/progress/` - Interactive charts showing performance trends over time.

## 🎨 Design Tokens
- **Themes**: Deep Indigo / Slate Dark Mode (Default).
- **Feedback**: Success/Error toasts for every lesson completion or quiz failure.
- **Glassmorphism**: Extensively used in the "Goal Tracker" and "Focus Map" cards.

## 🚀 Key Libraries
- **Framer Motion**: Smooth transitions between dashboard widgets.
- **Zustand**: Syncs learning progress and pending notifications.
- **Lucide React**: Iconography for courses, grades, and achievements.

---
[[Student/Overview]] | [[Student/API]] | [[Student/Backend]] | [[Student/Flow]]
