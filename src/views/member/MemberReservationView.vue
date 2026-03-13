<!-- 회원 예약 생성 페이지. 날짜/시간 선택 → 트레이너 근무시간 기반 슬롯 계산 → RPC로 예약 생성 -->
<template>
  <div class="member-reservation">
    
    <!-- ── App Bar ── -->
    <div class="reservation-appbar">
      <button class="reservation-appbar__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="reservation-appbar__title">PT 예약 신청</h1>
      <div style="width: 24px;"></div> <!-- spacer -->
    </div>

    <div v-if="hasActiveConnection === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 8px;">
      <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">트레이너와 연결되지 않았습니다</p>
      <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">트레이너를 찾아 연결해보세요</p>
    </div>

    <div v-else-if="hasActiveConnection === null" style="padding: 60px 20px;">
      <AppSkeleton type="rect" width="100%" height="80px" :count="3" />
    </div>

    <template v-else>
    <!-- ── Content Scroll Area ── -->
    <div class="reservation-content">
      
      <!-- Date Selection -->
      <section class="reservation-section">
        <h2 class="reservation-section__title">날짜 선택</h2>
        <div class="date-selector-card">
          <AppCalendar :modelValue="selectedDate" :disabledDates="disabledDates" @update:modelValue="handleDateChange" @monthChange="handleMonthChange" />
        </div>
      </section>

      <!-- Time Selection -->
      <section class="reservation-section">
        <div class="reservation-section__header">
          <h2 class="reservation-section__title">시간 선택</h2>
          <span class="reservation-section__badge">오전/오후</span>
        </div>

        <!-- No slots message -->
        <div v-if="!loading && selectedDate && !hasAnySlots" class="no-slots-message">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 9H21" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p v-if="noSlotsReason === 'holiday'">해당 날짜는 트레이너의 휴무일입니다.</p>
          <p v-else-if="noSlotsReason === 'non-working-day'">해당 요일은 트레이너의 근무일이 아닙니다.</p>
          <p v-else>트레이너가 아직 근무시간을 설정하지 않았습니다.</p>
        </div>

        <!-- AM Times -->
        <div class="time-group">
          <h3 class="time-group__label">오전</h3>
          <div class="time-grid">
            <button
              v-for="time in amTimes"
              :key="time.val"
              class="time-slot"
              :class="{
                'time-slot--selected': selectedTime === time.val,
                'time-slot--disabled': time.status === '마감',
                'time-slot--pending': time.status === '대기중'
              }"
              :disabled="time.status === '마감'"
              @click="selectTime(time.val)"
            >
              <span class="time-slot__time">{{ time.label }}</span>
              <span class="time-slot__status" :class="slotStatusClass(time)">
                {{ slotStatusText(time) }}
              </span>
              <div v-if="selectedTime === time.val" class="time-slot__check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>
          </div>
        </div>

        <!-- PM Times -->
        <div class="time-group">
          <h3 class="time-group__label">오후</h3>
          <div class="time-grid">
            <button
              v-for="time in pmTimes"
              :key="time.val"
              class="time-slot"
              :class="{
                'time-slot--selected': selectedTime === time.val,
                'time-slot--disabled': time.status === '마감',
                'time-slot--pending': time.status === '대기중'
              }"
              :disabled="time.status === '마감'"
              @click="selectTime(time.val)"
            >
              <span class="time-slot__time">{{ time.label }}</span>
              <span class="time-slot__status" :class="slotStatusClass(time)">
                {{ slotStatusText(time) }}
              </span>
              <div v-if="selectedTime === time.val" class="time-slot__check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>
          </div>
        </div>

        <!-- Evening Times -->
        <div class="time-group">
          <h3 class="time-group__label">저녁</h3>
          <div class="time-grid">
            <button
              v-for="time in eveningTimes"
              :key="time.val"
              class="time-slot"
              :class="{
                'time-slot--selected': selectedTime === time.val,
                'time-slot--disabled': time.status === '마감',
                'time-slot--pending': time.status === '대기중'
              }"
              :disabled="time.status === '마감'"
              @click="selectTime(time.val)"
            >
              <span class="time-slot__time">{{ time.label }}</span>
              <span class="time-slot__status" :class="slotStatusClass(time)">
                {{ slotStatusText(time) }}
              </span>
              <div v-if="selectedTime === time.val" class="time-slot__check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </section>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="error-message__icon">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="error-message__text">{{ error }}</p>
      </div>

      <!-- Info Box -->
      <div class="info-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="info-box__icon">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 16V12M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="info-box__content">
          <h4 class="info-box__title">예약 안내</h4>
          <p class="info-box__desc">예약 변경 및 취소는 수업 시작 24시간 전까지만 가능합니다. 당일 취소 시 횟수가 차감될 수 있습니다.</p>
        </div>
      </div>

    </div>

    <!-- ── Bottom Action Bar ── -->
    <p v-if="timeError" class="form-error-text" style="text-align: center; margin: 0 var(--side-margin) 8px;">{{ timeError }}</p>
    <div class="reservation-action">
      <div class="reservation-action__summary">
        <span class="reservation-action__label">선택된 시간</span>
        <span class="reservation-action__value">{{ formattedSelection }}</span>
      </div>
      <button 
        class="reservation-action__btn" 
        :disabled="isSubmitting || loading"
        @click="submitReservation"
      >
        {{ isSubmitting ? '예약 중...' : '예약 요청하기' }}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useReservations } from '@/composables/useReservations'
import { useReservationsStore } from '@/stores/reservations'
import { useWorkHours } from '@/composables/useWorkHours'
import { useScheduleOverrides } from '@/composables/useScheduleOverrides'
import { useToast } from '@/composables/useToast'
import AppCalendar from '@/components/AppCalendar.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'

const router = useRouter()
const route = useRoute()
const { slots, loading, error, noSlotsReason, fetchAvailableSlots, createReservation, getConnectedTrainerId, checkTrainerConnection } = useReservations()
const reservationsStore = useReservationsStore()
const { fetchWorkingDays } = useWorkHours()
const { overrides, fetchOverrides } = useScheduleOverrides()
const { showToast, showSuccess } = useToast()

// 트레이너 근무 요일 Set (0-6) — 캘린더 비근무일 회색 표시용
const workingDays = ref(new Set())

// Date Selection — query.date가 있으면 사용, 없으면 오늘 날짜
const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
const initialDate = route.query.date && /^\d{4}-\d{2}-\d{2}$/.test(route.query.date) ? route.query.date : todayStr
const selectedDate = ref(initialDate)
// 캘린더에 현재 표시 중인 연-월 (YYYY-MM) — disabledDates 계산 기준
const displayedMonth = ref(initialDate.slice(0, 7))

// Time Selection
const selectedTime = ref(null)

// Trainer Connection
const trainerId = ref(null)
const hasActiveConnection = ref(null)
const isSubmitting = ref(false)
const timeError = ref('')

// Initialize trainer ID on mount
onMounted(async () => {
  const connected = await checkTrainerConnection()
  hasActiveConnection.value = connected
  if (!connected) {
    return
  }
  const connectedTrainerId = await getConnectedTrainerId()
  if (connectedTrainerId) {
    trainerId.value = connectedTrainerId
    // 근무 요일 + 선택 날짜 달의 휴무일 + 선택 날짜 슬롯 병렬 조회
    const currentMonth = initialDate.slice(0, 7)
    const [days] = await Promise.all([
      fetchWorkingDays(connectedTrainerId),
      fetchOverrides(connectedTrainerId, currentMonth),
      fetchAvailableSlots(connectedTrainerId, selectedDate.value),
    ])
    workingDays.value = days
  }
})

// Validate and handle date selection
async function handleDateChange(newDate) {
  // Prevent selecting past dates
  if (newDate < todayStr) {
    return
  }
  selectedDate.value = newDate
  selectedTime.value = null
  displayedMonth.value = newDate.slice(0, 7)
  
  // Fetch available slots for the selected date
  if (trainerId.value) {
    await fetchAvailableSlots(trainerId.value, newDate)
  }
}

/** 캘린더 월 변경 시 해당 월의 휴무일 재조회 + 표시 월 갱신 */
async function handleMonthChange(yearMonth) {
  displayedMonth.value = yearMonth
  if (trainerId.value) {
    await fetchOverrides(trainerId.value, yearMonth)
  }
}

/**
 * 휴무일만 캘린더에 회색 표시할 날짜 배열 계산.
 * 현재 표시 중인 달의 모든 날짜 중:
 *   - 휴무 오버라이드(daily_schedule_overrides, is_working=false)로 등록된 날
 * 
 * 비근무일(근무 요일이 아닌 날)은 선택 가능하며,
 * 선택 시 시간 슬롯이 비어있음 (fetchAvailableSlots에서 schedule이 null이므로).
 * workingDays는 Task 4에서 noSlotsReason 메시지 분기에 사용됨.
 */
const disabledDates = computed(() => {
  if (!trainerId.value) return []

  const [year, month] = displayedMonth.value.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const pad = (n) => String(n).padStart(2, '0')
  const disabled = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`

    // 휴무 오버라이드(is_working=false)인 경우만 disabled
    if (overrides.value.some(o => o.date === dateStr && o.is_working === false)) {
      disabled.push(dateStr)
    }
  }
  return disabled
})

function selectTime(val) {
  selectedTime.value = val
}

function slotStatusText(time) {
  if (time.status === '마감') return '마감'
  if (time.status === '대기중') return `대기중 ${time.pendingCount}건`
  return '가능'
}

function slotStatusClass(time) {
  if (time.status === '마감') return 'time-slot__status--closed'
  if (time.status === '대기중') return 'time-slot__status--pending'
  return 'time-slot__status--available'
}

// Computed properties for time slots
const amTimes = computed(() => slots.value.am || [])
const pmTimes = computed(() => slots.value.pm || [])
const eveningTimes = computed(() => slots.value.evening || [])

const hasAnySlots = computed(() => amTimes.value.length > 0 || pmTimes.value.length > 0 || eveningTimes.value.length > 0)


const formattedSelection = computed(() => {
  if (!selectedDate.value) return '날짜를 선택해주세요'
  
  const dateObj = new Date(selectedDate.value)
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const dow = weekdays[dateObj.getDay()]
  
  const timeStr = selectedTime.value ? selectedTime.value : '00:00'
  return `${month}월 ${day}일 (${dow}) ${timeStr}`
})

async function submitReservation() {
  timeError.value = ''
  if (!selectedTime.value) {
    timeError.value = '시간을 선택해주세요'
    return
  }
  if (!trainerId.value) return
  
  isSubmitting.value = true
  const result = await createReservation(trainerId.value, selectedDate.value, selectedTime.value, 'PT')
  
  if (result) {
    reservationsStore.invalidate()
    isSubmitting.value = false
    // Success: navigate back
    showSuccess('예약이 신청되었습니다')
    setTimeout(() => router.back(), 800)
  } else {
    // 슬롯 자동 갱신 — 충돌 시간 마감 반영
    selectedTime.value = null
    if (trainerId.value && selectedDate.value) {
      await fetchAvailableSlots(trainerId.value, selectedDate.value)
    }
    isSubmitting.value = false
  }
  // Error message is displayed via error ref in template
}

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./MemberReservationView.css" scoped></style>
