# 계정 소프트 삭제 + 운동 개별 복사 + 대시보드 리디자인

## TL;DR

> **Quick Summary**: 계정 삭제를 소프트 삭제(30일 유예기간)로 전환하고, 운동 배정 히스토리에서 개별 운동 단위 복사 기능을 추가하며, 트레이너/회원 대시보드를 모던 피트니스 앱 스타일로 전체 리디자인 + 카드/요소 마이크로 애니메이션을 추가합니다.
>
> **Deliverables**:
> - DB 마이그레이션: `profiles.deleted_at` 컬럼 + soft delete/cancel RPCs + pg_cron 자동 퍼지
> - `useProfile.js` 소프트 삭제 전환 + `cancelAccountDeletion()` 추가
> - Auth store + Router guard: 삭제 예정 사용자 감지 + 복구 안내 UI
> - Settings views: 삭제 안내 문구 변경
> - TodayWorkoutView: 운동 개별 복사 UI (히스토리 아코디언 + 개별 "+" 버튼)
> - TrainerHomeView + MemberHomeView: 전체 리디자인 + CSS 마이크로 애니메이션
> - 새 composable 테스트 케이스
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 8 → Task 9

---

## Context

### Original Request
사용자가 3가지 기능을 요청:
1. 계정 삭제를 소프트 삭제(30일 유예)로 전환
2. 운동 배정 시 개별 운동 단위 복사 (날짜 전체 복사가 아닌)
3. 트레이너/회원 대시보드 전체 리디자인 + 카드/요소 애니메이션

### Interview Summary
**Key Discussions**:
- 계정 삭제: 소프트 삭제 선택. 유예기간 중 로그인 시 "삭제 예정" 안내 + 취소 버튼 표시
- 운동 복사: 개별 운동 "복사" 버튼 → 현재 목록에 추가 (대체 아님). 기존 "전체 복사"도 유지
- 대시보드: 둘 다 리디자인. 참고 디자인 없음 — 모던 PT 앱 스타일로 자체 디자인. 카드/요소 애니메이션만 (페이지 전환 X)
- 테스트: YES — composable 변경에 대한 테스트 추가 (기존 테스트 파일 수정 금지)

**Research Findings**:
- `delete_user_account()` RPC 존재 (schema.sql:1101-1110) — `DELETE FROM auth.users WHERE id = auth.uid()`
- `useProfile.softDeleteAccount()` 이미 구현 (lines 253-334) — 하드 삭제 방식
- profiles 테이블: `id, role, name, phone, photo_url, created_at` — deleted_at 없음
- pg_cron 패턴 이미 존재 (auto_complete_past_reservations, 5분 주기)
- TodayWorkoutView의 `copyFromHistory(plan)` (line 315-324): `exercises.value = plan.exercises.map(...)` — 전체 대체
- 히스토리 섹션 (lines 173-197): 날짜별 리스트 + 단일 "복사" 버튼
- TrainerHomeView (344 lines): 프로필 헤더 + 액션카드 + 통계 + 일정 + 메시지
- MemberHomeView (367 lines): 프로필 헤더 + 다음 PT + 오늘 운동 + 주간 목표
- 85개 Vitest 테스트 모두 통과, npm run build 성공

### Metis Review
**Identified Gaps** (addressed):
- 소프트 삭제 시 연결된 사용자 데이터 처리: 즉시 `trainer_members.status = 'disconnected'` 설정
- 스토리지 삭제 시점: 소프트 삭제 시 스토리지 미삭제 → 하드 삭제 pg_cron에서 처리
- RLS 정책 `deleted_at IS NULL` 필터 필요: owner 정책은 예외 (자기 프로필 봐야 취소 가능)
- 운동 전체 복사 기능 유지: "전체 복사" 버튼 + 개별 "+" 버튼 공존
- 대시보드 prefers-reduced-motion 접근성: `@media (prefers-reduced-motion)` 적용
- 애니메이션 타이밍 토큰: global.css에 추가

---

## Work Objectives

### Core Objective
기존 하드 삭제를 30일 유예 소프트 삭제로 전환하고, 운동 배정 UX를 개별 복사로 개선하며, 두 대시보드를 모던 디자인으로 리프레시합니다.

### Concrete Deliverables
- Supabase 마이그레이션: `deleted_at` 컬럼, 2 RPCs, pg_cron job, RLS 업데이트
- `useProfile.js`: `softDeleteAccount()` 변경 + `cancelAccountDeletion()` 추가
- `auth.js`: `fetchProfile()`에 deleted_at 감지 로직
- `router/index.js`: deleted_at 유저 리다이렉트
- AccountDeletePendingView: 삭제 예정 안내 + 취소 UI
- SettingsView + MemberSettingsView: 안내 문구 변경
- TodayWorkoutView: 히스토리 아코디언 + 개별 복사 UI
- TrainerHomeView + CSS: 전체 리디자인 + 애니메이션
- MemberHomeView + CSS: 전체 리디자인 + 애니메이션
- global.css: 애니메이션 타이밍 토큰
- 새 테스트 파일 추가

### Definition of Done
- [ ] `npx vitest run` — 85+ 테스트 통과 (기존 85 + 신규)
- [ ] `npm run build` — 에러 없이 빌드 성공
- [ ] 소프트 삭제 후 로그인 시 복구 안내 표시
- [ ] 운동 개별 복사 시 현재 목록에 추가 (대체 아님)
- [ ] 대시보드 카드 등장 애니메이션 동작
- [ ] `@media (prefers-reduced-motion: reduce)` 적용

### Must Have
- profiles.deleted_at 컬럼 (nullable timestamptz)
- 30일 후 pg_cron 자동 완전 삭제
- 유예기간 중 로그인 시 복구 안내 + 취소 버튼
- 개별 운동 복사 (append, not replace)
- 기존 "전체 복사" 버튼 유지
- 20개 운동 제한 체크
- 대시보드 카드/요소 마이크로 애니메이션
- prefers-reduced-motion 접근성 지원
- GPU 가속 애니메이션 (transform + opacity만)

### Must NOT Have (Guardrails)
- 소프트 삭제 시 스토리지 파일 삭제 (하드 삭제 시에만)
- 페이지 전환 애니메이션 (`<Transition>` wrapping `<router-view>`)
- 대시보드 새로운 데이터 소스/composable 추가
- 새로운 npm 패키지 설치
- TypeScript 파일 추가
- 코드 주석 (// comment) 추가
- 기존 테스트 파일 수정
- 하드코딩된 색상/크기 (CSS Custom Properties 사용)
- Options API 사용
- width/height/margin/padding 애니메이션 (layout thrash)
- pull-to-refresh 후 재애니메이션 (초기 로드 시에만)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: YES (Tests-after)
- **Framework**: Vitest (`npx vitest run`)
- **Pattern**: 기존 `src/composables/__tests__/useProfile.test.js` 패턴 따름 (vi.hoisted mocks, createBuilder)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **DB Migration**: Use Supabase MCP — execute_sql to verify schema changes

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: DB 마이그레이션 (deleted_at + RPCs + pg_cron + RLS) [deep]
├── Task 6: 운동 개별 복사 UI (TodayWorkoutView) [unspecified-high]
├── Task 10: 애니메이션 디자인 토큰 (global.css) [quick]
└── Task 11: composable 테스트 작성 [unspecified-high]

Wave 2 (After Task 1 — soft delete frontend):
├── Task 2: useProfile.js 소프트 삭제 전환 [unspecified-high]
├── Task 7: TodayWorkoutView CSS 스타일링 [quick]
├── Task 8: TrainerHomeView 리디자인 [visual-engineering]
└── Task 9: MemberHomeView 리디자인 [visual-engineering]

Wave 3 (After Task 2 — auth flow + UI):
├── Task 3: Auth store + Router guard 삭제 예정 감지 [unspecified-high]
├── Task 4: AccountDeletePendingView 생성 [unspecified-high]
└── Task 5: Settings views 안내 문구 변경 [quick]

Wave 4 (After ALL — verification):
├── F1: Plan compliance audit [oracle]
├── F2: Code quality review [unspecified-high]
├── F3: Real manual QA [unspecified-high]
└── F4: Scope fidelity check [deep]

Critical Path: Task 1 → Task 2 → Task 3 → Task 4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2, 3, 11 | 1 |
| 2 | 1 | 3, 4, 5 | 2 |
| 3 | 2 | 4 | 3 |
| 4 | 3 | — | 3 |
| 5 | 2 | — | 3 |
| 6 | — | 7 | 1 |
| 7 | 6 | — | 2 |
| 8 | 10 | — | 2 |
| 9 | 10 | — | 2 |
| 10 | — | 8, 9 | 1 |
| 11 | 1 | — | 1 (after Task 1 completes) |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks — T1→`deep`, T6→`unspecified-high`, T10→`quick`, T11→`unspecified-high`
- **Wave 2**: 4 tasks — T2→`unspecified-high`, T7→`quick`, T8→`visual-engineering`, T9→`visual-engineering`
- **Wave 3**: 3 tasks — T3→`unspecified-high`, T4→`unspecified-high`, T5→`quick`
- **Wave FINAL**: 4 tasks — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

- [ ] 1. DB 마이그레이션: 소프트 삭제 인프라

  **What to do**:
  - `profiles` 테이블에 `deleted_at timestamptz DEFAULT NULL` 컬럼 추가
  - 새 RPC `soft_delete_user_account()` 생성:
    - `UPDATE profiles SET deleted_at = NOW() WHERE id = auth.uid()`
    - 연결된 `trainer_members`의 status를 `'disconnected'`로 변경
  - 새 RPC `cancel_account_deletion()` 생성:
    - `UPDATE profiles SET deleted_at = NULL WHERE id = auth.uid()`
  - pg_cron 자동 퍼지 함수 `purge_deleted_accounts()` 생성:
    - `deleted_at < NOW() - INTERVAL '30 days'`인 profiles 조회
    - 각 user_id에 대해: 스토리지 파일 삭제 (avatars, chat-files, manual-media 버킷)는 Edge Function이나 별도 처리 필요하므로, pg_cron에서는 `DELETE FROM auth.users WHERE id = user_id`만 실행 (CASCADE로 모든 테이블 정리)
    - `SECURITY DEFINER`로 실행 (cron은 auth.uid() 없음)
  - pg_cron 스케줄: `'0 3 * * *'` (매일 새벽 3시 KST)
  - RLS 정책 업데이트:
    - `"Trainer profiles are searchable by authenticated users"` 정책에 `AND deleted_at IS NULL` 추가
    - `"Profiles are readable by connected users"` 정책에 `AND profiles.deleted_at IS NULL` 추가
    - `"Profiles are readable by owner"` 정책은 수정 안 함 (자기 프로필 봐야 취소 가능)
  - `schema.sql`에 새 마이그레이션 내용 반영

  **Must NOT do**:
  - 기존 `delete_user_account()` RPC 삭제하지 않음 (pg_cron purge에서 사용)
  - profiles 테이블 구조 외 다른 테이블 스키마 변경 금지
  - auth.users 테이블 직접 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: DB 마이그레이션 + RPC + pg_cron + RLS 정책 = 복잡한 SQL 작업, Supabase MCP 활용 필요
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: DB 작업이므로 브라우저 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 6, 10, 11)
  - **Blocks**: Task 2, Task 3, Task 11
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `supabase/schema.sql:1101-1110` — 기존 `delete_user_account()` RPC 패턴. SECURITY DEFINER + plpgsql 구조 참고
  - `supabase/schema.sql:1131-1151` — 기존 pg_cron 설정 패턴 (`auto_complete_past_reservations`). cron.schedule 호출 구문 참고
  - `supabase/schema.sql:21-28` — profiles 테이블 스키마. 현재 컬럼 구조 확인하고 deleted_at 추가 위치 결정

  **API/Type References**:
  - `supabase/schema.sql:137-149` — profiles RLS 정책 (owner insert/select/update). owner select은 수정 안 함
  - `supabase/schema.sql:159-181` — profiles RLS 정책 (trainer searchable + connected users readable). 이 두 정책에 `deleted_at IS NULL` 조건 추가

  **WHY Each Reference Matters**:
  - schema.sql:1101-1110: 새 RPC도 동일한 SECURITY DEFINER 패턴 사용. `set search_path = public` 포함 필수
  - schema.sql:1131-1151: pg_cron extension 이미 활성화됨. 새 스케줄 추가만 하면 됨. 기존 패턴의 함수→스케줄 2단계 구조 따라야 함
  - schema.sql:21-28: deleted_at은 `created_at` 다음에 추가. nullable이어야 함 (활성 계정은 NULL)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: profiles 테이블에 deleted_at 컬럼 존재 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. execute_sql: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at'`
      2. Assert: 결과 행 1개, data_type = 'timestamp with time zone', is_nullable = 'YES'
    Expected Result: deleted_at 컬럼이 timestamptz nullable로 존재
    Failure Indicators: 결과 0행 또는 data_type 불일치
    Evidence: .sisyphus/evidence/task-1-deleted-at-column.json

  Scenario: soft_delete_user_account RPC 존재 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. execute_sql: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'soft_delete_user_account' AND routine_schema = 'public'`
      2. Assert: 결과 1행
    Expected Result: RPC 함수 존재
    Failure Indicators: 결과 0행
    Evidence: .sisyphus/evidence/task-1-soft-delete-rpc.json

  Scenario: cancel_account_deletion RPC 존재 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. execute_sql: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'cancel_account_deletion' AND routine_schema = 'public'`
      2. Assert: 결과 1행
    Expected Result: RPC 함수 존재
    Failure Indicators: 결과 0행
    Evidence: .sisyphus/evidence/task-1-cancel-deletion-rpc.json

  Scenario: pg_cron purge 스케줄 등록 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. execute_sql: `SELECT jobname, schedule FROM cron.job WHERE jobname = 'purge-deleted-accounts'`
      2. Assert: 결과 1행, schedule = '0 3 * * *'
    Expected Result: 매일 새벽 3시 퍼지 스케줄 등록됨
    Failure Indicators: 결과 0행 또는 스케줄 불일치
    Evidence: .sisyphus/evidence/task-1-cron-schedule.json

  Scenario: RLS 정책에 deleted_at 필터 적용 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. execute_sql: `SELECT policyname, qual FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%searchable%'`
      2. Assert: qual에 'deleted_at' 문자열 포함
    Expected Result: searchable 정책에 deleted_at IS NULL 조건 포함
    Failure Indicators: qual에 deleted_at 미포함
    Evidence: .sisyphus/evidence/task-1-rls-policy.json
  ```

  **Commit**: YES (groups with Tasks 2-5)
  - Message: `feat(auth): add soft delete with 30-day grace period`
  - Files: `supabase/schema.sql`
  - Pre-commit: `npm run build`

- [ ] 2. useProfile.js 소프트 삭제 전환 + cancelAccountDeletion

  **What to do**:
  - `softDeleteAccount()` 함수 수정:
    - 스토리지 파일 삭제 코드 전부 제거 (avatars, chat-files, manual-media 버킷 삭제 부분)
    - `supabase.rpc('delete_user_account')` → `supabase.rpc('soft_delete_user_account')` 호출로 변경
    - 알림 생성 로직 유지 (연결된 사용자에게 알림)
    - 알림 메시지 변경: "탈퇴했습니다" → "탈퇴 예정입니다. 30일 후 계정이 완전히 삭제됩니다."
    - signOut 유지
  - 새 함수 `cancelAccountDeletion()` 추가:
    - `supabase.rpc('cancel_account_deletion')` 호출
    - 성공 시 `auth.profile.deleted_at = null` 로컬 상태 업데이트
    - return true/false 패턴
  - return 문에 `cancelAccountDeletion` 추가

  **Must NOT do**:
  - useProfile.js 외 다른 composable 수정 금지
  - 기존 테스트 파일 수정 금지
  - 코드 주석 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: composable 로직 변경. 기존 패턴을 정확히 따라야 함
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 3, Task 4, Task 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/composables/useProfile.js:253-334` — 현재 `softDeleteAccount()` 전체 구현. 스토리지 삭제 부분(272-322)을 제거하고, RPC 호출(325)을 soft_delete로 변경
  - `src/composables/useProfile.js:336` — return 문. cancelAccountDeletion 추가 위치

  **API/Type References**:
  - `src/composables/useProfile.js:1-10` — import 구문. supabase, useAuthStore 등 기존 import 확인

  **Test References**:
  - `src/composables/__tests__/useProfile.test.js` — 기존 softDeleteAccount 테스트 패턴. 새 테스트는 Task 11에서 별도 파일로 작성

  **WHY Each Reference Matters**:
  - lines 253-334: 정확히 어떤 코드를 제거(스토리지)하고 어떤 코드를 변경(RPC)할지 파악. 알림 로직(263-270)은 유지
  - line 336: return 객체에 새 함수 추가 위치

  **Acceptance Criteria**:

  ```
  Scenario: softDeleteAccount가 soft_delete_user_account RPC 호출
    Tool: Bash (grep)
    Preconditions: Task 2 완료
    Steps:
      1. grep -n "soft_delete_user_account" src/composables/useProfile.js
      2. Assert: 매칭 라인 존재
      3. grep -n "delete_user_account" src/composables/useProfile.js
      4. Assert: 'soft_delete_user_account'만 매칭 (기존 하드삭제 RPC 호출 없음)
    Expected Result: soft_delete_user_account RPC만 호출
    Failure Indicators: delete_user_account가 여전히 직접 호출됨
    Evidence: .sisyphus/evidence/task-2-rpc-call.txt

  Scenario: 스토리지 삭제 코드 제거 확인
    Tool: Bash (grep)
    Preconditions: Task 2 완료
    Steps:
      1. grep -n "storage.from" src/composables/useProfile.js
      2. Assert: softDeleteAccount 함수 내에 storage.from 호출 없음 (uploadAvatar 등 다른 함수의 storage 호출은 있을 수 있음)
    Expected Result: softDeleteAccount에서 스토리지 관련 코드 제거됨
    Failure Indicators: softDeleteAccount 내에 storage.from 호출 잔존
    Evidence: .sisyphus/evidence/task-2-no-storage.txt

  Scenario: cancelAccountDeletion 함수 존재 확인
    Tool: Bash (grep)
    Preconditions: Task 2 완료
    Steps:
      1. grep -n "cancelAccountDeletion" src/composables/useProfile.js
      2. Assert: 함수 정의 + return 문에 포함
    Expected Result: cancelAccountDeletion 함수가 정의되고 export됨
    Failure Indicators: 함수 미존재 또는 return에 미포함
    Evidence: .sisyphus/evidence/task-2-cancel-function.txt

  Scenario: npm run build 성공
    Tool: Bash
    Preconditions: Task 2 완료
    Steps:
      1. npm run build
      2. Assert: exit code 0, no errors
    Expected Result: 빌드 성공
    Failure Indicators: build 에러
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES (groups with Tasks 1, 3-5)
  - Message: `feat(auth): add soft delete with 30-day grace period`
  - Files: `src/composables/useProfile.js`
  - Pre-commit: `npm run build`

- [ ] 3. Auth store + Router guard: 삭제 예정 사용자 감지

  **What to do**:
  - `src/stores/auth.js` — `fetchProfile()` 수정:
    - profile 데이터 조회 후, `data.deleted_at`이 존재하면:
    - `profile.value`에 데이터 설정 (deleted_at 포함) — 취소 UI 렌더링에 필요
    - 별도 ref `deletionPending = ref(false)` 추가
    - `deleted_at` 있으면 `deletionPending.value = true`
    - return 문에 `deletionPending` 추가
  - `src/router/index.js` — `beforeEach` guard 수정:
    - auth.loading 완료 후, `auth.deletionPending === true`이면:
    - 현재 route가 `/account-delete-pending` 또는 `/login`이 아닌 경우 → `/account-delete-pending`으로 리다이렉트
    - PUBLIC_ROUTES에 `/account-delete-pending` 추가

  **Must NOT do**:
  - auth store의 signOut, initialize, hydrateFromSession 함수 변경 금지
  - 기존 라우팅 로직 (역할 기반 리다이렉트) 변경 금지
  - 다른 composable에서 auth store 사용 방식 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: auth flow 변경은 앱 전체에 영향. 정밀한 로직 삽입 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/stores/auth.js:79-115` — `fetchProfile()` 함수. line 90-94에서 Supabase 쿼리, line 106에서 `setProfile(data)`. deleted_at 체크를 106 이전에 삽입
  - `src/router/index.js:287-337` — `beforeEach` guard. auth.loading 체크(~290), 인증 체크(~300), 역할 체크(~320). deletionPending 체크를 인증 체크와 역할 체크 사이에 삽입

  **API/Type References**:
  - `src/stores/auth.js:7-12` — store의 ref 선언부. `deletionPending` ref 추가 위치
  - `src/stores/auth.js:127-129` — `hydrateFromSession()`. profile 중복 조회 방지 로직 있음 — deletionPending도 이 로직에서 설정될 수 있어야 함

  **WHY Each Reference Matters**:
  - auth.js:79-115: fetchProfile에서 deleted_at을 감지해야 하므로 정확한 데이터 흐름 이해 필수. `maybeSingle()` 호출 후 data 객체에 deleted_at 포함됨
  - router/index.js:287-337: guard 순서가 중요. 인증 안 된 사용자를 먼저 걸러낸 후, 인증된 사용자 중 삭제 예정인 경우를 처리

  **Acceptance Criteria**:

  ```
  Scenario: auth store에 deletionPending ref 존재
    Tool: Bash (grep)
    Preconditions: Task 3 완료
    Steps:
      1. grep -n "deletionPending" src/stores/auth.js
      2. Assert: ref 선언 + return 문에 포함
    Expected Result: deletionPending이 선언되고 export됨
    Failure Indicators: 미존재
    Evidence: .sisyphus/evidence/task-3-deletion-pending-ref.txt

  Scenario: router guard에 deletionPending 체크 존재
    Tool: Bash (grep)
    Preconditions: Task 3 완료
    Steps:
      1. grep -n "deletionPending\|account-delete-pending" src/router/index.js
      2. Assert: deletionPending 체크 + 리다이렉트 로직 존재
    Expected Result: guard에서 삭제 예정 사용자를 감지하고 리다이렉트
    Failure Indicators: guard에 체크 로직 없음
    Evidence: .sisyphus/evidence/task-3-router-guard.txt

  Scenario: npm run build 성공
    Tool: Bash
    Preconditions: Task 3 완료
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: 빌드 성공
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Commit**: YES (groups with Tasks 1-2, 4-5)
  - Message: `feat(auth): add soft delete with 30-day grace period`
  - Files: `src/stores/auth.js`, `src/router/index.js`
  - Pre-commit: `npm run build`

- [ ] 4. AccountDeletePendingView 생성

  **What to do**:
  - `src/views/common/AccountDeletePendingView.vue` 생성:
    - 삭제 예정 안내 화면
    - 아이콘: 경고/시계 SVG (inline)
    - 제목: "계정 삭제 예정"
    - 본문: "회원님의 계정은 {남은 일수}일 후 완전히 삭제됩니다." (deleted_at 기반 계산)
    - 본문2: "삭제를 취소하고 계정을 복구하시겠습니까?"
    - "계정 복구" 버튼 (primary): `useProfile().cancelAccountDeletion()` 호출 → 성공 시 `auth.deletionPending = false` + 역할 기반 홈으로 이동
    - "로그아웃" 버튼 (secondary): `auth.signOut()` → `/login` 이동
    - 로딩 상태 처리 (복구 중...)
    - 에러 상태 처리
  - `src/views/common/AccountDeletePendingView.css` 생성 (동반 CSS)
  - `src/router/index.js`에 route 추가:
    - path: `/account-delete-pending`, name: `account-delete-pending`
    - component: lazy import
    - meta: `{ hideNav: true }`

  **Must NOT do**:
  - 다른 view 파일 수정 금지 (이 Task에서는 새 파일만 생성)
  - 새 composable 생성 금지 (useProfile의 cancelAccountDeletion 사용)
  - npm 패키지 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 새 뷰 생성 + 라우터 등록. composable 연동 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 5)
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: None
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `src/views/login/PasswordResetView.vue` — 단순 폼 뷰 패턴. 헤더 + 본문 + 버튼 구조, composable 호출, 로딩/에러 상태 처리
  - `src/views/login/PasswordUpdateView.vue` — auth store 연동 + 역할 기반 리다이렉트 패턴
  - `src/views/common/AccountManageView.vue` — 계정 관련 뷰 CSS 스타일 참고 (같은 common/ 디렉토리)

  **API/Type References**:
  - `src/composables/useProfile.js` — `cancelAccountDeletion()` 함수 시그니처 (Task 2에서 추가)
  - `src/stores/auth.js` — `auth.profile.deleted_at` 값으로 남은 일수 계산. `auth.deletionPending` 플래그

  **WHY Each Reference Matters**:
  - PasswordResetView: 같은 "단일 목적 + CTA 버튼" 패턴. `<script setup>` + composable 호출 + 로딩/에러 패턴 동일
  - auth.profile.deleted_at: `new Date(deleted_at)`과 현재 시간 비교로 남은 일수 계산

  **Acceptance Criteria**:

  ```
  Scenario: AccountDeletePendingView 파일 존재 + route 등록
    Tool: Bash
    Preconditions: Task 4 완료
    Steps:
      1. ls src/views/common/AccountDeletePendingView.vue
      2. Assert: 파일 존재
      3. ls src/views/common/AccountDeletePendingView.css
      4. Assert: 파일 존재
      5. grep -n "account-delete-pending" src/router/index.js
      6. Assert: route 등록됨
    Expected Result: 뷰 + CSS + route 모두 존재
    Failure Indicators: 파일 미존재 또는 route 미등록
    Evidence: .sisyphus/evidence/task-4-files-exist.txt

  Scenario: npm run build 성공
    Tool: Bash
    Preconditions: Task 4 완료
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: 빌드 성공
    Evidence: .sisyphus/evidence/task-4-build.txt
  ```

  **Commit**: YES (groups with Tasks 1-3, 5)
  - Message: `feat(auth): add soft delete with 30-day grace period`
  - Files: `src/views/common/AccountDeletePendingView.vue`, `src/views/common/AccountDeletePendingView.css`, `src/router/index.js`
  - Pre-commit: `npm run build`

---

- [ ] 5. Settings views 안내 문구 변경

  **What to do**:
  - `src/views/trainer/SettingsView.vue` 수정:
    - 계정 삭제 바텀시트의 안내 문구 변경: "복구할 수 없습니다" → "30일 후 완전히 삭제됩니다. 30일 이내에 로그인하면 삭제를 취소할 수 있습니다."
  - `src/views/member/MemberSettingsView.vue` 수정:
    - 동일한 안내 문구 변경

  **Must NOT do**:
  - 삭제 버튼 동작(softDeleteAccount 호출) 변경 금지 — Task 2에서 이미 composable 내부 로직이 변경됨
  - 다른 UI 요소 변경 금지
  - 바텀시트 구조/스타일 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 파일의 텍스트 문구만 변경. 매우 간단한 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 4)
  - **Parallel Group**: Wave 3 (with Task 4)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/views/trainer/SettingsView.vue:136-144` — 트레이너 삭제 바텀시트 UI. 확인 입력("탈퇴") + 안내 문구 위치
  - `src/views/member/MemberSettingsView.vue:165-173` — 회원 삭제 바텀시트 UI. 동일 구조

  **WHY Each Reference Matters**:
  - 정확한 라인 번호로 변경할 문구 위치 파악. 두 파일 모두 동일한 패턴이므로 같은 변경 적용

  **Acceptance Criteria**:

  ```
  Scenario: 안내 문구 변경 확인
    Tool: Bash (grep)
    Preconditions: Task 5 완료
    Steps:
      1. grep -n "30일" src/views/trainer/SettingsView.vue
      2. Assert: "30일" 포함 문구 존재
      3. grep -n "30일" src/views/member/MemberSettingsView.vue
      4. Assert: "30일" 포함 문구 존재
      5. grep -rn "복구할 수 없습니다" src/views/trainer/SettingsView.vue src/views/member/MemberSettingsView.vue
      6. Assert: 매칭 0건 (이전 문구 제거됨)
    Expected Result: 두 파일 모두 새 안내 문구로 변경
    Failure Indicators: 이전 문구 잔존 또는 새 문구 미적용
    Evidence: .sisyphus/evidence/task-5-text-change.txt
  ```

  **Commit**: YES (groups with Tasks 1-4)
  - Message: `feat(auth): add soft delete with 30-day grace period`
  - Files: `src/views/trainer/SettingsView.vue`, `src/views/member/MemberSettingsView.vue`
  - Pre-commit: `npm run build`

- [ ] 6. 운동 개별 복사 UI (TodayWorkoutView template + script)

  **What to do**:
  - TodayWorkoutView.vue 히스토리 섹션(lines 173-197) 수정:
    - 각 히스토리 아이템을 아코디언(접기/펼치기)으로 변경
    - 접힌 상태: 날짜 + 미리보기 텍스트 + "전체 복사" 버튼 + 펼치기 토글
    - 펼친 상태: 날짜 + 개별 운동 목록 표시
      - 각 운동: 이름 + sets×reps + "+" 복사 버튼
    - "전체 복사" 버튼 유지 (기존 copyFromHistory 그대로)
  - 새 함수 `copySingleExercise(exercise)` 추가:
    - `exercises.value.length >= 20` 체크 → 제한 초과 시 return (toast나 alert 불필요, 버튼 disabled 처리)
    - `exercises.value.push({ name: exercise.name || '', sets: exercise.sets ?? 3, reps: exercise.reps ?? 10, memo: exercise.memo || '' })`
    - `saveSuccess.value = false`
  - 히스토리 아이템 펼침 상태 관리: `expandedHistoryId = ref(null)` + toggle 함수
  - 개별 복사 "+" 버튼: `exercises.length >= 20`이면 `:disabled="true"`

  **Must NOT do**:
  - `useWorkoutPlans.js` composable 수정 금지
  - `copyFromHistory(plan)` 함수 제거 금지 (유지)
  - 운동 저장 로직 변경 금지
  - workout_plans 테이블 스키마 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 기존 뷰 내 복잡한 UI 패턴 변경 (아코디언 + 개별 복사 로직)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 10, 11)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/TodayWorkoutView.vue:173-197` — 현재 히스토리 섹션 template. `v-for="plan in workoutPlans"` 구조. 이 부분을 아코디언으로 변경
  - `src/views/trainer/TodayWorkoutView.vue:315-324` — `copyFromHistory(plan)` 함수. 이 함수는 유지. 새 `copySingleExercise` 함수를 그 아래에 추가
  - `src/views/trainer/TodayWorkoutView.vue:309-312` — `addExercise()` 함수. 20개 제한 체크 패턴 참고 (`exercises.value.length >= 20`)
  - `src/views/trainer/TodayWorkoutView.vue:339-344` — `formatHistoryPreview()`. 접힌 상태에서 미리보기 텍스트로 계속 사용

  **WHY Each Reference Matters**:
  - lines 173-197: 변경 대상 template. v-for 구조를 아코디언으로 확장
  - lines 315-324: 기존 전체 복사 함수 유지 위치. 새 함수는 이 패턴과 일관된 스타일
  - lines 309-312: 20개 제한 체크 패턴을 동일하게 copySingleExercise에 적용

  **Acceptance Criteria**:

  ```
  Scenario: 히스토리 아코디언 토글 + 개별 운동 표시
    Tool: Playwright
    Preconditions: 트레이너 로그인 + 회원에게 과거 운동 배정 이력 존재
    Steps:
      1. Navigate to TodayWorkoutView (해당 회원)
      2. 히스토리 섹션까지 스크롤
      3. 히스토리 아이템의 토글 버튼 클릭
      4. Assert: 개별 운동 목록이 펼쳐짐 (운동 이름 + sets×reps + "+" 버튼)
    Expected Result: 아코디언이 열리고 개별 운동이 표시됨
    Failure Indicators: 클릭해도 펼쳐지지 않거나 운동 목록 미표시
    Evidence: .sisyphus/evidence/task-6-accordion-open.png

  Scenario: 개별 운동 복사 시 현재 목록에 추가
    Tool: Playwright
    Preconditions: 현재 운동 목록에 1개 운동 존재 + 히스토리 펼침 상태
    Steps:
      1. 현재 운동 목록의 아이템 수 확인 (N개)
      2. 히스토리 운동의 "+" 버튼 클릭
      3. Assert: 현재 운동 목록 아이템 수 = N+1
      4. Assert: 추가된 운동의 이름이 히스토리 운동 이름과 동일
    Expected Result: 현재 목록에 운동이 추가됨 (기존 운동 유지)
    Failure Indicators: 기존 운동이 대체되거나 추가 안 됨
    Evidence: .sisyphus/evidence/task-6-single-copy.png

  Scenario: 전체 복사 버튼 여전히 동작
    Tool: Playwright
    Preconditions: 히스토리 존재
    Steps:
      1. "전체 복사" 버튼 (또는 기존 "복사" 버튼) 클릭
      2. Assert: 현재 운동 목록이 해당 날짜의 전체 운동으로 대체됨
    Expected Result: 전체 복사 기능 유지
    Failure Indicators: 전체 복사 버튼 사라짐 또는 동작 안 함
    Evidence: .sisyphus/evidence/task-6-full-copy.png

  Scenario: 20개 제한 시 복사 버튼 비활성화
    Tool: Playwright
    Preconditions: 현재 운동 목록에 20개 운동 존재
    Steps:
      1. 히스토리 펼침
      2. "+" 버튼의 disabled 속성 확인
      3. Assert: disabled="true" 또는 disabled 속성 존재
    Expected Result: 20개 제한 시 복사 불가
    Failure Indicators: 버튼이 활성화됨
    Evidence: .sisyphus/evidence/task-6-limit-disabled.png
  ```

  **Commit**: YES (separate)
  - Message: `feat(workout): add per-exercise copy from history`
  - Files: `src/views/trainer/TodayWorkoutView.vue`
  - Pre-commit: `npm run build`

- [ ] 7. TodayWorkoutView 히스토리 아코디언 CSS 스타일링

  **What to do**:
  - `src/views/trainer/TodayWorkoutView.css` 수정:
    - 아코디언 토글 버튼 스타일 (회전 화살표 아이콘)
    - 개별 운동 아이템 스타일 (이름 + sets×reps + "+" 버튼 행)
    - 아코디언 펼침/접힘 transition (max-height + opacity, CSS only)
    - "+" 복사 버튼 스타일 (작은 원형 또는 아이콘 버튼)
    - disabled 상태 스타일 (opacity 감소)
  - BEM 네이밍: `today-workout__history-exercises`, `today-workout__history-exercise-item`, `today-workout__history-copy-single` 등
  - CSS Custom Properties 사용 (색상, 간격, 반지름)

  **Must NOT do**:
  - template/script 변경 금지 (Task 6에서 완료)
  - 히스토리 섹션 이외의 CSS 변경 금지
  - 하드코딩된 색상/크기 사용 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CSS 스타일링만. template 구조는 Task 6에서 완성됨
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 8, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/views/trainer/TodayWorkoutView.css` — 기존 히스토리 아이템 스타일. `.today-workout__history-item`, `.today-workout__history-copy` 등 기존 BEM 클래스 참고

  **WHY Each Reference Matters**:
  - 기존 CSS 파일의 스타일 패턴 (간격, 색상 변수, 반지름)을 따라야 시각적 일관성 유지

  **Acceptance Criteria**:

  ```
  Scenario: 아코디언 스타일 적용 확인
    Tool: Playwright
    Preconditions: Task 6 + Task 7 완료
    Steps:
      1. Navigate to TodayWorkoutView
      2. Screenshot 캡처
      3. 아코디언 토글 클릭 → 펼침 상태 Screenshot
    Expected Result: 아코디언이 스타일링되어 있고, 토글 시 전환 애니메이션 동작
    Failure Indicators: 스타일 미적용 또는 레이아웃 깨짐
    Evidence: .sisyphus/evidence/task-7-accordion-style.png

  Scenario: npm run build 성공
    Tool: Bash
    Preconditions: Task 7 완료
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: 빌드 성공
    Evidence: .sisyphus/evidence/task-7-build.txt
  ```

  **Commit**: YES (groups with Task 6)
  - Message: `feat(workout): add per-exercise copy from history`
  - Files: `src/views/trainer/TodayWorkoutView.css`
  - Pre-commit: `npm run build`

---

- [ ] 8. TrainerHomeView 전체 리디자인 + 애니메이션

  **What to do**:
  - `src/views/trainer/TrainerHomeView.vue` 전체 template 리디자인:
    - 동일한 데이터 소스 유지 (useMembers, useReservations, useChat, useTrainerSearch, useWorkoutPlans)
    - 동일한 navigation 타겟 유지 (각 카드/버튼의 router.push 대상 동일)
    - 모던 피트니스 앱 스타일 레이아웃:
      - 프로필 헤더: 큰 인사말 + 작은 아바타 → 모던 그라데이션 or 클린 화이트 헤더
      - 통계 카드: 2-col grid → 큰 숫자 + 라벨 + 아이콘 카드
      - 오늘의 일정: 타임라인 스타일 또는 카드 리스트
      - 최근 메시지: 아바타 + 미리보기 카드
    - 카드/요소 마이크로 애니메이션:
      - 카드 등장: `@keyframes fadeSlideUp` (translateY + opacity)
      - 리스트 아이템 순차 등장: CSS `animation-delay` stagger (각 아이템에 `--stagger-index` CSS variable 적용)
      - 통계 숫자 카운트업 효과 (선택적)
    - `@media (prefers-reduced-motion: reduce)`: 모든 animation/transition을 `none` 또는 `0s`로
    - 애니메이션은 초기 로드 시에만 (`v-if` 조건이 true될 때). pull-to-refresh 후에는 재실행 안 함 (CSS class toggle로 제어)
  - `src/views/trainer/TrainerHomeView.css` 전체 리디자인:
    - 새 레이아웃에 맞는 CSS
    - CSS 애니메이션 키프레임
    - global.css 토큰 활용 (Task 10에서 추가하는 애니메이션 토큰 포함)
    - BEM 네이밍 유지
  - AppPullToRefresh 래퍼 유지
  - empty/loading/error 상태 유지
  - 480px max-width 모바일 레이아웃 유지

  **Must NOT do**:
  - composable import 변경 금지 (동일 데이터 소스)
  - navigation 타겟 (router.push 대상) 변경 금지
  - pull-to-refresh 동작 변경 금지
  - 페이지 전환 애니메이션 추가 금지
  - width/height/margin/padding 애니메이션 사용 금지 (transform + opacity만)
  - 새 컴포넌트 생성 금지 (view 파일 내에서만)
  - npm 패키지 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 전체 UI 리디자인 + CSS 애니메이션 = 시각 디자인 중심 작업
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 디자인 없이 자체 UI/UX 설계 필요. 모던 피트니스 앱 스타일 구현

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 7, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerHomeView.vue:1-344` — 현재 전체 구현. template(1-213), script(215-344). script의 데이터 fetching/computed 로직은 그대로 유지하고 template만 리디자인
  - `src/views/trainer/TrainerHomeView.css` — 현재 CSS. 전체 교체 대상이지만 기존 BEM 네이밍 패턴 참고

  **API/Type References**:
  - `src/composables/useReservations.js` — 예약 데이터 shape (date, start_time, end_time, status, member profiles)
  - `src/composables/useMembers.js` — 회원 리스트 shape (name, photo_url, reservation stats)
  - `src/composables/useChat.js` — 채팅 데이터 shape (partner name, last message, unread count)

  **External References**:
  - global.css의 디자인 토큰 — 애니메이션 토큰은 Task 10에서 추가됨. `--animation-duration-normal`, `--animation-stagger-delay` 등 사용

  **WHY Each Reference Matters**:
  - TrainerHomeView.vue 전체: script 로직은 보존, template만 리디자인. 어떤 변수/computed가 template에서 사용되는지 정확히 파악 필수
  - composable data shapes: 리디자인 시 어떤 데이터 필드를 표시할 수 있는지 결정

  **Acceptance Criteria**:

  ```
  Scenario: TrainerHomeView 리디자인 렌더링 확인
    Tool: Playwright
    Preconditions: 트레이너 로그인 + 데이터 존재
    Steps:
      1. Navigate to /trainer/home
      2. Wait for data load (loading 상태 해제)
      3. Screenshot 전체 페이지
      4. Assert: 프로필 헤더, 통계 카드, 일정 섹션, 메시지 섹션 모두 표시
    Expected Result: 모든 기존 데이터 섹션이 새 디자인으로 렌더링
    Failure Indicators: 섹션 누락 또는 데이터 미표시
    Evidence: .sisyphus/evidence/task-8-trainer-home-redesign.png

  Scenario: 카드 등장 애니메이션 확인
    Tool: Playwright
    Preconditions: 트레이너 로그인
    Steps:
      1. Navigate to /trainer/home
      2. 페이지 로드 직후 즉시 screenshot (애니메이션 시작 상태)
      3. 1초 후 screenshot (애니메이션 완료 상태)
      4. Assert: 두 스크린샷이 다름 (카드가 등장 애니메이션)
    Expected Result: 카드 등장 애니메이션 동작
    Evidence: .sisyphus/evidence/task-8-animation.png

  Scenario: prefers-reduced-motion 적용 확인
    Tool: Bash (grep)
    Preconditions: Task 8 완료
    Steps:
      1. grep -n "prefers-reduced-motion" src/views/trainer/TrainerHomeView.css
      2. Assert: 매칭 존재
    Expected Result: reduced motion 미디어 쿼리 적용
    Evidence: .sisyphus/evidence/task-8-reduced-motion.txt

  Scenario: navigation 타겟 보존 확인
    Tool: Bash (grep)
    Preconditions: Task 8 완료
    Steps:
      1. grep -n "router.push\|router.replace" src/views/trainer/TrainerHomeView.vue
      2. Assert: trainer-members, trainer-reservations, trainer-schedule 등 기존 타겟 모두 유지
    Expected Result: 모든 네비게이션 타겟 동일
    Evidence: .sisyphus/evidence/task-8-nav-targets.txt

  Scenario: npm run build 성공
    Tool: Bash
    Steps:
      1. npm run build
      2. Assert: exit code 0
    Expected Result: 빌드 성공
    Evidence: .sisyphus/evidence/task-8-build.txt
  ```

  **Commit**: YES (separate)
  - Message: `feat(dashboard): redesign trainer and member home with animations`
  - Files: `src/views/trainer/TrainerHomeView.vue`, `src/views/trainer/TrainerHomeView.css`
  - Pre-commit: `npm run build`

- [ ] 9. MemberHomeView 전체 리디자인 + 애니메이션

  **What to do**:
  - `src/views/member/MemberHomeView.vue` 전체 template 리디자인:
    - 동일한 데이터 소스 유지 (useReservations, usePtSessions, useNotifications, useWorkoutPlans)
    - 동일한 navigation 타겟 유지
    - 모던 피트니스 앱 스타일:
      - 프로필 헤더: 이름 + PT 잔여 + 알림 벨
      - 다음 PT 세션: 카운트다운 느낌의 큰 카드 (날짜 + 시간 + 트레이너)
      - 오늘의 운동: 운동 미리보기 카드
      - 주간 목표: 진행률 바 or 원형 프로그레스 (기존 SVG 유지 가능)
      - Unconnected state (트레이너 없음): 기존 기능 유지
    - 카드/요소 마이크로 애니메이션:
      - 카드 등장: fadeSlideUp (TrainerHomeView와 동일 패턴)
      - 리스트 아이템 stagger
      - PT 잔여 카운트 badge 등장 효과
    - `@media (prefers-reduced-motion: reduce)` 적용
    - 초기 로드 시에만 애니메이션 (pull-to-refresh 후 X)
  - `src/views/member/MemberHomeView.css` 전체 리디자인
  - AppPullToRefresh + empty/loading/error 상태 유지
  - 480px max-width 유지

  **Must NOT do**:
  - (Task 8과 동일한 금지사항)
  - composable import 변경 금지
  - navigation 타겟 변경 금지
  - pull-to-refresh 동작 변경 금지
  - 페이지 전환 애니메이션 금지
  - layout thrash 애니메이션 금지
  - 새 컴포넌트/npm 패키지 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Task 8과 동일 — 전체 UI 리디자인 + CSS 애니메이션
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 자체 UI/UX 설계 필요

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 7, 8)
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `src/views/member/MemberHomeView.vue:1-367` — 현재 전체 구현. script 로직 보존, template 리디자인
  - `src/views/member/MemberHomeView.css` — 전체 교체 대상
  - `src/views/trainer/TrainerHomeView.vue` (Task 8 완료 후) — 동일한 애니메이션 패턴/토큰 사용하여 일관성 확보

  **API/Type References**:
  - `src/composables/useReservations.js` — 예약 데이터 shape
  - `src/composables/usePtSessions.js` — PT 잔여 횟수 (remainingCount computed)
  - `src/composables/useWorkoutPlans.js` — 오늘의 운동 데이터 (exercises array)
  - `src/composables/useNotifications.js` — 미읽음 카운트

  **WHY Each Reference Matters**:
  - MemberHomeView.vue 전체: script 보존 + template 리디자인. Unconnected state (hasTrainer === false) 특히 주의
  - Task 8 결과: 두 대시보드가 동일한 디자인 시스템/애니메이션 패턴 사용해야 일관성 유지

  **Acceptance Criteria**:

  ```
  Scenario: MemberHomeView 리디자인 렌더링 확인
    Tool: Playwright
    Preconditions: 회원 로그인 + 트레이너 연결됨 + 데이터 존재
    Steps:
      1. Navigate to /home (MemberHomeView)
      2. Wait for data load
      3. Screenshot 전체 페이지
      4. Assert: 헤더, 다음 PT, 오늘 운동, 주간 목표 섹션 모두 표시
    Expected Result: 모든 기존 데이터 섹션이 새 디자인으로 렌더링
    Evidence: .sisyphus/evidence/task-9-member-home-redesign.png

  Scenario: Unconnected state 유지 확인
    Tool: Playwright
    Preconditions: 회원 로그인 + 트레이너 연결 안 됨
    Steps:
      1. Navigate to /home
      2. Assert: "아직 담당 트레이너가 없습니다" 또는 유사 안내 표시
      3. Assert: 트레이너 찾기 버튼 존재
    Expected Result: 미연결 상태 UI 정상 표시
    Evidence: .sisyphus/evidence/task-9-unconnected-state.png

  Scenario: prefers-reduced-motion + 빌드 확인
    Tool: Bash
    Steps:
      1. grep -n "prefers-reduced-motion" src/views/member/MemberHomeView.css
      2. Assert: 매칭 존재
      3. npm run build
      4. Assert: exit code 0
    Expected Result: reduced motion 적용 + 빌드 성공
    Evidence: .sisyphus/evidence/task-9-build.txt
  ```

  **Commit**: YES (groups with Task 8)
  - Message: `feat(dashboard): redesign trainer and member home with animations`
  - Files: `src/views/member/MemberHomeView.vue`, `src/views/member/MemberHomeView.css`
  - Pre-commit: `npm run build`

---

- [ ] 10. 애니메이션 디자인 토큰 (global.css)

  **What to do**:
  - `src/assets/css/global.css`에 애니메이션 관련 CSS Custom Properties 추가:
    ```css
    --animation-duration-fast: 0.2s;
    --animation-duration-normal: 0.4s;
    --animation-duration-slow: 0.6s;
    --animation-easing-default: cubic-bezier(0.4, 0, 0.2, 1);
    --animation-easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
    --animation-stagger-delay: 0.06s;
    ```
  - 공통 키프레임 정의 (global scope):
    ```css
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    ```
  - `@media (prefers-reduced-motion: reduce)` 글로벌 규칙:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    ```

  **Must NOT do**:
  - 기존 CSS 변수 변경/삭제 금지
  - 기존 글로벌 스타일 변경 금지
  - 컴포넌트별 스타일을 global.css에 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: global.css에 변수와 키프레임만 추가. 매우 간단
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 6, 11)
  - **Blocks**: Task 8, Task 9
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/assets/css/global.css` — 기존 디자인 토큰 (Colors, Typography, Layout, Spacing, Components). 새 Animation 섹션을 Components 섹션 아래에 추가

  **WHY Each Reference Matters**:
  - 기존 토큰 구조(섹션별 주석으로 구분)를 따라야 일관성 유지

  **Acceptance Criteria**:

  ```
  Scenario: 애니메이션 토큰 존재 확인
    Tool: Bash (grep)
    Steps:
      1. grep -n "animation-duration-normal\|animation-stagger-delay\|fadeSlideUp\|prefers-reduced-motion" src/assets/css/global.css
      2. Assert: 4개 모두 매칭
    Expected Result: 모든 토큰과 키프레임 존재
    Evidence: .sisyphus/evidence/task-10-tokens.txt
  ```

  **Commit**: YES (groups with Tasks 8, 9)
  - Message: `feat(dashboard): redesign trainer and member home with animations`
  - Files: `src/assets/css/global.css`
  - Pre-commit: `npm run build`

- [ ] 11. Composable 테스트: softDeleteAccount + cancelAccountDeletion

  **What to do**:
  - 새 테스트 파일 `src/composables/__tests__/useProfileSoftDelete.test.js` 생성:
    - 기존 `useProfile.test.js`의 패턴 따름 (vi.hoisted mocks, createBuilder helper)
    - 테스트 케이스:
      1. `softDeleteAccount()` — `soft_delete_user_account` RPC 호출 확인
      2. `softDeleteAccount()` — 스토리지 삭제 미호출 확인 (storage.from 미호출)
      3. `softDeleteAccount()` — 연결된 사용자에게 알림 생성 확인
      4. `softDeleteAccount()` — 알림 메시지에 "탈퇴 예정" 포함 확인
      5. `softDeleteAccount()` — signOut 호출 확인
      6. `softDeleteAccount()` — RPC 에러 시 error ref 설정 확인
      7. `cancelAccountDeletion()` — `cancel_account_deletion` RPC 호출 확인
      8. `cancelAccountDeletion()` — 성공 시 true 반환 확인
      9. `cancelAccountDeletion()` — RPC 에러 시 false 반환 + error 설정 확인
  - 기존 테스트 파일 수정 금지 — 완전히 새로운 파일

  **Must NOT do**:
  - `src/composables/__tests__/useProfile.test.js` 수정 금지
  - 다른 기존 테스트 파일 수정 금지
  - Vue 컴포넌트/뷰 테스트 작성 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 복잡한 mock 설정 + Supabase 패턴 이해 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 1+2 complete)
  - **Parallel Group**: Wave 2 (Task 1 완료 후)
  - **Blocks**: None
  - **Blocked By**: Task 1 (마이그레이션), Task 2 (composable 변경)

  **References**:

  **Pattern References**:
  - `src/composables/__tests__/useProfile.test.js` — 기존 테스트 패턴. vi.hoisted로 mock 선언, createBuilder helper 함수, supabase mock 구조 참고. 이 파일은 수정하지 않지만 패턴을 복사하여 새 파일 작성

  **API/Type References**:
  - `src/composables/useProfile.js:253-336` — 테스트 대상 함수들의 구현. mock 설정 시 어떤 Supabase 호출이 일어나는지 확인

  **WHY Each Reference Matters**:
  - useProfile.test.js: 동일한 mock 구조를 사용해야 일관성 + 기존 85개 테스트와 공존

  **Acceptance Criteria**:

  ```
  Scenario: 새 테스트 파일 실행 성공
    Tool: Bash
    Steps:
      1. npx vitest run src/composables/__tests__/useProfileSoftDelete.test.js
      2. Assert: 모든 테스트 통과
    Expected Result: 9개 테스트 모두 PASS
    Failure Indicators: 테스트 실패 또는 파일 미존재
    Evidence: .sisyphus/evidence/task-11-tests.txt

  Scenario: 전체 테스트 스위트 통과
    Tool: Bash
    Steps:
      1. npx vitest run
      2. Assert: 94+ 테스트 통과 (기존 85 + 신규 9)
    Expected Result: 전체 테스트 성공, 기존 테스트 깨지지 않음
    Evidence: .sisyphus/evidence/task-11-all-tests.txt
  ```

  **Commit**: YES (separate)
  - Message: `test: add soft delete composable tests`
  - Files: `src/composables/__tests__/useProfileSoftDelete.test.js`
  - Pre-commit: `npx vitest run`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify BEM naming + CSS custom properties used.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Commit A**: `feat(auth): add soft delete with 30-day grace period` — DB migration + useProfile + auth store + router + views (Tasks 1-5)
- **Commit B**: `feat(workout): add per-exercise copy from history` — TodayWorkoutView changes (Tasks 6-7)
- **Commit C**: `feat(dashboard): redesign trainer and member home with animations` — Dashboard views + global.css tokens (Tasks 8-10)
- **Commit D**: `test: add soft delete composable tests` — Test files (Task 11)

---

## Success Criteria

### Verification Commands
```bash
npx vitest run          # Expected: 85+ tests passing, 0 failures
npm run build           # Expected: no errors, dist/ generated
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All existing 85 tests pass
- [ ] New soft delete tests pass
- [ ] Production build succeeds
