export const DAY_KEY_BY_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function parseDate(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toMinutes(timeStr) {
  const [hour, minute] = String(timeStr || '00:00').slice(0, 5).split(':').map(Number)
  return (hour * 60) + minute
}

export function resolveAvailabilityState(availableSlots, dateStr, timeStr, slotDuration = 60) {
  if (!availableSlots) return 'unknown'

  const dayKey = DAY_KEY_BY_INDEX[parseDate(dateStr).getDay()]
  const daySlots = Array.isArray(availableSlots[dayKey]) ? availableSlots[dayKey] : []

  const targetMinutes = toMinutes(timeStr)
  const duration = Number(slotDuration) > 0 ? Number(slotDuration) : 60

  const hasMatch = daySlots.some((slot) => {
    const slotMinutes = toMinutes(slot)
    return slotMinutes <= targetMinutes && targetMinutes < (slotMinutes + duration)
  })

  return hasMatch ? 'available' : 'unavailable'
}

export function countAvailableMembers(availabilities, dateStr, timeStr, slotDuration = 60) {
  if (!Array.isArray(availabilities) || availabilities.length === 0) return 0

  return availabilities.filter((availability) => {
    return resolveAvailabilityState(availability.available_slots, dateStr, timeStr, slotDuration) === 'available'
  }).length
}
