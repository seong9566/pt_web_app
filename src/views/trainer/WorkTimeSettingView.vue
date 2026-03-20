<!-- 근무시간/휴무 관리 페이지. 기본 설정 + 날짜별 오버라이드 동시 관리 -->
<template>
  <div class="wt-setting">
    <div class="wt-setting__header">
      <button class="wt-setting__back" @click="safeBack(route.path)" aria-label="뒤로 가기">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-900)">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1 class="wt-setting__title">근무 시간 및 예약 설정</h1>
      <div class="wt-setting__header-spacer" />
    </div>

    <div v-if="error || overrideError" class="wt-setting__error">{{ error || overrideError }}</div>

    <div class="wt-setting__body">
      <template v-if="isInitialLoading">
        <section class="wt-section">
          <AppSkeleton type="line" width="var(--wt-skeleton-title-width)" />
          <AppSkeleton type="rect" height="var(--btn-height)" borderRadius="var(--radius-medium)" :count="2" />
        </section>

        <section class="wt-section">
          <AppSkeleton type="line" width="var(--wt-skeleton-title-width)" />
          <AppSkeleton type="rect" height="var(--wt-skeleton-card-height)" borderRadius="var(--radius-large)" :count="1" />
        </section>

        <section class="wt-section">
          <AppSkeleton type="line" width="var(--wt-skeleton-title-width)" />
          <AppSkeleton type="rect" height="var(--wt-skeleton-chip-height)" borderRadius="var(--radius-large)" :count="1" />
        </section>

        <section class="wt-section">
          <AppSkeleton type="line" width="var(--wt-skeleton-title-width)" />
          <AppSkeleton type="rect" height="var(--wt-skeleton-calendar-height)" borderRadius="var(--radius-large)" :count="1" />
        </section>
      </template>

      <template v-else>
        <section class="wt-section">
          <h2 class="wt-section__title">예약 단위</h2>
          <div class="wt-unit-grid">
            <button
              v-for="unit in unitOptions"
              :key="unit.value"
              class="wt-unit-btn"
              :class="{ 'wt-unit-btn--active': selectedUnit === unit.value }"
              @click="selectedUnit = unit.value"
            >
              {{ unit.label }}
            </button>
          </div>
        </section>

        <section class="wt-section">
          <h2 class="wt-section__title">기본 근무시간</h2>

          <div class="wt-default-time">
            <div class="wt-default-time__row">
              <button class="wt-default-time__btn" @click="openTimePicker('defaultStart', defaultStart)">
                <span class="wt-default-time__label">시작</span>
                <strong class="wt-default-time__value">{{ defaultStart }}</strong>
              </button>
              <span class="wt-default-time__dash">~</span>
              <button class="wt-default-time__btn" @click="openTimePicker('defaultEnd', defaultEnd)">
                <span class="wt-default-time__label">종료</span>
                <strong class="wt-default-time__value">{{ defaultEnd }}</strong>
              </button>
            </div>
          </div>
        </section>

        <section class="wt-section">
          <h2 class="wt-section__title">반복 휴무 요일</h2>

          <div class="wt-weekday-chips">
            <button
              v-for="day in days"
              :key="day.id"
              class="wt-weekday-chip"
              :class="!day.enabled ? 'wt-weekday-chip--active' : 'wt-weekday-chip--off'"
              @click="toggleDay(day)"
            >
              {{ toShortLabel(day.label) }}
            </button>
          </div>
        </section>

        <section class="wt-section">
          <h2 class="wt-section__title">날짜별 스케줄 관리</h2>

          <div class="wt-calendar-card">
            <div class="wt-calendar-legend">
              <span class="wt-calendar-legend__item">
                <span class="wt-calendar-legend__dot wt-calendar-legend__dot--cancelled" />
                휴무 오버라이드
              </span>
              <span class="wt-calendar-legend__item">
                <span class="wt-calendar-legend__dot wt-calendar-legend__dot--approved" />
                시간 변경
              </span>
            </div>

            <AppCalendar
              :modelValue="selectedDate"
              :dots="calendarDots"
              @update:modelValue="handleDateSelect"
              @monthChange="handleMonthChange"
            />

            <p class="wt-calendar-hint">{{ selectedDateHint }}</p>
          </div>
        </section>
      </template>

      <div class="wt-setting__spacer" />
    </div>

    <div class="wt-setting__footer">
      <button class="wt-setting__submit" @click="handleSave" :disabled="loading || isInitialLoading">
        {{ loading && !isInitialLoading ? '저장 중...' : '설정 저장' }}
      </button>
    </div>

    <AppBottomSheet v-model="showDateSheet">
      <header class="wt-sheet-head">
        <button class="wt-sheet-head__close" @click="showDateSheet = false" aria-label="닫기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h3 class="wt-sheet-head__title">일정 관리</h3>
        <div class="wt-sheet-head__close" style="visibility: hidden;"></div>
      </header>

      <h2 class="wt-sheet-date">{{ dateSheetTitle }}</h2>

      <div class="wt-sheet-toggle">
        <button
          class="wt-sheet-toggle__btn"
          :class="{ 'wt-sheet-toggle__btn--active': overrideIsWorking }"
          @click="overrideIsWorking = true"
        >
          근무
        </button>
        <button
          class="wt-sheet-toggle__btn"
          :class="{ 'wt-sheet-toggle__btn--active': !overrideIsWorking }"
          @click="overrideIsWorking = false"
        >
          휴무
        </button>
      </div>

      <div class="wt-sheet-time-area">
        <div class="wt-sheet-time-col">
          <span class="wt-sheet-time-label">시작</span>
          <button
            class="wt-sheet-time-btn"
            :disabled="!overrideIsWorking"
            @click="overrideIsWorking && openTimePicker('overrideStart', overrideStart)"
          >
            {{ overrideStart }}
          </button>
        </div>
        <div class="wt-sheet-time-dash-wrap">
          <span class="wt-sheet-time-dash">~</span>
        </div>
        <div class="wt-sheet-time-col">
          <span class="wt-sheet-time-label">종료</span>
          <button
            class="wt-sheet-time-btn"
            :disabled="!overrideIsWorking"
            @click="overrideIsWorking && openTimePicker('overrideEnd', overrideEnd)"
          >
            {{ overrideEnd }}
          </button>
        </div>
      </div>

      <p v-if="!overrideIsWorking && reservationCount > 0" class="wt-sheet-warning">
        ⚠️ 이 날짜에 {{ reservationCount }}건의 예약이 있습니다. 휴무로 변경하면 예약이 자동 거절됩니다.
      </p>
      <div v-else class="wt-sheet-info">
        <svg class="wt-sheet-info-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="8" fill="var(--color-gray-400)"/>
          <rect x="7.2" y="7" width="1.6" height="4.5" rx="0.8" fill="white"/>
          <circle cx="8" cy="5" r="0.9" fill="white"/>
        </svg>
        <p class="wt-sheet-info-text">
          선택한 날짜의 근무 시간이 기본 설정과 다를 경우 이곳에서 개별적으로 수정할 수 있습니다.
        </p>
      </div>

      <div class="wt-sheet-actions">
        <button class="wt-sheet-action-confirm" @click="confirmOverride">확인</button>
      </div>
    </AppBottomSheet>

    <AppBottomSheet v-model="showTimePicker" title="시간 선택">
      <AppTimePicker v-model="pickerTime" />
      <button class="wt-setting__time-confirm" @click="confirmTime">확인</button>
    </AppBottomSheet>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { safeBack } from '@/utils/navigation'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppCalendar from '@/components/AppCalendar.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppTimePicker from '@/components/AppTimePicker.vue'
import { useScheduleOverrides } from '@/composables/useScheduleOverrides'
import { useToast } from '@/composables/useToast'
import { useWorkHours } from '@/composables/useWorkHours'
import { useAuthStore } from '@/stores/auth'
import { useWorkHoursStore } from '@/stores/workHours'
import { useScheduleOverridesStore } from '@/stores/scheduleOverrides'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const { days, selectedUnit, loading, error, fetchWorkHours, saveWorkHours } = useWorkHours()
const {
  overrides,
  error: overrideError,
  fetchOverrides,
  setOverride,
  removeOverride,
  isHoliday,
  getOverride,
  getReservationCountForDate,
} = useScheduleOverrides()
const { showToast, showSuccess } = useToast()

const unitOptions = [
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
]

const isInitialLoading = ref(true)
const defaultStart = ref('09:00')
const defaultEnd = ref('18:00')

const pad = (n) => String(n).padStart(2, '0')
const now = new Date()
const currentYearMonth = ref(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`)

const calendarDots = computed(() => {
  const dots = {}
  for (const item of overrides.value) {
    const day = Number.parseInt(item.date.split('-')[2], 10)
    if (item.is_working === false) {
      dots[day] = ['cancelled']
    } else {
      dots[day] = ['approved']
    }
  }
  return dots
})

const selectedDate = ref('')
const showDateSheet = ref(false)
const overrideIsWorking = ref(true)
const overrideStart = ref('09:00')
const overrideEnd = ref('18:00')
const reservationCount = ref(0)

const dateSheetTitle = computed(() => {
  if (!selectedDate.value) return ''
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dow = new Date(y, m - 1, d).getDay()
  return `${m}월 ${d}일 (${dayNames[dow]})`
})

const selectedDateHint = computed(() => {
  if (!selectedDate.value) return '날짜를 선택하면 해당 일자 근무/휴무를 상세 조정할 수 있습니다.'
  if (isHoliday(selectedDate.value)) return '선택한 날짜는 휴무 오버라이드가 적용되어 있습니다.'
  if (getOverride(selectedDate.value)) return '선택한 날짜는 근무 시간 오버라이드가 적용되어 있습니다.'
  return '선택한 날짜는 반복 근무 요일과 기본 근무시간을 따릅니다.'
})

const showTimePicker = ref(false)
const pickerTime = ref('09:00')
const timeTargetMap = {
  defaultStart,
  defaultEnd,
  overrideStart,
  overrideEnd,
}
let pickerTarget = null

async function openDateSheet(date) {
  if (!date || !auth.user?.id) return

  const existing = getOverride(date)
  if (existing) {
    overrideIsWorking.value = existing.is_working
    overrideStart.value = existing.start_time ? existing.start_time.slice(0, 5) : defaultStart.value
    overrideEnd.value = existing.end_time ? existing.end_time.slice(0, 5) : defaultEnd.value
  } else {
    overrideIsWorking.value = true
    overrideStart.value = defaultStart.value
    overrideEnd.value = defaultEnd.value
  }

  reservationCount.value = await getReservationCountForDate(auth.user.id, date)
  showDateSheet.value = true
}

async function handleDateSelect(date) {
  if (!date) return
  if (selectedDate.value === date) {
    await openDateSheet(date)
    return
  }
  selectedDate.value = date
}

watch(selectedDate, async (date) => {
  if (!date) return
  await openDateSheet(date)
})

async function handleMonthChange(yearMonth) {
  if (!auth.user?.id) return
  currentYearMonth.value = yearMonth
  await fetchOverrides(auth.user.id, yearMonth)
}

async function confirmOverride() {
  if (!auth.user?.id || !selectedDate.value) return

  const ok = await setOverride(
    auth.user.id,
    selectedDate.value,
    overrideIsWorking.value,
    overrideIsWorking.value ? overrideStart.value : null,
    overrideIsWorking.value ? overrideEnd.value : null
  )

  if (ok) {
    showSuccess('저장되었습니다')
    useScheduleOverridesStore().invalidateMonth(auth.user.id, selectedDate.value.slice(0, 7))
  }
  showDateSheet.value = false
}

async function restoreDefault() {
  if (!auth.user?.id || !selectedDate.value) return

  const ok = await removeOverride(auth.user.id, selectedDate.value)
  if (ok) {
    showSuccess('기본값으로 복원되었습니다')
    useScheduleOverridesStore().invalidateMonth(auth.user.id, selectedDate.value.slice(0, 7))
  }
  showDateSheet.value = false
}

function openTimePicker(targetKey, currentTime) {
  pickerTarget = timeTargetMap[targetKey] ?? null
  pickerTime.value = currentTime
  showTimePicker.value = true
}

function confirmTime() {
  if (pickerTarget) {
    pickerTarget.value = pickerTime.value
    pickerTarget = null
  }
  showTimePicker.value = false
}

function toShortLabel(label) {
  return label.slice(0, 1)
}

function toggleDay(day) {
  day.enabled = !day.enabled
}

async function handleSave() {
  if (isInitialLoading.value) return

  const updatedDays = days.value.map((day) => ({
    ...day,
    start: defaultStart.value,
    end: defaultEnd.value,
  }))

  const ok = await saveWorkHours(updatedDays, selectedUnit.value)
  if (ok) {
    showSuccess('저장되었습니다')
    useWorkHoursStore().invalidate()
    setTimeout(() => safeBack(route.path), 800)
  }
}

onMounted(async () => {
  try {
    if (!auth.user?.id) {
      showToast('사용자 정보를 확인할 수 없습니다.', 'error')
      return
    }

    await fetchWorkHours()

    const enabledDay = days.value.find((day) => day.enabled)
    if (enabledDay) {
      defaultStart.value = enabledDay.start
      defaultEnd.value = enabledDay.end
    }

    if (days.value.every((day) => !day.enabled)) {
      days.value.forEach((day) => {
        day.enabled = true
      })
    }

    await fetchOverrides(auth.user.id, currentYearMonth.value)
  } finally {
    isInitialLoading.value = false
  }
})

watch(error, (message) => {
  if (message) showToast(message, 'error')
})

watch(overrideError, (message) => {
  if (message) showToast(message, 'error')
})
</script>

<style src="./WorkTimeSettingView.css" scoped></style>
