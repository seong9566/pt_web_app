/**
 * Confirm 다이얼로그 스토어 (Pinia)
 *
 * 앱 전체의 확인 다이얼로그 상태를 관리하는 중앙 스토어.
 * 단일 AppConfirmDialog 인스턴스가 이 스토어를 구독하여 다이얼로그를 표시.
 *
 * 상태: visible, message, resolveCallback
 * 액션: show(msg), confirm(), cancel()
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfirmStore = defineStore('confirm', () => {
  const visible = ref(false)
  const message = ref('')
  const resolveCallback = ref(null)

  /**
   * 확인 다이얼로그 표시
   * @param {string} msg - 표시할 메시지
   * @returns {Promise<boolean>} 확인 시 true, 취소 시 false
   */
  function show(msg) {
    message.value = msg
    visible.value = true
    return new Promise((resolve) => {
      resolveCallback.value = resolve
    })
  }

  /**
   * 확인 버튼 클릭
   */
  function confirm() {
    visible.value = false
    resolveCallback.value?.(true)
  }

  /**
   * 취소 버튼 클릭
   */
  function cancel() {
    visible.value = false
    resolveCallback.value?.(false)
  }

  return { visible, message, show, confirm, cancel }
})
