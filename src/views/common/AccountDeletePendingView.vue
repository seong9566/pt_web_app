<template>
  <div class="account-delete-pending">
    <div class="account-delete-pending__icon-wrap">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/>
        <path d="M12 8V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="16.5" r="1" fill="currentColor"/>
      </svg>
    </div>

    <h1 class="account-delete-pending__title">계정 삭제 예정</h1>

    <p class="account-delete-pending__desc">
      회원님의 계정은 <strong>{{ remainingDays }}일 후</strong> 완전히 삭제됩니다.
    </p>
    <p class="account-delete-pending__subdesc">
      삭제를 취소하고 계정을 복구하시겠습니까?
    </p>

    <p v-if="errorMsg" class="account-delete-pending__error">{{ errorMsg }}</p>

    <div class="account-delete-pending__actions">
      <button
        class="account-delete-pending__btn account-delete-pending__btn--primary"
        :disabled="cancelling"
        @click="handleCancel"
      >{{ cancelling ? '복구 중...' : '계정 복구' }}</button>

      <button
        class="account-delete-pending__btn account-delete-pending__btn--secondary"
        :disabled="cancelling"
        @click="handleLogout"
      >로그아웃</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfile } from '@/composables/useProfile'

const router = useRouter()
const auth = useAuthStore()
const { cancelAccountDeletion } = useProfile()

const cancelling = ref(false)
const errorMsg = ref(null)

const remainingDays = computed(() => {
  const deletedAt = auth.profile?.deleted_at
  if (!deletedAt) return 30
  const diff = 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
})

async function handleCancel() {
  cancelling.value = true
  errorMsg.value = null
  const ok = await cancelAccountDeletion()
  if (ok) {
    auth.deletionPending = false
    if (auth.role === 'trainer') {
      router.push('/trainer/home')
    } else {
      router.push('/member/home')
    }
  } else {
    errorMsg.value = '계정 복구에 실패했습니다. 다시 시도해주세요.'
    cancelling.value = false
  }
}

async function handleLogout() {
  await auth.signOut()
  router.push('/login')
}
</script>

<style src="./AccountDeletePendingView.css" scoped></style>
