import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '@/lib/schemas/auth'

// ── loginSchema ────────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('passes with a valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'Password1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'Password1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emails = result.error.issues.filter(i => i.path[0] === 'email')
      expect(emails.length).toBeGreaterThan(0)
      expect(emails[0].message).toBe('Please enter a valid email address')
    }
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwIssues = result.error.issues.filter(i => i.path[0] === 'password')
      expect(pwIssues[0].message).toBe('Password must be at least 8 characters')
    }
  })
})

// ── registerSchema ─────────────────────────────────────────────────────────────

describe('registerSchema', () => {
  const valid = {
    name: 'Alice',
    email: 'alice@example.com',
    password: 'StrongPass1',
    confirmPassword: 'StrongPass1',
    role: 'student' as const,
  }

  it('passes with all valid fields', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssues = result.error.issues.filter(i => i.path[0] === 'name')
      expect(nameIssues[0].message).toBe('Name must be at least 2 characters')
    }
  })

  it('rejects a password without an uppercase letter', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'lowercase1', confirmPassword: 'lowercase1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwIssues = result.error.issues.filter(i => i.path[0] === 'password')
      expect(pwIssues.some(i => i.message === 'Must contain at least one uppercase letter')).toBe(true)
    }
  })

  it('rejects a password without a number', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'NoNumbers!', confirmPassword: 'NoNumbers!' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwIssues = result.error.issues.filter(i => i.path[0] === 'password')
      expect(pwIssues.some(i => i.message === 'Must contain at least one number')).toBe(true)
    }
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'Different1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const mismatch = result.error.issues.find(i => i.path[0] === 'confirmPassword')
      expect(mismatch?.message).toBe('Passwords do not match')
    }
  })

  it('passes when role is omitted (optional)', () => {
    const { role, ...withoutRole } = valid
    expect(registerSchema.safeParse(withoutRole).success).toBe(true)
  })

  it('rejects an invalid role value', () => {
    const result = registerSchema.safeParse({ ...valid, role: 'superuser' })
    expect(result.success).toBe(false)
  })

  it('passes with all valid role enum values', () => {
    const roles = ['student', 'teacher', 'faculty', 'parent', 'mentor', 'peer_tutor', 'researcher'] as const
    for (const role of roles) {
      expect(registerSchema.safeParse({ ...valid, role }).success).toBe(true)
    }
  })
})
