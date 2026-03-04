<!-- OAuth 콜백 처리 페이지. Supabase 인증 후 세션 확인 → 프로필 존재 확인 → 역할에 따라 라우팅 -->
<template>
  <div class="auth-callback">
    <p class="auth-callback__text">로그인 처리 중...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

onMounted(async () => {
  try {
    const code = route.query.code

    // code 파라미터 없으면 로그인으로 리다이렉트
    if (!code) {
      router.replace('/login')
      return
    }

    // 1. PKCE 인가 코드 → 세션 교환 (단일 경로 — detectSessionInUrl: false이므로 자동 교환 없음)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error('PKCE 코드 교환 실패:', exchangeError.message)
      router.replace('/login')
      return
    }

    // 2. 교환 후 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('세션 확인 실패:', sessionError?.message)
      router.replace('/login')
      return
    }

    // 3. store 상태 동기화 — fetchProfile → setProfile → syncRoleFromProfile 체인 실행
    await auth.hydrateFromSession(session)

    // 4. 역할에 따라 리다이렉트
    if (!auth.role) {
      router.replace('/onboarding/role')
    } else if (auth.role === 'trainer') {
      router.replace('/trainer/home')
    } else {
      router.replace('/home')
    }
  } catch (e) {
    console.error('Auth callback 오류:', e)
    router.replace('/login')
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
