/**
 * 채팅 미읽은 수 스토어 (Pinia)
 *
 * messages 테이블에서 미읽은 메시지 개수를 관리.
 * receiver_id = 현재 사용자, is_read = false 조건으로 조회.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export const useChatBadgeStore = defineStore('chatBadge', () => {
  const unreadCount = ref(0)
  const lastFetchedAt = ref(null)
  let _channel = null

  /**
   * messages 테이블에서 미읽은 메시지 개수 조회
   * @param {boolean} force - true면 캐시 무시하고 강제 조회
   */
  async function loadUnreadCount(force = false) {
    const auth = useAuthStore()
    if (!auth.user?.id) {
      unreadCount.value = 0
      return
    }

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', auth.user.id)
        .eq('is_read', false)

      if (error) throw error

      unreadCount.value = count ?? 0
      lastFetchedAt.value = Date.now()
    } catch (e) {
      console.error('[ChatBadgeStore] 미읽은 메시지 수 조회 실패:', e)
      unreadCount.value = 0
    }
  }

  /**
   * Supabase Realtime 구독 — 새 메시지 수신 시 unreadCount 즉시 증가
   * BottomNav 마운트 시 호출. 중복 구독 방지 내장.
   */
  function subscribe() {
    const auth = useAuthStore()
    if (!auth.user?.id || _channel) return

    _channel = supabase
      .channel(`chat-badge-${auth.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${auth.user.id}`,
        },
        () => {
          unreadCount.value += 1
        }
      )
      .subscribe()
  }

  /**
   * Realtime 구독 해제
   */
  function unsubscribe() {
    if (_channel) {
      supabase.removeChannel(_channel)
      _channel = null
    }
  }

  /**
   * 캐시 무효화 — 다음 조회 시 강제 새로고침
   */
  function invalidate() {
    lastFetchedAt.value = null
  }

  /**
   * 스토어 상태 초기화 + 구독 해제
   */
  function $reset() {
    unreadCount.value = 0
    lastFetchedAt.value = null
    unsubscribe()
  }

  return {
    unreadCount,
    lastFetchedAt,
    loadUnreadCount,
    subscribe,
    unsubscribe,
    invalidate,
    $reset,
  }
})
