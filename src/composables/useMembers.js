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
      // JOIN: profiles (name, photo_url), member_profiles (goals)
      const { data, error: fetchError } = await supabase
        .from('trainer_members')
        .select(`
          member_id,
          connected_at,
          status,
          profiles:member_id (id, name, photo_url, role),
          member_profiles:member_id (goals)
        `)
        .eq('trainer_id', auth.user.id)
        .eq('status', 'active')

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      // 각 회원의 예약 통계 조회
      const memberIds = (data || []).map(d => d.member_id)

      let reservationStats = {}
      if (memberIds.length > 0) {
        const { data: reservations, error: reservError } = await supabase
          .from('reservations')
          .select('member_id, status')
          .eq('trainer_id', auth.user.id)
          .in('member_id', memberIds)

        if (reservError) {
          error.value = reservError.message
          return
        }

        // 회원별 집계
        for (const r of (reservations || [])) {
          if (!reservationStats[r.member_id]) {
            reservationStats[r.member_id] = { done: 0, total: 0 }
          }
          reservationStats[r.member_id].total++
          if (r.status === 'completed') reservationStats[r.member_id].done++
        }
      }

      // 기존 목 데이터 형태로 변환
      members.value = (data || []).map(d => {
        const profile = d.profiles
        const stats = reservationStats[d.member_id] || { done: 0, total: 0 }
        const total = stats.total > 0 ? stats.total : 1 // 0으로 나누기 방지
        const ratio = stats.total > 0 ? stats.done / stats.total : 0

        return {
          id: d.member_id,
          name: profile?.name || '이름 없음',
          photo: profile?.photo_url || null,
          sub: `등록일: ${new Date(d.connected_at).toLocaleDateString('ko-KR')}`,
          isToday: false,
          isNew: (Date.now() - new Date(d.connected_at).getTime()) < 7 * 24 * 60 * 60 * 1000,
          dotStatus: stats.total > 0 ? 'active' : 'inactive',
          done: stats.done,
          total,
          barColor: ratio >= 0.7 ? 'blue' : ratio >= 0.3 ? 'orange' : 'gray',
          group: 'active',
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
