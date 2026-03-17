/**
 * 회원 주간 가능 시간 관리 컴포저블
 *
 * 회원이 트레이너에게 주간 가능 시간을 등록/수정하고,
 * 트레이너가 연결된 회원들의 가능 시간을 일괄 조회하는 기능 제공.
 *
 * 테이블: member_weekly_availability
 * UPSERT 충돌 키: member_id, trainer_id, week_start
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/**
 * 이번 주 월요일 날짜를 YYYY-MM-DD 형식으로 반환
 * 월요일을 주 시작일로 간주 (일요일=0이면 -6, 나머지는 1-day)
 */
function getCurrentWeekMonday() {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0] // YYYY-MM-DD
}

export function useAvailability() {
  const auth = useAuthStore()
  const loading = ref(false)
  const error = ref(null)

  /**
   * 회원의 주간 가능 시간 등록/수정 (UPSERT)
   * 과거 주 제출은 차단됨.
   * 성공 시 트레이너에게 availability_submitted 알림 생성.
   *
   * @param {string} trainerId - 트레이너 사용자 ID
   * @param {string} weekStart - 주 시작일 YYYY-MM-DD (월요일)
   * @param {Object} availableSlots - 요일별 가능 시간대
   *   예: { mon: ['morning', 'afternoon'], tue: [], wed: ['evening'], ... }
   * @param {string|null} memo - 추가 메모 (선택)
   * @returns {boolean} 성공 여부
   */
  async function submitAvailability(trainerId, weekStart, availableSlots, memo = null) {
    loading.value = true
    error.value = null

    try {
      // 과거 주 제출 차단 (이번 주 월요일 이전이면 거부)
      const currentMonday = getCurrentWeekMonday()
      if (weekStart < currentMonday) {
        error.value = '지난 주의 가능 시간은 등록할 수 없습니다.'
        return false
      }

      // 가능 시간 UPSERT
      const { error: upsertError } = await supabase
        .from('member_weekly_availability')
        .upsert(
          {
            member_id: auth.user.id,
            trainer_id: trainerId,
            week_start: weekStart,
            available_slots: availableSlots,
            memo,
          },
          { onConflict: 'member_id,trainer_id,week_start' },
        )

      if (upsertError) throw upsertError

      // 트레이너에게 알림 전송 (실패해도 전체 작업 실패 처리하지 않음)
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: trainerId,
        type: 'availability_submitted',
        title: '가능 시간 등록',
        body: '회원이 이번 주 가능 시간을 등록했습니다.',
        target_id: auth.user.id,
        target_type: 'member',
      })

      if (notifError) {
        console.warn('알림 생성 실패:', notifError.message)
      }

      return true
    } catch (e) {
      error.value = e?.message ?? '가능 시간 등록 중 오류가 발생했습니다.'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 현재 회원의 특정 주 가능 시간 조회
   * 등록 기록이 없으면 null 반환.
   *
   * @param {string} trainerId - 트레이너 사용자 ID
   * @param {string} weekStart - 주 시작일 YYYY-MM-DD
   * @returns {Object|null} 가능 시간 레코드 또는 null
   */
  async function fetchMyAvailability(trainerId, weekStart) {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('member_weekly_availability')
        .select('*')
        .eq('member_id', auth.user.id)
        .eq('trainer_id', trainerId)
        .eq('week_start', weekStart)
        .maybeSingle()

      if (fetchError) throw fetchError

      return data ?? null
    } catch (e) {
      error.value = e?.message ?? '가능 시간을 불러오는 중 오류가 발생했습니다.'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 트레이너 기준 연결된 active 회원 전체의 주간 가능 시간 조회
   * 미등록 회원은 available_slots=null로 포함됨.
   *
   * @param {string} weekStart - 주 시작일 YYYY-MM-DD
   * @returns {Array<{member_id, name, photo_url, available_slots, memo, submitted_at}>}
   */
  async function fetchMemberAvailabilities(weekStart) {
    loading.value = true
    error.value = null

    try {
      console.debug('[useAvailability]', 'fetchMemberAvailabilities called with weekStart:', weekStart)

      // 1단계: 트레이너에 연결된 active 회원 목록 조회
      const { data: members, error: membersError } = await supabase
        .from('trainer_members')
        .select('member_id, profiles!trainer_members_member_id_fkey(name, photo_url)')
        .eq('trainer_id', auth.user.id)
        .eq('status', 'active')

      if (membersError) throw membersError
      if (!members || members.length === 0) return []

      // 2단계: 해당 주의 가능 시간 레코드 일괄 조회
      const memberIds = members.map((m) => m.member_id)
      const { data: availabilities, error: availError } = await supabase
        .from('member_weekly_availability')
        .select('member_id, available_slots, memo, submitted_at')
        .in('member_id', memberIds)
        .eq('week_start', weekStart)

      if (availError) throw availError

      console.debug('[useAvailability]', 'fetchMemberAvailabilities results:', { rows: availabilities?.length ?? 0, details: availabilities?.map(a => ({ member_id: a.member_id, week_start: weekStart })) ?? [] })

      // 3단계: member_id 기준 가용성 맵 생성 후 회원 목록과 병합
      const availMap = {}
      for (const avail of availabilities ?? []) {
        availMap[avail.member_id] = avail
      }

      return members.map((member) => ({
        member_id: member.member_id,
        name: member.profiles?.name ?? '',
        photo_url: member.profiles?.photo_url ?? null,
        available_slots: availMap[member.member_id]?.available_slots ?? null,
        memo: availMap[member.member_id]?.memo ?? null,
        submitted_at: availMap[member.member_id]?.submitted_at ?? null,
      }))
    } catch (e) {
      error.value = e?.message ?? '회원 가능 시간을 불러오는 중 오류가 발생했습니다.'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * 현재 회원의 해당 주 가능 시간 등록 여부 반환
   *
   * @param {string} trainerId - 트레이너 사용자 ID
   * @param {string} weekStart - 주 시작일 YYYY-MM-DD
   * @returns {boolean} 등록되어 있으면 true, 아니면 false
   */
  async function getSubmissionStatus(trainerId, weekStart) {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('member_weekly_availability')
        .select('id')
        .eq('member_id', auth.user.id)
        .eq('trainer_id', trainerId)
        .eq('week_start', weekStart)
        .maybeSingle()

      if (fetchError) throw fetchError

      return data !== null
    } catch (e) {
      error.value = e?.message ?? '등록 상태 확인 중 오류가 발생했습니다.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    submitAvailability,
    fetchMyAvailability,
    fetchMemberAvailabilities,
    getSubmissionStatus,
  }
}
