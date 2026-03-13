<!-- 트레이너 스케줄 페이지. 캘린더 예약 관리, 날짜별 예약 목록 표시/상태 변경 -->
<template>
  <div class="trainer-schedule">
    <AppPullToRefresh @refresh="handleRefresh">

    <!-- ── Top App Bar ── -->
    <div class="schedule-appbar">
      <h1 class="schedule-appbar__title">일정 관리</h1>
      <button class="schedule-appbar__badge" @click="handleAdd">
        대기 {{ pendingCount }}건
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- ── Monthly Calendar ── -->
    <div class="calendar-card">
      <!-- Month Nav -->
      <div class="calendar-card__nav">
        <button class="calendar-card__arrow" @click="prevMonth">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-400)">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="calendar-card__month">{{ currentYear }}년 {{ currentMonth }}월</span>
        <button class="calendar-card__arrow" @click="nextMonth">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-400)">
            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Weekday Labels -->
      <div class="calendar-card__weekdays">
        <span v-for="day in weekdays" :key="day.label" class="calendar-card__weekday" :class="day.cls">{{ day.label }}</span>
      </div>

      <!-- Date Grid -->
      <div class="calendar-card__grid">
        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          class="cal-cell"
          :class="{ 'cal-cell--empty': !cell.date }"
          @click="cell.date && selectDate(cell.date)"
        >
          <div v-if="cell.date" class="cal-cell__inner" :class="{ 'cal-cell__inner--selected': isSelected(cell.date), 'cal-cell__inner--today': !isSelected(cell.date) && isToday(cell.date) }">
            <span
              class="cal-cell__num"
              :class="{
                'cal-cell__num--selected': isSelected(cell.date),
                'cal-cell__num--today': !isSelected(cell.date) && isToday(cell.date),
                'cal-cell__num--sun': cell.isSun,
                'cal-cell__num--sat': cell.isSat,
                'cal-cell__num--off': isNonWorkingDay(cell.date),
              }"
            >{{ cell.date }}</span>
            <div class="cal-cell__dots">
              <span
                v-for="(dot, i) in getDots(cell.date)"
                :key="i"
                class="cal-cell__dot"
                :class="`cal-cell__dot--${dot}`"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="calendar-card__legend">
        <span v-for="item in legend" :key="item.status" class="legend-item">
          <span class="legend-item__dot" :class="`legend-item__dot--${item.status}`" />
          {{ item.label }}
        </span>
      </div>
    </div>


    <!-- ── Selected Date Header ── -->
    <div class="schedule-date-header">
      <h2 class="schedule-date-header__title">{{ selectedDateLabel }}</h2>
      <p class="schedule-date-header__count">{{ sessions.length }}개의 예약이 있습니다</p>
    </div>

    <!-- ── Session Cards ── -->
    <div class="schedule-list">
      <div v-if="loading" class="schedule-list__loading">
        <AppSkeleton type="line" :count="4" />
      </div>
      <div v-else-if="sessions.length === 0" class="schedule-list__empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M3 9H21" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>등록된 예약이 없습니다</p>
      </div>
      <div
        v-for="session in sessions"
        :key="session.id"
        class="scard"
        :class="`scard--${session.status}`"
      >
        <div class="scard__border" />
        <div class="scard__body">
          <div class="scard__top">
            <div class="scard__profile">
              <div class="scard__avatar">
                <img v-if="session.photo" :src="session.photo" :alt="session.name" width="32" height="32" />
                <img v-else src="@/assets/icons/person.svg" :alt="session.name" width="20" height="20" />
              </div>
              <h3 class="scard__title">{{ session.title }}</h3>
            </div>
            <span class="scard__badge" :class="`scard__badge--${session.status === 'completed' ? 'done' : session.status}`">
              {{ session.status === 'approved' ? '승인됨' : '완료' }}
            </span>
          </div>
          <div class="scard__time" :class="{ 'scard__time--approved': session.status === 'approved' }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ session.time }}
          </div>
          <!-- 배정된 운동 요약 -->
          <div v-if="formatWorkoutSummary(workoutMap[session.member_id])" class="scard__workout-summary">
            <img src="@/assets/icons/trainer.svg" alt="trainer icon" width="14" height="14"/>
            <span>{{ formatWorkoutSummary(workoutMap[session.member_id]) }}</span>
          </div>
          <div v-else-if="session.status === 'approved'" class="scard__workout-summary scard__workout-summary--empty">
            <img src="@/assets/icons/trainer.svg" alt="trainer icon" width="14" height="14" />
            <span>아직 운동이 배정되지 않았습니다</span>
          </div>
          <button
            v-if="session.status === 'approved'"
            class="scard__action"
            @click.stop="goWorkout(session)"
          >
            운동 배정하기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
         </div>
    </div>

    </div>
    <div style="height: calc(var(--nav-height) + 32px);" />
    </AppPullToRefresh>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'

defineOptions({ name: 'TrainerScheduleView' })
import { useRouter } from 'vue-router'
import { useReservations } from '@/composables/useReservations'
import { useWorkHours } from '@/composables/useWorkHours'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'
import AppPullToRefresh from '@/components/AppPullToRefresh.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'

const router = useRouter()
const auth = useAuthStore()
const reservationsStore = useReservationsStore()
const { reservations, loading, error, fetchMyReservations } = useReservations()
const { days: workHours, fetchWorkHours, fetchWorkingDays } = useWorkHours()
const { dayWorkoutPlans, fetchDayWorkoutPlans } = useWorkoutPlans()
const { showToast } = useToast()

const loaded = ref(false)
const workingDays = ref(new Set())

async function loadData() {
  await fetchMyReservations('trainer')
  await fetchWorkHours()
  workingDays.value = await fetchWorkingDays(auth.user?.id)
  await fetchDayWorkoutPlans(selectedDateStr.value)
  loaded.value = true
}

async function handleRefresh() {
  await reservationsStore.loadReservations('trainer', true)
  await fetchMyReservations('trainer')
  await fetchDayWorkoutPlans(selectedDateStr.value)
}

onMounted(() => { if (!loaded.value) loadData() })
onActivated(async () => {
  if (!loaded.value) return
  await fetchMyReservations('trainer')
  await fetchDayWorkoutPlans(selectedDateStr.value)
  await fetchWorkHours()
  workingDays.value = await fetchWorkingDays(auth.user?.id)
})

// 대기 중 예약 건수 (실제 데이터에서 계산)
const pendingCount = computed(() => {
  return reservations.value.filter(res => res.status === 'pending').length
})

// ── Calendar state ──
const now = new Date()
const currentYear  = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const selectedDate = ref(now.getDate())

const weekdays = [
  { label: '일', cls: 'calendar-card__weekday--sun' },
  { label: '월', cls: '' },
  { label: '화', cls: '' },
  { label: '수', cls: '' },
  { label: '목', cls: '' },
  { label: '금', cls: '' },
  { label: '토', cls: 'calendar-card__weekday--sat' },
]

const legend = [
  { status: 'pending',   label: '대기중' },
  { status: 'approved',  label: '승인됨' },
  { status: 'done',      label: '완료' },
]

// ── Compute dots from real reservations ──
// dotsData 키: "YYYY-MM-DD", 값: dot CSS 클래스 배열 (completed → done 변환)
const STATUS_TO_DOT = { pending: 'pending', approved: 'approved', completed: 'done' }

const dotsData = computed(() => {
  const dots = {}
  reservations.value.forEach((res) => {
    if (res.status === 'cancelled') return
    if (!dots[res.date]) {
      dots[res.date] = []
    }
    dots[res.date].push(STATUS_TO_DOT[res.status] || res.status)
  })
  const result = {}
  for (const [date, statusArray] of Object.entries(dots)) {
    result[date] = statusArray.slice(0, 3)
  }
  return result
})

// date: day number (1-31) → full date string으로 변환하여 dotsData 조회
function getDots(date) {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`
  return dotsData.value[dateStr] || []
}

function isSelected(date) {
  return date === selectedDate.value
}

function isToday(date) {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return dateStr === todayStr
}

function selectDate(date) {
  selectedDate.value = date
}

// ── 비근무일 helpers ──
function isNonWorkingDay(date) {
  if (workingDays.value.size === 0) return false
  const dow = new Date(currentYear.value, currentMonth.value - 1, date).getDay()
  return !workingDays.value.has(dow)
}

const selectedDateStr = computed(() => {
  return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(selectedDate.value).padStart(2, '0')}`
})

const dayIdByDow = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// Build calendar cells (including leading empty cells for day-of-week offset)
const calendarCells = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ key: `empty-${i}`, date: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = (firstDay + d - 1) % 7
    cells.push({
      key: `day-${d}`,
      date: d,
      isSun: dayOfWeek === 0,
      isSat: dayOfWeek === 6,
    })
  }
  return cells
})

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// ── Selected date label ──
const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const selectedDateLabel = computed(() => {
  const dayOfWeek = new Date(currentYear.value, currentMonth.value - 1, selectedDate.value).getDay()
  return `${currentMonth.value}월 ${selectedDate.value}일 ${dayNames[dayOfWeek]}`
})

// ── Filter reservations by selected date ──
const sessions = computed(() => {
  return reservations.value
    .filter((res) => res.date === selectedDateStr.value && (res.status === 'approved' || res.status === 'completed'))
    .map((res) => ({
      id: res.id,
      title: res.partner_name,
      time: `${res.start_time} - ${res.end_time}`,
      name: res.partner_name,
      photo: res.partner_photo,
      status: res.status,
      member_id: res.member_id,
    }))
})

/** 회원별 운동 계획 맵 생성 (member_id → exercises 배열) */
const workoutMap = computed(() => {
  const map = {}
  for (const plan of dayWorkoutPlans.value) {
    map[plan.member_id] = plan.exercises
  }
  return map
})

/** 운동 계획 배열을 요약 문자열로 변환 (예: "벤치프레스 3x10, 스쿼트 4x8") */
function formatWorkoutSummary(exercises) {
  if (!exercises || exercises.length === 0) return null
  return exercises
    .filter(e => e.name)
    .map(e => `${e.name} ${e.sets}×${e.reps}`)
    .join(', ')
}

function handleAdd() {
  router.push({ name: 'trainer-reservations' })
}

function goWorkout(session) {
  router.push({
    name: 'trainer-today-workout',
    query: { memberId: session.member_id, date: selectedDateStr.value }
  })
}

watch(selectedDateStr, (date) => { if (loaded.value) fetchDayWorkoutPlans(date) })
watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./TrainerScheduleView.css" scoped></style>
