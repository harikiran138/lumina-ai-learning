import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatDate, formatTime, formatDateTime, getChartColors, storage } from '@/lib/utils'

// ── cn (class merging) ────────────────────────────────────────────────────────

describe('cn', () => {
  it('returns a single class name unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('merges multiple class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('merges padding utilities correctly', () => {
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('handles conditional object syntax', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo')
  })

  it('handles array syntax', () => {
    expect(cn(['a', 'b'])).toBe('a b')
  })

  it('returns an empty string when given no arguments', () => {
    expect(cn()).toBe('')
  })
})

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-01-15T00:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the year in the output', () => {
    const result = formatDate('2024-01-15T00:00:00Z')
    expect(result).toContain('2024')
  })

  it('returns a different string for different dates', () => {
    const jan = formatDate('2024-01-01T00:00:00Z')
    const dec = formatDate('2024-12-01T00:00:00Z')
    expect(jan).not.toBe(dec)
  })
})

// ── formatTime ────────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('returns a non-empty string for a valid ISO datetime', () => {
    const result = formatTime('2024-01-15T14:30:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('contains a colon separating hours and minutes', () => {
    const result = formatTime('2024-01-15T14:30:00Z')
    expect(result).toMatch(/:/)
  })
})

// ── formatDateTime ────────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('combines date and time with a space separator', () => {
    const dateStr = '2024-06-10T09:00:00Z'
    const result = formatDateTime(dateStr)
    const date = formatDate(dateStr)
    const time = formatTime(dateStr)
    expect(result).toBe(`${date} ${time}`)
  })

  it('returns a non-empty string', () => {
    expect(formatDateTime('2024-06-10T09:00:00Z').length).toBeGreaterThan(0)
  })
})

// ── getChartColors ────────────────────────────────────────────────────────────

describe('getChartColors', () => {
  it('returns an object with all required color keys', () => {
    const colors = getChartColors(false)
    expect(colors).toHaveProperty('primary')
    expect(colors).toHaveProperty('success')
    expect(colors).toHaveProperty('warning')
    expect(colors).toHaveProperty('error')
    expect(colors).toHaveProperty('text')
    expect(colors).toHaveProperty('grid')
    expect(colors).toHaveProperty('background')
  })

  it('returns different text color for dark vs light mode', () => {
    const dark = getChartColors(true)
    const light = getChartColors(false)
    expect(dark.text).not.toBe(light.text)
  })

  it('returns different grid color for dark vs light mode', () => {
    const dark = getChartColors(true)
    const light = getChartColors(false)
    expect(dark.grid).not.toBe(light.grid)
  })

  it('uses the same primary/success/warning/error regardless of theme', () => {
    const dark = getChartColors(true)
    const light = getChartColors(false)
    expect(dark.primary).toBe(light.primary)
    expect(dark.success).toBe(light.success)
    expect(dark.warning).toBe(light.warning)
    expect(dark.error).toBe(light.error)
  })
})

// ── storage ───────────────────────────────────────────────────────────────────

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('set() stores a value that can be retrieved with get()', () => {
    storage.set('testKey', { name: 'Alice' })
    expect(storage.get('testKey')).toEqual({ name: 'Alice' })
  })

  it('get() returns null for a key that has not been set', () => {
    expect(storage.get('nonexistent')).toBeNull()
  })

  it('set() overwrites an existing value', () => {
    storage.set('key', 'first')
    storage.set('key', 'second')
    expect(storage.get('key')).toBe('second')
  })

  it('remove() deletes an existing key', () => {
    storage.set('removeMe', 42)
    storage.remove('removeMe')
    expect(storage.get('removeMe')).toBeNull()
  })

  it('remove() does not throw when key does not exist', () => {
    expect(() => storage.remove('neverSet')).not.toThrow()
  })

  it('handles non-serializable data gracefully (circular reference)', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => storage.set('bad', circular)).not.toThrow()
    consoleSpy.mockRestore()
  })

  it('set() stores primitive values (number)', () => {
    storage.set('count', 99)
    expect(storage.get('count')).toBe(99)
  })

  it('set() stores array values', () => {
    storage.set('list', [1, 2, 3])
    expect(storage.get('list')).toEqual([1, 2, 3])
  })

  it('get() returns null when stored value is corrupted JSON', () => {
    localStorage.setItem('corrupt', 'not-valid-json{{{')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(storage.get('corrupt')).toBeNull()
    consoleSpy.mockRestore()
  })
})
