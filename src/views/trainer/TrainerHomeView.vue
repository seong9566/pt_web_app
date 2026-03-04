<!-- 트레이너 홈 대시보드. 오늘 예약 현황, 회원 수, 주간 통계 표시 -->
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
            <img src="@/assets/icons/trainer.svg" width="16" height="16" alt="up" />
          </div>
          <span class="stat-badge">오늘</span>
        </div>
        <div class="stat-card__body">
          <div class="stat-value">8</div>
          <div class="stat-label">총 세션</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__head">
          <div class="stat-icon stat-icon--blue">
            <img src="@/assets/icons/up.svg" width="16" height="16" alt="up" />
          </div>
          <span class="stat-badge">이번주</span>
        </div>
        <div class="stat-card__body">
          <div class="stat-value">92%</div>
          <div class="stat-label">완료율</div>
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="section-header">
        <h2 class="section-title">오늘의 일정</h2>
        <a href="#" class="section-link">전체보기</a>
      </div>
      
      <div class="date-tabs">
        <button class="date-tab date-tab--active">오늘</button>
        <button class="date-tab">내일</button>
        <button class="date-tab">토, 14일</button>
        <button class="date-tab">일, 15일</button>
      </div>

      <div class="schedule-list">
         <div v-if="todayReservations.length === 0" style="padding: 20px; text-align: center; color: var(--color-gray-600);">
           오늘 예약이 없습니다.
         </div>
         <div v-for="reservation in todayReservations" :key="reservation.id" class="schedule-card">
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
      </div>
      
      <div style="padding: 20px; text-align: center; color: var(--color-gray-600);">
        준비 중입니다.
      </div>
    </section>

    <div style="height: calc(var(--nav-height) + 24px);" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useReservations } from '@/composables/useReservations'
import { useMembers } from '@/composables/useMembers'

const auth = useAuthStore()
const { reservations, loading: reservLoading, error: reservError, fetchMyReservations } = useReservations()
const { members, loading: membersLoading, error: membersError, fetchMembers } = useMembers()

// 오늘 날짜 (YYYY-MM-DD 형식)
function getTodayDate() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// 오늘 예약만 필터링
const todayReservations = computed(() => {
  const today = getTodayDate()
  return reservations.value.filter(r => r.date === today)
})

// 승인 대기 중인 예약 수
const pendingReservationCount = computed(() => {
  return reservations.value.filter(r => r.status === 'pending').length
})

// 회원 수
const memberCount = computed(() => {
  return members.value.length
})

onMounted(async () => {
  await fetchMyReservations('trainer')
  await fetchMembers()
})
</script>

<style src="./TrainerHomeView.css" scoped></style>
