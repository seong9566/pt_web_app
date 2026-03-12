<!-- 근무시간 설정 페이지. 요일별 시작/종료 시간 + 슬롯 단위 설정 → DB 저장 -->
<template>
  <div class="wt-setting">

    <!-- ── Header ── -->
    <div class="wt-setting__header">
      <button class="wt-setting__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-900)">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="wt-setting__title">근무 시간 및 예약 설정</h1>
    </div>

    <!-- ── Error Message ── -->
    <div v-if="error" class="wt-setting__error">{{ error }}</div>

    <!-- ── Body ── -->
    <div class="wt-setting__body">
      <template v-if="isInitialLoading">
        <section class="wt-section">
          <AppSkeleton type="line" width="120px" />
          <AppSkeleton type="rect" height="52px" borderRadius="var(--radius-medium)" :count="2" />
        </section>

        <section class="wt-section">
          <AppSkeleton type="line" width="120px" />
          <AppSkeleton type="rect" height="84px" borderRadius="var(--radius-large)" :count="5" />
        </section>

        <div style="height: 120px;" />
      </template>

      <template v-else>
        <!-- 예약 단위 -->
        <section class="wt-section">
          <h2 class="wt-section__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color: var(--color-blue-primary)">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 7V12L15 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color: var(--color-blue-primary)">
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>
              <path d="M3 9H21" stroke="currentColor" stroke-width="1.8"/>
              <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
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
      </template>
    </div>

    <!-- ── Footer ── -->
    <div class="wt-setting__footer">
      <button class="wt-setting__submit" @click="handleSave" :disabled="loading || isInitialLoading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 21V13H7V21M7 3V8H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ loading && !isInitialLoading ? '저장 중...' : '일정 업데이트' }}
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
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppTimePicker from '@/components/AppTimePicker.vue'
import { useWorkHours } from '@/composables/useWorkHours'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { days, selectedUnit, loading, error, fetchWorkHours, saveWorkHours } = useWorkHours()
const { showToast, showError, showSuccess } = useToast()

// ── 예약 단위 ──
const unitOptions = [
  { value: 30,  label: '30분' },
  { value: 60,  label: '1시간' },
  { value: 90,  label: '1시간 30분' },
  { value: 120, label: '2시간' },
]

// ── 초기 로딩 상태 ──
const isInitialLoading = ref(true)

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
async function handleSave() {
  if (isInitialLoading.value) {
    return
  }

  const success = await saveWorkHours(days.value, selectedUnit.value)
  if (success) {
    showSuccess('저장되었습니다')
    setTimeout(() => {
      router.back()
    }, 800)
  }
}

// ── 초기화: 기존 근무시간 설정 로드 ──
onMounted(async () => {
  try {
    await fetchWorkHours()
  } finally {
    isInitialLoading.value = false
  }
})

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./WorkTimeSettingView.css" scoped></style>
