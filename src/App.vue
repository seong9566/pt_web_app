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
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import TrainerBottomNav from '@/components/TrainerBottomNav.vue'
import AppToast from '@/components/AppToast.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

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
