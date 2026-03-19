export const DAY_KEY_BY_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function parseDate(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toMinutes(timeStr) {
  const [hour, minute] = String(timeStr || '00:00').slice(0, 5).split(':').map(Number)
  return (hour * 60) + minute
}

// 회원은 항상 "HH:00" 형식으로 가용시간 등록 → 매칭은 항상 60분 버킷 기준
// slotDuration 파라미터는 하위 호환성을 위해 유지 (실제 매칭에는 사용 안 함)
export function resolveAvailabilityState(availableSlots, dateStr, timeStr, slotDuration = 60) {
  if (!availableSlots) return 'unknown'

  const dayKey = DAY_KEY_BY_INDEX[parseDate(dateStr).getDay()]
  const daySlots = Array.isArray(availableSlots[dayKey]) ? availableSlots[dayKey] : []

  const targetMinutes = toMinutes(timeStr)

  // 회원 등록 형식이 항상 "HH:00"이므로 60분 버킷으로 매칭
  // 예: "09:30" → "09:00" 슬롯에 매칭 (09:00~09:59 범위)
  const hasMatch = daySlots.some((slot) => {
    const slotMinutes = toMinutes(slot)
    return slotMinutes <= targetMinutes && targetMinutes < (slotMinutes + 60)
  })

  return hasMatch ? 'available' : 'unavailable'
}

export function countAvailableMembers(availabilities, dateStr, timeStr, slotDuration = 60) {
  if (!Array.isArray(availabilities) || availabilities.length === 0) return 0

  return availabilities.filter((availability) => {
    return resolveAvailabilityState(availability.available_slots, dateStr, timeStr, slotDuration) === 'available'
  }).length
}

/**
 * dayKey 형식의 가용시간을 날짜 형식으로 변환
 * @param {Object|null|undefined} availableSlots - { "mon": ["09:00","10:00"], "tue": ["14:00"] } 형식
 * @param {string} weekStartDate - 주의 시작 날짜 (일요일, YYYY-MM-DD 형식)
 * @returns {Object} { "2026-03-17": ["09:00","10:00"], "2026-03-18": ["14:00"] } 형식
 */
export function dayKeySlotsToDateSlots(availableSlots, weekStartDate) {
  if (!availableSlots || typeof availableSlots !== 'object' || Object.keys(availableSlots).length === 0) {
    return {}
  }

  const weekStart = parseDate(weekStartDate)
  const result = {}

  DAY_KEY_BY_INDEX.forEach((dayKey, index) => {
    const slots = availableSlots[dayKey]
    if (Array.isArray(slots) && slots.length > 0) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + index)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      result[dateStr] = slots
    }
  })

  return result
}

/**
 * 날짜 형식의 가용시간을 dayKey 형식으로 변환 (역변환)
 * @param {Object|null|undefined} dateSlots - { "2026-03-17": ["09:00"], "2026-03-18": ["14:00"] } 형식
 * @param {string} weekStartDate - 주의 시작 날짜 (일요일, YYYY-MM-DD 형식)
 * @returns {Object} { "mon": ["09:00"], "tue": ["14:00"] } 형식
 */
export function dateSlotsToDayKeySlots(dateSlots, weekStartDate) {
  if (!dateSlots || typeof dateSlots !== 'object' || Object.keys(dateSlots).length === 0) {
    return {}
  }

  const weekStart = parseDate(weekStartDate)
  const result = {}

  DAY_KEY_BY_INDEX.forEach((dayKey) => {
    result[dayKey] = []
  })

  Object.entries(dateSlots).forEach(([dateStr, slots]) => {
    if (Array.isArray(slots) && slots.length > 0) {
      const date = parseDate(dateStr)
      const dayIndex = Math.floor((date - weekStart) / (1000 * 60 * 60 * 24))

      if (dayIndex >= 0 && dayIndex < 7) {
        const dayKey = DAY_KEY_BY_INDEX[dayIndex]
        result[dayKey] = slots
      }
    }
  })

  return result
}
