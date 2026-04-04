import { describe, it, expect } from 'vitest'
import {
  normalizeRole,
  getRoleHome,
  getRolePathPrefixes,
  getExpectedRoleForPath,
  getCanonicalPath,
  ROLE_HOME_ROUTES,
} from '@/lib/role-routing'

// ── normalizeRole edge cases ──────────────────────────────────────────────────

describe('normalizeRole', () => {
  it('normalizes "admin" to "super_admin"', () => {
    expect(normalizeRole('admin')).toBe('super_admin')
  })

  it('normalizes "faculty" to "teacher"', () => {
    expect(normalizeRole('faculty')).toBe('teacher')
  })

  it('normalizes "peer-tutor" to "peer_tutor"', () => {
    expect(normalizeRole('peer-tutor')).toBe('peer_tutor')
  })

  it('leaves canonical roles unchanged', () => {
    const canonicalRoles = [
      'super_admin', 'college_admin', 'hod', 'teacher', 'student',
      'parent', 'mentor', 'peer_tutor', 'counselor', 'content_creator',
      'researcher', 'alumni',
    ]
    canonicalRoles.forEach((role) => {
      expect(normalizeRole(role)).toBe(role)
    })
  })

  it('returns an empty string for null', () => {
    expect(normalizeRole(null)).toBe('')
  })

  it('returns an empty string for undefined', () => {
    expect(normalizeRole(undefined)).toBe('')
  })

  it('returns an unknown role unchanged', () => {
    expect(normalizeRole('unknown_role')).toBe('unknown_role')
  })
})

// ── getRoleHome ───────────────────────────────────────────────────────────────

describe('getRoleHome', () => {
  it('returns "/" for an unknown role', () => {
    expect(getRoleHome('ghost')).toBe('/')
  })

  it('returns "/" for null', () => {
    expect(getRoleHome(null)).toBe('/')
  })

  it('maps every canonical role in ROLE_HOME_ROUTES', () => {
    Object.entries(ROLE_HOME_ROUTES).forEach(([role, path]) => {
      expect(getRoleHome(role)).toBe(path)
    })
  })

  it('handles "admin" alias via normalizeRole', () => {
    expect(getRoleHome('admin')).toBe('/admin/dashboard')
  })

  it('handles "faculty" alias via normalizeRole', () => {
    expect(getRoleHome('faculty')).toBe('/teacher/dashboard')
  })
})

// ── getRolePathPrefixes ───────────────────────────────────────────────────────

describe('getRolePathPrefixes', () => {
  it('returns the correct prefixes for "teacher"', () => {
    expect(getRolePathPrefixes('teacher')).toEqual(['/teacher'])
  })

  it('returns the correct prefixes for "student"', () => {
    expect(getRolePathPrefixes('student')).toEqual(['/student'])
  })

  it('returns multiple prefixes for "peer_tutor"', () => {
    const prefixes = getRolePathPrefixes('peer_tutor')
    expect(prefixes).toContain('/peer_tutor')
    expect(prefixes).toContain('/peer-tutor')
  })

  it('returns multiple prefixes for "content_creator"', () => {
    const prefixes = getRolePathPrefixes('content_creator')
    expect(prefixes).toContain('/content-creator')
    expect(prefixes).toContain('/content_creator')
    expect(prefixes).toContain('/creator')
  })

  it('returns an empty array for an unknown role', () => {
    expect(getRolePathPrefixes('ghost')).toEqual([])
  })

  it('returns an empty array for null', () => {
    expect(getRolePathPrefixes(null)).toEqual([])
  })

  it('normalizes legacy "faculty" role before lookup', () => {
    // "faculty" normalizes to "teacher", which maps to ["/teacher"]
    expect(getRolePathPrefixes('faculty')).toEqual(['/teacher'])
  })

  it('normalizes legacy "admin" role before lookup', () => {
    // "admin" normalizes to "super_admin", which maps to ["/admin"]
    expect(getRolePathPrefixes('admin')).toEqual(['/admin'])
  })
})

// ── getExpectedRoleForPath edge cases ─────────────────────────────────────────

describe('getExpectedRoleForPath', () => {
  it('returns null for a root path', () => {
    expect(getExpectedRoleForPath('/')).toBeNull()
  })

  it('returns null for an unrecognized path', () => {
    expect(getExpectedRoleForPath('/unknown/page')).toBeNull()
  })

  it('recognises a path that exactly matches a prefix', () => {
    expect(getExpectedRoleForPath('/student')).toBe('student')
  })

  it('recognises deep sub-paths', () => {
    expect(getExpectedRoleForPath('/student/courses/123/lessons')).toBe('student')
  })

  it('recognises the counselor prefix', () => {
    expect(getExpectedRoleForPath('/counselor/sessions')).toBe('counselor')
  })

  it('recognises the hod prefix', () => {
    expect(getExpectedRoleForPath('/hod/dashboard')).toBe('hod')
  })

  it('recognises the alumni prefix', () => {
    expect(getExpectedRoleForPath('/alumni/network')).toBe('alumni')
  })
})

// ── getCanonicalPath edge cases ───────────────────────────────────────────────

describe('getCanonicalPath', () => {
  it('returns null for an already-canonical path', () => {
    expect(getCanonicalPath('/teacher/dashboard')).toBeNull()
  })

  it('returns null for paths outside any alias', () => {
    expect(getCanonicalPath('/student/courses')).toBeNull()
  })

  it('canonicalizes "/faculty" root', () => {
    expect(getCanonicalPath('/faculty')).toBe('/teacher')
  })

  it('canonicalizes a deep "/faculty/..." path', () => {
    expect(getCanonicalPath('/faculty/courses/5')).toBe('/teacher/courses/5')
  })

  it('canonicalizes "/peer-tutor" root', () => {
    expect(getCanonicalPath('/peer-tutor')).toBe('/peer_tutor')
  })

  it('canonicalizes a deep "/peer-tutor/..." path', () => {
    expect(getCanonicalPath('/peer-tutor/sessions/1')).toBe('/peer_tutor/sessions/1')
  })

  it('canonicalizes "/creator/..." to "/content_creator/..."', () => {
    expect(getCanonicalPath('/creator/new')).toBe('/content_creator/new')
  })

  it('canonicalizes "/content-creator/..." to "/content_creator/..."', () => {
    expect(getCanonicalPath('/content-creator/edit')).toBe('/content_creator/edit')
  })

  it('canonicalizes "/content_creator/studio" to "/content_creator/dashboard"', () => {
    expect(getCanonicalPath('/content_creator/studio')).toBe('/content_creator/dashboard')
  })

  it('canonicalizes a deep "/content_creator/studio/..." path', () => {
    expect(getCanonicalPath('/content_creator/studio/live')).toBe('/content_creator/dashboard/live')
  })

  it('canonicalizes "/researcher/portal" to "/researcher/dashboard"', () => {
    expect(getCanonicalPath('/researcher/portal')).toBe('/researcher/dashboard')
  })

  it('canonicalizes a deep "/researcher/portal/..." path', () => {
    expect(getCanonicalPath('/researcher/portal/papers')).toBe('/researcher/dashboard/papers')
  })
})
