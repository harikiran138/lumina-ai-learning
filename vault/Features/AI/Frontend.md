# AI & Intelligence: Frontend Implementation

The AI components in Lumina are designed to create a "Live Tutor" feel, utilizing streaming states and dynamic rendering of structured data.

## 🏗 AI Tutor Interface
- **Primary Page**: `frontend/web/src/app/(student)/ai_tutor/page.tsx`
- **Render Engine**: Specifically built to parse the **Flow Protocol** (JSON).
- **Interactive Blocks**: Logic for handling `DiagramBlock` (Mermaid), `QuizBlock` (Interactive MCQ), and `ReflectionBlock` (Socratic input).

## 🧩 Key Features
1. **Context Awareness**: The UI sends the `course_id` and recent context with every message to ensure the tutor knows exactly what the student is looking at.
2. **Streaming Feedback**: Utilizes "Thinking..." skeletons and partial block rendering to reduce perceived latency.
3. **Markdown Rendering**: Full support for KaTeX (Mathematics) and Prism.js (Syntax Highlighting) within the tutor's response.
4. **Achievement Sync**: AI tutor interactions can trigger progress updates in the global `useAuthStore`.

## 🖼 Visual Components
- **Chat Container**: A conversation-centric layout with specific styling for "Tutor" (Bubble + Avatar) vs "Student".
- **Toolbox**: Sidebar tools for requesting a specific "Mode" (e.g., "Quiz Mode", "Code Helper", "Simplified Explanation").

## 🚀 Performance
- **Optimistic UI**: Messages are added to the local history immediately before the network request completes.
- **Auto-Scroll**: Smart scroll lock that only triggers if the user is at the bottom of the conversation.

---
[[AI/Overview]] | [[AI/API]] | [[AI/Backend]] | [[AI/Flow]]
