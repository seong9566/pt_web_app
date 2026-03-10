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

  /** 6자리 랜덤 코드 문자열 생성 */
  function _makeCode() {
    return Array.from({ length: 6 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('')
  }

  /** 새로운 초대 코드 생성 (충돌 시 최대 3회 재시도) */
  async function generateInviteCode() {
    if (inviteCode.value) return

    loading.value = true
    error.value = null

    const MAX_RETRIES = 3
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const code = _makeCode()
        const { data, error: insertError } = await supabase
          .from('invite_codes')
          .insert({ trainer_id: auth.user.id, code, is_active: true })
          .select()
          .single()

        if (insertError) {
          // 409 = code UNIQUE 제약 위반 → 다른 코드로 재시도
          if (insertError.code === '23505' && attempt < MAX_RETRIES - 1) continue
          throw insertError
        }
        inviteCode.value = data
        return
      } catch (e) {
        if (attempt === MAX_RETRIES - 1) {
          error.value = e?.message ?? '초대 코드 생성에 실패했습니다'
        }
      }
    }
    loading.value = false
  }

  /** RPC 에러 메시지 → 한국어 변환 */
  const _rpcErrorMap = {
    'Authentication required': '로그인이 필요합니다. 다시 로그인해주세요.',
    'Invalid invite code': '유효하지 않은 초대 코드입니다.',
    'Trainer and member cannot be the same user': '트레이너 본인의 코드는 사용할 수 없습니다.',
    'Only member accounts can use invite codes': '회원 계정만 초대 코드를 사용할 수 있습니다.',
    'Invite code owner is not a trainer': '초대 코드 소유자가 트레이너가 아닙니다.',
    'Member already has an active trainer connection': '이미 연결된 트레이너가 있습니다.',
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
      const rawMsg = e?.message ?? ''
      error.value = _rpcErrorMap[rawMsg] ?? '초대 코드 인증에 실패했습니다'
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
        .select('member_id, connected_at, profiles!trainer_members_member_id_fkey(name, photo_url)')
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

  /** 초대 코드 유효성 검증 + 트레이너 정보 조회 */
  async function validateInviteCode(code) {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('invite_codes')
        .select('id, code, trainer_id, is_active, profiles!invite_codes_trainer_id_fkey(name, photo_url)')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (!data) {
        error.value = '유효하지 않은 초대 코드입니다.'
        return null
      }

      return {
        trainerId: data.trainer_id,
        trainerName: data.profiles?.name || '트레이너',
        trainerPhoto: data.profiles?.photo_url || null,
      }
    } catch (e) {
      error.value = e?.message ?? '코드 확인에 실패했습니다'
      return null
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
    validateInviteCode,
    redeemInviteCode,
    fetchRecentMembers,
  }
}
