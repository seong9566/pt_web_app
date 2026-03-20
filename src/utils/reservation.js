/** 예약의 종료 시간이 현재 시간을 지났는지 판단 (프론트 전용) */
export function isSessionPast(item) {
  if (!item?.date || !item?.end_time) return false
  const endDateTime = new Date(`${item.date}T${item.end_time}`)
  return endDateTime < new Date()
}
