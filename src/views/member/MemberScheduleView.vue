<template>
  <div class="member-schedule">
    <AppPullToRefresh @refresh="handleRefresh">
      <header class="member-schedule__appbar">
        <h1 class="member-schedule__title">내 일정</h1>
      </header>

      <div v-if="error" class="member-schedule__error">{{ error }}</div>

      <section v-if="hasActiveConnection === false" class="member-schedule__state">
        <p class="member-schedule__state-title">트레이너와 연결되지 않았습니다</p>
        <p class="member-schedule__state-desc">트레이너를 찾아 연결한 뒤 일정을 확인해보세요</p>
      </section>

      <section
        v-else-if="hasActiveConnection === null"
        class="member-schedule__state member-schedule__state--loading"
      >
        <AppSkeleton type="rect" width="100%" height="92px" :count="3" />
      </section>

      <template v-else>
        <div class="member-schedule__view-tabs">
          <button
            class="member-schedule__view-tab"
            :class="{ 'member-schedule__view-tab--active': currentView === 'weekly' }"
            type="button"
            @click="switchView('weekly')"
          >
            주간
          </button>
          <button
            class="member-schedule__view-tab"
            :class="{ 'member-schedule__view-tab--active': currentView === 'monthly' }"
            type="button"
            @click="switchView('monthly')"
          >
            월간
          </button>
        </div>

        <section v-if="currentView === 'weekly'" class="member-schedule__weekly">
          <AppWeeklyCalendar
            :schedules="weeklySchedules"
            :workSchedule="trainerWorkSchedule"
            :holidays="holidays"
            :currentWeekStart="currentWeekStart"
            :draggable="true"
            :loading="weeklyLoading || !loaded"
            :myAvailability="myAvailabilityForCalendar"
            role="member"
            @schedule-tap="handleScheduleTap"
            @week-change="handleWeekChange"
            @schedule-drop="handleScheduleDrop"
          />
          <p class="member-schedule__weekly-hint">
            배정된 일정을 탭하면 확인, 변경 요청, 취소를 진행할 수 있습니다.
          </p>
        </section>

        <section v-else class="member-schedule__monthly">
          <div class="member-schedule__calendar-card">
            <AppCalendar
              :model-value="selectedDate"
              :dots="calendarDots"
              :holidays="monthlyHolidays"
              @update:modelValue="handleMonthDateSelect"
              @monthChange="handleMonthChange"
            />
          </div>

          <div class="member-schedule__list-header">
            <h2 class="member-schedule__list-title">{{ selectedDateLabel }}</h2>
            <p class="member-schedule__list-count">{{ selectedDateSessions.length }}개의 일정</p>
          </div>

          <div v-if="loading" class="member-schedule__loading">
            <AppSkeleton type="line" :count="3" />
          </div>

          <div v-else-if="selectedDateSessions.length === 0" class="member-schedule__empty">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" />
              <path d="M3 9H21" stroke="currentColor" stroke-width="1.5" />
              <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <p>선택한 날짜에 일정이 없습니다.</p>
          </div>

          <div v-else class="member-schedule__list">
            <article
              v-for="session in selectedDateSessions"
              :key="session.id"
              class="member-session"
              @click="openScheduleDetail(session.id)"
            >
              <div class="member-session__header">
                <div class="member-session__trainer">
                  <div class="member-session__avatar">
                    <img
                      v-if="session.trainer_photo"
                      :src="session.trainer_photo"
                      :alt="session.trainer_name"
                      class="member-session__avatar-img"
                    >
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6" />
                      <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                    </svg>
                  </div>
                  <h3 class="member-session__name">{{ session.trainer_name }}</h3>
                </div>
                <span
                  class="member-session__status"
                  :class="`member-session__status--${normalizeStatus(session.status)}`"
                >
                  {{ statusLabel(session.status) }}
                </span>
              </div>

              <p class="member-session__time">
                <template v-if="session.status === 'change_requested' && session.requested_start_time">
                  {{ session.start_time?.slice(0,5) }} → {{ session.requested_start_time?.slice(0,5) }}
                  <span v-if="session.requested_date && session.requested_date !== session.date" class="member-session__requested-date">
                    ({{ formatShortDate(session.requested_date) }})
                  </span>
                </template>
                <template v-else>
                  {{ session.start_time }} - {{ session.end_time }}
                </template>
              </p>

              <p v-if="session.workoutSummary" class="member-session__summary">
                {{ session.workoutSummary }}
              </p>
              <p v-else class="member-session__summary member-session__summary--empty">
                아직 운동이 배정되지 않았습니다.
              </p>

              <p v-if="session.change_reason" class="member-session__reason">
                변경 사유: {{ session.change_reason }}
              </p>
            </article>
          </div>
        </section>

        <div class="member-schedule__bottom-space" />
      </template>
    </AppPullToRefresh>

    <button
      v-if="hasActiveConnection !== null"
      class="member-schedule__fab press-effect"
      type="button"
      @click="goToAvailability"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      </svg>
      가능 시간 관리
    </button>

    <AppBottomSheet v-model="showDetailSheet" title="일정 상세">
      <div v-if="selectedSchedule" class="detail-sheet">
        <div class="detail-sheet__row">
          <span class="detail-sheet__label">트레이너</span>
          <span class="detail-sheet__value">{{ selectedSchedule.trainer_name }}</span>
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
          <span
            class="detail-sheet__status"
            :class="`detail-sheet__status--${normalizeStatus(selectedSchedule.status)}`"
          >
            {{ statusLabel(selectedSchedule.status) }}
          </span>
        </div>
        <div v-if="selectedSchedule.category" class="detail-sheet__row">
          <span class="detail-sheet__label">운동 카테고리</span>
          <span class="detail-sheet__value">{{ selectedSchedule.category }}</span>
        </div>

        <div
          v-if="selectedSchedule.exercises && selectedSchedule.exercises.length > 0"
          class="detail-sheet__workout-section"
        >
          <span class="detail-sheet__label">배정 운동</span>
          <ul class="detail-sheet__exercise-list">
            <li v-for="(ex, i) in selectedSchedule.exercises" :key="i" class="detail-sheet__exercise-item">
              <span class="detail-sheet__exercise-name">{{ i + 1 }}. {{ ex.name }}</span>
              <span class="detail-sheet__exercise-spec">{{ ex.sets }}세트 × {{ ex.reps }}회</span>
            </li>
          </ul>
        </div>
        <p v-else class="detail-sheet__summary detail-sheet__summary--empty">
          아직 운동이 배정되지 않았습니다.
        </p>

        <p v-if="selectedSchedule.change_reason" class="detail-sheet__reason">
          변경 사유: {{ selectedSchedule.change_reason }}
        </p>

        <div v-if="canCancel(selectedSchedule.status)" class="detail-sheet__actions">
          <AppButton variant="secondary" :disabled="loading" @click="openChangeRequest">변경 요청</AppButton>
          <AppButton variant="outline" :disabled="loading" @click="handleCancel">취소</AppButton>
        </div>

        <div v-else-if="isChangeRequested(selectedSchedule?.status)" class="detail-sheet__actions">
          <p class="detail-sheet__notice">변경 요청을 전달했습니다. 트레이너의 확인을 기다려주세요.</p>
          <AppButton
            variant="outline"
            :disabled="loading"
            @click="handleCancelChangeRequest"
          >변경 요청 취소</AppButton>
        </div>
      </div>
    </AppBottomSheet>

    <AppBottomSheet v-model="showChangeSheet" title="변경 요청">
      <div class="change-sheet">
        <p class="change-sheet__current">
          현재: {{ toDisplayDate(selectedSchedule?.date) }}
          {{ selectedSchedule?.start_time?.slice(0,5) }} - {{ selectedSchedule?.end_time?.slice(0,5) }}
        </p>
        <p class="change-sheet__label">변경할 날짜</p>
        <AppCalendar
          :modelValue="changeRequestDate"
          :holidays="holidays"
          @update:modelValue="handleChangeRequestDateSelect"
        />
        <template v-if="changeRequestDate">
          <p class="change-sheet__label">변경할 시간</p>
          <div v-if="changeRequestSlotsLoading" class="change-sheet__loading">슬롯 조회 중...</div>
          <div v-else-if="changeRequestSlots.length === 0" class="change-sheet__empty">해당 날짜에 가용 슬롯이 없습니다.</div>
          <div v-else class="change-sheet__slots">
            <button
              v-for="slot in changeRequestSlots"
              :key="slot.start_time"
              class="change-sheet__slot-btn"
              :class="{ 'change-sheet__slot-btn--selected': changeRequestSlot?.start_time === slot.start_time }"
              @click="changeRequestSlot = slot"
            >{{ slot.start_time?.slice(0,5) }} - {{ slot.end_time?.slice(0,5) }}</button>
          </div>
        </template>
        <p class="change-sheet__label">변경 사유 <span class="change-sheet__optional">(선택)</span></p>
        <textarea
          v-model="changeReason"
          class="change-sheet__textarea"
          placeholder="변경 사유를 입력해주세요 (선택)"
          maxlength="120"
        />
        <p class="change-sheet__hint">입력한 사유는 트레이너에게 전달됩니다.</p>
        <AppButton :disabled="loading || !changeRequestSlot" @click="handleRequestChange">요청 보내기</AppButton>
      </div>
    </AppBottomSheet>

    <AppBottomSheet v-model="showDndConfirmSheet" title="변경 요청 확인">
      <div class="dnd-confirm-sheet">
        <p class="dnd-confirm-sheet__message">
          {{ toDisplayDate(dndDropInfo?.toDate) }} {{ dndDropInfo?.toTime?.slice(0,5) }}으로 변경 요청하시겠습니까?
        </p>
        <p class="change-sheet__label">변경 사유 <span class="change-sheet__optional">(선택)</span></p>
        <textarea v-model="dndConfirmReason" class="change-sheet__textarea" placeholder="변경 사유를 입력해주세요 (선택)" maxlength="120" />
        <div class="dnd-confirm-sheet__actions">
          <AppButton variant="outline" @click="showDndConfirmSheet = false">취소</AppButton>
          <AppButton :disabled="loading" @click="handleDndConfirm">요청 보내기</AppButton>
        </div>
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
import { useConfirm } from '@/composables/useConfirm'
import { useReservations } from '@/composables/useReservations'
import { useToast } from '@/composables/useToast'
import { useScheduleOverrides } from '@/composables/useScheduleOverrides'
import { useWorkHours } from '@/composables/useWorkHours'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { useAvailability } from '@/composables/useAvailability'
import { dayKeySlotsToDateSlots } from '@/utils/availability'
import { useReservationsStore } from '@/stores/reservations'

defineOptions({ name: 'MemberScheduleView' })

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
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
  scheduled: 'scheduled',
  confirmed: 'confirmed',
  change_requested: 'change_requested',
  completed: 'done',
  pending: 'pending',
  approved: 'approved',
}

const DEFAULT_WORK_SCHEDULE = Object.freeze({
  startTime: '09:00',
  endTime: '22:00',
  slotDuration: 60,
})

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
  const next = parseDate(dateStr)
  next.setDate(next.getDate() + amount)
  return formatDate(next)
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

function minutesToTime(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function normalizeStatus(status) {
  if (status === 'pending') return 'scheduled'
  if (status === 'approved') return 'scheduled'
  return status
}

function statusLabel(status) {
  return STATUS_LABELS[status] || STATUS_LABELS[normalizeStatus(status)] || status
}

function toDisplayDate(dateStr) {
  const date = parseDate(dateStr)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${DAY_LABELS[date.getDay()]}`
}

const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토']

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const date = parseDate(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_SHORT[date.getDay()]})`
}

function formatWorkoutSummary(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return null
  }

  return exercises
    .filter((exercise) => exercise.name)
    .slice(0, 3)
    .map((exercise) => `${exercise.name} ${exercise.sets}×${exercise.reps}`)
    .join(', ')
}

const router = useRouter()
const reservationsStore = useReservationsStore()
const { showToast, showSuccess } = useToast()
const { confirm } = useConfirm()

const {
  reservations,
  slots,
  slotDuration,
  loading,
  error,
  fetchMyReservations,
  fetchAvailableSlots,
  requestChange,
  cancelChangeRequest,
  cancelSchedule,
  checkTrainerConnection,
  getConnectedTrainerId,
} = useReservations()

const { days: workDays, selectedUnit, fetchWorkHours, fetchWorkingDays } = useWorkHours()
const { overrides, fetchOverrides } = useScheduleOverrides()
const { fetchWorkoutPlan, currentPlan } = useWorkoutPlans()
const { fetchMyAvailability } = useAvailability()

const todayString = formatDate(new Date())

const loaded = ref(false)
const weeklyLoading = ref(false)
const currentView = ref('weekly')
const selectedDate = ref(todayString)
const currentWeekStart = ref(getWeekStart(todayString))
const currentMonthKey = ref(todayString.slice(0, 7))
const hasActiveConnection = ref(null)

const showDetailSheet = ref(false)
const showChangeSheet = ref(false)
const selectedSchedule = ref(null)
const changeReason = ref('')

const trainerWorkSchedule = ref({ ...DEFAULT_WORK_SCHEDULE })
const workingDays = ref(new Set())
const connectedTrainerId = ref(null)
const myAvailabilitySlots = ref(null)
// 형식: { "mon": ["09:00","10:00"], ... } 또는 null
const workoutPlanCache = ref({})

const changeRequestDate = ref('')
const changeRequestSlot = ref(null)
const changeRequestSlots = ref([])
const changeRequestSlotsLoading = ref(false)

const showDndConfirmSheet = ref(false)
const dndDropInfo = ref(null)
const dndConfirmReason = ref('')

const myAvailabilityForCalendar = computed(() => {
  if (!myAvailabilitySlots.value) return null
  return dayKeySlotsToDateSlots(myAvailabilitySlots.value, currentWeekStart.value)
})

const reservationItems = computed(() => {
  return reservations.value
    .filter((reservation) => ACTIVE_STATUSES.has(reservation.status))
    .map((reservation) => ({
      id: reservation.id,
      date: reservation.date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      status: reservation.status,
      session_type: reservation.session_type || 'PT',
      requested_date: reservation.requested_date ?? null,
      requested_start_time: reservation.requested_start_time ?? null,
      requested_end_time: reservation.requested_end_time ?? null,
      trainer_name: reservation.partner_name,
      trainer_photo: reservation.partner_photo,
      change_reason: reservation.change_reason,
      workoutSummary: formatWorkoutSummary(workoutPlanCache.value[reservation.id]?.exercises || workoutPlanCache.value[reservation.id]),
      exercises: workoutPlanCache.value[reservation.id]?.exercises || workoutPlanCache.value[reservation.id] || [],
      category: workoutPlanCache.value[reservation.id]?.category || null,
    }))
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      return toMinutes(a.start_time) - toMinutes(b.start_time)
    })
})

const weeklySchedules = computed(() => {
  const weekEnd = addDays(currentWeekStart.value, 7)

  return reservationItems.value
    .filter((reservation) => reservation.date >= currentWeekStart.value && reservation.date < weekEnd)
    .map((reservation) => ({
      id: reservation.id,
      date: reservation.date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      status: reservation.status,
      session_type: reservation.session_type,
      requested_date: reservation.requested_date,
      requested_start_time: reservation.requested_start_time,
      requested_end_time: reservation.requested_end_time,
      trainer_name: reservation.trainer_name,
      member_name: '',
      category: reservation.category,
    }))
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

const calendarDots = computed(() => {
  const dots = {}

  reservationItems.value.forEach((reservation) => {
    if (!reservation.date.startsWith(`${currentMonthKey.value}-`)) {
      return
    }

    const day = Number(reservation.date.slice(8, 10))
    const dotStatus = STATUS_TO_DOT[reservation.status] || STATUS_TO_DOT[normalizeStatus(reservation.status)] || reservation.status

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

const selectedDateSessions = computed(() => {
  return reservationItems.value.filter((reservation) => reservation.date === selectedDate.value)
})

const selectedDateLabel = computed(() => toDisplayDate(selectedDate.value))

function canCancel(status) {
  return normalizeStatus(status) === 'scheduled'
}

function isChangeRequested(status) {
  return normalizeStatus(status) === 'change_requested'
}

function syncTrainerWorkSchedule() {
  const enabledDays = workDays.value.filter((day) => day.enabled)

  if (!enabledDays.length) {
    trainerWorkSchedule.value = {
      ...DEFAULT_WORK_SCHEDULE,
      slotDuration: Number(selectedUnit.value) || DEFAULT_WORK_SCHEDULE.slotDuration,
    }
    return
  }

  const startTime = enabledDays.reduce((minTime, day) => {
    return toMinutes(day.start) < toMinutes(minTime) ? day.start : minTime
  }, enabledDays[0].start)

  const endTime = enabledDays.reduce((maxTime, day) => {
    return toMinutes(day.end) > toMinutes(maxTime) ? day.end : maxTime
  }, enabledDays[0].end)

  trainerWorkSchedule.value = {
    startTime,
    endTime,
    slotDuration: Number(selectedUnit.value) || DEFAULT_WORK_SCHEDULE.slotDuration,
  }
}

async function loadWorkoutForReservation(reservationId) {
  if (!reservationId || workoutPlanCache.value[reservationId] !== undefined) {
    return
  }

  await fetchWorkoutPlan(reservationId)
  workoutPlanCache.value[reservationId] = currentPlan.value ? { exercises: [...(currentPlan.value.exercises || [])], category: currentPlan.value.category || null } : null
}

async function preloadWeeklyWorkouts() {
  const weekEnd = addDays(currentWeekStart.value, 7)
  const reservations = reservationItems.value
    .filter(r => r.date >= currentWeekStart.value && r.date < weekEnd)
  for (const reservation of reservations) {
    await loadWorkoutForReservation(reservation.id)
  }
}

async function loadData() {
  const connected = await checkTrainerConnection()
  hasActiveConnection.value = connected

  if (!connected) {
    selectedSchedule.value = null
    showDetailSheet.value = false
    showChangeSheet.value = false
    loaded.value = true
    return
  }

  await fetchMyReservations('member')
  await preloadWeeklyWorkouts()

  const trainerId = await getConnectedTrainerId()
  connectedTrainerId.value = trainerId
  trainerWorkSchedule.value = { ...DEFAULT_WORK_SCHEDULE }

  if (trainerId) {
    await fetchWorkHours(trainerId)
    syncTrainerWorkSchedule()
    workingDays.value = await fetchWorkingDays(trainerId)
    await fetchOverrides(trainerId, currentMonthKey.value)
    const availResult = await fetchMyAvailability(trainerId, currentWeekStart.value)
    myAvailabilitySlots.value = availResult?.available_slots ?? null
  }

  loaded.value = true
}

async function handleRefresh() {
  await reservationsStore.loadReservations('member', true)
  await loadData()
}

function switchView(view) {
  if (currentView.value === view) {
    return
  }

  currentView.value = view

  if (view === 'weekly') {
    currentWeekStart.value = getWeekStart(selectedDate.value)
  }
}

async function handleWeekChange({ weekStart }) {
  weeklyLoading.value = true
  try {
    const prevMonth = currentMonthKey.value
    currentWeekStart.value = weekStart
    selectedDate.value = weekStart
    currentMonthKey.value = weekStart.slice(0, 7)
    await preloadWeeklyWorkouts()

    if (connectedTrainerId.value && currentMonthKey.value !== prevMonth) {
      await fetchOverrides(connectedTrainerId.value, currentMonthKey.value)
    }

    if (connectedTrainerId.value) {
      const availResult = await fetchMyAvailability(connectedTrainerId.value, weekStart)
      myAvailabilitySlots.value = availResult?.available_slots ?? null
    }
  } finally {
    weeklyLoading.value = false
  }
}

async function handleMonthChange(month) {
  currentMonthKey.value = month

  if (connectedTrainerId.value) {
    await fetchOverrides(connectedTrainerId.value, month)
  }
}

async function handleMonthDateSelect(date) {
  selectedDate.value = date
  currentWeekStart.value = getWeekStart(date)
  currentMonthKey.value = date.slice(0, 7)
  // Load workouts for reservations on this date
  const reservationsForDate = reservationItems.value.filter(r => r.date === date)
  for (const reservation of reservationsForDate) {
    await loadWorkoutForReservation(reservation.id)
  }
}

async function openScheduleDetail(scheduleId) {
  const schedule = reservationItems.value.find((item) => item.id === scheduleId)
  if (!schedule) {
    return
  }

  await loadWorkoutForReservation(schedule.id)
  const updatedSchedule = reservationItems.value.find((item) => item.id === scheduleId)
  selectedSchedule.value = updatedSchedule || schedule
  showDetailSheet.value = true
}

function handleScheduleTap({ scheduleId }) {
  openScheduleDetail(scheduleId)
}

async function handleScheduleDrop({ scheduleId, fromDate, fromTime, toDate, toTime }) {
  const schedule = reservations.value.find(r => r.id === scheduleId)
  if (!schedule) return
  const startMin = toMinutes(schedule.start_time)
  const endMin = toMinutes(schedule.end_time)
  const durationMin = endMin - startMin
  const toEndMin = toMinutes(toTime) + durationMin
  const toEndTime = minutesToTime(toEndMin)
  dndDropInfo.value = { scheduleId, toDate, toTime, toEndTime }
  dndConfirmReason.value = ''
  showDndConfirmSheet.value = true
}

function openChangeRequest() {
  showDetailSheet.value = false
  changeReason.value = ''
  showChangeSheet.value = true
}

async function handleRequestChange() {
  if (!selectedSchedule.value || !changeRequestSlot.value) return
  const requested = await requestChange(selectedSchedule.value.id, {
    reason: changeReason.value.trim() || null,
    requestedDate: changeRequestDate.value,
    requestedStartTime: changeRequestSlot.value.start_time,
    requestedEndTime: changeRequestSlot.value.end_time,
  })
  if (!requested) {
    showToast(error.value || '변경 요청에 실패했습니다.', 'error')
    return
  }
  showSuccess('변경 요청을 보냈습니다.')
  showChangeSheet.value = false
  changeReason.value = ''
  changeRequestDate.value = ''
  changeRequestSlot.value = null
  changeRequestSlots.value = []
  await fetchMyReservations('member')
}

async function handleCancel() {
  if (!selectedSchedule.value) {
    return
  }

  const accepted = await confirm('배정된 일정을 취소하시겠습니까?')
  if (!accepted) {
    return
  }

  const cancelled = await cancelSchedule(selectedSchedule.value.id)
  if (!cancelled) {
    showToast(error.value || '일정 취소에 실패했습니다.', 'error')
    return
  }

  showSuccess('일정을 취소했습니다.')
  showDetailSheet.value = false
  await fetchMyReservations('member')
}

async function handleChangeRequestDateSelect(date) {
  changeRequestDate.value = date
  changeRequestSlot.value = null
  changeRequestSlots.value = []
  if (!date) return
  changeRequestSlotsLoading.value = true
  try {
    await fetchAvailableSlots(connectedTrainerId.value, date)
    const allSlots = [
      ...(slots.value.am || []),
      ...(slots.value.pm || []),
      ...(slots.value.evening || []),
    ]
    changeRequestSlots.value = allSlots
      .filter(s => s.status === '가능')
      .map(s => ({
        start_time: s.val,
        end_time: minutesToTime(toMinutes(s.val) + (slotDuration.value || 60)),
      }))
  } finally {
    changeRequestSlotsLoading.value = false
  }
}

async function handleDndConfirm() {
  if (!dndDropInfo.value) return
  const { scheduleId, toDate, toTime, toEndTime } = dndDropInfo.value
  const requested = await requestChange(scheduleId, {
    reason: dndConfirmReason.value.trim() || null,
    requestedDate: toDate,
    requestedStartTime: toTime,
    requestedEndTime: toEndTime,
  })
  if (!requested) {
    showToast(error.value || '변경 요청에 실패했습니다.', 'error')
    return
  }
  showSuccess('변경 요청을 보냈습니다.')
  showDndConfirmSheet.value = false
  dndDropInfo.value = null
  await fetchMyReservations('member')
}

async function handleCancelChangeRequest() {
  if (!selectedSchedule.value) return
  const cancelled = await cancelChangeRequest(selectedSchedule.value.id)
  if (!cancelled) {
    showToast(error.value || '취소에 실패했습니다.', 'error')
    return
  }
  showSuccess('변경 요청이 취소되었습니다.')
  showDetailSheet.value = false
  await fetchMyReservations('member')
}

function goToAvailability() {
  router.push({ path: '/member/availability' })
}

watch(selectedDate, async (date, prevDate) => {
  if (!hasActiveConnection.value || !date || date === prevDate) {
    return
  }

  // Load workouts for reservations on this date
  const reservationsForDate = reservationItems.value.filter(r => r.date === date)
  for (const reservation of reservationsForDate) {
    await loadWorkoutForReservation(reservation.id)
  }
})

watch(showChangeSheet, (val) => {
  if (!val) {
    changeRequestDate.value = ''
    changeRequestSlot.value = null
    changeRequestSlots.value = []
  }
})

watch(error, (message) => {
  if (message) {
    showToast(message, 'error')
  }
})

onMounted(() => {
  if (!loaded.value) {
    loadData()
  }
})

onActivated(() => {
  if (loaded.value && reservationsStore.isStale()) {
    loadData()
  } else if (loaded.value && connectedTrainerId.value) {
    // 가용 시간만 재조회 (stale 여부 무관)
    fetchMyAvailability(connectedTrainerId.value, currentWeekStart.value).then((result) => {
      myAvailabilitySlots.value = result?.available_slots ?? null
    })
  }
})
</script>

<style src="./MemberScheduleView.css" scoped></style>
