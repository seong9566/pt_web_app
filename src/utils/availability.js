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
