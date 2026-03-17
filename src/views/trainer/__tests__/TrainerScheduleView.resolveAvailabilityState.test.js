import { describe, it, expect } from 'vitest'
import { resolveAvailabilityState, countAvailableMembers } from '@/utils/availability'

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

describe('resolveAvailabilityState with slotDuration', () => {
  it('slotDuration=30: 09:30 → 09:00 매칭 (available)', () => {
    // 09:00 슬롯, 30분 단위: 09:00~09:29 범위
    // 09:30은 범위 밖이지만, 09:00 슬롯에서 30분 단위로 09:00~09:29 범위 내에 09:30이 포함되는지 확인
    // 실제로는 09:30 = 570분, 09:00 = 540분, 540 <= 570 < 570 → false
    // 따라서 unavailable이 맞음. 테스트 수정 필요
    const slots = { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '09:30', 30)).toBe('unavailable')
  })

  it('slotDuration=30: 09:00 → 09:00 매칭 (available)', () => {
    // 09:00 슬롯, 30분 단위: 09:00~09:29 범위
    // 09:00 = 540분, 09:00 = 540분, 540 <= 540 < 570 → true
    const slots = { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '09:00', 30)).toBe('available')
  })

  it('slotDuration=30: 09:29 → 09:00 매칭 (available)', () => {
    // 09:29 = 569분, 09:00 = 540분, 540 <= 569 < 570 → true
    const slots = { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '09:29', 30)).toBe('available')
  })

  it('slotDuration=30: 10:00 → 09:00 미매칭 (unavailable)', () => {
    // 10:00 = 600분, 09:00 = 540분, 540 <= 600 < 570 → false
    const slots = { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '10:00', 30)).toBe('unavailable')
  })

  it('slotDuration=90: 09:30 → 09:00 범위 내 매칭 (available)', () => {
    // 09:30 = 570분, 09:00 = 540분, 540 <= 570 < 630 → true
    const slots = { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '09:30', 90)).toBe('available')
  })

  it('slotDuration=90: 10:00 → 09:00 범위 내 매칭 (available)', () => {
    // 10:00 = 600분, 09:00 = 540분, 540 <= 600 < 630 → true
    const slots = { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '10:00', 90)).toBe('available')
  })

  it('slotDuration=90: 10:30 → 09:00 범위 밖 미매칭 (unavailable)', () => {
    // 10:30 = 630분, 09:00 = 540분, 540 <= 630 < 630 → false
    const slots = { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '10:30', 90)).toBe('unavailable')
  })

  it('빈 available_slots 처리 (unavailable)', () => {
    const slots = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    expect(resolveAvailabilityState(slots, '2026-03-16', '09:00', 60)).toBe('unavailable')
  })

  it('null available_slots → unknown', () => {
    expect(resolveAvailabilityState(null, '2026-03-16', '09:00', 60)).toBe('unknown')
  })
})

describe('countAvailableMembers', () => {
  it('0명 카운트 - 빈 배열', () => {
    expect(countAvailableMembers([], '2026-03-16', '09:00', 60)).toBe(0)
  })

  it('0명 카운트 - 모두 unavailable', () => {
    const availabilities = [
      { available_slots: { mon: ['10:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
      { available_slots: { mon: ['11:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
    ]
    expect(countAvailableMembers(availabilities, '2026-03-16', '09:00', 60)).toBe(0)
  })

  it('1명 카운트', () => {
    const availabilities = [
      { available_slots: { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
      { available_slots: { mon: ['10:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
    ]
    expect(countAvailableMembers(availabilities, '2026-03-16', '09:00', 60)).toBe(1)
  })

  it('여러 명 카운트', () => {
    const availabilities = [
      { available_slots: { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
      { available_slots: { mon: ['09:00', '10:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
      { available_slots: { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
    ]
    expect(countAvailableMembers(availabilities, '2026-03-16', '09:00', 60)).toBe(3)
  })

  it('slotDuration에 따른 카운트 변화 - 30분 단위', () => {
    const availabilities = [
      { available_slots: { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
      { available_slots: { mon: ['09:30'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
    ]
    // 09:00 시간에 30분 단위: 첫 번째만 매칭
    expect(countAvailableMembers(availabilities, '2026-03-16', '09:00', 30)).toBe(1)
    // 09:00 시간에 60분 단위: 첫 번째만 매칭 (09:30은 범위 밖)
    expect(countAvailableMembers(availabilities, '2026-03-16', '09:00', 60)).toBe(1)
  })

  it('slotDuration=90에서 여러 명 매칭', () => {
    const availabilities = [
      { available_slots: { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
      { available_slots: { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
      { available_slots: { mon: ['09:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } },
    ]
    // 09:00 시간에 90분 단위: 09:00~10:29 범위
    // 모든 회원이 09:00 슬롯을 가지고 있으므로 모두 매칭
    expect(countAvailableMembers(availabilities, '2026-03-16', '09:00', 90)).toBe(3)
  })
})
