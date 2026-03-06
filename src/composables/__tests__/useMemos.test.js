import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMemos } from '@/composables/useMemos'

const mockEnv = vi.hoisted(() => {
  const authStore = { user: { id: 'trainer-1' } }
  return {
    authStore,
    supabase: { from: vi.fn() },
  }
})

vi.mock('@/stores/auth', () => ({ useAuthStore: () => mockEnv.authStore }))
vi.mock('@/lib/supabase', () => ({ supabase: mockEnv.supabase }))

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

describe('useMemos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchMemos는 trainer_id와 member_id로 필터링하여 메모 목록을 조회한다', async () => {
    const builder = createBuilder()
    builder.order.mockResolvedValue({
      data: [{ id: 'm1', content: '내용', tags: ['태그'], created_at: '2026-03-01T10:00:00Z' }],
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchMemos, memos } = useMemos()
    await fetchMemos('member-1')

    expect(builder.eq).toHaveBeenCalledWith('trainer_id', 'trainer-1')
    expect(builder.eq).toHaveBeenCalledWith('member_id', 'member-1')
    expect(memos.value[0].id).toBe('m1')
    expect(memos.value[0].content).toBe('내용')
    expect(memos.value[0].tags).toEqual(['태그'])
    expect(memos.value[0].dotColor).toBe('blue')
  })

  it('createMemo는 insert를 호출하고 성공 시 true를 반환한다', async () => {
    const builder = createBuilder()
    builder.insert.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { createMemo } = useMemos()
    const result = await createMemo('member-1', '메모 내용', ['태그'])

    expect(result).toBe(true)
    expect(builder.insert).toHaveBeenCalledWith({
      trainer_id: 'trainer-1',
      member_id: 'member-1',
      content: '메모 내용',
      tags: ['태그'],
    })
  })

  it('createMemo DB 오류 시 false를 반환하고 error를 설정한다', async () => {
    const builder = createBuilder()
    builder.insert.mockResolvedValue({ error: { message: '저장 실패' } })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { createMemo, error } = useMemos()
    const result = await createMemo('member-1', '메모 내용', [])

    expect(result).toBe(false)
    expect(error.value).toBe('저장 실패')
  })

  it('deleteMemo 성공 시 로컬 memos 배열에서 해당 id를 제거한다', async () => {
    const builder = createBuilder()
    builder.eq.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { memos, deleteMemo } = useMemos()
    memos.value = [{ id: 'm1' }, { id: 'm2' }]
    await deleteMemo('m1')

    expect(memos.value).toHaveLength(1)
    expect(memos.value[0].id).toBe('m2')
  })

  it('getMemberMemos는 member_id만으로 필터링하여 조회한다', async () => {
    mockEnv.authStore.user.id = 'member-user-1'
    const builder = createBuilder()
    builder.order.mockResolvedValue({ data: [], error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { getMemberMemos } = useMemos()
    await getMemberMemos()

    expect(builder.eq).toHaveBeenCalledWith('member_id', 'member-user-1')
    expect(builder.eq).toHaveBeenCalledTimes(1)
  })
})
