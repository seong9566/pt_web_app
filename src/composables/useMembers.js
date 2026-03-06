/**
 * 트레이너의 회원 목록 관리 컴포저블
 *
 * members Pinia store에 위임하는 thin wrapper.
 * loading/error는 component-local로 유지 — store에 포함하지 않음.
 */

import { ref } from 'vue'
import { useMembersStore } from '@/stores/members'

/** 트레이너에 연결된 활성 회원 목록 + 예약 통계 조회 */
export function useMembers() {
  const membersStore = useMembersStore()
  const members = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchMembers() {
    loading.value = true
    error.value = null
    try {
      await membersStore.loadMembers(false)
      members.value = membersStore.members
    } catch (e) {
      error.value = e.message || '회원 목록을 불러오는 중 오류가 발생했습니다.'
    } finally {
      loading.value = false
    }
  }

  return { members, loading, error, fetchMembers }
}
