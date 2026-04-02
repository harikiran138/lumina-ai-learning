/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

describe('useOnlineStatus', () => {
  afterEach(() => {
    // Restore navigator.onLine to its default truthy value
    vi.restoreAllMocks()
  })

  it('returns true when navigator.onLine is true', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  it('returns false when navigator.onLine is false', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)
  })

  it('updates to false when the "offline" event fires', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)
  })

  it('updates to true when the "online" event fires', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current).toBe(true)
  })

  it('removes event listeners on unmount (no memory leak)', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useOnlineStatus())
    const addCalls = addSpy.mock.calls.filter(([evt]) => evt === 'online' || evt === 'offline')
    expect(addCalls.length).toBe(2)

    unmount()

    const removeCalls = removeSpy.mock.calls.filter(([evt]) => evt === 'online' || evt === 'offline')
    expect(removeCalls.length).toBe(2)
  })

  it('can toggle back and forth between online and offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useOnlineStatus())

    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(result.current).toBe(false)

    act(() => { window.dispatchEvent(new Event('online')) })
    expect(result.current).toBe(true)

    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(result.current).toBe(false)
  })
})
