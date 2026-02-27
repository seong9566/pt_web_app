<template>
  <div id="container">
    <router-view />
    <template v-if="!route.meta.hideNav">
      <TrainerBottomNav v-if="auth.role === 'trainer'" />
      <BottomNav v-else />
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
</script>
