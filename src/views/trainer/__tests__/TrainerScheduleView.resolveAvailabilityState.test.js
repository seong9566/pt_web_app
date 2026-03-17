import { describe, it, expect } from 'vitest'
import { resolveAvailabilityState } from '@/utils/availability'

describe('resolveAvailabilityState', () => {
  it('null availableSlots → unknown', () => {
    expect(resolveAvailabilityState(null, '2026-03-16', '09:00')).toBe('unknown')
  })

  it('시간 문자열 포함 → available', () => {
    // 2026-03-16은 월요일
    const slots = { mon: ['09:00', '10:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '09:00')).toBe('available')
  })

  it('시간 문자열 미포함 → unavailable', () => {
    const slots = { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '07:00')).toBe('unavailable')
  })

  it('빈 배열 요일 → unavailable', () => {
    // 2026-03-17은 화요일
    const slots = { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-17', '09:00')).toBe('unavailable')
  })

  it('레거시 morning 값은 시간 문자열과 불일치 → unavailable', () => {
    // 수정 전 버그: getDayPeriod('09:00') = 'morning' → slots에 'morning' 있으면 available
    // 수정 후: '09:00' 직접 비교 → 'morning'은 불일치
    const slots = { mon: ['morning'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '09:00')).toBe('unavailable')
  })

  it('여러 시간 슬롯 중 일부 포함 → available', () => {
    const slots = { mon: ['06:00', '07:00', '08:00', '09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '08:00')).toBe('available')
  })

  it('undefined availableSlots → unknown', () => {
    expect(resolveAvailabilityState(undefined, '2026-03-16', '09:00')).toBe('unknown')
  })

  it('요일별 다른 슬롯 확인 - 수요일', () => {
    // 2026-03-18은 수요일
    const slots = { mon: ['09:00'], tue: [], wed: ['14:00', '15:00'], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-18', '14:00')).toBe('available')
    expect(resolveAvailabilityState(slots, '2026-03-18', '09:00')).toBe('unavailable')
  })
})
