import { describe, it, expect, beforeEach } from 'vitest'
import { useScheduleOverrides } from '@/composables/useScheduleOverrides'

describe('useScheduleOverrides', () => {
  describe('isHoliday', () => {
    it('오버라이드가 없으면 false를 반환한다', () => {
      const { isHoliday } = useScheduleOverrides()
      expect(isHoliday('2026-03-15')).toBe(false)
    })

    it('is_working=false인 오버라이드가 있으면 true를 반환한다', () => {
      const { overrides, isHoliday } = useScheduleOverrides()
      overrides.value = [
        { date: '2026-03-15', is_working: false, start_time: null, end_time: null }
      ]
      expect(isHoliday('2026-03-15')).toBe(true)
    })

    it('is_working=true인 오버라이드가 있으면 false를 반환한다', () => {
      const { overrides, isHoliday } = useScheduleOverrides()
      overrides.value = [
        { date: '2026-03-15', is_working: true, start_time: '10:00', end_time: '17:00' }
      ]
      expect(isHoliday('2026-03-15')).toBe(false)
    })

    it('여러 오버라이드 중 해당 날짜만 확인한다', () => {
      const { overrides, isHoliday } = useScheduleOverrides()
      overrides.value = [
        { date: '2026-03-14', is_working: false, start_time: null, end_time: null },
        { date: '2026-03-15', is_working: true, start_time: '10:00', end_time: '17:00' },
        { date: '2026-03-16', is_working: false, start_time: null, end_time: null }
      ]
      expect(isHoliday('2026-03-14')).toBe(true)
      expect(isHoliday('2026-03-15')).toBe(false)
      expect(isHoliday('2026-03-16')).toBe(true)
    })
  })

  describe('getOverride', () => {
    it('오버라이드가 없으면 null을 반환한다', () => {
      const { getOverride } = useScheduleOverrides()
      expect(getOverride('2026-03-15')).toBeNull()
    })

    it('해당 날짜의 오버라이드 객체를 반환한다', () => {
      const { overrides, getOverride } = useScheduleOverrides()
      const override = { date: '2026-03-15', is_working: false, start_time: null, end_time: null }
      overrides.value = [override]
      expect(getOverride('2026-03-15')).toEqual(override)
    })

    it('다른 날짜의 오버라이드는 반환하지 않는다', () => {
      const { overrides, getOverride } = useScheduleOverrides()
      overrides.value = [
        { date: '2026-03-16', is_working: false, start_time: null, end_time: null }
      ]
      expect(getOverride('2026-03-15')).toBeNull()
    })

    it('여러 오버라이드 중 정확한 날짜의 객체를 반환한다', () => {
      const { overrides, getOverride } = useScheduleOverrides()
      const override1 = { date: '2026-03-14', is_working: false, start_time: null, end_time: null }
      const override2 = { date: '2026-03-15', is_working: true, start_time: '10:00', end_time: '17:00' }
      const override3 = { date: '2026-03-16', is_working: false, start_time: null, end_time: null }
      overrides.value = [override1, override2, override3]
      
      expect(getOverride('2026-03-14')).toEqual(override1)
      expect(getOverride('2026-03-15')).toEqual(override2)
      expect(getOverride('2026-03-16')).toEqual(override3)
    })

    it('is_working 값에 관계없이 날짜가 일치하면 반환한다', () => {
      const { overrides, getOverride } = useScheduleOverrides()
      const overrideWorking = { date: '2026-03-15', is_working: true, start_time: '10:00', end_time: '17:00' }
      overrides.value = [overrideWorking]
      
      const result = getOverride('2026-03-15')
      expect(result).toEqual(overrideWorking)
      expect(result.is_working).toBe(true)
    })
  })
})
