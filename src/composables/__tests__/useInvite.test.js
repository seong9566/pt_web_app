import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInvite } from '@/composables/useInvite'

const mockEnv = vi.hoisted(() => {
  const authStore = { user: { id: 'trainer-1' } }
  return {
    authStore,
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
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

describe('useInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchInviteCode는 inviteCode.value에 데이터를 저장한다', async () => {
    const builder = createBuilder()
    builder.maybeSingle.mockResolvedValue({ data: { id: 'ic1', code: 'ABC123' }, error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchInviteCode, inviteCode } = useInvite()
    await fetchInviteCode()

    expect(inviteCode.value.code).toBe('ABC123')
  })

  it('generateInviteCode는 inviteCode.value가 이미 있으면 insert를 호출하지 않는다', async () => {
    const { generateInviteCode, inviteCode } = useInvite()
    inviteCode.value = { id: 'ic1', code: 'ABC123' }
    await generateInviteCode()

    expect(mockEnv.supabase.from).not.toHaveBeenCalled()
  })

  it('generateInviteCode는 UNIQUE 위반(23505) 시 재시도하여 두 번째 시도에서 성공한다', async () => {
    const firstBuilder = createBuilder()
    const secondBuilder = createBuilder()
    firstBuilder.single.mockResolvedValue({ data: null, error: { code: '23505', message: '중복' } })
    secondBuilder.single.mockResolvedValue({ data: { id: 'ic2', code: 'XYZ789' }, error: null })
    mockEnv.supabase.from
      .mockReturnValueOnce(firstBuilder)
      .mockReturnValueOnce(secondBuilder)

    const { generateInviteCode, inviteCode } = useInvite()
    await generateInviteCode()

    expect(inviteCode.value.code).toBe('XYZ789')
    expect(mockEnv.supabase.from).toHaveBeenCalledTimes(2)
  })

  it('redeemInviteCode는 connect_via_invite RPC를 호출한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValue({ data: 'trainer-uuid', error: null })

    const { redeemInviteCode } = useInvite()
    const result = await redeemInviteCode('ABC123')

    expect(mockEnv.supabase.rpc).toHaveBeenCalledWith('connect_via_invite', { p_code: 'ABC123' })
    expect(result).toBe('trainer-uuid')
  })

  it('redeemInviteCode RPC 오류 시 null을 반환하고 error를 설정한다', async () => {
    mockEnv.supabase.rpc.mockResolvedValue({ data: null, error: { message: '알 수 없는 오류' } })

    const { redeemInviteCode, error } = useInvite()
    const result = await redeemInviteCode('INVALID')

    expect(result).toBeNull()
    expect(error.value).toBe('초대 코드 인증에 실패했습니다')
  })
})
