<template>
  <nav class="trainer-nav">
    <button
      v-for="item in navItems"
      :key="item.id"
      class="trainer-nav__item"
      :class="{ 'trainer-nav__item--active': activeId === item.id }"
      @click="handleNav(item)"
    >
      <span class="trainer-nav__icon" :style="{ maskImage: `url(${item.icon})`, WebkitMaskImage: `url(${item.icon})` }" />
      <span class="trainer-nav__label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import IconHome from '@/assets/icons/home.svg'
import IconMembers from '@/assets/icons/people.svg'
import IconSchedule from '@/assets/icons/calendar.svg'
import IconChat from '@/assets/icons/chat.svg'
import IconSettings from '@/assets/icons/setting.svg'

const router = useRouter()
const route = useRoute()

const navItems = [
  { id: 'home',     label: '홈',    to: '/trainer/home',     icon: IconHome },
  { id: 'members',  label: '회원',  to: '/trainer/members',  icon: IconMembers },
  { id: 'schedule', label: '일정',  to: '/trainer/schedule', icon: IconSchedule },
  { id: 'chat',     label: '채팅',  to: '/trainer/chat',     icon: IconChat },
  { id: 'settings', label: '설정',  to: '/trainer/settings', icon: IconSettings },
]

// 현재 route path 기반으로 active 탭 자동 판단
const activeId = computed(() => {
  const path = route.path
  if (path === '/home') return 'home' // 예외 처리용
  
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
  height: var(--nav-height);
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
}

.trainer-nav__item--active {
  color: var(--color-blue-primary);
}

.trainer-nav__icon {
  width: 24px;
  height: 24px;
  background-color: var(--color-gray-600);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.trainer-nav__item--active .trainer-nav__icon {
  background-color: var(--color-blue-primary);
}

.trainer-nav__label {
  font-size: var(--fs-caption);
  font-weight: var(--fw-caption);
  line-height: 1;
}
</style>
