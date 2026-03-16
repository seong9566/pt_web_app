<template>
  <div class="availability-registration">
    <header class="availability-registration__header">
      <button class="availability-registration__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="availability-registration__title">가능 시간 등록</h1>
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

        <section class="availability-registration__card">
          <div class="availability-registration__day-tabs">
            <button
              v-for="day in weekDaysWithDates"
              :key="`tab-${day.key}`"
              class="availability-registration__day-tab"
              :class="{ 'availability-registration__day-tab--active': selectedDay === day.key }"
              type="button"
              @click="selectedDay = day.key"
            >
              <span class="availability-registration__day-tab-label">{{ day.label }}</span>
              <span
                v-if="slots[day.key].length > 0"
                class="availability-registration__day-tab-badge"
              >{{ slots[day.key].length }}</span>
            </button>
          </div>

          <p class="availability-registration__selected-day-date">
            {{ selectedDayInfo.label }}요일 {{ selectedDayInfo.dateLabel }}
          </p>

          <div class="availability-registration__time-section">
            <p class="availability-registration__time-section-title">오전</p>
            <div class="availability-registration__time-list">
              <button
                v-for="slot in amSlots"
                :key="`slot-${slot.key}`"
                class="availability-registration__time-item"
                :class="{ 'availability-registration__time-item--active': isSlotSelected(selectedDay, slot.key) }"
                type="button"
                :aria-label="`${selectedDayInfo.label}요일 ${slot.label} 선택`"
                :aria-pressed="isSlotSelected(selectedDay, slot.key)"
                @click="toggleSlot(selectedDay, slot.key)"
              >
                <span class="availability-registration__time-item-label">{{ slot.label }}</span>
              </button>
            </div>
          </div>

          <div class="availability-registration__time-section">
            <p class="availability-registration__time-section-title">오후</p>
            <div class="availability-registration__time-list">
              <button
                v-for="slot in pmSlots"
                :key="`slot-${slot.key}`"
                class="availability-registration__time-item"
                :class="{ 'availability-registration__time-item--active': isSlotSelected(selectedDay, slot.key) }"
                type="button"
                :aria-label="`${selectedDayInfo.label}요일 ${slot.label} 선택`"
                :aria-pressed="isSlotSelected(selectedDay, slot.key)"
                @click="toggleSlot(selectedDay, slot.key)"
              >
                <span class="availability-registration__time-item-label">{{ slot.label }}</span>
              </button>
            </div>
          </div>

          <p class="availability-registration__selected-count">선택된 시간대 {{ selectedCount }}개</p>
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
          {{ isSubmitting ? '전달 중...' : '전달하기' }}
        </AppButton>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import { useAvailability } from '@/composables/useAvailability'
import { useReservations } from '@/composables/useReservations'
import { useToast } from '@/composables/useToast'

const DAYS = [
  { key: 'sun', label: '일' },
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
]

function generateTimeSlots(startHour = 6, endHour = 22) {
  const generatedSlots = []

  for (let hour = startHour; hour < endHour; hour += 1) {
    const timeStr = `${String(hour).padStart(2, '0')}:00`
    const nextTimeStr = `${String(hour + 1).padStart(2, '0')}:00`
    generatedSlots.push({ key: timeStr, label: `${timeStr} ~ ${nextTimeStr}` })
  }

  return generatedSlots
}

const TIME_SLOTS = generateTimeSlots(6, 22)
const amSlots = TIME_SLOTS.filter((slot) => parseInt(slot.key) < 12)
const pmSlots = TIME_SLOTS.filter((slot) => parseInt(slot.key) >= 12)
const TIME_SLOT_PATTERN = /^\d{2}:\d{2}$/

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function createEmptySlots() {
  return DAYS.reduce((acc, day) => {
    acc[day.key] = []
    return acc
  }, {})
}

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
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff + offsetWeeks * 7)
  monday.setHours(0, 0, 0, 0)
  return toIsoDate(monday)
}

function formatDateWithWeekday(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAY_LABELS[date.getDay()]
  return `${month}/${day}(${weekday})`
}

function formatWeekRange(weekStart) {
  const monday = parseIsoDate(weekStart)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${formatDateWithWeekday(monday)} ~ ${formatDateWithWeekday(sunday)}`
}

function getWeekDatesForDays(weekStart) {
  const monday = parseIsoDate(weekStart)
  return DAYS.map((day, index) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + index - 1)
    return {
      ...day,
      date: d,
      dateStr: toIsoDate(d),
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
    }
  })
}

function normalizeDaySlots(daySlots) {
  if (!Array.isArray(daySlots)) return []

  return daySlots
    .filter((slot) => TIME_SLOT_PATTERN.test(slot))
    .filter((slot, index, allSlots) => allSlots.indexOf(slot) === index)
    .sort()
}

const router = useRouter()
const { submitAvailability, fetchMyAvailability, loading, error } = useAvailability()
const { getConnectedTrainerId } = useReservations()
const { showToast, showSuccess } = useToast()

const slots = reactive(createEmptySlots())
const memo = ref('')
const submitError = ref('')

const selectedWeekOffset = ref(0)
const selectedDay = ref(DAYS[0].key)
const selectedWeekStart = computed(() => getWeekStart(selectedWeekOffset.value))
const weekRangeText = computed(() => formatWeekRange(selectedWeekStart.value))
const weekDaysWithDates = computed(() => getWeekDatesForDays(selectedWeekStart.value))
const selectedDayInfo = computed(() =>
  weekDaysWithDates.value.find((day) => day.key === selectedDay.value) || weekDaysWithDates.value[0]
)

const trainerId = ref(null)
const hasActiveConnection = ref(null)
const isInitializing = ref(true)
const isWeekLoading = ref(false)
const isSubmitting = ref(false)

const selectedCount = computed(() =>
  DAYS.reduce((count, day) => count + slots[day.key].length, 0)
)

const hasAnySelection = computed(() => selectedCount.value > 0)

let latestLoadToken = 0

function resetSlots() {
  const emptySlots = createEmptySlots()
  DAYS.forEach((day) => {
    slots[day.key] = emptySlots[day.key]
  })
}

function applyExistingSlots(availableSlots) {
  const normalized = createEmptySlots()

  DAYS.forEach((day) => {
    normalized[day.key] = normalizeDaySlots(availableSlots?.[day.key])
  })

  DAYS.forEach((day) => {
    slots[day.key] = normalized[day.key]
  })
}

function isSlotSelected(dayKey, timeKey) {
  return slots[dayKey].includes(timeKey)
}

function toggleSlot(dayKey, timeKey) {
  submitError.value = ''

  const daySlots = slots[dayKey]
  const selectedIndex = daySlots.indexOf(timeKey)

  if (selectedIndex >= 0) {
    daySlots.splice(selectedIndex, 1)
    return
  }

  daySlots.push(timeKey)
  daySlots.sort()
}

function buildAvailableSlotsPayload() {
  return DAYS.reduce((acc, day) => {
    acc[day.key] = [...slots[day.key]]
    return acc
  }, {})
}

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

  applyExistingSlots(existing?.available_slots)
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
    buildAvailableSlotsPayload(),
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
    await loadExistingAvailability()
  } else {
    resetSlots()
    memo.value = ''
  }

  isInitializing.value = false
})

watch(selectedWeekStart, async (newValue, oldValue) => {
  if (!trainerId.value || newValue === oldValue) return
  await loadExistingAvailability()
})

watch(error, (message) => {
  if (message) {
    showToast(message, 'error')
  }
})
</script>

<style src="./AvailabilityRegistrationView.css" scoped></style>
