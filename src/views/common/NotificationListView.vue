<!-- 인앱 알림 목록 페이지 — 7일 이내 알림 조회, 읽음 처리, 역할별 네비게이션 -->
<template>
  <div class="notification-list">

    <!-- ── Header ── -->
    <div class="notification-list__header">
      <button class="notification-list__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="notification-list__title">알림</h1>
      <button
        class="notification-list__mark-all"
        :class="{ 'notification-list__mark-all--disabled': unreadCount === 0 }"
        :disabled="unreadCount === 0"
        @click="handleMarkAllAsRead"
      >
        전체 읽음
      </button>
    </div>

    <!-- ── Loading State ── -->
    <div v-if="loading" class="notification-list__loading">
      <p>로딩 중...</p>
    </div>

    <!-- ── Empty State ── -->
    <div v-else-if="notifications.length === 0" class="notification-list__empty">
      <svg class="notification-list__empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p class="notification-list__empty-text">새로운 알림이 없습니다</p>
    </div>

    <!-- ── Notification Items ── -->
    <div v-else class="notification-list__items">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 'notification-item--unread': !notification.is_read }"
        @click="handleNotificationClick(notification)"
      >
        <!-- Icon -->
        <div
          class="notification-item__icon"
          :class="`notification-item__icon--${getIconCategory(notification.type)}`"
          v-html="getTypeIcon(notification.type)"
        />

        <!-- Content -->
        <div class="notification-item__content">
          <p class="notification-item__title">{{ notification.title }}</p>
          <p class="notification-item__body">{{ notification.body }}</p>
        </div>

        <!-- Meta: 시간 + 읽지 않음 dot -->
        <div class="notification-item__meta">
          <span class="notification-item__time">{{ getRelativeTime(notification.created_at) }}</span>
          <span v-if="!notification.is_read" class="notification-item__dot" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()

// ── Lifecycle ──
onMounted(() => {
  fetchNotifications()
})

// ── Handlers ──
async function handleMarkAllAsRead() {
  await markAllAsRead()
}

async function handleNotificationClick(notification) {
  await markAsRead(notification.id)
  navigateByTarget(notification.target_type)
}

function navigateByTarget(targetType) {
  const isTrainer = auth.role === 'trainer'
  const navMap = {
    reservation: isTrainer ? '/trainer/reservations' : '/member/schedule',
    message: isTrainer ? '/trainer/chat' : '/member/chat',
    workout: isTrainer ? '/trainer/schedule/workout' : '/home',
    connection: isTrainer ? '/trainer/members' : '/search',
  }
  const path = navMap[targetType]
  if (path) router.push(path)
}

// ── Helpers ──

/** 경과 시간 표시 (방금 / N분 전 / N시간 전 / N일 전) */
function getRelativeTime(dateStr) {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diffSec < 60) return '방금'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`
  return `${Math.floor(diffSec / 86400)}일 전`
}

/** 알림 타입 → 아이콘 카테고리 매핑 */
function getIconCategory(type) {
  if (['reservation_requested', 'reservation_approved', 'reservation_rejected', 'reservation_cancelled'].includes(type)) {
    return 'calendar'
  }
  if (type === 'new_message') return 'message'
  if (type === 'workout_assigned') return 'workout'
  if (['connection_requested', 'connection_approved'].includes(type)) return 'connection'
  if (type === 'pt_count_changed') return 'count'
  if (type === 'payment_recorded') return 'payment'
  return 'default'
}

/** 아이콘 카테고리별 SVG 마크업 (stroke="currentColor" 사용) */
const ICONS = {
  calendar: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/>
    <path d="M3 9h18" stroke="currentColor" stroke-width="1.8"/>
    <path d="M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  message: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  workout: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M6.5 6.5v11M17.5 6.5v11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M4 9h3.5M16.5 9H20M4 15h3.5M16.5 15H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M6.5 12h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  connection: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/>
    <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  count: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/>
    <path d="M9 12h6M12 9v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  payment: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/>
    <path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/>
  </svg>`,
  default: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
}

function getTypeIcon(type) {
  const category = getIconCategory(type)
  return ICONS[category] ?? ICONS.default
}
</script>

<style src="./NotificationListView.css" scoped></style>
