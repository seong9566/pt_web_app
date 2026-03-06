/**
 * 회원 목록 캐시 스토어 (Pinia)
 *
 * 트레이너의 회원 목록을 TTL 기반으로 캐싱하여 불필요한 네트워크 요청 방지.
 * loading/error는 component-local로 유지 — 이 스토어에 포함하지 않음.
 *
 * TTL 기본값: 5분 (300,000ms)
 * 무효화: invalidate() 호출 또는 force=true로 loadMembers() 호출
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export const useMembersStore = defineStore('members', () => {
  const members = ref([])          // 변환된 회원 목록
  const lastFetchedAt = ref(null)  // 마지막 fetch 완료 시각 (Date.now())
  const _dirty = ref(false)        // 외부에서 무효화 플래그 설정 시 true

  /**
   * 캐시가 만료되었는지 확인
   * @param {number} ttlMs TTL (밀리초), 기본 5분
   * @returns {boolean} true면 재조회 필요
   */
  function isStale(ttlMs = 300000) {
    if (!lastFetchedAt.value) return true
    if (_dirty.value) return true
    return Date.now() - lastFetchedAt.value > ttlMs
  }

  /**
   * 회원 목록 로드 — useMembers.js의 fetchMembers 로직과 동일
   * @param {boolean} force true면 TTL 무시하고 강제 재조회
   */
  async function loadMembers(force = false) {
    if (!force && !isStale()) return

    const auth = useAuthStore()
    if (!auth.user?.id) return

    try {
      // 1단계: trainer_members + profiles 조인 조회
      const { data, error: fetchError } = await supabase
        .from('trainer_members')
        .select(`
          member_id,
          connected_at,
          status,
          profiles!trainer_members_member_id_fkey(id, name, photo_url, role)
        `)
        .eq('trainer_id', auth.user.id)
        .eq('status', 'active')

      if (fetchError) {
        console.error('[MembersStore] 회원 목록 조회 에러:', fetchError.message)
        return
      }

      const memberIds = (data || []).map(d => d.member_id)

      // 2단계: pt_sessions 별도 조회 (회원별 PT 이력)
      let ptStats = {}
      if (memberIds.length > 0) {
        const { data: ptData, error: ptError } = await supabase
          .from('pt_sessions')
          .select('member_id, change_amount')
          .eq('trainer_id', auth.user.id)
          .in('member_id', memberIds)

        if (!ptError) {
          for (const pt of (ptData || [])) {
            if (!ptStats[pt.member_id]) {
              ptStats[pt.member_id] = { totalAdded: 0, remaining: 0 }
            }
            ptStats[pt.member_id].remaining += pt.change_amount
            if (pt.change_amount > 0) {
              ptStats[pt.member_id].totalAdded += pt.change_amount
            }
          }
        }
      }

      // 3단계: 클라이언트 사이드 변환 (dotStatus, barColor, group)
      members.value = (data || []).map(d => {
        const profile = d.profiles
        const pt = ptStats[d.member_id] || { totalAdded: 0, remaining: 0 }
        const totalAdded = pt.totalAdded
        const remaining = Math.max(0, pt.remaining)
        const safeTotal = totalAdded > 0 ? totalAdded : 1
        const ratio = totalAdded > 0 ? remaining / totalAdded : 0

        return {
          id: d.member_id,
          name: profile?.name || '이름 없음',
          photo: profile?.photo_url || null,
          sub: `등록일: ${new Date(d.connected_at).toLocaleDateString('ko-KR')}`,
          isToday: false,
          isNew: (Date.now() - new Date(d.connected_at).getTime()) < 7 * 24 * 60 * 60 * 1000,
          dotStatus: remaining > 0 ? 'active' : 'inactive',
          done: remaining,
          total: safeTotal,
          barColor: ratio >= 0.5 ? 'blue' : ratio >= 0.2 ? 'orange' : 'gray',  // 잔여 비율 임계값
          group: remaining > 0 ? 'active' : 'ended',  // active: PT 잔여 있음, ended: 없음
        }
      })

      lastFetchedAt.value = Date.now()
      _dirty.value = false
    } catch (e) {
      console.error('[MembersStore] loadMembers 예외:', e.message || e)
    }
  }

  /** 캐시 무효화 — 다음 loadMembers() 호출 시 강제 재조회 */
  function invalidate() {
    _dirty.value = true
  }

  /** 스토어 상태 전체 초기화 */
  function $reset() {
    members.value = []
    lastFetchedAt.value = null
    _dirty.value = false
  }

  return {
    members,
    lastFetchedAt,
    isStale,
    loadMembers,
    invalidate,
    $reset,
  }
})
