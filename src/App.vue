<template>
  <div id="container">
    <router-view v-slot="{ Component, route: currentRoute }">
      <keep-alive :include="keepAliveViews">
        <component :is="Component" :key="currentRoute.fullPath" />
      </keep-alive>
    </router-view>
    <template v-if="!route.meta.hideNav && auth.role">
      <TrainerBottomNav v-if="auth.role === 'trainer'" />
      <BottomNav v-else-if="auth.role === 'member'" />
    </template>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import TrainerBottomNav from '@/components/TrainerBottomNav.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

/** keep-alive 대상 뷰 이름 목록 (뒤로가기 시 재로딩 방지) */
const keepAliveViews = ['TrainerMemberDetailView']
</script>
