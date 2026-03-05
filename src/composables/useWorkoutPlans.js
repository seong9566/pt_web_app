/**
 * 운동 계획 관리 컴포저블
 *
 * 트레이너가 회원의 운동 계획을 생성/조회/수정/삭제하는 기능 제공.
 * 날짜별 운동 내용 관리 (UPSERT 패턴).
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useWorkoutPlans() {
  const auth = useAuthStore()
  const workoutPlans = ref([])
  const currentPlan = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * 특정 날짜의 운동 계획 조회
   * @param {string} memberId - 회원 ID
   * @param {string} date - 날짜 (YYYY-MM-DD)
   */
  async function fetchWorkoutPlan(memberId, date) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('member_id', memberId)
        .eq('date', date)
        .maybeSingle()
      if (err) throw err
      currentPlan.value = data
    } catch (e) {
      error.value = e?.message ?? '운동 계획을 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /**
   * 회원의 전체 운동 계획 조회 (최신순)
   * @param {string} memberId - 회원 ID
   */
  async function fetchWorkoutPlans(memberId) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('member_id', memberId)
        .order('date', { ascending: false })
      if (err) throw err
      workoutPlans.value = data ?? []
    } catch (e) {
      error.value = e?.message ?? '운동 계획 목록을 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /**
   * 운동 계획 생성/수정 (UPSERT)
   * @param {string} memberId - 회원 ID
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @param {string} content - 운동 내용
   */
  async function saveWorkoutPlan(memberId, date, content) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('workout_plans')
        .upsert(
          {
            trainer_id: auth.user.id,
            member_id: memberId,
            date,
            content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'trainer_id,member_id,date' }
        )
      if (err) throw err
      await fetchWorkoutPlan(memberId, date)
      return true
    } catch (e) {
      error.value = e?.message ?? '운동 계획 저장에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 운동 계획 삭제
   * @param {string} planId - 운동 계획 ID
   */
  async function deleteWorkoutPlan(planId) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', planId)
      if (err) throw err
      workoutPlans.value = workoutPlans.value.filter((p) => p.id !== planId)
      return true
    } catch (e) {
      error.value = e?.message ?? '운동 계획 삭제에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    workoutPlans,
    currentPlan,
    loading,
    error,
    fetchWorkoutPlan,
    fetchWorkoutPlans,
    saveWorkoutPlan,
    deleteWorkoutPlan,
  }
}
