<!-- OAuth 콜백 처리 페이지. Supabase 인증 후 세션 확인 → 프로필 존재 확인 → 역할에 따라 라우팅 -->
<template>
  <div class="auth-callback">
    <p class="auth-callback__text">로그인 처리 중...</p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const auth = useAuthStore()

let authListener = null

/**
 * 역할에 따라 최종 리다이렉트 처리
 */
async function handleRedirect(session) {
  if (!session) {
    console.warn('[AuthCallback] session 없음 - /login 으로 리다이렉트')
    router.replace('/login')
    return
  }

  // store 상태 동기화 (이미 onAuthStateChange에서 처리됐을 수 있지만, 명시적으로 실행)
  await auth.hydrateFromSession(session)

  if (!auth.role) {
    router.replace('/onboarding/role')
  } else if (auth.role === 'trainer') {
    router.replace('/trainer/home')
  } else {
    router.replace('/home')
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

  // 3분 타임아웃: 세션이 오지 않으면 로그인 화면으로 보냄
  setTimeout(() => {
    if (authListener) {
      console.warn('[AuthCallback] 세션 획득 타임아웃 - /login 으로 이동')
      authListener.subscription.unsubscribe()
      authListener = null
      router.replace('/login')
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
</style>
