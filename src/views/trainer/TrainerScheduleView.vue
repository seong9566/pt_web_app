<template>
  <div class="trainer-schedule">
    <AppPullToRefresh @refresh="handleRefresh">
      <div class="schedule-appbar">
        <h1 class="schedule-appbar__title">일정 관리</h1>
        <button class="schedule-appbar__badge" @click="handleAdd">
          변경 요청 {{ changeRequestCount }}건
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
          :slotDuration="workSchedule.slotDuration"
          :holidays="holidays"
          :currentWeekStart="currentWeekStart"
          :availabilities="weekAvailabilities"
          :memberColors="memberColorMap"
          role="trainer"
          :draggable="true"
          :loading="calendarLoading"
          @slot-tap="handleSlotTap"
          @schedule-tap="handleScheduleTap"
          @schedule-drop="handleScheduleDrop"
          @week-change="handleWeekChange"
        />
        <div v-if="weeklyLegendMembers.length" class="trainer-schedule__legend">
          <div v-for="member in weeklyLegendMembers" :key="member.id" class="trainer-schedule__legend-item">
            <span class="trainer-schedule__legend-dot" :style="{ backgroundColor: member.color }" />
            <span class="trainer-schedule__legend-name">{{ member.name }}</span>
          </div>
        </div>
        <p class="trainer-schedule__weekly-hint">빈 슬롯을 탭하면 회원을 바로 배정할 수 있습니다.</p>
      </section>

      <section v-else class="trainer-schedule__monthly">
        <div v-if="calendarLoading" class="calendar-skeleton calendar-skeleton--monthly">
          <div class="calendar-skeleton__header">
            <AppSkeleton type="rect" width="100%" height="36px" border-radius="var(--radius-small)" />
          </div>
          <div class="calendar-skeleton__day-bar">
            <AppSkeleton
              v-for="i in 7"
              :key="i"
              type="rect"
              width="100%"
              height="24px"
              border-radius="var(--radius-small)"
            />
          </div>
          <div class="calendar-skeleton__month-grid">
            <AppSkeleton
              v-for="i in 5"
              :key="i"
              type="rect"
              width="100%"
              height="40px"
              border-radius="var(--radius-small)"
            />
          </div>
          <div class="calendar-skeleton__list">
            <AppSkeleton type="line" :count="3" />
          </div>
        </div>
        <template v-else>
          <div class="trainer-schedule__monthly-card">
            <AppCalendar
              :model-value="selectedDate"
              :dots="calendarDots"
              :colorDots="calendarColorDots"
              :holidays="monthlyHolidays"
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
              <p class="schedule-item__time">
                <template v-if="session.status === 'change_requested' && session.requested_start_time">
                  {{ session.start_time?.slice(0,5) }}→{{ session.requested_start_time?.slice(0,5) }}
                </template>
                <template v-else>
                  {{ session.start_time?.slice(0,5) }} - {{ session.end_time?.slice(0,5) }}
                </template>
              </p>
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
        </template>
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
        <div v-if="detailCategory" class="detail-sheet__row">
          <span class="detail-sheet__label">운동 카테고리</span>
          <span class="detail-sheet__value">{{ detailCategory }}</span>
        </div>
        <div v-if="detailExercises.length > 0" class="detail-sheet__workout-section">
          <span class="detail-sheet__label">배정 운동</span>
          <ul class="detail-sheet__exercise-list">
            <li v-for="(ex, i) in detailExercises" :key="i" class="detail-sheet__exercise-item">
              <span class="detail-sheet__exercise-name">{{ i + 1 }}. {{ ex.name }}</span>
              <span class="detail-sheet__exercise-spec">{{ ex.sets }}세트 × {{ ex.reps }}회</span>
            </li>
          </ul>
        </div>
        <template v-if="selectedSchedule?.status === 'change_requested'">
          <div class="detail-sheet__change-card">
            <div class="detail-sheet__change-row">
              <span class="detail-sheet__change-label">현재</span>
              <span class="detail-sheet__change-value">
                {{ toDisplayDate(selectedSchedule.date) }}
                {{ selectedSchedule.start_time?.slice(0,5) }}-{{ selectedSchedule.end_time?.slice(0,5) }}
              </span>
            </div>
            <div v-if="selectedSchedule.requested_date" class="detail-sheet__change-row detail-sheet__change-row--requested">
              <span class="detail-sheet__change-label">요청</span>
              <span class="detail-sheet__change-value">
                {{ toDisplayDate(selectedSchedule.requested_date) }}
                {{ selectedSchedule.requested_start_time?.slice(0,5) }}-{{ selectedSchedule.requested_end_time?.slice(0,5) }}
              </span>
            </div>
            <div v-if="selectedSchedule.change_reason" class="detail-sheet__change-row">
              <span class="detail-sheet__change-label">사유</span>
              <span class="detail-sheet__change-value">{{ selectedSchedule.change_reason }}</span>
            </div>
          </div>
          <div class="detail-sheet__change-actions">
            <AppButton v-if="selectedSchedule.requested_date" :disabled="loading" @click="handleApproveChange">승인</AppButton>
            <AppButton variant="outline" :disabled="loading" @click="showRejectSheet = true">거절</AppButton>
            <AppButton variant="secondary" :disabled="loading" @click="startReassignMode">다른 시간</AppButton>
          </div>
        </template>

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

    <AppBottomSheet v-model="showRejectSheet" title="변경 요청 거절">
      <div class="reject-sheet">
        <p class="reject-sheet__hint">거절 사유를 입력하면 회원에게 전달됩니다.</p>
        <textarea v-model="rejectReason" class="reject-sheet__textarea" placeholder="거절 사유를 입력해주세요 (선택)" maxlength="120" />
        <AppButton :disabled="loading" @click="handleRejectChange">거절 확인</AppButton>
      </div>
    </AppBottomSheet>
  </div>
</template>

<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppButton from '@/components/AppButton.vue'
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
import { useMembersStore } from '@/stores/members'
import { useReservationsStore } from '@/stores/reservations'
import { useWorkHoursStore } from '@/stores/workHours'
import { useScheduleOverridesStore } from '@/stores/scheduleOverrides'
import { useAvailabilityStore } from '@/stores/availability'
import { useWorkoutPlansStore } from '@/stores/workoutPlans'
import { resolveAvailabilityState } from '@/utils/availability'

defineOptions({ name: 'TrainerScheduleView' })

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
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
  date.setDate(date.getDate() - date.getDay())
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
  if (status === 'approved') return 'scheduled'
  return status
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status
}

function canAssignWorkout(status) {
  return normalizeStatus(status) === 'scheduled'
}

function canCancel(status) {
  const normalized = normalizeStatus(status)
  return normalized === 'scheduled' || normalized === 'confirmed' || normalized === 'change_requested'
}

function canReassign(status) {
  const normalized = normalizeStatus(status)
  return normalized === 'scheduled' || normalized === 'confirmed' || normalized === 'change_requested'
}

function availabilityText(state) {
  if (state === 'available') return '가능 시간'
  if (state === 'unavailable') return '다른 시간 선호'
  return '시간 미입력'
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
const membersStore = useMembersStore()
const reservationsStore = useReservationsStore()
const { showToast, showSuccess } = useToast()

const { reservations, loading, error, fetchMyReservations, assignSchedule, cancelSchedule, reassignSchedule, approveChangeRequest, rejectChangeRequest } = useReservations()
const { days: workDays, selectedUnit, fetchWorkHours, fetchWorkingDays } = useWorkHours()
const { overrides, fetchOverrides } = useScheduleOverrides()
const { fetchMemberAvailabilities } = useAvailability()
const { members, fetchMembers } = useMembers()
const { dayWorkoutPlans, fetchDayWorkoutPlans, fetchWorkoutPlan, currentPlan, loadWeeklyWorkoutCategories, getWeeklyCategory } = useWorkoutPlans()

const todayStr = formatDate(new Date())

const loaded = ref(false)
const calendarLoading = ref(false)
const currentView = ref('weekly')
const selectedDate = ref(todayStr)
const currentWeekStart = ref(getWeekStart(todayStr))
const currentMonthKey = ref(todayStr.slice(0, 7))
const workingDays = ref(new Set())

const showMemberSheet = ref(false)
const showDetailSheet = ref(false)
const showRejectSheet = ref(false)
const memberSheetLoading = ref(false)
const rejectReason = ref('')

const selectedSlotDate = ref('')
const selectedSlotTime = ref('')
const selectedSchedule = ref(null)
const detailExercises = ref([])
const detailCategory = ref('')
const reassignTarget = ref(null)

const membersWithAvailability = ref([])
const weekAvailabilities = ref([])

const changeRequestCount = computed(() => {
  return reservations.value.filter((reservation) => reservation.status === 'change_requested').length
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
      const dateStr = addDays(currentWeekStart.value, index)
      const dayOfWeek = parseDate(dateStr).getDay()
      if (!workingDays.value.has(dayOfWeek)) {
        holidaySet.add(dateStr)
      }
    }
  }

  return Array.from(holidaySet)
})

const monthlyHolidays = computed(() => {
  const holidaySet = new Set()

  overrides.value.forEach((override) => {
    if (override.is_working === false) {
      holidaySet.add(override.date)
    }
  })

  if (workingDays.value.size > 0) {
    const [year, month] = currentMonthKey.value.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = `${currentMonthKey.value}-${pad(day)}`
      const dayOfWeek = new Date(year, month - 1, day).getDay()
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
      requested_date: reservation.requested_date ?? null,
      requested_start_time: reservation.requested_start_time ?? null,
      requested_end_time: reservation.requested_end_time ?? null,
      member_name: reservation.partner_name,
      trainer_name: auth.profile?.name ?? '트레이너',
      member_id: reservation.member_id,
      category: getWeeklyCategory(reservation.date, reservation.member_id),
    }))
})

const memberColorMap = computed(() => {
  const map = {}
  membersStore.members.forEach((member) => {
    map[member.id] = member.color
  })
  return map
})

const weeklyLegendMembers = computed(() => {
  const memberIds = new Set(weeklySchedules.value.map((schedule) => schedule.member_id).filter(Boolean))
  return membersStore.members.filter((member) => memberIds.has(member.id))
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

const calendarColorDots = computed(() => {
  const dots = {}

  reservations.value.forEach((reservation) => {
    if (!ACTIVE_STATUSES.has(reservation.status)) return
    if (!reservation.date.startsWith(`${currentMonthKey.value}-`)) return

    const day = Number(reservation.date.slice(8, 10))
    const color = memberColorMap.value[reservation.member_id]
    if (!color) return

    if (!dots[day]) {
      dots[day] = []
    }

    if (!dots[day].includes(color)) {
      dots[day].push(color)
    }

    dots[day] = dots[day].slice(0, 3)
  })

  return dots
})

const workoutMap = computed(() => {
  const map = {}
  dayWorkoutPlans.value.forEach((plan) => {
    map[plan.member_id] = { exercises: plan.exercises, category: plan.category }
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
      requested_date: reservation.requested_date,
      requested_start_time: reservation.requested_start_time,
      requested_end_time: reservation.requested_end_time,
      workoutSummary: formatWorkoutSummary(workoutMap.value[reservation.member_id]?.exercises || workoutMap.value[reservation.member_id]),
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

async function loadWeeklyWorkouts() {
  if (!auth.user?.id) return

  const dates = []
  for (let i = -1; i < 6; i += 1) {
    dates.push(addDays(currentWeekStart.value, i))
  }

  await loadWeeklyWorkoutCategories(dates)
}

async function loadData() {
  await Promise.all([
    fetchMyReservations('trainer'),
    fetchWorkHours(),
    fetchMembers(),
  ])

  await loadWorkingDaySet()

  calendarLoading.value = true
  try {
    const [, , availRows] = await Promise.all([
      loadOverrides(currentMonthKey.value),
      fetchDayWorkoutPlans(selectedDate.value),
      fetchMemberAvailabilities(currentWeekStart.value),
      loadWeeklyWorkouts(),
    ])
    weekAvailabilities.value = availRows || []
  } finally {
    calendarLoading.value = false
  }

  loaded.value = true
}

async function handleRefresh() {
  useWorkHoursStore().invalidate()
  useScheduleOverridesStore().invalidate()
  useAvailabilityStore().invalidate()
  useWorkoutPlansStore().invalidate()
  await reservationsStore.loadReservations('trainer', true)
  await fetchMyReservations('trainer')
  await fetchWorkHours()
  await fetchMembers()
  await loadWorkingDaySet()

  const monthKey = currentView.value === 'weekly'
    ? currentWeekStart.value.slice(0, 7)
    : currentMonthKey.value

  calendarLoading.value = true
  try {
    const [, , availRows] = await Promise.all([
      loadOverrides(monthKey),
      fetchDayWorkoutPlans(selectedDate.value),
      fetchMemberAvailabilities(currentWeekStart.value),
      loadWeeklyWorkouts(),
    ])
    weekAvailabilities.value = availRows || []
  } finally {
    calendarLoading.value = false
  }
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

  calendarLoading.value = true
  try {
    const [, availRows] = await Promise.all([
      loadOverrides(currentMonthKey.value),
      fetchMemberAvailabilities(currentWeekStart.value),
      loadWeeklyWorkouts(),
    ])
    weekAvailabilities.value = availRows || []
  } finally {
    calendarLoading.value = false
  }
}

async function handleMonthChange(month) {
  currentMonthKey.value = month
  await loadOverrides(month)
}

async function handleMonthDateSelect(date) {
  selectedDate.value = date
  currentWeekStart.value = getWeekStart(date)
  currentMonthKey.value = date.slice(0, 7)
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
          availabilityState: resolveAvailabilityState(availableSlots, date, time, workSchedule.value.slotDuration),
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

async function openScheduleDetail(scheduleId) {
  selectedSchedule.value = reservations.value.find((reservation) => reservation.id === scheduleId) ?? null
  detailExercises.value = []
  detailCategory.value = ''

  if (selectedSchedule.value) {
    showDetailSheet.value = true

    const memberId = selectedSchedule.value.member_id
    const date = selectedSchedule.value.date

    if (memberId && date) {
      await fetchWorkoutPlan(memberId, date)
      detailExercises.value = currentPlan.value?.exercises ?? []
      detailCategory.value = currentPlan.value?.category || ''
    }
  }
}

function handleScheduleTap({ scheduleId }) {
  openScheduleDetail(scheduleId)
}

async function handleScheduleDrop({ scheduleId, fromDate, fromTime, toDate, toTime }) {
  const success = await reassignSchedule(scheduleId, toDate, toTime)

  if (success) {
    showSuccess('일정을 재배정했습니다.')
    await loadWeeklySchedules()
    return
  }

  showToast(error.value || '일정 재배정에 실패했습니다.', 'error')
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

async function handleApproveChange() {
  if (!selectedSchedule.value) return
  const approved = await approveChangeRequest(selectedSchedule.value.id)
  if (!approved) {
    showToast(error.value || '변경 요청 승인에 실패했습니다.', 'error')
    return
  }
  showSuccess('변경 요청을 승인했습니다.')
  showDetailSheet.value = false
  await loadWeeklySchedules()
}

async function handleRejectChange() {
  if (!selectedSchedule.value) return
  const rejected = await rejectChangeRequest(selectedSchedule.value.id, rejectReason.value.trim() || null)
  if (!rejected) {
    showToast(error.value || '변경 요청 거절에 실패했습니다.', 'error')
    return
  }
  showSuccess('변경 요청을 거절했습니다.')
  showRejectSheet.value = false
  rejectReason.value = ''
  showDetailSheet.value = false
  await loadWeeklySchedules()
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
  membersStore.loadMembers()

  if (!loaded.value) {
    loadData()
  }
})

onActivated(async () => {
  if (!loaded.value) return

  await Promise.all([
    membersStore.loadMembers(),
    fetchMyReservations('trainer'),
    fetchWorkHours(),
  ])
  await loadWorkingDaySet()

  const monthKey = currentView.value === 'weekly'
    ? currentWeekStart.value.slice(0, 7)
    : currentMonthKey.value

  calendarLoading.value = true
  try {
    const [, , availRows] = await Promise.all([
      loadOverrides(monthKey),
      fetchDayWorkoutPlans(selectedDate.value),
      fetchMemberAvailabilities(currentWeekStart.value),
      loadWeeklyWorkouts(),
    ])
    weekAvailabilities.value = availRows || []
  } finally {
    calendarLoading.value = false
  }
})
</script>

<style src="./TrainerScheduleView.css" scoped></style>
