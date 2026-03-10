<!-- 회원용 초대 코드 입력 페이지. 6자리 코드 입력 → 코드 확인 → 트레이너 정보 표시 → 연결 확정 -->
<template>
  <div class="invite-enter">
    <div class="invite-enter__header">
      <button class="invite-enter__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="invite-enter__title">초대 코드 입력</h2>
      <div style="width: 40px" />
    </div>
    <div class="invite-enter__content">
      <div class="invite-enter__icon-box">
        <img src="@/assets/icons/link_invite.svg" alt="invite" width="56" height="56" />
      </div>
      <div class="invite-enter__desc">
        <p class="invite-enter__desc-main">
          트레이너에게 받은 코드를 입력해주세요.
        </p>
        <p class="invite-enter__desc-sub">담당 트레이너와 즉시 연결됩니다.</p>
      </div>
      <div class="invite-enter__code-inputs">
        <input
          v-for="(_, idx) in codeDigits"
          :key="idx"
          class="invite-enter__code-box"
          type="text"
          maxlength="1"
          :value="codeDigits[idx]"
          placeholder="-"
          @input="handleInput(idx, $event)"
          @keydown.backspace="handleBackspace(idx, $event)"
          :ref="
            (el) => {
              if (el) inputRefs[idx] = el;
            }
          "
        />
      </div>
      <button class="invite-enter__check-btn" :disabled="isChecking" @click="handleCheckCode">
        <img src="@/assets/icons/code_copy.svg" alt="check" width="16" height="16" />
        {{ isChecking ? '확인 중...' : '코드 확인' }}
      </button>
      <p v-if="errorMsg" class="invite-enter__error" style="color: var(--color-red); font-size: var(--fs-caption); text-align: center; margin-top: 8px;">{{ errorMsg }}</p>

      <!-- 트레이너 정보 카드 (코드 검증 성공 시 표시) -->
      <div v-if="verifiedTrainer" class="invite-enter__trainer-card">
        <div class="invite-enter__trainer-avatar">
          <img v-if="verifiedTrainer.trainerPhoto" :src="verifiedTrainer.trainerPhoto" alt="trainer" />
          <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="#007AFF"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#007AFF"/>
          </svg>
        </div>
        <div class="invite-enter__trainer-info">
          <p class="invite-enter__trainer-name">{{ verifiedTrainer.trainerName }}</p>
          <p class="invite-enter__trainer-label">담당 트레이너</p>
        </div>
        <svg class="invite-enter__trainer-check" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#34C759"/>
          <path d="M8 12l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <div class="invite-enter__footer">
      <button v-if="!auth.user" class="invite-enter__confirm-btn" @click="handleLoginRedirect">
        로그인 / 회원가입
      </button>
      <button v-else class="invite-enter__confirm-btn" :disabled="!verifiedTrainer || isLoading" @click="handleConfirm">
        {{ isLoading ? '연결 중...' : '연결 확정' }}
      </button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInvite } from '@/composables/useInvite'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { validateInviteCode, redeemInviteCode, error: inviteError } = useInvite()

const codeDigits = ref(['', '', '', '', '', ''])
const inputRefs = ref([])
const errorMsg = ref('')
const isLoading = ref(false)
const isChecking = ref(false)
const verifiedTrainer = ref(null)

onMounted(() => {
  const code = route.query.code
  if (code) {
    const chars = String(code).toUpperCase().slice(0, 6).split('')
    chars.forEach((char, i) => {
      codeDigits.value[i] = char
    })
  }
})

function handleInput(idx, event) {
  const val = event.target.value.slice(-1).toUpperCase()
  codeDigits.value[idx] = val
  verifiedTrainer.value = null
  errorMsg.value = ''
  if (val && idx < 5) inputRefs.value[idx + 1]?.focus()
}

function handleBackspace(idx, event) {
  if (!codeDigits.value[idx] && idx > 0) inputRefs.value[idx - 1]?.focus()
  verifiedTrainer.value = null
  errorMsg.value = ''
}

async function handleCheckCode() {
  const code = codeDigits.value.join('')
  errorMsg.value = ''
  verifiedTrainer.value = null

  if (code.length < 6) {
    errorMsg.value = '6자리 코드를 모두 입력해주세요'
    return
  }

  if (!auth.user) {
    errorMsg.value = '코드 확인을 위해 로그인이 필요합니다'
    return
  }

  isChecking.value = true

  try {
    const result = await validateInviteCode(code)

    if (!result) {
      errorMsg.value = inviteError.value || '유효하지 않은 초대 코드입니다.'
      return
    }

    verifiedTrainer.value = result
  } catch (e) {
    errorMsg.value = e?.message ?? '코드 확인에 실패했습니다.'
  } finally {
    isChecking.value = false
  }
}

function handleLoginRedirect() {
  const code = codeDigits.value.join('')
  if (code) localStorage.setItem('pending_invite_code', code)
  router.push('/login')
}

async function handleConfirm() {
  const code = codeDigits.value.join('')
  errorMsg.value = ''

  if (code.length < 6 || !verifiedTrainer.value) {
    errorMsg.value = '먼저 코드를 확인해주세요'
    return
  }

  isLoading.value = true

  try {
    const result = await redeemInviteCode(code)

    if (!result) {
      errorMsg.value = inviteError.value || '연결에 실패했습니다. 다시 시도해주세요.'
      return
    }

    await auth.fetchProfile()
    router.push('/member/home')
  } catch (e) {
    errorMsg.value = e?.message ?? '연결에 실패했습니다. 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}
</script>
<style src="./InviteEnterView.css" scoped></style>
