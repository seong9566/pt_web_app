/**
 * 예약 자동 완료 폴백 composable
 *
 * pg_cron 미작동 시 안전망 역할.
 * 클라이언트에서 1분 쓰로틀로 auto_complete_past_reservations RPC 호출.
 */
import { supabase } from '@/lib/supabase'

const THROTTLE_MS = 60_000 // 1분
let _lastCalledAt = 0

/**
 * 종료 시간이 지난 예약을 completed로 전환하는 RPC 호출 (1분 쓰로틀)
 * 이미 completed인 예약은 트리거 조건(old.status <> 'completed')으로 중복 차감 방지됨
 */
export async function triggerAutoComplete() {
  const now = Date.now()
  if (now - _lastCalledAt < THROTTLE_MS) return
  _lastCalledAt = now

  const { error } = await supabase.rpc('auto_complete_past_reservations')
  if (error) {
    console.warn('[useAutoComplete] RPC 호출 실패:', error.message)
  }
}
