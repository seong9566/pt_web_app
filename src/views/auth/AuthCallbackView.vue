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
    <p v-else-if="loading" class="auth-callback__text">{{ loadingMessage }}</p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/composables/useProfile'
import { useInvite } from '@/composables/useInvite'
import { parseAuthCallbackError } from '@/utils/authCallbackErrors'
import { resolvePostAuthRedirect } from '@/utils/navigation'

const router = useRouter()
const auth = useAuthStore()
const { saveRole } = useProfile()
const { redeemInviteCode } = useInvite()

const AUTH_CALLBACK_TIMEOUT = 25000 // 25초

const loading = ref(true)
const error = ref(null)
const loadingMessage = ref('로그인 처리 중...')

let authListener = null
let timeoutId = null
let stopErrorWatch = null

function resolveUrlError() {
  const url = new URL(window.location.href)
  const errorDescription = url.searchParams.get('error_description')
  const errorCode = url.searchParams.get('error')

  return errorDescription || errorCode || null
}

function failAuth(sourceError) {
  error.value = parseAuthCallbackError(sourceError)
  loading.value = false
}

/**
 * 역할에 따라 최종 리다이렉트 처리
 */
async function handleRedirect(session) {
  if (!session) {
    failAuth('세션 정보를 가져올 수 없습니다. 다시 로그인해 주세요.')
    return
  }

  try {
    loadingMessage.value = '인증 확인 중...'
    // store 상태 동기화 (이미 onAuthStateChange에서 처리됐을 수 있지만, 명시적으로 실행)
    await auth.hydrateFromSession(session)
  } catch (e) {
    console.error('[AuthCallback] handleRedirect 실패:', e)
    failAuth(e)
    return
  }

  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }

  try {
    loadingMessage.value = '프로필 불러오는 중...'
    const pendingCode = sessionStorage.getItem('pending_invite_code')

    if (!auth.role) {
      if (pendingCode) {
        // saveRole 실패 처리 포함
        const success = await saveRole(auth.user.id, 'member')
        if (!success) {
          failAuth('역할 저장에 실패했습니다. 다시 시도해주세요.')
          return
        }
        auth.setRole('member')
        router.replace('/onboarding/member-profile')
      } else {
        router.replace(resolvePostAuthRedirect(auth))
      }
    } else if (auth.role === 'trainer') {
      // 트레이너는 초대 코드 불필요 — clear 정책
      sessionStorage.removeItem('pending_invite_code')
      loadingMessage.value = '화면 준비 중...'
      router.replace(resolvePostAuthRedirect(auth))
    } else {
      if (pendingCode) {
        const result = await redeemInviteCode(pendingCode)
        if (result) sessionStorage.removeItem('pending_invite_code')
      }
      loadingMessage.value = '화면 준비 중...'
      router.replace(resolvePostAuthRedirect(auth))
    }
  } catch (e) {
    console.error('[AuthCallback] 최종 라우팅 실패:', e)
    failAuth(e)
  }
}

onMounted(async () => {
  const urlError = resolveUrlError()
  if (urlError) {
    failAuth(urlError)
    return
  }

  stopErrorWatch = watch(
    () => auth.error,
    (nextError) => {
      if (!nextError || !loading.value) return
      failAuth(nextError)
    }
  )

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
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('[AuthCallback] getSession 실패:', sessionError)
    failAuth(sessionError)
    return
  }

  if (session) {
    // 이미 세션이 있으므로 리스너를 정리하고 바로 리다이렉트
    if (authListener) {
      authListener.subscription.unsubscribe()
      authListener = null
    }
    await handleRedirect(session)
    return
  }

  if (auth.error) {
    failAuth(auth.error)
    return
  }

  // 콜백 처리 타임아웃 (25초)
  timeoutId = window.setTimeout(() => {
    if (authListener) {
      authListener.subscription.unsubscribe()
      authListener = null
    }
    failAuth(auth.error || '로그인 시간이 초과되었습니다. 다시 시도해 주세요.')
  }, AUTH_CALLBACK_TIMEOUT)
})

onUnmounted(() => {
  stopErrorWatch?.()
  stopErrorWatch = null

  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }

  if (authListener) {
    authListener.subscription.unsubscribe()
    authListener = null
  }
})
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  min-height: 100dvh;
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
