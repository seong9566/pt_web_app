import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHolidays } from '@/composables/useHolidays'

const mockEnv = vi.hoisted(() => {
  const authStore = { user: { id: 'trainer-1' } }
  const reservationsStore = {
    invalidate: vi.fn(),
  }
  return {
    authStore,
    reservationsStore,
    supabase: { from: vi.fn() },
  }
})

vi.mock('@/stores/auth', () => ({ useAuthStore: () => mockEnv.authStore }))
vi.mock('@/lib/supabase', () => ({ supabase: mockEnv.supabase }))
vi.mock('@/stores/reservations', () => ({
  useReservationsStore: () => mockEnv.reservationsStore,
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

describe('useHolidays', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchHolidays는 holidays.value에 날짜 문자열 배열을 저장한다', async () => {
    const builder = createBuilder()
    builder.order.mockResolvedValue({
      data: [{ date: '2026-03-10' }, { date: '2026-03-15' }],
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchHolidays, holidays } = useHolidays()
    await fetchHolidays('trainer-1')

    expect(holidays.value).toEqual(['2026-03-10', '2026-03-15'])
  })

  it('fetchHolidays에 month를 전달하면 gte와 lte 필터를 적용한다', async () => {
    const builder = createBuilder()
    builder.lte.mockResolvedValue({ data: [], error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchHolidays } = useHolidays()
    await fetchHolidays('trainer-1', '2026-03')

    expect(builder.gte).toHaveBeenCalledWith('date', '2026-03-01')
    expect(builder.lte).toHaveBeenCalledWith('date', '2026-03-31')
  })

  it('setHoliday 성공 시 holidays.value에 날짜를 추가하고 정렬한다', async () => {
    const builder = createBuilder()
    builder.insert.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { holidays, setHoliday } = useHolidays()
    holidays.value = ['2026-03-15']
    const result = await setHoliday('2026-03-10')

    expect(result).toBe(true)
    expect(holidays.value).toEqual(['2026-03-10', '2026-03-15'])
  })

  it('setHoliday는 이미 존재하는 날짜를 중복 추가하지 않는다', async () => {
    const builder = createBuilder()
    builder.insert.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { holidays, setHoliday } = useHolidays()
    holidays.value = ['2026-03-10']
    await setHoliday('2026-03-10')

    expect(holidays.value).toHaveLength(1)
    expect(holidays.value).toEqual(['2026-03-10'])
  })

  it('removeHoliday 성공 시 holidays.value에서 해당 날짜를 제거한다', async () => {
    const builder = createBuilder()
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { holidays, removeHoliday } = useHolidays()
    holidays.value = ['2026-03-10', '2026-03-15']
    const result = await removeHoliday('2026-03-10')

    expect(result).toBe(true)
    expect(holidays.value).toEqual(['2026-03-15'])
  })

  it('isHoliday는 holidays.value에 포함된 날짜에 true를 반환한다', () => {
    const { holidays, isHoliday } = useHolidays()
    holidays.value = ['2026-03-10']

    expect(isHoliday('2026-03-10')).toBe(true)
    expect(isHoliday('2026-03-11')).toBe(false)
  })

  it('setHoliday DB 오류 시 false를 반환하고 error를 설정하며 holidays에 추가하지 않는다', async () => {
    const builder = createBuilder()
    builder.insert.mockResolvedValue({ error: { message: '휴무일 설정에 실패했습니다' } })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { holidays, setHoliday, error } = useHolidays()
    holidays.value = []
    const result = await setHoliday('2026-03-10')

    expect(result).toBe(false)
    expect(error.value).toBe('휴무일 설정에 실패했습니다')
    expect(holidays.value).toHaveLength(0)
  })

  it('setHoliday 성공 시 useReservationsStore().invalidate()를 호출한다', async () => {
    const builder = createBuilder()
    builder.insert.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { setHoliday } = useHolidays()
    await setHoliday('2026-03-10')

    expect(mockEnv.reservationsStore.invalidate).toHaveBeenCalled()
  })

  it('getReservationCountForDate는 pending과 approved 예약 건수를 반환한다', async () => {
    const builder = createBuilder()
    builder.in.mockResolvedValue({
      count: 3,
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { getReservationCountForDate } = useHolidays()
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

    const { getReservationCountForDate } = useHolidays()
    const count = await getReservationCountForDate('trainer-1', '2026-03-10')

    expect(count).toBe(0)
  })
})
