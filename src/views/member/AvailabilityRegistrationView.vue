<template>
  <div class="availability-registration">
    <header class="availability-registration__header">
      <button class="availability-registration__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="availability-registration__title">가능 시간 관리</h1>
      <div class="availability-registration__header-spacer" />
    </header>

    <div v-if="isInitializing || hasActiveConnection === null" class="availability-registration__state">
      <p class="availability-registration__state-title">연결 정보를 확인하는 중입니다</p>
    </div>

    <div v-else-if="hasActiveConnection === false" class="availability-registration__state">
      <p class="availability-registration__state-title">트레이너와 연결되지 않았습니다</p>
      <p class="availability-registration__state-desc">가능 시간 전달은 트레이너 연결 후 이용할 수 있습니다.</p>
    </div>

    <template v-else>
      <main class="availability-registration__content">
        <section class="availability-registration__card">
          <div class="availability-registration__section-head">
            <p class="availability-registration__section-title">📅 기간 선택</p>
          </div>

          <div class="availability-registration__week-tabs">
            <button
              class="availability-registration__week-tab"
              :class="{ 'availability-registration__week-tab--active': selectedWeekOffset === 0 }"
              type="button"
              @click="selectWeek(0)"
            >
              이번 주
            </button>
            <button
              class="availability-registration__week-tab"
              :class="{ 'availability-registration__week-tab--active': selectedWeekOffset === 1 }"
              type="button"
              @click="selectWeek(1)"
            >
              다음 주
            </button>
          </div>

          <p class="availability-registration__week-range">{{ weekRangeText }}</p>
          <p v-if="isWeekLoading" class="availability-registration__load-message">기존 등록 정보를 불러오는 중...</p>
        </section>

        <section class="availability-registration__card availability-registration__card--grid">
          <div class="availability-registration__grid-wrapper">
            <AppAvailabilityGrid
              v-model="availabilitySlots"
              :weekStart="selectedWeekStart"
              :offHoursRange="trainerWorkSchedule"
              :loading="isWeekLoading"
              :holidays="holidays"
            />
          </div>
        </section>

        <section class="availability-registration__card">
          <div class="availability-registration__section-head">
            <p class="availability-registration__section-title">💬 메모 (선택사항)</p>
          </div>
          <AppInput
            v-model="memo"
            placeholder="트레이너에게 전달할 내용을 입력해주세요"
            maxlength="100"
          />
        </section>
      </main>

      <footer class="availability-registration__footer">
        <p v-if="submitError" class="form-error-text availability-registration__submit-error">{{ submitError }}</p>
        <AppButton :disabled="isSubmitting || loading || isWeekLoading" @click="handleSubmit">
          {{ isSubmitting ? '저장 중...' : '저장' }}
        </AppButton>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import AppAvailabilityGrid from '@/components/AppAvailabilityGrid.vue'
import { useAvailability } from '@/composables/useAvailability'
import { useReservations } from '@/composables/useReservations'
import { useToast } from '@/composables/useToast'
import { useWorkHours } from '@/composables/useWorkHours'
import { useScheduleOverrides } from '@/composables/useScheduleOverrides'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIsoDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getWeekStart(offsetWeeks = 0) {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay() + offsetWeeks * 7)
  sunday.setHours(0, 0, 0, 0)
  return toIsoDate(sunday)
}

function addDays(dateStr, amount) {
  const next = parseIsoDate(dateStr)
  if (Number.isNaN(next.getTime())) return dateStr
  next.setDate(next.getDate() + amount)
  return toIsoDate(next)
}

function formatDateWithWeekday(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAY_LABELS[date.getDay()]
  return `${month}/${day}(${weekday})`
}

function formatWeekRange(weekStart) {
  const start = parseIsoDate(weekStart)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${formatDateWithWeekday(start)} ~ ${formatDateWithWeekday(end)}`
}

const router = useRouter()
const { submitAvailability, fetchMyAvailability, loading, error } = useAvailability()
const { getConnectedTrainerId } = useReservations()
const { showToast, showSuccess } = useToast()
const { days: workDays, fetchWorkHours, fetchWorkingDays } = useWorkHours()
const { overrides, fetchOverrides } = useScheduleOverrides()

const availabilitySlots = ref({})
const memo = ref('')
const submitError = ref('')

const trainerWorkSchedule = ref(null)
const workingDays = ref(new Set())

const selectedWeekOffset = ref(0)
const selectedWeekStart = computed(() => getWeekStart(selectedWeekOffset.value))
const weekRangeText = computed(() => formatWeekRange(selectedWeekStart.value))

const holidays = computed(() => {
  const holidaySet = new Set()
  overrides.value.forEach((override) => {
    if (override.is_working === false) {
      holidaySet.add(override.date)
    }
  })
  if (workingDays.value.size > 0 && selectedWeekStart.value) {
    for (let index = 0; index < 7; index += 1) {
      const dateStr = addDays(selectedWeekStart.value, index)
      const dateObj = parseIsoDate(dateStr)
      if (!Number.isNaN(dateObj.getTime())) {
        const dayOfWeek = dateObj.getDay()
        if (!workingDays.value.has(dayOfWeek)) {
          holidaySet.add(dateStr)
        }
      }
    }
  }
  return Array.from(holidaySet)
})

const trainerId = ref(null)
const hasActiveConnection = ref(null)
const isInitializing = ref(true)
const isWeekLoading = ref(false)
const isSubmitting = ref(false)

const hasAnySelection = computed(() =>
  Object.values(availabilitySlots.value).some((arr) => Array.isArray(arr) && arr.length > 0)
)

let latestLoadToken = 0

function selectWeek(offset) {
  if (selectedWeekOffset.value === offset) return
  selectedWeekOffset.value = offset
  submitError.value = ''
}

async function loadExistingAvailability() {
  if (!trainerId.value) return

  const token = ++latestLoadToken
  isWeekLoading.value = true
  submitError.value = ''

  const existing = await fetchMyAvailability(trainerId.value, selectedWeekStart.value)

  if (token !== latestLoadToken) {
    return
  }

  availabilitySlots.value = { ...(existing?.available_slots ?? {}) }
  memo.value = existing?.memo ?? ''
  isWeekLoading.value = false
}

async function handleSubmit() {
  submitError.value = ''

  if (!hasAnySelection.value) {
    submitError.value = '가능한 시간을 1개 이상 선택해주세요'
    return
  }

  if (!trainerId.value) {
    submitError.value = '연결된 트레이너를 찾을 수 없습니다'
    return
  }

  isSubmitting.value = true

  const success = await submitAvailability(
    trainerId.value,
    selectedWeekStart.value,
    availabilitySlots.value,
    memo.value.trim() || null,
  )

  isSubmitting.value = false

  if (!success) {
    return
  }

  showSuccess('가능한 시간이 전달되었습니다')
  router.back()
}

onMounted(async () => {
  const connectedTrainerId = await getConnectedTrainerId()
  trainerId.value = connectedTrainerId
  hasActiveConnection.value = !!connectedTrainerId

  if (connectedTrainerId) {
    await fetchWorkHours(connectedTrainerId)
    workingDays.value = await fetchWorkingDays(connectedTrainerId)
    await fetchOverrides(connectedTrainerId, selectedWeekStart.value.slice(0, 7))
    
    const enabledDays = workDays.value.filter((d) => d.enabled)
    if (enabledDays.length > 0) {
      const startTimes = enabledDays.map((d) => d.start).filter(Boolean)
      const endTimes = enabledDays.map((d) => d.end).filter(Boolean)
      trainerWorkSchedule.value = {
        startTime: startTimes.sort()[0] || '09:00',
        endTime: endTimes.sort().reverse()[0] || '22:00',
      }
    }
    await loadExistingAvailability()
  } else {
    availabilitySlots.value = {}
    memo.value = ''
  }

  isInitializing.value = false
})

watch(selectedWeekStart, async (newValue, oldValue) => {
  if (!trainerId.value || newValue === oldValue) return
  
  if (newValue.slice(0, 7) !== oldValue.slice(0, 7)) {
    await fetchOverrides(trainerId.value, newValue.slice(0, 7))
  }
  await loadExistingAvailability()
})

watch(error, (message) => {
  if (message) {
    showToast(message, 'error')
  }
})
</script>

<style src="./AvailabilityRegistrationView.css" scoped></style>
