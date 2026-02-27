<template>
  <div class="app-calendar">

    <!-- Month Nav -->
    <div class="app-calendar__nav">
      <button class="app-calendar__arrow" @click="prevMonth">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <span class="app-calendar__month">{{ displayYear }}년 {{ displayMonth }}월</span>
      <button class="app-calendar__arrow" @click="nextMonth">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L15 12L9 18" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Weekday Labels -->
    <div class="app-calendar__weekdays">
      <span
        v-for="day in weekdayLabels"
        :key="day.label"
        class="app-calendar__weekday"
        :class="day.cls"
      >{{ day.label }}</span>
    </div>

    <!-- Date Grid -->
    <div class="app-calendar__grid">
      <div
        v-for="cell in calendarCells"
        :key="cell.key"
        class="app-calendar__cell"
        :class="{ 'app-calendar__cell--empty': !cell.date }"
        @click="cell.date && handleSelect(cell.date)"
      >
        <div
          v-if="cell.date"
          class="app-calendar__inner"
          :class="{ 'app-calendar__inner--selected': isSelected(cell.date) }"
        >
          <span
            class="app-calendar__num"
            :class="{
              'app-calendar__num--selected': isSelected(cell.date),
              'app-calendar__num--sun': cell.isSun,
              'app-calendar__num--sat': cell.isSat,
            }"
          >{{ cell.date }}</span>
          <div v-if="getCellDots(cell.date).length" class="app-calendar__dots">
            <span
              v-for="(dot, i) in getCellDots(cell.date)"
              :key="i"
              class="app-calendar__dot"
              :class="`app-calendar__dot--${dot}`"
            />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  dots: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue'])

const pad = (n) => String(n).padStart(2, '0')

// Initialize display month from modelValue or today
const today = new Date()
const initParts = props.modelValue
  ? props.modelValue.split('-').map(Number)
  : [today.getFullYear(), today.getMonth() + 1, today.getDate()]

const displayYear = ref(initParts[0])
const displayMonth = ref(initParts[1])

const weekdayLabels = [
  { label: '일', cls: 'app-calendar__weekday--sun' },
  { label: '월', cls: '' },
  { label: '화', cls: '' },
  { label: '수', cls: '' },
  { label: '목', cls: '' },
  { label: '금', cls: '' },
  { label: '토', cls: 'app-calendar__weekday--sat' },
]

const calendarCells = computed(() => {
  const firstDay = new Date(displayYear.value, displayMonth.value - 1, 1).getDay()
  const daysInMonth = new Date(displayYear.value, displayMonth.value, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ key: `empty-${i}`, date: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = (firstDay + d - 1) % 7
    cells.push({
      key: `day-${d}`,
      date: d,
      isSun: dayOfWeek === 0,
      isSat: dayOfWeek === 6,
    })
  }
  return cells
})

function getCellDots(date) {
  return props.dots[date] || []
}

function isSelected(day) {
  if (!props.modelValue) return false
  const [y, m, d] = props.modelValue.split('-').map(Number)
  return y === displayYear.value && m === displayMonth.value && d === day
}

function handleSelect(day) {
  const dateStr = `${displayYear.value}-${pad(displayMonth.value)}-${pad(day)}`
  emit('update:modelValue', dateStr)
}

function prevMonth() {
  if (displayMonth.value === 1) {
    displayMonth.value = 12
    displayYear.value--
  } else {
    displayMonth.value--
  }
}

function nextMonth() {
  if (displayMonth.value === 12) {
    displayMonth.value = 1
    displayYear.value++
  } else {
    displayMonth.value++
  }
}
</script>

<style scoped>
.app-calendar {
  display: flex;
  flex-direction: column;
}

/* ── Nav ── */
.app-calendar__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.app-calendar__arrow {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.15s;
}

.app-calendar__arrow:active {
  background-color: var(--color-gray-100);
}

.app-calendar__month {
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-bold);
  color: var(--color-gray-900);
}

/* ── Weekdays ── */
.app-calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.app-calendar__weekday {
  text-align: center;
  font-size: var(--fs-caption);
  font-weight: var(--fw-caption);
  color: var(--color-gray-600);
  padding: 4px 0;
}

.app-calendar__weekday--sun { color: var(--color-red); }
.app-calendar__weekday--sat { color: var(--color-blue-primary); }

/* ── Grid ── */
.app-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 2px;
}

.app-calendar__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.app-calendar__cell--empty {
  cursor: default;
  pointer-events: none;
}

.app-calendar__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background-color 0.15s;
}

.app-calendar__inner--selected {
  background-color: var(--color-blue-primary);
}

.app-calendar__num {
  font-size: 15px;
  font-weight: var(--fw-body1-reg);
  color: var(--color-gray-900);
  line-height: 1;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-calendar__num--selected {
  color: var(--color-white);
  font-weight: var(--fw-body1-bold);
}

.app-calendar__num--sun { color: var(--color-red); }
.app-calendar__num--sat { color: var(--color-blue-primary); }

.app-calendar__inner--selected .app-calendar__num--sun,
.app-calendar__inner--selected .app-calendar__num--sat {
  color: var(--color-white);
}

/* ── Dots ── */
.app-calendar__dots {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.app-calendar__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.app-calendar__dot--pending   { background-color: var(--color-yellow); }
.app-calendar__dot--approved  { background-color: var(--color-green); }
.app-calendar__dot--done      { background-color: #9CA3AF; }
.app-calendar__dot--cancelled { background-color: var(--color-red); }
</style>
