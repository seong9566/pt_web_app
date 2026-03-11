# Learnings — reservation-duplicate-policy

## [2026-03-11] Session ses_3258a72feffepyAhte0xLwexOS — Plan Start

### Project Conventions
- Vue 3 + Vite + Pinia + Supabase (no TypeScript)
- `<script setup>` only — no Options API
- `@/` alias for all internal imports
- CSS Custom Properties — no hardcoded colors/sizes
- BEM class naming
- Views NEVER call Supabase directly — always via composables
- Error messages in Korean (한국어)

### Key File Locations
- DB schema: `supabase/schema.sql`
- Reservations composable: `src/composables/useReservations.js`
- Member reservation view: `src/views/member/MemberReservationView.vue`
- Trainer reservation manage: `src/views/trainer/ReservationManageView.vue`
- Notifications composable: `src/composables/useNotifications.js`

### DB State (pre-migration)
- Unique index: `reservations_unique_active_slot` on `(trainer_id, date, start_time) WHERE status IN ('pending', 'approved')`
- `create_reservation` RPC: catches `unique_violation` → 'Reservation time slot is already booked'
- `auto_complete_past_reservations`: only handles approved → completed
- `notification_type` enum: has `reservation_approved`, `reservation_rejected` (unused)
- `rejection_reason` column exists on reservations table

### Trigger Pattern (from auto_deduct_pt_session)
```sql
CREATE OR REPLACE FUNCTION public.auto_deduct_pt_session()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    -- action
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
Use same pattern: `NEW.status = 'approved' AND OLD.status <> 'approved'`

## [Task 1 완료] DB 마이그레이션
- 마이그레이션 이름: allow_duplicate_pending_reservations
- 실제 사용한 trainer_id: 9ac8d1de-db83-4fa4-a977-3b19946d8ad0
- 실제 사용한 member_id들: 1c156173-717c-4558-8d35-0e89a690ce0b, 3ced82bc-052d-49ed-8e45-4c667d597ded, db0443b1-5d32-442a-b7f5-d5c557662d8a
- QA 결과: 통과 (중복 pending 허용, 승인 시 경쟁 pending 자동 거절+알림 생성, approved 유니크 이중 승인 차단, 과거 pending cron 자동 거절)
- 주의사항: INSERT 직후 동일 CTE 내 일반 SELECT count(*)는 MVCC 스냅샷 영향으로 0이 보일 수 있어, 별도 SELECT로 pending_count 검증 필요

## [Task 2 완료] create_reservation RPC 수정
- 마이그레이션 이름: update_create_reservation_rpc
- 추가된 검증: approved 슬롯 충돌 체크, 동일 회원 중복 pending 체크
- 에러 메시지: 'Reservation time slot is already booked' (approved 충돌), 'Already requested this time slot' (중복 pending)
- QA 결과: 통과 (approved_exists=true 확인, 동일 회원 duplicate_pending_exists=true 확인, 다른 회원 동일 시간대 pending INSERT 성공, PT 잔여 remaining=0 및 함수 본문 검증 로직 유지 확인)

## [Task 3+4 완료] useReservations.js 수정
- fetchAvailableSlots: bookedRows 쿼리에 status 컬럼 추가, 3종 분류 로직 적용
- 슬롯 객체: { label, val, status: '가능'|'대기중'|'마감', pendingCount: number }
- ERROR_MESSAGES: 'Already requested this time slot' → '이미 해당 시간에 예약을 요청하셨습니다.' 추가
- ERROR_MESSAGES: 'Reservation time slot is already booked' → '해당 시간은 이미 예약이 확정되었습니다. 다른 시간을 선택해주세요.' 업데이트
- npm run build: 성공

## [Task 6 완료] ReservationManageView.vue 알림 추가
- useNotifications import 추가: createNotification 함수 사용
- handleApprove: 승인 성공 시 reservation_approved 알림 발송 (member_id, item.id)
- confirmReject: 거절 성공 시 reservation_rejected 알림 발송 (reason 포함)
- 주의: rejectReason.value는 초기화 전에 별도 변수(reason)에 캡처해야 함
- 자동 거절(트리거)은 DB에서 처리 → 프론트에서 중복 알림 없음
- item 객체에 member_id, date, start_time 필드 존재 확인 (fetchMyReservations 반환값)
- npm run build: 성공

## [Task 5 완료] MemberReservationView.vue UI 수정
- slotStatusText(time): '마감'|'대기중 N건'|'가능' 반환
- slotStatusClass(time): 'time-slot__status--closed'|'time-slot__status--pending'|'time-slot__status--available' 반환
- 오전/오후/저녁 3개 time-group 모두 동일하게 적용
- CSS: .time-slot__status--pending { color: var(--color-yellow) }
- CSS: .time-slot--pending { border: 1px solid var(--color-yellow) }
- npm run build: 성공

## [Task 7 완료] schema.sql 정규 스키마 업데이트
- 유니크 인덱스: reservations_unique_active_slot → reservations_unique_approved_slot (line 100)
  * 조건 변경: WHERE status IN ('pending', 'approved') → WHERE status = 'approved'
  * 효과: 동일 시간대 여러 pending 허용, approved는 유니크 유지
- 추가: auto_reject_competing_reservations 함수 + trg_auto_reject_competing 트리거 (line 1208-1239)
  * 승인 시 같은 시간대 pending 자동 거절 + 알림 생성
  * rejection_reason: '다른 회원의 예약이 승인되었습니다'
- 수정: auto_complete_past_reservations (line 1244-1262)
  * 기존: approved → completed 자동 변경
  * 추가: pending → rejected 자동 변경 (시간 경과 시)
  * rejection_reason: '예약 시간이 경과하여 자동 거절되었습니다'
- 수정: create_reservation RPC (line 1094-1115)
  * 추가: approved 슬롯 충돌 체크 (line 1094-1103)
  * 추가: 동일 회원 중복 pending 체크 (line 1105-1115)
  * 에러 메시지: 'Reservation time slot is already booked', 'Already requested this time slot'
- Evidence 파일 3개 생성: task-7-index-check.txt, task-7-trigger-check.txt, task-7-rpc-check.txt

## [Task 8 완료] Vitest 단위 테스트 업데이트
- 기존 슬롯 테스트: bookedQuery에 status 추가, 기대값에 pendingCount 추가
- 새 테스트: pending-only 슬롯 → status='대기중', pendingCount=2
- 새 테스트: 'Already requested this time slot' → 한국어 에러 메시지
- 새 테스트: 'Reservation time slot is already booked' → 한국어 에러 메시지
- npx vitest run: 모든 테스트 통과 (6 tests, 1 file)
