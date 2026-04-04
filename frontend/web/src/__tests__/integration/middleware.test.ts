import { describe, expect, it } from 'vitest'

import {
  getCanonicalPath,
  getExpectedRoleForPath,
  getRoleHome,
  normalizeRole,
} from '@/lib/role-routing'

describe('Role routing helpers', () => {
  it('normalizes legacy roles to their active app roles', () => {
    expect(normalizeRole('faculty')).toBe('teacher')
    expect(normalizeRole('admin')).toBe('super_admin')
    expect(normalizeRole('student')).toBe('student')
  })

  it('maps each role to the correct role home', () => {
    expect(getRoleHome('teacher')).toBe('/teacher/dashboard')
    expect(getRoleHome('content_creator')).toBe('/content_creator/dashboard')
    expect(getRoleHome('researcher')).toBe('/researcher/dashboard')
    expect(getRoleHome('college_admin')).toBe('/college')
  })

  it('detects role ownership for canonical and alias paths', () => {
    expect(getExpectedRoleForPath('/teacher/dashboard')).toBe('teacher')
    expect(getExpectedRoleForPath('/peer-tutor/dashboard')).toBe('peer_tutor')
    expect(getExpectedRoleForPath('/content_creator/studio')).toBe('content_creator')
    expect(getExpectedRoleForPath('/researcher/dashboard')).toBe('researcher')
  })

  it('canonicalizes stale role paths to working routes', () => {
    expect(getCanonicalPath('/faculty/dashboard')).toBe('/teacher/dashboard')
    expect(getCanonicalPath('/peer-tutor/training')).toBe('/peer_tutor/training')
    expect(getCanonicalPath('/creator/dashboard')).toBe('/content_creator/dashboard')
    expect(getCanonicalPath('/content_creator/studio')).toBe('/content_creator/dashboard')
    expect(getCanonicalPath('/researcher/portal')).toBe('/researcher/dashboard')
  })
})
