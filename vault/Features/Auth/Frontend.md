# Auth & Security: Frontend Implementation

The frontend uses **Zustand** for state management and **Next.js 15 Middleware** for route protection.

## 📦 Auth State Management
- **Store**: `frontend/web/src/store/useAuthStore.ts`
- **Library**: Zustand with `persist` middleware.
- **Key State Variables**:
  - `user`: The current `User` object (ID, Email, Role, Onboarding Status).
  - `isAuthenticated`: Boolean flag derived from the presence of `user`.
  - `isLoading`: Tracks hydration and backend validation status.

## 🔐 Route Protection
Route protection is implemented at the **Layout** and **Middleware** levels:
1. **Public Routes**: `/login`, `/register`, `/forgot-password`.
2. **Onboarding Guard**: Users with `onboardingCompleted: false` are redirected to `/onboarding`.
3. **Role-Based Paths**:
   - `/student/*`: Restricted to `role: student`.
   - `/admin/*`: Restricted to `role: admin` or `super_admin`.

## 🛠 Main Actions
- `login(identifier, password)`: Calls `api.login` and sets user state.
- `logout()`: Clears local storage (`lumina_user`), clears session, and resets state.
- `refreshUser()`: Syncs local state with backend on app refresh.

## 🖼 UI Components
- **Auth Shell**: `frontend/web/src/components/auth/AuthShell.tsx`
- **LoginForm**: `frontend/web/src/components/auth/LoginForm.tsx`
- **RoleSelector**: Dynamic hint for institutional logins.

---
[[Auth/Overview]] | [[Auth/API]] | [[Auth/Backend]] | [[Auth/Flow]]
