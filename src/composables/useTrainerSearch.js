/**
 * 트레이너 검색 및 연결 컴포저블
 *
 * 트레이너 목록 검색 (profiles + trainer_profiles JOIN),
 * 현재 회원의 연결 상태 확인, 새로운 트레이너 연결 요청 기능 제공.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/** 전문 분야 코드를 한글 라벨로 변환하는 맵 */
const SPECIALTY_LABELS = {
  rehab: '재활/교정',
  strength: '근력 증가',
  diet: '다이어트/식단',
  sports: '스포츠 퍼포먼스',
}

/** 트레이너 검색 및 연결 상태 관리 */
export function useTrainerSearch() {
  const trainers = ref([])
  const loading = ref(false)
  const error = ref(null)

  /** 트레이너 검색 (이름 기반, 연결 상태 포함) */
  async function searchTrainers(query) {
    const auth = useAuthStore()
    loading.value = true
    error.value = null

    try {
      // 1) 트레이너 목록 검색: profiles + trainer_profiles JOIN
      let q = supabase
        .from('profiles')
        .select('id, name, photo_url, trainer_profiles(specialties)')
        .eq('role', 'trainer')

      if (query && query.trim()) {
        q = q.ilike('name', `%${query.trim()}%`)
      }

      const { data, error: fetchError } = await q

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      // 2) 현재 회원의 활성 연결 목록 조회
      let connectedTrainerIds = new Set()

      if (auth.user?.id) {
        const { data: connections, error: connError } = await supabase
          .from('trainer_members')
          .select('trainer_id')
          .eq('member_id', auth.user.id)
          .eq('status', 'active')

        if (connError) {
          error.value = connError.message
          return
        }

        connectedTrainerIds = new Set((connections || []).map(c => c.trainer_id))
      }

      // 3) 기존 목 데이터 형태로 변환
      trainers.value = (data || []).map(d => {
        const rawSpecialties = d.trainer_profiles?.[0]?.specialties || d.trainer_profiles?.specialties || []
        const specialties = (Array.isArray(rawSpecialties) ? rawSpecialties : []).map(
          s => SPECIALTY_LABELS[s] || s
        )

        return {
          id: d.id,
          name: `${d.name || '이름 없음'} 트레이너`,
          specialties,
          connected: connectedTrainerIds.has(d.id),
        }
      })
    } catch (e) {
      error.value = e.message || '트레이너 검색 중 오류가 발생했습니다.'
    } finally {
      loading.value = false
    }
  }

  /** 특정 트레이너에 연결 요청 (status='pending') */
  async function requestConnection(trainerId) {
    const auth = useAuthStore()
    loading.value = true
    error.value = null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase
        .from('trainer_members')
        .insert({ trainer_id: trainerId, member_id: user.id, status: 'pending' })
      if (err) throw err
      return true
    } catch (e) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  /** 트레이너가 받은 대기 중 연결 요청 목록 */
  async function fetchPendingRequests() {
    loading.value = true
    error.value = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: err } = await supabase
        .from('trainer_members')
        .select('*, member:profiles!member_id(id, name, photo_url)')
        .eq('trainer_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (err) throw err
      return data || []
    } catch (e) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  /** pending → active 상태로 변경 */
  async function approveConnection(connectionId) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('trainer_members')
        .update({ status: 'active' })
        .eq('id', connectionId)
        .eq('status', 'pending')
      if (err) throw err
      return true
    } catch (e) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  /** pending 상태의 연결 요청 삭제 */
  async function rejectConnection(connectionId) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('trainer_members')
        .delete()
        .eq('id', connectionId)
        .eq('status', 'pending')
      if (err) throw err
      return true
    } catch (e) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  return { trainers, loading, error, searchTrainers, requestConnection, fetchPendingRequests, approveConnection, rejectConnection }
}
