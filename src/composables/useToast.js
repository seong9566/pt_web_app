import { useToastStore } from '@/stores/toast'

export function useToast() {
  const toastStore = useToastStore()

  function showToast(msg, type = 'info', duration = 3000) {
    toastStore.showToast(msg, type, duration)
  }

  function hideToast() {
    toastStore.hideToast()
  }

  function showError(msg) {
    toastStore.showToast(msg, 'error', 3000)
  }

  /**
   * 성공 토스트 표시
   * @param {string} msg - 메시지
   * @param {{ action: { label: string, handler: Function } }} [options] - 액션 버튼 옵션
   */
  function showSuccess(msg, options) {
    const duration = options?.action ? 5000 : 3000
    toastStore.showToast(msg, 'success', duration, options?.action || null)
  }

  return { showToast, hideToast, showError, showSuccess }
}
