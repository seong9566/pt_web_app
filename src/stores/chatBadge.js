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
   * 캐시 무효화 — 다음 조회 시 강제 새로고침
   */
  function invalidate() {
    lastFetchedAt.value = null
  }

  /**
   * 스토어 상태 초기화
   */
  function $reset() {
    unreadCount.value = 0
    lastFetchedAt.value = null
  }

  return {
    unreadCount,
    lastFetchedAt,
    loadUnreadCount,
    invalidate,
    $reset,
  }
})
