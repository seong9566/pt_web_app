import { useRegisterSW } from 'virtual:pwa-register/vue'

/**
 * PWA 업데이트 감지 및 적용 composable
 * - needRefresh: 새 서비스워커가 대기 중일 때 true
 * - updateServiceWorker: 호출하면 새 버전으로 즉시 교체
 */
export function usePwaUpdate() {
  const { needRefresh, updateServiceWorker } = useRegisterSW()
  return { needRefresh, updateServiceWorker }
}
