import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChat } from '@/composables/useChat'

const mockEnv = vi.hoisted(() => {
  const authStore = {
    user: { id: 'user-me' },
    profile: { name: '나' },
  }

  return {
    authStore,
    mockCreateNotification: vi.fn().mockResolvedValue(true),
    supabase: {
      from: vi.fn(),
      storage: {
        from: vi.fn(),
      },
      channel: vi.fn(),
      removeChannel: vi.fn(),
    },
  }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockEnv.authStore,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: mockEnv.supabase,
}))

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    createNotification: mockEnv.mockCreateNotification,
  }),
}))

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    or: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    order: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    limit: vi.fn(),
    insert: vi.fn(() => builder),
    single: vi.fn(),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
  }
  return builder
}

function buildDescendingMessages(count) {
  return Array.from({ length: count }, (_, index) => {
    const minute = String(59 - index).padStart(2, '0')
    const id = count - index
    return {
      id,
      sender_id: index % 2 === 0 ? 'partner-1' : 'user-me',
      receiver_id: index % 2 === 0 ? 'user-me' : 'partner-1',
      content: `${id}번 메시지`,
      created_at: `2026-03-05T10:${minute}:00Z`,
    }
  })
}

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.authStore.user = { id: 'user-me' }
    mockEnv.mockCreateNotification.mockReset()
    mockEnv.mockCreateNotification.mockResolvedValue(true)
    mockEnv.supabase.from.mockReset()
    mockEnv.supabase.storage.from.mockReset()
    mockEnv.supabase.channel.mockReset()
    mockEnv.supabase.removeChannel.mockReset()
  })

  it('메시지를 상대방별로 그룹핑하고 안읽은 개수를 계산한다', async () => {
    const query = createBuilder()
    query.limit.mockResolvedValue({
      data: [
        {
          id: 1,
          sender_id: 'partner-1',
          receiver_id: 'user-me',
          content: '안녕하세요',
          file_url: null,
          is_read: false,
          created_at: '2026-03-05T10:00:00Z',
          sender: { id: 'partner-1', name: '파트너1', photo_url: null },
          receiver: { id: 'user-me', name: '나', photo_url: null },
        },
        {
          id: 2,
          sender_id: 'partner-1',
          receiver_id: 'user-me',
          content: '두번째',
          file_url: null,
          is_read: false,
          created_at: '2026-03-05T09:00:00Z',
          sender: { id: 'partner-1', name: '파트너1', photo_url: null },
          receiver: { id: 'user-me', name: '나', photo_url: null },
        },
      ],
      error: null,
    })

    mockEnv.supabase.from.mockReturnValue(query)

    const { fetchConversations } = useChat()
    const conversations = await fetchConversations()

    expect(conversations).toHaveLength(1)
    expect(conversations[0].partnerId).toBe('partner-1')
    expect(conversations[0].lastMessage).toBe('안녕하세요')
    expect(conversations[0].unreadCount).toBe(2)
  })

  it('메시지 전송 시 messages 테이블에 insert하고 결과를 반환한다', async () => {
    const query = createBuilder()
    query.single.mockResolvedValue({
      data: {
        id: 10,
        sender_id: 'user-me',
        receiver_id: 'partner-1',
        content: '테스트 메시지',
      },
      error: null,
    })

    mockEnv.supabase.from.mockReturnValue(query)

    const { sendMessage, messages } = useChat()
    const result = await sendMessage('partner-1', '테스트 메시지')

    expect(query.insert).toHaveBeenCalledWith({
      sender_id: 'user-me',
      receiver_id: 'partner-1',
      content: '테스트 메시지',
      file_url: null,
      file_name: null,
      file_type: null,
      file_size: null,
      is_read: false,
    })
    expect(result?.id).toBe(10)
    expect(messages.value).toHaveLength(1)
  })

  it('메시지 조회 시 최신 50개를 내림차순으로 가져온 뒤 시간순으로 반환한다', async () => {
    const query = createBuilder()
    query.limit.mockResolvedValue({
      data: [
        {
          id: 3,
          sender_id: 'partner-1',
          receiver_id: 'user-me',
          content: '세 번째',
          created_at: '2026-03-05T12:00:00Z',
        },
        {
          id: 2,
          sender_id: 'user-me',
          receiver_id: 'partner-1',
          content: '두 번째',
          created_at: '2026-03-05T11:00:00Z',
        },
        {
          id: 1,
          sender_id: 'partner-1',
          receiver_id: 'user-me',
          content: '첫 번째',
          created_at: '2026-03-05T10:00:00Z',
        },
      ],
      error: null,
    })

    mockEnv.supabase.from.mockReturnValue(query)

    const { fetchMessages, messages } = useChat()
    const result = await fetchMessages('partner-1')

    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.map((item) => item.id)).toEqual([1, 2, 3])
    expect(messages.value.map((item) => item.id)).toEqual([1, 2, 3])
  })

  it('fetchOlderMessages는 첫 메시지 created_at 커서로 이전 메시지를 조회해 앞에 붙인다', async () => {
    const initialQuery = createBuilder()
    initialQuery.limit.mockResolvedValue({
      data: buildDescendingMessages(30),
      error: null,
    })

    const olderQuery = createBuilder()
    olderQuery.limit.mockResolvedValue({
      data: [
        {
          id: -1,
          sender_id: 'partner-1',
          receiver_id: 'user-me',
          content: '더 과거 2',
          created_at: '2026-03-05T08:00:00Z',
        },
        {
          id: -2,
          sender_id: 'user-me',
          receiver_id: 'partner-1',
          content: '더 과거 1',
          created_at: '2026-03-05T07:00:00Z',
        },
      ],
      error: null,
    })

    mockEnv.supabase.from
      .mockReturnValueOnce(initialQuery)
      .mockReturnValueOnce(olderQuery)

    const { fetchMessages, fetchOlderMessages, messages } = useChat()
    await fetchMessages('partner-1')
    await fetchOlderMessages('partner-1')

    expect(olderQuery.lt).toHaveBeenCalledWith('created_at', '2026-03-05T10:30:00Z')
    expect(olderQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(messages.value[0].id).toBe(-2)
    expect(messages.value[1].id).toBe(-1)
    expect(messages.value).toHaveLength(32)
  })

  it('fetchOlderMessages는 PAGE_SIZE 미만 반환 시 hasMore를 false로 설정한다', async () => {
    const initialQuery = createBuilder()
    initialQuery.limit.mockResolvedValue({
      data: buildDescendingMessages(30),
      error: null,
    })

    const olderQuery = createBuilder()
    olderQuery.limit.mockResolvedValue({
      data: [
        {
          id: 0,
          sender_id: 'user-me',
          receiver_id: 'partner-1',
          content: '더 과거',
          created_at: '2026-03-05T09:00:00Z',
        },
      ],
      error: null,
    })

    mockEnv.supabase.from
      .mockReturnValueOnce(initialQuery)
      .mockReturnValueOnce(olderQuery)

    const { fetchMessages, fetchOlderMessages, hasMore } = useChat()
    await fetchMessages('partner-1')
    await fetchOlderMessages('partner-1')

    expect(hasMore.value).toBe(false)
  })

  it('searchMessages는 ilike 기반으로 대화 상대 메시지를 최신순 조회한다', async () => {
    const query = createBuilder()
    query.limit.mockResolvedValue({
      data: [
        {
          id: 101,
          sender_id: 'partner-1',
          receiver_id: 'user-me',
          content: '하체 루틴 수정',
          created_at: '2026-03-05T13:00:00Z',
        },
      ],
      error: null,
    })

    mockEnv.supabase.from.mockReturnValue(query)

    const { searchMessages, searchResults } = useChat()
    const result = await searchMessages('partner-1', '루틴')

    expect(mockEnv.supabase.from).toHaveBeenCalledWith('messages')
    expect(query.or).toHaveBeenNthCalledWith(1, 'sender_id.eq.user-me,receiver_id.eq.user-me')
    expect(query.or).toHaveBeenNthCalledWith(
      2,
      'and(sender_id.eq.user-me,receiver_id.eq.partner-1),and(sender_id.eq.partner-1,receiver_id.eq.user-me)'
    )
    expect(query.ilike).toHaveBeenCalledWith('content', '%루틴%')
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(query.limit).toHaveBeenCalledWith(50)
    expect(result).toEqual(searchResults.value)
    expect(result).toHaveLength(1)
  })

  it('searchMessages는 2자 미만 입력 시 빈 배열을 반환하고 API를 호출하지 않는다', async () => {
    const { searchMessages, searchResults } = useChat()
    searchResults.value = [{ id: 1 }]

    const result = await searchMessages('partner-1', 'ㄱ')

    expect(result).toEqual([])
    expect(searchResults.value).toEqual([])
    expect(mockEnv.supabase.from).not.toHaveBeenCalled()
  })

  it('searchMessages는 결과를 최대 50개로 제한한다', async () => {
    const query = createBuilder()
    query.limit.mockResolvedValue({
      data: Array.from({ length: 50 }, (_, index) => ({
        id: index + 1,
        sender_id: 'partner-1',
        receiver_id: 'user-me',
        content: `${index + 1}번째 검색 결과`,
        created_at: `2026-03-05T13:${String(index).padStart(2, '0')}:00Z`,
      })),
      error: null,
    })

    mockEnv.supabase.from.mockReturnValue(query)

    const { searchMessages } = useChat()
    const result = await searchMessages('partner-1', '검색어')

    expect(query.limit).toHaveBeenCalledWith(50)
    expect(result).toHaveLength(50)
  })

  it('읽음 처리 시 상대방이 보낸 미읽은 메시지만 update한다', async () => {
    const query = createBuilder()
    query.eq
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce({ error: null })

    mockEnv.supabase.from.mockReturnValue(query)

    const { markAsRead } = useChat()
    await markAsRead('partner-1')

    expect(query.update).toHaveBeenCalledWith({ is_read: true })
    expect(query.eq).toHaveBeenNthCalledWith(1, 'sender_id', 'partner-1')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'receiver_id', 'user-me')
    expect(query.eq).toHaveBeenNthCalledWith(3, 'is_read', false)
  })

  it('subscribeToReadReceipts — 내가 보낸 메시지의 is_read가 true로 변경될 때 로컬 메시지를 업데이트한다', async () => {
    // 1. sendMessage 모킹: messages에 미읽은 메시지 추가
    const sendQuery = createBuilder()
    sendQuery.single.mockResolvedValue({
      data: { id: 42, sender_id: 'user-me', receiver_id: 'partner-1', content: '안녕', is_read: false },
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(sendQuery)

    // 2. channel 모킹 — on() 콜백 캡처
    let capturedCallback = null
    const mockChannel = {
      on: vi.fn((_type, _filter, cb) => {
        capturedCallback = cb
        return mockChannel
      }),
      subscribe: vi.fn(() => mockChannel),
    }
    mockEnv.supabase.channel.mockReturnValue(mockChannel)

    const { sendMessage, messages, subscribeToReadReceipts } = useChat()

    // 3. 메시지 전송 → messages.value에 { id: 42, is_read: false } 추가
    await sendMessage('partner-1', '안녕')
    expect(messages.value).toHaveLength(1)
    expect(messages.value[0].is_read).toBe(false)

    // 4. read receipt 구독 시작
    subscribeToReadReceipts('partner-1')

    expect(mockEnv.supabase.channel).toHaveBeenCalledWith('read-receipts-partner-1-user-me')
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: 'sender_id=eq.user-me',
      }),
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()

    // 5. 상대방이 읽음 처리 → 콜백 시뮬레이션
    capturedCallback({ new: { id: 42, is_read: true } })

    // 6. 로컬 메시지 is_read 업데이트 확인
    expect(messages.value[0].is_read).toBe(true)
  })

  it('메시지 전송 성공 후 수신자에게 createNotification을 호출한다', async () => {
    const query = createBuilder()
    query.single.mockResolvedValue({
      data: {
        id: 20,
        sender_id: 'user-me',
        receiver_id: 'partner-1',
        content: '알림 테스트 메시지',
      },
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(query)

    const { sendMessage } = useChat()
    const result = await sendMessage('partner-1', '알림 테스트 메시지')

    expect(result?.id).toBe(20)
    expect(mockEnv.mockCreateNotification).toHaveBeenCalledWith(
      'partner-1',
      'new_message',
      '새 메시지',
      '알림 테스트 메시지',
      20,
      'message'
    )
  })

  it('알림 생성 실패해도 sendMessage는 메시지를 성공적으로 반환한다', async () => {
    const query = createBuilder()
    query.single.mockResolvedValue({
      data: {
        id: 21,
        sender_id: 'user-me',
        receiver_id: 'partner-1',
        content: '알림 실패 테스트',
      },
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(query)
    mockEnv.mockCreateNotification.mockRejectedValueOnce(new Error('알림 서버 오류'))

    const { sendMessage } = useChat()
    const result = await sendMessage('partner-1', '알림 실패 테스트')

    expect(result?.id).toBe(21)
  })

  it('파일 업로드 성공 시 chat-files public URL을 반환한다', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null })
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/chat-files/user-me/1234-photo.jpg' },
    })

    mockEnv.supabase.storage.from.mockReturnValue({
      upload,
      getPublicUrl,
    })

    const { uploadChatFile } = useChat()
    const file = {
      name: 'photo.jpg',
      type: 'image/jpeg',
      size: 1024,
    }

    const result = await uploadChatFile(file)

    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0][0]).toMatch(/^user-me\/\d+-photo\.jpg$/)
    expect(upload.mock.calls[0][1]).toBe(file)
    expect(getPublicUrl).toHaveBeenCalledWith(upload.mock.calls[0][0])
    expect(result).toEqual({
      url: 'https://example.supabase.co/storage/v1/object/public/chat-files/user-me/1234-photo.jpg',
    })
  })
})
