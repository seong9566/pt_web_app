/**
 * PT 이력 캐시 스토어 (Pinia)
 *
 * 회원별 PT 횟수 이력을 Map 기반으로 캐싱. TTL: 5분 (300,000ms).
 *
 * 캐시 key 패턴:
 *   history_${memberId}                — 트레이너 본인 기준 이력
 *   remaining_${memberId}_${trainerId} — 쌍별 잔여 횟수 (SUM)
 *   own_${userId}                      — 회원 본인 전체 횟수
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export const usePtSessionsStore = defineStore('ptSessions', () => {
  const _cache = ref(new Map())
  const _dirty = ref(false)

  function _isStale(key, ttlMs = 300000) {
    if (_dirty.value) return true
    const entry = _cache.value.get(key)
    if (!entry) return true
    return Date.now() - entry.lastFetchedAt > ttlMs
  }

  async function loadPtHistory(memberId, force = false) {
    const auth = useAuthStore()
    const key = `history_${memberId}`
    if (!force && !_isStale(key)) return _cache.value.get(key).data

    const { data, error } = await supabase
      .from('pt_sessions')
      .select('*')
      .eq('member_id', memberId)
      .eq('trainer_id', auth.user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      _cache.value.set(key, { data, lastFetchedAt: Date.now() })
      _dirty.value = false
    }
    return data || []
  }

  async function loadRemainingByPair(memberId, trainerId, force = false) {
    const key = `remaining_${memberId}_${trainerId}`
    if (!force && !_isStale(key)) return _cache.value.get(key).data

    const { data, error } = await supabase
      .from('pt_sessions')
      .select('change_amount')
      .eq('member_id', memberId)
      .eq('trainer_id', trainerId)

    if (!error && data) {
      const remaining = (data || []).reduce((sum, s) => sum + s.change_amount, 0)
      _cache.value.set(key, { data: remaining, lastFetchedAt: Date.now() })
      _dirty.value = false
      return remaining
    }
    return null
  }

  async function loadMemberOwnPtCount(force = false) {
    const auth = useAuthStore()
    const key = `own_${auth.user?.id}`
    if (!force && !_isStale(key)) return _cache.value.get(key).data

    const { data, error } = await supabase
      .from('pt_sessions')
      .select('change_amount')
      .eq('member_id', auth.user.id)

    if (!error && data) {
      _cache.value.set(key, { data, lastFetchedAt: Date.now() })
      _dirty.value = false
    }
    return data || []
  }

  function invalidate() {
    _dirty.value = true
  }

  function $reset() {
    _cache.value = new Map()
    _dirty.value = false
  }

  return {
    _cache,
    _dirty,
    loadPtHistory,
    loadRemainingByPair,
    loadMemberOwnPtCount,
    invalidate,
    $reset,
  }
})
