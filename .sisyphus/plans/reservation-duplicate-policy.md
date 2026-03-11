# 예약 중복 허용 + 트레이너 선택 정책

## TL;DR

> **Quick Summary**: PT 예약 충돌 정책을 "선착순 선점(pending+approved 유니크)"에서 "중복 허용 + 트레이너 선택(approved만 유니크)"으로 변경. 같은 시간대에 여러 회원이 pending 예약 가능, 트레이너가 1명 승인 시 나머지 자동 거절 + 알림 발송.
> 
> **Deliverables**:
> - DB 마이그레이션: 유니크 인덱스 교체 + 자동 거절 트리거 + 알림 생성 + 과거 pending 자동 정리
> - `create_reservation` RPC 수정: approved만 충돌 검사 + 동일 회원 중복 차단
> - `useReservations.js` composable: pending 카운트 반환 + 슬롯 상태 3종 분류
> - `MemberReservationView.vue`: "대기중 N건" 표시 + 경쟁 상황 안내
> - `ReservationManageView.vue`: 승인/거절 시 알림 발송 + UI 갱신
> - `useReservations.js` 에러 매핑 업데이트
> - Vitest 단위 테스트 (composable 레이어)
> - `schema.sql` 정규 스키마 업데이트
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (DB 마이그레이션) → Task 2 (RPC 수정) → Task 3 (Composable) → Task 5 (회원 UI) → Task 8 (테스트)

---

## Context

### Original Request
사용자 요청 3번: "A회원이 9시 예약을 했고, 트레이너가 아직 수락을 하지 않았어. 예약을 승인 전이라면 B회원이 동일하게 9시에 예약에 대해선 보통 정책을 어떻게 가져가는게 나을까?"

사용자 결정: **중복 허용 + 트레이너 선택** 정책 채택.

### Interview Summary
**Key Discussions**:
- 정책: 선착순 선점 → 중복 허용 + 트레이너 선택
- 자동 거절: DB 트리거로 구현 (트레이너가 1명 승인 → 나머지 pending 자동 rejected)
- 알림: 자동 거절 시 알림 + 수동 승인/거절 시에도 알림 (reservation_approved, reservation_rejected 모두)
- 동일 회원 중복: 같은 회원이 같은 시간대에 중복 pending 불가 (RPC에서 차단)
- 테스트: 구현 후 Vitest 단위 테스트 추가
- 슬롯 표시: approved → 마감(disabled), pending only → 대기중 N건(selectable), nothing → 가능(selectable)

**Research Findings**:
- `notification_type` enum에 `reservation_approved`, `reservation_rejected` 이미 정의됨 (schema.sql:914) — 사용된 적 없음
- `rejection_reason` 컬럼 존재 (schema.sql:93)
- `auto_deduct_pt_session` 트리거 패턴 참조 가능 (schema.sql:1167-1182)
- `auto_complete_past_reservations` cron은 approved만 처리 — pending 자동 정리 추가 필요
- 기존 `handleApprove`는 단순 `updateReservationStatus(item.id, 'approved')` 호출 (ReservationManageView.vue:378-389)

### Metis Review
**Identified Gaps** (addressed):
- 동일 회원 중복 방지 → RPC에 explicit check 추가
- approved 슬롯에 신규 pending 차단 → RPC에 approved 존재 체크 추가
- 과거 pending 자동 정리 → cron job에 pending 자동 거절 추가
- 트리거 무한 재귀 방지 → `NEW.status = 'approved' AND OLD.status <> 'approved'` 조건
- Race condition (동시 승인) → approved-only 유니크 인덱스가 방어 + unique_violation 에러 핸들링
- 수동 승인/거절 알림 → 이번 스코프에 포함 (사용자 확정)
- 알림 내용 → 구체적 title/body 정의

---

## Work Objectives

### Core Objective
PT 예약 시간 충돌 정책을 "선착순 선점"에서 "중복 허용 + 트레이너 선택"으로 전환하여, 같은 시간대에 여러 회원이 예약 요청할 수 있고 트레이너가 최종 선택하는 워크플로우를 구현한다.

### Concrete Deliverables
- DB 마이그레이션 SQL (Supabase MCP로 적용)
- 수정된 `supabase/schema.sql` (정규 스키마 파일)
- 수정된 `src/composables/useReservations.js` (슬롯 조회 + 에러 매핑)
- 수정된 `src/views/member/MemberReservationView.vue` (대기중 N건 UI)
- 수정된 `src/views/member/MemberReservationView.css` (대기중 스타일)
- 수정된 `src/views/trainer/ReservationManageView.vue` (승인/거절 알림)
- 새 테스트 파일 `src/composables/__tests__/useReservations.test.js`

### Definition of Done
- [ ] 같은 시간대에 2명의 회원이 pending 예약 생성 가능
- [ ] 트레이너가 1명 승인 시 나머지 pending 자동 rejected 처리
- [ ] 자동 거절된 회원에게 notification 생성됨
- [ ] 수동 승인/거절 시에도 회원에게 notification 생성됨
- [ ] 회원 예약 화면에서 pending 슬롯에 "대기중 N건" 표시
- [ ] approved 슬롯은 "마감"으로 표시 (disabled)
- [ ] 동일 회원이 같은 시간대에 중복 pending 불가
- [ ] `npm run build` 성공
- [ ] Vitest 테스트 통과

### Must Have
- 유니크 인덱스를 `approved` 전용으로 교체
- 자동 거절 DB 트리거 (SECURITY DEFINER + SET search_path = public)
- 자동 거절 시 notification INSERT (트리거 내에서)
- `create_reservation` RPC: approved 충돌 체크 + 동일 회원 pending 중복 체크
- `fetchAvailableSlots`에서 pending count 반환
- 슬롯 3종 분류: 가능 / 대기중 N건 / 마감
- 수동 승인/거절 시 `createNotification` 호출
- 에러 메시지 한국어
- 과거 pending 자동 정리 (cron job 수정)

### Must NOT Have (Guardrails)
- ❌ `trg_auto_deduct_pt` 트리거 변경 금지 — PT 횟수 차감 로직에 영향 없어야 함
- ❌ reservation_status enum 변경 금지 — 'rejected' 이미 존재
- ❌ 실시간(Realtime) 구독 추가 금지 — 이번 스코프 아님
- ❌ 예약 "우선순위" 또는 "랭킹" 시스템 금지
- ❌ `MemberScheduleView.vue` 또는 `TrainerScheduleView.vue` 캘린더 dot 로직 변경 금지
- ❌ 회원측 pending 예약 취소 기능 추가 금지 (별도 스코프)
- ❌ 트레이너 예약 관리 UI 레이아웃 전면 리디자인 금지 — 알림 기능만 추가
- ❌ Options API 사용 금지 — `<script setup>` only
- ❌ Supabase 직접 호출 금지 — composable 경유 필수
- ❌ CSS 하드코딩 금지 — CSS Custom Properties 사용

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest 설정됨, `src/composables/__tests__/` 디렉토리 존재)
- **Automated tests**: YES (구현 후 테스트 추가)
- **Framework**: Vitest (`npm test` / `npx vitest run`)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **DB 변경**: Bash (`mcp_supabase_execute_sql`) — SQL 쿼리 실행, 결과 assert
- **Frontend**: Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Build**: Bash (`npm run build`) — 빌드 성공 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — DB 기반):
├── Task 1: DB 마이그레이션 (인덱스 교체 + 트리거 + cron 수정) [deep]
└── Task 2: create_reservation RPC 수정 [deep]

Wave 2 (After Wave 1 — Composable + UI, MAX PARALLEL):
├── Task 3: fetchAvailableSlots 수정 (pending count 반환) [unspecified-high]
├── Task 4: 에러 매핑 업데이트 + 새 에러 메시지 [quick]
├── Task 5: MemberReservationView 대기중 N건 UI [visual-engineering]
└── Task 6: ReservationManageView 승인/거절 알림 [unspecified-high]

Wave 3 (After Wave 2 — 정리 + 테스트):
├── Task 7: schema.sql 정규 스키마 업데이트 [quick]
└── Task 8: Vitest 단위 테스트 [unspecified-high]

Wave FINAL (After ALL tasks — 검증):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 3 → Task 5 → Task 8 → F1-F4
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 4 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2, 3, 4, 5, 6, 7 | 1 |
| 2 | 1 | 3, 4, 5, 8 | 1 |
| 3 | 1, 2 | 5, 8 | 2 |
| 4 | 2 | 8 | 2 |
| 5 | 3 | 8 | 2 |
| 6 | 1 | 8 | 2 |
| 7 | 1, 2 | — | 3 |
| 8 | 3, 4, 5, 6 | F1-F4 | 3 |
| F1-F4 | ALL | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **2 tasks** — T1 → `deep`, T2 → `deep`
- **Wave 2**: **4 tasks** — T3 → `unspecified-high`, T4 → `quick`, T5 → `visual-engineering`, T6 → `unspecified-high`
- **Wave 3**: **2 tasks** — T7 → `quick`, T8 → `unspecified-high`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

- [x] 1. DB 마이그레이션: 유니크 인덱스 교체 + 자동 거절 트리거 + cron 수정

  **What to do**:
  - **Step 1**: 기존 유니크 인덱스 삭제
    ```sql
    DROP INDEX IF EXISTS public.reservations_unique_active_slot;
    ```
  - **Step 2**: approved 전용 유니크 인덱스 생성
    ```sql
    CREATE UNIQUE INDEX reservations_unique_approved_slot
      ON public.reservations (trainer_id, date, start_time)
      WHERE status = 'approved';
    ```
  - **Step 3**: 자동 거절 트리거 함수 생성
    ```sql
    CREATE OR REPLACE FUNCTION public.auto_reject_competing_reservations()
    RETURNS trigger AS $$
    BEGIN
      IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
        -- 같은 (trainer_id, date, start_time)의 다른 pending 예약을 rejected로 변경
        UPDATE public.reservations
        SET status = 'rejected',
            rejection_reason = '다른 회원의 예약이 승인되었습니다',
            updated_at = now()
        WHERE trainer_id = NEW.trainer_id
          AND date = NEW.date
          AND start_time = NEW.start_time
          AND id <> NEW.id
          AND status = 'pending';

        -- 자동 거절된 회원에게 알림 생성
        INSERT INTO public.notifications (user_id, type, title, body, target_id, target_type)
        SELECT member_id, 'reservation_rejected',
               '예약이 자동 거절되었습니다',
               NEW.date || ' ' || NEW.start_time || ' 예약이 다른 회원의 승인으로 인해 자동 거절되었습니다.',
               id, 'reservation'
        FROM public.reservations
        WHERE trainer_id = NEW.trainer_id
          AND date = NEW.date
          AND start_time = NEW.start_time
          AND id <> NEW.id
          AND status = 'rejected'
          AND rejection_reason = '다른 회원의 예약이 승인되었습니다';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    ```
    **주의**: 트리거 순서 — UPDATE를 먼저 하고, 그 결과를 SELECT해서 알림 INSERT. UPDATE 후 status='rejected'이고 rejection_reason이 일치하는 행을 SELECT하면 방금 거절된 행들만 가져옴.
    **대안 (더 안전)**: UPDATE ... RETURNING member_id, id를 CTE로 사용:
    ```sql
    WITH rejected AS (
      UPDATE public.reservations
      SET status = 'rejected',
          rejection_reason = '다른 회원의 예약이 승인되었습니다',
          updated_at = now()
      WHERE trainer_id = NEW.trainer_id
        AND date = NEW.date
        AND start_time = NEW.start_time
        AND id <> NEW.id
        AND status = 'pending'
      RETURNING id, member_id
    )
    INSERT INTO public.notifications (user_id, type, title, body, target_id, target_type)
    SELECT member_id, 'reservation_rejected',
           '예약이 자동 거절되었습니다',
           NEW.date || ' ' || NEW.start_time || ' 예약이 다른 회원의 승인으로 인해 자동 거절되었습니다.',
           id, 'reservation'
    FROM rejected;
    ```
    **이 CTE 패턴을 사용할 것** — atomic하고 race-condition 안전.

  - **Step 4**: 트리거 등록
    ```sql
    DROP TRIGGER IF EXISTS trg_auto_reject_competing ON public.reservations;
    CREATE TRIGGER trg_auto_reject_competing
    AFTER UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_reject_competing_reservations();
    ```
  - **Step 5**: `auto_complete_past_reservations` cron 함수에 과거 pending 자동 거절 추가
    ```sql
    CREATE OR REPLACE FUNCTION public.auto_complete_past_reservations()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      -- 기존: 과거 approved → completed
      UPDATE reservations
      SET status = 'completed'
      WHERE status = 'approved'
        AND (date + end_time) < (now() AT TIME ZONE 'Asia/Seoul');

      -- 추가: 과거 pending → rejected (시간 경과 자동 거절)
      UPDATE reservations
      SET status = 'rejected',
          rejection_reason = '예약 시간이 경과하여 자동 거절되었습니다'
      WHERE status = 'pending'
        AND (date + end_time) < (now() AT TIME ZONE 'Asia/Seoul');
    END;
    $$;
    ```
  - 모든 SQL을 **단일 마이그레이션**으로 `mcp_supabase_apply_migration`을 통해 적용
  - 마이그레이션 이름: `allow_duplicate_pending_reservations`

  **Must NOT do**:
  - `trg_auto_deduct_pt` 트리거 수정/삭제 금지
  - `reservation_status` enum 변경 금지
  - `notification_type` enum 변경 금지 (이미 `reservation_rejected` 존재)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: DB 마이그레이션은 트리거 함수, CTE, 인덱스 교체를 포함하는 복잡한 SQL 작업
  - **Skills**: []
    - Supabase MCP는 기본 제공, 추가 스킬 불필요
  - **Skills Evaluated but Omitted**:
    - `playwright`: DB 작업이므로 브라우저 불필요

  **Parallelization**:
  - **Can Run In Parallel**: NO (Task 2와 순차 — RPC도 동일 함수 교체)
  - **Parallel Group**: Wave 1 (Task 2와 순차)
  - **Blocks**: Task 2, 3, 4, 5, 6, 7
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `supabase/schema.sql:1167-1182` — `auto_deduct_pt_session()` 트리거 함수 패턴. SECURITY DEFINER + AFTER UPDATE + status 변경 조건 체크. 이 패턴을 그대로 따를 것.
  - `supabase/schema.sql:1187-1199` — `auto_complete_past_reservations()` cron 함수. 이 함수에 pending 자동 거절 로직을 추가.
  - `supabase/schema.sql:1178-1182` — 트리거 등록 패턴 (DROP IF EXISTS → CREATE TRIGGER).

  **API/Type References**:
  - `supabase/schema.sql:100-102` — 현재 유니크 인덱스 정의. 이것을 삭제하고 approved-only로 교체.
  - `supabase/schema.sql:911-921` — `notification_type` enum 정의. `reservation_rejected` 확인.
  - `supabase/schema.sql:923-940` — notifications 테이블 구조. INSERT 시 필요한 컬럼: `user_id`, `type`, `title`, `body`, `target_id`, `target_type`.
  - `supabase/schema.sql:85-102` — reservations 테이블 구조. `rejection_reason` 컬럼 확인 (line 93).

  **WHY Each Reference Matters**:
  - `auto_deduct_pt_session` — 동일한 AFTER UPDATE 트리거 패턴. status 변경 조건(`NEW.status = X AND OLD.status <> X`) 사용 방법 참조
  - 유니크 인덱스 — 정확한 DROP/CREATE 문 작성에 현재 인덱스 이름 필요
  - notifications 테이블 — 트리거 내 INSERT 문 작성 시 정확한 컬럼명/타입 필요

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 동일 시간대 2개 pending 예약 생성 가능
    Tool: Bash (mcp_supabase_execute_sql)
    Preconditions: reservations 테이블에 해당 시간대 기존 예약 없음
    Steps:
      1. INSERT INTO reservations (trainer_id, member_id, date, start_time, end_time, status, session_type) VALUES ('test-trainer', 'member-A', '2026-04-01', '10:00', '11:00', 'pending', 'PT') — 성공
      2. INSERT INTO reservations (trainer_id, member_id, date, start_time, end_time, status, session_type) VALUES ('test-trainer', 'member-B', '2026-04-01', '10:00', '11:00', 'pending', 'PT') — 성공
      3. SELECT count(*) FROM reservations WHERE trainer_id='test-trainer' AND date='2026-04-01' AND start_time='10:00' AND status='pending'
    Expected Result: count = 2 (두 INSERT 모두 unique_violation 없이 성공)
    Failure Indicators: unique_violation 에러 발생, count != 2
    Evidence: .sisyphus/evidence/task-1-duplicate-pending.txt

  Scenario: 승인 시 자동 거절 트리거 동작
    Tool: Bash (mcp_supabase_execute_sql)
    Preconditions: 위 시나리오 완료 (2개 pending 존재)
    Steps:
      1. UPDATE reservations SET status='approved' WHERE trainer_id='test-trainer' AND date='2026-04-01' AND start_time='10:00' AND member_id='member-A'
      2. SELECT status, rejection_reason FROM reservations WHERE trainer_id='test-trainer' AND date='2026-04-01' AND start_time='10:00' AND member_id='member-B'
      3. SELECT type, user_id, title FROM notifications WHERE user_id='member-B' ORDER BY created_at DESC LIMIT 1
    Expected Result:
      - Step 2: status='rejected', rejection_reason='다른 회원의 예약이 승인되었습니다'
      - Step 3: type='reservation_rejected', user_id='member-B', title='예약이 자동 거절되었습니다'
    Failure Indicators: member-B의 status가 여전히 'pending', notification 미생성
    Evidence: .sisyphus/evidence/task-1-auto-reject-trigger.txt

  Scenario: approved 유니크 인덱스 — 이중 승인 차단
    Tool: Bash (mcp_supabase_execute_sql)
    Preconditions: 새로운 테스트 데이터 (3개 pending)
    Steps:
      1. 3개 pending 예약 INSERT (member-A, member-B, member-C 동일 시간대)
      2. UPDATE member-A → approved (성공)
      3. 수동으로 member-C의 status를 'approved'로 UPDATE 시도
    Expected Result: Step 3에서 unique_violation 에러 발생
    Failure Indicators: 두 번째 approved가 성공 (유니크 인덱스 미작동)
    Evidence: .sisyphus/evidence/task-1-unique-approved.txt

  Scenario: 과거 pending 자동 거절 (cron 함수)
    Tool: Bash (mcp_supabase_execute_sql)
    Preconditions: 과거 날짜에 pending 예약 INSERT
    Steps:
      1. INSERT 과거 날짜(어제) pending 예약
      2. SELECT auto_complete_past_reservations()
      3. SELECT status, rejection_reason FROM reservations WHERE id = (위 예약 ID)
    Expected Result: status='rejected', rejection_reason='예약 시간이 경과하여 자동 거절되었습니다'
    Evidence: .sisyphus/evidence/task-1-cron-pending-cleanup.txt
  ```

  **Evidence to Capture:**
  - [ ] task-1-duplicate-pending.txt — SQL 실행 결과
  - [ ] task-1-auto-reject-trigger.txt — 트리거 동작 확인
  - [ ] task-1-unique-approved.txt — 유니크 인덱스 검증
  - [ ] task-1-cron-pending-cleanup.txt — cron 함수 검증

  **Commit**: YES (groups with Task 2)
  - Message: `feat(reservation): allow duplicate pending reservations with auto-reject trigger`
  - Files: (migration applied via Supabase MCP)
  - Pre-commit: QA 시나리오 모두 통과

- [x] 2. create_reservation RPC 수정: approved 충돌 검사 + 동일 회원 중복 차단

  **What to do**:
  - `create_reservation` RPC 함수 수정 (Supabase MCP migration으로 적용)
  - **변경 1**: 기존 `unique_violation` exception handler 유지하되, 에러 메시지를 상황에 맞게 유지
  - **변경 2**: INSERT 전에 approved 슬롯 존재 여부 체크 추가:
    ```sql
    -- approved 슬롯 존재 시 차단
    IF EXISTS (
      SELECT 1 FROM public.reservations
      WHERE trainer_id = p_trainer_id
        AND date = p_date
        AND start_time = p_start_time
        AND status = 'approved'
    ) THEN
      RAISE EXCEPTION 'Reservation time slot is already booked';
    END IF;
    ```
  - **변경 3**: 동일 회원 중복 pending 체크 추가:
    ```sql
    -- 동일 회원 동일 시간대 중복 pending 차단
    IF EXISTS (
      SELECT 1 FROM public.reservations
      WHERE trainer_id = p_trainer_id
        AND member_id = v_member_id
        AND date = p_date
        AND start_time = p_start_time
        AND status = 'pending'
    ) THEN
      RAISE EXCEPTION 'Already requested this time slot';
    END IF;
    ```
  - **변경 4**: `unique_violation` exception handler의 에러 메시지 유지 (approved-only 유니크 인덱스 위반 시 발생)
  - 최종 함수 구조:
    1. 인증 확인
    2. 시간 유효성 (start < end)
    3. 트레이너-회원 연결 확인
    4. PT 잔여 횟수 확인
    5. **NEW**: approved 슬롯 충돌 확인
    6. **NEW**: 동일 회원 중복 pending 확인
    7. INSERT
    8. exception: unique_violation → 에러 메시지

  **Must NOT do**:
  - PT 잔여 횟수 확인 로직 제거 금지
  - 트레이너-회원 연결 확인 로직 제거 금지
  - 함수 시그니처(파라미터) 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: RPC 함수 수정은 기존 로직을 정확히 보존하면서 새 검증 추가 필요
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: DB 작업이므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: NO (Task 1 이후 순차)
  - **Parallel Group**: Wave 1 (Task 1 직후)
  - **Blocks**: Task 3, 4, 5, 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `supabase/schema.sql:1050-1125` — 현재 `create_reservation` RPC 전체 코드. 이 함수를 수정할 것. 기존 검증 순서(인증 → 시간 → 연결 → PT횟수) 유지하고 그 뒤에 새 검증 추가.

  **API/Type References**:
  - `supabase/schema.sql:100-102` — 기존 유니크 인덱스 (Task 1에서 삭제됨). `unique_violation`이 이제 approved-only 인덱스에서만 발생함을 인지.
  - `src/composables/useReservations.js:199-203` — 프론트엔드 에러 매핑. RPC에서 발생시키는 에러 문자열이 이 매핑과 일치해야 함.

  **WHY Each Reference Matters**:
  - 현재 RPC 코드 — 어떤 검증이 있는지, 어디에 새 검증을 추가할지 파악
  - 에러 매핑 — RPC에서 raise하는 에러 메시지 문자열이 프론트엔드 매핑과 정확히 일치해야 함

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: approved 슬롯에 새 예약 차단
    Tool: Bash (mcp_supabase_execute_sql)
    Preconditions: 특정 시간대에 approved 예약 1건 존재
    Steps:
      1. approved 예약 확인 (trainer-X, 2026-04-02, 10:00)
      2. 다른 member로 create_reservation RPC 호출 (같은 시간대)
    Expected Result: 'Reservation time slot is already booked' 에러 발생
    Failure Indicators: 예약이 성공적으로 생성됨
    Evidence: .sisyphus/evidence/task-2-approved-block.txt

  Scenario: 동일 회원 중복 pending 차단
    Tool: Bash (mcp_supabase_execute_sql)
    Preconditions: member-A가 특정 시간대에 pending 예약 1건 존재
    Steps:
      1. member-A로 동일 시간대에 create_reservation RPC 재호출
    Expected Result: 'Already requested this time slot' 에러 발생
    Failure Indicators: 중복 pending 예약이 생성됨
    Evidence: .sisyphus/evidence/task-2-same-member-duplicate.txt

  Scenario: 다른 회원은 동일 시간대 pending 가능
    Tool: Bash (mcp_supabase_execute_sql)
    Preconditions: member-A가 특정 시간대에 pending 1건
    Steps:
      1. member-B로 동일 시간대에 create_reservation RPC 호출
    Expected Result: 예약 UUID 반환 (성공)
    Failure Indicators: 에러 발생
    Evidence: .sisyphus/evidence/task-2-different-member-ok.txt

  Scenario: PT 잔여 횟수 검증 여전히 동작
    Tool: Bash (mcp_supabase_execute_sql)
    Preconditions: PT 잔여 횟수 0인 회원
    Steps:
      1. 해당 회원으로 create_reservation RPC 호출
    Expected Result: 'PT 잔여 횟수가 부족합니다' 에러 발생
    Evidence: .sisyphus/evidence/task-2-pt-count-check.txt
  ```

  **Evidence to Capture:**
  - [ ] task-2-approved-block.txt
  - [ ] task-2-same-member-duplicate.txt
  - [ ] task-2-different-member-ok.txt
  - [ ] task-2-pt-count-check.txt

  **Commit**: YES (groups with Task 1)
  - Message: `feat(reservation): allow duplicate pending reservations with auto-reject trigger`
  - Files: (migration applied via Supabase MCP)
  - Pre-commit: QA 시나리오 모두 통과

- [ ] 3. fetchAvailableSlots 수정: pending count 반환 + 슬롯 상태 3종 분류

  **What to do**:
  - `src/composables/useReservations.js`의 `fetchAvailableSlots` 함수 수정
  - **변경 1**: `bookedRows` 쿼리에서 `status` 컬럼도 함께 조회:
    ```js
    const { data: bookedRows, error: bookedError } = await supabase
      .from('reservations')
      .select('start_time, end_time, status')  // status 추가
      .eq('trainer_id', trainerId)
      .eq('date', dateStr)
      .in('status', ['pending', 'approved'])
    ```
  - **변경 2**: 슬롯 상태 분류 로직 변경 — 기존 binary (가능/마감) → 3종 분류:
    ```js
    const normalized = generatedSlots.map((slot) => {
      const slotStartMinutes = toMinutes(slot.start)
      const slotEndMinutes = toMinutes(slot.end)

      const overlapping = (bookedRows ?? []).filter((row) => {
        const rStart = toMinutes(row.start_time)
        const rEnd = toMinutes(row.end_time)
        return slotStartMinutes < rEnd && rStart < slotEndMinutes
      })

      const hasApproved = overlapping.some((r) => r.status === 'approved')
      const pendingCount = overlapping.filter((r) => r.status === 'pending').length

      let status = '가능'
      if (hasApproved) {
        status = '마감'
      } else if (pendingCount > 0) {
        status = '대기중'
      }

      return {
        label: slot.label,
        val: slot.val,
        status,
        pendingCount,  // 새 필드: pending 예약 수
      }
    })
    ```
  - **변경 3**: `bookedRanges` 중간 변수 제거 — 위 로직에서 `bookedRows`를 직접 사용
  - 기존 `slots.value` 구조 (am/pm/evening 분류)는 그대로 유지
  - 기존 반환 형태 유지 — 각 슬롯 객체에 `pendingCount` 필드 추가만

  **Must NOT do**:
  - `fetchAvailableSlots` 함수 시그니처 변경 금지
  - `slots` ref의 am/pm/evening 구조 변경 금지
  - 다른 함수들 (`createReservation`, `updateReservationStatus` 등) 수정 금지 — 이 태스크 범위 아님

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: composable 로직 수정으로 기존 데이터 흐름을 이해하고 정확히 변경해야 함
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: composable 수정이므로 브라우저 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 4, 6과 병렬)
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Task 5, 8
  - **Blocked By**: Task 1, 2

  **References**:

  **Pattern References**:
  - `src/composables/useReservations.js:125-152` — 현재 `bookedRows` 쿼리 + `bookedRanges` + `normalized` 매핑 로직. 이 전체를 교체할 것.
  - `src/composables/useReservations.js:154-167` — am/pm/evening 분류 reduce. 이 부분은 변경 없이 유지하되, `pendingCount`가 각 슬롯 객체에 포함된 채로 분류됨.

  **API/Type References**:
  - `src/views/member/MemberReservationView.vue:58-136` — 슬롯 UI에서 `time.status` 값으로 '가능'/'마감' 체크. 새 '대기중' 상태와 `pendingCount` 활용 필요 (Task 5에서 처리).

  **WHY Each Reference Matters**:
  - `bookedRows` 쿼리 — status 컬럼 추가 위치와 기존 필터링 로직 파악
  - `normalized` 매핑 — 기존 binary 판단을 3종 분류로 변경하는 정확한 위치
  - UI 참조 — composable이 반환하는 데이터 형태가 UI와 호환되는지 확인

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: approved 슬롯은 '마감' 반환
    Tool: Bash (npm run build 후 수동 검증 또는 테스트)
    Preconditions: 특정 날짜에 approved 예약 1건 (10:00)
    Steps:
      1. fetchAvailableSlots(trainerId, dateStr) 호출
      2. 10:00 슬롯의 status 확인
    Expected Result: status = '마감', pendingCount = 0
    Evidence: .sisyphus/evidence/task-3-approved-slot.txt

  Scenario: pending-only 슬롯은 '대기중' + pendingCount 반환
    Tool: Bash
    Preconditions: 특정 날짜에 pending 예약 2건 (11:00), approved 없음
    Steps:
      1. fetchAvailableSlots(trainerId, dateStr) 호출
      2. 11:00 슬롯의 status, pendingCount 확인
    Expected Result: status = '대기중', pendingCount = 2
    Evidence: .sisyphus/evidence/task-3-pending-slot.txt

  Scenario: 빈 슬롯은 '가능' 반환
    Tool: Bash
    Preconditions: 특정 날짜에 해당 시간대 예약 없음
    Steps:
      1. fetchAvailableSlots(trainerId, dateStr) 호출
      2. 빈 슬롯의 status, pendingCount 확인
    Expected Result: status = '가능', pendingCount = 0
    Evidence: .sisyphus/evidence/task-3-empty-slot.txt

  Scenario: npm run build 성공
    Tool: Bash (npm run build)
    Steps:
      1. npm run build
    Expected Result: 빌드 성공, 에러 없음
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Evidence to Capture:**
  - [ ] task-3-approved-slot.txt
  - [ ] task-3-pending-slot.txt
  - [ ] task-3-empty-slot.txt
  - [ ] task-3-build.txt

  **Commit**: YES (groups with Tasks 4, 5, 6)
  - Message: `feat(reservation): add pending count display and approval notifications`
  - Files: `src/composables/useReservations.js`
  - Pre-commit: `npm run build`

- [ ] 4. 에러 매핑 업데이트: 새 에러 메시지 한국어 매핑

  **What to do**:
  - `src/composables/useReservations.js`의 `createReservation` 함수 내 `ERROR_MESSAGES` 객체 수정
  - **변경 1**: 새 에러 메시지 추가:
    ```js
    const ERROR_MESSAGES = {
      'Reservation time slot is already booked': '해당 시간은 이미 예약이 확정되었습니다. 다른 시간을 선택해주세요.',
      'Already requested this time slot': '이미 해당 시간에 예약을 요청하셨습니다.',
      'No active trainer-member connection': '트레이너와의 연결이 활성화되지 않았습니다.',
      'End time must be later than start time': '예약 시간이 올바르지 않습니다.',
      'PT 잔여 횟수가 부족합니다. 예약이 불가능합니다.': 'PT 잔여 횟수가 부족합니다. 예약이 불가능합니다.',
    }
    ```
  - **변경 2**: 기존 `'Reservation time slot is already booked'` 메시지 수정 — "이미 예약되었습니다" → "이미 예약이 확정되었습니다" (approved 전용이므로 더 정확한 표현)

  **Must NOT do**:
  - `createReservation` 함수 시그니처 변경 금지
  - 에러 처리 flow 변경 금지 (try/catch 구조 유지)
  - 다른 함수 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단순 문자열 매핑 추가/변경
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 3, 5, 6과 병렬 가능하나, Task 3과 같은 파일 수정 → Task 3에 통합 추천)
  - **Parallel Group**: Wave 2 — **실행 시 Task 3에 통합 가능** (같은 파일 `useReservations.js`)
  - **Blocks**: Task 8
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/composables/useReservations.js:199-204` — 현재 ERROR_MESSAGES 객체. 이 객체를 수정/확장.

  **API/Type References**:
  - Task 2의 RPC에서 raise하는 에러 문자열: `'Reservation time slot is already booked'`, `'Already requested this time slot'`, `'No active trainer-member connection'`, `'End time must be later than start time'`, `'PT 잔여 횟수가 부족합니다. 예약이 불가능합니다.'`

  **WHY Each Reference Matters**:
  - ERROR_MESSAGES 객체 — RPC 에러 문자열과 1:1 매칭되어야 함. 하나라도 불일치하면 fallback 메시지 표시.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 'Already requested this time slot' 에러가 한국어로 표시
    Tool: Bash (npm run build 확인)
    Steps:
      1. ERROR_MESSAGES 객체에 'Already requested this time slot' 키 존재 확인
      2. 매핑 값이 '이미 해당 시간에 예약을 요청하셨습니다.' 인지 확인
    Expected Result: 키-값 일치
    Evidence: .sisyphus/evidence/task-4-error-mapping.txt

  Scenario: 'Reservation time slot is already booked' 메시지 업데이트 확인
    Tool: Bash (grep)
    Steps:
      1. useReservations.js에서 '이미 예약이 확정되었습니다' 문자열 존재 확인
    Expected Result: 문자열 존재
    Evidence: .sisyphus/evidence/task-4-updated-message.txt
  ```

  **Evidence to Capture:**
  - [ ] task-4-error-mapping.txt
  - [ ] task-4-updated-message.txt

  **Commit**: YES (groups with Tasks 3, 5, 6)
  - Message: `feat(reservation): add pending count display and approval notifications`
  - Files: `src/composables/useReservations.js`

- [ ] 5. MemberReservationView UI 수정: "대기중 N건" 표시 + 경쟁 상황 안내

  **What to do**:
  - `src/views/member/MemberReservationView.vue` 템플릿 수정
  - **변경 1**: 슬롯 버튼의 상태 표시 로직 변경 — 기존 '가능'/'마감' binary → '가능'/'대기중 N건'/'마감' 3종:
    - `time.status === '마감'` → disabled, 기존과 동일
    - `time.status === '대기중'` → 선택 가능(not disabled), "대기중 N건" 텍스트 표시
    - `time.status === '가능'` → 선택 가능, 기존과 동일
  - **변경 2**: 슬롯 버튼 disabled 조건 수정:
    ```html
    :disabled="time.status === '마감'"
    ```
    (기존과 동일 — '대기중'은 disabled가 아님)
  - **변경 3**: 슬롯 상태 텍스트 동적 표시:
    ```html
    <span class="time-slot__status" :class="slotStatusClass(time)">
      {{ slotStatusText(time) }}
    </span>
    ```
    스크립트에 헬퍼 함수 추가:
    ```js
    function slotStatusText(time) {
      if (time.status === '마감') return '마감'
      if (time.status === '대기중') return `대기중 ${time.pendingCount}건`
      return '가능'
    }

    function slotStatusClass(time) {
      if (time.status === '마감') return 'time-slot__status--closed'
      if (time.status === '대기중') return 'time-slot__status--pending'
      return 'time-slot__status--available'
    }
    ```
  - **변경 4**: 3개 time-group (오전/오후/저녁) 모두 동일하게 적용 — 현재 반복되는 코드이므로 3곳 모두 수정
  - `src/views/member/MemberReservationView.css` 수정:
    - **추가**: `.time-slot__status--pending` 스타일:
      ```css
      .time-slot__status--pending {
        color: var(--color-yellow);
        font-size: var(--fs-caption);
        font-weight: var(--fw-body1-bold);
      }
      ```
    - **추가**: `.time-slot--pending` 슬롯 자체 스타일 (선택적 — 대기중 슬롯 시각적 구분):
      ```css
      .time-slot--pending {
        border: 1px solid var(--color-yellow);
      }
      ```

  **Must NOT do**:
  - 슬롯 선택/해제 로직 변경 금지 (`selectTime` 함수 수정 없음)
  - 예약 제출 로직 (`submitReservation`) 변경 금지
  - 캘린더 컴포넌트 변경 금지
  - 오전/오후/저녁 분류 구조 변경 금지
  - Options API 사용 금지
  - CSS 하드코딩 금지 — var() 사용 필수

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 컴포넌트 수정 + CSS 스타일링 + 시각적 상태 분류
  - **Skills**: [`playwright`]
    - `playwright`: UI 변경 후 시각적 검증을 위해 스크린샷 캡처 필요
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 기존 디자인 시스템 내에서의 수정이므로 새 디자인 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 6과 병렬 — 다른 파일)
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 6)
  - **Blocks**: Task 8
  - **Blocked By**: Task 3 (composable이 pendingCount를 반환해야 UI에서 사용 가능)

  **References**:

  **Pattern References**:
  - `src/views/member/MemberReservationView.vue:55-136` — 현재 3개 time-group (오전/오후/저녁) 슬롯 버튼 코드. 3곳 모두 동일한 패턴 반복. 각 곳에서 `time.status === '마감'` 체크와 상태 텍스트 표시를 수정해야 함.
  - `src/views/member/MemberReservationView.vue:58-78` — 오전 슬롯 단일 버튼 예시. `:class`, `:disabled`, 상태 텍스트, 체크 아이콘 구조 파악.

  **API/Type References**:
  - Task 3에서 수정된 composable이 반환하는 슬롯 객체: `{ label, val, status: '가능'|'대기중'|'마감', pendingCount: number }`

  **External References**:
  - `src/assets/css/global.css` — `--color-yellow: #FFCC00` (대기중 상태 색상), `--fs-caption`, `--fw-body1-bold` (텍스트 스타일)

  **WHY Each Reference Matters**:
  - time-group 코드 — 3곳 반복되는 코드를 모두 수정해야 하므로 정확한 위치 파악 필수
  - 슬롯 객체 구조 — composable에서 반환되는 데이터 형태와 UI가 일치해야 함
  - CSS 변수 — 하드코딩 방지, 디자인 시스템 일관성

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 대기중 슬롯이 "대기중 2건" 텍스트로 표시
    Tool: Playwright (playwright skill)
    Preconditions: 특정 날짜/시간에 pending 예약 2건 존재 (DB에 사전 세팅)
    Steps:
      1. http://localhost:5173/member/reservation?date=2026-04-01 접속 (회원 로그인 상태)
      2. 해당 시간 슬롯 버튼의 `.time-slot__status` 텍스트 확인
      3. 해당 슬롯이 disabled가 아닌지 확인 (클릭 가능)
      4. 스크린샷 캡처
    Expected Result: 텍스트 "대기중 2건", 버튼 disabled=false, 노란색 텍스트
    Failure Indicators: "마감" 표시, disabled 상태, pending count 미표시
    Evidence: .sisyphus/evidence/task-5-pending-slot-ui.png

  Scenario: 마감 슬롯은 기존과 동일하게 disabled
    Tool: Playwright
    Preconditions: 특정 시간에 approved 예약 존재
    Steps:
      1. 해당 시간 슬롯의 disabled 상태 확인
      2. "마감" 텍스트 확인
    Expected Result: disabled=true, "마감" 텍스트
    Evidence: .sisyphus/evidence/task-5-closed-slot-ui.png

  Scenario: 가능 슬롯은 기존과 동일
    Tool: Playwright
    Preconditions: 해당 시간에 예약 없음
    Steps:
      1. 슬롯 "가능" 텍스트 확인
      2. 클릭 가능 확인
    Expected Result: "가능" 텍스트, 클릭 가능
    Evidence: .sisyphus/evidence/task-5-available-slot-ui.png

  Scenario: npm run build 성공
    Tool: Bash
    Steps: npm run build
    Expected Result: 에러 없이 빌드 성공
    Evidence: .sisyphus/evidence/task-5-build.txt
  ```

  **Evidence to Capture:**
  - [ ] task-5-pending-slot-ui.png — 대기중 슬롯 스크린샷
  - [ ] task-5-closed-slot-ui.png — 마감 슬롯 스크린샷
  - [ ] task-5-available-slot-ui.png — 가능 슬롯 스크린샷
  - [ ] task-5-build.txt — 빌드 결과

  **Commit**: YES (groups with Tasks 3, 4, 6)
  - Message: `feat(reservation): add pending count display and approval notifications`
  - Files: `src/views/member/MemberReservationView.vue`, `src/views/member/MemberReservationView.css`
  - Pre-commit: `npm run build`

- [ ] 6. ReservationManageView 수정: 승인/거절 시 알림 발송

  **What to do**:
  - `src/views/trainer/ReservationManageView.vue` 수정
  - **변경 1**: `useNotifications` composable import 추가:
    ```js
    import { useNotifications } from '@/composables/useNotifications'
    const { createNotification } = useNotifications()
    ```
  - **변경 2**: `handleApprove` 함수에 승인 알림 추가:
    ```js
    async function handleApprove(item) {
      processingId.value = item.id
      try {
        const success = await updateReservationStatus(item.id, 'approved')
        if (success) {
          // 승인 알림 발송
          await createNotification(
            item.member_id,
            'reservation_approved',
            '예약이 승인되었습니다',
            `${item.date} ${item.start_time} 예약이 승인되었습니다.`,
            item.id,
            'reservation'
          )
          reservationsStore.invalidate()
          await fetchMyReservations('trainer')
        }
      } finally {
        processingId.value = null
      }
    }
    ```
  - **변경 3**: 기존 거절 함수에도 알림 추가. 현재 거절 처리가 어떤 함수에서 이루어지는지 확인 필요 — `handleReject`가 있다면 그 함수에 `createNotification` 추가:
    ```js
    // 거절 시 알림
    await createNotification(
      item.member_id,
      'reservation_rejected',
      '예약이 거절되었습니다',
      `${item.date} ${item.start_time} 예약이 거절되었습니다.${reason ? ' 사유: ' + reason : ''}`,
      item.id,
      'reservation'
    )
    ```
  - **주의**: 자동 거절(트리거)은 DB에서 알림 INSERT → 여기서 하는 건 **수동** 승인/거절 알림만. 자동 거절된 예약의 알림은 트리거가 처리하므로 프론트에서 중복 생성하지 말 것.
  - **확인사항**: `item` 객체에 `member_id`, `date`, `start_time` 필드가 있는지 확인 필요 — `fetchMyReservations`가 반환하는 데이터 구조 확인.

  **Must NOT do**:
  - `handleApprove`의 기존 로직(updateReservationStatus, invalidate, fetchMyReservations) 변경 금지
  - 트리거 자동 거절에 대한 추가 프론트엔드 로직 금지 (트리거가 처리)
  - UI 레이아웃 변경 금지 — 기능만 추가
  - Options API 사용 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 기존 코드에 composable 연동 추가, 데이터 구조 파악 필요
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 알림 발송은 DB INSERT이므로 시각적 검증보다는 DB 확인이 적합

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 5와 병렬 — 다른 파일)
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1 (트리거 존재해야 자동 거절과 수동 거절 구분 가능)

  **References**:

  **Pattern References**:
  - `src/views/trainer/ReservationManageView.vue:378-389` — 현재 `handleApprove` 함수. 이 함수에 `createNotification` 호출 추가.
  - `src/views/trainer/ReservationManageView.vue:354-376` — 거절 처리 함수 (handleReject 또는 유사). 정확한 함수명과 위치 확인 후 알림 추가.
  - `src/composables/useNotifications.js:99-118` — `createNotification` 함수 시그니처: `(userId, type, title, body, targetId, targetType)`.

  **API/Type References**:
  - `supabase/schema.sql:913-914` — `notification_type` enum: `'reservation_approved'`, `'reservation_rejected'` 확인.
  - `src/composables/useReservations.js:212-234` — `fetchMyReservations`가 반환하는 예약 데이터. `item` 객체에 `member_id`, `date`, `start_time` 포함 여부 확인.

  **WHY Each Reference Matters**:
  - `handleApprove` — 정확한 삽입 위치 (success 확인 후, invalidate 전)
  - `createNotification` — 함수 시그니처와 파라미터 순서 확인
  - `item` 객체 — 필요한 필드(`member_id`, `date`, `start_time`)가 포함되어 있는지 확인

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 수동 승인 시 회원에게 알림 생성
    Tool: Bash (mcp_supabase_execute_sql) + Playwright
    Preconditions: pending 예약 1건 존재 (회원 A)
    Steps:
      1. 트레이너로 로그인 → /trainer/reservations 접속
      2. pending 예약의 "승인" 버튼 클릭
      3. DB에서 notifications 테이블 확인:
         SELECT type, user_id, title FROM notifications WHERE user_id = '[member-A-id]' AND type = 'reservation_approved' ORDER BY created_at DESC LIMIT 1
    Expected Result: type='reservation_approved', title='예약이 승인되었습니다'
    Failure Indicators: notification 미생성, 잘못된 type
    Evidence: .sisyphus/evidence/task-6-approve-notification.txt

  Scenario: 수동 거절 시 회원에게 알림 생성
    Tool: Bash + Playwright
    Preconditions: pending 예약 1건 존재
    Steps:
      1. 트레이너로 "거절" 버튼 클릭 (사유 입력)
      2. DB에서 notifications 확인:
         SELECT type, title, body FROM notifications WHERE type = 'reservation_rejected' ORDER BY created_at DESC LIMIT 1
    Expected Result: type='reservation_rejected', title='예약이 거절되었습니다', body에 사유 포함
    Evidence: .sisyphus/evidence/task-6-reject-notification.txt

  Scenario: 자동 거절과 수동 거절 알림 중복 없음
    Tool: Bash
    Preconditions: 같은 시간대에 pending 2건 (A, B)
    Steps:
      1. 트레이너가 A를 승인 → 트리거가 B를 자동 거절 + 알림
      2. B의 알림 개수 확인
    Expected Result: B에게 알림 1건만 (트리거에서 생성한 자동 거절 알림만, 수동 거절 알림 없음)
    Evidence: .sisyphus/evidence/task-6-no-duplicate-notification.txt
  ```

  **Evidence to Capture:**
  - [ ] task-6-approve-notification.txt
  - [ ] task-6-reject-notification.txt
  - [ ] task-6-no-duplicate-notification.txt

  **Commit**: YES (groups with Tasks 3, 4, 5)
  - Message: `feat(reservation): add pending count display and approval notifications`
  - Files: `src/views/trainer/ReservationManageView.vue`
  - Pre-commit: `npm run build`

- [ ] 7. schema.sql 정규 스키마 업데이트

  **What to do**:
  - `supabase/schema.sql` 파일을 Task 1-2에서 적용한 마이그레이션 내용과 동기화
  - **변경 1**: 유니크 인덱스 교체 (line 100-102):
    ```sql
    -- 기존 (삭제):
    -- create unique index if not exists reservations_unique_active_slot
    --   on public.reservations (trainer_id, date, start_time)
    --   where status in ('pending', 'approved');

    -- 신규:
    create unique index if not exists reservations_unique_approved_slot
      on public.reservations (trainer_id, date, start_time)
      where status = 'approved';
    ```
  - **변경 2**: 자동 거절 트리거 함수 + 트리거 추가 (기존 `trg_auto_deduct_pt` 뒤에):
    ```sql
    -- 예약 자동 거절 trigger (승인 시 같은 시간대 pending 자동 rejected)
    create or replace function public.auto_reject_competing_reservations()
    returns trigger as $$
    begin
      if new.status = 'approved' and old.status <> 'approved' then
        with rejected as (
          update public.reservations
          set status = 'rejected',
              rejection_reason = '다른 회원의 예약이 승인되었습니다',
              updated_at = now()
          where trainer_id = new.trainer_id
            and date = new.date
            and start_time = new.start_time
            and id <> new.id
            and status = 'pending'
          returning id, member_id
        )
        insert into public.notifications (user_id, type, title, body, target_id, target_type)
        select member_id, 'reservation_rejected',
               '예약이 자동 거절되었습니다',
               new.date || ' ' || new.start_time || ' 예약이 다른 회원의 승인으로 인해 자동 거절되었습니다.',
               id, 'reservation'
        from rejected;
      end if;
      return new;
    end;
    $$ language plpgsql security definer set search_path = public;

    drop trigger if exists trg_auto_reject_competing on public.reservations;
    create trigger trg_auto_reject_competing
    after update on public.reservations
    for each row
    execute function public.auto_reject_competing_reservations();
    ```
  - **변경 3**: `auto_complete_past_reservations` 함수 업데이트 (line 1187-1199):
    ```sql
    create or replace function public.auto_complete_past_reservations()
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $$
    begin
      update reservations
      set status = 'completed'
      where status = 'approved'
        and (date + end_time) < (now() at time zone 'Asia/Seoul');

      update reservations
      set status = 'rejected',
          rejection_reason = '예약 시간이 경과하여 자동 거절되었습니다'
      where status = 'pending'
        and (date + end_time) < (now() at time zone 'Asia/Seoul');
    end;
    $$;
    ```
  - **변경 4**: `create_reservation` RPC 업데이트 (line 1050-1125) — Task 2의 변경 내용 반영

  **Must NOT do**:
  - schema.sql 이외의 파일 수정 금지
  - 실제 DB에 SQL 실행 금지 (이미 마이그레이션으로 적용됨 — 여기서는 참조 파일만 업데이트)
  - 다른 테이블/함수/트리거 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 이미 적용된 마이그레이션 내용을 참조 파일에 반영하는 단순 편집 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 8과 병렬)
  - **Parallel Group**: Wave 3 (with Task 8)
  - **Blocks**: None
  - **Blocked By**: Task 1, 2

  **References**:

  **Pattern References**:
  - `supabase/schema.sql:100-102` — 기존 유니크 인덱스 정의 (교체 대상)
  - `supabase/schema.sql:1050-1125` — 기존 `create_reservation` RPC (Task 2 변경 반영)
  - `supabase/schema.sql:1167-1182` — 기존 트리거 영역 (새 트리거 추가 위치)
  - `supabase/schema.sql:1187-1199` — 기존 `auto_complete_past_reservations` (수정 대상)

  **WHY Each Reference Matters**:
  - 각 위치에서 정확히 어떤 코드를 교체/추가해야 하는지 파악

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: schema.sql에 새 유니크 인덱스 정의 존재
    Tool: Bash (grep)
    Steps:
      1. grep 'reservations_unique_approved_slot' supabase/schema.sql
      2. grep 'reservations_unique_active_slot' supabase/schema.sql
    Expected Result: approved_slot 존재, active_slot 미존재 (또는 주석 처리)
    Evidence: .sisyphus/evidence/task-7-index-check.txt

  Scenario: schema.sql에 auto_reject_competing_reservations 함수 존재
    Tool: Bash (grep)
    Steps:
      1. grep 'auto_reject_competing_reservations' supabase/schema.sql
    Expected Result: 함수 정의 존재
    Evidence: .sisyphus/evidence/task-7-trigger-check.txt

  Scenario: schema.sql에 create_reservation RPC 업데이트됨
    Tool: Bash (grep)
    Steps:
      1. grep 'Already requested this time slot' supabase/schema.sql
    Expected Result: 문자열 존재 (새 동일 회원 중복 체크)
    Evidence: .sisyphus/evidence/task-7-rpc-check.txt
  ```

  **Evidence to Capture:**
  - [ ] task-7-index-check.txt
  - [ ] task-7-trigger-check.txt
  - [ ] task-7-rpc-check.txt

  **Commit**: YES (groups with Task 8)
  - Message: `test(reservation): add unit tests for duplicate policy and update schema reference`
  - Files: `supabase/schema.sql`

- [ ] 8. Vitest 단위 테스트: composable 레이어

  **What to do**:
  - `src/composables/__tests__/useReservations.test.js` 파일 생성 (또는 기존 파일에 추가)
  - **테스트 범위**: `fetchAvailableSlots`의 슬롯 상태 분류 로직, 에러 매핑
  - **테스트 케이스**:
    1. `fetchAvailableSlots` — approved 예약 있는 슬롯 → status '마감', pendingCount 0
    2. `fetchAvailableSlots` — pending 예약 2건 있는 슬롯 → status '대기중', pendingCount 2
    3. `fetchAvailableSlots` — 예약 없는 슬롯 → status '가능', pendingCount 0
    4. `fetchAvailableSlots` — approved + pending 혼재 → status '마감' (approved 우선)
    5. `createReservation` — 'Already requested this time slot' 에러 → '이미 해당 시간에 예약을 요청하셨습니다.'
    6. `createReservation` — 'Reservation time slot is already booked' 에러 → '해당 시간은 이미 예약이 확정되었습니다.'
  - **Supabase mock**: `vi.mock('@/lib/supabase')` 사용하여 supabase 클라이언트 mock
  - 기존 테스트 파일이 있다면 그 패턴을 따를 것

  **Must NOT do**:
  - 실제 Supabase 연결 사용 금지 — mock 사용
  - composable 소스코드 수정 금지 (테스트만 작성)
  - 불필요한 테스트 유틸/헬퍼 과잉 생성 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: mock 설정이 필요한 Vitest 테스트 작성
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 7과 병렬)
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 3, 4, 5, 6

  **References**:

  **Pattern References**:
  - `src/composables/__tests__/` — 기존 테스트 파일 패턴 확인. mock 설정, import 방식, assertion 스타일 따를 것.
  - `src/composables/useReservations.js:125-167` — `fetchAvailableSlots` 수정된 슬롯 분류 로직 (테스트 대상)
  - `src/composables/useReservations.js:198-208` — `createReservation` 에러 매핑 (테스트 대상)

  **External References**:
  - Vitest docs: `https://vitest.dev/guide/mocking.html` — vi.mock 사용법

  **WHY Each Reference Matters**:
  - 기존 테스트 패턴 — mock 설정과 assertion 스타일 일관성 유지
  - 수정된 코드 — 정확한 테스트 케이스 작성을 위해 실제 로직 참조

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 모든 테스트 통과
    Tool: Bash (npx vitest run)
    Steps:
      1. npx vitest run src/composables/__tests__/useReservations.test.js
    Expected Result: 6개 이상 테스트 통과, 0 실패
    Failure Indicators: 테스트 실패, import 에러
    Evidence: .sisyphus/evidence/task-8-vitest-result.txt

  Scenario: 전체 테스트 스위트 통과
    Tool: Bash (npm test)
    Steps:
      1. npm test
    Expected Result: 모든 테스트 통과
    Evidence: .sisyphus/evidence/task-8-all-tests.txt
  ```

  **Evidence to Capture:**
  - [ ] task-8-vitest-result.txt — 개별 테스트 결과
  - [ ] task-8-all-tests.txt — 전체 테스트 결과

  **Commit**: YES (groups with Task 7)
  - Message: `test(reservation): add unit tests for duplicate policy and update schema reference`
  - Files: `src/composables/__tests__/useReservations.test.js`
  - Pre-commit: `npm test`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, execute SQL, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npx vitest run`. Review all changed files for: `as any`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify Korean error messages. Check CSS uses custom properties.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: create 2 pending reservations → approve 1 → verify auto-reject + notification + UI update. Test edge cases: empty state, same-member duplicate attempt. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Commit 1** (after Tasks 1-2): `feat(reservation): allow duplicate pending reservations with auto-reject trigger` — schema.sql migration applied
- **Commit 2** (after Tasks 3-6): `feat(reservation): add pending count display and approval notifications` — composable + UI changes
- **Commit 3** (after Tasks 7-8): `test(reservation): add unit tests for duplicate policy and update schema reference` — tests + schema.sql

---

## Success Criteria

### Verification Commands
```bash
npm run build    # Expected: no errors
npm test         # Expected: all tests pass
```

### Final Checklist
- [ ] 같은 시간대 2+ pending 예약 생성 가능 (DB)
- [ ] 승인 시 나머지 pending 자동 rejected (트리거)
- [ ] 자동 거절 notification 생성 (트리거)
- [ ] 수동 승인/거절 notification 생성 (composable)
- [ ] 동일 회원 중복 pending 차단 (RPC)
- [ ] approved 슬롯에 신규 pending 차단 (RPC)
- [ ] 슬롯 3종 분류: 가능/대기중 N건/마감 (composable + UI)
- [ ] 과거 pending 자동 거절 (cron)
- [ ] 에러 메시지 한국어 (composable)
- [ ] build 성공 + 테스트 통과
- [ ] schema.sql 업데이트됨
