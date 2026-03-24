/**
 * 운동 계획 관리 컴포저블
 *
 * 트레이너가 회원의 운동 계획을 생성/조회/수정/삭제하는 기능 제공.
 * 날짜별 운동 내용 관리 (UPSERT 패턴).
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useWorkoutPlansStore } from '@/stores/workoutPlans'
import { useNotifications } from '@/composables/useNotifications'

const GENDER_LABELS = { male: '남성', female: '여성' }

export function useWorkoutPlans() {
  const auth = useAuthStore()
  const workoutPlans = ref([])
  const currentPlan = ref(null)
  const dayWorkoutPlans = ref([])
  const memberProfile = ref(null)
  const reservationDates = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * 특정 예약의 운동 계획 조회
   * @param {string} reservationId - 예약 ID
   */
  async function fetchWorkoutPlan(reservationId) {
    if (!reservationId) return
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('workout_plans')
        .select('id, member_id, reservation_id, exercises, category')
        .eq('reservation_id', reservationId)
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
        .select('id, date, exercises, category, reservation_id, member_id')
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
   * 운동 목록 요약 문자열 생성 (알림 body용)
   * @param {Array} exercises - 운동 배열
   * @returns {string}
   */
  function formatExerciseSummary(exercises) {
    if (!exercises || exercises.length === 0) return '운동이 배정되었습니다'
    const first = exercises[0].name
    if (exercises.length === 1) return first
    return `${first} 외 ${exercises.length - 1}개`
  }

   /**
     * 운동 계획 생성/수정 (UPSERT)
     * @param {string} reservationId - 예약 ID
     * @param {string} memberId - 회원 ID
     * @param {string} date - 날짜 (YYYY-MM-DD)
     * @param {Array} exercises - 운동 배열
     */
   async function saveWorkoutPlan(reservationId, memberId, date, exercises, category) {
     loading.value = true
     error.value = null
     try {
         const { data, error: err } = await supabase
           .from('workout_plans')
           .upsert(
             {
              reservation_id: reservationId,
               trainer_id: auth.user.id,
               member_id: memberId,
               date,
               exercises,
               category,
               updated_at: new Date().toISOString(),
             },
            { onConflict: 'reservation_id' }
           )
          .select('id')
          .single()
       if (err) throw err
       const { createNotification } = useNotifications()
       await createNotification(
         memberId,
         'workout_assigned',
         '오늘의 운동이 배정되었습니다',
         formatExerciseSummary(exercises),
         data.id,
         'workout'
       )
        await fetchWorkoutPlan(reservationId)
        useWorkoutPlansStore().invalidate()
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
       useWorkoutPlansStore().invalidate()
       return true
     } catch (e) {
       error.value = e?.message ?? '운동 계획 삭제에 실패했습니다'
       return false
     } finally {
       loading.value = false
     }
   }

  /**
   * 회원 프로필 간략 정보 조회 (이름, 사진, 나이, 성별)
   * @param {string} memberId - 회원 ID
   */
  async function fetchMemberProfile(memberId) {
    try {
      const { data: profileData, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, photo_url')
        .eq('id', memberId)
        .single()
      if (pErr) throw pErr

      const { data: mpData, error: mpErr } = await supabase
        .from('member_profiles')
        .select('age, gender')
        .eq('id', memberId)
        .maybeSingle()
      if (mpErr) throw mpErr

      memberProfile.value = {
        id: profileData.id,
        name: profileData.name || '이름 없음',
        photo: profileData.photo_url || null,
        age: mpData?.age ?? null,
        gender: mpData?.gender ? (GENDER_LABELS[mpData.gender] || mpData.gender) : null,
      }
    } catch (e) {
      memberProfile.value = null
    }
  }

   /**
    * 해당 회원의 예약 날짜/시간 목록 조회 (오늘 이후, approved)
    * @param {string} memberId - 회원 ID
    */
   async function fetchMemberReservationDates(memberId) {
     try {
       const now = new Date()
       const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const { data, error: rErr } = await supabase
          .from('reservations')
          .select('id, date, start_time')
          .eq('trainer_id', auth.user.id)
          .eq('member_id', memberId)
          .in('status', ['approved'])
          .gte('date', today)
         .order('date', { ascending: true })
       if (rErr) throw rErr

      reservationDates.value = (data || [])
        .map((r) => ({
          id: r.id,
          date: r.date,
          start_time: r.start_time?.slice(0, 5) ?? '',
        }))
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    } catch (e) {
      reservationDates.value = []
    }
  }

  async function fetchDayWorkoutPlans(date) {
    try {
      const store = useWorkoutPlansStore()
      const data = await store.loadDayWorkoutPlans(auth.user.id, date)
      dayWorkoutPlans.value = data
    } catch (e) {
      dayWorkoutPlans.value = []
    }
  }

  async function loadWeeklyWorkoutCategories(dates) {
    const store = useWorkoutPlansStore()
    await store.loadWeeklyWorkoutCategories(auth.user.id, dates)
  }

  function getWeeklyCategory(reservationId) {
    const store = useWorkoutPlansStore()
    return store.getWeeklyCategory(reservationId)
  }

  return {
    workoutPlans,
    currentPlan,
    dayWorkoutPlans,
    memberProfile,
    reservationDates,
    loading,
    error,
    fetchWorkoutPlan,
    fetchWorkoutPlans,
    saveWorkoutPlan,
    deleteWorkoutPlan,
    fetchMemberProfile,
    fetchMemberReservationDates,
    fetchDayWorkoutPlans,
    loadWeeklyWorkoutCategories,
    getWeeklyCategory,
  }
}
