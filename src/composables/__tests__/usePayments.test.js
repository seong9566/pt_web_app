import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePayments } from '@/composables/usePayments'

const mockEnv = vi.hoisted(() => {
  const authStore = {
    user: { id: 'trainer-1' },
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

describe('usePayments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('금액이 0이면 createPayment가 실패하고 에러를 설정한다', async () => {
    const { createPayment, error } = usePayments()
    const result = await createPayment('member-1', 0, '2026-03-01')

    expect(result).toBe(false)
    expect(error.value).toBe('금액은 0보다 커야 합니다')
    expect(mockEnv.supabase.from).not.toHaveBeenCalled()
  })

  it('금액이 음수이면 createPayment가 실패한다', async () => {
    const { createPayment, error } = usePayments()
    const result = await createPayment('member-1', -1000, '2026-03-01')

    expect(result).toBe(false)
    expect(error.value).toBe('금액은 0보다 커야 합니다')
  })

  it('금액이 0이면 updatePayment도 실패한다', async () => {
    const { updatePayment, error } = usePayments()
    const result = await updatePayment('payment-1', 0, '2026-03-01')

    expect(result).toBe(false)
    expect(error.value).toBe('금액은 0보다 커야 합니다')
    expect(mockEnv.supabase.from).not.toHaveBeenCalled()
  })

  it('유효한 금액으로 createPayment 시 insert 후 목록을 다시 조회한다', async () => {
    const insertBuilder = createBuilder()
    const fetchBuilder = createBuilder()

    insertBuilder.insert.mockResolvedValue({ error: null })
    fetchBuilder.order.mockResolvedValue({
      data: [{ id: 'p-1', member_id: 'member-1', amount: 50000, payment_date: '2026-03-01', memo: null }],
      error: null,
    })

    mockEnv.supabase.from
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(fetchBuilder)

    const { createPayment, payments } = usePayments()
    const result = await createPayment('member-1', 50000, '2026-03-01', '3월 수납')

    expect(result).toBe(true)
    expect(insertBuilder.insert).toHaveBeenCalledWith({
      trainer_id: 'trainer-1',
      member_id: 'member-1',
      amount: 50000,
      payment_date: '2026-03-01',
      memo: '3월 수납',
    })
    expect(payments.value).toHaveLength(1)
    expect(payments.value[0].amount).toBe(50000)
  })

  it('deletePayment 성공 시 로컬 목록에서 해당 항목을 제거한다', async () => {
    const deleteBuilder = createBuilder()
    deleteBuilder.eq.mockResolvedValue({ error: null })

    mockEnv.supabase.from.mockReturnValue(deleteBuilder)

    const { deletePayment, payments } = usePayments()
    payments.value = [
      { id: 'p-1', amount: 50000 },
      { id: 'p-2', amount: 30000 },
    ]

    const result = await deletePayment('p-1')

    expect(result).toBe(true)
    expect(payments.value).toHaveLength(1)
    expect(payments.value[0].id).toBe('p-2')
  })

  it('deletePayment DB 오류 시 false를 반환하고 에러를 설정한다', async () => {
    const deleteBuilder = createBuilder()
    deleteBuilder.eq.mockResolvedValue({ error: { message: '삭제 실패' } })

    mockEnv.supabase.from.mockReturnValue(deleteBuilder)

    const { deletePayment, error } = usePayments()
    const result = await deletePayment('p-1')

    expect(result).toBe(false)
    expect(error.value).toBe('삭제 실패')
  })

  it('totalAmount는 payments 배열의 amount 합계를 반환한다', () => {
    const { payments, totalAmount } = usePayments()
    payments.value = [
      { id: 'p-1', amount: 50000 },
      { id: 'p-2', amount: 30000 },
      { id: 'p-3', amount: 20000 },
    ]

    expect(totalAmount.value).toBe(100000)
  })

  it('payments가 비어있으면 totalAmount는 0이다', () => {
    const { totalAmount } = usePayments()
    expect(totalAmount.value).toBe(0)
  })

  it('fetchMemberOwnPayments는 auth.user.id로 member_id를 조회한다', async () => {
    const builder = createBuilder()
    builder.order.mockResolvedValue({
      data: [
        { id: 'p-1', member_id: 'trainer-1', amount: 50000, payment_date: '2026-03-01', memo: null },
      ],
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchMemberOwnPayments, payments } = usePayments()
    await fetchMemberOwnPayments()

    expect(builder.eq).toHaveBeenCalledWith('member_id', 'trainer-1')
    expect(payments.value).toHaveLength(1)
    expect(payments.value[0].amount).toBe(50000)
  })

  it('fetchMemberOwnPayments 성공 시 payments를 설정한다', async () => {
    const builder = createBuilder()
    builder.order.mockResolvedValue({
      data: [
        { id: 'p-1', member_id: 'trainer-1', amount: 100000, payment_date: '2026-03-01', memo: '수납' },
        { id: 'p-2', member_id: 'trainer-1', amount: 50000, payment_date: '2026-02-28', memo: null },
      ],
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchMemberOwnPayments, payments } = usePayments()
    await fetchMemberOwnPayments()

    expect(payments.value).toHaveLength(2)
    expect(payments.value[0].amount).toBe(100000)
    expect(payments.value[1].amount).toBe(50000)
  })

  it('fetchMemberOwnPayments DB 오류 시 error를 설정한다', async () => {
    const builder = createBuilder()
    builder.order.mockResolvedValue({ error: { message: '수납 기록을 불러올 수 없습니다' } })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchMemberOwnPayments, error } = usePayments()
    await fetchMemberOwnPayments()

    expect(error.value).toBe('수납 기록을 불러올 수 없습니다')
  })
})
