import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChat } from '@/composables/useChat'

const mockEnv = vi.hoisted(() => {
  const authStore = {
    user: { id: 'user-me' },
    profile: { name: '나' },
  }

  return {
    authStore,
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

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(),
    insert: vi.fn(() => builder),
    single: vi.fn(),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
  }
  return builder
}

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
