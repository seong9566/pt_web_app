/**
 * 초대 코드 관리 컴포저블
 *
 * 트레이너의 초대 코드 생성/조회, 회원의 초대 코드 사용(RPC),
 * 최근 연결된 회원 목록 조회 기능 제공.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useInvite() {
  const auth = useAuthStore()

  const inviteCode = ref(null)
  const recentMembers = ref([])
  const loading = ref(false)
  const error = ref(null)

  /** 활성 초대 코드 조회 */
  async function fetchInviteCode() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('trainer_id', auth.user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (fetchError) throw fetchError
      inviteCode.value = data
    } catch (e) {
      error.value = e?.message ?? '초대 코드를 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /** 새로운 초대 코드 생성 (6자리 랜덤 문자열) */
  async function generateInviteCode() {
    if (inviteCode.value) return

    loading.value = true
    error.value = null

    try {
      const code = Array.from({ length: 6 }, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      ).join('')

      const { data, error: insertError } = await supabase
        .from('invite_codes')
        .insert({ trainer_id: auth.user.id, code, is_active: true })
        .select()
        .single()

      if (insertError) throw insertError
      inviteCode.value = data
    } catch (e) {
      error.value = e?.message ?? '초대 코드 생성에 실패했습니다'
    } finally {
      loading.value = false
    }
  }

  /** 초대 코드로 트레이너-회원 연결 (RPC 호출) */
  async function redeemInviteCode(code) {
    loading.value = true
    error.value = null

    try {
      const { data, error: rpcError } = await supabase.rpc('connect_via_invite', {
        p_code: code,
      })

      if (rpcError) throw rpcError
      return data
    } catch (e) {
      error.value = e?.message ?? '초대 코드 인증에 실패했습니다'
      return null
    } finally {
      loading.value = false
    }
  }

  /** 최근 연결된 활성 회원 5명 조회 */
  async function fetchRecentMembers() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('trainer_members')
        .select('member_id, connected_at, profiles!trainer_members_member_id_fkey(name)')
        .eq('trainer_id', auth.user.id)
        .eq('status', 'active')
        .order('connected_at', { ascending: false })
        .limit(5)

      if (fetchError) throw fetchError
      recentMembers.value = data ?? []
    } catch (e) {
      error.value = e?.message ?? '회원 목록을 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  return {
    inviteCode,
    recentMembers,
    loading,
    error,
    fetchInviteCode,
    generateInviteCode,
    redeemInviteCode,
    fetchRecentMembers,
  }
}
