/**
 * 알림 관리 컴포저블
 *
 * 사용자 알림 목록 조회(30일 이내), 읽음 처리, 알림 생성 기능 제공.
 * createNotification은 다른 컴포저블(usePayments, usePtSessions 등)에서 호출하는 유틸 함수.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useNotificationBadgeStore } from '@/stores/notificationBadge'

/** 알림 타입 → 한국어 라벨 매핑 */
const NOTIFICATION_TYPE_LABELS = {
  // 신규 타입
  availability_submitted: '가능 시간 등록',
  schedule_assigned: 'PT 일정 배정',
  change_requested: '일정 변경 요청',
  schedule_reassigned: '일정 재배정',
  availability_reminder: '가능 시간 등록 요청',
  // 레거시 타입
  reservation_requested: '예약 요청',
  reservation_approved: '예약 승인',
  reservation_rejected: '예약 거절',
  reservation_completed: '예약 완료',
  reservation_cancelled: '예약 취소',
}

/** 알림 관리 */
export function useNotifications() {
  const auth = useAuthStore()

  const notifications = ref([])
  const loading = ref(false)
  const error = ref(null)
  const unreadCount = ref(0)

  /** 30일 이내 알림 목록 조회 (최신순) */
  async function fetchNotifications() {
    loading.value = true
    error.value = null
    try {
      const sevenDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error: err } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', auth.user.id)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
      if (err) throw err
      notifications.value = data || []
      unreadCount.value = notifications.value.filter((n) => !n.is_read).length
    } catch (e) {
      error.value = e?.message ?? '알림을 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /** 미읽은 알림 수 조회 (배지용) */
  async function getUnreadCount() {
    const notificationBadgeStore = useNotificationBadgeStore()
    await notificationBadgeStore.loadUnreadCount()
    unreadCount.value = notificationBadgeStore.unreadCount
  }

  /** 개별 알림 읽음 처리 */
  async function markAsRead(notificationId) {
    try {
      const { error: err } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', auth.user.id)
      if (err) throw err
      const target = notifications.value.find((n) => n.id === notificationId)
      if (target) {
        target.is_read = true
        unreadCount.value = notifications.value.filter((n) => !n.is_read).length
      }
    } catch (e) {
      error.value = e?.message ?? '알림 읽음 처리에 실패했습니다'
    }
  }

  /** 전체 알림 읽음 처리 */
  async function markAllAsRead() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { error: err } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', auth.user.id)
        .eq('is_read', false)
        .gte('created_at', sevenDaysAgo)
      if (err) throw err
      notifications.value.forEach((n) => {
        n.is_read = true
      })
      unreadCount.value = 0
    } catch (e) {
      error.value = e?.message ?? '전체 읽음 처리에 실패했습니다'
    }
  }

  /**
   * 알림 생성 유틸 — 다른 컴포저블에서 호출
   * @param {string} userId - 알림 수신자 ID
   * @param {string} type - notification_type enum 값
   * @param {string} title - 알림 제목
   * @param {string} body - 알림 본문
   * @param {string|null} targetId - 연관 리소스 ID (예약 ID 등)
   * @param {string|null} targetType - 연관 리소스 타입 (예: 'reservation')
   */
  async function createNotification(userId, type, title, body, targetId = null, targetType = null) {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          body,
          target_id: targetId,
          target_type: targetType,
        })
      if (err) throw err
      return true
    } catch (e) {
      error.value = '알림 생성에 실패했습니다'
      return false
    }
  }

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
  }
}

export { NOTIFICATION_TYPE_LABELS }
