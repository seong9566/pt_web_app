import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTrainerSearch } from '@/composables/useTrainerSearch'

const mockEnv = vi.hoisted(() => {
  const authStore = { user: { id: 'member-1' } }
  return {
    authStore,
    supabase: {
      from: vi.fn(),
      auth: { getUser: vi.fn() },
    },
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

function setupSearchMocks(profilesData, connectionsData) {
  const profilesBuilder = createBuilder()
  const connectionsBuilder = createBuilder()

  profilesBuilder.eq.mockResolvedValue({ data: profilesData, error: null })
  connectionsBuilder.in.mockResolvedValue({ data: connectionsData, error: null })

  mockEnv.supabase.from
    .mockReturnValueOnce(profilesBuilder)
    .mockReturnValueOnce(connectionsBuilder)
}

describe('useTrainerSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searchTrainers는 active 연결 트레이너에 connected=true를 설정한다', async () => {
    setupSearchMocks(
      [{ id: 't1', name: '트레이너1', photo_url: null, trainer_profiles: [] }],
      [{ trainer_id: 't1', status: 'active' }]
    )

    const { searchTrainers, trainers } = useTrainerSearch()
    await searchTrainers('')

    expect(trainers.value[0].connected).toBe(true)
    expect(trainers.value[0].pending).toBe(false)
  })

  it('searchTrainers는 pending 연결 트레이너에 pending=true를 설정한다', async () => {
    setupSearchMocks(
      [{ id: 't2', name: '트레이너2', photo_url: null, trainer_profiles: [] }],
      [{ trainer_id: 't2', status: 'pending' }]
    )

    const { searchTrainers, trainers } = useTrainerSearch()
    await searchTrainers('')

    expect(trainers.value[0].pending).toBe(true)
    expect(trainers.value[0].connected).toBe(false)
  })

  it('requestConnection은 trainer_members에 status=pending으로 insert한다', async () => {
    mockEnv.supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'member-1' } } })
    const builder = createBuilder()
    builder.insert.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { requestConnection } = useTrainerSearch()
    const result = await requestConnection('trainer-1')

    expect(result).toBe(true)
    expect(builder.insert).toHaveBeenCalledWith({
      trainer_id: 'trainer-1',
      member_id: 'member-1',
      status: 'pending',
    })
  })

  it('approveConnection은 status를 active로 update하고 pending 조건을 포함한다', async () => {
    const builder = createBuilder()
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { approveConnection } = useTrainerSearch()
    const result = await approveConnection('conn-1')

    expect(result).toBe(true)
    expect(builder.update).toHaveBeenCalledWith({ status: 'active' })
    expect(builder.eq).toHaveBeenCalledWith('status', 'pending')
  })

  it('rejectConnection은 pending 조건으로 delete한다', async () => {
    const builder = createBuilder()
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { rejectConnection } = useTrainerSearch()
    const result = await rejectConnection('conn-1')

    expect(result).toBe(true)
    expect(builder.eq).toHaveBeenCalledWith('status', 'pending')
  })
})
