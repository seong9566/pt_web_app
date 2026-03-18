<template>
  <section class="weekly-calendar" :aria-busy="loading">
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

    <div
      class="weekly-calendar__grid-wrapper"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="cancelDrag"
    >
      <div class="weekly-calendar__grid" :style="gridStyle">
        <div class="weekly-calendar__time-header" />

        <div
          v-for="date in weekDates"
          :key="`header-${date}`"
          class="weekly-calendar__day-header"
          :class="{
            'weekly-calendar__day-header--today': isToday(date),
            'weekly-calendar__day-header--holiday': isHoliday(date)
          }"
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
              'weekly-calendar__cell--available': props.role === 'trainer' && !getScheduleAtSlot(date, time) && hasAvailableMember(date, time),
              'weekly-calendar__cell--drop-target': dropTarget?.date === date && dropTarget?.time === time,
            }"
            :data-date="date"
            :data-time="time"
            @click="handleSlotTap(date, time)"
          >
            <button
              v-if="getScheduleAtSlot(date, time)"
              class="weekly-calendar__block"
              :class="[
                getBlockClass(getScheduleAtSlot(date, time)),
                { 'weekly-calendar__block--dragging': dndState === 'dragging' && dragSchedule?.id === getScheduleAtSlot(date, time).id },
              ]"
              :style="getBlockStyle(getScheduleAtSlot(date, time))"
              type="button"
              @pointerdown="handlePointerDown($event, getScheduleAtSlot(date, time))"
              @click.stop="handleScheduleTap(getScheduleAtSlot(date, time).id)"
            >
              <span class="weekly-calendar__block-name">{{ getScheduleName(getScheduleAtSlot(date, time)) }}</span>
              <span v-if="getBlockLabel(getScheduleAtSlot(date, time))" class="weekly-calendar__block-label">
                {{ getBlockLabel(getScheduleAtSlot(date, time)) }}
              </span>
              <span
                v-if="getScheduleAtSlot(date, time).status === 'change_requested' && getScheduleAtSlot(date, time).requested_start_time && getBlockRatio(getScheduleAtSlot(date, time)) >= 1"
                class="weekly-calendar__block-sublabel"
              >{{ getChangeRequestLabel(getScheduleAtSlot(date, time)) }}</span>
            </button>

            <div
              v-if="rowIndex === 0 && isHoliday(date)"
              class="weekly-calendar__holiday-overlay"
            >
              <span class="weekly-calendar__holiday-label">휴무</span>
            </div>

            <div
              v-if="props.role === 'trainer' && !getScheduleAtSlot(date, time) && getAvailableCount(date, time) > 0"
              class="weekly-calendar__preference-badge"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              {{ getAvailableCount(date, time) >= 9 ? '9+' : getAvailableCount(date, time) }}명
            </div>
          </div>
        </template>
      </div>

      <p v-if="!loading && !normalizedSchedules.length" class="weekly-calendar__empty-text">이번 주 일정이 없습니다</p>

      <div v-if="loading" class="weekly-calendar__loading-overlay" aria-hidden="true">
        <div class="weekly-calendar__loading-pulse" />
      </div>

      <div
        v-if="dndState === 'dragging'"
        class="weekly-calendar__ghost"
        :style="ghostStyle"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { countAvailableMembers, DAY_KEY_BY_INDEX } from '@/utils/availability'

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
  availabilities: { type: Array, default: () => [] },
  slotDuration: { type: Number, default: 60 },
  draggable: { type: Boolean, default: false },
  memberColors: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['slot-tap', 'schedule-tap', 'week-change', 'schedule-drop'])

const dndState = ref('idle')
const pressTimer = ref(null)
const dragSchedule = ref(null)
const ghostStyle = ref({})
const dropTarget = ref(null)
const pressStartPos = ref({ x: 0, y: 0 })
const justDropped = ref(false)

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

const effectiveSlotDuration = computed(() => {
  const unit = Number(props.slotDuration)
  return Number.isFinite(unit) && unit > 0 ? unit : 60
})

const startMinutes = computed(() => timeToMinutes(props.workSchedule?.startTime || '09:00'))
const endMinutes = computed(() => timeToMinutes(props.workSchedule?.endTime || '22:00'))

const timeSlots = computed(() => {
  const slots = []
  for (let minute = startMinutes.value; minute < endMinutes.value; minute += effectiveSlotDuration.value) {
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
        duration: Math.max(effectiveSlotDuration.value, end - start),
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
  return props.role === 'trainer' ? schedule.member_name : schedule.session_type
}

function getBlockLabel(schedule) {
  if (schedule.status === 'change_requested') {
    return '변경요청'
  }

  return schedule.category || ''
}

function getBlockRatio(schedule) {
  return schedule.duration / effectiveSlotDuration.value
}

function getChangeRequestLabel(schedule) {
  const time = schedule.requested_start_time?.slice(0, 5)
  if (!time) return ''
  if (schedule.requested_date && schedule.requested_date !== schedule.date) {
    const [, month, day] = schedule.requested_date.split('-')
    return `→${parseInt(month)}/${parseInt(day)} ${time}`
  }
  return `→${time}`
}

function hasMemberColor(schedule) {
  return props.role === 'trainer' && schedule?.member_id && props.memberColors[schedule.member_id]
}

function getStatusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.scheduled
}

function getBlockClass(schedule) {
  if (!schedule) {
    return ''
  }

  if (hasMemberColor(schedule)) {
    return schedule.status === 'completed' ? 'weekly-calendar__block--completed-member' : ''
  }

  const normalizedStatus = (schedule.status === 'pending' || schedule.status === 'approved' || schedule.status === 'confirmed')
    ? 'scheduled'
    : schedule.status

  return `weekly-calendar__block--${normalizedStatus}`
}

function getBlockStyle(schedule) {
  const ratio = schedule.duration / effectiveSlotDuration.value
  const style = {
    height: `${Math.max(CELL_HEIGHT, CELL_HEIGHT * ratio)}px`,
  }

  if (hasMemberColor(schedule)) {
    style.backgroundColor = props.memberColors[schedule.member_id]
    if (schedule.status === 'completed') {
      style.opacity = '0.5'
    }
    return style
  }

  style.backgroundColor = getStatusColor(schedule.status)
  return style
}

function getAvailableCount(date, time) {
  if (!props.availabilities || props.availabilities.length === 0) return 0
  return countAvailableMembers(props.availabilities, date, time, props.slotDuration)
}

function hasAvailableMember(date, time) {
  const dayKey = DAY_KEY_BY_INDEX[parseDate(date).getDay()]
  if (!dayKey) return false
  return getAvailableCount(date, time) > 0
}

function moveWeek(amount) {
  emit('week-change', { weekStart: addDays(props.currentWeekStart, amount) })
}

function handleSlotTap(dateStr, time) {
  if (dndState.value !== 'idle') {
    return
  }

  if (isHoliday(dateStr)) {
    return
  }

  emit('slot-tap', { date: dateStr, time })
}

function handleScheduleTap(scheduleId) {
  if (dndState.value !== 'idle' || justDropped.value) {
    justDropped.value = false
    return
  }

  emit('schedule-tap', { scheduleId })
}

function handlePointerDown(event, schedule) {
  if (!props.draggable || !schedule) {
    return
  }

  if (schedule.status === 'completed' || schedule.status === 'cancelled') {
    return
  }

  justDropped.value = false
  clearTimeout(pressTimer.value)

  event.currentTarget.setPointerCapture(event.pointerId)
  pressStartPos.value = { x: event.clientX, y: event.clientY }
  dndState.value = 'pressing'
  dragSchedule.value = schedule

  pressTimer.value = setTimeout(() => {
    if (dndState.value === 'pressing') {
      dndState.value = 'dragging'
      updateGhostPosition(pressStartPos.value.x, pressStartPos.value.y)
    }
  }, 300)
}

function handlePointerMove(event) {
  if (dndState.value === 'idle') {
    return
  }

  event.preventDefault()

  if (dndState.value === 'pressing') {
    const dx = Math.abs(event.clientX - pressStartPos.value.x)
    const dy = Math.abs(event.clientY - pressStartPos.value.y)

    if (dx > 5 || dy > 5) {
      cancelDrag()
    }
    return
  }

  if (dndState.value !== 'dragging') {
    return
  }

  updateGhostPosition(event.clientX, event.clientY)
  updateDropTarget(event.clientX, event.clientY)
}

function updateGhostPosition(x, y) {
  const ghostColor = dragSchedule.value
    ? (hasMemberColor(dragSchedule.value)
      ? props.memberColors[dragSchedule.value.member_id]
      : getStatusColor(dragSchedule.value.status))
    : 'var(--color-blue-primary)'

  ghostStyle.value = {
    position: 'fixed',
    left: `${x - 26}px`,
    top: `${y - (CELL_HEIGHT / 2)}px`,
    width: '52px',
    height: `${CELL_HEIGHT}px`,
    zIndex: 100,
    pointerEvents: 'none',
    opacity: 0.8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    backgroundColor: ghostColor,
    borderRadius: '0',
  }
}

function updateDropTarget(x, y) {
  const el = document.elementFromPoint(x, y)
  const cellEl = el?.closest('[data-date][data-time]')

  if (!cellEl) {
    dropTarget.value = null
    return
  }

  const date = cellEl.dataset.date
  const time = cellEl.dataset.time

  if (!date || !time) {
    dropTarget.value = null
    return
  }

  if (isHoliday(date) || isOffHours(time)) {
    dropTarget.value = null
    return
  }

  if (getScheduleAtSlot(date, time)) {
    dropTarget.value = null
    return
  }

  const fromTime = dragSchedule.value?.start_time?.slice(0, 5)
  if (dragSchedule.value && date === dragSchedule.value.date && time === fromTime) {
    dropTarget.value = null
    return
  }

  dropTarget.value = { date, time }
}

function handlePointerUp() {
  clearTimeout(pressTimer.value)

  if (dndState.value === 'dragging' && dropTarget.value && dragSchedule.value) {
    emit('schedule-drop', {
      scheduleId: dragSchedule.value.id,
      fromDate: dragSchedule.value.date,
      fromTime: dragSchedule.value.start_time?.slice(0, 5),
      toDate: dropTarget.value.date,
      toTime: dropTarget.value.time,
    })
    justDropped.value = true
  }

  resetDrag()
}

function cancelDrag() {
  clearTimeout(pressTimer.value)
  resetDrag()
}

function resetDrag() {
  dndState.value = 'idle'
  dragSchedule.value = null
  ghostStyle.value = {}
  dropTarget.value = null
  pressTimer.value = null
}
</script>

<style src="./AppWeeklyCalendar.css" scoped></style>
