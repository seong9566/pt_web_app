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

export async function getActivePartnerIds(userId) {
  if (!userId) return []
  const { data } = await supabase
    .from('trainer_members')
    .select('trainer_id, member_id')
    .or(`trainer_id.eq.${userId},member_id.eq.${userId}`)
    .eq('status', 'active')
  return (data || []).map(d => d.trainer_id === userId ? d.member_id : d.trainer_id)
}
