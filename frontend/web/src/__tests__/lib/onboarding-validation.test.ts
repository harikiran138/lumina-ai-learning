import { describe, it, expect } from 'vitest'
import {
  validateRequiredName,
  validateOptionalPhone,
  validateOptionalEmail,
} from '@/lib/onboarding-validation'

// ── validateRequiredName ──────────────────────────────────────────────────────

describe('validateRequiredName', () => {
  it('returns null for a valid name', () => {
    expect(validateRequiredName('Alice')).toBeNull()
  })

  it('returns an error for an empty string', () => {
    expect(validateRequiredName('')).not.toBeNull()
  })

  it('returns an error for a whitespace-only string', () => {
    expect(validateRequiredName('   ')).not.toBeNull()
  })

  it('returns an error for a single character', () => {
    expect(validateRequiredName('A')).not.toBeNull()
  })

  it('returns null for a two-character name (minimum boundary)', () => {
    expect(validateRequiredName('Jo')).toBeNull()
  })

  it('uses the default label "Name" in the error message', () => {
    const msg = validateRequiredName('')
    expect(msg).toContain('Name')
  })

  it('uses a custom label in the error message', () => {
    const msg = validateRequiredName('', 'First Name')
    expect(msg).toContain('First Name')
  })

  it('strips leading/trailing whitespace before checking length', () => {
    // " A " has length 1 after trimming, so should fail
    expect(validateRequiredName(' A ')).not.toBeNull()
  })

  it('returns null for a long valid name', () => {
    expect(validateRequiredName('Bartholomew')).toBeNull()
  })
})

// ── validateOptionalPhone ─────────────────────────────────────────────────────

describe('validateOptionalPhone', () => {
  it('returns null for an empty string (field is optional)', () => {
    expect(validateOptionalPhone('')).toBeNull()
  })

  it('returns null for a whitespace-only string (treated as empty)', () => {
    expect(validateOptionalPhone('   ')).toBeNull()
  })

  it('returns null for a valid 10-digit phone number', () => {
    expect(validateOptionalPhone('1234567890')).toBeNull()
  })

  it('returns null for a number with leading plus sign', () => {
    expect(validateOptionalPhone('+1234567890')).toBeNull()
  })

  it('returns null for a number with spaces', () => {
    expect(validateOptionalPhone('+1 234 567 8901')).toBeNull()
  })

  it('returns null for a number with hyphens', () => {
    expect(validateOptionalPhone('123-456-7890')).toBeNull()
  })

  it('returns null for a number with parentheses', () => {
    expect(validateOptionalPhone('(123) 456-7890')).toBeNull()
  })

  it('returns an error for a too-short number (fewer than 8 digits)', () => {
    expect(validateOptionalPhone('1234')).not.toBeNull()
  })

  it('returns an error for alphabetic characters', () => {
    expect(validateOptionalPhone('abc-def-ghij')).not.toBeNull()
  })

  it('uses a custom label in the error message', () => {
    const msg = validateOptionalPhone('abc', 'Mobile')
    expect(msg).toContain('Mobile')
  })

  it('uses the default label "Phone number" in the error message', () => {
    const msg = validateOptionalPhone('abc')
    expect(msg).toContain('Phone number')
  })
})

// ── validateOptionalEmail ─────────────────────────────────────────────────────

describe('validateOptionalEmail', () => {
  it('returns null for an empty string (field is optional)', () => {
    expect(validateOptionalEmail('')).toBeNull()
  })

  it('returns null for a whitespace-only string', () => {
    expect(validateOptionalEmail('   ')).toBeNull()
  })

  it('returns null for a valid email address', () => {
    expect(validateOptionalEmail('user@example.com')).toBeNull()
  })

  it('returns null for an email with subdomains', () => {
    expect(validateOptionalEmail('user@mail.example.co.uk')).toBeNull()
  })

  it('returns an error for an email without "@"', () => {
    expect(validateOptionalEmail('notanemail')).not.toBeNull()
  })

  it('returns an error for an email without a domain', () => {
    expect(validateOptionalEmail('user@')).not.toBeNull()
  })

  it('returns an error for an email without a TLD', () => {
    expect(validateOptionalEmail('user@domain')).not.toBeNull()
  })

  it('returns an error for an email with spaces', () => {
    expect(validateOptionalEmail('user name@example.com')).not.toBeNull()
  })

  it('uses the default label "Email" in the error message', () => {
    const msg = validateOptionalEmail('bad-email')
    expect(msg).toContain('Email')
  })

  it('uses a custom label in the error message', () => {
    const msg = validateOptionalEmail('bad-email', 'Parent Email')
    expect(msg).toContain('Parent Email')
  })
})
