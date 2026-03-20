/**
 * Realtime 배너 스토어 (Pinia)
 *
 * Supabase Realtime 이벤트 수신 시 인앱 배너를 표시.
 * 단일 배너만 표시 (새 이벤트 시 기존 배너 교체).
 * 8초 후 자동 숨김.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRealtimeBannerStore = defineStore('realtimeBanner', () => {
  const visible = ref(false)
  const message = ref('')
  const targetRoute = ref(null) // 확인 탭 시 이동할 경로
  let _timer = null

  /** 배너 표시 (8초 후 자동 숨김) */
  function showBanner(msg, route = null) {
    clearTimeout(_timer)
    message.value = msg
    targetRoute.value = route
    visible.value = true
    _timer = setTimeout(hideBanner, 8000)
  }

  /** 배너 숨김 */
  function hideBanner() {
    visible.value = false
    clearTimeout(_timer)
  }

  return { visible, message, targetRoute, showBanner, hideBanner }
})
