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
      requested_date: null,
      requested_start_time: null,
      requested_end_time: null,
    })
  })

  it('cancelSchedule이 예약을 cancelled 상태로 변경한다', async () => {
    const builder = createBuilder()
    // 1. select('trainer_id, member_id').eq().maybeSingle() → reservation 반환
    builder.maybeSingle.mockResolvedValueOnce({
      data: { trainer_id: 'trainer-1', member_id: 'member-1' },
      error: null,
    })
    // 2. update().eq() → 성공
    builder.eq
      .mockReturnValueOnce(builder)   // select 체인의 .eq
      .mockResolvedValueOnce({ error: null })  // update 체인의 .eq
    // 3. insert() → 알림 성공
    builder.insert.mockResolvedValueOnce({ error: null })
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

    expect(bookedQuery.in).toHaveBeenCalledWith('status', ['scheduled'])
  })

  it("배정된 슬롯은 '배정됨' 라벨을 표시한다", async () => {
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

    expect(slots.value.am[0]).toMatchObject({ val: '09:00', status: '배정됨' })
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

  it('cancelSchedule이 트레이너 취소 시 회원에게 reservation_cancelled 알림을 생성한다', async () => {
    const builder = createBuilder()
    builder.maybeSingle.mockResolvedValueOnce({
      data: { trainer_id: 'trainer-1', member_id: 'member-1' },
      error: null,
    })
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null })
    builder.insert.mockResolvedValueOnce({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { cancelSchedule } = useReservations()
    await cancelSchedule('reservation-id')

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'member-1',
        type: 'reservation_cancelled',
        title: '일정 취소',
        body: '트레이너가 PT 일정을 취소했습니다.',
      })
    )
  })

  it('cancelSchedule이 회원 취소 시 트레이너에게 reservation_cancelled 알림을 생성한다', async () => {
    mockEnv.authStore.user = { id: 'member-1' }

    const builder = createBuilder()
    builder.maybeSingle.mockResolvedValueOnce({
      data: { trainer_id: 'trainer-1', member_id: 'member-1' },
      error: null,
    })
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null })
    builder.insert.mockResolvedValueOnce({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { cancelSchedule } = useReservations()
    await cancelSchedule('reservation-id')

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'trainer-1',
        type: 'reservation_cancelled',
        title: '일정 취소',
        body: '회원이 PT 일정을 취소했습니다.',
      })
    )

    mockEnv.authStore.user = { id: 'trainer-1' }
  })

  it('reassignSchedule이 reassign_schedule RPC를 올바른 파라미터로 호출한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValueOnce({ data: 'new-id', error: null })

    const { reassignSchedule } = useReservations()
    const result = await reassignSchedule('reservation-id', '2026-03-25', '10:00')

    expect(mockEnv.supabase.rpc).toHaveBeenCalledWith('reassign_schedule', {
      p_reservation_id: 'reservation-id',
      p_new_date: '2026-03-25',
      p_new_start_time: '10:00',
    })
    expect(result).toBe(true)
  })

  it('reassignSchedule 성공 시 스토어를 갱신한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValueOnce({ data: 'new-id', error: null })

    const { reassignSchedule } = useReservations()
    await reassignSchedule('reservation-id', '2026-03-25', '10:00')

    expect(mockEnv.reservationsStore.invalidate).toHaveBeenCalled()
    expect(mockEnv.reservationsStore.loadReservations).toHaveBeenCalled()
  })

  it('reassignSchedule 충돌 시 error를 한글로 설정하고 false를 반환한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Time slot conflict: another session exists at this time' },
    })

    const { reassignSchedule, error } = useReservations()
    const result = await reassignSchedule('reservation-id', '2026-03-25', '10:00')

    expect(result).toBe(false)
    expect(error.value).toBe('해당 시간에 이미 다른 일정이 있습니다.')
  })

  describe('approveChangeRequest', () => {
    it('approveChangeRequest가 approve_change_request RPC를 올바른 파라미터로 호출한다', async () => {
      mockEnv.supabase.rpc.mockResolvedValueOnce({ data: 'new-id', error: null })

      const { approveChangeRequest } = useReservations()
      const result = await approveChangeRequest('reservation-id')

      expect(mockEnv.supabase.rpc).toHaveBeenCalledWith('approve_change_request', {
        p_reservation_id: 'reservation-id',
      })
      expect(result).toBe(true)
    })

    it('approveChangeRequest 성공 시 스토어를 갱신한다', async () => {
      mockEnv.supabase.rpc.mockResolvedValueOnce({ data: 'new-id', error: null })

      const { approveChangeRequest } = useReservations()
      await approveChangeRequest('reservation-id')

      expect(mockEnv.reservationsStore.invalidate).toHaveBeenCalled()
      expect(mockEnv.reservationsStore.loadReservations).toHaveBeenCalled()
    })

    it('approveChangeRequest 성공 시 true 반환 및 loading이 false', async () => {
      mockEnv.supabase.rpc.mockResolvedValueOnce({ data: 'new-id', error: null })

      const { approveChangeRequest, loading } = useReservations()
      const result = await approveChangeRequest('reservation-id')

      expect(result).toBe(true)
      expect(loading.value).toBe(false)
    })

    it('approveChangeRequest 충돌 시 error를 한글로 설정하고 false를 반환한다', async () => {
      mockEnv.supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Time slot conflict: another session exists at this time' },
      })

      const { approveChangeRequest, error } = useReservations()
      const result = await approveChangeRequest('reservation-id')

      expect(result).toBe(false)
      expect(error.value).toBe('해당 시간에 이미 다른 일정이 있습니다.')
    })

    it('approveChangeRequest 연결 비활성 시 error를 한글로 설정한다', async () => {
      mockEnv.supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'No active trainer-member connection' },
      })

      const { approveChangeRequest, error } = useReservations()
      const result = await approveChangeRequest('reservation-id')

      expect(result).toBe(false)
      expect(error.value).toBe('트레이너와의 연결이 활성화되지 않았습니다.')
    })
  })
})
