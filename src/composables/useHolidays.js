/**
 * 트레이너 휴무일 관리 컴포저블
 *
 * 트레이너의 휴무일 설정/조회/삭제 기능 제공.
 * 월별 필터링 및 특정 날짜 휴무 여부 확인 기능.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useHolidays() {
  const auth = useAuthStore()
  const holidays = ref([]) // array of date strings 'YYYY-MM-DD'
  const loading = ref(false)
  const error = ref(null)

  /**
   * 휴무일 목록 조회
   * @param {string} trainerId - 트레이너 ID
   * @param {string} month - 월 필터 (YYYY-MM 형식, 선택사항)
   */
  async function fetchHolidays(trainerId, month = null) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('trainer_holidays')
        .select('date')
        .eq('trainer_id', trainerId)
        .order('date')

      if (month) {
        // month 형식: YYYY-MM
        const startDate = `${month}-01`
        const endDate = `${month}-31`
        query = query.gte('date', startDate).lte('date', endDate)
      }

      const { data, error: err } = await query
      if (err) throw err
      holidays.value = (data ?? []).map((h) => h.date)
    } catch (e) {
      error.value = e?.message ?? '휴무일을 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /**
   * 휴무일 설정
   * @param {string} date - 날짜 (YYYY-MM-DD)
   */
  async function setHoliday(date) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('trainer_holidays')
        .insert({ trainer_id: auth.user.id, date })
      if (err) throw err
      if (!holidays.value.includes(date)) {
        holidays.value.push(date)
        holidays.value.sort()
      }
      return true
    } catch (e) {
      error.value = e?.message ?? '휴무일 설정에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 휴무일 해제
   * @param {string} date - 날짜 (YYYY-MM-DD)
   */
  async function removeHoliday(date) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('trainer_holidays')
        .delete()
        .eq('trainer_id', auth.user.id)
        .eq('date', date)
      if (err) throw err
      holidays.value = holidays.value.filter((d) => d !== date)
      return true
    } catch (e) {
      error.value = e?.message ?? '휴무일 해제에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 특정 날짜 휴무 여부 확인
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @returns {boolean} 휴무 여부
   */
  function isHoliday(date) {
    return holidays.value.includes(date)
  }

  return {
    holidays,
    loading,
    error,
    fetchHolidays,
    setHoliday,
    removeHoliday,
    isHoliday,
  }
}
