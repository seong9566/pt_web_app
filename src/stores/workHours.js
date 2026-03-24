/**
 * 트레이너 근무시간 Pinia 캐시 스토어 (TTL 10분)
 *
 * 트레이너의 요일별 근무시간 설정을 전역으로 캐싱하여 불필요한 네트워크 요청을 줄임.
 * TTL(기본 10분) 또는 dirty 상태일 때만 Supabase에서 재조회.
 *
 * 상태: days(요일별 근무시간), selectedUnit(슬롯 단위), lastFetchedAt(마지막 조회 시각), _dirty(무효화 플래그)
 */

import { defineStore } from 'pinia'
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

/** 기본 근무시간 배열 생성 (모든 요일 비활성화, 09:00-18:00) */
function buildDefaultDays() {
  return [
    { id: 'sun', label: '일요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'mon', label: '월요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'tue', label: '화요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'wed', label: '수요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'thu', label: '목요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'fri', label: '금요일', enabled: false, start: '09:00', end: '18:00' },
    { id: 'sat', label: '토요일', enabled: false, start: '09:00', end: '18:00' },
  ]
}

/** HH:MM:SS → HH:MM 형식으로 변환 */
function trimSeconds(timeStr) {
  if (!timeStr) return '09:00'
  return timeStr.slice(0, 5)
}

export const useWorkHoursStore = defineStore('workHours', () => {
  const days = ref(buildDefaultDays())         // 요일별 근무시간 배열
  const selectedUnit = ref(60)                 // 슬롯 단위 (분)
  const lastFetchedAt = ref(null)              // 마지막 조회 타임스탬프 (Date.now())
  const _dirty = ref(false)                    // 캐시 무효화 플래그

  /**
   * 캐시가 만료되었는지 확인
   * @param {number} ttlMs 유효 시간 (ms). 기본 10분.
   */
  function isStale(ttlMs = 600000) {
    if (!lastFetchedAt.value) return true
    if (_dirty.value) return true
    return Date.now() - lastFetchedAt.value > ttlMs
  }

  /**
   * 근무시간 로드 (캐시 미만료 시 스킵)
   * @param {string} trainerId 트레이너 ID (생략 시 현재 사용자)
   * @param {boolean} force true면 TTL/dirty 무관하게 강제 재조회
   */
  async function loadWorkHours(trainerId, force = false) {
    if (!force && !isStale()) return

    const auth = useAuthStore()
    const targetId = trainerId || auth.user?.id
    if (!targetId) return

    const { data, error } = await supabase
      .from('work_schedules')
      .select('day_of_week, is_enabled, start_time, end_time, slot_duration_minutes')
      .eq('trainer_id', targetId)
      .order('day_of_week')

    if (!error && data) {
      if (data.length === 0) {
        days.value = buildDefaultDays()
        selectedUnit.value = 60
      } else {
        // slot_duration_minutes를 첫 번째 레코드에서 가져옴
        selectedUnit.value = data[0].slot_duration_minutes ?? 60

        // DB 데이터를 day_of_week 기준으로 맵 생성
        const dbMap = {}
        for (const row of data) {
          dbMap[row.day_of_week] = row
        }

        // 기본 요일 배열에 DB 데이터 병합
        const uiOrder = [0, 1, 2, 3, 4, 5, 6] // 일~토
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
      }

      lastFetchedAt.value = Date.now()
      _dirty.value = false
    }
  }

  /** 캐시 무효화 — 다음 loadWorkHours 호출 시 강제 재조회 */
  function invalidate() {
    _dirty.value = true
  }

  /** 상태 전체 초기화 */
  function $reset() {
    days.value = buildDefaultDays()
    selectedUnit.value = 60
    lastFetchedAt.value = null
    _dirty.value = false
  }

  return { days, selectedUnit, lastFetchedAt, isStale, loadWorkHours, invalidate, $reset }
})
