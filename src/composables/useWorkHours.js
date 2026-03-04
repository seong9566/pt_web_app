/**
 * 트레이너 근무시간 관리 컴포저블
 *
 * 요일별 근무시간 설정 조회/저장 (UPSERT),
 * 예약 슬롯 단위 시간 관리 기능 제공.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/** 요일 번호(0-6)를 UI 형식(id, label)으로 변환하는 맵 */
const DAY_MAP_TO_UI = {
  0: { id: 'sun', label: '일요일' },
  1: { id: 'mon', label: '월요일' },
  2: { id: 'tue', label: '화요일' },
  3: { id: 'wed', label: '수요일' },
  4: { id: 'thu', label: '목요일' },
  5: { id: 'fri', label: '금요일' },
  6: { id: 'sat', label: '토요일' },
}

/** UI 요일 ID(mon, tue, ...)를 요일 번호(0-6)로 변환하는 맵 */
const DAY_ID_TO_NUM = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

/** 기본 근무시간 배열 생성 (모든 요일 비활성화, 09:00-18:00) */
function buildDefaultDays() {
  return [
    { id: 'mon', label: '월요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'tue', label: '화요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'wed', label: '수요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'thu', label: '목요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'fri', label: '금요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'sat', label: '토요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'sun', label: '일요일', enabled: false, start: '09:00', end: '18:00' },
  ]
}

/** HH:MM:SS → HH:MM 형식으로 변환 */
function trimSeconds(timeStr) {
  if (!timeStr) return '09:00'
  return timeStr.slice(0, 5)
}

/** 트레이너의 요일별 근무시간 설정 조회 */
export function useWorkHours() {
  const days = ref(buildDefaultDays())
  const selectedUnit = ref(60)
  const loading = ref(false)
  const error = ref(null)

  /** DB에서 근무시간 설정 조회 및 UI 형식으로 변환 */
  async function fetchWorkHours() {
    const auth = useAuthStore()
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('trainer_id', auth.user.id)
        .order('day_of_week')

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      if (!data || data.length === 0) {
        days.value = buildDefaultDays()
        selectedUnit.value = 60
        return
      }

      // slot_duration_minutes를 첫 번째 레코드에서 가져옴
      selectedUnit.value = data[0].slot_duration_minutes ?? 60

      // DB 데이터를 day_of_week 기준으로 맵 생성
      const dbMap = {}
      for (const row of data) {
        dbMap[row.day_of_week] = row
      }

      // 기본 요일 배열에 DB 데이터 병합
      const uiOrder = [1, 2, 3, 4, 5, 6, 0] // 월~토,일
      days.value = uiOrder.map(dow => {
        const info = DAY_MAP_TO_UI[dow]
        const row = dbMap[dow]
        if (row) {
          return {
            id: info.id,
            label: info.label,
            enabled: row.is_enabled,
            start: trimSeconds(row.start_time),
            end: trimSeconds(row.end_time),
          }
        }
        return {
          id: info.id,
          label: info.label,
          enabled: false,
          start: '09:00',
          end: '18:00',
        }
      })
    } catch (e) {
      error.value = e.message || '근무시간을 불러오는 중 오류가 발생했습니다.'
    } finally {
      loading.value = false
    }
  }

  /** 근무시간 설정 저장 (요일별 UPSERT) */
  async function saveWorkHours(daysList, unit) {
    const auth = useAuthStore()
    loading.value = true
    error.value = null

    try {
      const records = daysList.map(d => ({
        trainer_id: auth.user.id,
        day_of_week: DAY_ID_TO_NUM[d.id],
        start_time: d.start,
        end_time: d.end,
        is_enabled: d.enabled,
        slot_duration_minutes: unit,
      }))

      const { error: upsertError } = await supabase
        .from('work_schedules')
        .upsert(records, { onConflict: 'trainer_id,day_of_week' })

      if (upsertError) {
        error.value = upsertError.message
        return false
      }

      return true
    } catch (e) {
      error.value = e.message || '근무시간 저장 중 오류가 발생했습니다.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { days, selectedUnit, loading, error, fetchWorkHours, saveWorkHours }
}
