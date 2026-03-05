<!-- 로그인 페이지. 카카오 OAuth 및 이메일 로그인 버튼 제공 -->
<template>
  <div class="login-view">
    <div class="login-view__bg-circle login-view__bg-circle--1" />
    <div class="login-view__bg-circle login-view__bg-circle--2" />
    <div class="login-view__content">
      <div class="login-view__brand">
        <div class="login-view__icon-box">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="6" y="20" width="8" height="8" rx="3" fill="#007AFF"/>
            <rect x="34" y="20" width="8" height="8" rx="3" fill="#007AFF"/>
            <rect x="10" y="16" width="6" height="16" rx="2" fill="#007AFF"/>
            <rect x="32" y="16" width="6" height="16" rx="2" fill="#007AFF"/>
            <rect x="16" y="22" width="16" height="4" rx="2" fill="#007AFF"/>
          </svg>
        </div>
        <h1 class="login-view__title">PT 매니저</h1>
        <p class="login-view__subtitle">체계적인 PT 일정 및<br />회원 관리 솔루션</p>
      </div>
      <div class="login-view__actions">
        <button class="login-view__btn login-view__btn--kakao" :disabled="isLoading" @click="handleKakao">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11 2C6.029 2 2 5.358 2 9.5c0 2.647 1.617 4.97 4.063 6.33L5.1 19.5a.25.25 0 0 0 .37.27L10.1 17.1c.296.025.596.04.9.04 4.971 0 9-3.358 9-7.5S15.971 2 11 2z" fill="#000000"/>
          </svg>
          카카오로 시작하기
        </button>
        <div class="login-view__divider">
          <span class="login-view__divider-line" />
          <span class="login-view__divider-text">또는</span>
          <span class="login-view__divider-line" />
        </div>
        <button class="login-view__btn login-view__btn--email" @click="handleEmail">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="16" height="12" rx="2" stroke="#666666" stroke-width="1.5"/>
            <path d="M2 7L10 12L18 7" stroke="#666666" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          이메일로 로그인
        </button>
      </div>
    </div>
    <p class="login-view__footer">
      계속 진행 시
      <a href="#" class="login-view__link">이용약관</a>
      및
      <a href="#" class="login-view__link">개인정보처리방침</a>에<br />동의하게 됩니다.
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const isLoading = ref(false)

/** 카카오 OAuth 로그인 처리 */
async function handleKakao() {
  isLoading.value = true
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: window.location.origin + '/auth/callback',
    },
  })
  if (error) {
    console.error('Kakao OAuth error:', error.message)
    isLoading.value = false
  }
}
function handleEmail() { }
</script>

<style src="./LoginView.css" scoped></style>
