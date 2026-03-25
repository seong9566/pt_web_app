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

    if (datesToFetch.length > 0) {
      // 단일 쿼리로 여러 날짜 한번에 조회 (N RTT → 1 RTT)
      const { data, error } = await supabase
        .from('workout_plans')
        .select('member_id, category, reservation_id, date')
        .eq('trainer_id', trainerId)
        .in('date', datesToFetch)

      const now = Date.now()

      if (!error && data) {
        // 응답 데이터를 reservation_id 기반으로 캐시에 저장
        data.forEach((plan) => {
          if (!plan.reservation_id) return
          _weeklyCache.value.set(plan.reservation_id, {
            category: plan.category,
            lastFetchedAt: now,
          })
        })
      }

      // 결과 유무와 관계없이 조회한 모든 날짜에 _loaded 마커 설정
      // (누락 시 해당 날짜가 stale로 판단돼 매번 재조회됨)
      datesToFetch.forEach((date) => {
        _weeklyCache.value.set(`_loaded_${date}`, {
          category: null,
          lastFetchedAt: now,
        })
      })
    }

    _dirty.value = false
  }

  function getWeeklyCategory(reservationId) {
    if (!reservationId) return null
    const entry = _weeklyCache.value.get(reservationId)
    return entry ? entry.category : null
  }

  /** _dayPlansCache에서 reservation_id로 운동 계획 조회 (캐시 히트 전용) */
  function getPlanByReservationId(reservationId) {
    if (!reservationId) return null
    for (const entry of _dayPlansCache.value.values()) {
      const plan = entry.data?.find((p) => p.reservation_id === reservationId)
      if (plan) return plan
    }
    return null
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
    getPlanByReservationId,
    invalidate,
    $reset,
  }
})
