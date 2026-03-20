<template>
  <div id="container">
    <router-view v-slot="{ Component, route: currentRoute }">
      <keep-alive :include="keepAliveViews">
        <component :is="Component" :key="keepAliveKey(currentRoute)" />
      </keep-alive>
    </router-view>
    <template v-if="!route.meta.hideNav && auth.role">
      <TrainerBottomNav v-if="auth.role === 'trainer'" />
      <BottomNav v-else-if="auth.role === 'member'" />
    </template>
    <AppToast />
    <AppConfirmDialog />
    <RealtimeBanner />
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import TrainerBottomNav from '@/components/TrainerBottomNav.vue'
import AppToast from '@/components/AppToast.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import RealtimeBanner from '@/components/RealtimeBanner.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

// 앱 언마운트 시 auth 리스너를 명시적으로 해제하여 메모리 누수 방지
onBeforeUnmount(() => { auth.cleanup() })

const keepAliveViews = [
  'TrainerHomeView',
  'TrainerScheduleView',
  'TrainerMemberView',
  'TrainerMemberDetailView',
  'MemberHomeView',
  'MemberScheduleView',
  'MemberSettingsView',
]

const tabPaths = new Set([
  '/trainer/home',
  '/trainer/schedule',
  '/trainer/members',
  '/member/home',
  '/member/schedule',
  '/member/settings',
])

function keepAliveKey(r) {
  return tabPaths.has(r.path) ? r.path : r.fullPath
}
</script>
