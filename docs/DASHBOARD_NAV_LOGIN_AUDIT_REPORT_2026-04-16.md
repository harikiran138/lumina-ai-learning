# Lumina Dashboard, Navigation, and Login Audit Report

Date: 2026-04-16
Scope: Frontend routing/layout/navigation/auth flow and backend dashboard/auth endpoints

## 1. Executive Summary

This audit verifies dashboard coverage, role-to-dashboard routing, sidebar/menu structure, and login/auth integration for the Lumina platform.

Key conclusions:
- The app has 183 role and feature pages and 13 dashboard routes.
- Role home mapping is defined and mostly consistent across role routing, middleware, and role-based layouts.
- Admin and HOD dashboard data paths are connected through protected backend endpoints.
- A navigation consistency risk exists: several roles use the generic sidebar, but the generic roleNavItems map does not include every role that uses it.

## 2. Inventory Counts

### 2.1 Total App Pages
- Total page.tsx files under app routes: 183

### 2.2 Dashboard Route Count
- Total dashboard routes: 13

Dashboard routes identified:
- frontend/web/src/app/admin/compliance/dashboard/page.tsx
- frontend/web/src/app/admin/dashboard/page.tsx
- frontend/web/src/app/alumni/dashboard/page.tsx
- frontend/web/src/app/content_creator/dashboard/page.tsx
- frontend/web/src/app/counselor/dashboard/page.tsx
- frontend/web/src/app/dashboard/page.tsx
- frontend/web/src/app/hod/dashboard/page.tsx
- frontend/web/src/app/mentor/dashboard/page.tsx
- frontend/web/src/app/parent/dashboard/page.tsx
- frontend/web/src/app/peer_tutor/dashboard/page.tsx
- frontend/web/src/app/researcher/dashboard/page.tsx
- frontend/web/src/app/student/dashboard/page.tsx
- frontend/web/src/app/teacher/dashboard/page.tsx

### 2.3 Pages by Role Namespace
- admin: 44
- hod: 12
- teacher: 30
- student: 22
- parent: 9
- mentor: 5
- peer_tutor: 12
- counselor: 11
- content_creator: 1
- researcher: 2
- alumni: 11
- college: 5

## 3. Dashboard Content Audit

### 3.1 Admin Dashboard
Path: frontend/web/src/app/admin/dashboard/page.tsx

Primary content blocks:
- Operational summary cards for students, faculty, courses, and system health
- Operational Pulse with current state and system status badge
- Attention Queue for critical operational items
- Activity and service/health slices from backend analytics payload
- Chart blocks for user growth and role distribution
- Quick actions for admin workflows

Data source:
- frontend/web/src/features/admin/lib/server.ts
- backend/app/routers/admin.py -> GET /dashboard

### 3.2 HOD Dashboard
Path: frontend/web/src/app/hod/dashboard/page.tsx

Primary content blocks:
- Department-level summary stats
- Knowledge graph weakness patterns
- Faculty performance monitoring
- Syllabus progress tracking
- AI SLA and pending response monitoring
- At-risk student signals and interventions
- Alumni feedback relevance signals
- Alert center and request workflow actions

Data source:
- backend/app/routers/hod.py -> GET /dashboard

### 3.3 Teacher Dashboard
Path: frontend/web/src/app/teacher/dashboard/page.tsx

Primary content blocks:
- Teacher intelligence hub wrapper
- Delegates major dashboard rendering to modular TeacherDashboard component
- Intended domains include course, student, grading, verification, and analytics panels

Data source:
- backend/app/routers/teacher.py -> GET /dashboard

### 3.4 Student Dashboard
Path: frontend/web/src/app/student/dashboard/page.tsx

Primary content blocks:
- AI-curated next action block
- Mastery and progress widgets
- Wellbeing/check-in integration
- Assignment urgency and due state panels
- Course continuation and personalized insight sections
- Parent link-code and connection-state refresh flow

Data source:
- backend/app/routers/student.py -> GET /dashboard

### 3.5 Parent Dashboard
Path: frontend/web/src/app/parent/dashboard/page.tsx

Primary content blocks:
- Child linkage and guardian code status
- Child performance and learning trajectory summaries
- Goal/progress visualizations
- Assignment and engagement indicators
- Premium guardian view visual treatment

### 3.6 Mentor Dashboard
Path: frontend/web/src/app/mentor/dashboard/page.tsx

Primary content blocks:
- Mentee matching and session pipeline
- Impact metrics and trend/chart summaries
- Mentor quick actions and active workflow panels

### 3.7 Peer Tutor Dashboard
Path: frontend/web/src/app/peer_tutor/dashboard/page.tsx

Primary content blocks:
- Incoming student query/assist queue
- Tutoring activity and credit trends
- Study-group and mentoring action shortcuts
- Performance/feedback metrics

### 3.8 Counselor Dashboard
Path: frontend/web/src/app/counselor/dashboard/page.tsx

Primary content blocks:
- At-risk feed and risk prioritization
- Intervention and referral flows
- Behavioral and distribution charts
- Safeguarding-oriented alerts and case views

### 3.9 Alumni Dashboard
Path: frontend/web/src/app/alumni/dashboard/page.tsx

Primary content blocks:
- Alumni mentoring overview stats
- Quick actions for sessions, jobs, mentees, curriculum feedback
- Upcoming session timeline
- Mentee request acceptance/rejection workflow
- Current mentees and portfolio linkage

### 3.10 Content Creator Dashboard
Path: frontend/web/src/app/content_creator/dashboard/page.tsx

Primary content blocks:
- Content studio header and upload actions
- Verification queue and scaffold approval flow
- Course coverage health section
- AI copilot recommendation panel

### 3.11 Researcher Dashboard
Path: frontend/web/src/app/researcher/dashboard/page.tsx

Primary content blocks:
- Research lab overview with ethics framing
- K-anonymity cohort charting
- Snapshot archive list and query actions
- Snapshot builder controls and anonymization settings

### 3.12 Dashboard Redirect Route
Path: frontend/web/src/app/dashboard/page.tsx

Behavior:
- Fetches current user via frontend API helper
- Redirects to role home route or login when no session is present

## 4. Sidebar and Menu Audit

### 4.1 Active Sidebar Systems

1) Admin sidebar
- Component: frontend/web/src/app/admin/sidebar.tsx
- Base items from config: 8
- Secondary items: 1 (Guardian Log), role-restricted
- Effective total:
  - super_admin, college_admin: 9
  - institution_admin, system_admin, admin, hod when viewing admin: 8

2) Teacher sidebar
- Component: frontend/web/src/components/dashboard/TeacherSidebar.tsx
- Main nav items: 17
- Additional bottom entry: Notifications

3) HOD sidebar
- Component: frontend/web/src/components/dashboard/HODSidebar.tsx
- Main nav items: 12
- Additional bottom entry: Notifications

4) Alumni sidebar
- Component: frontend/web/src/components/dashboard/AlumniSidebar.tsx
- Main nav items: 9
- Additional bottom entry: Notifications

5) College sidebar
- Component: frontend/web/src/components/dashboard/CollegeSidebar.tsx
- Main nav items: 5

6) Generic sidebar
- Component: frontend/web/src/components/dashboard/Sidebar.tsx
- roleNavItems definitions:
  - student: 10
  - parent: 5
  - peer_tutor: 6
  - counselor: 8
  - teacher: 3 (not used by teacher layout in practice)
  - admin: 4 (not used by admin layout in practice)

### 4.2 Role -> Layout -> Sidebar Mapping

- admin: AdminLayout -> AdminShell -> app/admin/sidebar
- teacher: TeacherLayout -> TeacherSidebar
- hod: HODLayout -> HODSidebar
- student: StudentLayout -> generic Sidebar
- parent: ParentLayout -> generic Sidebar
- mentor: MentorLayout -> generic Sidebar
- peer_tutor: PeerTutorLayout -> generic Sidebar
- counselor: CounselorLayout -> generic Sidebar
- researcher: ResearcherLayout -> generic Sidebar
- content_creator: ContentCreatorLayout -> generic Sidebar
- alumni: AlumniLayout -> AlumniSidebar
- college_admin/institution_admin/system_admin (college area): CollegeLayout -> CollegeSidebar

## 5. Role-to-Dashboard and Login Mapping

### 5.1 Canonical Role Home Routes
Defined in frontend/web/src/lib/role-routing.ts

- super_admin, admin, system_admin, institution_admin -> /admin/dashboard
- college_admin -> /college
- hod -> /hod/dashboard
- teacher -> /teacher/dashboard
- student -> /student/dashboard
- parent -> /parent/dashboard
- mentor -> /mentor/dashboard
- peer_tutor -> /peer_tutor/dashboard
- counselor -> /counselor/dashboard
- content_creator -> /content_creator/dashboard
- researcher -> /researcher/dashboard
- alumni -> /alumni/dashboard

### 5.2 Frontend Route Protection
Defined in frontend/web/src/middleware.ts

Highlights:
- Protected route prefixes mapped per role namespace

## 6. Theme System Audit

### 6.1 Core Theme Plumbing Fixed
- Global theme init script now runs before interactive render in [frontend/web/src/app/layout.tsx](../frontend/web/src/app/layout.tsx)
- Theme provider now defaults to system theme and preserves `data-theme`
- Shared theme hook added in [frontend/web/src/hooks/useThemeMode.ts](../frontend/web/src/hooks/useThemeMode.ts)
- Tailwind semantic color mapping added in [frontend/web/tailwind.config.ts](../frontend/web/tailwind.config.ts)

### 6.2 Semantic Token Layer
- Light theme now maps to clean SaaS white/green tokens in [frontend/web/src/app/globals.css](../frontend/web/src/app/globals.css)
- Dark theme remains mapped to the existing dark/yellow palette without changing the visible dark design language
- Legacy glass utilities were normalized to token-backed surfaces instead of hardcoded black/white styling

### 6.3 Visual Components Refactored
- Theme toggle, toaster, error boundary, loading states, navigation header, and onboarding mood card now use token classes
- Decorative particle mesh is suppressed in light mode to remove visual noise and preserve a clean white UI
- Debug outline support is gated behind `html[data-theme-debug="true"]` instead of being permanently enabled

### 6.4 Remaining Legacy Color Debt
- Several legacy App Router pages and JS-rendered views still contain hardcoded utility colors and hex values
- The light-theme compatibility layer in CSS remaps many of these surfaces visually, but the source files still need a separate cleanup pass for full token compliance

### 6.5 Validation Status
- Edited theme files compile cleanly
- Full production build is currently blocked by unrelated pre-existing syntax errors in:
  - [frontend/web/src/components/onboarding/AdaptiveOnboardingPanel.tsx](../frontend/web/src/components/onboarding/AdaptiveOnboardingPanel.tsx)
  - [frontend/web/src/components/teacher/TeacherDashboard.tsx](../frontend/web/src/components/teacher/TeacherDashboard.tsx)
- ADMIN_ALLOWED set permits /admin access for:
  - super_admin, college_admin, institution_admin, system_admin, admin, hod
- Middleware enforces onboarding gate with role-based bypass set
- Canonical alias redirects handled before auth checks

### 5.3 Frontend Login and Session Flow
Primary files:
- frontend/web/src/components/auth/AuthGateway.tsx
- frontend/web/src/store/useAuthStore.ts

Flow summary:
1) Login payload submits identifier/password/role_hint
2) API returns user session context
3) Store updates authenticated user state
4) Redirect target selection:
- change-password if mustChangePassword
- onboarding if required and not complete
- else role home via getRoleHome
5) Middleware validates cookies/token and enforces role path access

### 5.4 Backend Auth Endpoints
Defined in backend/app/routers/auth.py

Core endpoints include:
- register
- login
- refresh
- me
- logout

Security and claims:
- Claims built with minimal role/onboarding fields
- Role normalization and onboarding completion logic in auth service path

## 6. Backend Dashboard Endpoint Coverage

- admin dashboard: backend/app/routers/admin.py -> GET /dashboard
- teacher dashboard: backend/app/routers/teacher.py -> GET /dashboard
- student dashboard: backend/app/routers/student.py -> GET /dashboard
- hod dashboard: backend/app/routers/hod.py -> GET /dashboard

Dependency guards:
- backend/app/api/deps.py defines role dependencies and 2FA handling
- get_current_college_admin allows admin, college_admin, super_admin, institution_admin, system_admin, hod
- _ensure_2fa enforces only when 2FA is explicitly enabled

## 7. Key Findings and Risks

### 7.1 Navigation Coverage Risk (High)
Issue:
- Several roles use the generic Sidebar layout (mentor, researcher, content_creator), but generic roleNavItems does not define dedicated nav entries for these roles.

Observed behavior:
- Generic Sidebar falls back to student nav when current role key is missing.

Impact:
- Role users can see irrelevant sidebar items and miss role-specific page navigation.

Recommended action:
- Add explicit nav definitions for mentor, researcher, content_creator in generic roleNavItems or move these roles to dedicated sidebars.

### 7.2 Multi-Source Sidebar Configuration Drift (Medium)
Issue:
- Navigation is spread across multiple sidebar systems and config files.

Impact:
- Increased risk of mismatch between role pages and discoverable menu items.

Recommended action:
- Introduce a centralized role navigation registry and generate per-sidebar views from shared config.

### 7.3 Redirect and Role Aliasing Complexity (Medium)
Issue:
- Middleware, role normalizer, alias redirects, and layout guards all influence final route behavior.

Impact:
- Easy to introduce regressions when adding roles or alias paths.

Recommended action:
- Add role-route integration tests that validate login role -> middleware permission -> layout access -> dashboard load path.

## 8. Verification Anchors

Frontend role routing and middleware:
- frontend/web/src/lib/role-routing.ts
- frontend/web/src/middleware.ts

Frontend login/auth state:
- frontend/web/src/components/auth/AuthGateway.tsx
- frontend/web/src/store/useAuthStore.ts

Frontend sidebar/layout sources:
- frontend/web/src/components/dashboard/Sidebar.tsx
- frontend/web/src/components/dashboard/TeacherSidebar.tsx
- frontend/web/src/components/dashboard/HODSidebar.tsx
- frontend/web/src/components/dashboard/AlumniSidebar.tsx
- frontend/web/src/components/dashboard/CollegeSidebar.tsx
- frontend/web/src/app/admin/sidebar.tsx
- frontend/web/src/features/admin/config.ts
- frontend/web/src/app/*/layout.tsx

Backend dashboard and auth sources:
- backend/app/routers/admin.py
- backend/app/routers/teacher.py
- backend/app/routers/student.py
- backend/app/routers/hod.py
- backend/app/routers/auth.py
- backend/app/api/deps.py

## 9. Recommended Next Steps

1. Fix generic sidebar role coverage for mentor, researcher, and content_creator immediately.
2. Add role-to-menu snapshot tests to prevent future nav drift.
3. Add end-to-end auth-route tests for all production roles.
4. Create a generated route inventory artifact in CI to track page and dashboard drift over time.
