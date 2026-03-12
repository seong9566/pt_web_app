<template>
  <div class="password-update">
    <div class="password-update__header">
      <h1 class="password-update__title">새 비밀번호 설정</h1>
      <p class="password-update__subtitle">새로운 비밀번호를 입력해주세요</p>
    </div>

    <form v-if="!done" class="password-update__form" @submit.prevent="handleSubmit">
      <div class="password-update__field">
        <label class="password-update__label" for="password">새 비밀번호</label>
        <input
          id="password"
          v-model="newPassword"
          type="password"
          :class="['password-update__input', { 'form-field--error': passwordError }]"
          placeholder="6자 이상"
          minlength="6"
          autocomplete="new-password"
          @blur="validatePassword"
        />
        <p v-if="passwordError" class="form-error-text">{{ passwordError }}</p>
      </div>

      <div class="password-update__field">
        <label class="password-update__label" for="confirm">비밀번호 확인</label>
        <input
          id="confirm"
          v-model="confirmPassword"
          type="password"
          :class="['password-update__input', { 'form-field--error': confirmError }]"
          placeholder="비밀번호를 다시 입력해주세요"
          autocomplete="new-password"
          @blur="validateConfirm"
        />
        <p v-if="confirmError" class="form-error-text">{{ confirmError }}</p>
      </div>

      <p v-if="errorMsg" class="password-update__error">{{ errorMsg }}</p>

      <button
        type="submit"
        class="password-update__btn"
        :disabled="isLoading"
      >
        {{ isLoading ? '변경 중...' : '비밀번호 변경' }}
      </button>
    </form>

    <div v-if="done" class="password-update__done">
      <p class="password-update__done-text">비밀번호가 변경되었습니다</p>
      <p class="password-update__done-sub">잠시 후 로그인 페이지로 이동합니다</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const passwordError = ref('')
const confirmError = ref('')
const done = ref(false)

function validatePassword() {
  if (!newPassword.value) {
    passwordError.value = '비밀번호를 입력해주세요'
  } else if (newPassword.value.length < 6) {
    passwordError.value = '비밀번호는 6자 이상이어야 합니다'
  } else {
    passwordError.value = ''
  }
}

function validateConfirm() {
  if (!confirmPassword.value) {
    confirmError.value = '비밀번호를 다시 입력해주세요'
  } else if (newPassword.value !== confirmPassword.value) {
    confirmError.value = '비밀번호가 일치하지 않습니다'
  } else {
    confirmError.value = ''
  }
}

async function handleSubmit() {
  errorMsg.value = ''
  validatePassword()
  validateConfirm()
  if (passwordError.value || confirmError.value) return

  isLoading.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    })

    if (error) {
      errorMsg.value = error.message
      return
    }

    done.value = true
    setTimeout(() => {
      router.push('/email-login')
    }, 1500)
  } catch (e) {
    errorMsg.value = e.message || '비밀번호 변경 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style src="./PasswordUpdateView.css" scoped></style>
