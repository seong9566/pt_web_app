import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: () => import('@/views/login/LoginView.vue'), meta: { hideNav: true } },
    { path: '/onboarding/role', name: 'role-select', component: () => import('@/views/onboarding/RoleSelectView.vue'), meta: { hideNav: true } },
    { path: '/onboarding/trainer-profile', name: 'trainer-profile', component: () => import('@/views/onboarding/TrainerProfileView.vue'), meta: { hideNav: true } },
    { path: '/onboarding/member-profile', name: 'member-profile', component: () => import('@/views/onboarding/MemberProfileView.vue'), meta: { hideNav: true } },
    { path: '/search', name: 'trainer-search', component: () => import('@/views/trainer/TrainerSearchView.vue') },
    { path: '/invite/manage', name: 'invite-manage', component: () => import('@/views/invite/InviteManageView.vue') },
    { path: '/invite/enter', name: 'invite-enter', component: () => import('@/views/invite/InviteEnterView.vue') },
  ]
})

export default router
