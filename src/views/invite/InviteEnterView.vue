<!-- 회원용 초대 코드 입력 페이지. 6자리 코드 입력 → RPC 호출 → 트레이너 연결 -->
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
      <button class="invite-enter__check-btn" @click="handleCheckCode">
        <img src="@/assets/icons/code_copy.svg" alt="check" width="16" height="16" />
        코드 확인
      </button>
      <p v-if="errorMsg" class="invite-enter__error" style="color: var(--color-red); font-size: var(--fs-caption); text-align: center; margin-top: 8px;">{{ errorMsg }}</p>
    </div>
    <div class="invite-enter__footer">
      <button class="invite-enter__confirm-btn" :disabled="isLoading" @click="handleConfirm">
        {{ isLoading ? '연결 중...' : '연결 확정' }}
      </button>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInvite } from '@/composables/useInvite'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const { redeemInviteCode } = useInvite()

const codeDigits = ref(['', '', '', '', '', ''])
const inputRefs = ref([])
const errorMsg = ref('')
const isLoading = ref(false)

/** 코드 입력 필드 처리 */
function handleInput(idx, event) {
  const val = event.target.value.slice(-1).toUpperCase()
  codeDigits.value[idx] = val
  if (val && idx < 5) inputRefs.value[idx + 1]?.focus()
}

/** 백스페이스 키 처리 */
function handleBackspace(idx, event) {
  if (!codeDigits.value[idx] && idx > 0) inputRefs.value[idx - 1]?.focus()
}

/** 코드 입력 완료 여부 검사 */
function handleCheckCode() {
  const code = codeDigits.value.join('')
  errorMsg.value = ''
  if (code.length < 6) {
    errorMsg.value = '6자리 코드를 모두 입력해주세요'
    return
  }
}

/** 초대 코드 단축 및 트레이너 연결 실패 */
async function handleConfirm() {
  const code = codeDigits.value.join('')
  errorMsg.value = ''

  if (code.length < 6) {
    errorMsg.value = '6자리 코드를 모두 입력해주세요'
    return
  }

  isLoading.value = true

  try {
    const result = await redeemInviteCode(code)

    if (!result) {
      errorMsg.value = '유효하지 않은 코드입니다. 다시 확인해주세요.'
      return
    }

    await auth.fetchProfile()
    router.push({
      path: '/onboarding/member-profile',
      query: { fromInvite: 'true' },
    })
  } catch (e) {
    errorMsg.value = e?.message ?? '연결에 실패했습니다. 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}
</script>
<style src="./InviteEnterView.css" scoped></style>
