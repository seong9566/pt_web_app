import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getActiveTrainerId,
  isActiveConnection,
  isActivePartner,
  getActiveMemberIds,
  getActivePartnerIds,
} from '@/composables/useConnection'

const mockEnv = vi.hoisted(() => {
  return {
    supabase: { from: vi.fn() },
  }
})

vi.mock('@/lib/supabase', () => ({ supabase: mockEnv.supabase }))

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    or: vi.fn(() => builder),
    maybeSingle: vi.fn(),
  }
  return builder
}

describe('useConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getActiveTrainerId', () => {
    it('memberId가 null이면 null을 반환하고 DB를 조회하지 않는다', async () => {
      const result = await getActiveTrainerId(null)

      expect(result).toBeNull()
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('memberId가 undefined이면 null을 반환하고 DB를 조회하지 않는다', async () => {
      const result = await getActiveTrainerId(undefined)

      expect(result).toBeNull()
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('활성 연결이 있으면 trainer_id를 반환한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({
        data: { trainer_id: 'trainer-1' },
        error: null,
      })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await getActiveTrainerId('member-1')

      expect(result).toBe('trainer-1')
      expect(mockEnv.supabase.from).toHaveBeenCalledWith('trainer_members')
      expect(builder.eq).toHaveBeenCalledWith('member_id', 'member-1')
      expect(builder.eq).toHaveBeenCalledWith('status', 'active')
    })

    it('활성 연결이 없으면 null을 반환한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({ data: null, error: null })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await getActiveTrainerId('member-1')

      expect(result).toBeNull()
    })
  })

  describe('isActiveConnection', () => {
    it('trainerId가 null이면 false를 반환하고 DB를 조회하지 않는다', async () => {
      const result = await isActiveConnection(null, 'member-1')

      expect(result).toBe(false)
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('memberId가 null이면 false를 반환하고 DB를 조회하지 않는다', async () => {
      const result = await isActiveConnection('trainer-1', null)

      expect(result).toBe(false)
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('trainerId와 memberId 둘 다 null이면 false를 반환한다', async () => {
      const result = await isActiveConnection(null, null)

      expect(result).toBe(false)
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('활성 연결이 있으면 true를 반환한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({
        data: { id: 'connection-1' },
        error: null,
      })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await isActiveConnection('trainer-1', 'member-1')

      expect(result).toBe(true)
      expect(builder.eq).toHaveBeenCalledWith('trainer_id', 'trainer-1')
      expect(builder.eq).toHaveBeenCalledWith('member_id', 'member-1')
    })

    it('활성 연결이 없으면 false를 반환한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({ data: null, error: null })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await isActiveConnection('trainer-1', 'member-1')

      expect(result).toBe(false)
    })
  })

  describe('isActivePartner', () => {
    it('userId가 null이면 false를 반환하고 DB를 조회하지 않는다', async () => {
      const result = await isActivePartner(null, 'partner-1')

      expect(result).toBe(false)
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('partnerId가 null이면 false를 반환하고 DB를 조회하지 않는다', async () => {
      const result = await isActivePartner('user-1', null)

      expect(result).toBe(false)
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('활성 파트너 관계가 있으면 true를 반환하고 or 쿼리로 양방향 검색한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({
        data: { id: 'connection-1' },
        error: null,
      })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await isActivePartner('user-1', 'partner-1')

      expect(result).toBe(true)
      expect(builder.or).toHaveBeenCalledWith(
        'and(trainer_id.eq.user-1,member_id.eq.partner-1),and(trainer_id.eq.partner-1,member_id.eq.user-1)'
      )
    })

    it('활성 파트너 관계가 없으면 false를 반환한다', async () => {
      const builder = createBuilder()
      builder.maybeSingle.mockResolvedValue({ data: null, error: null })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await isActivePartner('user-1', 'partner-1')

      expect(result).toBe(false)
    })
  })

  describe('getActiveMemberIds', () => {
    it('trainerId가 null이면 빈 배열을 반환하고 DB를 조회하지 않는다', async () => {
      const result = await getActiveMemberIds(null)

      expect(result).toEqual([])
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('활성 회원이 있으면 member_id 배열을 반환한다', async () => {
      const builder = createBuilder()
      builder.eq
        .mockReturnValueOnce(builder)
        .mockResolvedValueOnce({
          data: [{ member_id: 'm1' }, { member_id: 'm2' }],
          error: null,
        })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await getActiveMemberIds('trainer-1')

      expect(result).toEqual(['m1', 'm2'])
      expect(mockEnv.supabase.from).toHaveBeenCalledWith('trainer_members')
      expect(builder.eq).toHaveBeenCalledWith('trainer_id', 'trainer-1')
    })

    it('활성 회원이 없으면 빈 배열을 반환한다', async () => {
      const builder = createBuilder()
      builder.eq
        .mockReturnValueOnce(builder)
        .mockResolvedValueOnce({ data: [], error: null })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await getActiveMemberIds('trainer-1')

      expect(result).toEqual([])
    })

    it('DB가 null을 반환하면 빈 배열을 반환한다', async () => {
      const builder = createBuilder()
      builder.eq
        .mockReturnValueOnce(builder)
        .mockResolvedValueOnce({ data: null, error: null })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await getActiveMemberIds('trainer-1')

      expect(result).toEqual([])
    })
  })

  describe('getActivePartnerIds', () => {
    it('userId가 null이면 빈 배열을 반환하고 DB를 조회하지 않는다', async () => {
      const result = await getActivePartnerIds(null)

      expect(result).toEqual([])
      expect(mockEnv.supabase.from).not.toHaveBeenCalled()
    })

    it('userId가 trainer_id인 경우 member_id들을 파트너 ID로 반환한다', async () => {
      const builder = createBuilder()
      builder.eq.mockResolvedValueOnce({
        data: [
          { trainer_id: 'user-1', member_id: 'member-1' },
          { trainer_id: 'user-1', member_id: 'member-2' },
        ],
        error: null,
      })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await getActivePartnerIds('user-1')

      expect(result).toEqual(['member-1', 'member-2'])
    })

    it('userId가 member_id인 경우 trainer_id를 파트너 ID로 반환한다', async () => {
      const builder = createBuilder()
      builder.eq.mockResolvedValueOnce({
        data: [{ trainer_id: 'trainer-1', member_id: 'user-1' }],
        error: null,
      })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await getActivePartnerIds('user-1')

      expect(result).toEqual(['trainer-1'])
    })

    it('DB가 null을 반환하면 빈 배열을 반환한다', async () => {
      const builder = createBuilder()
      builder.eq.mockResolvedValueOnce({ data: null, error: null })
      mockEnv.supabase.from.mockReturnValue(builder)

      const result = await getActivePartnerIds('user-1')

      expect(result).toEqual([])
    })

    it('or 쿼리로 trainer_id와 member_id 양방향 검색한다', async () => {
      const builder = createBuilder()
      builder.eq.mockResolvedValueOnce({ data: [], error: null })
      mockEnv.supabase.from.mockReturnValue(builder)

      await getActivePartnerIds('user-1')

      expect(builder.or).toHaveBeenCalledWith('trainer_id.eq.user-1,member_id.eq.user-1')
    })
  })
})
