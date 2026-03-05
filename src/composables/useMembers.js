/**
 * 트레이너의 회원 목록 관리 컴포저블
 *
 * trainer_members 테이블에서 연결된 회원을 조회하고,
 * 각 회원의 예약 통계(완료/전체)를 계산하여 UI 형태로 변환.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/** 트레이너에 연결된 활성 회원 목록 + 예약 통계 조회 */
export function useMembers() {
  const members = ref([])
  const loading = ref(false)
  const error = ref(null)

  /** 트레이너에 연결된 활성 회원 목록 + 예약 통계 조회 */
  async function fetchMembers() {
    const auth = useAuthStore()
    loading.value = true
    error.value = null

    try {
      // trainer_members에서 현재 트레이너에 연결된 활성 회원 조회
      // JOIN: profiles (name, photo_url)
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
        error.value = fetchError.message
        return
      }

      const memberIds = (data || []).map(d => d.member_id)

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
          barColor: ratio >= 0.5 ? 'blue' : ratio >= 0.2 ? 'orange' : 'gray',
          group: remaining > 0 ? 'active' : 'ended',
        }
      })
    } catch (e) {
      error.value = e.message || '회원 목록을 불러오는 중 오류가 발생했습니다.'
    } finally {
      loading.value = false
    }
  }

  return { members, loading, error, fetchMembers }
}
