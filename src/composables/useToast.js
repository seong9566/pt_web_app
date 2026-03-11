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

  function showSuccess(msg) {
    toastStore.showToast(msg, 'success', 3000)
  }

  return { showToast, hideToast, showError, showSuccess }
}
