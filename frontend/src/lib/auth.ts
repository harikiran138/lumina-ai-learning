
// Mock Auth for frontend-only mode

// Mock user data
const mockUser = {
  id: '1',
  name: 'Mock User',
  email: 'mock@example.com',
  role: 'student',
};

// Mock auth store
export const useAuth = () => ({
  token: 'mock-token',
  refreshToken: 'mock-refresh-token',
  user: mockUser,
  setTokens: (access: string, refresh: string) => console.log('Mock setTokens', { access, refresh }),
  setUser: (user: any) => console.log('Mock setUser', user),
  logout: () => console.log('Mock logout'),
});

// Get the current auth token
export const getAuthToken = () => 'mock-token';

// Get the current user
export const getCurrentUser = () => mockUser;

// Check if the user is authenticated
export const isAuthenticated = () => true;

// Get user role
export const getUserRole = () => mockUser.role;

// Role-based access control
export const hasRole = (requiredRole: string | string[]) => {
  const userRole = getUserRole();
  if (!userRole) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
};

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
