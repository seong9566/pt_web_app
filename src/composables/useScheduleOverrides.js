/**
 * 트레이너 일별 스케줄 오버라이드 관리 컴포저블
 *
 * daily_schedule_overrides 테이블 CRUD 기능 제공.
 * 특정 날짜의 근무/휴무 오버라이드 설정, 조회, 삭제.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useScheduleOverrides() {
  const overrides = ref([]) // 해당 월의 오버라이드 배열
  const loading = ref(false)
  const error = ref(null)

  /**
   * 월별 오버라이드 목록 조회
   * @param {string} trainerId - 트레이너 ID
   * @param {string} month - 월 필터 (YYYY-MM 형식)
   */
  async function fetchOverrides(trainerId, month) {
    loading.value = true
    error.value = null
    try {
      const startDate = `${month}-01`
      const endDate = `${month}-31`
      const { data, error: err } = await supabase
        .from('daily_schedule_overrides')
        .select('*')
        .eq('trainer_id', trainerId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
      if (err) throw err
      overrides.value = data ?? []
    } catch (e) {
      error.value = e?.message ?? '스케줄 오버라이드를 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /**
   * 오버라이드 설정 (upsert)
   * @param {string} trainerId - 트레이너 ID
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @param {boolean} isWorking - 근무 여부
   * @param {string|null} startTime - 시작 시간 (HH:MM)
   * @param {string|null} endTime - 종료 시간 (HH:MM)
   * @returns {boolean} 성공 여부
   */
  async function setOverride(trainerId, date, isWorking, startTime = null, endTime = null) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('daily_schedule_overrides')
        .upsert(
          { trainer_id: trainerId, date, is_working: isWorking, start_time: startTime, end_time: endTime },
          { onConflict: 'trainer_id,date' }
        )
      if (err) throw err
      // 로컬 상태 동기화
      const newOverride = { trainer_id: trainerId, date, is_working: isWorking, start_time: startTime, end_time: endTime }
      const idx = overrides.value.findIndex((o) => o.date === date)
      if (idx >= 0) {
        overrides.value[idx] = newOverride
      } else {
        overrides.value.push(newOverride)
        overrides.value.sort((a, b) => a.date.localeCompare(b.date))
      }
      return true
    } catch (e) {
      error.value = e?.message ?? '스케줄 오버라이드 설정에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 오버라이드 삭제
   * @param {string} trainerId - 트레이너 ID
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @returns {boolean} 성공 여부
   */
  async function removeOverride(trainerId, date) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('daily_schedule_overrides')
        .delete()
        .eq('trainer_id', trainerId)
        .eq('date', date)
      if (err) throw err
      overrides.value = overrides.value.filter((o) => o.date !== date)
      return true
    } catch (e) {
      error.value = e?.message ?? '스케줄 오버라이드 삭제에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 특정 날짜가 휴무 오버라이드인지 확인 (is_working=false)
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @returns {boolean} 휴무 여부
   */
  function isHoliday(date) {
    const override = overrides.value.find((o) => o.date === date)
    return override?.is_working === false
  }

  /**
   * 특정 날짜의 오버라이드 데이터 반환
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @returns {object|null} 오버라이드 객체 또는 null
   */
  function getOverride(date) {
    return overrides.value.find((o) => o.date === date) ?? null
  }

  /**
   * 특정 날짜의 예약 수 조회 (근무→휴무 변경 전 확인용)
   * @param {string} trainerId - 트레이너 ID
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @returns {number} 예약 건수 (pending + approved)
   */
  async function getReservationCountForDate(trainerId, date) {
    try {
      const { count, error: err } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('trainer_id', trainerId)
        .eq('date', date)
        .in('status', ['pending', 'approved'])
      if (err) throw err
      return count ?? 0
    } catch {
      return 0
    }
  }

  return {
    overrides,
    loading,
    error,
    fetchOverrides,
    setOverride,
    removeOverride,
    isHoliday,
    getOverride,
    getReservationCountForDate,
  }
}
