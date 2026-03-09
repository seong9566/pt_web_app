# 계정 삭제 (탈퇴) 기능 완성

## TL;DR

> **Quick Summary**: 기존 불완전한 `softDeleteAccount()` 함수를 보강하여 Storage 파일 정리 → 연결 알림 발송 → RPC로 auth.users 삭제 (CASCADE로 전체 데이터 자동 삭제) → signOut의 완전한 계정 삭제 플로우를 구현합니다.
>
> **Deliverables**:
> - DB 마이그레이션: `delete_user_account()` RPC 함수 + `notification_type` enum 확장 + `chat-files` SELECT 정책
> - `useProfile.js`: `softDeleteAccount()` 보강 (Storage 정리 + 알림 + RPC 호출)
> - 양쪽 Settings 뷰: 삭제 버튼 로딩/비활성 상태 추가
> - `supabase/schema.sql`: RPC 함수 + 정책 문서화
> - Vitest 테스트: `useProfile.test.js` 신규 생성
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 (DB) → Task 2 (Composable) → Tasks 3/4 (parallel) → Task 5 → F1-F4

---

## Context

### Original Request
README에 "미구현"으로 명시된 계정 삭제(탈퇴) 기능을 완성합니다.

### Interview Summary
**Key Discussions**:
- 데이터 처리: 소프트 삭제 (프로필 비활성화) + auth.users 하드 삭제 (CASCADE로 전체 정리)
- auth.users 삭제: PostgreSQL RPC 함수 (SECURITY DEFINER) 사용 — Edge Function 불필요
- 확인 UI: AppBottomSheet (이미 구현됨)
- 트레이너 탈퇴 시: 연결된 회원에게 알림 발송 후 CASCADE로 trainer_members 삭제
- 결제 기록: 현재는 무시 (추후 실제 결제 연동 시 별도 아카이브)

**Research Findings**:
- `softDeleteAccount()` 이미 존재하지만 불완전 (이름 변경 + signOut만)
- 양쪽 Settings 뷰에 삭제 UI 이미 구현됨 (AppBottomSheet + '탈퇴' 확인 입력)
- DB의 23개 FK 모두 ON DELETE CASCADE → auth.users 삭제로 전체 데이터 자동 삭제
- Storage 파일 정리 미구현, 알림 미발송, auth.users 미삭제

### Metis Review
**Identified Gaps** (addressed):
- **CRITICAL — Storage 소유권 차단**: Supabase는 Storage 객체를 소유한 사용자를 삭제할 수 없음 → Storage 정리가 auth.users 삭제의 **선행 조건**
- **trainer_members 상태 변경 불가**: CASCADE DELETE로 행 자체가 삭제됨 → status='disconnected' 설정 불가. 대신 삭제 전에 알림 발송으로 대체
- **notification_type enum 미확장**: 새 알림 타입 필요 → `ALTER TYPE` 마이그레이션 필요
- **chat-files SELECT 정책 미존재**: `storage.list()` 호출 시 빈 결과 반환 가능 → SELECT 정책 추가 필요
- **이중 클릭 방지**: 삭제 버튼에 로딩/비활성 상태 없음 → 추가 필요
- **알림 발송 순서**: 프로필 CASCADE 삭제 후에는 알림 insert 불가 → 삭제 전에 발송 필수

---

## Work Objectives

### Core Objective
기존 불완전한 계정 삭제 기능을 보강하여, Storage 정리 → 알림 발송 → auth.users RPC 삭제 → signOut의 완전한 탈퇴 플로우를 구현합니다.

### Concrete Deliverables
- Supabase 마이그레이션: `delete_user_account()` RPC 함수
- Supabase 마이그레이션: `notification_type` enum에 `'account_deleted'` 추가
- Supabase 마이그레이션: `chat-files` 버킷 SELECT 정책 추가
- `src/composables/useProfile.js`: `softDeleteAccount()` 보강
- `src/views/trainer/SettingsView.vue`: 삭제 버튼 로딩 상태 추가
- `src/views/member/MemberSettingsView.vue`: 동일
- `supabase/schema.sql`: RPC + 정책 문서 반영
- `src/composables/__tests__/useProfile.test.js`: 신규 테스트

### Definition of Done
- [ ] `npm run build` 성공 (exit code 0)
- [ ] `npx vitest run` 전체 테스트 통과
- [ ] `delete_user_account()` RPC 함수가 DB에 존재
- [ ] `notification_type` enum에 `account_deleted` 값 존재
- [ ] Storage 정리 → RPC 삭제 → signOut 순서가 올바르게 동작

### Must Have
- Storage 파일 삭제가 auth.users 삭제보다 **먼저** 실행되어야 함
- RPC 함수가 `auth.uid()`만 사용 (user_id 파라미터 금지)
- 연결된 트레이너/회원에게 삭제 전 알림 발송
- 삭제 버튼 이중 클릭 방지 (로딩 상태)
- 기존 UI 흐름 유지 (AppBottomSheet + '탈퇴' 확인)

### Must NOT Have (Guardrails)
- ❌ Edge Function 배포 — RPC 함수로 처리
- ❌ 결제 기록 아카이빙 — 추후 별도 처리
- ❌ 탈퇴 유예 기간 / 되돌리기 기능
- ❌ 탈퇴 사유 설문
- ❌ 이메일/SMS 추가 확인
- ❌ 관리자 알림
- ❌ JWT 강제 만료 / 다른 세션 강제 로그아웃
- ❌ FK CASCADE 동작 변경
- ❌ 새로운 UI 컴포넌트 생성
- ❌ 새로운 npm 패키지 추가
- ❌ TypeScript 추가
- ❌ user_id를 RPC 파라미터로 전달 (보안 위험)
- ❌ SQL 내부에서 Storage 삭제 시도

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: Tests-after
- **Framework**: Vitest
- **Scope**: `useProfile.test.js` 신규 생성 (softDeleteAccount 시나리오)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **DB**: Use Supabase MCP — execute_sql로 RPC/enum/정책 존재 확인
- **Frontend/UI**: Use Playwright — 삭제 플로우 UI 검증
- **Composable**: Use Bash — `npx vitest run {file}`
- **Build**: Use Bash — `npm run build`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — DB foundation):
└── Task 1: DB 마이그레이션 (RPC + enum + 정책) [quick]

Wave 2 (After Wave 1 — composable + schema):
├── Task 2: useProfile.softDeleteAccount() 보강 [unspecified-high]
└── Task 3: schema.sql 문서 반영 [quick]

Wave 3 (After Wave 2 — views + tests, parallel):
├── Task 4: Settings 뷰 로딩 상태 추가 [quick]
└── Task 5: Vitest 테스트 추가 [quick]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 4/5 → F1-F4
Parallel Speedup: ~40% faster than sequential
Max Concurrent: 2 (Waves 2, 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2 | 1 |
| 2 | 1 | 4, 5 | 2 |
| 3 | — | — | 2 |
| 4 | 2 | F1-F4 | 3 |
| 5 | 2 | F1-F4 | 3 |

### Agent Dispatch Summary

| Wave | Tasks | Categories |
|------|-------|-----------|
| 1 | 1 | Task 1 → `quick` |
| 2 | 2 | Task 2 → `unspecified-high`, Task 3 → `quick` |
| 3 | 2 | Task 4 → `quick`, Task 5 → `quick` |
| FINAL | 4 | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep` |

---

## TODOs

- [x] 1. DB 마이그레이션: RPC 함수 + enum 확장 + Storage 정책

  **What to do**:
  - Supabase MCP를 사용하여 3개 마이그레이션을 적용한다:

  **1-1. `delete_user_account()` RPC 함수 생성**:
  ```sql
  CREATE OR REPLACE FUNCTION delete_user_account()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
  END;
  $$;
  ```
  - `SECURITY DEFINER` + `SET search_path = public` 패턴은 기존 `connect_via_invite` RPC와 동일
  - `auth.uid()` 사용으로 현재 인증된 사용자만 삭제 가능 (user_id 파라미터 절대 금지)
  - auth.users 삭제 시 profiles → 나머지 22개 테이블이 ON DELETE CASCADE로 자동 삭제됨

  **1-2. `notification_type` enum 확장**:
  ```sql
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_deleted';
  ```

  **1-3. `chat-files` 버킷 SELECT 정책 추가**:
  ```sql
  CREATE POLICY "Users can list own chat files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);
  ```
  - 현재 chat-files 버킷에 SELECT 정책이 없어서 `storage.list()` 호출 시 빈 결과 반환
  - avatars와 manual-media는 이미 SELECT 정책 존재

  **Must NOT do**:
  - user_id를 RPC 파라미터로 받지 않음 — 보안 위험
  - FK CASCADE 동작 변경 금지
  - 기존 RLS 정책 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: SQL 마이그레이션 3개 적용만, Supabase MCP 사용
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (단독)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `supabase/schema.sql:458-494` — `connect_via_invite` RPC 함수 패턴 (SECURITY DEFINER, SET search_path)
  - `supabase/schema.sql:732-737` — `notification_type` enum 정의 (기존 10개 값)

  **API/Type References**:
  - `supabase/schema.sql:22-36` — profiles 테이블 (auth.users FK)
  - `supabase/schema.sql:685-710` — Storage 정책 패턴 (avatars 버킷 참조)

  **WHY Each Reference Matters**:
  - connect_via_invite RPC: 동일한 SECURITY DEFINER 패턴을 따라 auth.users 접근 권한 확보
  - notification_type enum: 새 값 추가 시 기존 enum과 충돌 방지 확인
  - Storage 정책: chat-files SELECT 정책을 기존 avatars 정책 패턴과 동일하게 생성

  **Acceptance Criteria**:
  - [ ] `delete_user_account()` RPC 함수가 DB에 존재
  - [ ] `notification_type` enum에 `account_deleted` 값 존재
  - [ ] `chat-files` 버킷에 SELECT 정책이 추가됨

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: RPC 함수 존재 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. SELECT proname FROM pg_proc WHERE proname = 'delete_user_account'
      2. 결과가 1행인지 확인
    Expected Result: delete_user_account 함수 존재
    Failure Indicators: 0행 반환
    Evidence: .sisyphus/evidence/task-1-rpc-exists.txt

  Scenario: notification_type enum 확장 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. SELECT enumlabel FROM pg_enum WHERE enumtypid = 'notification_type'::regtype AND enumlabel = 'account_deleted'
      2. 결과가 1행인지 확인
    Expected Result: account_deleted 값 존재
    Failure Indicators: 0행 반환
    Evidence: .sisyphus/evidence/task-1-enum-exists.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add delete_user_account RPC, account_deleted notification type, chat-files select policy`
  - Files: (Supabase migration)
  - Pre-commit: SQL 검증

---

- [x] 2. useProfile.softDeleteAccount() 보강

  **What to do**:
  - `useProfile.js`의 기존 `softDeleteAccount()` 함수(251-266줄)를 다음 순서로 보강한다:

  **실행 순서 (CRITICAL — 이 순서를 반드시 지켜야 함)**:
  1. **연결된 사용자 조회**: `supabase.from('trainer_members').select('trainer_id, member_id').or(`trainer_id.eq.${auth.user.id},member_id.eq.${auth.user.id}`).eq('status', 'active')` 호출
  2. **알림 발송**: 각 연결된 사용자에게 `createNotification(targetUserId, 'account_deleted', '연결된 사용자가 탈퇴했습니다', '{userName}님이 탈퇴했습니다.')` 호출. 알림 실패는 삭제를 차단하지 않음 (best-effort)
  3. **Storage 정리** (best-effort, 실패 시 continue):
     - `supabase.storage.from('avatars').list(auth.user.id)` → 파일 목록 → `remove(paths)`
     - `supabase.storage.from('chat-files').list(auth.user.id)` → 파일 목록 → `remove(paths)`
     - trainer인 경우: `supabase.from('manuals').select('id').eq('trainer_id', auth.user.id)` → 각 manual의 media 파일 삭제
     - Storage 삭제 실패 시 `console.warn`으로 로깅하고 계속 진행 (useManuals.js:189-201 패턴)
  4. **RPC 호출**: `supabase.rpc('delete_user_account')` — auth.users 삭제 → CASCADE로 전체 공개 테이블 자동 삭제
  5. **signOut**: `supabase.auth.signOut()` — 로컬 세션 정리
  6. **return true**

  - `useNotifications`의 `createNotification`을 import하여 사용
  - 기존 `softDeleteAccount()` 내부의 프로필 이름 변경 로직(`update({ name: '탈퇴한 사용자' })`)은 **제거** — CASCADE가 프로필 자체를 삭제하므로 불필요
  - error 발생 시 `error.value` 설정 + `return false` (기존 패턴 유지)

  **Must NOT do**:
  - user_id를 RPC 파라미터로 전달하지 않음
  - SQL 내부에서 Storage 삭제 시도하지 않음
  - Storage 삭제 실패가 전체 플로우를 차단하지 않음 (best-effort)
  - 알림 실패가 전체 플로우를 차단하지 않음 (best-effort)
  - 기존 함수명 변경 금지 (softDeleteAccount 유지)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 복잡한 비즈니스 로직 (5단계 실행 순서 + 에러 처리 + Storage API + RPC)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 3과 병렬 가능)
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/composables/useProfile.js:251-266` — 기존 softDeleteAccount 함수 (이 함수를 보강)
  - `src/composables/useManuals.js:189-201` — Storage 삭제 best-effort 패턴 (실패 시 console.warn + 계속)
  - `src/composables/useManuals.js:227-240` — Storage upload 패턴 (supabase.storage.from().upload())

  **API/Type References**:
  - `src/composables/useNotifications.js:99-115` — createNotification(userId, type, title, body, targetId, targetType) 함수 시그니처
  - `src/composables/useProfile.js:return문` — export 목록 (softDeleteAccount이 이미 포함)
  - `src/stores/auth.js:219-235` — signOut 함수 (참조용)

  **External References**:
  - Supabase Storage JS API: `list(path)`, `remove(paths)` 메서드

  **WHY Each Reference Matters**:
  - 기존 softDeleteAccount: 보강 대상 함수의 현재 구현 확인
  - useManuals Storage 패턴: 동일한 best-effort 삭제 패턴을 복사하여 일관성 유지
  - createNotification: 알림 발송에 필요한 정확한 파라미터 순서
  - signOut: 삭제 후 로컬 세션 정리 확인

  **Acceptance Criteria**:
  - [ ] softDeleteAccount에서 Storage 파일 삭제 로직이 포함됨
  - [ ] softDeleteAccount에서 연결된 사용자에게 알림이 발송됨
  - [ ] softDeleteAccount에서 RPC `delete_user_account` 호출이 포함됨
  - [ ] Storage/알림 실패가 전체 플로우를 차단하지 않음
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: softDeleteAccount 코드 구조 확인
    Tool: Bash (grep)
    Preconditions: 없음
    Steps:
      1. grep -n 'delete_user_account' src/composables/useProfile.js
      2. RPC 호출이 존재하는지 확인
      3. grep -n 'storage.from' src/composables/useProfile.js
      4. Storage 정리 코드가 존재하는지 확인
      5. grep -n 'createNotification' src/composables/useProfile.js
      6. 알림 발송 코드가 존재하는지 확인
    Expected Result: RPC 호출, Storage 정리, 알림 발송 코드 모두 존재
    Failure Indicators: 3개 중 하나라도 누락
    Evidence: .sisyphus/evidence/task-2-composable-structure.txt

  Scenario: Storage 삭제 실패 시 계속 진행 확인
    Tool: Bash (grep)
    Preconditions: 없음
    Steps:
      1. grep -A5 'storage.from' src/composables/useProfile.js
      2. try-catch 또는 .catch() 패턴이 존재하는지 확인
      3. console.warn 또는 무시 패턴이 존재하는지 확인
    Expected Result: Storage 삭제가 try-catch로 감싸져 있고 실패 시 계속 진행
    Failure Indicators: Storage 삭제 실패가 throw되어 전체 플로우 중단
    Evidence: .sisyphus/evidence/task-2-storage-error-handling.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): enhance softDeleteAccount with storage cleanup, notifications, and RPC deletion`
  - Files: `src/composables/useProfile.js`
  - Pre-commit: `npm run build`

---

- [x] 3. schema.sql에 RPC 함수 + 정책 문서 반영

  **What to do**:
  - `supabase/schema.sql` 파일에 Task 1에서 적용한 마이그레이션을 문서화한다:
  - 기존 RPC 함수 섹션(connect_via_invite 근처)에 `delete_user_account()` 함수 SQL 추가
  - `notification_type` enum 정의에 `'account_deleted'` 값 추가
  - Storage 정책 섹션에 `chat-files` SELECT 정책 추가
  - 이 파일은 DB의 "source of truth" 문서이므로 실제 DB 상태와 일치시킴

  **Must NOT do**:
  - 실제 DB에 SQL을 실행하지 않음 — Task 1에서 이미 적용됨
  - 기존 SQL 구문 수정 금지 — 추가만

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: schema.sql 파일에 SQL 문 3개 추가만
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 2와 병렬 가능)
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: None
  - **Blocked By**: None (Task 1의 SQL을 문서에 복사하는 것이므로 독립적)

  **References**:

  **Pattern References**:
  - `supabase/schema.sql:458-494` — connect_via_invite RPC 함수 (동일 섹션에 추가)
  - `supabase/schema.sql:732-737` — notification_type enum 정의 (값 추가)
  - `supabase/schema.sql:685-710` — Storage 정책 섹션 (정책 추가)

  **Target File**:
  - `supabase/schema.sql` — 3곳에 SQL 추가

  **Acceptance Criteria**:
  - [ ] schema.sql에 `delete_user_account()` 함수 정의가 존재
  - [ ] schema.sql의 notification_type enum에 `account_deleted` 포함
  - [ ] schema.sql에 chat-files SELECT 정책이 존재

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: schema.sql 문서 반영 확인
    Tool: Bash (grep)
    Preconditions: 없음
    Steps:
      1. grep -c 'delete_user_account' supabase/schema.sql
      2. grep -c 'account_deleted' supabase/schema.sql
      3. grep -c 'chat-files' supabase/schema.sql
    Expected Result: 각각 1개 이상 매칭
    Failure Indicators: 0건 매칭
    Evidence: .sisyphus/evidence/task-3-schema-docs.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(auth): enhance softDeleteAccount with storage cleanup, notifications, and RPC deletion`
  - Files: `supabase/schema.sql`
  - Pre-commit: `npm run build`

---

- [x] 4. Settings 뷰 삭제 버튼 로딩 상태 추가

  **What to do**:
  - **SettingsView.vue** (트레이너):
    - `handleDeleteAccount()` 함수(196-203줄)에 `deleting` ref를 추가하여 삭제 진행 중 버튼 비활성화
    - 기존 함수 시작에 `deleting.value = true` 설정
    - 성공/실패 후 `deleting.value = false` (실패 시에만 — 성공 시 리다이렉트)
    - 확인 버튼(147줄)에 `:disabled="deleting"` 추가
    - 버튼 텍스트를 `deleting ? '삭제 중...' : '삭제'`로 변경

  - **MemberSettingsView.vue** (회원):
    - 동일한 패턴 적용 (241-248줄의 handleDeleteAccount)
    - 확인 버튼(162줄)에 `:disabled="deleting"` 추가

  **Must NOT do**:
  - 새로운 UI 컴포넌트 생성 금지
  - AppBottomSheet 구조 변경 금지
  - 확인 입력 방식 변경 금지 ('탈퇴' 텍스트 확인 유지)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 파일에 ref 1개 + disabled 속성 추가만
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/views/trainer/SettingsView.vue:125-157` — 기존 삭제 AppBottomSheet UI
  - `src/views/trainer/SettingsView.vue:196-203` — 기존 handleDeleteAccount 함수
  - `src/views/member/MemberSettingsView.vue:132-173` — 회원 삭제 UI
  - `src/views/member/MemberSettingsView.vue:241-248` — 회원 handleDeleteAccount

  **WHY Each Reference Matters**:
  - 기존 handleDeleteAccount: deleting ref와 disabled 바인딩을 추가할 정확한 위치 확인
  - 기존 AppBottomSheet: 확인 버튼의 disabled 속성 추가 위치 확인

  **Acceptance Criteria**:
  - [ ] 삭제 진행 중 확인 버튼이 비활성화됨
  - [ ] 버튼 텍스트가 '삭제 중...'으로 변경됨
  - [ ] 삭제 실패 시 버튼이 다시 활성화됨
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 삭제 버튼 로딩 상태 코드 확인
    Tool: Bash (grep)
    Preconditions: 없음
    Steps:
      1. grep -n 'deleting' src/views/trainer/SettingsView.vue
      2. deleting ref와 :disabled 바인딩이 존재하는지 확인
      3. grep -n 'deleting' src/views/member/MemberSettingsView.vue
      4. 동일한 패턴이 존재하는지 확인
    Expected Result: 양쪽 파일에 deleting ref + disabled 바인딩 존재
    Failure Indicators: deleting ref 또는 disabled 바인딩 누락
    Evidence: .sisyphus/evidence/task-4-loading-state.txt

  Scenario: 이중 클릭 방지 확인
    Tool: Playwright
    Preconditions: 트레이너로 /dev-login 로그인
    Steps:
      1. /trainer/settings 페이지로 이동
      2. '계정 삭제' 버튼 클릭
      3. AppBottomSheet에서 '탈퇴' 입력
      4. 확인 버튼의 disabled 속성 확인 (삭제 진행 전에는 enabled)
    Expected Result: 확인 버튼이 정상 동작 가능 상태
    Failure Indicators: 버튼이 항상 disabled거나 deleting 로직 없음
    Evidence: .sisyphus/evidence/task-4-double-click-prevention.png
  ```

  **Commit**: YES
  - Message: `fix(ux): add loading state to account deletion button in settings views`
  - Files: `src/views/trainer/SettingsView.vue`, `src/views/member/MemberSettingsView.vue`
  - Pre-commit: `npm run build`

---

- [x] 5. Vitest 단위 테스트 추가 (useProfile)

  **What to do**:
  - `src/composables/__tests__/useProfile.test.js` 신규 생성:
    - 기존 테스트 패턴(`vi.hoisted` + `createBuilder`)을 따름
    - `supabase.rpc`, `supabase.storage.from`, `useNotifications` mock 설정
    - 테스트 케이스:
      1. `softDeleteAccount 성공 시 Storage 정리 + RPC 호출 + signOut 호출 확인`
      2. `softDeleteAccount 성공 시 createNotification이 연결된 사용자에게 호출됨`
      3. `softDeleteAccount에서 Storage 실패 시에도 RPC가 호출됨 (best-effort)`
      4. `softDeleteAccount에서 RPC 실패 시 false 반환 + error 설정`
      5. `softDeleteAccount 성공 시 true 반환`

  **Must NOT do**:
  - 기존 테스트 파일 수정 금지
  - E2E 테스트 작성 금지 — 단위 테스트만
  - 주석 사용 금지 — describe/it 이름으로 의도 표현

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 테스트 패턴 복사 + 5개 테스트 케이스 작성
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 4)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/composables/__tests__/useWorkoutPlans.test.js:1-38` — supabase + useNotifications mock 패턴 (동일하게 복사)
  - `src/composables/__tests__/useManuals.test.js:1-40` — Storage mock 패턴 참조

  **API/Type References**:
  - `src/composables/useProfile.js:softDeleteAccount()` — 테스트 대상 함수

  **Target Files (new)**:
  - `src/composables/__tests__/useProfile.test.js` — 신규 테스트 파일

  **WHY Each Reference Matters**:
  - useWorkoutPlans.test.js: useNotifications mock + createBuilder 패턴을 그대로 복사
  - useManuals.test.js: Storage mock 패턴 참조 (supabase.storage.from mock)

  **Acceptance Criteria**:
  - [ ] useProfile.test.js 생성됨
  - [ ] 5개 테스트 케이스 포함
  - [ ] `npx vitest run` 전체 통과
  - [ ] Storage best-effort 테스트 포함
  - [ ] RPC 실패 시나리오 테스트 포함

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 전체 테스트 실행
    Tool: Bash
    Preconditions: 없음
    Steps:
      1. npx vitest run 실행
      2. 전체 테스트 PASS 확인
      3. useProfile.test.js가 포함되었는지 확인
    Expected Result: 모든 테스트 PASS, 0 failures
    Failure Indicators: 테스트 실패 또는 useProfile.test.js 미실행
    Evidence: .sisyphus/evidence/task-5-vitest-results.txt
  ```

  **Commit**: YES
  - Message: `test(composables): add useProfile softDeleteAccount unit tests`
  - Files: `src/composables/__tests__/useProfile.test.js`
  - Pre-commit: `npx vitest run`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, execute SQL, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npm test`. Review all changed files for: empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify CSS uses custom properties (no hardcoded hex). Verify BEM naming. Check RPC function follows SECURITY DEFINER pattern correctly.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state via /dev-login. Test account deletion flow for BOTH trainer and member roles. Verify: (1) AppBottomSheet appears on delete button click, (2) '탈퇴' text input enables confirm button, (3) confirm triggers deletion, (4) redirects to /login, (5) re-login with same account creates new profile. Test edge case: delete button disabled during deletion (no double-click).
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit Message | Files | Pre-commit |
|------|---------------|-------|------------|
| 1 | `feat(db): add delete_user_account RPC, account_deleted notification type, chat-files select policy` | (Supabase migration) | SQL 검증 |
| 2 | `feat(auth): enhance softDeleteAccount with storage cleanup, notifications, and RPC deletion` | useProfile.js, schema.sql | `npm run build` |
| 3 | `fix(ux): add loading state to account deletion button in settings views` | SettingsView.vue, MemberSettingsView.vue | `npm run build` |
| 3 | `test(composables): add useProfile softDeleteAccount unit tests` | useProfile.test.js | `npm test` |

---

## Success Criteria

### Verification Commands
```bash
npm run build   # Expected: 0 errors, exit code 0
npm test         # Expected: all tests pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Build succeeds
- [ ] RPC 함수 `delete_user_account()` 존재
- [ ] `notification_type` enum에 `account_deleted` 값 존재
- [ ] Storage 정리 → 알림 → RPC → signOut 순서 보장
