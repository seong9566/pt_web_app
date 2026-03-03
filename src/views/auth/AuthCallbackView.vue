<!-- OAuth 콜백 처리 페이지. Supabase 인증 후 세션 확인 → 프로필 존재 확인 → 역할에 따라 라우팅 -->
<template>
  <div class="auth-callback">
    <p class="auth-callback__text">로그인 처리 중...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  try {
    // Supabase 세션 초기화 및 프로필 데이터 로드
    await auth.initialize()

    // 로그인 상태 확인: 세션 없으면 로그인 페이지로 리다이렉트
    if (!auth.user) {
      router.replace('/login')
      return
    }

    // 프로필 미생성: 역할 선택 페이지로 리다이렉트
    if (!auth.role) {
      router.replace('/onboarding/role')
      return
    }

    // 역할에 따라 홈 페이지 결정: 트레이너 → /trainer/home, 회원 → /home
    if (auth.role === 'trainer') {
      router.replace('/trainer/home')
    } else {
      router.replace('/home')
    }
  } catch (e) {
    console.error('Auth callback error:', e)
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
