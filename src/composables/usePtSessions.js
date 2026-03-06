/**
 * PT 횟수 관리 컴포저블
 *
 * 트레이너가 회원의 PT 횟수를 조회, 추가, 차감하는 기능 제공.
 * 차감 시 남은 횟수보다 많이 차감할 수 없음.
 */

import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { usePtSessionsStore } from '@/stores/ptSessions'

/** PT 횟수 관리 */
export function usePtSessions() {
  const auth = useAuthStore()
  const ptSessionsStore = usePtSessionsStore()

  const ptHistory = ref([])
  const loading = ref(false)
  const error = ref(null)

  /** 잔여 횟수 계산 */
  const remainingCount = computed(() =>
    ptHistory.value.reduce((sum, s) => sum + s.change_amount, 0)
  )

  /** 총 부여 횟수 계산 (양수 변동 합산) */
  const totalCount = computed(() =>
    ptHistory.value.filter(s => s.change_amount > 0).reduce((sum, s) => sum + s.change_amount, 0)
  )

  /** 회원 본인의 PT 이력 조회 (트레이너 ID 필터 없이, 회원 설정 화면용) */
  async function fetchMemberOwnPtCount() {
    loading.value = true
    const data = await ptSessionsStore.loadMemberOwnPtCount(false)
    ptHistory.value = data || []
    loading.value = false
  }

  /** 특정 회원의 PT 횟수 변동 이력 조회 (최신순) */
  async function fetchPtHistory(memberId) {
    loading.value = true
    const data = await ptSessionsStore.loadPtHistory(memberId, false)
    ptHistory.value = data || []
    loading.value = false
  }

  /** 회원의 잔여 횟수 조회 (DB SUM) */
  async function getRemainingCount(memberId) {
    try {
      const { data, error: fetchError } = await supabase
        .from('pt_sessions')
        .select('change_amount')
        .eq('member_id', memberId)
        .eq('trainer_id', auth.user.id)

      if (fetchError) throw fetchError

      return (data || []).reduce((sum, s) => sum + s.change_amount, 0)
    } catch (e) {
      return 0
    }
  }

  /** 트레이너-회원 쌍 기준 잔여 PT 횟수 조회 (회원 홈 뷰용, trainerId 명시 전달) */
  async function fetchRemainingByPair(memberId, trainerId) {
    loading.value = true
    const result = await ptSessionsStore.loadRemainingByPair(memberId, trainerId, false)
    loading.value = false
    return result
  }

  /** PT 횟수 추가 (양수) — sessionDate: YYYY-MM-DD (선택) */
  async function addSessions(memberId, amount, reason = '횟수 추가', sessionDate = null) {
    if (!amount || amount <= 0) {
      error.value = '추가 횟수는 0보다 커야 합니다'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const insertData = {
        trainer_id: auth.user.id,
        member_id: memberId,
        change_amount: amount,
        reason
      }
      if (sessionDate) {
        insertData.created_at = new Date(sessionDate + 'T12:00:00').toISOString()
      }

      const { error: insertError } = await supabase
        .from('pt_sessions')
        .insert(insertData)

      if (insertError) throw insertError

      await fetchPtHistory(memberId)
      return true
    } catch (e) {
      error.value = e?.message ?? 'PT 횟수 추가에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** PT 이력 수정 — id 기반으로 횟수, 사유, 날짜 변경 */
  async function updatePtSession(id, changeAmount, reason, sessionDate = null) {
    loading.value = true
    error.value = null

    try {
      const updateData = { change_amount: changeAmount, reason }
      if (sessionDate) {
        updateData.created_at = new Date(sessionDate + 'T12:00:00').toISOString()
      }

      const { error: updateError } = await supabase
        .from('pt_sessions')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      return true
    } catch (e) {
      error.value = e?.message ?? 'PT 이력 수정에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** PT 횟수 차감 (음수로 저장, 잔여 횟수 검증) */
  async function deductSessions(memberId, amount, reason = '횟수 차감') {
    if (!amount || amount <= 0) {
      error.value = '차감 횟수는 0보다 커야 합니다'
      return false
    }

    const remaining = await getRemainingCount(memberId)
    if (remaining < amount) {
      error.value = '남은 횟수보다 많이 차감할 수 없습니다'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const { error: insertError } = await supabase
        .from('pt_sessions')
        .insert({
          trainer_id: auth.user.id,
          member_id: memberId,
          change_amount: -amount,
          reason
        })

      if (insertError) throw insertError

      await fetchPtHistory(memberId)
      return true
    } catch (e) {
      error.value = e?.message ?? 'PT 횟수 차감에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    ptHistory,
    loading,
    error,
    remainingCount,
    totalCount,
    fetchMemberOwnPtCount,
    fetchPtHistory,
    getRemainingCount,
    fetchRemainingByPair,
    addSessions,
    deductSessions,
    updatePtSession,
  }
}
