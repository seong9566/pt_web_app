<!-- 회원 홈 대시보드. 다음 예약, 오늘의 운동, 이번 주 목표 등 표시 -->
<template>
  <div class="member-home">
    <AppPullToRefresh @refresh="handleRefresh">

    <!-- ── Header ── -->
    <div class="member-home__header">
      <div class="member-home__header-left">
        <div class="member-home__avatar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="member-home__greeting">
          <span class="member-home__greeting-sub">환영합니다,</span>
          <div class="member-home__greeting-row">
            <h1 class="member-home__greeting-name">{{ userName }} 님</h1>
            <span class="member-home__pt-header-badge">PT {{ ptRemaining !== null ? ptRemaining + '회' : '-' }}</span>
            <span class="member-home__online-dot" />
          </div>
        </div>
      </div>
      <button class="member-home__bell" @click="handleNotification">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
            stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M13.73 21A2 2 0 0 1 10.27 21"
            stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <span v-if="unreadCount > 0" class="member-home__bell-badge" />
      </button>
    </div>

    <!-- ── Body ── -->
    <div class="member-home__body">

      <!-- Unconnected state -->
      <div v-if="hasTrainer === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 16px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="var(--color-gray-600)" stroke-width="1.6"/>
          <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M16 4L20 8M20 4L16 8" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">아직 담당 트레이너가 없습니다</p>
        <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">트레이너를 찾아 PT를 시작해보세요</p>
        <button
          style="margin-top: 8px; padding: 14px 32px; background: var(--color-blue-primary); color: white; border: none; border-radius: var(--radius-medium); font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); cursor: pointer;"
          @click="router.push({ name: 'trainer-search' })"
        >
          트레이너 찾기
        </button>
      </div>

      <!-- Loading state -->
      <div v-else-if="hasTrainer === null" style="text-align: center; padding: 60px 20px; color: var(--color-gray-600);">
        불러오는 중...
      </div>

      <!-- Connected state (existing dashboard) -->
      <template v-else>

      <!-- ── 다음 PT 일정 ── -->
      <section class="member-home__section">
        <div class="member-home__section-row">
          <h2 class="member-home__section-title">다음 PT 일정</h2>
          <button class="member-home__see-all" @click="handleSeeAll">전체보기</button>
        </div>

        <div class="member-home__pt-card">
          <!-- 배지 -->
          <span class="member-home__pt-badge">오늘</span>

          <!-- 수업 시간 -->
          <div class="member-home__pt-time-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 7V12L15 14" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="member-home__pt-time-label">수업 시간</span>
          </div>
          <div class="member-home__pt-countdown">{{ nextSession.countdown }}</div>

          <!-- 세션 제목 -->
          <h3 class="member-home__pt-title">{{ nextSession.title }}</h3>

          <!-- 트레이너 -->
          <div class="member-home__pt-trainer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6"/>
              <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <span>{{ nextSession.trainer }} 담당</span>
          </div>

          <!-- 오늘의 운동 루틴 -->
          <div class="member-home__pt-routine">
            <p class="member-home__pt-routine-label">오늘의 운동 루틴</p>
            <ul class="member-home__pt-routine-list">
              <li v-for="item in nextSession.routine" :key="item" class="member-home__pt-routine-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" fill="rgba(0,122,255,0.08)"
                    stroke="var(--color-blue-primary)" stroke-width="1.4"/>
                  <path d="M8 12L11 15L16 9" stroke="var(--color-blue-primary)" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>


      <!-- ── 오늘의 운동 ── -->
      <section class="member-home__section">
        <h2 class="member-home__section-title">오늘의 운동</h2>

        <!-- 로딩 중 -->
        <div v-if="workoutLoading" class="member-home__workout-stub">
          <p class="member-home__workout-stub-text">로딩 중...</p>
        </div>

        <!-- 에러 -->
        <div v-else-if="workoutError" class="member-home__workout-stub">
          <p class="member-home__workout-stub-text member-home__workout-stub-text--error">{{ workoutError }}</p>
        </div>

        <!-- 운동 계획 없음 -->
        <div v-else-if="!currentPlan" class="member-home__workout-stub">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="var(--color-gray-600)" stroke-width="1.6"/>
            <path d="M3 9H21" stroke="var(--color-gray-600)" stroke-width="1.6"/>
            <path d="M8 2V6M16 2V6" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M8 14H11" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <p class="member-home__workout-stub-text">오늘 운동 계획이 없습니다</p>
        </div>

        <!-- 운동 계획 있음 -->
        <div v-else class="member-home__workout-card" @click="goWorkoutDetail" style="cursor: pointer;">
          <p class="member-home__workout-content">{{ workoutPreview }}</p>
        </div>
      </section>

      <!-- ── 이번 주 목표 ── -->
      <section class="member-home__section">
        <div class="member-home__goal-card">
          <div class="member-home__goal-left">
            <span class="member-home__goal-badge">이번 주 목표</span>
            <div class="member-home__goal-count">
              <span class="member-home__goal-count-num">{{ weekGoal.done }}/{{ weekGoal.total }}</span>
              <div class="member-home__goal-icons">
                <span v-for="i in weekGoal.total" :key="i"
                  class="member-home__goal-icon"
                  :class="{ 'member-home__goal-icon--done': i <= weekGoal.done }">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12C4 8 6.5 6 8 4.5L12 2L16 4.5C17.5 6 20 8 20 12C20 16 17 19 12 22C7 19 4 16 4 12Z"
                      fill="currentColor"/>
                  </svg>
                </span>
              </div>
            </div>
            <p class="member-home__goal-msg">{{ weekGoal.message }}</p>
          </div>

          <!-- 원형 프로그레스 -->
          <div class="member-home__goal-circle">
            <svg width="76" height="76" viewBox="0 0 76 76">
              <circle cx="38" cy="38" r="30" fill="none"
                stroke="rgba(255,255,255,0.12)" stroke-width="6"/>
              <circle cx="38" cy="38" r="30" fill="none"
                stroke="var(--color-green)" stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="circleOffset"
                transform="rotate(-90 38 38)"/>
            </svg>
            <span class="member-home__goal-pct">{{ weekGoal.pct }}%</span>
          </div>
        </div>
      </section>

      <div style="height: calc(var(--nav-height) + 16px);" />

      </template>
    </div>
    </AppPullToRefresh>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'

defineOptions({ name: 'MemberHomeView' })
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReservations } from '@/composables/useReservations'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { usePtSessions } from '@/composables/usePtSessions'
import { useNotifications } from '@/composables/useNotifications'
import { useReservationsStore } from '@/stores/reservations'
import AppPullToRefresh from '@/components/AppPullToRefresh.vue'

const router = useRouter()
const auth = useAuthStore()
const reservationsStore = useReservationsStore()
const {
  reservations,
  fetchMyReservations,
  checkTrainerConnection,
  getConnectedTrainerId,
} = useReservations()
const {
  currentPlan,
  loading: workoutLoading,
  error: workoutError,
  fetchWorkoutPlan,
} = useWorkoutPlans()
const { fetchRemainingByPair } = usePtSessions()
const { unreadCount, getUnreadCount } = useNotifications()

const hasTrainer = ref(null)
const ptRemaining = ref(null)

const loaded = ref(false)

async function loadData() {
  const connected = await checkTrainerConnection()
  hasTrainer.value = connected
  if (connected && auth.user?.id) {
    fetchMyReservations('member')

    const today = new Date().toISOString().split('T')[0]
    fetchWorkoutPlan(auth.user.id, today)

    getUnreadCount()

    const trainerId = await getConnectedTrainerId()
    if (trainerId) {
      ptRemaining.value = await fetchRemainingByPair(auth.user.id, trainerId)
    }
  }
  loaded.value = true
}

async function handleRefresh() {
  await reservationsStore.loadReservations('member', true)
}

onMounted(() => { if (!loaded.value) loadData() })
onActivated(() => { if (loaded.value && reservationsStore.isStale()) loadData() })

const userName = computed(() => auth.profile?.name || '회원')

const nextSession = computed(() => {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const nowTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

  const upcoming = reservations.value
    .filter(r => {
      if (r.status !== 'approved') return false
      const rDate = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0]
      return rDate > todayStr || (rDate === todayStr && (r.start_time || '') > nowTime)
    })
    .sort((a, b) => {
      const dateCompare = (a.date || '').localeCompare(b.date || '')
      if (dateCompare !== 0) return dateCompare
      return (a.start_time || '').localeCompare(b.start_time || '')
    })

  const next = upcoming[0]
  if (!next) {
    return {
      countdown: '--:--',
      title: '예정된 세션 없음',
      trainer: '-',
      routine: [],
    }
  }

  return {
    countdown: (next.start_time || '').slice(0, 5),
    title: next.session_type || 'PT 세션',
    trainer: next.partner_name || '트레이너',
    routine: [],
  }
})

const weekGoal = computed(() => {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())

  const weekReservations = reservations.value.filter(r => {
    const d = new Date(r.date)
    return d >= weekStart && (r.status === 'approved' || r.status === 'completed')
  })

  const total = weekReservations.length || 1
  const done = weekReservations.filter(r => r.status === 'completed').length
  const pct = Math.round((done / total) * 100)

  return {
    done,
    total,
    pct,
    message: pct >= 100 ? '이번 주 목표 달성!' : pct >= 50 ? '절반 이상 완료!' : '이번 주도 힘내세요!',
  }
})

const circumference = 2 * Math.PI * 30
const circleOffset = computed(() =>
  circumference * (1 - weekGoal.value.pct / 100)
)

const workoutPreview = computed(() => {
  const ex = currentPlan.value?.exercises
  if (!ex || ex.length === 0) return ''
  const names = ex.slice(0, 2).map(e => e.name).join(', ')
  return ex.length > 2 ? `${names} 외 ${ex.length - 2}개` : names
})

function handleNotification() { router.push({ name: 'notifications' }) }
function handleSeeAll()       { router.push({ name: 'member-schedule' }) }
function goWorkoutDetail() {
  const today = new Date().toISOString().split('T')[0]
  router.push({ name: 'member-workout-detail', query: { date: today } })
}
</script>

<style src="./MemberHomeView.css" scoped></style>
