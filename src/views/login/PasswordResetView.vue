<template>
  <div class="password-reset">
    <button class="password-reset__back" @click="router.push('/email-login')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="password-reset__header">
      <h1 class="password-reset__title">비밀번호 재설정</h1>
      <p class="password-reset__subtitle">가입한 이메일로 재설정 링크를 발송합니다</p>
    </div>

    <form v-if="!sent" class="password-reset__form" @submit.prevent="handleSubmit">
      <div class="password-reset__field">
        <label class="password-reset__label" for="email">이메일</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="password-reset__input"
          placeholder="example@email.com"
          autocomplete="email"
        />
      </div>

      <p v-if="errorMsg" class="password-reset__error">{{ errorMsg }}</p>

      <button
        type="submit"
        class="password-reset__btn"
        :disabled="isLoading"
      >
        {{ isLoading ? '발송 중...' : '재설정 이메일 발송' }}
      </button>
    </form>

    <div v-if="sent" class="password-reset__success">
      <p class="password-reset__success-text">비밀번호 재설정 이메일을 발송했습니다</p>
      <p class="password-reset__success-sub">이메일을 확인하고 링크를 클릭해주세요</p>
    </div>

    <router-link to="/email-login" class="password-reset__back-link">로그인으로 돌아가기</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

const email = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const sent = ref(false)

async function handleSubmit() {
  errorMsg.value = ''

  if (!email.value) {
    errorMsg.value = '이메일을 입력해주세요.'
    return
  }

  isLoading.value = true

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: window.location.origin + '/password-update',
    })

    if (error) {
      errorMsg.value = error.message
      return
    }

    sent.value = true
  } catch (e) {
    errorMsg.value = e.message || '이메일 발송 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style src="./PasswordResetView.css" scoped></style>
