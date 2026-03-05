<!-- 트레이너 홈 대시보드. 오늘 예약 현황, 회원 수, 최근 메시지 표시 -->
<template>
  <div class="trainer-home">
    <header class="home-header">
      <div class="home-header__profile">
        <div class="profile-avatar">
          <img src="@/assets/icons/person.svg" alt="avatar" />
          <div class="status-dot"></div>
        </div>
        <div class="profile-text">
          <p class="greeting">환영합니다</p>
          <h1 class="name">{{ auth.profile?.name || '코치' }}님</h1>
        </div>
      </div>
      <button class="btn-bell">
        <img src="@/assets/icons/bell.svg" alt="알림" width="24" height="24" />
        <span class="bell-dot"></span>
      </button>
    </header>

    <!-- 에러 메시지 -->
    <div v-if="reservError || membersError" class="error-message">
      {{ reservError || membersError }}
    </div>

    <div class="action-card-dark floating-card" v-if="pendingReservationCount > 0">
      <div class="action-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16H18M17 15V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div class="action-text">
        <h3 class="action-title">새로운 예약 요청</h3>
        <p class="action-desc">승인 대기 중 {{ pendingReservationCount }}건</p>
      </div>
      <div class="action-arrow">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>

    <section class="stat-grid">
      <div class="stat-card">
        <div class="stat-card__head">
          <div class="stat-icon stat-icon--blue">
            <img src="@/assets/icons/trainer.svg" width="16" height="16" alt="세션" />
          </div>
          <span class="stat-badge">오늘</span>
        </div>
        <div class="stat-card__body">
          <div class="stat-value">
            <span v-if="reservLoading">-</span>
            <span v-else>{{ todaySessionCount }}</span>
          </div>
          <div class="stat-label">총 세션</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__head">
          <div class="stat-icon stat-icon--blue">
            <img src="@/assets/icons/up.svg" width="16" height="16" alt="회원" />
          </div>
          <span class="stat-badge">전체</span>
        </div>
        <div class="stat-card__body">
          <div class="stat-value">
            <span v-if="membersLoading">-</span>
            <span v-else>{{ memberCount }}</span>
          </div>
          <div class="stat-label">연결 회원</div>
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="section-header">
        <h2 class="section-title">오늘의 일정</h2>
        <a href="#" class="section-link" @click.prevent="router.push('/trainer/reservations')">전체보기</a>
      </div>

      <div class="date-tabs">
        <button
          v-for="tab in dateTabs"
          :key="tab.date"
          class="date-tab"
          :class="{ 'date-tab--active': selectedDate === tab.date }"
          @click="selectedDate = tab.date"
        >{{ tab.label }}</button>
      </div>

      <div class="schedule-list">
        <!-- 로딩 중 -->
        <div v-if="reservLoading" class="schedule-list__empty">
          <p>로딩 중...</p>
        </div>
        <!-- 빈 상태 -->
        <div v-else-if="filteredReservations.length === 0" class="schedule-list__empty">
          <template v-if="memberCount === 0">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
              <path d="M2 20C2 17.2386 5.13401 15 9 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M17 11V17M14 14H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p>아직 연결된 회원이 없습니다.</p>
            <p style="font-size: var(--fs-caption); color: var(--color-gray-600);">초대 코드를 생성하여 회원을 초대하세요.</p>
            <button class="schedule-list__invite-btn" @click="router.push('/invite/manage')">초대 코드 생성</button>
          </template>
          <template v-else>
            <p>예약이 없습니다.</p>
          </template>
        </div>
        <!-- 예약 목록 -->
        <div v-for="reservation in filteredReservations" :key="reservation.id" class="schedule-card">
          <div class="schedule-card__main">
            <div class="schedule-avatar"><img src="@/assets/icons/person.svg" alt="" /></div>
            <div class="schedule-info">
              <h3 class="schedule-name">{{ reservation.partner_name }}</h3>
              <p class="schedule-time">{{ reservation.start_time }} 수업 시작</p>
            </div>
          </div>
          <div class="schedule-card__divider"></div>
          <div class="schedule-card__desc">
            <p class="desc-label">예약 상태</p>
            <p class="desc-text">{{ reservation.status === 'pending' ? '승인 대기 중' : reservation.status === 'approved' ? '승인됨' : '완료됨' }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="section-header">
        <h2 class="section-title">최근 메시지</h2>
        <a href="#" class="section-link" @click.prevent="router.push('/trainer/chat')">전체보기</a>
      </div>

      <!-- 로딩 중 -->
      <div v-if="chatLoading" style="padding: 20px; text-align: center; color: var(--color-gray-600); font-size: var(--fs-body2);">
        로딩 중...
      </div>
      <!-- 에러 -->
      <div v-else-if="chatError" class="error-message">
        {{ chatError }}
      </div>
      <!-- 빈 상태 -->
      <div v-else-if="recentConversations.length === 0" style="padding: 20px; text-align: center; color: var(--color-gray-600); font-size: var(--fs-body2);">
        메시지가 없습니다.
      </div>
      <!-- 대화 목록 -->
      <div v-else class="message-list">
        <div
          v-for="conv in recentConversations"
          :key="conv.partnerId"
          class="message-card"
          @click="router.push('/trainer/chat')"
        >
          <div class="message-avatar">
            <img v-if="conv.partnerPhoto" :src="conv.partnerPhoto" :alt="conv.partnerName" />
            <img v-else src="@/assets/icons/person.svg" :alt="conv.partnerName" />
            <span v-if="conv.unreadCount > 0" class="badge-red message-avatar__badge">
              {{ conv.unreadCount > 9 ? '9+' : conv.unreadCount }}
            </span>
          </div>
          <div class="message-content">
            <div class="message-head">
              <span class="message-name">{{ conv.partnerName }}</span>
              <span class="message-time">{{ formatMessageTime(conv.lastMessageTime) }}</span>
            </div>
            <p class="message-preview">{{ conv.lastMessage }}</p>
          </div>
        </div>
      </div>
    </section>

    <div style="height: calc(var(--nav-height) + 24px);" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReservations } from '@/composables/useReservations'
import { useMembers } from '@/composables/useMembers'
import { useChat } from '@/composables/useChat'

const router = useRouter()
const auth = useAuthStore()
const { reservations, loading: reservLoading, error: reservError, fetchMyReservations } = useReservations()
const { members, loading: membersLoading, error: membersError, fetchMembers } = useMembers()
const { conversations, loading: chatLoading, error: chatError, fetchConversations } = useChat()

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

// 오늘 날짜 (YYYY-MM-DD 형식)
function getTodayDate() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// 선택된 날짜 (기본값: 오늘)
const selectedDate = ref(getTodayDate())

// 날짜 탭 (오늘부터 4일)
const dateTabs = computed(() => {
  const tabs = []
  for (let i = 0; i < 4; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const label = i === 0
      ? '오늘'
      : i === 1
        ? '내일'
        : `${WEEK_DAYS[d.getDay()]}, ${d.getMonth() + 1}/${d.getDate()}`
    tabs.push({ date: dateStr, label })
  }
  return tabs
})

// 선택된 날짜의 예약
const filteredReservations = computed(() => {
  return reservations.value.filter(r => r.date === selectedDate.value)
})

// 오늘 예약 (통계용)
const todaySessionCount = computed(() => {
  const today = getTodayDate()
  return reservations.value.filter(r => r.date === today).length
})

// 승인 대기 중인 예약 수
const pendingReservationCount = computed(() => {
  return reservations.value.filter(r => r.status === 'pending').length
})

// 회원 수
const memberCount = computed(() => members.value.length)

// 최근 메시지 (최대 3개)
const recentConversations = computed(() => conversations.value.slice(0, 3))

// 메시지 시간 상대적 포맷
function formatMessageTime(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const msgDate = new Date(dateStr)
  const diffMs = now - msgDate
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return '방금'
  if (diffMins < 60) return `${diffMins}분 전`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}시간 전`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}일 전`
}

onMounted(async () => {
  await Promise.all([
    fetchMyReservations('trainer'),
    fetchMembers(),
    fetchConversations(),
  ])
})
</script>

<style src="./TrainerHomeView.css" scoped></style>
