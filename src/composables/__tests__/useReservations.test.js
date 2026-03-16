import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReservations } from '@/composables/useReservations'

const mockEnv = vi.hoisted(() => {
  const authStore = {
    user: { id: 'trainer-1' },
    profile: { name: '테스트 트레이너' },
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
    insert: vi.fn(),
    in: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return builder
}

describe('useReservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('assignSchedule이 assign_schedule RPC를 올바른 파라미터로 호출한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValue({ data: 'new-reservation-id', error: null })

    const { assignSchedule, slotDuration } = useReservations()
    slotDuration.value = 60

    const result = await assignSchedule('member-id', '2026-03-20', '14:00')

    expect(mockEnv.supabase.rpc).toHaveBeenCalledWith('assign_schedule', {
      p_trainer_id: 'trainer-1',
      p_member_id: 'member-id',
      p_date: '2026-03-20',
      p_start_time: '14:00',
      p_end_time: '15:00',
    })
    expect(result).toBe('new-reservation-id')
  })

  it('confirmSchedule이 예약 상태를 confirmed로 변경한다', async () => {
    const builder = createBuilder()
    builder.maybeSingle.mockResolvedValueOnce({ data: { trainer_id: 'trainer-id' }, error: null })
    // eq 호출 순서:
    //   1번째: select 체인의 .eq('id', ...) → builder 반환 (maybeSingle로 이어짐)
    //   2번째: update 체인의 .eq('id', ...) → { error: null } resolve
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null })
    builder.insert.mockResolvedValueOnce({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { confirmSchedule } = useReservations()
    const result = await confirmSchedule('reservation-id')

    expect(result).toBe(true)
    expect(builder.update).toHaveBeenCalledWith({ status: 'confirmed' })
  })

  it('requestChange가 change_requested 상태와 사유를 저장한다', async () => {
    const builder = createBuilder()
    builder.maybeSingle.mockResolvedValueOnce({ data: { trainer_id: 'trainer-id' }, error: null })
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null })
    builder.insert.mockResolvedValueOnce({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { requestChange } = useReservations()
    const result = await requestChange('reservation-id', '시간이 안 됩니다')

    expect(result).toBe(true)
    expect(builder.update).toHaveBeenCalledWith({
      status: 'change_requested',
      change_reason: '시간이 안 됩니다',
    })
  })

  it('cancelSchedule이 예약을 cancelled 상태로 변경한다', async () => {
    const builder = createBuilder()
    builder.eq.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { cancelSchedule } = useReservations()
    const result = await cancelSchedule('reservation-id')

    expect(result).toBe(true)
    expect(builder.update).toHaveBeenCalledWith({ status: 'cancelled' })
  })

  it('fetchAvailableSlots가 scheduled/confirmed 상태로 예약을 조회한다', async () => {
    const overrideQuery = createBuilder()
    const scheduleQuery = createBuilder()
    const bookedQuery = createBuilder()

    // daily_schedule_overrides 두 번 호출:
    //   1번째: 휴일 여부 확인 → null (휴일 아님)
    //   2번째: 근무 오버라이드 확인 → null (오버라이드 없음)
    overrideQuery.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    scheduleQuery.maybeSingle.mockResolvedValue({
      data: { start_time: '09:00:00', end_time: '11:00:00', slot_duration_minutes: 60 },
      error: null,
    })

    bookedQuery.in.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockImplementation((table) => {
      if (table === 'daily_schedule_overrides') return overrideQuery
      if (table === 'work_schedules') return scheduleQuery
      if (table === 'reservations') return bookedQuery
      throw new Error(`unexpected table: ${table}`)
    })

    const { fetchAvailableSlots } = useReservations()
    await fetchAvailableSlots('trainer-1', '2026-03-20')

    expect(bookedQuery.in).toHaveBeenCalledWith('status', ['scheduled', 'confirmed'])
  })

  it("확정된 슬롯은 '확정됨' 라벨을 표시한다", async () => {
    const overrideQuery = createBuilder()
    const scheduleQuery = createBuilder()
    const bookedQuery = createBuilder()

    overrideQuery.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    scheduleQuery.maybeSingle.mockResolvedValue({
      data: { start_time: '09:00:00', end_time: '11:00:00', slot_duration_minutes: 60 },
      error: null,
    })

    bookedQuery.in.mockResolvedValue({
      data: [{ start_time: '09:00:00', end_time: '10:00:00', status: 'confirmed' }],
      error: null,
    })

    mockEnv.supabase.from.mockImplementation((table) => {
      if (table === 'daily_schedule_overrides') return overrideQuery
      if (table === 'work_schedules') return scheduleQuery
      if (table === 'reservations') return bookedQuery
      throw new Error(`unexpected table: ${table}`)
    })

    const { fetchAvailableSlots, slots } = useReservations()
    await fetchAvailableSlots('trainer-1', '2026-03-20')

    expect(slots.value.am[0]).toMatchObject({ val: '09:00', status: '확정됨' })
    expect(slots.value.am[1]).toMatchObject({ val: '10:00', status: '가능' })
  })

  it('assignSchedule이 RPC 에러 시 error ref를 설정한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: '해당 시간은 이미 예약이 확정되었습니다. 다른 시간을 선택해주세요.' },
    })

    const { assignSchedule, error } = useReservations()
    const result = await assignSchedule('member-id', '2026-03-20', '14:00')

    expect(result).toBeNull()
    expect(error.value).toBeTruthy()
  })
})
