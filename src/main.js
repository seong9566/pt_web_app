/**
 * 앱 부트스트랩
 *
 * Vue 앱 생성 → Pinia(상태관리) → Router(라우팅) 등록 → Auth 초기화 → 마운트.
 * Auth 초기화를 마운트 전에 실행하여 새로고침 시 세션을 즉시 복원.
 */
import { createApp } from 'vue'
// 상태관리 
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import './assets/css/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore(pinia) // Pinia 인스턴스를 직접 전달하여 setup 밖에서도 사용 가능

;(async () => {
  await auth.initialize() // 세션 복원 완료 후 마운트 — 레이스 컨디션 방지
  await router.isReady() // 라우터 초기 네비게이션 완료 대기 - 새로고침 시 화면 하얗게 되는 현상 방지
  app.mount('#app')
})()
