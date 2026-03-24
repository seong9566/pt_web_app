import { supabase } from '@/lib/supabase'

export async function getActiveTrainerId(memberId) {
  if (!memberId) return null
  const { data } = await supabase
    .from('trainer_members')
    .select('trainer_id')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .maybeSingle()
  return data?.trainer_id || null
}

export async function isActiveConnection(trainerId, memberId) {
  if (!trainerId || !memberId) return false
  const { data } = await supabase
    .from('trainer_members')
    .select('id')
    .eq('trainer_id', trainerId)
    .eq('member_id', memberId)
    .eq('status', 'active')
    .maybeSingle()
  return !!data
}

export async function isActivePartner(userId, partnerId) {
  if (!userId || !partnerId) return false
  const { data } = await supabase
    .from('trainer_members')
    .select('id')
    .or(`and(trainer_id.eq.${userId},member_id.eq.${partnerId}),and(trainer_id.eq.${partnerId},member_id.eq.${userId})`)
    .eq('status', 'active')
    .maybeSingle()
  return !!data
}

export async function getActiveMemberIds(trainerId) {
  if (!trainerId) return []
  const { data } = await supabase
    .from('trainer_members')
    .select('member_id')
    .eq('trainer_id', trainerId)
    .eq('status', 'active')
  return (data || []).map(d => d.member_id)
}

// 멤버의 연결된 트레이너 프로필 조회 (id, name, photo_url)
// [A1 반영] .limit(1)로 다중 연결 방어
// [R1 반영] 명시적 FK명 사용
export async function getConnectedTrainerProfile(memberId) {
  if (!memberId) return null
  const { data } = await supabase
    .from('trainer_members')
    .select('trainer:profiles!trainer_members_trainer_id_fkey(id, name, photo_url)')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  return data?.trainer || null
}

export async function getActivePartnerIds(userId) {
  if (!userId) return []
  const { data } = await supabase
    .from('trainer_members')
    .select('trainer_id, member_id')
    .or(`trainer_id.eq.${userId},member_id.eq.${userId}`)
    .eq('status', 'active')
  return (data || []).map(d => d.trainer_id === userId ? d.member_id : d.trainer_id)
}
