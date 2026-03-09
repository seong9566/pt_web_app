import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfile } from '@/composables/useProfile'

const mockCreateNotification = vi.fn().mockResolvedValue(undefined)

const mockEnv = vi.hoisted(() => {
  const authStore = { user: { id: 'user-1' }, profile: { name: '사용자' } }
  return {
    authStore,
    supabase: {
      from: vi.fn(),
      storage: { from: vi.fn() },
      rpc: vi.fn(),
      auth: { signOut: vi.fn().mockResolvedValue({}) },
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

describe('useProfile soft delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.authStore.user = { id: 'user-1' }
    mockEnv.authStore.profile = { name: '사용자' }
    mockEnv.supabase.auth.signOut.mockResolvedValue({})
  })

  it('softDeleteAccount가 soft_delete_user_account RPC를 호출한다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { softDeleteAccount } = useProfile()
    const result = await softDeleteAccount()

    expect(result).toBe(true)
    expect(mockEnv.supabase.rpc).toHaveBeenCalledWith('soft_delete_user_account')
  })

  it('softDeleteAccount에서 storage.from이 호출되지 않는다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { softDeleteAccount } = useProfile()
    await softDeleteAccount()

    expect(mockEnv.supabase.storage.from).not.toHaveBeenCalled()
  })

  it('softDeleteAccount가 연결된 사용자에게 알림을 생성한다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({
      data: [{ trainer_id: 'user-1', member_id: 'member-2' }],
      error: null,
    })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { softDeleteAccount } = useProfile()
    await softDeleteAccount()

    expect(mockCreateNotification).toHaveBeenCalledWith(
      'member-2',
      'account_deleted',
      expect.any(String),
      expect.any(String)
    )
  })

  it('softDeleteAccount 알림 메시지에 탈퇴 예정이 포함된다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({
      data: [{ trainer_id: 'user-1', member_id: 'member-2' }],
      error: null,
    })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { softDeleteAccount } = useProfile()
    await softDeleteAccount()

    const callArgs = mockCreateNotification.mock.calls[0]
    expect(callArgs[3]).toContain('탈퇴 예정')
  })

  it('softDeleteAccount 성공 시 signOut이 호출된다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { softDeleteAccount } = useProfile()
    await softDeleteAccount()

    expect(mockEnv.supabase.auth.signOut).toHaveBeenCalled()
  })

  it('softDeleteAccount RPC 에러 시 false를 반환하고 error를 설정한다', async () => {
    const builder = createBuilder()
    builder.select.mockReturnValue(builder)
    builder.or.mockReturnValue(builder)
    builder.eq.mockResolvedValue({ data: [], error: null })

    mockEnv.supabase.from.mockReturnValue(builder)
    mockEnv.supabase.rpc.mockResolvedValue({ error: { message: 'RPC 실패' } })

    const { softDeleteAccount, error } = useProfile()
    const result = await softDeleteAccount()

    expect(result).toBe(false)
    expect(error.value).toBe('RPC 실패')
    expect(mockEnv.supabase.auth.signOut).not.toHaveBeenCalled()
  })

  it('cancelAccountDeletion이 cancel_account_deletion RPC를 호출한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { cancelAccountDeletion } = useProfile()
    const result = await cancelAccountDeletion()

    expect(mockEnv.supabase.rpc).toHaveBeenCalledWith('cancel_account_deletion')
    expect(result).toBe(true)
  })

  it('cancelAccountDeletion 성공 시 true를 반환한다', async () => {
    mockEnv.authStore.profile = { name: '사용자', deleted_at: '2026-03-01T00:00:00Z' }
    mockEnv.supabase.rpc.mockResolvedValue({ error: null })

    const { cancelAccountDeletion } = useProfile()
    const result = await cancelAccountDeletion()

    expect(result).toBe(true)
    expect(mockEnv.authStore.profile.deleted_at).toBeNull()
  })

  it('cancelAccountDeletion RPC 에러 시 false를 반환하고 error를 설정한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValue({ error: { message: '취소 실패' } })

    const { cancelAccountDeletion, error } = useProfile()
    const result = await cancelAccountDeletion()

    expect(result).toBe(false)
    expect(error.value).toBe('취소 실패')
  })
})
