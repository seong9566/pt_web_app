<template>
  <nav class="bottom-nav" data-testid="bottom-nav">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': isActive(item) }"
    >
      <span class="bottom-nav__icon" v-html="item.icon" />
      <span v-if="item.name === 'member-chat' && chatUnreadCount > 0" class="bottom-nav__badge">
        {{ chatUnreadCount > 99 ? '99+' : chatUnreadCount }}
      </span>
      <span class="bottom-nav__label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChat } from '@/composables/useChat'

const route = useRoute()
const { getUnreadCount } = useChat()
const chatUnreadCount = ref(0)
let pollInterval = null

onMounted(async () => {
  // 초기 로드
  await getUnreadCount()
  chatUnreadCount.value = (await getUnreadCount()) ?? 0
  
  // 30초마다 폴링
  pollInterval = setInterval(async () => {
    chatUnreadCount.value = (await getUnreadCount()) ?? 0
  }, 30000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})

const navItems = [
  {
    name: 'member-home',
    label: '홈',
    to: '/member/home',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    name: 'member-schedule',
    label: '일정',
    to: '/member/schedule',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>
      <path d="M3 9H21" stroke="currentColor" stroke-width="1.8"/>
      <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    name: 'member-chat',
    label: '채팅',
    to: '/member/chat',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    name: 'member-manual',
    label: '매뉴얼',
    to: '/member/manual',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    name: 'member-settings',
    label: '설정',
    to: '/member/settings',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" stroke-width="1.8"/>
    </svg>`,
  },
]

function isActive(item) {
  return route.path === item.to || route.name === item.name
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--app-max-width);
  height: var(--nav-height);
  background-color: var(--color-white);
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
}
.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--color-gray-600);
  text-decoration: none;
  flex: 1;
  padding: 8px 0;
  position: relative;
}
.bottom-nav__item--active {
  color: var(--color-blue-primary);
}
.bottom-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--nav-icon-size);
  height: var(--nav-icon-size);
}
.bottom-nav__label {
  font-size: var(--fs-caption);
  font-weight: var(--fw-caption);
  line-height: 1;
}
.bottom-nav__badge {
  position: absolute;
  top: 4px;
  right: calc(50% - 20px);
  min-width: 16px;
  height: 16px;
  background-color: var(--color-red);
  color: var(--color-white);
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}
</style>
