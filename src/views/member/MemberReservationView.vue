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

    <!-- ── Content Scroll Area ── -->
    <div class="reservation-content">
      
      <!-- Date Selection -->
      <section class="reservation-section">
        <h2 class="reservation-section__title">날짜 선택</h2>
        <div class="date-selector-card">
          <AppCalendar :modelValue="selectedDate" @update:modelValue="handleDateChange" />
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
          <p>트레이너가 아직 근무시간을 설정하지 않았습니다.</p>
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
                'time-slot--disabled': time.status === '마감'
              }"
              :disabled="time.status === '마감'"
              @click="selectTime(time.val)"
            >
              <span class="time-slot__time">{{ time.label }}</span>
              <span class="time-slot__status" :class="`time-slot__status--${time.status === '가능' ? 'available' : 'closed'}`">
                {{ time.status }}
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
                'time-slot--disabled': time.status === '마감'
              }"
              :disabled="time.status === '마감'"
              @click="selectTime(time.val)"
            >
              <span class="time-slot__time">{{ time.label }}</span>
              <span class="time-slot__status" :class="`time-slot__status--${time.status === '가능' ? 'available' : 'closed'}`">
                {{ time.status }}
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
                'time-slot--disabled': time.status === '마감'
              }"
              :disabled="time.status === '마감'"
              @click="selectTime(time.val)"
            >
              <span class="time-slot__time">{{ time.label }}</span>
              <span class="time-slot__status" :class="`time-slot__status--${time.status === '가능' ? 'available' : 'closed'}`">
                {{ time.status }}
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
    <div class="reservation-action">
      <div class="reservation-action__summary">
        <span class="reservation-action__label">선택된 시간</span>
        <span class="reservation-action__value">{{ formattedSelection }}</span>
      </div>
      <button 
        class="reservation-action__btn" 
        :disabled="!selectedTime || isSubmitting || loading"
        @click="submitReservation"
      >
        {{ isSubmitting ? '예약 중...' : '예약 요청하기' }}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReservations } from '@/composables/useReservations'
import AppCalendar from '@/components/AppCalendar.vue'

const router = useRouter()
const auth = useAuthStore()
const { slots, loading, error, fetchAvailableSlots, createReservation, getConnectedTrainerId } = useReservations()

// Date Selection
const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
const selectedDate = ref(todayStr)

// Time Selection
const selectedTime = ref(null)

// Trainer Connection
const trainerId = ref(null)
const isSubmitting = ref(false)

// Initialize trainer ID on mount
onMounted(async () => {
  const connectedTrainerId = await getConnectedTrainerId()
  if (connectedTrainerId) {
    trainerId.value = connectedTrainerId
    // Fetch available slots for today
    await fetchAvailableSlots(connectedTrainerId, selectedDate.value)
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
  
  // Fetch available slots for the selected date
  if (trainerId.value) {
    await fetchAvailableSlots(trainerId.value, newDate)
  }
}

function selectTime(val) {
  selectedTime.value = val
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
  if (!selectedTime.value || !trainerId.value) return
  
  isSubmitting.value = true
  const result = await createReservation(trainerId.value, selectedDate.value, selectedTime.value, 'PT')
  isSubmitting.value = false
  
  if (result) {
    // Success: navigate back
    router.back()
  }
  // Error message is displayed via error ref in template
}
</script>

<style src="./MemberReservationView.css" scoped></style>
