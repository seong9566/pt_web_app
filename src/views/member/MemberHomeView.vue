<template>
  <div class="member-home">
    <AppPullToRefresh @refresh="handleRefresh">

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
      <button class="member-home__bell press-effect" @click="handleNotification">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
            stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M13.73 21A2 2 0 0 1 10.27 21"
            stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <span v-if="unreadCount > 0" class="member-home__bell-badge" />
      </button>
    </div>

    <div class="member-home__body">

      <div v-if="hasTrainer === false" class="member-home__unconnected">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6"/>
          <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M16 4L20 8M20 4L16 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <p class="member-home__unconnected-title">아직 담당 트레이너가 없습니다</p>
        <p class="member-home__unconnected-desc">트레이너를 찾아 PT를 시작해보세요</p>
        <button class="member-home__unconnected-btn press-effect" @click="router.push({ name: 'trainer-search' })">
          트레이너 찾기
        </button>
      </div>

      <div v-else-if="hasTrainer === null" class="member-home__loading">
        <AppSkeleton type="rect" width="100%" height="120px" />
        <AppSkeleton type="line" :count="3" />
      </div>

      <template v-else>

      <section class="member-home__section stagger-fade-in" :style="{ '--stagger-index': 0 }">
        <div class="member-home__section-row">
          <h2 class="member-home__section-title">다음 PT 일정</h2>
          <button class="member-home__see-all press-effect" @click="handleSeeAll">전체보기</button>
        </div>

        <div class="member-home__pt-card">
          <span class="member-home__pt-badge">{{ nextSession.dateLabel }}</span>

          <div class="member-home__pt-time-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 7V12L15 14" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="member-home__pt-time-label">수업 시간</span>
          </div>
          <div class="member-home__pt-countdown">{{ nextSession.countdown }}</div>

          <h3 class="member-home__pt-title">{{ nextSession.title }}</h3>

          <div class="member-home__pt-trainer">
            <div class="member-home__pt-trainer-avatar">
              <img v-if="nextSession.trainerPhoto" :src="nextSession.trainerPhoto" alt="trainer" class="member-home__pt-trainer-avatar-img" />
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6"/>
                <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
                  stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <span>{{ nextSession.trainer }} 담당</span>
          </div>

        </div>
      </section>

      <section class="member-home__section stagger-fade-in" :style="{ '--stagger-index': 1 }">
        <div class="member-home__section-row">
          <h2 class="member-home__section-title">다음 예정 운동</h2>
          <button
            v-if="displayExercises.length > 0"
            class="member-home__see-all press-effect"
            @click="goWorkoutDetail"
          >전체보기</button>
        </div>

        <div v-if="workoutLoading" class="member-home__workout-stub">
          <AppSkeleton type="rect" width="100%" height="80px" :count="2" />
        </div>

        <div v-else-if="workoutError" class="member-home__workout-stub">
          <p class="member-home__workout-stub-text member-home__workout-stub-text--error">{{ workoutError }}</p>
        </div>

        <div v-else-if="!currentPlan || !currentPlan.exercises || currentPlan.exercises.length === 0" class="member-home__workout-stub">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="var(--color-gray-600)" stroke-width="1.6"/>
            <path d="M3 9H21" stroke="var(--color-gray-600)" stroke-width="1.6"/>
            <path d="M8 2V6M16 2V6" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M8 14H11" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <p class="member-home__workout-stub-text">오늘 운동 계획이 없습니다</p>
        </div>

        <template v-else>
          <div class="member-home__exercise-list">
            <div
              v-for="(exercise, idx) in displayExercises"
              :key="idx"
              class="member-home__exercise-card stagger-fade-in"
              :style="{ '--stagger-index': idx }"
            >
              <div class="member-home__exercise-header">
                <span class="member-home__exercise-number">{{ idx + 1 }}</span>
                <h3 class="member-home__exercise-name">{{ exercise.name }}</h3>
              </div>
              <p v-if="exercise.sets > 0 && exercise.reps > 0" class="member-home__exercise-detail">
                {{ exercise.sets }}세트 × {{ exercise.reps }}회
              </p>
              <p v-if="exercise.memo" class="member-home__exercise-memo">{{ exercise.memo }}</p>
            </div>
          </div>

          <button
            v-if="remainingExerciseCount > 0"
            class="member-home__exercise-more press-effect"
            @click="goWorkoutDetail"
          >
            외 {{ remainingExerciseCount }}개 더 보기
          </button>
        </template>
      </section>

      <section class="member-home__section stagger-fade-in" :style="{ '--stagger-index': 2 }">
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
import { ref, computed, onMounted, onActivated, watch } from 'vue'

defineOptions({ name: 'MemberHomeView' })
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReservations } from '@/composables/useReservations'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { usePtSessions } from '@/composables/usePtSessions'
import { useNotifications } from '@/composables/useNotifications'
import { useToast } from '@/composables/useToast'
import { useReservationsStore } from '@/stores/reservations'
import AppPullToRefresh from '@/components/AppPullToRefresh.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'

const router = useRouter()
const auth = useAuthStore()
const reservationsStore = useReservationsStore()
const {
  reservations,
  fetchMyReservations,
  checkTrainerConnection,
  getConnectedTrainerId,
  error: reservError,
} = useReservations()
const {
  currentPlan,
  loading: workoutLoading,
  error: workoutError,
  fetchWorkoutPlan,
} = useWorkoutPlans()
const { fetchRemainingByPair } = usePtSessions()
const { unreadCount, getUnreadCount } = useNotifications()
const { showToast, showError, showSuccess } = useToast()

const hasTrainer = ref(null)
const ptRemaining = ref(null)

const loaded = ref(false)

async function loadData() {
  const connected = await checkTrainerConnection()
  hasTrainer.value = connected
  if (connected && auth.user?.id) {
    await fetchMyReservations('member')
    getUnreadCount()
    fetchNextWorkoutPlan()
    const trainerId = await getConnectedTrainerId()
    if (trainerId) {
      ptRemaining.value = await fetchRemainingByPair(auth.user.id, trainerId)
    }
  }
  loaded.value = true
}

function fetchNextWorkoutPlan() {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const nowTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const next = reservations.value
    .filter(r => {
      if (r.status !== 'approved') return false
      const rd = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0]
      return rd > todayStr || (rd === todayStr && (r.start_time || '') > nowTime)
    })
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.start_time || '').localeCompare(b.start_time || ''))[0]
  if (next?.date && auth.user?.id) {
    fetchWorkoutPlan(auth.user.id, next.date)
  }
}

async function handleRefresh() {
  await reservationsStore.loadReservations('member', true)
}

onMounted(() => { if (!loaded.value) loadData() })
onActivated(() => { if (loaded.value && reservationsStore.isStale()) loadData() })

watch(reservError, (val) => { if (val) showError(val) })
watch(workoutError, (val) => { if (val) showError(val) })

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
      dateLabel: '-',
      countdown: '--:--',
      title: '예정된 세션 없음',
      trainer: '-',
      trainerPhoto: null,
    }
  }

  const [, m, d] = (next.date || '').split('-')
  const dateLabel = m && d ? `${Number(m)}월 ${Number(d)}일` : '예정'

  const startTime = (next.start_time || '').slice(0, 5)
  const endTime = (next.end_time || '').slice(0, 5)
  const countdown = endTime ? `${startTime} ~ ${endTime}` : startTime

  return {
    dateLabel,
    countdown,
    title: next.session_type || 'PT 세션',
    trainer: next.partner_name || '트레이너',
    trainerPhoto: next.partner_photo || null,
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

const displayExercises = computed(() => {
  const ex = currentPlan.value?.exercises
  if (!ex || ex.length === 0) return []
  return ex.slice(0, 4)
})

const remainingExerciseCount = computed(() => {
  const total = currentPlan.value?.exercises?.length || 0
  return Math.max(0, total - 4)
})

function handleNotification() { router.push({ name: 'notifications' }) }
function handleSeeAll()       { router.push({ name: 'member-schedule' }) }
function goWorkoutDetail() {
  const today = new Date().toISOString().split('T')[0]
  router.push({ name: 'member-workout-detail', query: { date: today } })
}
</script>

<style src="./MemberHomeView.css" scoped></style>
