/**
 * 트레이너 일별 스케줄 오버라이드 캐시 스토어 (Pinia)
 *
 * daily_schedule_overrides 테이블 데이터를 Map 기반으로 캐싱.
 * TTL: 10분 (600,000ms) per-key.
 *
 * 캐시 key 패턴:
 *   ${trainerId}-${month}  — 트레이너별 월별 오버라이드 목록
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useScheduleOverridesStore = defineStore('scheduleOverrides', () => {
  const _cache = ref(new Map())
  const _dirty = ref(false)

  function _isStale(key, ttlMs = 600000) {
    if (_dirty.value) return true
    const entry = _cache.value.get(key)
    if (!entry) return true
    return Date.now() - entry.lastFetchedAt > ttlMs
  }

  async function loadOverrides(trainerId, month, force = false) {
    const key = `${trainerId}-${month}`
    if (!force && !_isStale(key)) return _cache.value.get(key).data

    const startDate = `${month}-01`
    const [year, mon] = month.split('-').map(Number)
    const lastDay = new Date(year, mon, 0).getDate()
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('daily_schedule_overrides')
      .select('date, is_working, start_time, end_time, trainer_id')
      .eq('trainer_id', trainerId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')

    if (!error && data) {
      _cache.value.set(key, { data, lastFetchedAt: Date.now() })
      _dirty.value = false
    }
    return data || []
  }

  function getOverridesForMonth(trainerId, month) {
    const key = `${trainerId}-${month}`
    const entry = _cache.value.get(key)
    return entry ? entry.data : []
  }

  function invalidateMonth(trainerId, month) {
    const key = `${trainerId}-${month}`
    _cache.value.delete(key)
  }

  function invalidate() {
    _dirty.value = true
  }

  function $reset() {
    _cache.value = new Map()
    _dirty.value = false
  }

  return {
    loadOverrides,
    getOverridesForMonth,
    invalidateMonth,
    invalidate,
    $reset,
  }
})
