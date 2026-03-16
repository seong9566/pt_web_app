<template>
  <div class="trainer-schedule">
    <AppPullToRefresh @refresh="handleRefresh">
      <div class="schedule-appbar">
        <h1 class="schedule-appbar__title">일정 관리</h1>
        <button class="schedule-appbar__badge" @click="handleAdd">
          확인 대기 {{ pendingCount }}건
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="trainer-schedule__view-tabs">
        <button
          class="trainer-schedule__view-tab"
          :class="{ 'trainer-schedule__view-tab--active': currentView === 'weekly' }"
          @click="switchView('weekly')"
        >
          주간
        </button>
        <button
          class="trainer-schedule__view-tab"
          :class="{ 'trainer-schedule__view-tab--active': currentView === 'monthly' }"
          @click="switchView('monthly')"
        >
          월간
        </button>
      </div>

      <div v-if="reassignTarget" class="trainer-schedule__reassign-banner">
        <p class="trainer-schedule__reassign-text">
          <strong>{{ reassignTarget.partner_name }}</strong> 회원의 재배정 시간을 선택하세요
        </p>
        <button class="trainer-schedule__reassign-cancel" @click="clearReassignMode">취소</button>
      </div>

      <section v-if="currentView === 'weekly'" class="trainer-schedule__weekly">
        <AppWeeklyCalendar
          :schedules="weeklySchedules"
          :workSchedule="workSchedule"
          :holidays="holidays"
          :currentWeekStart="currentWeekStart"
          role="trainer"
          @slot-tap="handleSlotTap"
          @schedule-tap="handleScheduleTap"
          @week-change="handleWeekChange"
        />
        <p class="trainer-schedule__weekly-hint">빈 슬롯을 탭하면 회원을 바로 배정할 수 있습니다.</p>
      </section>

      <section v-else class="trainer-schedule__monthly">
        <div class="trainer-schedule__monthly-card">
          <AppCalendar
            :model-value="selectedDate"
            :dots="calendarDots"
            @update:modelValue="handleMonthDateSelect"
            @monthChange="handleMonthChange"
          />
        </div>

        <div class="trainer-schedule__list-header">
          <h2 class="trainer-schedule__list-title">{{ selectedDateLabel }}</h2>
          <p class="trainer-schedule__list-count">{{ selectedDateSessions.length }}개의 일정</p>
        </div>

        <div v-if="loading" class="trainer-schedule__loading">
          <AppSkeleton type="line" :count="3" />
        </div>

        <div v-else-if="selectedDateSessions.length === 0" class="trainer-schedule__empty">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" />
            <path d="M3 9H21" stroke="currentColor" stroke-width="1.5" />
            <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <p>선택한 날짜에 일정이 없습니다.</p>
        </div>

        <div v-else class="trainer-schedule__monthly-list">
          <article
            v-for="session in selectedDateSessions"
            :key="session.id"
            class="schedule-item"
            @click="openScheduleDetail(session.id)"
          >
            <div class="schedule-item__head">
              <div class="schedule-item__member">
                <div class="schedule-item__avatar">
                  <img v-if="session.photo" :src="session.photo" :alt="session.partner_name" class="schedule-item__avatar-img" />
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6" />
                    <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  </svg>
                </div>
                <h3 class="schedule-item__name">{{ session.partner_name }}</h3>
              </div>
              <span class="schedule-item__status" :class="`schedule-item__status--${normalizeStatus(session.status)}`">
                {{ statusLabel(session.status) }}
              </span>
            </div>
            <p class="schedule-item__time">{{ session.start_time }} - {{ session.end_time }}</p>
            <p v-if="session.workoutSummary" class="schedule-item__workout">{{ session.workoutSummary }}</p>
            <button
              v-if="canAssignWorkout(session.status)"
              class="schedule-item__action"
              @click.stop="goWorkout(session)"
            >
              운동 배정하기
            </button>
          </article>
        </div>
      </section>

      <div style="height: calc(var(--nav-height) + 32px);" />
    </AppPullToRefresh>

    <AppBottomSheet v-model="showMemberSheet" title="회원 선택">
      <div class="member-sheet">
        <p class="member-sheet__slot">{{ selectedSlotLabel }}</p>

        <div v-if="memberSheetLoading" class="member-sheet__loading">
          <AppSkeleton type="line" :count="4" />
        </div>

        <div v-else-if="membersWithAvailability.length === 0" class="member-sheet__empty">
          연결된 회원이 없습니다.
        </div>

        <button
          v-for="member in membersWithAvailability"
          :key="member.id"
          class="member-row"
          @click="assignToMember(member.id)"
        >
          <div class="member-row__profile">
            <div class="member-row__avatar">
              <img v-if="member.photo" :src="member.photo" :alt="member.name" class="member-row__avatar-img" />
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6" />
                <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </div>
            <span class="member-row__name">{{ member.name }}</span>
          </div>
          <span
            class="member-row__availability"
            :class="`member-row__availability--${member.availabilityState}`"
          >
            <span class="member-row__emoji">{{ availabilityEmoji(member.availabilityState) }}</span>
            {{ availabilityText(member.availabilityState) }}
          </span>
        </button>
      </div>
    </AppBottomSheet>

    <AppBottomSheet v-model="showDetailSheet" title="일정 상세">
      <div v-if="selectedSchedule" class="detail-sheet">
        <div class="detail-sheet__row">
          <span class="detail-sheet__label">회원</span>
          <span class="detail-sheet__value">{{ selectedSchedule.partner_name }}</span>
        </div>
        <div class="detail-sheet__row">
          <span class="detail-sheet__label">일정</span>
          <span class="detail-sheet__value">{{ toDisplayDate(selectedSchedule.date) }}</span>
        </div>
        <div class="detail-sheet__row">
          <span class="detail-sheet__label">시간</span>
          <span class="detail-sheet__value">{{ selectedSchedule.start_time }} - {{ selectedSchedule.end_time }}</span>
        </div>
        <div class="detail-sheet__row detail-sheet__row--status">
          <span class="detail-sheet__label">상태</span>
          <span class="detail-sheet__status" :class="`detail-sheet__status--${normalizeStatus(selectedSchedule.status)}`">
            {{ statusLabel(selectedSchedule.status) }}
          </span>
        </div>
        <p v-if="selectedSchedule.change_reason" class="detail-sheet__reason">
          변경 사유: {{ selectedSchedule.change_reason }}
        </p>

        <div class="detail-sheet__actions">
          <button
            v-if="canCancel(selectedSchedule.status)"
            class="detail-sheet__btn detail-sheet__btn--danger"
            @click="handleCancelSchedule"
          >
            일정 취소
          </button>
          <button
            v-if="canReassign(selectedSchedule.status)"
            class="detail-sheet__btn detail-sheet__btn--secondary"
            @click="startReassignMode"
          >
            재배정
          </button>
          <button
            v-if="canAssignWorkout(selectedSchedule.status)"
            class="detail-sheet__btn detail-sheet__btn--primary"
            @click="goWorkout()"
          >
            운동 배정하기
          </button>
        </div>
      </div>
    </AppBottomSheet>
  </div>
</template>

<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppCalendar from '@/components/AppCalendar.vue'
import AppPullToRefresh from '@/components/AppPullToRefresh.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppWeeklyCalendar from '@/components/AppWeeklyCalendar.vue'
import { useAvailability } from '@/composables/useAvailability'
import { useMembers } from '@/composables/useMembers'
import { useReservations } from '@/composables/useReservations'
import { useScheduleOverrides } from '@/composables/useScheduleOverrides'
import { useToast } from '@/composables/useToast'
import { useWorkHours } from '@/composables/useWorkHours'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'

defineOptions({ name: 'TrainerScheduleView' })

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const DAY_KEY_BY_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const AVAILABILITY_ORDER = { available: 0, unavailable: 1, unknown: 2 }
const ACTIVE_STATUSES = new Set(['scheduled', 'confirmed', 'change_requested', 'completed', 'pending', 'approved'])

const STATUS_LABELS = {
  scheduled: '배정됨',
  confirmed: '확정됨',
  change_requested: '변경요청',
  completed: '완료',
  pending: '배정됨',
  approved: '확정됨',
}

const STATUS_TO_DOT = {
  pending: 'pending',
  approved: 'approved',
  scheduled: 'scheduled',
  confirmed: 'confirmed',
  change_requested: 'change_requested',
  completed: 'done',
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function parseDate(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addDays(dateStr, amount) {
  const date = parseDate(dateStr)
  date.setDate(date.getDate() + amount)
  return formatDate(date)
}

function getWeekStart(dateStr) {
  const date = parseDate(dateStr)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return formatDate(date)
}

function toMinutes(timeStr) {
  const [hour, minute] = String(timeStr || '00:00').slice(0, 5).split(':').map(Number)
  return (hour * 60) + minute
}

function toDisplayDate(dateStr) {
  const date = parseDate(dateStr)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${DAY_LABELS[date.getDay()]}`
}

function normalizeStatus(status) {
  if (status === 'pending') return 'scheduled'
  if (status === 'approved') return 'confirmed'
  return status
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status
}

function canAssignWorkout(status) {
  return normalizeStatus(status) === 'confirmed'
}

function canCancel(status) {
  const normalized = normalizeStatus(status)
  return normalized === 'scheduled' || normalized === 'confirmed' || normalized === 'change_requested'
}

function canReassign(status) {
  const normalized = normalizeStatus(status)
  return normalized === 'scheduled' || normalized === 'confirmed' || normalized === 'change_requested'
}

function availabilityEmoji(state) {
  if (state === 'available') return '✅'
  if (state === 'unavailable') return '❌'
  return '❓'
}

function availabilityText(state) {
  if (state === 'available') return '가능 시간'
  if (state === 'unavailable') return '등록 외 시간'
  return '등록 없음'
}

function resolveAvailabilityState(availableSlots, dateStr, timeStr) {
  if (!availableSlots) return 'unknown'
  const dayKey = DAY_KEY_BY_INDEX[parseDate(dateStr).getDay()]
  const daySlots = Array.isArray(availableSlots[dayKey]) ? availableSlots[dayKey] : []
  return daySlots.includes(timeStr) ? 'available' : 'unavailable'
}

function formatWorkoutSummary(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) return null
  return exercises
    .filter((exercise) => exercise.name)
    .map((exercise) => `${exercise.name} ${exercise.sets}×${exercise.reps}`)
    .join(', ')
}

const router = useRouter()
const auth = useAuthStore()
const reservationsStore = useReservationsStore()
const { showToast, showSuccess } = useToast()

const { reservations, loading, error, fetchMyReservations, assignSchedule, cancelSchedule, reassignSchedule } = useReservations()
const { days: workDays, selectedUnit, fetchWorkHours, fetchWorkingDays } = useWorkHours()
const { overrides, fetchOverrides } = useScheduleOverrides()
const { fetchMemberAvailabilities } = useAvailability()
const { members, fetchMembers } = useMembers()
const { dayWorkoutPlans, fetchDayWorkoutPlans } = useWorkoutPlans()

const todayStr = formatDate(new Date())

const loaded = ref(false)
const currentView = ref('weekly')
const selectedDate = ref(todayStr)
const currentWeekStart = ref(getWeekStart(todayStr))
const currentMonthKey = ref(todayStr.slice(0, 7))
const workingDays = ref(new Set())

const showMemberSheet = ref(false)
const showDetailSheet = ref(false)
const memberSheetLoading = ref(false)

const selectedSlotDate = ref('')
const selectedSlotTime = ref('')
const selectedSchedule = ref(null)
const reassignTarget = ref(null)

const membersWithAvailability = ref([])

const pendingCount = computed(() => {
  return reservations.value.filter((reservation) => reservation.status === 'scheduled' || reservation.status === 'pending').length
})

const workSchedule = computed(() => {
  const enabledDays = workDays.value.filter((day) => day.enabled)

  if (!enabledDays.length) {
    return {
      startTime: '09:00',
      endTime: '22:00',
      slotDuration: Number(selectedUnit.value) || 60,
    }
  }

  const startTime = enabledDays.reduce((minTime, day) => {
    return toMinutes(day.start) < toMinutes(minTime) ? day.start : minTime
  }, enabledDays[0].start)

  const endTime = enabledDays.reduce((maxTime, day) => {
    return toMinutes(day.end) > toMinutes(maxTime) ? day.end : maxTime
  }, enabledDays[0].end)

  return {
    startTime,
    endTime,
    slotDuration: Number(selectedUnit.value) || 60,
  }
})

const holidays = computed(() => {
  const holidaySet = new Set()

  overrides.value.forEach((override) => {
    if (override.is_working === false) {
      holidaySet.add(override.date)
    }
  })

  if (workingDays.value.size > 0) {
    for (let index = 0; index < 7; index += 1) {
      const dateStr = addDays(currentWeekStart.value, index - 1)
      const dayOfWeek = parseDate(dateStr).getDay()
      if (!workingDays.value.has(dayOfWeek)) {
        holidaySet.add(dateStr)
      }
    }
  }

  return Array.from(holidaySet)
})

const weeklySchedules = computed(() => {
  const weekEnd = addDays(currentWeekStart.value, 7)

  return reservations.value
    .filter((reservation) => {
      return reservation.date >= currentWeekStart.value
        && reservation.date < weekEnd
        && ACTIVE_STATUSES.has(reservation.status)
    })
    .map((reservation) => ({
      id: reservation.id,
      date: reservation.date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      status: reservation.status,
      member_name: reservation.partner_name,
      trainer_name: auth.profile?.name ?? '트레이너',
    }))
})

const calendarDots = computed(() => {
  const dots = {}

  reservations.value.forEach((reservation) => {
    if (!ACTIVE_STATUSES.has(reservation.status)) return
    if (!reservation.date.startsWith(`${currentMonthKey.value}-`)) return

    const day = Number(reservation.date.slice(8, 10))
    const dotStatus = STATUS_TO_DOT[reservation.status] || reservation.status

    if (!dots[day]) {
      dots[day] = []
    }

    if (!dots[day].includes(dotStatus)) {
      dots[day].push(dotStatus)
    }

    dots[day] = dots[day].slice(0, 3)
  })

  return dots
})

const workoutMap = computed(() => {
  const map = {}
  dayWorkoutPlans.value.forEach((plan) => {
    map[plan.member_id] = plan.exercises
  })
  return map
})

const selectedDateSessions = computed(() => {
  return reservations.value
    .filter((reservation) => reservation.date === selectedDate.value && ACTIVE_STATUSES.has(reservation.status))
    .map((reservation) => ({
      id: reservation.id,
      date: reservation.date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      status: reservation.status,
      partner_name: reservation.partner_name,
      photo: reservation.partner_photo,
      member_id: reservation.member_id,
      change_reason: reservation.change_reason,
      workoutSummary: formatWorkoutSummary(workoutMap.value[reservation.member_id]),
    }))
})

const selectedDateLabel = computed(() => toDisplayDate(selectedDate.value))

const selectedSlotLabel = computed(() => {
  if (!selectedSlotDate.value || !selectedSlotTime.value) {
    return '배정할 시간 슬롯을 선택해주세요.'
  }

  return `${toDisplayDate(selectedSlotDate.value)} ${selectedSlotTime.value}`
})

async function loadOverrides(monthKey) {
  if (!auth.user?.id || !monthKey) return
  await fetchOverrides(auth.user.id, monthKey)
}

async function loadWorkingDaySet() {
  if (!auth.user?.id) {
    workingDays.value = new Set()
    return
  }

  workingDays.value = await fetchWorkingDays(auth.user.id)
}

async function loadWeeklySchedules() {
  await fetchMyReservations('trainer')
  await fetchDayWorkoutPlans(selectedDate.value)
}

async function loadData() {
  await Promise.all([
    fetchMyReservations('trainer'),
    fetchWorkHours(),
    fetchMembers(),
  ])

  await loadWorkingDaySet()
  await loadOverrides(currentMonthKey.value)
  await fetchDayWorkoutPlans(selectedDate.value)

  loaded.value = true
}

async function handleRefresh() {
  await reservationsStore.loadReservations('trainer', true)
  await fetchMyReservations('trainer')
  await fetchWorkHours()
  await fetchMembers()
  await loadWorkingDaySet()

  const monthKey = currentView.value === 'weekly'
    ? currentWeekStart.value.slice(0, 7)
    : currentMonthKey.value

  await loadOverrides(monthKey)
  await fetchDayWorkoutPlans(selectedDate.value)
}

async function switchView(view) {
  if (currentView.value === view) return

  currentView.value = view

  if (!loaded.value) return

  const monthKey = view === 'weekly'
    ? currentWeekStart.value.slice(0, 7)
    : currentMonthKey.value

  await loadOverrides(monthKey)
}

function handleAdd() {
  router.push({ name: 'trainer-reservations' })
}

async function handleWeekChange({ weekStart }) {
  currentWeekStart.value = weekStart
  selectedDate.value = weekStart
  currentMonthKey.value = weekStart.slice(0, 7)
  await loadOverrides(currentMonthKey.value)
}

async function handleMonthChange(month) {
  currentMonthKey.value = month
  await loadOverrides(month)
}

async function handleMonthDateSelect(date) {
  selectedDate.value = date
  currentWeekStart.value = getWeekStart(date)
  currentMonthKey.value = date.slice(0, 7)
  currentView.value = 'weekly'
  await loadOverrides(currentMonthKey.value)
}

async function loadMembersWithAvailability(date, time) {
  memberSheetLoading.value = true

  try {
    const weekStart = getWeekStart(date)

    const [, availabilityRows] = await Promise.all([
      fetchMembers(),
      fetchMemberAvailabilities(weekStart),
    ])

    const availabilityMap = new Map(
      (availabilityRows || []).map((availability) => [availability.member_id, availability])
    )

    const baseMembers = members.value.length > 0
      ? members.value.map((member) => ({
        id: member.id,
        name: member.name,
        photo: member.photo,
      }))
      : (availabilityRows || []).map((member) => ({
        id: member.member_id,
        name: member.name,
        photo: member.photo_url,
      }))

    membersWithAvailability.value = baseMembers
      .map((member) => {
        const availableSlots = availabilityMap.get(member.id)?.available_slots ?? null

        return {
          ...member,
          availabilityState: resolveAvailabilityState(availableSlots, date, time),
        }
      })
      .sort((a, b) => AVAILABILITY_ORDER[a.availabilityState] - AVAILABILITY_ORDER[b.availabilityState])
  } finally {
    memberSheetLoading.value = false
  }
}

async function handleSlotTap({ date, time }) {
  selectedSlotDate.value = date
  selectedSlotTime.value = time
  selectedDate.value = date

  if (reassignTarget.value) {
    const success = await reassignSchedule(reassignTarget.value.id, date, time)

    if (success) {
      showSuccess('일정을 재배정했습니다.')
      clearReassignMode()
      await loadWeeklySchedules()
      return
    }

    showToast(error.value || '일정 재배정에 실패했습니다.', 'error')
    return
  }

  await loadMembersWithAvailability(date, time)
  showMemberSheet.value = true
}

function openScheduleDetail(scheduleId) {
  selectedSchedule.value = reservations.value.find((reservation) => reservation.id === scheduleId) ?? null
  showDetailSheet.value = !!selectedSchedule.value
}

function handleScheduleTap({ scheduleId }) {
  openScheduleDetail(scheduleId)
}

async function assignToMember(memberId) {
  showMemberSheet.value = false

  const assigned = await assignSchedule(memberId, selectedSlotDate.value, selectedSlotTime.value)
  if (!assigned) {
    showToast(error.value || '일정 배정에 실패했습니다.', 'error')
    return
  }

  showSuccess('일정을 배정했습니다.')
  currentWeekStart.value = getWeekStart(selectedSlotDate.value)
  await loadWeeklySchedules()
}

async function handleCancelSchedule() {
  if (!selectedSchedule.value) return

  const cancelled = await cancelSchedule(selectedSchedule.value.id)
  if (!cancelled) {
    showToast(error.value || '일정 취소에 실패했습니다.', 'error')
    return
  }

  showSuccess('일정을 취소했습니다.')
  showDetailSheet.value = false
  clearReassignMode()
  await loadWeeklySchedules()
}

async function startReassignMode() {
  if (!selectedSchedule.value) return

  reassignTarget.value = selectedSchedule.value
  showDetailSheet.value = false
  selectedDate.value = selectedSchedule.value.date
  currentWeekStart.value = getWeekStart(selectedSchedule.value.date)
  currentMonthKey.value = selectedSchedule.value.date.slice(0, 7)
  currentView.value = 'weekly'

  await loadOverrides(currentMonthKey.value)
  showToast('재배정할 빈 슬롯을 선택해주세요.', 'info')
}

function clearReassignMode() {
  reassignTarget.value = null
}

function goWorkout(session = selectedSchedule.value) {
  if (!session?.member_id) return

  showDetailSheet.value = false

  router.push({
    name: 'trainer-today-workout',
    query: {
      memberId: session.member_id,
      date: session.date,
    },
  })
}

watch(selectedDate, (date) => {
  if (!loaded.value || !date) return
  fetchDayWorkoutPlans(date)
})

watch(error, (message) => {
  if (message) showToast(message, 'error')
})

onMounted(() => {
  if (!loaded.value) {
    loadData()
  }
})

onActivated(async () => {
  if (!loaded.value) return

  await fetchMyReservations('trainer')
  await fetchWorkHours()
  await fetchMembers()
  await loadWorkingDaySet()

  const monthKey = currentView.value === 'weekly'
    ? currentWeekStart.value.slice(0, 7)
    : currentMonthKey.value

  await loadOverrides(monthKey)
  await fetchDayWorkoutPlans(selectedDate.value)
})
</script>

<style src="./TrainerScheduleView.css" scoped></style>
