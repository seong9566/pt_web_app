<template>
  <div class="email-login">
    <button class="email-login__back" @click="router.back()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="email-login__brand">
      <div class="email-login__icon-box">
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
          <rect x="6" y="20" width="8" height="8" rx="3" fill="#007AFF"/>
          <rect x="34" y="20" width="8" height="8" rx="3" fill="#007AFF"/>
          <rect x="10" y="16" width="6" height="16" rx="2" fill="#007AFF"/>
          <rect x="32" y="16" width="6" height="16" rx="2" fill="#007AFF"/>
          <rect x="16" y="22" width="16" height="4" rx="2" fill="#007AFF"/>
        </svg>
      </div>
      <h1 class="email-login__app-name">PT 매니저</h1>
    </div>

    <div class="email-login__tabs">
      <button
        class="email-login__tab"
        :class="{ 'email-login__tab--active': activeTab === 'login' }"
        type="button"
        @click="switchTab('login')"
      >
        로그인
      </button>
      <button
        class="email-login__tab"
        :class="{ 'email-login__tab--active': activeTab === 'signup' }"
        type="button"
        @click="switchTab('signup')"
      >
        회원가입
      </button>
    </div>

    <form class="email-login__form" @submit.prevent="handleSubmit">
      <div class="email-login__field">
        <label class="email-login__label" for="email">이메일</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="email-login__input"
          placeholder="example@email.com"
          autocomplete="email"
        />
      </div>

      <div class="email-login__field">
        <label class="email-login__label" for="password">비밀번호</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="email-login__input"
          placeholder="6자 이상 입력"
          :autocomplete="activeTab === 'login' ? 'current-password' : 'new-password'"
        />
      </div>

      <p v-if="errorMsg" class="email-login__error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="email-login__success">{{ successMsg }}</p>

      <button
        v-if="activeTab === 'login'"
        type="button"
        class="email-login__forgot"
        @click="router.push('/password-reset')"
      >
        비밀번호를 잊으셨나요?
      </button>

      <button
        type="submit"
        class="email-login__btn email-login__btn--primary"
        :disabled="isLoading"
      >
        {{ isLoading ? '처리 중...' : (activeTab === 'login' ? '로그인' : '회원가입') }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('login')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function switchTab(tab) {
  activeTab.value = tab
  errorMsg.value = ''
  successMsg.value = ''
}

function validateInputs() {
  if (!email.value || !password.value) {
    errorMsg.value = '이메일과 비밀번호를 입력해주세요.'
    return false
  }
  if (!email.value.includes('@')) {
    errorMsg.value = '올바른 이메일 형식이 아닙니다.'
    return false
  }
  if (password.value.length < 6) {
    errorMsg.value = '비밀번호는 6자 이상이어야 합니다.'
    return false
  }
  return true
}

function parseAuthError(code) {
  const map = {
    invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
    user_already_registered: '이미 가입된 이메일입니다.',
    weak_password: '비밀번호가 너무 약합니다. 6자 이상으로 다시 시도해주세요.',
  }
  return map[code] ?? null
}

async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!validateInputs()) return

  isLoading.value = true

  try {
    if (activeTab.value === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })

      if (error) {
        errorMsg.value = parseAuthError(error.code) ?? error.message ?? '로그인 중 오류가 발생했습니다.'
        return
      }

      await auth.initialize()

      if (auth.role === 'trainer') {
        router.replace('/trainer/home')
      } else if (auth.role === 'member') {
        router.replace('/home')
      } else {
        router.replace('/onboarding/role')
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })

      if (error) {
        errorMsg.value = parseAuthError(error.code) ?? error.message ?? '회원가입 중 오류가 발생했습니다.'
        return
      }

      if (data?.session) {
        await auth.initialize()
        router.replace('/onboarding/role')
        return
      }

      successMsg.value = '가입이 완료되었습니다. 로그인해주세요.'
      switchTab('login')
    }
  } catch (e) {
    errorMsg.value = e.message ?? '오류가 발생했습니다. 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style src="./EmailLoginView.css" scoped></style>
