<template>
  <div class="app-time-picker">
    <div class="app-time-picker__cols">

      <!-- AM/PM Column -->
      <div
        ref="periodCol"
        class="app-time-picker__col app-time-picker__col--period"
        @scroll="onScroll('period')"
      >
        <div class="app-time-picker__spacer" />
        <div
          v-for="p in periods"
          :key="p"
          class="app-time-picker__item"
          :class="{ 'app-time-picker__item--active': p === currentPeriod }"
        >{{ p }}</div>
        <div class="app-time-picker__spacer" />
      </div>

      <!-- Hour Column -->
      <div
        ref="hourCol"
        class="app-time-picker__col"
        @scroll="onScroll('hour')"
      >
        <div class="app-time-picker__spacer" />
        <div
          v-for="h in hours"
          :key="h"
          class="app-time-picker__item"
          :class="{ 'app-time-picker__item--active': h === currentHour }"
        >{{ h }}</div>
        <div class="app-time-picker__spacer" />
      </div>

      <!-- Colon separator -->
      <span class="app-time-picker__colon">:</span>

      <!-- Minute Column -->
      <div
        ref="minuteCol"
        class="app-time-picker__col"
        @scroll="onScroll('minute')"
      >
        <div class="app-time-picker__spacer" />
        <div
          v-for="m in minutes"
          :key="m"
          class="app-time-picker__item"
          :class="{ 'app-time-picker__item--active': m === currentMinute }"
        >{{ padNum(m) }}</div>
        <div class="app-time-picker__spacer" />
      </div>

      <!-- Selection indicator line -->
      <div class="app-time-picker__indicator" />

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const ITEM_HEIGHT = 40

const props = defineProps({
  modelValue: { type: String, default: '12:00' },
})

const emit = defineEmits(['update:modelValue'])

const periods = ['오전', '오후']
const hours = Array.from({ length: 12 }, (_, i) => i + 1)
const minutes = Array.from({ length: 12 }, (_, i) => i * 5)

const padNum = (n) => String(n).padStart(2, '0')

// ── Parse 24-hr → AM/PM components ──
function parse24(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? '오후' : '오전'
  let hour12 = h % 12
  if (hour12 === 0) hour12 = 12
  const roundedMin = Math.round(m / 5) * 5
  return {
    period,
    hour: hour12,
    minute: roundedMin >= 60 ? 55 : roundedMin,
  }
}

// ── AM/PM components → 24-hr string ──
function to24(period, hour, minute) {
  let h24 = hour
  if (period === '오후' && hour !== 12) h24 = hour + 12
  if (period === '오전' && hour === 12) h24 = 0
  return `${padNum(h24)}:${padNum(minute)}`
}

const parsed = parse24(props.modelValue)
const currentPeriod = ref(parsed.period)
const currentHour = ref(parsed.hour)
const currentMinute = ref(parsed.minute)

const periodCol = ref(null)
const hourCol = ref(null)
const minuteCol = ref(null)

const isReady = ref(false)
let scrollTimer = null

function onScroll(type) {
  if (!isReady.value) return
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    syncFromScroll(type)
  }, 80)
}

function syncFromScroll(type) {
  if (type === 'period' && periodCol.value) {
    const idx = Math.round(periodCol.value.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(idx, periods.length - 1))
    currentPeriod.value = periods[clamped]
  }
  if (type === 'hour' && hourCol.value) {
    const idx = Math.round(hourCol.value.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(idx, hours.length - 1))
    currentHour.value = hours[clamped]
  }
  if (type === 'minute' && minuteCol.value) {
    const idx = Math.round(minuteCol.value.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(idx, minutes.length - 1))
    currentMinute.value = minutes[clamped]
  }
  emit('update:modelValue', to24(currentPeriod.value, currentHour.value, currentMinute.value))
}

onMounted(() => {
  nextTick(() => {
    const periodIdx = periods.indexOf(currentPeriod.value)
    const hourIdx = hours.indexOf(currentHour.value)
    const minuteIdx = minutes.indexOf(currentMinute.value)

    if (periodCol.value) periodCol.value.scrollTop = periodIdx * ITEM_HEIGHT
    if (hourCol.value) hourCol.value.scrollTop = hourIdx * ITEM_HEIGHT
    if (minuteCol.value) minuteCol.value.scrollTop = minuteIdx * ITEM_HEIGHT

    setTimeout(() => { isReady.value = true }, 200)
  })
})
</script>

<style scoped>
.app-time-picker {
  user-select: none;
}

.app-time-picker__cols {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.app-time-picker__col {
  width: 72px;
  height: calc(40px * 5);
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.app-time-picker__col::-webkit-scrollbar {
  display: none;
}

.app-time-picker__col--period {
  width: 64px;
  margin-right: 8px;
}

.app-time-picker__spacer {
  height: calc(40px * 2);
  flex-shrink: 0;
}

.app-time-picker__item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-reg);
  color: var(--color-gray-600);
  opacity: 0.35;
  scroll-snap-align: center;
  transition: opacity 0.15s, color 0.15s;
}

.app-time-picker__item--active {
  font-size: var(--fs-title);
  font-weight: var(--fw-body1-bold);
  color: var(--color-gray-900);
  opacity: 1;
}

.app-time-picker__colon {
  font-size: var(--fs-title);
  font-weight: var(--fw-body1-bold);
  color: var(--color-gray-900);
  width: 12px;
  text-align: center;
  flex-shrink: 0;
}

.app-time-picker__indicator {
  position: absolute;
  left: 0;
  right: 0;
  top: 80px;
  height: 40px;
  border-top: 1.5px solid var(--color-gray-200);
  border-bottom: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-small);
  background-color: rgba(0, 122, 255, 0.04);
  pointer-events: none;
}
</style>
