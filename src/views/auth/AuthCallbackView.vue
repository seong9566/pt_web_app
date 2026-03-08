<!-- OAuth 콜백 처리 페이지. Supabase 인증 후 세션 확인 → 프로필 존재 확인 → 역할에 따라 라우팅 -->
<template>
  <div class="auth-callback">
    <div v-if="error" class="auth-callback__error">
      <svg class="auth-callback__error-icon" width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/>
        <path d="M24 14v14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="24" cy="34" r="1.5" fill="currentColor"/>
      </svg>
      <p class="auth-callback__error-text">{{ error }}</p>
      <button class="auth-callback__retry-btn" @click="router.replace('/login')">다시 시도</button>
    </div>
    <p v-else-if="loading" class="auth-callback__text">로그인 처리 중...</p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const error = ref(null)

let authListener = null

/**
 * 역할에 따라 최종 리다이렉트 처리
 */
async function handleRedirect(session) {
  if (!session) {
    error.value = '세션 정보를 가져올 수 없습니다. 다시 로그인해 주세요.'
    loading.value = false
    return
  }

  try {
    // store 상태 동기화 (이미 onAuthStateChange에서 처리됐을 수 있지만, 명시적으로 실행)
    await auth.hydrateFromSession(session)
  } catch (e) {
    error.value = '인증 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'
    loading.value = false
    return
  }

  if (!auth.role) {
    router.replace('/onboarding/role')
  } else if (auth.role === 'trainer') {
    router.replace('/trainer/home')
  } else {
    router.replace('/member/home')
  }
}

onMounted(async () => {
  // Supabase SDK가 detectSessionInUrl: true에 의해 URL의 code를 자동 교환함
  // SIGNED_IN 이벤트가 오면 리다이렉트를 처리함
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      // 리스너 정리
      if (authListener) {
        authListener.subscription.unsubscribe()
        authListener = null
      }
      await handleRedirect(session)
    }
  })
  authListener = data

  // 이미 세션이 있는 경우(재진입 시) 즉시 처리
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    // 이미 세션이 있으므로 리스너를 정리하고 바로 리다이렉트
    if (authListener) {
      authListener.subscription.unsubscribe()
      authListener = null
    }
    await handleRedirect(session)
    return
  }

  // 3분 타임아웃: 세션이 오지 않으면 에러 표시
  setTimeout(() => {
    if (authListener) {
      authListener.subscription.unsubscribe()
      authListener = null
      error.value = '로그인 시간이 초과되었습니다. 다시 시도해 주세요.'
      loading.value = false
    }
  }, 180000)
})

onUnmounted(() => {
  if (authListener) {
    authListener.subscription.unsubscribe()
    authListener = null
  }
})
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-white);
}

.auth-callback__text {
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-reg);
  color: var(--color-gray-600);
}

.auth-callback__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px var(--side-margin);
  text-align: center;
}

.auth-callback__error-icon {
  color: var(--color-red);
}

.auth-callback__error-text {
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-reg);
  color: var(--color-gray-900);
}

.auth-callback__retry-btn {
  margin-top: 8px;
  padding: 12px 32px;
  background-color: var(--color-blue-primary);
  color: var(--color-white);
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-bold);
  border: none;
  border-radius: var(--radius-medium);
  cursor: pointer;
}
</style>
