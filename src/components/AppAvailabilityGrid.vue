<template>
  <section class="availability-grid">
    <div class="availability-grid__toolbar">
      <button
        class="availability-grid__paint-toggle"
        :class="{ 'availability-grid__paint-toggle--active': isPaintMode }"
        type="button"
        :disabled="props.loading"
        @click="togglePaintMode"
      >
        {{ isPaintMode ? '선택 모드 ON' : '선택 모드' }}
      </button>
    </div>

    <div
      class="availability-grid__wrapper"
      :class="{ 'availability-grid__wrapper--paint-mode': isPaintMode }"
      role="grid"
      :aria-busy="props.loading"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
    >
      <div class="availability-grid__grid">
        <div class="availability-grid__time-header" aria-hidden="true" />

        <div
          v-for="day in weekDays"
          :key="`header-${day.dateIso}`"
          class="availability-grid__day-header"
        >
          <span class="availability-grid__day-name">{{ day.dayLabel }}</span>
          <span class="availability-grid__day-date">{{ day.dateLabel }}</span>
        </div>

        <template v-for="timeStr in timeSlots" :key="`row-${timeStr}`">
          <div class="availability-grid__time-label">{{ timeStr }}</div>

          <button
            v-for="day in weekDays"
            :key="`cell-${day.dayKey}-${timeStr}`"
            class="availability-grid__cell"
            :class="{
              'availability-grid__cell--selected': isCellSelected(day.dayKey, timeStr),
              'availability-grid__cell--off-hours': isOffHours(timeStr),
            }"
            type="button"
            role="gridcell"
            :aria-selected="isCellSelected(day.dayKey, timeStr)"
            :aria-label="getCellAriaLabel(day.dayLabel, day.dayKey, timeStr)"
            :data-day="day.dayKey"
            :data-time="timeStr"
            :disabled="props.loading"
            @click="!isPaintMode && toggleCell(day.dayKey, timeStr)"
            @pointerdown="isPaintMode && handlePaintStart($event, day.dayKey, timeStr)"
          />
        </template>
      </div>

      <div v-if="props.loading" class="availability-grid__loading-overlay" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  weekStart: { type: String, required: true },
  offHoursRange: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const isPaintMode = ref(false)
const paintAction = ref(null)
const paintedCells = ref(new Set())
let inactivityTimer = null

function generateTimeSlots(startHour = 6, endHour = 22) {
  const generatedSlots = []

  for (let hour = startHour; hour < endHour; hour += 1) {
    generatedSlots.push(`${String(hour).padStart(2, '0')}:00`)
  }

  return generatedSlots
}

const timeSlots = generateTimeSlots(6, 22)

function parseDate(value) {
  const parsedDate = new Date(`${value}T00:00:00`)

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function formatDateLabel(dateValue) {
  return `${dateValue.getMonth() + 1}/${dateValue.getDate()}`
}

function formatDateIso(dateValue) {
  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, '0')
  const day = String(dateValue.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const weekDays = computed(() => {
  const startDate = parseDate(props.weekStart)

  return DAY_KEYS.map((dayKey, index) => {
    const dateValue = new Date(startDate)
    dateValue.setDate(startDate.getDate() + index)

    return {
      dayKey,
      dayLabel: DAY_LABELS[index],
      dateLabel: formatDateLabel(dateValue),
      dateIso: formatDateIso(dateValue),
    }
  })
})

function toMinutes(timeStr) {
  if (typeof timeStr !== 'string') {
    return null
  }

  const [hourStr, minuteStr] = timeStr.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null
  }

  return hour * 60 + minute
}

const offHoursMinutesRange = computed(() => {
  if (!props.offHoursRange) {
    return null
  }

  const start = toMinutes(props.offHoursRange.startTime)
  const end = toMinutes(props.offHoursRange.endTime)

  if (start === null || end === null || start === end) {
    return null
  }

  return { start, end }
})

function isOffHours(timeStr) {
  const range = offHoursMinutesRange.value

  if (!range) {
    return false
  }

  const targetMinutes = toMinutes(timeStr)

  if (targetMinutes === null) {
    return false
  }

  if (range.start < range.end) {
    return targetMinutes < range.start || targetMinutes >= range.end
  }

  return targetMinutes >= range.end && targetMinutes < range.start
}

function isCellSelected(dayKey, timeStr) {
  const daySlots = props.modelValue?.[dayKey]
  return Array.isArray(daySlots) && daySlots.includes(timeStr)
}

function toggleCell(dayKey, timeStr) {
  if (props.loading) {
    return
  }

  const current = { ...props.modelValue }

  if (!Array.isArray(current[dayKey])) {
    current[dayKey] = []
  }

  const index = current[dayKey].indexOf(timeStr)

  if (index >= 0) {
    current[dayKey] = current[dayKey].filter((time) => time !== timeStr)
  } else {
    current[dayKey] = [...current[dayKey], timeStr].sort()
  }

  emit('update:modelValue', current)
}

function togglePaintMode() {
  isPaintMode.value = !isPaintMode.value

  if (isPaintMode.value) {
    resetInactivityTimer()
    return
  }

  clearInactivityTimer()
  paintAction.value = null
  paintedCells.value = new Set()
}

function resetInactivityTimer() {
  clearInactivityTimer()

  inactivityTimer = setTimeout(() => {
    isPaintMode.value = false
    paintAction.value = null
    paintedCells.value = new Set()
  }, 10000)
}

function clearInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
}

function handlePaintStart(event, dayKey, timeStr) {
  if (!isPaintMode.value || props.loading) {
    return
  }

  event.preventDefault()
  resetInactivityTimer()

  const isSelected = isCellSelected(dayKey, timeStr)
  paintAction.value = isSelected ? 'deselect' : 'select'
  paintedCells.value = new Set()

  paintCell(dayKey, timeStr)
}

function handlePointerMove(event) {
  if (!isPaintMode.value || !paintAction.value || props.loading) {
    return
  }

  event.preventDefault()
  resetInactivityTimer()

  const el = document.elementFromPoint(event.clientX, event.clientY)
  const cellEl = el?.closest('[data-day][data-time]')

  if (!cellEl) {
    return
  }

  const dayKey = cellEl.dataset.day
  const timeStr = cellEl.dataset.time

  if (!dayKey || !timeStr) {
    return
  }

  const cellKey = `${dayKey}-${timeStr}`

  if (!paintedCells.value.has(cellKey)) {
    paintCell(dayKey, timeStr)
  }
}

function handlePointerUp() {
  if (!isPaintMode.value) {
    return
  }

  paintAction.value = null
  paintedCells.value = new Set()
}

function paintCell(dayKey, timeStr) {
  const cellKey = `${dayKey}-${timeStr}`
  paintedCells.value.add(cellKey)

  const current = { ...props.modelValue }
  if (!Array.isArray(current[dayKey])) {
    current[dayKey] = []
  }

  if (paintAction.value === 'select') {
    if (!current[dayKey].includes(timeStr)) {
      current[dayKey] = [...current[dayKey], timeStr].sort()
    }
  } else {
    current[dayKey] = current[dayKey].filter((time) => time !== timeStr)
  }

  emit('update:modelValue', current)
}

function getCellAriaLabel(dayLabel, dayKey, timeStr) {
  return `${dayLabel} ${timeStr} ${isCellSelected(dayKey, timeStr) ? '선택됨' : '선택 안됨'}`
}

onUnmounted(() => {
  clearInactivityTimer()
})
</script>

<style src="./AppAvailabilityGrid.css" scoped></style>
