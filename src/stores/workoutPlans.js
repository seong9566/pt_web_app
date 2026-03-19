/**
 * 운동 계획 캐시 스토어 (Pinia)
 *
 * 날짜별 운동 계획을 Map 기반 이중 캐시로 관리. TTL: 5분 (300,000ms).
 *
 * 캐시 구조:
 *   _dayPlansCache: Map<date, { data: Array, lastFetchedAt: number }>
 *     — 특정 날짜의 모든 운동 계획 (id, member_id, reservation_id, exercises, category)
 *   _weeklyCache: Map<reservationId, { category: string|null, lastFetchedAt: number }>
 *     — 주간 카테고리 조회 결과 (TrainerScheduleView용, reservation_id 기반)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export const useWorkoutPlansStore = defineStore('workoutPlans', () => {
  const _dayPlansCache = ref(new Map())
  const _weeklyCache = ref(new Map())
  const _dirty = ref(false)

  function _isStale(cache, key, ttlMs = 300000) {
    if (_dirty.value) return true
    const entry = cache.value.get(key)
    if (!entry) return true
    return Date.now() - entry.lastFetchedAt > ttlMs
  }

  async function loadDayWorkoutPlans(trainerId, date, force = false) {
    if (!force && !_isStale(_dayPlansCache, date)) {
      return _dayPlansCache.value.get(date).data
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .select('id, member_id, reservation_id, exercises, category')
      .eq('trainer_id', trainerId)
      .eq('date', date)

    if (!error && data) {
      _dayPlansCache.value.set(date, { data, lastFetchedAt: Date.now() })
      _dirty.value = false
      return data
    }
    return []
  }

  async function loadWeeklyWorkoutCategories(trainerId, dates, force = false) {
    const auth = useAuthStore()
    if (!auth.user?.id) return

    const datesToFetch = []
    for (const date of dates) {
      const loadedKey = `_loaded_${date}`
      if (force || _isStale(_weeklyCache, loadedKey)) {
        datesToFetch.push(date)
      }
    }

    for (const date of datesToFetch) {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('member_id, category, reservation_id')
        .eq('trainer_id', trainerId)
        .eq('date', date)

      if (!error && data) {
        data.forEach((plan) => {
          if (!plan.reservation_id) return
          const key = plan.reservation_id
          _weeklyCache.value.set(key, {
            category: plan.category,
            lastFetchedAt: Date.now(),
          })
        })
      }

      const loadedKey = `_loaded_${date}`
      _weeklyCache.value.set(loadedKey, {
        category: null,
        lastFetchedAt: Date.now(),
      })
    }

    _dirty.value = false
  }

  function getWeeklyCategory(reservationId) {
    if (!reservationId) return null
    const entry = _weeklyCache.value.get(reservationId)
    return entry ? entry.category : null
  }

  function invalidate() {
    _dirty.value = true
  }

  function $reset() {
    _dayPlansCache.value = new Map()
    _weeklyCache.value = new Map()
    _dirty.value = false
  }

  return {
    loadDayWorkoutPlans,
    loadWeeklyWorkoutCategories,
    getWeeklyCategory,
    invalidate,
    $reset,
  }
})
