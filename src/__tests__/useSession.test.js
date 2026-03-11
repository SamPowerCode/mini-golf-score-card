import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSession } from '../hooks/useSession'

beforeEach(() => {
  localStorage.clear()
})

describe('useSession', () => {
  it('returns null teamId when localStorage is empty', () => {
    const { result } = renderHook(() => useSession())
    expect(result.current.teamId).toBeNull()
  })

  it('setTeamId stores teamId in localStorage', () => {
    const { result } = renderHook(() => useSession())
    act(() => result.current.setTeamId('abc-123'))
    expect(localStorage.getItem('teamId')).toBe('abc-123')
    expect(result.current.teamId).toBe('abc-123')
  })

  it('clearSession removes teamId from localStorage', () => {
    localStorage.setItem('teamId', 'abc-123')
    const { result } = renderHook(() => useSession())
    act(() => result.current.clearSession())
    expect(localStorage.getItem('teamId')).toBeNull()
    expect(result.current.teamId).toBeNull()
  })

  it('reads existing teamId from localStorage on mount', () => {
    localStorage.setItem('teamId', 'existing-id')
    const { result } = renderHook(() => useSession())
    expect(result.current.teamId).toBe('existing-id')
  })
})
