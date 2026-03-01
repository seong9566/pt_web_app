import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const PUBLIC_ROUTES = ["/login", "/auth/callback"];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" },
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
      path: '/home',
      name: 'home',
      component: () => import('@/views/home/MemberHomeView.vue'),
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
    },
    {
      path: '/trainer/schedule/workout',
      name: 'trainer-today-workout',
      component: () => import('@/views/trainer/TodayWorkoutView.vue'),
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
    },
    {
      path: '/trainer/members/:id/memo/write',
      name: 'trainer-memo-write',
      component: () => import('@/views/trainer/MemoWriteView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/trainer/members/:id/payment',
      name: 'trainer-member-payment',
      component: () => import('@/views/trainer/MemberPaymentView.vue'),
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
      name: 'member-reservation',
      component: () => import('@/views/member/MemberReservationView.vue'),
      meta: { hideNav: true },
    },
    {
      path: "/invite/manage",
      name: "invite-manage",
      component: () => import("@/views/invite/InviteManageView.vue"),
    },
    {
      path: "/invite/enter",
      name: "invite-enter",
      component: () => import("@/views/invite/InviteEnterView.vue"),
    },
  ],
});

router.beforeEach(async (to) => {
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
    if (auth.role === "member") return "/home";
    return "/onboarding/role";
  }

  // Onboarding routes: require auth but no role check
  if (isOnboarding) {
    return;
  }

  // Role-based access control (only for authenticated users with a role)
  if (isAuthenticated && auth.role) {
    const isTrainerRoute =
      to.path.startsWith("/trainer/") || to.path === "/search";
    const isMemberRoute =
      to.path.startsWith("/member/") ||
      to.path === "/home" ||
      to.path.startsWith("/invite/");

    // Trainer accessing member routes → redirect to trainer home
    if (auth.role === "trainer" && isMemberRoute) {
      return "/trainer/home";
    }

    // Member accessing trainer routes → redirect to member home
    if (auth.role === "member" && isTrainerRoute) {
      return "/home";
    }
  }
});

export default router;
