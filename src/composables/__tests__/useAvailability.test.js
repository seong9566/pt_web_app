import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAvailability } from '@/composables/useAvailability'

const mockEnv = vi.hoisted(() => ({
  supabase: { from: vi.fn() },
}))

vi.mock('@/lib/supabase', () => ({ supabase: mockEnv.supabase }))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { id: 'member-id' } }),
}))

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    in: vi.fn(() => builder),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  }
  return builder
}

describe('useAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitAvailability', () => {
    it('submitAvailability가 member_weekly_availability에 UPSERT한다', async () => {
      const upsertBuilder = createBuilder()
      upsertBuilder.upsert.mockResolvedValue({ error: null })

      const notifBuilder = createBuilder()
      notifBuilder.insert.mockResolvedValue({ error: null })

      mockEnv.supabase.from
        .mockReturnValueOnce(upsertBuilder)
        .mockReturnValueOnce(notifBuilder)

      const { submitAvailability } = useAvailability()
      const slots = { mon: ['morning'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
      const result = await submitAvailability('trainer-id', '2026-03-17', slots, null)

      expect(result).toBe(true)
      expect(mockEnv.supabase.from).toHaveBeenCalledWith('member_weekly_availability')
      expect(upsertBuilder.upsert).toHaveBeenCalled()
    })

    it('submitAvailability가 과거 주 등록을 차단한다', async () => {
      const { submitAvailability, error } = useAvailability()
      const pastWeek = '2020-01-06'
      const slots = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
      const result = await submitAvailability('trainer-id', pastWeek, slots, null)

      expect(result).toBe(false)
      expect(error.value).toBeTruthy()
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('submitAvailability UPSERT 오류 시 false를 반환하고 error를 설정한다', async () => {
      const upsertBuilder = createBuilder()
      upsertBuilder.upsert.mockResolvedValue({ error: { message: '가능 시간 등록 실패' } })
      mockEnv.supabase.from.mockReturnValue(upsertBuilder)

      const { submitAvailability, error } = useAvailability()
      const slots = { mon: ['morning'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
      const result = await submitAvailability('trainer-id', '2026-03-17', slots, null)

      expect(result).toBe(false)
      expect(error.value).toBeTruthy()
    })
  })

  describe('fetchMyAvailability', () => {
    it('fetchMyAvailability가 현재 회원의 가능 시간을 반환한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({
        data: {
          member_id: 'member-id',
          trainer_id: 'trainer-id',
          week_start: '2026-03-17',
          available_slots: { mon: ['morning'], tue: ['afternoon'], wed: [], thu: [], fri: [], sat: [], sun: [] },
          memo: null,
        },
        error: null,
      })
      mockEnv.supabase.from.mockReturnValue(builder)

      const { fetchMyAvailability } = useAvailability()
      const result = await fetchMyAvailability('trainer-id', '2026-03-17')

      expect(result).toBeTruthy()
      expect(result.available_slots).toBeDefined()
      expect(builder.eq).toHaveBeenCalledWith('member_id', 'member-id')
      expect(builder.eq).toHaveBeenCalledWith('trainer_id', 'trainer-id')
      expect(builder.eq).toHaveBeenCalledWith('week_start', '2026-03-17')
    })

    it('fetchMyAvailability가 미등록 시 null을 반환한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({ data: null, error: null })
      mockEnv.supabase.from.mockReturnValue(builder)

      const { fetchMyAvailability } = useAvailability()
      const result = await fetchMyAvailability('trainer-id', '2026-03-17')

      expect(result).toBeNull()
    })
  })

  describe('getSubmissionStatus', () => {
    it('getSubmissionStatus가 등록 여부를 boolean으로 반환한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({
        data: { id: 'avail-uuid-1' },
        error: null,
      })
      mockEnv.supabase.from.mockReturnValue(builder)

      const { getSubmissionStatus } = useAvailability()
      const status = await getSubmissionStatus('trainer-id', '2026-03-17')

      expect(typeof status).toBe('boolean')
      expect(status).toBe(true)
    })

    it('getSubmissionStatus가 미등록 시 false를 반환한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({ data: null, error: null })
      mockEnv.supabase.from.mockReturnValue(builder)

      const { getSubmissionStatus } = useAvailability()
      const status = await getSubmissionStatus('trainer-id', '2026-03-17')

      expect(typeof status).toBe('boolean')
      expect(status).toBe(false)
    })
  })
})
