/**
 * 회원 상세 정보 및 메모 관리 컴포저블
 *
 * 회원의 프로필, 연결 정보, 예약 통계 조회,
 * 메모 CRUD(생성/조회/삭제) 기능 제공.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/** 회원 상세 정보 및 메모 관리 */
export function useMemos() {
  const auth = useAuthStore()

  const member = ref(null)
  const memos = ref([])
  const loading = ref(false)
  const error = ref(null)

  /** YYYY-MM-DD → YYYY.MM.DD 형식으로 변환 */
  function formatDate(dateStr) {
    if (!dateStr) return null
    const d = new Date(dateStr)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}.${mm}.${dd}`
  }

  /** YYYY-MM-DD와 HH:MM:SS → YYYY.MM.DD HH:MM 형식으로 변환 */
  function formatDateTime(dateStr, timeStr) {
    if (!dateStr) return null
    const yyyy = dateStr.slice(0, 4)
    const mm = dateStr.slice(5, 7)
    const dd = dateStr.slice(8, 10)
    const time = timeStr ? timeStr.slice(0, 5) : '00:00'
    return `${yyyy}.${mm}.${dd} ${time}`
  }

  /** YYYY-MM-DD → YYYY년 MM월 DD일 형식으로 변환 */
  function formatKoreanDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const yyyy = d.getFullYear()
    const mm = d.getMonth() + 1
    const dd = d.getDate()
    return `${yyyy}년 ${mm}월 ${dd}일`
  }

  /** ISO 날짜시간 → 오전/오후 HH:MM 형식으로 변환 */
  function formatKoreanTime(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const period = hours < 12 ? '오전' : '오후'
    if (hours === 0) hours = 12
    else if (hours > 12) hours -= 12
    return `${period} ${hours}:${minutes}`
  }

  /** 회원의 프로필, 연결 정보, 최근/다음 예약 조회 */
  async function fetchMemberDetail(memberId) {
    loading.value = true
    error.value = null

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, photo_url')
        .eq('id', memberId)
        .single()

      if (profileError) throw profileError

      // Fetch member_profiles for goals (summary)
      const { data: memberProfile, error: mpError } = await supabase
        .from('member_profiles')
        .select('goals')
        .eq('id', memberId)
        .maybeSingle()

      if (mpError) throw mpError

      // Fetch trainer_members for connection info
      const { data: trainerMember, error: tmError } = await supabase
        .from('trainer_members')
        .select('connected_at, status')
        .eq('trainer_id', auth.user.id)
        .eq('member_id', memberId)
        .maybeSingle()

      if (tmError) throw tmError

      // Fetch last completed reservation
      const { data: lastVisitData, error: lvError } = await supabase
        .from('reservations')
        .select('date')
        .eq('trainer_id', auth.user.id)
        .eq('member_id', memberId)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lvError) throw lvError

      // Fetch next approved/pending reservation
      const { data: nextSessionData, error: nsError } = await supabase
        .from('reservations')
        .select('date, start_time')
        .eq('trainer_id', auth.user.id)
        .eq('member_id', memberId)
        .in('status', ['approved', 'pending'])
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nsError) throw nsError

      member.value = {
        id: profileData.id,
        name: profileData.name,
        photo_url: profileData.photo_url,
        summary: memberProfile?.goals ?? null,
        lastVisit: formatDate(lastVisitData?.date),
        nextSession: formatDateTime(nextSessionData?.date, nextSessionData?.start_time),
      }
    } catch (e) {
      error.value = e?.message ?? '회원 정보를 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /** 특정 회원의 메모 목록 조회 (최신순) */
  async function fetchMemos(memberId) {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('memos')
        .select('*')
        .eq('trainer_id', auth.user.id)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      memos.value = (data ?? []).map((memo, index) => ({
        id: memo.id,
        content: memo.content,
        tags: Array.isArray(memo.tags) ? memo.tags : [],
        date: formatKoreanDate(memo.created_at),
        time: formatKoreanTime(memo.created_at),
        dotColor: index === 0 ? 'blue' : 'gray',
      }))
    } catch (e) {
      error.value = e?.message ?? '메모를 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /** 메모 생성 */
  async function createMemo(memberId, content, tags) {
    loading.value = true
    error.value = null
    try {
      const { error: insertError } = await supabase
        .from('memos')
        .insert({ trainer_id: auth.user.id, member_id: memberId, content, tags })
      if (insertError) throw insertError
      return true
    } catch (e) {
      error.value = e?.message ?? '메모 저장에 실패했습니다.'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 메모 삭제 */
  async function deleteMemo(memoId) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('memos')
        .delete()
        .eq('id', memoId)

      if (deleteError) throw deleteError

      memos.value = memos.value.filter((m) => m.id !== memoId)
    } catch (e) {
      error.value = e?.message ?? '메모 삭제에 실패했습니다'
    } finally {
      loading.value = false
    }
  }

  /** 회원 본인의 메모 목록 조회 (읽기 전용) */
  async function getMemberMemos() {
    loading.value = true
    error.value = null
    try {
      const me = auth.user?.id
      if (!me) { memos.value = []; return }
      
      const { data, error: fetchError } = await supabase
        .from('memos')
        .select('*')
        .eq('member_id', me)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      memos.value = (data ?? []).map((memo, index) => ({
        id: memo.id,
        content: memo.content,
        tags: Array.isArray(memo.tags) ? memo.tags : [],
        date: formatKoreanDate(memo.created_at),
        time: formatKoreanTime(memo.created_at),
        dotColor: index === 0 ? 'blue' : 'gray',
      }))
    } catch (e) {
      error.value = e?.message ?? '메모를 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  return {
    member,
    memos,
    loading,
    error,
    fetchMemberDetail,
    fetchMemos,
    createMemo,
    deleteMemo,
    getMemberMemos,
  }
}
