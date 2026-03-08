import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfile } from '@/composables/useProfile'

const mockCreateNotification = vi.fn().mockResolvedValue(undefined)

const mockEnv = vi.hoisted(() => {
  const authStore = { user: { id: 'user-1' } }
  return {
    authStore,
    supabase: {
      from: vi.fn(),
      storage: {
        from: vi.fn(),
      },
      rpc: vi.fn(),
      auth: {
        signOut: vi.fn().mockResolvedValue({}),
      },
    },
  }
})

vi.mock('@/stores/auth', () => ({ useAuthStore: () => mockEnv.authStore }))
vi.mock('@/lib/supabase', () => ({ supabase: mockEnv.supabase }))
vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification }),
}))

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    or: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return builder
}

function createStorageBucket() {
  return {
    list: vi.fn(),
    remove: vi.fn().mockResolvedValue({ error: null }),
  }
}

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.supabase.auth.signOut.mockResolvedValue({})
  })

  it('softDeleteAccount 성공 시 RPC가 호출되고 true를 반환한다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({ data: [], error: null })

    const avatarBucket = createStorageBucket()
    const chatBucket = createStorageBucket()
    avatarBucket.list.mockResolvedValue({ data: [], error: null })
    chatBucket.list.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.storage.from.mockImplementation((bucket) => {
      if (bucket === 'avatars') return avatarBucket
      if (bucket === 'chat-files') return chatBucket
      return createStorageBucket()
    })
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { softDeleteAccount } = useProfile()
    const result = await softDeleteAccount()

    expect(result).toBe(true)
    expect(mockEnv.supabase.rpc).toHaveBeenCalledWith('delete_user_account')
    expect(mockEnv.supabase.auth.signOut).toHaveBeenCalled()
  })

  it('softDeleteAccount 성공 시 연결된 사용자에게 createNotification이 호출된다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({
      data: [{ trainer_id: 'user-1', member_id: 'member-2' }],
      error: null,
    })

    const avatarBucket = createStorageBucket()
    const chatBucket = createStorageBucket()
    avatarBucket.list.mockResolvedValue({ data: [], error: null })
    chatBucket.list.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.storage.from.mockImplementation((bucket) => {
      if (bucket === 'avatars') return avatarBucket
      if (bucket === 'chat-files') return chatBucket
      return createStorageBucket()
    })
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { softDeleteAccount } = useProfile()
    await softDeleteAccount()

    expect(mockCreateNotification).toHaveBeenCalledWith(
      'member-2',
      'account_deleted',
      '연결된 사용자가 탈퇴했습니다',
      '사용자님이 탈퇴했습니다.'
    )
  })

  it('softDeleteAccount에서 Storage 삭제 실패 시에도 RPC가 호출된다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({ data: [], error: null })

    const avatarBucket = createStorageBucket()
    const chatBucket = createStorageBucket()
    avatarBucket.list.mockRejectedValue(new Error('Storage error'))
    chatBucket.list.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.storage.from.mockImplementation((bucket) => {
      if (bucket === 'avatars') return avatarBucket
      if (bucket === 'chat-files') return chatBucket
      return createStorageBucket()
    })
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { softDeleteAccount } = useProfile()
    const result = await softDeleteAccount()

    expect(result).toBe(true)
    expect(mockEnv.supabase.rpc).toHaveBeenCalledWith('delete_user_account')
  })

  it('softDeleteAccount에서 RPC 실패 시 false를 반환하고 error를 설정한다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({ data: [], error: null })

    const avatarBucket = createStorageBucket()
    const chatBucket = createStorageBucket()
    avatarBucket.list.mockResolvedValue({ data: [], error: null })
    chatBucket.list.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.storage.from.mockImplementation((bucket) => {
      if (bucket === 'avatars') return avatarBucket
      if (bucket === 'chat-files') return chatBucket
      return createStorageBucket()
    })
    mockEnv.supabase.rpc.mockResolvedValue({ error: { message: 'RPC 실패' } })

    const { softDeleteAccount, error } = useProfile()
    const result = await softDeleteAccount()

    expect(result).toBe(false)
    expect(error.value).toBe('RPC 실패')
    expect(mockEnv.supabase.auth.signOut).not.toHaveBeenCalled()
  })

  it('softDeleteAccount 성공 시 Storage 파일이 있으면 remove가 호출된다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({ data: [], error: null })

    const avatarBucket = createStorageBucket()
    const chatBucket = createStorageBucket()
    avatarBucket.list.mockResolvedValue({
      data: [{ name: 'photo.jpg' }],
      error: null,
    })
    chatBucket.list.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.storage.from.mockImplementation((bucket) => {
      if (bucket === 'avatars') return avatarBucket
      if (bucket === 'chat-files') return chatBucket
      return createStorageBucket()
    })
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { softDeleteAccount } = useProfile()
    await softDeleteAccount()

    expect(avatarBucket.remove).toHaveBeenCalledWith(['user-1/photo.jpg'])
  })
})
