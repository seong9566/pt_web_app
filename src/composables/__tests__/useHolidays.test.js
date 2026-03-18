import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useScheduleOverrides } from '@/composables/useScheduleOverrides'

const mockLoadOverrides = vi.fn()
const mockInvalidateMonth = vi.fn()

const mockEnv = vi.hoisted(() => {
  return {
    supabase: { from: vi.fn() },
  }
})

vi.mock('@/lib/supabase', () => ({ supabase: mockEnv.supabase }))
vi.mock('@/stores/scheduleOverrides', () => ({
  useScheduleOverridesStore: () => ({
    loadOverrides: mockLoadOverrides,
    invalidateMonth: mockInvalidateMonth,
  }),
}))

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    in: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return builder
}

describe('useScheduleOverrides (via useHolidays)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchOverrides는 overrides.value에 오버라이드 배열을 저장한다', async () => {
    mockLoadOverrides.mockResolvedValue([
      { trainer_id: 'trainer-1', date: '2026-03-10', is_working: false },
      { trainer_id: 'trainer-1', date: '2026-03-15', is_working: false },
    ])

    const { fetchOverrides, overrides } = useScheduleOverrides()
    await fetchOverrides('trainer-1', '2026-03')

    expect(mockLoadOverrides).toHaveBeenCalledWith('trainer-1', '2026-03')
    expect(overrides.value).toHaveLength(2)
    expect(overrides.value[0].date).toBe('2026-03-10')
    expect(overrides.value[1].date).toBe('2026-03-15')
  })

  it('fetchOverrides에 month를 전달하면 스토어의 loadOverrides를 호출한다', async () => {
    mockLoadOverrides.mockResolvedValue([])

    const { fetchOverrides } = useScheduleOverrides()
    await fetchOverrides('trainer-1', '2026-03')

    expect(mockLoadOverrides).toHaveBeenCalledWith('trainer-1', '2026-03')
  })

  it('setOverride 성공 시 overrides.value에 오버라이드를 추가하고 정렬한다', async () => {
    const builder = createBuilder()
    builder.upsert.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { overrides, setOverride } = useScheduleOverrides()
    overrides.value = [{ trainer_id: 'trainer-1', date: '2026-03-15', is_working: false }]
    const result = await setOverride('trainer-1', '2026-03-10', false)

    expect(result).toBe(true)
    expect(overrides.value).toHaveLength(2)
    expect(overrides.value[0].date).toBe('2026-03-10')
    expect(overrides.value[1].date).toBe('2026-03-15')
  })

  it('setOverride는 이미 존재하는 날짜를 업데이트한다', async () => {
    const builder = createBuilder()
    builder.upsert.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { overrides, setOverride } = useScheduleOverrides()
    overrides.value = [{ trainer_id: 'trainer-1', date: '2026-03-10', is_working: false }]
    await setOverride('trainer-1', '2026-03-10', true)

    expect(overrides.value).toHaveLength(1)
    expect(overrides.value[0].is_working).toBe(true)
  })

  it('removeOverride 성공 시 overrides.value에서 해당 날짜를 제거한다', async () => {
    const builder = createBuilder()
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { overrides, removeOverride } = useScheduleOverrides()
    overrides.value = [
      { trainer_id: 'trainer-1', date: '2026-03-10', is_working: false },
      { trainer_id: 'trainer-1', date: '2026-03-15', is_working: false },
    ]
    const result = await removeOverride('trainer-1', '2026-03-10')

    expect(result).toBe(true)
    expect(overrides.value).toEqual([{ trainer_id: 'trainer-1', date: '2026-03-15', is_working: false }])
  })

  it('isHoliday는 is_working=false인 날짜에 true를 반환한다', () => {
    const { overrides, isHoliday } = useScheduleOverrides()
    overrides.value = [{ trainer_id: 'trainer-1', date: '2026-03-10', is_working: false }]

    expect(isHoliday('2026-03-10')).toBe(true)
    expect(isHoliday('2026-03-11')).toBe(false)
  })

  it('setOverride DB 오류 시 false를 반환하고 error를 설정하며 overrides에 추가하지 않는다', async () => {
    const builder = createBuilder()
    builder.upsert.mockResolvedValue({ error: { message: '스케줄 오버라이드 설정에 실패했습니다' } })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { overrides, setOverride, error } = useScheduleOverrides()
    overrides.value = []
    const result = await setOverride('trainer-1', '2026-03-10', false)

    expect(result).toBe(false)
    expect(error.value).toBe('스케줄 오버라이드 설정에 실패했습니다')
    expect(overrides.value).toHaveLength(0)
  })

  it('getReservationCountForDate는 pending과 approved 예약 건수를 반환한다', async () => {
    const builder = createBuilder()
    builder.in.mockResolvedValue({
      count: 3,
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { getReservationCountForDate } = useScheduleOverrides()
    const count = await getReservationCountForDate('trainer-1', '2026-03-10')

    expect(count).toBe(3)
    expect(builder.eq).toHaveBeenCalledWith('trainer_id', 'trainer-1')
    expect(builder.eq).toHaveBeenCalledWith('date', '2026-03-10')
    expect(builder.in).toHaveBeenCalledWith('status', ['pending', 'approved'])
  })

  it('getReservationCountForDate 오류 시 0을 반환한다', async () => {
    const builder = createBuilder()
    builder.in.mockResolvedValue({
      count: null,
      error: { message: 'DB error' },
    })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { getReservationCountForDate } = useScheduleOverrides()
    const count = await getReservationCountForDate('trainer-1', '2026-03-10')

    expect(count).toBe(0)
  })
})
