/**
 * 변경요청 스케줄들의 충돌을 감지한다.
 * @param {Array} schedules - 해당 주의 전체 스케줄 배열
 * @returns {Set<string>} - 충돌하는 스케줄 ID들의 Set
 */
export function detectConflicts(schedules) {
  if (!Array.isArray(schedules) || schedules.length === 0) return new Set()

  const conflictIds = new Set()
  const changeRequested = schedules.filter(s =>
    s.status === 'change_requested' && s.requested_date && s.requested_start_time
  )
  const activeSchedules = schedules.filter(s =>
    !['completed', 'cancelled'].includes(s.status)
  )

  for (const cr of changeRequested) {
    const targetDate = cr.requested_date
    const targetStart = timeToMinutes(cr.requested_start_time)
    const targetEnd = cr.requested_end_time
      ? timeToMinutes(cr.requested_end_time)
      : targetStart + 60

    for (const other of activeSchedules) {
      if (other.id === cr.id) continue
      if (other.date !== targetDate) continue

      const otherStart = timeToMinutes(other.start_time)
      const otherEnd = timeToMinutes(other.end_time)

      if (targetStart < otherEnd && targetEnd > otherStart) {
        conflictIds.add(cr.id)
        break
      }
    }
  }
  return conflictIds
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + (m || 0)
}
