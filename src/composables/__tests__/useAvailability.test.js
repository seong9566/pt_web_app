import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
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
    setActivePinia(createPinia())
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

  describe('fetchMemberAvailabilities', () => {
    it('fetchMemberAvailabilities가 trainer_members 테이블을 쿼리한다', async () => {
      const membersBuilder = createBuilder()
      const availBuilder = createBuilder()

      membersBuilder.select.mockReturnValue(membersBuilder)
      membersBuilder.eq.mockReturnValue(membersBuilder)
      membersBuilder.single.mockResolvedValue({
        data: [
          {
            member_id: 'member-a',
            profiles: { name: '회원A', photo_url: null },
          },
        ],
        error: null,
      })

      availBuilder.select.mockReturnValue(availBuilder)
      availBuilder.in.mockReturnValue(availBuilder)
      availBuilder.eq.mockReturnValue(availBuilder)
      availBuilder.single.mockResolvedValue({
        data: [
          {
            member_id: 'member-a',
            available_slots: { mon: ['morning'] },
            memo: null,
            created_at: '2026-03-10T10:00:00Z',
          },
        ],
        error: null,
      })

      mockEnv.supabase.from
        .mockReturnValueOnce(membersBuilder)
        .mockReturnValueOnce(availBuilder)

      const { fetchMemberAvailabilities } = useAvailability()
      await fetchMemberAvailabilities('2026-03-09')

      expect(mockEnv.supabase.from).toHaveBeenCalledWith('trainer_members')
    })

    it('fetchMemberAvailabilities가 빈 배열을 반환할 수 있다', async () => {
      const membersBuilder = createBuilder()
      const availBuilder = createBuilder()

      membersBuilder.select.mockReturnValue(membersBuilder)
      membersBuilder.eq.mockReturnValue(membersBuilder)
      membersBuilder.single.mockResolvedValue({
        data: [],
        error: null,
      })

      mockEnv.supabase.from.mockReturnValueOnce(membersBuilder)

      const { fetchMemberAvailabilities } = useAvailability()
      const result = await fetchMemberAvailabilities('2026-03-09')

      expect(result).toEqual([])
    })
  })

  describe('에러 처리', () => {
    it('submitAvailability가 과거 주 제출을 차단하고 error를 설정한다', async () => {
      const { submitAvailability, error } = useAvailability()
      const pastWeek = '2020-01-06'
      const slots = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
      const result = await submitAvailability('trainer-id', pastWeek, slots, null)

      expect(result).toBe(false)
      expect(error.value).toBeTruthy()
    })
  })

  describe('loading 상태', () => {
    it('비동기 작업 중 loading이 true이다', async () => {
      const builder = createBuilder()
      let resolveQuery
      const queryPromise = new Promise((resolve) => {
        resolveQuery = resolve
      })
      builder.eq
        .mockReturnValueOnce(builder)
        .mockReturnValueOnce(builder)
        .mockReturnValueOnce(builder)
        .mockReturnValue(queryPromise)

      mockEnv.supabase.from.mockReturnValueOnce(builder)

      const { getSubmissionStatus, loading } = useAvailability()
      const promise = getSubmissionStatus('trainer-id', '2026-03-09')

      expect(loading.value).toBe(true)

      resolveQuery({ data: null, error: null })
      await promise

      expect(loading.value).toBe(false)
    })
  })
})
