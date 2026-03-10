/**
 * 실시간 채팅 컴포저블
 *
 * 대화 목록 조회, 메시지 전송/수신, 파일 업로드,
 * Supabase Realtime 구독을 통한 실시간 채팅 기능 제공.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useChatBadgeStore } from '@/stores/chatBadge'
import { useNotifications } from '@/composables/useNotifications'

const PAGE_SIZE = 30

/** 실시간 채팅 관리 */
export function useChat() {
  const auth = useAuthStore()

  const conversations = ref([])
  const messages = ref([])
  const loading = ref(false)
  const searchLoading = ref(false)
  const error = ref(null)
  const unreadCount = ref(0)
  const hasMore = ref(true)
  const searchResults = ref([])
  let channel = null
  let readReceiptChannel = null

  /**
   * 대화 목록 조회 — 나와 관련된 모든 메시지를 불러와
   * 상대방별로 그룹화하여 최근 메시지 + 안읽은 수 반환
   */
  async function fetchConversations() {
    loading.value = true
    error.value = null

    try {
      const me = auth.user?.id
      if (!me) {
        conversations.value = []
        return conversations.value
      }

      // 내가 sender이거나 receiver인 모든 메시지 조회 (최신 500개)
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          file_url,
          file_name,
          is_read,
          created_at,
          sender:profiles!sender_id(id, name, photo_url),
          receiver:profiles!receiver_id(id, name, photo_url)
        `)
        .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
        .order('created_at', { ascending: false })
        .limit(500)

      if (fetchError) throw fetchError

      // 상대방별로 그룹화 (Map은 삽입 순서를 유지하므로 최신 대화가 먼저)
      const partnerMap = new Map()

      for (const msg of data ?? []) {
        const isMe = msg.sender_id === me
        const partnerId = isMe ? msg.receiver_id : msg.sender_id
        const partnerProfile = isMe ? msg.receiver : msg.sender

        if (!partnerMap.has(partnerId)) {
          // 첫 번째로 만나는 메시지가 가장 최신 메시지
          partnerMap.set(partnerId, {
            partnerId,
            partnerName: partnerProfile?.name ?? '알 수 없음',
            partnerPhoto: partnerProfile?.photo_url ?? null,
            lastMessage: msg.file_url && !msg.content ? '파일을 보냈습니다' : (msg.content ?? ''),
            lastMessageTime: msg.created_at,
            unreadCount: 0,
          })
        }

        // 안읽은 메시지: 상대방이 보낸 것 중 내가 안 읽은 것
        if (!isMe && !msg.is_read) {
          const conv = partnerMap.get(partnerId)
          conv.unreadCount += 1
          partnerMap.set(partnerId, conv)
        }
      }

      conversations.value = Array.from(partnerMap.values())
      return conversations.value
    } catch (e) {
      error.value = e?.message ?? '대화 목록을 불러오지 못했습니다'
      conversations.value = []
      return conversations.value
    } finally {
      loading.value = false
    }
  }

  async function fetchMessages(partnerId) {
    loading.value = true
    error.value = null

    try {
      const me = auth.user?.id
      if (!me || !partnerId) {
        messages.value = []
        hasMore.value = true
        return messages.value
      }

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(name, photo_url)
        `)
        .or(`and(sender_id.eq.${me},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${me})`)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (fetchError) throw fetchError

      messages.value = (data ?? []).reverse()
      hasMore.value = (data ?? []).length === PAGE_SIZE
      return messages.value
    } catch (e) {
      error.value = e?.message ?? '메시지를 불러오지 못했습니다'
      messages.value = []
      hasMore.value = true
      return messages.value
    } finally {
      loading.value = false
    }
  }

  async function fetchOlderMessages(partnerId) {
    loading.value = true
    error.value = null

    try {
      const me = auth.user?.id
      const cursor = messages.value[0]?.created_at

      if (!me || !partnerId || !cursor || !hasMore.value) {
        return []
      }

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(name, photo_url)
        `)
        .or(`and(sender_id.eq.${me},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${me})`)
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (fetchError) throw fetchError

      const olderMsgs = (data ?? []).reverse()
      messages.value = [...olderMsgs, ...messages.value]
      hasMore.value = olderMsgs.length === PAGE_SIZE
      return olderMsgs
    } catch (e) {
      error.value = e?.message ?? '이전 메시지를 불러오지 못했습니다'
      return []
    } finally {
      loading.value = false
    }
  }

  async function searchMessages(partnerId, query) {
    searchLoading.value = true
    error.value = null

    try {
      const me = auth.user?.id
      const keyword = query?.trim() ?? ''

      if (!me || !partnerId || keyword.length < 2) {
        searchResults.value = []
        return []
      }

      const { data, error: searchError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
        .or(`and(sender_id.eq.${me},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${me})`)
        .ilike('content', `%${keyword}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (searchError) throw searchError

      searchResults.value = data ?? []
      return searchResults.value
    } catch (e) {
      error.value = e?.message ?? '메시지 검색에 실패했습니다'
      searchResults.value = []
      return []
    } finally {
      searchLoading.value = false
    }
  }

  /**
   * 메시지 전송 — 파일이 있으면 먼저 업로드 후 전송
   */
  async function sendMessage(receiverId, content, file = null) {
    loading.value = true
    error.value = null

    try {
      const me = auth.user?.id
      if (!me || !receiverId) throw new Error('사용자 정보가 없습니다')

      let fileUrl = null
      let fileName = null
      let fileType = null
      let fileSize = null

      if (file) {
        const uploaded = await uploadChatFile(file)
        if (!uploaded) throw new Error('파일 업로드에 실패했습니다')
        fileUrl = uploaded.url
        fileName = file.name
        fileType = file.type
        fileSize = file.size
      }

      const insertData = {
        sender_id: me,
        receiver_id: receiverId,
        content: content || null,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        is_read: false,
      }

      const { data, error: insertError } = await supabase
        .from('messages')
        .insert(insertData)
        .select(`
          *,
          sender:profiles!sender_id(name, photo_url)
        `)
        .single()

      if (insertError) throw insertError

      messages.value.push(data)

      // 수신자에게 인앱 알림 생성 (실패해도 메시지 전송에 영향 없음)
      try {
        const { createNotification } = useNotifications()
        await createNotification(
          receiverId,
          'new_message',
          '새 메시지',
          content || '파일을 보냈습니다',
          data.id,
          'message'
        )
      } catch {
        // 알림 생성 실패는 무시
      }

      return data
    } catch (e) {
      error.value = e?.message ?? '메시지 전송에 실패했습니다'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 상대방이 보낸 메시지 읽음 처리
   */
  async function markAsRead(partnerId) {
    try {
      const me = auth.user?.id
      if (!me || !partnerId) return

      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', me)
        .eq('is_read', false)

      if (updateError) throw updateError
    } catch (e) {
      error.value = e?.message ?? '읽음 처리에 실패했습니다'
    }
  }

  /**
   * Supabase Realtime 구독 — 특정 상대와의 채팅방 메시지 수신
   */
  function subscribeToMessages(partnerId) {
    const me = auth.user?.id
    if (!me || !partnerId) return

    // 기존 채널이 있으면 먼저 해제
    unsubscribe()

    channel = supabase
      .channel(`chat-${partnerId}-${me}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${me}`,
        },
        (payload) => {
          // 현재 채팅 상대가 보낸 메시지만 추가
          if (payload.new.sender_id === partnerId) {
            messages.value.push(payload.new)
          }
        }
      )
      .subscribe()
  }

  /**
   * Realtime 구독 해제
   */
  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    if (readReceiptChannel) {
      supabase.removeChannel(readReceiptChannel)
      readReceiptChannel = null
    }
  }

  /**
   * Supabase Realtime 구독 — 내가 보낸 메시지의 읽음 상태 변경 감지
   * 상대방이 읽으면 is_read=true UPDATE → 로컬 messages 배열 업데이트
   */
  function subscribeToReadReceipts(partnerId) {
    const me = auth.user?.id
    if (!me || !partnerId) return

    if (readReceiptChannel) {
      supabase.removeChannel(readReceiptChannel)
      readReceiptChannel = null
    }

    readReceiptChannel = supabase
      .channel(`read-receipts-${partnerId}-${me}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${me}`,
        },
        (payload) => {
          if (payload.new.is_read === true) {
            const idx = messages.value.findIndex((m) => m.id === payload.new.id)
            if (idx !== -1) {
              messages.value[idx] = { ...messages.value[idx], is_read: true }
            }
          }
        }
      )
      .subscribe()
  }

  /**
   * 파일 업로드 — chat-files 버킷
   * 이미지: 10MB 제한, 기타: 50MB 제한
   */
  async function uploadChatFile(file) {
    try {
      const isImage = file.type.startsWith('image/')
      const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024 // 10MB 또는 50MB
      const maxSizeLabel = isImage ? '10MB' : '50MB'

      if (file.size > maxSize) {
        throw new Error(`파일 크기는 ${maxSizeLabel} 이하여야 합니다`)
      }

      const me = auth.user?.id
      const filePath = `${me}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath)

      return { url: urlData.publicUrl }
    } catch (e) {
      error.value = e?.message ?? '파일 업로드에 실패했습니다'
      return null
    }
  }

  /**
   * 전체 미읽은 메시지 수 조회 (배지용)
   */
  async function getUnreadCount() {
    const chatBadgeStore = useChatBadgeStore()
    await chatBadgeStore.loadUnreadCount()
    unreadCount.value = chatBadgeStore.unreadCount
    return unreadCount.value
  }

  return {
    conversations,
    messages,
    searchResults,
    loading,
    searchLoading,
    error,
    unreadCount,
    hasMore,
    fetchConversations,
    fetchMessages,
    fetchOlderMessages,
    searchMessages,
    sendMessage,
    markAsRead,
    subscribeToMessages,
    subscribeToReadReceipts,
    unsubscribe,
    uploadChatFile,
    getUnreadCount,
  }
}
