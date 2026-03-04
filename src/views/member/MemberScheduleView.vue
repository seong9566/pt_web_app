<!-- 회원 스케줄 페이지. 캘린더에 예약 현황(dot) 표시, 날짜별 예약 목록 조회 -->
<template>
  <div class="member-schedule">

    <!-- ── App Bar ── -->
    <div class="schedule-appbar">
      <h1 class="schedule-appbar__title">내 일정</h1>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- ── Monthly Calendar ── -->
    <div class="calendar-card">
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

      <div class="calendar-card__weekdays">
        <span v-for="day in weekdays" :key="day.label" class="calendar-card__weekday" :class="day.cls">{{ day.label }}</span>
      </div>

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
      <p class="schedule-date-header__count">{{ selectedDaySessions.length }}개의 일정이 있습니다</p>
    </div>

    <!-- ── Session Cards ── -->
    <div class="schedule-list">
      <div
        v-for="session in selectedDaySessions"
        :key="session.id"
        class="scard"
        :class="`scard--${session.status}`"
      >
        <div class="scard__border" />
        <div class="scard__body">
          <div class="scard__top">
            <h3 class="scard__title">{{ session.title }}</h3>
            <span class="scard__badge" :class="`scard__badge--${session.status}`">
              {{ statusLabel(session.status) }}
            </span>
          </div>
          <div class="scard__time" :class="{ 'scard__time--approved': session.status === 'approved' }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ session.time }}
          </div>
          <div class="scard__trainer-row">
            <div class="scard__trainer-info">
              <div class="scard__avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6"/>
                  <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="scard__name">{{ session.trainer }}</span>
            </div>
            <button
              v-if="session.status === 'approved'"
              class="scard__cancel-btn"
              @click.stop="handleCancel(session)"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      <div v-if="selectedDaySessions.length === 0" class="schedule-list__empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M3 9H21" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>등록된 일정이 없습니다</p>
      </div>
    </div>

    <div style="height: calc(var(--nav-height) + 32px);" />

    <!-- ── Floating Action Button (FAB) ── -->
    <button class="member-schedule__fab" @click="handleReserve">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      예약하기
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReservations } from '@/composables/useReservations'

const router = useRouter()
const { reservations, loading, error, fetchMyReservations, updateReservationStatus } = useReservations()

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
  { status: 'cancelled', label: '취소됨' },
]

// ── Fetch reservations on mount ──
onMounted(async () => {
  await fetchMyReservations('member')
})

// ── Compute dots from real reservations ──
const dotsData = computed(() => {
  const dots = {}
  reservations.forEach((res) => {
    if (!dots[res.date]) {
      dots[res.date] = []
    }
    dots[res.date].push(res.status)
  })
  return dots
})

function getDots(date) {
  return dotsData.value[date] || []
}

function isSelected(date) {
  return date === selectedDate.value
}

function selectDate(date) {
  selectedDate.value = date
}

// ── Calendar cells ──
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
const selectedDaySessions = computed(() => {
  const selectedDateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(selectedDate.value).padStart(2, '0')}`
  return reservations.value.filter((res) => res.date === selectedDateStr).map((res) => ({
    id: res.id,
    title: res.session_type || '운동 세션',
    time: `${res.start_time} - ${res.end_time}`,
    trainer: res.partner_name,
    status: res.status,
  }))
})

function statusLabel(status) {
  const map = { pending: '대기중', approved: '승인됨', done: '완료', cancelled: '취소됨' }
  return map[status] || status
}



// ── 핸들러 ──
function handleReserve() {
  router.push('/member/reservation')
}

async function handleCancel(session) {
  if (confirm(`"${session.title}" 예약을 취소하시겠습니까?`)) {
    const success = await updateReservationStatus(session.id, 'cancelled')
    if (success) {
      await fetchMyReservations('member')
    }
  }
}
</script>

<style src="./MemberScheduleView.css" scoped></style>
