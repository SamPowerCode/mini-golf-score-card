import { describe, it, expect } from 'vitest'
import { supabase } from '../lib/supabase'

describe('supabase client', () => {
  it('is defined', () => {
    expect(supabase).toBeDefined()
  })

  it('exposes a from() method', () => {
    expect(typeof supabase.from).toBe('function')
  })
})
