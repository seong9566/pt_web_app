/**
 * 네비게이션 유틸리티
 *
 * safeBack: 앱 내부 네비게이션 이력이 없으면 fallback 경로로 이동
 * resolvePostAuthRedirect: 로그인 완료 후 목적지 중앙 결정 함수
 */

import router from '@/router'

/** 뒤로가기 시 fallback 경로 매핑 */
const FALLBACK_ROUTES = {
  '/onboarding/role': '/login',
  '/onboarding/member-profile': '/onboarding/role',
  '/trainer/profile': '/onboarding/role',
  '/invite/enter': '/login',
  '/email-login': '/login',
  '/trainer/search': '/trainer/members',
  '/trainer/manual-register': '/trainer/home',
  '/trainer/chat': '/trainer/members',
  '/trainer/memo': '/trainer/members',
  '/trainer/payment': '/trainer/members',
  '/trainer/payment-write': '/trainer/members',
  '/trainer/today-workout': '/trainer/home',
  '/trainer/availability-status': '/trainer/schedule',
  '/trainer/work-time': '/trainer/schedule',
  '/trainer/pt-count': '/trainer/members',
  '/trainer/profile-edit': '/trainer/home',
  '/trainer/profile-readonly': '/trainer/home',
  '/trainer/manual': '/trainer/members',
  '/member/reservation': '/member/schedule',
  '/member/workout-detail': '/member/home',
  '/member/payment-history': '/member/home',
  '/member/manual-detail': '/member/home',
  '/member/profile-edit': '/member/settings',
  '/member/memo': '/member/home',
  '/member/availability-registration': '/member/schedule',
  '/account-manage': '/member/settings',
  '/notifications': '/member/home',
}

/** 앱 내부 네비게이션 발생 여부 추적 */
let _hasInternalNavigation = false

/** router.afterEach에서 호출 — 앱 내부 이동 기록 */
export function markInternalNavigation() {
  _hasInternalNavigation = true
}

/**
 * 안전한 뒤로가기.
 * 앱 내부 이동 이력이 있으면 router.back(), 없으면 fallback 경로로 이동.
 */
export function safeBack(currentPath) {
  if (_hasInternalNavigation) {
    router.back()
  } else {
    router.replace(FALLBACK_ROUTES[currentPath] || '/login')
  }
}

/**
 * 로그인 완료 후 목적지 중앙 결정 함수.
 * 우선순위: 온보딩 미완료 > pending_invite_code 처리 > redirectAfterLogin > 역할 홈
 */
export function resolvePostAuthRedirect(auth) {
  const redirect = sessionStorage.getItem('redirectAfterLogin')
  sessionStorage.removeItem('redirectAfterLogin')

  // 온보딩 미완료 → 온보딩 단계로
  if (!auth.role) return '/onboarding/role'
  if (!auth.profile?.name) {
    return auth.role === 'trainer' ? '/trainer/profile' : '/onboarding/member-profile'
  }

  // 유효한 딥링크가 있으면 복귀
  if (redirect && redirect !== '/login' && redirect !== '/auth/callback') {
    return redirect
  }

  // 기본 홈
  return auth.role === 'trainer' ? '/trainer/home' : '/member/home'
}
