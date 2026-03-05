import { describe, it, expect, vi } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('Supabase Mock', () => {
  it('should mock supabase.from() method', () => {
    const result = supabase.from('profiles')
    expect(result).toBeDefined()
    expect(supabase.from).toHaveBeenCalledWith('profiles')
  })

  it('should mock supabase.auth.getSession()', async () => {
    const { data, error } = await supabase.auth.getSession()
    expect(data).toBeDefined()
    expect(error).toBeNull()
  })

  it('should verify mock was called', () => {
    supabase.from('test_table')
    expect(supabase.from).toHaveBeenCalled()
  })
})
