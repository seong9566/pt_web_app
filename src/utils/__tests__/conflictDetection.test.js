import { describe, it, expect } from 'vitest'
import { detectConflicts } from '@/utils/conflictDetection'

describe('detectConflicts', () => {
  it('겹치는 시간 → 충돌 감지', () => {
    const schedules = [
      {
        id: 'cr-1',
        status: 'change_requested',
        requested_date: '2026-03-20',
        requested_start_time: '14:30',
        requested_end_time: '15:30',
      },
      {
        id: 'active-1',
        status: 'approved',
        date: '2026-03-20',
        start_time: '14:00',
        end_time: '15:00',
      },
    ]
    const conflicts = detectConflicts(schedules)
    expect(conflicts.has('cr-1')).toBe(true)
  })

  it('겹치지 않는 시간 → 빈 Set', () => {
    const schedules = [
      {
        id: 'cr-1',
        status: 'change_requested',
        requested_date: '2026-03-20',
        requested_start_time: '15:00',
        requested_end_time: '16:00',
      },
      {
        id: 'active-1',
        status: 'approved',
        date: '2026-03-20',
        start_time: '14:00',
        end_time: '15:00',
      },
    ]
    const conflicts = detectConflicts(schedules)
    expect(conflicts.size).toBe(0)
  })

  it('다른 날짜 → 충돌 없음', () => {
    const schedules = [
      {
        id: 'cr-1',
        status: 'change_requested',
        requested_date: '2026-03-21',
        requested_start_time: '14:00',
        requested_end_time: '15:00',
      },
      {
        id: 'active-1',
        status: 'approved',
        date: '2026-03-20',
        start_time: '14:00',
        end_time: '15:00',
      },
    ]
    const conflicts = detectConflicts(schedules)
    expect(conflicts.size).toBe(0)
  })

  it('self-exclusion → 자기 자신 충돌 제외', () => {
    const schedules = [
      {
        id: 'cr-1',
        status: 'change_requested',
        requested_date: '2026-03-20',
        requested_start_time: '14:00',
        requested_end_time: '15:00',
      },
    ]
    const conflicts = detectConflicts(schedules)
    expect(conflicts.size).toBe(0)
  })

  it('completed 예약 → 충돌 감지 대상 제외', () => {
    const schedules = [
      {
        id: 'cr-1',
        status: 'change_requested',
        requested_date: '2026-03-20',
        requested_start_time: '14:00',
        requested_end_time: '15:00',
      },
      {
        id: 'completed-1',
        status: 'completed',
        date: '2026-03-20',
        start_time: '14:00',
        end_time: '15:00',
      },
    ]
    const conflicts = detectConflicts(schedules)
    expect(conflicts.size).toBe(0)
  })

  it('빈 배열 입력 → 빈 Set', () => {
    const conflicts = detectConflicts([])
    expect(conflicts.size).toBe(0)
  })

  it('다수 변경요청 동시 충돌', () => {
    const schedules = [
      {
        id: 'cr-1',
        status: 'change_requested',
        requested_date: '2026-03-20',
        requested_start_time: '14:00',
        requested_end_time: '15:00',
      },
      {
        id: 'cr-2',
        status: 'change_requested',
        requested_date: '2026-03-20',
        requested_start_time: '14:30',
        requested_end_time: '15:30',
      },
      {
        id: 'active-1',
        status: 'approved',
        date: '2026-03-20',
        start_time: '14:00',
        end_time: '15:00',
      },
    ]
    const conflicts = detectConflicts(schedules)
    expect(conflicts.has('cr-1')).toBe(true)
    expect(conflicts.has('cr-2')).toBe(true)
    expect(conflicts.size).toBe(2)
  })

  it('null 입력 → 빈 Set', () => {
    const conflicts = detectConflicts(null)
    expect(conflicts.size).toBe(0)
  })

  it('requested_end_time 없으면 60분 기본값 적용', () => {
    const schedules = [
      {
        id: 'cr-1',
        status: 'change_requested',
        requested_date: '2026-03-20',
        requested_start_time: '14:00',
        requested_end_time: null,
      },
      {
        id: 'active-1',
        status: 'approved',
        date: '2026-03-20',
        start_time: '14:30',
        end_time: '15:00',
      },
    ]
    const conflicts = detectConflicts(schedules)
    expect(conflicts.has('cr-1')).toBe(true)
  })

  it('cancelled 예약 → 충돌 감지 대상 제외', () => {
    const schedules = [
      {
        id: 'cr-1',
        status: 'change_requested',
        requested_date: '2026-03-20',
        requested_start_time: '14:00',
        requested_end_time: '15:00',
      },
      {
        id: 'cancelled-1',
        status: 'cancelled',
        date: '2026-03-20',
        start_time: '14:00',
        end_time: '15:00',
      },
    ]
    const conflicts = detectConflicts(schedules)
    expect(conflicts.size).toBe(0)
  })
})
