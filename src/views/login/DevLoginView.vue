<!-- 개발 전용 이메일 로그인 페이지. 프로덕션에서는 사용 불가 -->
<template>
  <div class="dev-login">
    <button class="dev-login__back" @click="safeBack(route.path)">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="dev-login__header">
      <h1 class="dev-login__title">이메일 로그인</h1>
      <p class="dev-login__subtitle">개발/테스트 전용</p>
    </div>

    <form class="dev-login__form" @submit.prevent="handleSubmit">
      <div class="dev-login__field">
        <label class="dev-login__label" for="email">이메일</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="dev-login__input"
          placeholder="test@example.com"
          required
          autocomplete="email"
        />
      </div>

      <div class="dev-login__field">
        <label class="dev-login__label" for="password">비밀번호</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="dev-login__input"
          placeholder="6자 이상"
          required
          minlength="6"
          autocomplete="current-password"
        />
      </div>

      <p v-if="errorMsg" class="dev-login__error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="dev-login__success">{{ successMsg }}</p>

      <div class="dev-login__actions">
        <button
          type="submit"
          class="dev-login__btn dev-login__btn--primary"
          :disabled="isLoading"
        >
          {{ isLoading ? '처리 중...' : '로그인' }}
        </button>
        <button
          type="button"
          class="dev-login__btn dev-login__btn--secondary"
          :disabled="isLoading"
          @click="handleSignUp"
        >
          {{ isLoading ? '처리 중...' : '회원가입' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { safeBack } from '@/utils/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

/** 이메일/비밀번호로 로그인 */
async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''
  isLoading.value = true

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) {
      errorMsg.value = error.message
      return
    }

    // 세션 복원 후 프로필 확인 → 적절한 페이지로 이동
    await auth.initialize()

    if (auth.role === 'trainer') {
      router.replace('/trainer/home')
    } else if (auth.role === 'member') {
      router.replace('/member/home')
    } else {
      router.replace('/onboarding/role')
    }
  } catch (e) {
    errorMsg.value = e.message || '로그인 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

/** 이메일/비밀번호로 회원가입 */
async function handleSignUp() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!email.value || !password.value) {
    errorMsg.value = '이메일과 비밀번호를 입력해주세요.'
    return
  }

  if (password.value.length < 6) {
    errorMsg.value = '비밀번호는 6자 이상이어야 합니다.'
    return
  }

  isLoading.value = true

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (error) {
      errorMsg.value = error.message
      return
    }

    // 이메일 확인이 꺼져 있으면 자동 로그인됨 — 바로 온보딩으로 이동
    if (data?.session) {
      await auth.initialize()
      router.replace('/onboarding/role')
      return
    }

    successMsg.value = '가입 완료! 로그인 버튼을 눌러주세요.'
  } catch (e) {
    errorMsg.value = e.message || '회원가입 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style src="./DevLoginView.css" scoped></style>
