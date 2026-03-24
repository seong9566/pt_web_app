<template>
  <nav class="trainer-nav">
    <button
      v-for="item in navItems"
      :key="item.id"
      class="trainer-nav__item"
      :class="{ 'trainer-nav__item--active': activeId === item.id }"
      @click="handleNav(item)"
    >
      <span class="trainer-nav__icon" v-html="item.icon" />
      <span v-if="item.id === 'chat' && chatUnreadCount > 0" class="trainer-nav__badge">
        {{ chatUnreadCount > 99 ? '99+' : chatUnreadCount }}
      </span>
      <span v-if="item.id === 'schedule' && changeRequestCount > 0" class="trainer-nav__dot" />
      <span class="trainer-nav__label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChatBadgeStore } from '@/stores/chatBadge'
import { useNotificationBadgeStore } from '@/stores/notificationBadge'
import { useReservationsStore } from '@/stores/reservations'
import { useRealtimeBannerStore } from '@/stores/realtimeBanner'

const router = useRouter()
const route = useRoute()
const chatBadgeStore = useChatBadgeStore()
const notificationBadgeStore = useNotificationBadgeStore()
const reservationsStore = useReservationsStore()
const realtimeBannerStore = useRealtimeBannerStore()
const { unreadCount: chatUnreadCount } = storeToRefs(chatBadgeStore)
const { changeRequestCount } = storeToRefs(reservationsStore)

async function handleVisibilityChange() {
  if (!document.hidden) {
    await chatBadgeStore.loadUnreadCount(true)
    await reservationsStore.loadReservations('trainer', true)
  }
}

document.addEventListener('visibilitychange', handleVisibilityChange)

onMounted(async () => {
  await chatBadgeStore.loadUnreadCount()
  chatBadgeStore.subscribe()
  await notificationBadgeStore.loadUnreadCount()
  notificationBadgeStore.subscribe()
  await reservationsStore.loadReservations('trainer')
  reservationsStore.onChangeRequest(() => {
    realtimeBannerStore.showBanner('새로운 변경 요청이 있습니다', '/trainer/reservations')
  })
  reservationsStore.subscribe()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  chatBadgeStore.unsubscribe()
  notificationBadgeStore.unsubscribe()
  reservationsStore.unsubscribe()
})

const navItems = [
  {
    id: 'home',
    label: '홈',
    to: '/trainer/home',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'members',
    label: '회원',
    to: '/trainer/members',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/>
      <path d="M2 20C2 17.2386 5.13401 15 9 15C12.866 15 16 17.2386 16 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="17.5" cy="9" r="2.5" stroke="currentColor" stroke-width="1.6"/>
      <path d="M15 20C15 18.3431 16.3431 17 17.5 17C18.6569 17 21 18.3431 21 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'schedule',
    label: '일정',
    to: '/trainer/schedule',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>
      <path d="M3 9H21" stroke="currentColor" stroke-width="1.8"/>
      <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'chat',
    label: '채팅',
    to: '/trainer/chat',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'settings',
    label: '설정',
    to: '/trainer/settings',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" stroke-width="1.8"/>
    </svg>`,
  },
]

// 현재 route path 기반으로 active 탭 자동 판단
const activeId = computed(() => {
  const path = route.path
  if (path === '/member/home') return 'home' // 예외 처리용
  
  for (let i = navItems.length - 1; i >= 0; i--) {
    if (path.startsWith(navItems[i].to)) return navItems[i].id
  }
  return ''
})

function handleNav(item) {
  router.push(item.to)
}
</script>

<style scoped>
.trainer-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--app-max-width);
  height: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px); /* iPhone 홈 인디케이터 대응 */
  background-color: var(--color-white);
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
}

.trainer-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--color-gray-600);
  background: none;
  border: none;
  cursor: pointer;
  flex: 1;
  padding: 8px 0;
  font-family: inherit;
  position: relative;
}

.trainer-nav__item--active {
  color: var(--color-blue-primary);
}

.trainer-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.trainer-nav__label {
  font-size: var(--fs-caption);
  font-weight: var(--fw-caption);
  line-height: 1;
}
.trainer-nav__badge {
  position: absolute;
  top: 4px;
  right: calc(50% - 20px);
  min-width: 16px;
  height: 16px;
  background-color: var(--color-red);
  color: var(--color-white);
  border-radius: var(--radius-small);
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.trainer-nav__dot {
  position: absolute;
  top: 6px;
  right: calc(50% - 16px);
  width: 8px;
  height: 8px;
  background-color: var(--color-red);
  border-radius: 50%;
}
</style>
