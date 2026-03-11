import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppAccess } from '../hooks/useAppAccess'

beforeEach(() => { localStorage.clear() })

describe('useAppAccess', () => {
  it('returns unlocked=false when localStorage has no flag', () => {
    const { result } = renderHook(() => useAppAccess())
    expect(result.current.unlocked).toBe(false)
  })

  it('returns unlocked=true when localStorage flag is set', () => {
    localStorage.setItem('appUnlocked', 'true')
    const { result } = renderHook(() => useAppAccess())
    expect(result.current.unlocked).toBe(true)
  })

  it('unlock() sets localStorage and updates state', () => {
    const { result } = renderHook(() => useAppAccess())
    act(() => { result.current.unlock() })
    expect(result.current.unlocked).toBe(true)
    expect(localStorage.getItem('appUnlocked')).toBe('true')
  })
})
