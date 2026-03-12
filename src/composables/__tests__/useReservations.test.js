import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReservations } from '@/composables/useReservations'

const mockEnv = vi.hoisted(() => {
  const authStore = {
    user: { id: 'member-1' },
    profile: { name: '테스트 사용자' },
    role: 'trainer',
  }

  const reservationsStore = {
    invalidate: vi.fn(),
    loadReservations: vi.fn(),
  }

  return {
    authStore,
    reservationsStore,
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn(),
      },
    },
  }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockEnv.authStore,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: mockEnv.supabase,
}))

vi.mock('@/stores/reservations', () => ({
  useReservationsStore: () => mockEnv.reservationsStore,
}))

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    update: vi.fn(() => builder),
    in: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return builder
}

describe('useReservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PT 잔여 횟수가 0이면 checkPtCount가 0을 반환한다', async () => {
    const query = createBuilder()

    mockEnv.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'member-1' } },
    })
    query.eq
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce({ data: [{ change_amount: 0 }], error: null })
    mockEnv.supabase.from.mockReturnValue(query)

    const { checkPtCount } = useReservations()
    const remaining = await checkPtCount('trainer-1')

    expect(remaining).toBe(0)
    expect(mockEnv.supabase.from).toHaveBeenCalledWith('pt_sessions')
  })

  it('근무시간과 기존 예약을 기반으로 슬롯 상태를 계산한다', async () => {
    const holidayQuery = createBuilder()
    const scheduleQuery = createBuilder()
    const bookedQuery = createBuilder()

    holidayQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    scheduleQuery.maybeSingle.mockResolvedValue({
      data: {
        start_time: '09:00:00',
        end_time: '12:00:00',
        slot_duration_minutes: 60,
      },
      error: null,
    })
    bookedQuery.in.mockResolvedValue({
      data: [{ start_time: '10:00:00', end_time: '11:00:00', status: 'approved' }],
      error: null,
    })

    mockEnv.supabase.from.mockImplementation((table) => {
      if (table === 'trainer_holidays') return holidayQuery
      if (table === 'work_schedules') return scheduleQuery
      if (table === 'reservations') return bookedQuery
      throw new Error(`unexpected table: ${table}`)
    })

    const { fetchAvailableSlots } = useReservations()
    const result = await fetchAvailableSlots('trainer-1', '2026-03-05')

    expect(result.am).toEqual([
      { label: '09:00', val: '09:00', status: '가능', pendingCount: 0 },
      { label: '10:00', val: '10:00', status: '마감', pendingCount: 0 },
      { label: '11:00', val: '11:00', status: '가능', pendingCount: 0 },
    ])
    expect(result.pm).toEqual([])
    expect(result.evening).toEqual([])
  })

  it('휴일이면 예약 가능한 슬롯을 비운다', async () => {
    const holidayQuery = createBuilder()
    holidayQuery.maybeSingle.mockResolvedValue({ data: { id: 'holiday-1' }, error: null })

    mockEnv.supabase.from.mockImplementation((table) => {
      if (table === 'trainer_holidays') return holidayQuery
      throw new Error(`unexpected table: ${table}`)
    })

    const { fetchAvailableSlots } = useReservations()
    const result = await fetchAvailableSlots('trainer-1', '2026-03-05')

    expect(result).toEqual({ am: [], pm: [], evening: [] })
  })

  it('pending 예약만 있는 슬롯은 대기중 상태와 pendingCount를 반환한다', async () => {
    const holidayQuery = createBuilder()
    const scheduleQuery = createBuilder()
    const bookedQuery = createBuilder()

    holidayQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    scheduleQuery.maybeSingle.mockResolvedValue({
      data: {
        start_time: '09:00:00',
        end_time: '11:00:00',
        slot_duration_minutes: 60,
      },
      error: null,
    })
    bookedQuery.in.mockResolvedValue({
      data: [
        { start_time: '09:00:00', end_time: '10:00:00', status: 'pending' },
        { start_time: '09:00:00', end_time: '10:00:00', status: 'pending' },
      ],
      error: null,
    })

    mockEnv.supabase.from.mockImplementation((table) => {
      if (table === 'trainer_holidays') return holidayQuery
      if (table === 'work_schedules') return scheduleQuery
      if (table === 'reservations') return bookedQuery
      throw new Error(`unexpected table: ${table}`)
    })

    const { fetchAvailableSlots } = useReservations()
    const result = await fetchAvailableSlots('trainer-1', '2026-03-05')

    expect(result.am[0]).toMatchObject({
      val: '09:00',
      status: '대기중',
      pendingCount: 2,
    })
    expect(result.am[1]).toMatchObject({
      val: '10:00',
      status: '가능',
      pendingCount: 0,
    })
  })

  it('createReservation이 Already requested this time slot 에러를 한국어로 변환한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Already requested this time slot' },
    })

    const { createReservation, error } = useReservations()
    const result = await createReservation('trainer-1', '2026-03-05', '09:00', 'PT')

    expect(result).toBeNull()
    expect(error.value).toBe('이미 해당 시간에 예약을 요청하셨습니다.')
  })

  it('createReservation이 Reservation time slot is already booked 에러를 한국어로 변환한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Reservation time slot is already booked' },
    })

    const { createReservation, error } = useReservations()
    const result = await createReservation('trainer-1', '2026-03-05', '09:00', 'PT')

    expect(result).toBeNull()
    expect(error.value).toBe('해당 시간은 이미 예약이 확정되었습니다. 다른 시간을 선택해주세요.')
  })

  it('updateReservationStatus 성공 시 store.invalidate()와 store.loadReservations()를 호출한다', async () => {
    const builder = createBuilder()
    builder.eq.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { updateReservationStatus } = useReservations()
    const result = await updateReservationStatus('reservation-1', 'approved')

    expect(result).toBe(true)
    expect(mockEnv.reservationsStore.invalidate).toHaveBeenCalled()
    expect(mockEnv.reservationsStore.loadReservations).toHaveBeenCalledWith('trainer', true)
  })
})
