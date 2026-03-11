/**
 * Toast 스토어 (Pinia)
 *
 * 앱 전체의 Toast 상태를 관리하는 중앙 스토어.
 * 단일 AppToast 인스턴스가 이 스토어를 구독하여 메시지를 표시.
 *
 * 상태: message, type, visible
 * 액션: showToast(message, type, duration), hideToast()
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const type = ref('info') // 'info' | 'success' | 'error'
  const visible = ref(false)
  let _timer = null

  /**
   * Toast 표시
   * @param {string} msg - 표시할 메시지
   * @param {string} toastType - 타입 ('info' | 'success' | 'error')
   * @param {number} duration - 표시 시간 (ms, 기본값 3000)
   */
  function showToast(msg, toastType = 'info', duration = 3000) {
    message.value = msg
    type.value = toastType
    visible.value = true

    clearTimeout(_timer)
    _timer = setTimeout(() => {
      hideToast()
    }, duration)
  }

  /**
   * Toast 숨김
   */
  function hideToast() {
    visible.value = false
    clearTimeout(_timer)
  }

  return {
    message,
    type,
    visible,
    showToast,
    hideToast,
  }
})
