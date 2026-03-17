import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMembersStore } from '@/stores/members'
import { MEMBER_COLORS } from '@/utils/colors'

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
    update: vi.fn(() => builder),
    in: vi.fn(() => builder),
  }
  return builder
}

function makeRow(memberId, color, index) {
  return {
    member_id: memberId,
    connected_at: '2026-01-01T00:00:00Z',
    status: 'active',
    color,
    profiles: { id: memberId, name: `회원${index + 1}`, photo_url: null, role: 'member' },
  }
}

function setupLoadMocks(rows) {
  const membersBuilder = createBuilder()
  const ptBuilder = createBuilder()

  membersBuilder.eq
    .mockReturnValueOnce(membersBuilder)
    .mockResolvedValueOnce({ data: rows, error: null })

  ptBuilder.in.mockResolvedValue({ data: [], error: null })

  // Setup for batch update calls (fire-and-forget)
  const updateBuilders = rows
    .filter(r => !r.color)
    .map(() => {
      const builder = createBuilder()
      builder.eq
        .mockReturnValueOnce(builder)
        .mockResolvedValueOnce({ error: null })
      return builder
    })

  mockEnv.supabase.from
    .mockReturnValueOnce(membersBuilder)
    .mockReturnValueOnce(ptBuilder)
    .mockImplementation(() => {
      if (updateBuilders.length > 0) {
        return updateBuilders.shift()
      }
      return createBuilder()
    })
}

describe('useMembersStore — 색상 로직', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('color가 null인 member에 getAutoColor(index) 값이 배정됨', async () => {
    setupLoadMocks([makeRow('m1', null, 0)])

    const store = useMembersStore()
    await store.loadMembers(true)

    expect(store.members[0].color).toBe(MEMBER_COLORS[0])
  })

  it('color가 이미 있는 member는 기존 color 유지', async () => {
    const existingColor = '#FF8787'
    setupLoadMocks([makeRow('m1', existingColor, 0)])

    const store = useMembersStore()
    await store.loadMembers(true)

    expect(store.members[0].color).toBe(existingColor)
  })

  it('12명 초과 시 색상이 모듈로 순환 (index 12 → MEMBER_COLORS[0])', async () => {
    const rows = Array.from({ length: 13 }, (_, i) => makeRow(`m${i}`, null, i))
    setupLoadMocks(rows)

    const store = useMembersStore()
    await store.loadMembers(true)

    expect(store.members[12].color).toBe(MEMBER_COLORS[0])
    expect(store.members[0].color).toBe(MEMBER_COLORS[0])
  })

  it('updateMemberColor 호출 시 local members 배열 즉시 갱신', async () => {
    setupLoadMocks([makeRow('m1', '#FFD43B', 0)])

    const store = useMembersStore()
    await store.loadMembers(true)

    const updateBuilder = createBuilder()
    updateBuilder.eq
      .mockReturnValueOnce(updateBuilder)
      .mockResolvedValueOnce({ error: null })
    mockEnv.supabase.from.mockReturnValueOnce(updateBuilder)

    const newColor = '#4DABF7'
    const result = await store.updateMemberColor('m1', newColor)

    expect(result).toBeNull()
    expect(store.members[0].color).toBe(newColor)
  })
})
