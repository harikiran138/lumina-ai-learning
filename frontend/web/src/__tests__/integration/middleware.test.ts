import { describe, expect, it } from 'vitest'

import {
  getCanonicalPath,
  getExpectedRoleForPath,
  getRoleHome,
  normalizeRole,
} from '@/lib/role-routing'

describe('Role routing helpers', () => {
  it('normalizes legacy roles to their active app roles', () => {
    expect(normalizeRole('teacher')).toBe('faculty')
    expect(normalizeRole('faculty')).toBe('faculty')
    expect(normalizeRole('admin')).toBe('super_admin')
    expect(normalizeRole('student')).toBe('student')
  })

  it('maps each role to the correct role home', () => {
    expect(getRoleHome('teacher')).toBe('/faculty/dashboard')
    expect(getRoleHome('faculty')).toBe('/faculty/dashboard')
    expect(getRoleHome('content_creator')).toBe('/content_creator/dashboard')
    expect(getRoleHome('researcher')).toBe('/researcher/dashboard')
    expect(getRoleHome('college_admin')).toBe('/college')
  })

  it('detects role ownership for canonical and alias paths', () => {
    expect(getExpectedRoleForPath('/faculty/dashboard')).toBe('faculty')
    expect(getExpectedRoleForPath('/teacher/courses')).toBe('faculty')
    expect(getExpectedRoleForPath('/peer-tutor/dashboard')).toBe('peer_tutor')
    expect(getExpectedRoleForPath('/content_creator/studio')).toBe('content_creator')
    expect(getExpectedRoleForPath('/researcher/dashboard')).toBe('researcher')
  })

  it('canonicalizes stale role paths to working routes', () => {
    expect(getCanonicalPath('/teacher/dashboard')).toBe('/faculty/dashboard')
    expect(getCanonicalPath('/peer-tutor/training')).toBe('/peer_tutor/training')
    expect(getCanonicalPath('/creator/dashboard')).toBe('/content_creator/dashboard')
    expect(getCanonicalPath('/content_creator/studio')).toBe('/content_creator/dashboard')
    expect(getCanonicalPath('/researcher/portal')).toBe('/researcher/dashboard')
  })
})
