/**
 * 라우터 설정
 *
 * 모든 라우트 정의 + 인증 가드 + 역할 기반 접근 제어.
 * - PUBLIC_ROUTES: 로그인/콜백은 미인증 접근 허용
 * - 모든 뷰는 lazy loading (dynamic import)
 * - meta.hideNav: true → 하단 네비게이션 숨김
 */
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const PUBLIC_ROUTES = ["/login", "/auth/callback", "/dev-login", "/email-login", "/password-reset", "/password-update", "/account-delete-pending", "/invite/enter"];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" }, // 기본 경로 → 로그인으로 리다이렉트
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/login/LoginView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/auth/callback",
      name: "auth-callback",
      component: () => import("@/views/auth/AuthCallbackView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/email-login",
      name: "email-login",
      component: () => import("@/views/login/EmailLoginView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/dev-login",
      redirect: "/email-login",
    },
    {
      path: "/password-reset",
      name: "password-reset",
      component: () => import("@/views/login/PasswordResetView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/password-update",
      name: "password-update",
      component: () => import("@/views/login/PasswordUpdateView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/account-manage",
      name: "account-manage",
      component: () => import("@/views/common/AccountManageView.vue"),
      meta: { hideNav: true },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('@/views/common/NotificationListView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/account-delete-pending',
      name: 'account-delete-pending',
      component: () => import('@/views/common/AccountDeletePendingView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/member/home',
      name: 'member-home',
      component: () => import('@/views/member/MemberHomeView.vue'),
    },
    {
      path: "/onboarding/role",
      name: "role-select",
      component: () => import("@/views/onboarding/RoleSelectView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/trainer/profile",
      name: "trainer-profile",
      component: () => import("@/views/trainer/TrainerProfileView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/onboarding/member-profile",
      name: "member-profile",
      component: () => import("@/views/onboarding/MemberProfileView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/search",
      name: "trainer-search",
      component: () => import("@/views/trainer/TrainerSearchView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/trainer/home",
      name: "trainer-home",
      component: () => import("@/views/trainer/TrainerHomeView.vue"),
    },
    {
      path: "/trainer/schedule",
      name: "trainer-schedule",
      component: () => import("@/views/trainer/TrainerScheduleView.vue"),
    },
    {
      path: '/trainer/reservations',
      name: 'trainer-reservations',
      component: () => import('@/views/trainer/ReservationManageView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/schedule/workout',
      name: 'trainer-today-workout',
      component: () => import('@/views/trainer/TodayWorkoutView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/members',
      name: 'trainer-members',
      component: () => import('@/views/trainer/TrainerMemberView.vue'),
    },
    {
      path: '/trainer/members/:id',
      name: 'trainer-member-detail',
      component: () => import('@/views/trainer/TrainerMemberDetailView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/members/:id/memo/write',
      name: 'trainer-memo-write',
      component: () => import('@/views/trainer/MemoWriteView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/members/:id/memo/:memoId/edit',
      name: 'trainer-memo-edit',
      component: () => import('@/views/trainer/MemoWriteView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/members/:id/pt-count',
      name: 'trainer-pt-count',
      component: () => import('@/views/trainer/PtCountManageView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/members/:id/payment',
      name: 'trainer-member-payment',
      component: () => import('@/views/trainer/MemberPaymentView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/members/:id/payment/write',
      name: 'trainer-payment-write',
      component: () => import('@/views/trainer/PaymentWriteView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/chat',
      name: 'trainer-chat',
      component: () => import('@/views/trainer/TrainerChatView.vue'),
    },
    {
      path: '/trainer/settings',
      name: 'trainer-settings',
      component: () => import('@/views/trainer/SettingsView.vue'),
    },
    {
      path: '/trainer/settings/work-time',
      name: 'trainer-work-time',
      component: () => import('@/views/trainer/WorkTimeSettingView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/settings/manual',
      name: 'trainer-manual',
      component: () => import('@/views/trainer/TrainerManualView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/settings/manual/register',
      name: 'trainer-manual-register',
      component: () => import('@/views/trainer/ManualRegisterView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/settings/manual/:id/edit',
      name: 'trainer-manual-edit',
      component: () => import('@/views/trainer/ManualRegisterView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/settings/manual/:id',
      name: 'trainer-manual-detail',
      component: () => import('@/views/member/ManualDetailView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/member/schedule',
      name: 'member-schedule',
      component: () => import('@/views/member/MemberScheduleView.vue'),
    },
    {
      path: '/member/workout',
      name: 'member-workout-detail',
      component: () => import('@/views/member/MemberWorkoutDetailView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/member/memos',
      name: 'member-memos',
      component: () => import('@/views/member/MemberMemoView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/member/payments',
      name: 'member-payments',
      component: () => import('@/views/member/MemberPaymentHistoryView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/member/chat',
      name: 'member-chat',
      component: () => import('@/views/member/MemberChatView.vue'),
    },
    {
      path: '/member/manual',
      name: 'member-manual',
      component: () => import('@/views/member/MemberManualView.vue'),
    },
    {
      path: '/member/manual/:id',
      name: 'member-manual-detail',
      component: () => import('@/views/member/ManualDetailView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/member/settings',
      name: 'member-settings',
      component: () => import('@/views/member/MemberSettingsView.vue'),
    },
     {
       path: '/member/reservation',
       redirect: '/member/availability',
     },
     {
       path: '/member/availability',
       name: 'member-availability',
       component: () => import('@/views/member/AvailabilityRegistrationView.vue'),
       meta: { hideNav: true },
     },
     {
       path: '/trainer/availability-status',
       name: 'trainer-availability-status',
       component: () => import('@/views/trainer/AvailabilityStatusView.vue'),
       meta: { hideNav: true },
     },
    {
      path: '/trainer/profile-edit',
      name: 'trainer-profile-edit',
      component: () => import('@/views/trainer/TrainerProfileEditView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/profile-view',
      name: 'trainer-profile-view',
      component: () => import('@/views/trainer/TrainerProfileReadOnlyView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/member/profile-edit',
      name: 'member-profile-edit',
      component: () => import('@/views/member/MemberProfileEditView.vue'),
      meta: { hideNav: true },
    },
    {
      path: "/invite/manage",
      name: "invite-manage",
      component: () => import("@/views/invite/InviteManageView.vue"),
      meta: { hideNav: true },
    },
    {
      path: "/invite/enter",
      name: "invite-enter",
      component: () => import("@/views/invite/InviteEnterView.vue"),
      meta: { hideNav: true },
    },
  ],
});

/** 온보딩 완료 판단 — role + name + 역할별 세부 프로필 존재 확인 */
function isOnboardingComplete(auth) {
  if (!auth.role || !auth.profile?.name) return false

  if (auth.role === 'trainer') {
    const tp = auth.profile.trainer_profiles
    return Array.isArray(tp) ? tp.length > 0 : !!tp
  }
  if (auth.role === 'member') {
    const mp = auth.profile.member_profiles
    return Array.isArray(mp) ? mp.length > 0 : !!mp
  }
  return false
}

/** 온보딩 미완료 시 해당 단계 경로 반환 (완료면 null) */
function getRequiredOnboardingRoute(auth) {
  if (!auth.role) return '/onboarding/role'
  if (!auth.profile?.name) {
    return auth.role === 'trainer' ? '/trainer/profile' : '/onboarding/member-profile'
  }

  const tp = auth.profile?.trainer_profiles
  const mp = auth.profile?.member_profiles
  if (auth.role === 'trainer' && !(Array.isArray(tp) ? tp.length > 0 : !!tp)) return '/trainer/profile'
  if (auth.role === 'member' && !(Array.isArray(mp) ? mp.length > 0 : !!mp)) return '/onboarding/member-profile'

  return null
}

/**
 * 라우터 가드 (beforeEach)
 *
 * 1. auth 초기화 대기 (세션 복원 완료까지)
 * 2. 미인증 + 보호된 경로 → /login 리다이렉트 (딥링크 저장)
 * 3. 인증됨 + /login 접근 → 역할별 홈 또는 딥링크 복귀
 * 4. 온보딩 미완료 시 보호 라우트 접근 차단
 * 5. 역할 불일치 → 해당 역할의 홈으로 리다이렉트
 */
router.beforeEach(async (to) => {
  try {
    const auth = useAuthStore();

    // auth 초기화 대기
    if (auth.loading) {
      await auth.initialize();
    }

    const isPublic = PUBLIC_ROUTES.includes(to.path);
    const isAuthenticated = !!auth.user;
    const isOnboarding = to.path.startsWith("/onboarding");

    // 미인증 + 보호된 경로 → 딥링크 저장 후 /login 리다이렉트
    if (!isAuthenticated && !isPublic) {
      sessionStorage.setItem('redirectAfterLogin', to.fullPath)
      return "/login";
    }

    // 인증됨 + /login 접근 → 딥링크 복귀 또는 역할별 홈
    if (isAuthenticated && to.path === "/login") {
      const redirect = sessionStorage.getItem('redirectAfterLogin')
      sessionStorage.removeItem('redirectAfterLogin')

      // 온보딩 미완료 사용자는 딥링크 무시
      const requiredRoute = getRequiredOnboardingRoute(auth)
      if (requiredRoute) return requiredRoute

      // 유효한 딥링크가 있으면 복귀
      if (redirect && redirect !== '/login' && redirect !== '/auth/callback') {
        return redirect
      }

      if (auth.role === "trainer") return "/trainer/home";
      if (auth.role === "member") return "/member/home";
      return "/onboarding/role";
    }

    // 삭제 대기 중인 계정 → 삭제 대기 페이지로
    if (isAuthenticated && auth.deletionPending && to.path !== '/account-delete-pending') {
      return '/account-delete-pending'
    }

    // 온보딩 + 트레이너 프로필 페이지: 이미 완료 시 재진입 차단
    const isOnboardingOrTrainerProfile = isOnboarding || to.path === '/trainer/profile'
    if (isOnboardingOrTrainerProfile) {
      if (isAuthenticated && isOnboardingComplete(auth)) {
        return auth.role === 'trainer' ? '/trainer/home' : '/member/home'
      }
      return
    }

    // 보호 라우트 접근 시 온보딩 미완료면 해당 단계로 강제 이동
    if (isAuthenticated && auth.role && !isPublic) {
      const requiredRoute = getRequiredOnboardingRoute(auth)
      if (requiredRoute) return requiredRoute
    }

    // 역할 기반 접근 제어
    if (isAuthenticated && auth.role) {
      const isTrainerRoute = to.path.startsWith("/trainer/");
      const isMemberRoute =
        to.path.startsWith("/member/") ||
        to.path === "/member/home";

      if (auth.role === "trainer" && isMemberRoute) {
        return "/trainer/home";
      }
      if (auth.role === "member" && isTrainerRoute) {
        return "/member/home";
      }
    }
  } catch(e) {
    console.error("Router beforeEach Error: ", e);
  }
});

/** 앱 내부 네비게이션 추적 — safeBack에서 사용 */
import { markInternalNavigation } from '@/utils/navigation'
router.afterEach(() => {
  markInternalNavigation()
})

export default router;
