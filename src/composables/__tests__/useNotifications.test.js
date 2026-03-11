import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotifications } from '@/composables/useNotifications'

const mockEnv = vi.hoisted(() => {
  const authStore = {
    user: { id: 'user-1' },
    profile: { name: '사용자' },
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
    gte: vi.fn(() => builder),
    order: vi.fn(),
    update: vi.fn(() => builder),
    insert: vi.fn(),
  }
  return builder
}

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08T12:00:00.000Z'))
  })

  it('알림 조회 시 30일 이내 필터를 적용하고 미읽은 수를 계산한다', async () => {
    const query = createBuilder()
    query.order.mockResolvedValue({
      data: [
        { id: 1, is_read: false },
        { id: 2, is_read: true },
      ],
      error: null,
    })

    mockEnv.supabase.from.mockReturnValue(query)

    const { fetchNotifications, unreadCount, notifications } = useNotifications()
    await fetchNotifications()

    const expectedThreshold = '2026-02-06T12:00:00.000Z'
    expect(query.gte).toHaveBeenCalledWith('created_at', expectedThreshold)
    expect(notifications.value).toHaveLength(2)
    expect(unreadCount.value).toBe(1)
  })

  it('알림 생성 시 전달된 payload로 insert한다', async () => {
    const query = createBuilder()
    query.insert.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(query)

    const { createNotification } = useNotifications()
    await createNotification('user-2', 'reservation_created', '예약 생성', '예약이 생성되었습니다', 'res-1', 'reservation')

    expect(query.insert).toHaveBeenCalledWith({
      user_id: 'user-2',
      type: 'reservation_created',
      title: '예약 생성',
      body: '예약이 생성되었습니다',
      target_id: 'res-1',
      target_type: 'reservation',
    })
  })

  it('fetchNotifications 빈 결과 시 notifications가 빈 배열이고 unreadCount가 0이다', async () => {
    const query = createBuilder()
    query.order.mockResolvedValue({ data: [], error: null })
    mockEnv.supabase.from.mockReturnValue(query)

    const { fetchNotifications, notifications, unreadCount } = useNotifications()
    await fetchNotifications()

    expect(notifications.value).toHaveLength(0)
    expect(unreadCount.value).toBe(0)
  })

  it('개별 읽음 처리 후 로컬 unreadCount를 갱신한다', async () => {
    const fetchQuery = createBuilder()
    const readQuery = createBuilder()

    fetchQuery.order.mockResolvedValue({
      data: [
        { id: 1, is_read: false },
        { id: 2, is_read: false },
      ],
      error: null,
    })
    readQuery.eq
      .mockReturnValueOnce(readQuery)
      .mockResolvedValueOnce({ error: null })

    mockEnv.supabase.from
      .mockReturnValueOnce(fetchQuery)
      .mockReturnValueOnce(readQuery)

    const { fetchNotifications, markAsRead, unreadCount, notifications } = useNotifications()
    await fetchNotifications()
    await markAsRead(1)

    expect(readQuery.update).toHaveBeenCalledWith({ is_read: true })
    expect(notifications.value.find((n) => n.id === 1)?.is_read).toBe(true)
    expect(unreadCount.value).toBe(1)
  })
})
