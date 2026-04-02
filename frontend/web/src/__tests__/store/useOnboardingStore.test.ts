import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from '@/store/useOnboardingStore'

// Reset Zustand store state between tests so they don't bleed into each other
beforeEach(() => {
  useOnboardingStore.setState({ snapshots: {} })
})

describe('useOnboardingStore – saveSnapshot', () => {
  it('stores a snapshot under the given role key', () => {
    const { saveSnapshot, snapshots } = useOnboardingStore.getState()
    saveSnapshot('student', { step: 1, name: 'Alice' })
    expect(useOnboardingStore.getState().snapshots['student']).toEqual({ step: 1, name: 'Alice' })
  })

  it('adds multiple snapshots for different roles independently', () => {
    useOnboardingStore.getState().saveSnapshot('student', { step: 1 })
    useOnboardingStore.getState().saveSnapshot('teacher', { step: 2 })
    const { snapshots } = useOnboardingStore.getState()
    expect(snapshots['student']).toEqual({ step: 1 })
    expect(snapshots['teacher']).toEqual({ step: 2 })
  })

  it('overwrites an existing snapshot for the same role', () => {
    useOnboardingStore.getState().saveSnapshot('student', { step: 1 })
    useOnboardingStore.getState().saveSnapshot('student', { step: 3, extra: true })
    expect(useOnboardingStore.getState().snapshots['student']).toEqual({ step: 3, extra: true })
  })

  it('does not affect other role snapshots when updating one', () => {
    useOnboardingStore.getState().saveSnapshot('student', { step: 1 })
    useOnboardingStore.getState().saveSnapshot('teacher', { step: 2 })
    useOnboardingStore.getState().saveSnapshot('student', { step: 5 })
    expect(useOnboardingStore.getState().snapshots['teacher']).toEqual({ step: 2 })
  })
})

describe('useOnboardingStore – clearSnapshot', () => {
  it('removes the snapshot for a specific role', () => {
    useOnboardingStore.getState().saveSnapshot('student', { step: 1 })
    useOnboardingStore.getState().clearSnapshot('student')
    expect(useOnboardingStore.getState().snapshots['student']).toBeUndefined()
  })

  it('leaves other role snapshots intact when clearing one', () => {
    useOnboardingStore.getState().saveSnapshot('student', { step: 1 })
    useOnboardingStore.getState().saveSnapshot('teacher', { step: 2 })
    useOnboardingStore.getState().clearSnapshot('student')
    expect(useOnboardingStore.getState().snapshots['teacher']).toEqual({ step: 2 })
  })

  it('clears ALL snapshots when called without an argument', () => {
    useOnboardingStore.getState().saveSnapshot('student', { step: 1 })
    useOnboardingStore.getState().saveSnapshot('teacher', { step: 2 })
    useOnboardingStore.getState().clearSnapshot()
    expect(useOnboardingStore.getState().snapshots).toEqual({})
  })

  it('does not throw when clearing a role that was never set', () => {
    expect(() => useOnboardingStore.getState().clearSnapshot('nonexistent')).not.toThrow()
  })

  it('results in empty snapshots after clearing all', () => {
    useOnboardingStore.getState().clearSnapshot()
    expect(Object.keys(useOnboardingStore.getState().snapshots).length).toBe(0)
  })
})

describe('useOnboardingStore – initial state', () => {
  it('starts with an empty snapshots map', () => {
    expect(useOnboardingStore.getState().snapshots).toEqual({})
  })
})
