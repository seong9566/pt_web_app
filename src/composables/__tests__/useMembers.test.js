import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMembers } from '@/composables/useMembers'

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

const MEMBER_ROW = {
  member_id: 'm1',
  connected_at: '2026-01-01T00:00:00Z',
  status: 'active',
  profiles: { id: 'm1', name: '회원1', photo_url: null, role: 'member' },
}

function setupMocks(ptData) {
  const membersBuilder = createBuilder()
  const ptBuilder = createBuilder()

  membersBuilder.eq
    .mockReturnValueOnce(membersBuilder)
    .mockResolvedValueOnce({ data: [MEMBER_ROW], error: null })

  ptBuilder.in.mockResolvedValue({ data: ptData, error: null })

  mockEnv.supabase.from
    .mockReturnValueOnce(membersBuilder)
    .mockReturnValueOnce(ptBuilder)
}

describe('useMembers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('PT 잔여 횟수가 있으면 dotStatus가 active이고 group이 active이다', async () => {
    setupMocks([{ member_id: 'm1', change_amount: 5 }])

    const { fetchMembers, members } = useMembers()
    await fetchMembers()

    expect(members.value[0].dotStatus).toBe('active')
    expect(members.value[0].group).toBe('active')
  })

  it('PT 잔여 횟수가 0이면 dotStatus가 inactive이고 group이 ended이다', async () => {
    setupMocks([
      { member_id: 'm1', change_amount: 5 },
      { member_id: 'm1', change_amount: -5 },
    ])

    const { fetchMembers, members } = useMembers()
    await fetchMembers()

    expect(members.value[0].dotStatus).toBe('inactive')
    expect(members.value[0].group).toBe('ended')
  })

  it('remaining/totalAdded >= 0.5이면 barColor가 blue이다', async () => {
    setupMocks([
      { member_id: 'm1', change_amount: 10 },
      { member_id: 'm1', change_amount: -4 },
    ])

    const { fetchMembers, members } = useMembers()
    await fetchMembers()

    expect(members.value[0].barColor).toBe('blue')
  })

  it('0.2 <= remaining/totalAdded < 0.5이면 barColor가 orange이다', async () => {
    setupMocks([
      { member_id: 'm1', change_amount: 10 },
      { member_id: 'm1', change_amount: -8 },
    ])

    const { fetchMembers, members } = useMembers()
    await fetchMembers()

    expect(members.value[0].barColor).toBe('orange')
  })

  it('PT 데이터가 없는 회원은 barColor가 gray이고 group이 ended이다', async () => {
    setupMocks([])

    const { fetchMembers, members } = useMembers()
    await fetchMembers()

    expect(members.value[0].barColor).toBe('gray')
    expect(members.value[0].group).toBe('ended')
  })
})
