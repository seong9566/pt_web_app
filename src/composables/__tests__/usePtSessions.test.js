import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePtSessions } from '@/composables/usePtSessions'

const mockEnv = vi.hoisted(() => {
  const authStore = {
    user: { id: 'trainer-1' },
    profile: { name: '트레이너' },
  }

  return {
    authStore,
    supabase: {
      from: vi.fn(),
    },
  }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockEnv.authStore,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: mockEnv.supabase,
}))

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(),
    insert: vi.fn(),
  }
  return builder
}

describe('usePtSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('잔여 횟수보다 많이 차감하려고 하면 실패한다', async () => {
    const remainingQuery = createBuilder()
    remainingQuery.eq
      .mockReturnValueOnce(remainingQuery)
      .mockResolvedValueOnce({ data: [{ change_amount: 1 }], error: null })

    mockEnv.supabase.from.mockReturnValue(remainingQuery)

    const { deductSessions, error } = usePtSessions()
    const result = await deductSessions('member-1', 2)

    expect(result).toBe(false)
    expect(error.value).toBe('남은 횟수보다 많이 차감할 수 없습니다')
    expect(remainingQuery.insert).not.toHaveBeenCalled()
  })

  it('차감 횟수가 0 이하이면 실패한다', async () => {
    const { deductSessions, error } = usePtSessions()
    const result = await deductSessions('member-1', 0)

    expect(result).toBe(false)
    expect(error.value).toBe('차감 횟수는 0보다 커야 합니다')
    expect(mockEnv.supabase.from).not.toHaveBeenCalled()
  })

  it('추가 횟수가 0 이하이면 실패한다', async () => {
    const { addSessions, error } = usePtSessions()
    const result = await addSessions('member-1', 0)

    expect(result).toBe(false)
    expect(error.value).toBe('추가 횟수는 0보다 커야 합니다')
    expect(mockEnv.supabase.from).not.toHaveBeenCalled()
  })

  it('유효한 횟수 추가 시 insert 후 히스토리를 다시 조회한다', async () => {
    const insertQuery = createBuilder()
    const historyQuery = createBuilder()

    insertQuery.insert.mockResolvedValue({ error: null })
    historyQuery.order.mockResolvedValue({ data: [{ change_amount: 5 }], error: null })

    mockEnv.supabase.from
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(historyQuery)

    const { addSessions, ptHistory } = usePtSessions()
    const result = await addSessions('member-1', 5, '초기 등록')

    expect(result).toBe(true)
    expect(insertQuery.insert).toHaveBeenCalledWith({
      trainer_id: 'trainer-1',
      member_id: 'member-1',
      change_amount: 5,
      reason: '초기 등록',
    })
    expect(ptHistory.value).toEqual([{ change_amount: 5 }])
  })
})
