<!-- 트레이너 스케줄 페이지. 캘린더 예약 관리, 날짜별 예약 목록 표시/상태 변경 -->
<template>
  <div class="trainer-schedule">

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

    <!-- ── View Toggle ── -->
    <div class="view-toggle">
      <button
        v-for="tab in viewTabs"
        :key="tab.id"
        class="view-toggle__btn"
        :class="{ 'view-toggle__btn--active': activeView === tab.id }"
        @click="activeView = tab.id"
      >{{ tab.label }}</button>
    </div>

    <!-- ── Monthly Calendar ── -->
    <div v-if="activeView === 'monthly'" class="calendar-card">
      <!-- Month Nav -->
      <div class="calendar-card__nav">
        <button class="calendar-card__arrow" @click="prevMonth">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="calendar-card__month">{{ currentYear }}년 {{ currentMonth }}월</span>
        <button class="calendar-card__arrow" @click="nextMonth">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
          <div v-if="cell.date" class="cal-cell__inner" :class="{ 'cal-cell__inner--selected': isSelected(cell.date) }">
            <span
              class="cal-cell__num"
              :class="{
                'cal-cell__num--selected': isSelected(cell.date),
                'cal-cell__num--sun': cell.isSun,
                'cal-cell__num--sat': cell.isSat,
              }"
            >{{ cell.date }}</span>
            <div v-if="getDots(cell.date).length" class="cal-cell__dots">
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

    <!-- ── Weekly Calendar ── -->
    <div v-if="activeView === 'weekly'" class="weekly-wrap">

      <!-- Week Nav -->
      <div class="weekly-nav">
        <button class="weekly-nav__arrow" @click="prevWeek">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="weekly-nav__label">{{ weekRangeLabel }}</span>
        <button class="weekly-nav__arrow" @click="nextWeek">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Day Header Row -->
      <div class="weekly-days">
        <div class="weekly-days__gutter" />
        <button
          v-for="day in weekDays"
          :key="day.key"
          class="weekly-days__col"
          :class="{ 'weekly-days__col--selected': day.isSelected }"
          @click="selectWeekDay(day)"
        >
          <span class="weekly-days__dow" :class="{ 'weekly-days__dow--sun': day.isSun, 'weekly-days__dow--sat': day.isSat }">{{ day.dow }}</span>
          <span
            class="weekly-days__num"
            :class="{
              'weekly-days__num--selected': day.isSelected,
              'weekly-days__num--sun': day.isSun,
              'weekly-days__num--sat': day.isSat,
            }"
          >{{ day.date }}</span>
          <span v-if="day.dots.length" class="weekly-days__dot-row">
            <span
              v-for="(d, i) in day.dots.slice(0, 2)"
              :key="i"
              class="weekly-days__dot"
              :class="`weekly-days__dot--${d}`"
            />
          </span>
        </button>
      </div>

      <!-- Time Grid -->
      <div class="weekly-grid-wrap">
        <div class="weekly-grid">
          <!-- Left time labels -->
          <div class="weekly-grid__times">
            <div v-for="hour in timeSlots" :key="hour" class="weekly-grid__time-label">
              {{ hour < 10 ? '0' + hour : hour }}:00
            </div>
          </div>
          <!-- Day columns -->
          <div class="weekly-grid__cols">
            <!-- Hour grid lines -->
            <div class="weekly-grid__lines">
              <div v-for="hour in timeSlots" :key="hour" class="weekly-grid__line" />
            </div>
            <!-- Per-day columns -->
            <div
              v-for="day in weekDays"
              :key="day.key"
              class="weekly-grid__col"
              :class="{ 'weekly-grid__col--selected': day.isSelected }"
            >
              <div
                v-for="session in getSessionsForDay(day.fullDate)"
                :key="session.id"
                class="weekly-block"
                :class="`weekly-block--${session.status}`"
                :style="blockStyle(session)"
              >
                <span class="weekly-block__title">{{ session.title }}</span>
                <span class="weekly-block__time">{{ session.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Selected Date Header ── -->
    <div class="schedule-date-header">
      <h2 class="schedule-date-header__title">{{ selectedDateLabel }}</h2>
      <p class="schedule-date-header__count">{{ sessions.length }}개의 예약이 있습니다</p>
    </div>

    <!-- ── Session Cards ── -->
    <div class="schedule-list">

      <!-- Card 1: Completed -->
      <div class="scard scard--completed" @click="goWorkout('Sarah Jenkins')">
        <div class="scard__border" />
        <div class="scard__body">
          <div class="scard__top">
            <h3 class="scard__title">오전 유산소</h3>
            <span class="scard__badge scard__badge--done">완료</span>
          </div>
          <div class="scard__time">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            07:00 - 08:00
          </div>
          <div class="scard__user">
            <div class="scard__avatar">
              <img src="@/assets/icons/person.svg" alt="Sarah Jenkins" width="20" height="20" />
            </div>
            <span class="scard__name">Sarah Jenkins</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Approved -->
      <div class="scard scard--approved" @click="goWorkout('Marcus Chen')">
        <div class="scard__border" />
        <div class="scard__body">
          <div class="scard__top">
            <h3 class="scard__title">HIIT 세션</h3>
            <span class="scard__badge scard__badge--approved">승인됨</span>
          </div>
          <div class="scard__time scard__time--approved">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            10:30 - 11:30
          </div>
          <div class="scard__user-row">
            <div class="scard__user">
              <div class="scard__avatar">
                <img src="@/assets/icons/person.svg" alt="Marcus Chen" width="20" height="20" />
              </div>
              <span class="scard__name">Marcus Chen</span>
            </div>
            <button class="scard__more">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="1.5" fill="#9CA3AF"/>
                <circle cx="12" cy="12" r="1.5" fill="#9CA3AF"/>
                <circle cx="12" cy="19" r="1.5" fill="#9CA3AF"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Card 3: Pending -->
      <div class="scard scard--pending" @click="goWorkout('Emma Wilson')">
        <div class="scard__border" />
        <div class="scard__body scard__body--with-actions">
          <div class="scard__main">
            <div class="scard__top">
              <h3 class="scard__title">근력 강화 훈련</h3>
              <span class="scard__badge scard__badge--pending">대기중</span>
            </div>
            <div class="scard__time">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              14:00 - 15:00
            </div>
            <div class="scard__user">
              <div class="scard__avatar">
                <img src="@/assets/icons/person.svg" alt="Emma Wilson" width="20" height="20" />
              </div>
              <span class="scard__name">Emma Wilson</span>
            </div>
          </div>
          <div class="scard__actions">
            <div class="scard__action-btns">
              <button class="scard__action-btn scard__action-btn--approve">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="#34C759" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="scard__action-btn scard__action-btn--reject">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#FF3B30" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div style="height: calc(var(--nav-height) + 32px);" />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 대기 중 예약 건수 (실제에는 API에서 fetch)
const pendingCount = ref(3)


// ── View toggle ──
const viewTabs = [
  { id: 'monthly', label: '월간' },
  { id: 'weekly',  label: '주간' },
  { id: 'daily',   label: '일간' },
]
const activeView = ref('monthly')

// ── Calendar state ──
const currentYear  = ref(2023)
const currentMonth = ref(10)
const selectedDate = ref(5)

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
  { status: 'cancelled', label: '취소됨' },
]

// Sample dot data: date → array of statuses
const dotData = {
  3:  ['pending'],
  5:  ['done', 'done'],
  7:  ['done'],
  8:  ['cancelled'],
  11: ['pending', 'pending'],
  14: ['approved'],
  15: ['cancelled'],
  18: ['approved'],
  21: ['approved'],
  22: ['pending'],
  24: ['approved'],
  28: ['done'],
  29: ['cancelled'],
  30: ['approved'],
}

function getDots(date) {
  return dotData[date] || []
}

function isSelected(date) {
  return date === selectedDate.value
}

function selectDate(date) {
  selectedDate.value = date
}

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

// ── Session data ──
const sessions = ref([
  { id: 1, title: '오전 유산소',    time: '07:00 - 08:00', name: 'Sarah Jenkins', status: 'done'     },
  { id: 2, title: 'HIIT 세션',     time: '10:30 - 11:30', name: 'Marcus Chen',   status: 'approved' },
  { id: 3, title: '근력 강화 훈련', time: '14:00 - 15:00', name: 'Emma Wilson',   status: 'pending'  },
])

// ── Weekly state ──
// weekStart: first day (Sun) of the displayed week
const weekStart = ref(new Date(2023, 9, 1))  // Sun Oct 1, 2023

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    const dateNum = d.getDate()
    const m = d.getMonth() + 1
    const y = d.getFullYear()
    const fullDate = `${y}-${m}-${dateNum}`
    return {
      key: fullDate,
      fullDate,
      dow: DOW_LABELS[dow],
      date: dateNum,
      month: m,
      isSun: dow === 0,
      isSat: dow === 6,
      isSelected: y === currentYear.value && m === currentMonth.value && dateNum === selectedDate.value,
      dots: dotData[dateNum] || [],
    }
  })
})

const weekRangeLabel = computed(() => {
  const first = weekDays.value[0]
  const last = weekDays.value[6]
  if (first.month === last.month) {
    return `${first.month}월 ${first.date}일 - ${last.date}일`
  }
  return `${first.month}월 ${first.date}일 - ${last.month}월 ${last.date}일`
})

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
}

function selectWeekDay(day) {
  const [y, m, dt] = day.fullDate.split('-').map(Number)
  currentYear.value = y
  currentMonth.value = m
  selectedDate.value = dt
}

// Time grid: 06:00 – 20:00 (15 rows)
const timeSlots = Array.from({ length: 15 }, (_, i) => i + 6)
const GRID_START_HOUR = 6
const CELL_HEIGHT = 48  // px per hour row

// Session data keyed by 'YYYY-M-D' (matching fullDate format)
const weeklySessionData = {
  '2023-10-5': [
    { id: 1, title: '오전 유산소',    time: '07:00', status: 'done',     startH: 7,  startM: 0,  endH: 8,  endM: 0  },
    { id: 2, title: 'HIIT',           time: '10:30', status: 'approved', startH: 10, startM: 30, endH: 11, endM: 30 },
    { id: 3, title: '근력 훈련',     time: '14:00', status: 'pending',  startH: 14, startM: 0,  endH: 15, endM: 0  },
  ],
  '2023-10-3': [
    { id: 4, title: '스트레칭',         time: '09:00', status: 'approved', startH: 9,  startM: 0,  endH: 10, endM: 0  },
  ],
  '2023-10-4': [
    { id: 5, title: '필라테스',         time: '11:00', status: 'pending',  startH: 11, startM: 0,  endH: 12, endM: 0  },
    { id: 6, title: '조간 러닝',         time: '07:30', status: 'done',     startH: 7,  startM: 30, endH: 8,  endM: 30 },
  ],
  '2023-10-6': [
    { id: 7, title: '코어',             time: '15:00', status: 'approved', startH: 15, startM: 0,  endH: 16, endM: 0  },
  ],
  '2023-10-7': [
    { id: 8, title: '스핀마스터',       time: '10:00', status: 'approved', startH: 10, startM: 0,  endH: 11, endM: 30 },
    { id: 9, title: '다이어트',         time: '13:00', status: 'done',     startH: 13, startM: 0,  endH: 14, endM: 0  },
  ],
}

function getSessionsForDay(fullDate) {
  return weeklySessionData[fullDate] || []
}

function blockStyle(session) {
  const top = ((session.startH - GRID_START_HOUR) + session.startM / 60) * CELL_HEIGHT
  const height = Math.max(
    ((session.endH - session.startH) + (session.endM - session.startM) / 60) * CELL_HEIGHT - 3,
    20
  )
  return { top: `${top}px`, height: `${height}px` }
}


function handleAdd() {
  router.push({ name: 'trainer-reservations' })
}

function goWorkout(memberName) {
  router.push({ name: 'trainer-today-workout', query: { member: memberName } })
}
</script>

<style src="./TrainerScheduleView.css" scoped></style>
