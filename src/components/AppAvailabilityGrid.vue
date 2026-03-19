<template>
  <section class="availability-grid">
    <div
      class="availability-grid__wrapper"
      role="grid"
      :aria-busy="props.loading"
    >
      <div class="availability-grid__grid">
        <div class="availability-grid__time-header" aria-hidden="true" />

        <div
          v-for="day in weekDays"
          :key="`header-${day.dateIso}`"
          class="availability-grid__day-header"
          :class="{ 'availability-grid__day-header--holiday': props.holidays.includes(day.dateIso) }"
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
              'availability-grid__cell--holiday': props.holidays.includes(day.dateIso),
            }"
            type="button"
            role="gridcell"
            :aria-selected="isCellSelected(day.dayKey, timeStr)"
            :aria-label="getCellAriaLabel(day.dayLabel, day.dayKey, timeStr)"
            :data-day="day.dayKey"
            :data-time="timeStr"
            :disabled="props.loading"
            @click="toggleCell(day.dayKey, timeStr)"
          >
            <div
              v-if="timeStr === timeSlots[0] && props.holidays.includes(day.dateIso)"
              class="availability-grid__holiday-overlay"
            >
              <span class="availability-grid__holiday-label">휴무</span>
            </div>
          </button>
        </template>
      </div>

      <div v-if="props.loading" class="availability-grid__loading-overlay" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  weekStart: { type: String, required: true },
  offHoursRange: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  holidays: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])
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

function getCellAriaLabel(dayLabel, dayKey, timeStr) {
  return `${dayLabel} ${timeStr} ${isCellSelected(dayKey, timeStr) ? '선택됨' : '선택 안됨'}`
}
</script>

<style src="./AppAvailabilityGrid.css" scoped></style>
