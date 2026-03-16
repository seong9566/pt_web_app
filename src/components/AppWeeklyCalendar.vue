<template>
  <section class="weekly-calendar">
    <header class="weekly-calendar__header">
      <button class="weekly-calendar__nav-btn" type="button" @click="moveWeek(-7)" aria-label="이전 주">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <p class="weekly-calendar__week-label">{{ weekRangeLabel }}</p>
      <button class="weekly-calendar__nav-btn" type="button" @click="moveWeek(7)" aria-label="다음 주">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </header>

    <div class="weekly-calendar__grid-wrapper">
      <div class="weekly-calendar__grid" :style="gridStyle">
        <div class="weekly-calendar__time-header" />

        <div
          v-for="date in weekDates"
          :key="`header-${date}`"
          class="weekly-calendar__day-header"
          :class="{ 'weekly-calendar__day-header--today': isToday(date) }"
        >
          <span class="weekly-calendar__day-name">{{ getWeekdayLabel(date) }}</span>
          <span class="weekly-calendar__day-date">{{ getDayOfMonth(date) }}</span>
        </div>

        <template v-for="(time, rowIndex) in timeSlots" :key="`row-${time}`">
          <div class="weekly-calendar__time-label">{{ time }}</div>

          <div
            v-for="date in weekDates"
            :key="`cell-${date}-${time}`"
            class="weekly-calendar__cell"
            :class="{
              'weekly-calendar__cell--holiday': isHoliday(date),
              'weekly-calendar__cell--off-hours': isOffHours(time),
            }"
            @click="handleSlotTap(date, time)"
          >
            <button
              v-if="getScheduleAtSlot(date, time)"
              class="weekly-calendar__block"
              :class="getBlockClass(getScheduleAtSlot(date, time).status)"
              :style="getBlockStyle(getScheduleAtSlot(date, time))"
              type="button"
              @click.stop="handleScheduleTap(getScheduleAtSlot(date, time).id)"
            >
              <span class="weekly-calendar__block-name">{{ getScheduleName(getScheduleAtSlot(date, time)) }}</span>
              <span v-if="getBlockLabel(getScheduleAtSlot(date, time))" class="weekly-calendar__block-label">
                {{ getBlockLabel(getScheduleAtSlot(date, time)) }}
              </span>
            </button>

            <span
              v-if="rowIndex === 0 && isHoliday(date)"
              class="weekly-calendar__holiday-label"
            >휴무</span>
          </div>
        </template>
      </div>

      <p v-if="!normalizedSchedules.length" class="weekly-calendar__empty-text">이번 주 일정이 없습니다</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const CELL_HEIGHT = 56
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const STATUS_COLORS = {
  scheduled: 'var(--color-yellow)',
  confirmed: 'var(--color-green)',
  change_requested: 'var(--color-orange)',
  completed: 'var(--color-gray-400)',
  pending: 'var(--color-yellow)',
  approved: 'var(--color-green)',
}

const props = defineProps({
  schedules: { type: Array, default: () => [] },
  workSchedule: {
    type: Object,
    default: () => ({ startTime: '09:00', endTime: '22:00', slotDuration: 60 }),
  },
  holidays: { type: Array, default: () => [] },
  currentWeekStart: { type: String, required: true },
  role: { type: String, default: 'trainer' },
})

const emit = defineEmits(['slot-tap', 'schedule-tap', 'week-change'])

function pad(num) {
  return String(num).padStart(2, '0')
}

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function timeToMinutes(timeStr) {
  const [hour, minute] = String(timeStr || '00:00').split(':').map(Number)
  return (hour * 60) + minute
}

function minutesToTime(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${pad(hour)}:${pad(minute)}`
}

function addDays(dateStr, amount) {
  const date = parseDate(dateStr)
  date.setDate(date.getDate() + amount)
  return formatDate(date)
}

const todayString = formatDate(new Date())

const slotDuration = computed(() => {
  const unit = Number(props.workSchedule?.slotDuration)
  return Number.isFinite(unit) && unit > 0 ? unit : 60
})

const startMinutes = computed(() => timeToMinutes(props.workSchedule?.startTime || '09:00'))
const endMinutes = computed(() => timeToMinutes(props.workSchedule?.endTime || '22:00'))

const timeSlots = computed(() => {
  const slots = []
  for (let minute = startMinutes.value; minute < endMinutes.value; minute += slotDuration.value) {
    slots.push(minutesToTime(minute))
  }
  return slots
})

const weekDates = computed(() => {
  return Array.from({ length: 7 }, (_, index) => addDays(props.currentWeekStart, index - 1))
})

const weekRangeLabel = computed(() => {
  const start = parseDate(props.currentWeekStart)
  const end = parseDate(addDays(props.currentWeekStart, 6))
  return `${start.getMonth() + 1}/${start.getDate()}(${WEEKDAY_LABELS[start.getDay()]}) ~ ${end.getMonth() + 1}/${end.getDate()}(${WEEKDAY_LABELS[end.getDay()]})`
})

const normalizedSchedules = computed(() => {
  return props.schedules
    .map((schedule) => {
      const start = timeToMinutes(schedule.start_time)
      const end = timeToMinutes(schedule.end_time)

      return {
        ...schedule,
        startMinutes: start,
        endMinutes: end,
        duration: Math.max(slotDuration.value, end - start),
      }
    })
    .sort((a, b) => a.startMinutes - b.startMinutes)
})

const scheduleStartMap = computed(() => {
  return normalizedSchedules.value.reduce((map, schedule) => {
    const key = `${schedule.date}-${minutesToTime(schedule.startMinutes)}`
    if (!map[key]) {
      map[key] = schedule
    }
    return map
  }, {})
})

const gridStyle = computed(() => {
  return {
    '--weekly-cell-height': `${CELL_HEIGHT}px`,
    gridTemplateColumns: '44px repeat(7, minmax(52px, 1fr))',
  }
})

function isToday(dateStr) {
  return dateStr === todayString
}

function isHoliday(dateStr) {
  return props.holidays.includes(dateStr)
}

function isOffHours(time) {
  const minute = timeToMinutes(time)
  return minute < startMinutes.value || minute >= endMinutes.value
}

function getWeekdayLabel(dateStr) {
  return WEEKDAY_LABELS[parseDate(dateStr).getDay()]
}

function getDayOfMonth(dateStr) {
  return parseDate(dateStr).getDate()
}

function getScheduleAtSlot(dateStr, time) {
  return scheduleStartMap.value[`${dateStr}-${time}`] || null
}

function getScheduleName(schedule) {
  return props.role === 'trainer' ? schedule.member_name : schedule.trainer_name
}

function getBlockLabel(schedule) {
  if (schedule.status === 'scheduled' || schedule.status === 'pending') {
    return '확인 대기'
  }

  if (schedule.status === 'change_requested') {
    return '변경요청'
  }

  if (schedule.status === 'confirmed' || schedule.status === 'approved') {
    return `${schedule.start_time.slice(0, 5)}-${schedule.end_time.slice(0, 5)}`
  }

  return ''
}

function getBlockClass(status) {
  const normalizedStatus = status === 'pending'
    ? 'scheduled'
    : status === 'approved'
      ? 'confirmed'
      : status

  return `weekly-calendar__block--${normalizedStatus}`
}

function getBlockStyle(schedule) {
  const color = STATUS_COLORS[schedule.status] || 'var(--color-gray-600)'
  const ratio = schedule.duration / slotDuration.value

  return {
    backgroundColor: color,
    height: `${Math.max(CELL_HEIGHT, CELL_HEIGHT * ratio)}px`,
  }
}

function moveWeek(amount) {
  emit('week-change', { weekStart: addDays(props.currentWeekStart, amount) })
}

function handleSlotTap(dateStr, time) {
  if (isHoliday(dateStr)) {
    return
  }

  emit('slot-tap', { date: dateStr, time })
}

function handleScheduleTap(scheduleId) {
  emit('schedule-tap', { scheduleId })
}
</script>

<style src="./AppWeeklyCalendar.css" scoped></style>
