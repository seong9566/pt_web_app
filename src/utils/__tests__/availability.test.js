import { describe, it, expect } from 'vitest'
import { dayKeySlotsToDateSlots, dateSlotsToDayKeySlots, DAY_KEY_BY_INDEX } from '@/utils/availability'

describe('dayKeySlotsToDateSlots', () => {
  it('converts dayKey format to date format correctly', () => {
    const availableSlots = {
      mon: ['09:00', '10:00'],
      tue: ['14:00'],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    }
    const weekStartDate = '2026-03-15'

    const result = dayKeySlotsToDateSlots(availableSlots, weekStartDate)

    expect(result['2026-03-16']).toEqual(['09:00', '10:00'])
    expect(result['2026-03-17']).toEqual(['14:00'])
    expect(result['2026-03-18']).toBeUndefined()
  })

  it('excludes empty arrays from output', () => {
    const availableSlots = {
      mon: [],
      tue: ['09:00'],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    }
    const weekStartDate = '2026-03-15'

    const result = dayKeySlotsToDateSlots(availableSlots, weekStartDate)

    expect(Object.keys(result)).toEqual(['2026-03-17'])
    expect(result['2026-03-17']).toEqual(['09:00'])
  })

  it('returns empty object for null input', () => {
    const result = dayKeySlotsToDateSlots(null, '2026-03-15')
    expect(result).toEqual({})
  })

  it('returns empty object for undefined input', () => {
    const result = dayKeySlotsToDateSlots(undefined, '2026-03-15')
    expect(result).toEqual({})
  })

  it('returns empty object for empty object input', () => {
    const result = dayKeySlotsToDateSlots({}, '2026-03-15')
    expect(result).toEqual({})
  })

  it('handles all days of the week correctly', () => {
    const availableSlots = {
      sun: ['08:00'],
      mon: ['09:00'],
      tue: ['10:00'],
      wed: ['11:00'],
      thu: ['12:00'],
      fri: ['13:00'],
      sat: ['14:00'],
    }
    const weekStartDate = '2026-03-15'

    const result = dayKeySlotsToDateSlots(availableSlots, weekStartDate)

    expect(result['2026-03-15']).toEqual(['08:00'])
    expect(result['2026-03-16']).toEqual(['09:00'])
    expect(result['2026-03-17']).toEqual(['10:00'])
    expect(result['2026-03-18']).toEqual(['11:00'])
    expect(result['2026-03-19']).toEqual(['12:00'])
    expect(result['2026-03-20']).toEqual(['13:00'])
    expect(result['2026-03-21']).toEqual(['14:00'])
  })

  it('handles multiple slots per day', () => {
    const availableSlots = {
      mon: ['09:00', '10:00', '11:00'],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    }
    const weekStartDate = '2026-03-15'

    const result = dayKeySlotsToDateSlots(availableSlots, weekStartDate)

    expect(result['2026-03-16']).toEqual(['09:00', '10:00', '11:00'])
  })
})

describe('dateSlotsToDayKeySlots', () => {
  it('converts date format to dayKey format correctly', () => {
    const dateSlots = {
      '2026-03-16': ['09:00', '10:00'],
      '2026-03-17': ['14:00'],
    }
    const weekStartDate = '2026-03-15'

    const result = dateSlotsToDayKeySlots(dateSlots, weekStartDate)

    expect(result.mon).toEqual(['09:00', '10:00'])
    expect(result.tue).toEqual(['14:00'])
    expect(result.wed).toEqual([])
    expect(result.thu).toEqual([])
    expect(result.fri).toEqual([])
    expect(result.sat).toEqual([])
    expect(result.sun).toEqual([])
  })

  it('excludes empty arrays from input', () => {
    const dateSlots = {
      '2026-03-16': ['09:00'],
      '2026-03-17': [],
    }
    const weekStartDate = '2026-03-15'

    const result = dateSlotsToDayKeySlots(dateSlots, weekStartDate)

    expect(result.mon).toEqual(['09:00'])
    expect(result.tue).toEqual([])
  })

  it('returns empty object for null input', () => {
    const result = dateSlotsToDayKeySlots(null, '2026-03-15')
    expect(result).toEqual({})
  })

  it('returns empty object for undefined input', () => {
    const result = dateSlotsToDayKeySlots(undefined, '2026-03-15')
    expect(result).toEqual({})
  })

  it('returns empty object for empty object input', () => {
    const result = dateSlotsToDayKeySlots({}, '2026-03-15')
    expect(result).toEqual({})
  })

  it('handles all days of the week correctly', () => {
    const dateSlots = {
      '2026-03-15': ['08:00'],
      '2026-03-16': ['09:00'],
      '2026-03-17': ['10:00'],
      '2026-03-18': ['11:00'],
      '2026-03-19': ['12:00'],
      '2026-03-20': ['13:00'],
      '2026-03-21': ['14:00'],
    }
    const weekStartDate = '2026-03-15'

    const result = dateSlotsToDayKeySlots(dateSlots, weekStartDate)

    expect(result.sun).toEqual(['08:00'])
    expect(result.mon).toEqual(['09:00'])
    expect(result.tue).toEqual(['10:00'])
    expect(result.wed).toEqual(['11:00'])
    expect(result.thu).toEqual(['12:00'])
    expect(result.fri).toEqual(['13:00'])
    expect(result.sat).toEqual(['14:00'])
  })

  it('handles multiple slots per day', () => {
    const dateSlots = {
      '2026-03-16': ['09:00', '10:00', '11:00'],
    }
    const weekStartDate = '2026-03-15'

    const result = dateSlotsToDayKeySlots(dateSlots, weekStartDate)

    expect(result.mon).toEqual(['09:00', '10:00', '11:00'])
  })

  it('ignores dates outside the week range', () => {
    const dateSlots = {
      '2026-03-16': ['09:00'],
      '2026-03-22': ['14:00'],
    }
    const weekStartDate = '2026-03-15'

    const result = dateSlotsToDayKeySlots(dateSlots, weekStartDate)

    expect(result.mon).toEqual(['09:00'])
    expect(result.sun).toEqual([])
  })
})

describe('round-trip conversion', () => {
  it('converts dayKey → date → dayKey correctly', () => {
    const original = {
      mon: ['09:00', '10:00'],
      tue: ['14:00'],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    }
    const weekStartDate = '2026-03-15'

    const dateSlots = dayKeySlotsToDateSlots(original, weekStartDate)
    const result = dateSlotsToDayKeySlots(dateSlots, weekStartDate)

    expect(result).toEqual(original)
  })

  it('converts date → dayKey → date correctly', () => {
    const original = {
      '2026-03-15': ['08:00'],
      '2026-03-16': ['09:00'],
      '2026-03-17': ['10:00'],
    }
    const weekStartDate = '2026-03-15'

    const dayKeySlots = dateSlotsToDayKeySlots(original, weekStartDate)
    const result = dayKeySlotsToDateSlots(dayKeySlots, weekStartDate)

    expect(result).toEqual(original)
  })
})
