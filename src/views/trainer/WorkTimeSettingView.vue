<template>
  <div class="wt-setting">

    <!-- ── Header ── -->
    <div class="wt-setting__header">
      <button class="wt-setting__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="wt-setting__title">근무 시간 및 예약 설정</h1>
      <button class="wt-setting__save-btn" @click="handleSave">저장</button>
    </div>

    <!-- ── Body ── -->
    <div class="wt-setting__body">

      <!-- 예약 단위 -->
      <section class="wt-section">
        <h2 class="wt-section__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#007AFF" stroke-width="1.8"/>
            <path d="M12 7V12L15 14" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          예약 단위
        </h2>
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

      <!-- 근무 일정 -->
      <section class="wt-section">
        <h2 class="wt-section__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="#007AFF" stroke-width="1.8"/>
            <path d="M3 9H21" stroke="#007AFF" stroke-width="1.8"/>
            <path d="M8 2V6M16 2V6" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          근무 일정
        </h2>

        <div class="wt-days">
          <div
            v-for="day in days"
            :key="day.id"
            class="wt-day-card"
            :class="{ 'wt-day-card--disabled': !day.enabled }"
          >
            <!-- Day header row -->
            <div class="wt-day-card__header">
              <span class="wt-day-card__label">{{ day.label }}</span>
              <span
                class="wt-toggle"
                :class="{ 'wt-toggle--on': day.enabled }"
                @click="day.enabled = !day.enabled"
              >
                <span class="wt-toggle__knob" />
              </span>
            </div>

            <!-- Time fields (only when enabled) -->
            <div v-if="day.enabled" class="wt-day-card__times">
              <div class="wt-time-field">
                <span class="wt-time-field__label">시작</span>
                <button
                  class="wt-time-field__input"
                  @click="openTimePicker(day, 'start')"
                >
                  {{ formatTime(day.start) }}
                </button>
              </div>
              <span class="wt-day-card__dash">-</span>
              <div class="wt-time-field">
                <span class="wt-time-field__label">종료</span>
                <button
                  class="wt-time-field__input"
                  @click="openTimePicker(day, 'end')"
                >
                  {{ formatTime(day.end) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style="height: 120px;" />
    </div>

    <!-- ── Footer ── -->
    <div class="wt-setting__footer">
      <button class="wt-setting__submit" @click="handleSave">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 21V13H7V21M7 3V8H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        일정 업데이트
      </button>
    </div>

    <!-- ── Time Picker Bottom Sheet ── -->
    <AppBottomSheet v-model="showTimePicker" title="시간 선택">
      <AppTimePicker v-model="pickerTime" />
      <button class="wt-setting__time-confirm" @click="confirmTime">확인</button>
    </AppBottomSheet>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppTimePicker from '@/components/AppTimePicker.vue'

const router = useRouter()

// ── 예약 단위 ──
const unitOptions = [
  { value: 30,  label: '30분' },
  { value: 60,  label: '1시간' },
  { value: 90,  label: '1시간 30분' },
  { value: 120, label: '2시간' },
]
const selectedUnit = ref(60)

// ── 근무 일정 ──
const days = ref([
  { id: 'mon', label: '월요일', enabled: true,  start: '09:00', end: '18:00' },
  { id: 'tue', label: '화요일', enabled: true,  start: '09:00', end: '18:00' },
  { id: 'wed', label: '수요일', enabled: true,  start: '09:00', end: '18:00' },
  { id: 'thu', label: '목요일', enabled: false, start: '09:00', end: '18:00' },
  { id: 'fri', label: '금요일', enabled: true,  start: '10:00', end: '16:00' },
  { id: 'sat', label: '토요일', enabled: false, start: '09:00', end: '18:00' },
  { id: 'sun', label: '일요일', enabled: false, start: '09:00', end: '18:00' },
])

// ── 시간 포맷 (24h → 12h AM/PM) ──
function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  let hour12 = h % 12
  if (hour12 === 0) hour12 = 12
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

// ── Time Picker 바텀시트 ──
const showTimePicker = ref(false)
const pickerTime = ref('09:00')
let pickerTarget = null // { day, field: 'start' | 'end' }

function openTimePicker(day, field) {
  pickerTarget = { day, field }
  pickerTime.value = field === 'start' ? day.start : day.end
  showTimePicker.value = true
}

function confirmTime() {
  if (pickerTarget) {
    pickerTarget.day[pickerTarget.field] = pickerTime.value
    pickerTarget = null
  }
  showTimePicker.value = false
}

// ── 저장 ──
function handleSave() {
  const result = {
    unit: selectedUnit.value,
    schedule: days.value
      .filter(d => d.enabled)
      .map(d => ({ day: d.id, start: d.start, end: d.end })),
  }
  console.log('근무 시간 저장:', result)
  alert('저장되었습니다.')
  router.back()
}
</script>

<style src="./WorkTimeSettingView.css" scoped></style>
