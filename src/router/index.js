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

/**
 * 라우터 가드 (beforeEach)
 *
 * 1. auth 초기화 대기 (세션 복원 완료까지)
 * 2. 미인증 + 보호된 경로 → /login 리다이렉트
 * 3. 인증됨 + /login 접근 → 역할별 홈으로 리다이렉트
 * 4. 역할 불일치 → 해당 역할의 홈으로 리다이렉트
 */
router.beforeEach(async (to) => {
  try {
    const auth = useAuthStore();

    // Wait for auth initialization to complete
    if (auth.loading) {
      await auth.initialize();
    }

    const isPublic = PUBLIC_ROUTES.includes(to.path);
    const isAuthenticated = !!auth.user;
    const isOnboarding = to.path.startsWith("/onboarding");

    // Unauthenticated user accessing protected route → redirect to login
    if (!isAuthenticated && !isPublic) {
      return "/login";
    }

    // Authenticated user accessing login → redirect based on role
    if (isAuthenticated && to.path === "/login") {
      if (auth.role === "trainer") return "/trainer/home";
      if (auth.role === "member") return "/member/home";
      return "/onboarding/role";
    }

    if (isAuthenticated && auth.deletionPending && to.path !== '/account-delete-pending') {
      return '/account-delete-pending'
    }

    // 온보딩 + 트레이너 프로필 생성 페이지: role + 프로필 완성 시에만 재진입 차단
    const isOnboardingOrTrainerProfile = isOnboarding || to.path === '/trainer/profile'
    if (isOnboardingOrTrainerProfile) {
      if (isAuthenticated && auth.role && auth.profile?.name) {
        return auth.role === 'trainer' ? '/trainer/home' : '/member/home'
      }
      return
    }

    // Role-based access control (only for authenticated users with a role)
    if (isAuthenticated && auth.role) {
      const isTrainerRoute = to.path.startsWith("/trainer/");
      const isMemberRoute =
        to.path.startsWith("/member/") ||
        to.path === "/member/home";

      // Trainer accessing member routes → redirect to trainer home
      if (auth.role === "trainer" && isMemberRoute) {
        return "/trainer/home";
      }

      // Member accessing trainer routes → redirect to member home
      if (auth.role === "member" && isTrainerRoute) {
        return "/member/home";
      }
    }
  } catch(e) {
    console.error("Router beforeEach Error: ", e);
  }
});

export default router;
