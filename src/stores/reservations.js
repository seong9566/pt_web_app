/**
 * 예약 데이터 Pinia 캐시 스토어 (TTL 5분)
 *
 * 예약 목록을 전역으로 캐싱하여 불필요한 네트워크 요청을 줄임.
 * TTL(기본 5분) 또는 dirty 상태일 때만 Supabase에서 재조회.
 *
 * 상태: reservations(예약 목록), lastFetchedAt(마지막 조회 시각), _dirty(무효화 플래그)
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/** HH:MM:SS → HH:MM 형식으로 변환 */
function trimSeconds(timeStr) {
  if (!timeStr) return '00:00'
  return timeStr.slice(0, 5)
}

/** 예약 상태 → 표시 텍스트 매핑 (레거시 폴백 포함) */
const STATUS_DISPLAY = {
  scheduled: '배정됨',
  confirmed: '배정됨',
  change_requested: '변경요청',
  completed: '완료',
  cancelled: '취소됨',
  // 레거시 폴백 (DB에 남아있을 수 있는 구버전 데이터)
  pending: '배정됨',
  approved: '확정됨',
  rejected: '변경됨',
}

export const useReservationsStore = defineStore('reservations', () => {
  const reservations = ref([])         // 예약 목록 캐시
  const lastFetchedAt = ref(null)      // 마지막 조회 타임스탬프 (Date.now())
  const _dirty = ref(false)            // 캐시 무효화 플래그

  /**
   * 캐시가 만료되었는지 확인
   * @param {number} ttlMs 유효 시간 (ms). 기본 5분.
   */
  function isStale(ttlMs = 300000) {
    if (!lastFetchedAt.value) return true
    if (_dirty.value) return true
    return Date.now() - lastFetchedAt.value > ttlMs
  }

  /**
   * 예약 목록 로드 (캐시 미만료 시 스킵)
   * @param {'trainer'|'member'} role 현재 사용자 역할
   * @param {boolean} force true면 TTL/dirty 무관하게 강제 재조회
   */
  async function loadReservations(role, force = false) {
    if (!force && !isStale()) return

    const auth = useAuthStore()
    if (!auth.user?.id) return

    const filterColumn = role === 'trainer' ? 'trainer_id' : 'member_id'

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        trainer_id,
        member_id,
        date,
        start_time,
        end_time,
        status,
        session_type,
        rejection_reason,
        change_reason,
        requested_date,
        requested_start_time,
        requested_end_time,
        created_at,
        trainer_profile:trainer_id(name, photo_url),
        member_profile:member_id(name, photo_url)
      `)
      .eq(filterColumn, auth.user.id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: true })

    if (!error && data) {
      reservations.value = data.map((item) => {
        const isTrainer = role === 'trainer'
        const partnerProfile = isTrainer ? item.member_profile : item.trainer_profile

        return {
          id: item.id,
          trainer_id: item.trainer_id,
          member_id: item.member_id,
          date: item.date,
          start_time: trimSeconds(item.start_time),
          end_time: trimSeconds(item.end_time),
          status: item.status,
          session_type: item.session_type,
          created_at: item.created_at,
          rejection_reason: item.rejection_reason ?? null,
          change_reason: item.change_reason ?? null,
          requested_date: item.requested_date ?? null,
          requested_start_time: item.requested_start_time ?? null,
          requested_end_time: item.requested_end_time ?? null,
          partner_name: partnerProfile?.name ?? '이름 없음',
          partner_photo: partnerProfile?.photo_url ?? null,
        }
      })
      lastFetchedAt.value = Date.now()
      _dirty.value = false
    }
  }

  /** 캐시 무효화 — 다음 loadReservations 호출 시 강제 재조회 */
  function invalidate() {
    _dirty.value = true
  }

  /** 상태 전체 초기화 */
  function $reset() {
    reservations.value = []
    lastFetchedAt.value = null
    _dirty.value = false
  }

  return { reservations, lastFetchedAt, isStale, loadReservations, invalidate, $reset }
})

export { STATUS_DISPLAY }
