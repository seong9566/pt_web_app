/**
 * 프로필 이미지 관리 컴포저블
 *
 * Supabase Storage의 avatars 버킷에 프로필 이미지 업로드,
 * 프로필 테이블의 photo_url 업데이트 기능 제공.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'

/** 프로필 이미지 업로드 및 URL 업데이트 */
export function useProfile() {
  const auth = useAuthStore()
  const { createNotification } = useNotifications()
  const uploading = ref(false)
  const error = ref(null)

  /** 이미지 파일을 Supabase Storage에 업로드하고 공개 URL 반환 */
  async function uploadAvatar(file) {
    uploading.value = true
    error.value = null

    try {
      const ext = file.name.split('.').pop()
      const filePath = `${auth.user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        error.value = uploadError.message
        return null
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (e) {
      error.value = e?.message ?? '이미지 업로드에 실패했습니다.'
      return null
    } finally {
      uploading.value = false
    }
  }

  /** 프로필의 photo_url 필드 업데이트 */
  async function updateProfilePhoto(url) {
    error.value = null

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: url })
      .eq('id', auth.user.id)

    if (updateError) {
      error.value = updateError.message
    }
  }

  /** 트레이너 프로필 저장 (이름 + 전문 분야) */
  async function saveTrainerProfile(userId, name, specialties) {
    uploading.value = true
    error.value = null

    try {
      // profiles 테이블에 name 저장
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', userId)

      if (profileError) {
        throw profileError
      }

      // trainer_profiles 테이블에 specialties 저장
      const { error: trainerError } = await supabase
        .from('trainer_profiles')
        .upsert({
          id: userId,
          specialties: specialties,
        })

      if (trainerError) {
        throw trainerError
      }

      return true
    } catch (e) {
      error.value = e?.message ?? '프로필 저장에 실패했습니다. 다시 시도해주세요.'
      return false
    } finally {
      uploading.value = false
    }
  }

  /** 역할 저장 (profiles 테이블에 role 업데이트) */
  async function saveRole(userId, role) {
    uploading.value = true
    error.value = null

    try {
      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({ id: userId, role: role, name: '', phone: '' })

      if (saveError) {
        throw saveError
      }

      return true
    } catch (e) {
      error.value = e?.message ?? '역할 저장에 실패했습니다. 다시 시도해주세요.'
      return false
    } finally {
      uploading.value = false
    }
  }

  /** 트레이너 프로필 수정 (이름, 전문 분야, 소개글) */
  async function updateTrainerProfile(name, specialties = [], bio = null, phone = null) {
    if (!name || !name.trim()) {
      error.value = '이름을 입력해주세요'
      return false
    }
    uploading.value = true
    error.value = null
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('인증이 필요합니다')

      const profileUpdate = { name: name.trim() }
      if (phone !== undefined) profileUpdate.phone = phone

      const { error: profileErr } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)
      if (profileErr) throw profileErr

      const { error: trainerErr } = await supabase
        .from('trainer_profiles')
        .upsert({ id: userId, specialties, bio }, { onConflict: 'id' })
      if (trainerErr) throw trainerErr

      // Sync auth store
      const authStore = useAuthStore()
      await authStore.fetchProfile()
      return true
    } catch (e) {
      error.value = e.message || '프로필 수정에 실패했습니다'
      return false
    } finally {
      uploading.value = false
    }
  }

  /** 회원 프로필 수정 (이름, 나이, 키, 몸무게, 목표, 메모) */
  async function updateMemberProfile(name, age = null, height = null, weight = null, goals = [], notes = null, gender = null) {
    if (!name || !name.trim()) {
      error.value = '이름을 입력해주세요'
      return false
    }
    uploading.value = true
    error.value = null
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('인증이 필요합니다')

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', userId)
      if (profileErr) throw profileErr

      const { error: memberErr } = await supabase
        .from('member_profiles')
        .upsert({ id: userId, age, height, weight, goals, notes, gender }, { onConflict: 'id' })
      if (memberErr) throw memberErr

      const authStore = useAuthStore()
      await authStore.fetchProfile()
      return true
    } catch (e) {
      error.value = e.message || '프로필 수정에 실패했습니다'
      return false
    } finally {
      uploading.value = false
    }
  }

  async function disconnectMember(memberId) {
    error.value = null
    try {
      const { error: disconnectError } = await supabase
        .from('trainer_members')
        .update({ status: 'disconnected' })
        .eq('trainer_id', auth.user.id)
        .eq('member_id', memberId)

      if (disconnectError) throw disconnectError
      return true
    } catch (e) {
      error.value = e?.message ?? '연결 해제에 실패했습니다.'
      return false
    }
  }

  async function disconnectTrainer() {
    error.value = null
    try {
      const { error: disconnectError } = await supabase
        .from('trainer_members')
        .update({ status: 'disconnected' })
        .eq('member_id', auth.user.id)
        .eq('status', 'active')

      if (disconnectError) throw disconnectError
      return true
    } catch (e) {
      error.value = e?.message ?? '연결 해제에 실패했습니다.'
      return false
    }
  }

  async function fetchConnectedTrainerName() {
    try {
      const { data: linkData, error: linkError } = await supabase
        .from('trainer_members')
        .select('trainer_id')
        .eq('member_id', auth.user.id)
        .eq('status', 'active')
        .limit(1)
      if (linkError || !linkData?.length) return null
      const trainerId = linkData[0].trainer_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', trainerId)
        .single()
      if (profileError || !profileData) return null
      return profileData.name || null
    } catch (e) {
      return null
    }
  }

  async function softDeleteAccount() {
    error.value = null
    try {
      const { data: connections } = await supabase
        .from('trainer_members')
        .select('trainer_id, member_id')
        .or(`trainer_id.eq.${auth.user.id},member_id.eq.${auth.user.id}`)
        .eq('status', 'active')

      const userName = auth.profile?.name || '사용자'
      try {
        if (connections && connections.length > 0) {
          for (const conn of connections) {
            const otherUserId = conn.trainer_id === auth.user.id ? conn.member_id : conn.trainer_id
            await createNotification(otherUserId, 'account_deleted', '연결된 사용자가 탈퇴 예정입니다', `${userName}님이 탈퇴 예정입니다. 30일 후 계정이 완전히 삭제됩니다.`)
          }
        }
      } catch (e) {}

      const { error: rpcError } = await supabase.rpc('soft_delete_user_account')
      if (rpcError) throw rpcError

      await supabase.auth.signOut()
      return true
    } catch (e) {
      error.value = e?.message ?? '계정 삭제에 실패했습니다.'
      return false
    }
  }

  async function cancelAccountDeletion() {
    const { error: rpcError } = await supabase.rpc('cancel_account_deletion')
    if (rpcError) {
      error.value = rpcError.message
      return false
    }
    if (auth.profile) auth.profile.deleted_at = null
    return true
  }

  /** 회원 프로필 기본 정보 저장 (이름, 전화번호, 사진) */
  async function saveMemberProfileBasic(name, phone, photoUrl) {
    error.value = null
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name, phone, photo_url: photoUrl || null })
        .eq('id', auth.user.id)

      if (profileError) throw profileError
      return true
    } catch (e) {
      error.value = e?.message ?? '프로필 저장에 실패했습니다.'
      return false
    }
  }

  /** 회원 프로필 상세 정보 저장 (나이, 키, 몸무게, 성별, 목표, 메모) */
  async function saveMemberProfileDetails(age, height, weight, gender, goals, notes) {
    error.value = null
    try {
      const { error: memberError } = await supabase
        .from('member_profiles')
        .upsert({
          id: auth.user.id,
          age: parseInt(age) || null,
          height: parseFloat(height) || null,
          weight: parseFloat(weight) || null,
          gender: gender || null,
          goals: goals,
          notes: notes,
        })

      if (memberError) throw memberError
      return true
    } catch (e) {
      error.value = e?.message ?? '회원 정보 저장에 실패했습니다.'
      return false
    }
  }

  /** 사용자 이메일 변경 */
  async function updateUserEmail(newEmail) {
    error.value = null
    try {
      const { error: updateError } = await supabase.auth.updateUser({ email: newEmail })
      if (updateError) throw updateError
      return true
    } catch (e) {
      error.value = e?.message ?? '이메일 변경 중 오류가 발생했습니다.'
      return false
    }
  }

  /** 사용자 비밀번호 변경 */
  async function updateUserPassword(newPassword) {
    error.value = null
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      return true
    } catch (e) {
      error.value = e?.message ?? '비밀번호 변경 중 오류가 발생했습니다.'
      return false
    }
  }

  return { uploading, error, uploadAvatar, updateProfilePhoto, saveTrainerProfile, saveRole, updateTrainerProfile, updateMemberProfile, disconnectMember, disconnectTrainer, softDeleteAccount, cancelAccountDeletion, fetchConnectedTrainerName, saveMemberProfileBasic, saveMemberProfileDetails, updateUserEmail, updateUserPassword }
}
