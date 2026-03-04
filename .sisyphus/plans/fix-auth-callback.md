# OAuth 콜백 PKCE 레이스 컨디션 수정

## TL;DR

> **Quick Summary**: 카카오 OAuth 로그인 후 `/auth/callback`에서 빈 화면이 뜨는 문제를 수정한다. 근본 원인은 `detectSessionInUrl: true`가 PKCE 인가 코드를 자동 소비하여 `AuthCallbackView`의 명시적 교환과 충돌하는 레이스 컨디션이다. 5개 파일을 수정하여 PKCE 플로우를 단일 경로로 정리하고, BottomNav가 role 없이 표시되는 부수 버그도 함께 수정한다.
>
> **Deliverables**:
> - `src/lib/supabase.js` — `detectSessionInUrl: false`로 변경
> - `src/stores/auth.js` — `hydrateFromSession` 메서드 외부 노출
> - `src/views/auth/AuthCallbackView.vue` — store 메서드 기반으로 재작성
> - `src/main.js` — `auth.initialize()` await 처리
> - `src/App.vue` — BottomNav 조건부 렌더링 수정 (role 필수)
>
> **Estimated Effort**: Quick
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5

---

## Context

### Original Request
카카오 로그인 후 `/auth/callback?code=...` 페이지에서 바텀네비만 보이고 콘텐츠가 없는 빈 화면 문제. `session.user.role`이 `"authenticated"`로 표시되어 혼란 발생.

### Interview Summary
**Key Discussions**:
- 카카오 OAuth 로그인 후 callback 페이지에서 빈 화면 + BottomNav만 표시
- `session.user.role = "authenticated"`는 Supabase JWT 역할이며, 앱의 `profiles.role` ('trainer'|'member')과 다름
- 신규 사용자 (프로필 없는 계정)로 테스트 중
- 콘솔에 PKCE exchange 에러 발생 가능

**Research Findings**:
- **근본 원인**: `detectSessionInUrl: true`가 Supabase 클라이언트의 내부 `_initialize()`에서 URL의 `?code=` 파라미터를 자동으로 소비. 이 초기화가 `main.js`에서 `auth.initialize()` 호출 시 (await 없이) 시작됨. 이후 `AuthCallbackView`가 같은 코드로 `exchangeCodeForSession(code)` 호출 → 이미 소비된 코드라 실패 또는 이중 교환
- **부수 버그**: `App.vue`에서 `<BottomNav v-else />`가 `auth.role`이 null일 때도 렌더링 → 로그인 안 된 상태나 callback 페이지에서 BottomNav 표시
- **두 가지 "role"**: `session.user.role` = Supabase JWT role (항상 "authenticated") ≠ `profiles.role` = 앱 커스텀 역할 ('trainer'|'member')
- Auth store의 `hydrateFromSession`이 return 객체에 포함되지 않아 외부에서 호출 불가

### Metis Review
**Identified Gaps** (addressed):
- `detectSessionInUrl: true` → `false` 변경 필수 — 코드 자동 소비 방지
- `hydrateFromSession` 또는 `handleOAuthCallback` 메서드 외부 노출 필요
- `App.vue` nav 조건에 role truthy 체크 필요
- `main.js`에서 `auth.initialize()` await 필요 — 마운트 전 세션 복원 보장
- RoleSelectView의 직접 Supabase 호출은 별도 이슈 — 이번 scope 밖

---

## Work Objectives

### Core Objective
카카오 OAuth PKCE 레이스 컨디션을 제거하여 로그인 후 콜백이 정상 동작하도록 수정한다. 신규 유저는 온보딩으로, 기존 유저는 역할별 홈으로 리다이렉트된다.

### Concrete Deliverables
- PKCE 인가 코드 교환이 단일 경로(AuthCallbackView)에서만 수행됨
- `auth.initialize()` await로 마운트 전 세션 복원 보장
- BottomNav가 role 있는 인증 사용자에게만 표시됨
- 신규 유저 → `/onboarding/role`, 트레이너 → `/trainer/home`, 회원 → `/home`

### Definition of Done
- [ ] 카카오 로그인 후 `/auth/callback`에서 빈 화면이 아닌 올바른 리다이렉트 발생
- [ ] `detectSessionInUrl`이 `false`로 설정됨
- [ ] `auth.initialize()`가 `app.mount()` 전에 await됨
- [ ] BottomNav가 `/auth/callback`, `/login` 등에서 표시되지 않음
- [ ] 기존 세션 유저의 새로고침 시 정상 동작 유지

### Must Have
- `detectSessionInUrl: false` 설정
- `hydrateFromSession` 외부 노출 (auth store return 객체)
- AuthCallbackView에서 store 메서드를 통한 PKCE 교환 + 상태 동기화
- `main.js`에서 `auth.initialize()` await
- `App.vue`에서 BottomNav 렌더링 조건에 `auth.role` truthy 체크

### Must NOT Have (Guardrails)
- TypeScript 추가 금지 — 프로젝트는 plain JavaScript
- Options API 사용 금지 — `<script setup>` only
- `RoleSelectView`의 직접 Supabase 호출 리팩토링 금지 — 별도 scope
- 다른 composable이나 뷰 파일 수정 금지 — 5개 파일만 수정
- 새로운 npm 패키지 설치 금지
- 하드코딩된 색상/크기 사용 금지 — CSS 변수 사용
- `session.user.role`을 앱 역할로 사용하는 로직 추가 금지 — 항상 `profiles.role` 사용

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (no test runner configured)
- **Automated tests**: None
- **Framework**: none
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Config/Code**: Use Bash — `grep` to verify exact values in files
- **Build**: Use Bash — `npm run build` to verify no compilation errors

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — config + store changes, can be parallel):
├── Task 1: supabase.js — detectSessionInUrl: false [quick]
├── Task 2: auth.js — expose hydrateFromSession [quick]
├── Task 4: main.js — await auth.initialize() [quick]
└── Task 5: App.vue — fix BottomNav conditional [quick]

Wave 2 (After Wave 1 — depends on Task 1 + Task 2):
└── Task 3: AuthCallbackView.vue — rewrite callback logic [quick]

Wave FINAL (After ALL tasks):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review — build verification [unspecified-high]
├── Task F3: Real QA — full login flow [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1 → Task 3 → F3
Parallel Speedup: Tasks 1, 2, 4, 5 all run simultaneously
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 (supabase.js) | — | 3 |
| 2 (auth.js) | — | 3 |
| 3 (AuthCallbackView) | 1, 2 | F1-F4 |
| 4 (main.js) | — | F1-F4 |
| 5 (App.vue) | — | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: **4 tasks** — T1 → `quick`, T2 → `quick`, T4 → `quick`, T5 → `quick`
- **Wave 2**: **1 task** — T3 → `quick`
- **Wave FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Supabase 클라이언트 — `detectSessionInUrl: false` 설정

  **What to do**:
  - `src/lib/supabase.js` 파일에서 `detectSessionInUrl: true`를 `detectSessionInUrl: false`로 변경
  - 이것이 전부. 1줄 변경.

  **Why**: `detectSessionInUrl: true`이면 Supabase 클라이언트의 내부 `_initialize()` 메서드가 URL의 `?code=` 파라미터를 자동으로 소비하여 `exchangeCodeForSession`을 실행. 이 자동 실행이 `main.js`의 `auth.initialize()` (await 없이 호출됨) 타이밍에 의존하여 AuthCallbackView의 명시적 교환과 레이스 컨디션 발생. `false`로 설정하면 코드 교환이 AuthCallbackView에서만 명시적으로 수행됨.

  **Must NOT do**:
  - 다른 auth 옵션 (`flowType`, `persistSession`, `autoRefreshToken`) 변경 금지
  - 새로운 옵션 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, 1줄 변경. 가장 단순한 수정.
  - **Skills**: []
    - No skills needed for a one-line config change.
  - **Skills Evaluated but Omitted**:
    - `playwright`: UI 검증 불필요 — config 파일 변경
    - `frontend-ui-ux`: UI 작업 아님

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 4, 5)
  - **Blocks**: Task 3 (AuthCallbackView가 이 변경에 의존)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/lib/supabase.js:14-21` — 현재 Supabase 클라이언트 설정. Line 18에 `detectSessionInUrl: true` 위치

  **External References**:
  - Supabase JS docs: `createClient` auth options — `detectSessionInUrl`이 `false`이면 URL에서 세션 자동 감지하지 않음

  **WHY Each Reference Matters**:
  - `supabase.js:18` — 정확히 이 줄을 `true` → `false`로 변경해야 함

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: detectSessionInUrl이 false로 설정됨
    Tool: Bash (grep)
    Preconditions: Task 1 수정 완료
    Steps:
      1. `grep "detectSessionInUrl" src/lib/supabase.js` 실행
      2. 출력에 `detectSessionInUrl: false` 포함 확인
      3. `detectSessionInUrl: true`가 없는지 확인
    Expected Result: `detectSessionInUrl: false` 한 줄만 출력
    Failure Indicators: `true`가 출력되거나, 해당 줄이 없음
    Evidence: .sisyphus/evidence/task-1-detect-session-false.txt

  Scenario: 다른 auth 옵션이 변경되지 않음
    Tool: Bash (grep)
    Preconditions: Task 1 수정 완료
    Steps:
      1. `grep -E "flowType|persistSession|autoRefreshToken" src/lib/supabase.js` 실행
      2. `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true` 확인
    Expected Result: 3개 옵션 모두 원래 값 유지
    Failure Indicators: 값이 변경되었거나 줄이 없음
    Evidence: .sisyphus/evidence/task-1-other-options-unchanged.txt
  ```

  **Commit**: YES (groups with Tasks 2-5)
  - Message: `fix(auth): resolve PKCE race condition in OAuth callback flow`
  - Files: `src/lib/supabase.js`
  - Pre-commit: `npm run build`

- [ ] 2. Auth Store — `hydrateFromSession` 메서드 외부 노출

  **What to do**:
  - `src/stores/auth.js`에서 `return { ... }` 객체에 `hydrateFromSession`을 추가
  - 현재 line 216-228의 return 객체에 `hydrateFromSession,`을 추가하면 됨
  - `hydrateFromSession` 함수 자체는 이미 line 110에 정의되어 있음 — 수정 불필요

  **Why**: `AuthCallbackView`에서 PKCE 코드 교환 후 store 상태를 동기화하려면 `hydrateFromSession(session)`을 호출해야 함. 현재는 return 객체에 포함되지 않아 외부에서 접근 불가. `auth.user = session.user` 같은 직접 할당 대신 store의 공식 메서드를 사용해야 상태 일관성 보장.

  **Must NOT do**:
  - `hydrateFromSession` 함수의 내부 로직 변경 금지
  - 다른 private 함수 (`resetAuthState`, `syncRoleFromProfile`, `setProfile`, `registerAuthListener`) 노출 금지
  - 새로운 메서드 추가 금지 (기존 메서드 노출만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, return 객체에 1줄 추가. 매우 단순.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: UI 검증 불필요
    - `frontend-ui-ux`: UI 작업 아님

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 4, 5)
  - **Blocks**: Task 3 (AuthCallbackView가 이 메서드를 사용)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/stores/auth.js:110-120` — `hydrateFromSession` 함수 정의. 세션 객체를 받아 `session.value`, `user.value` 설정 후 `fetchProfile()` 호출
  - `src/stores/auth.js:216-228` — 현재 return 객체. `hydrateFromSession`이 빠져 있음

  **WHY Each Reference Matters**:
  - `auth.js:110-120` — 이 함수가 이미 존재하며 내부 동작을 확인. 수정 필요 없음
  - `auth.js:216-228` — 여기에 `hydrateFromSession,`을 추가해야 함. `fetchProfile` 다음이 자연스러운 위치

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: hydrateFromSession이 return 객체에 포함됨
    Tool: Bash (grep)
    Preconditions: Task 2 수정 완료
    Steps:
      1. `grep "hydrateFromSession" src/stores/auth.js` 실행
      2. return 블록 내에 `hydrateFromSession`이 포함되어 있는지 확인
      3. 함수 정의 (line ~110)와 return (line ~225 부근) 두 곳에서 출력되는지 확인
    Expected Result: 최소 2번 출력 — 함수 정의 + return 객체
    Failure Indicators: return 블록에 포함되지 않음 (1번만 출력)
    Evidence: .sisyphus/evidence/task-2-hydrate-exposed.txt

  Scenario: 다른 private 함수가 노출되지 않음
    Tool: Bash (grep)
    Preconditions: Task 2 수정 완료
    Steps:
      1. return 블록 내용을 확인
      2. `resetAuthState`, `syncRoleFromProfile`, `setProfile`, `registerAuthListener`가 return에 없는지 확인
    Expected Result: 위 4개 함수가 return 블록에 없음
    Failure Indicators: private 함수가 return에 포함됨
    Evidence: .sisyphus/evidence/task-2-no-private-exposed.txt
  ```

  **Commit**: YES (groups with Tasks 1, 3-5)
  - Message: `fix(auth): resolve PKCE race condition in OAuth callback flow`
  - Files: `src/stores/auth.js`
  - Pre-commit: `npm run build`

- [ ] 3. AuthCallbackView — Store 메서드 기반으로 재작성

  **What to do**:
  - `src/views/auth/AuthCallbackView.vue`의 `<script setup>` 내용을 재작성
  - **핵심 변경**: `auth.user = session.user` 같은 직접 할당 제거 → `auth.hydrateFromSession(session)` 사용
  - **`supabase` import 유지** — `exchangeCodeForSession`은 Supabase 클라이언트에서 직접 호출해야 함 (auth store 메서드가 아님)
  - `<template>`과 `<style>` 블록은 현재 상태 유지 (로딩 UI 충분)

  **재작성 로직 (순서 중요)**:
  ```
  1. URL에서 ?code= 파라미터 추출
  2. code가 없으면 → router.replace('/login')
  3. code가 있으면 → supabase.auth.exchangeCodeForSession(code) 호출
     - 에러 발생 시 → console.error 후 router.replace('/login')
  4. 교환 성공 후 → supabase.auth.getSession()으로 세션 확인
     - 세션 없으면 → router.replace('/login')
  5. 세션 있으면 → auth.hydrateFromSession(session) 호출 (store 메서드로 상태 동기화)
  6. auth.role 기반 리다이렉트:
     - role === null → router.replace('/onboarding/role')
     - role === 'trainer' → router.replace('/trainer/home')
     - role === 'member' (또는 기타) → router.replace('/home')
  7. 전체를 try/catch로 감싸고, catch에서 console.error + router.replace('/login')
  ```

  **Why**: 이전 버전은 `auth.user = session.user`, `auth.session = session` 같은 직접 ref 할당을 사용. 이는 `hydrateFromSession`이 수행하는 `fetchProfile` + `setProfile` + `syncRoleFromProfile` 체인을 건너뛰어 role이 null로 남음. Store 메서드를 사용해야 전체 hydration 파이프라인이 실행됨.

  **Must NOT do**:
  - `auth.user = session.user` 같은 직접 ref 할당 금지 — `hydrateFromSession` 사용
  - `<template>` 변경 금지 — 현재 로딩 UI 유지
  - `<style>` 변경 금지
  - `session.user.role`을 앱 역할로 사용하는 코드 추가 금지
  - Options API 사용 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, 스크립트 섹션만 재작성. 로직은 명확하게 정의됨.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 이 task에서는 코드 작성만. QA는 Final Wave에서 수행.
    - `frontend-ui-ux`: 로직 변경이며 UI 작업 아님

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (단독)
  - **Blocks**: F1-F4 (Final Verification)
  - **Blocked By**: Task 1 (`detectSessionInUrl: false` 필요), Task 2 (`hydrateFromSession` 노출 필요)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/views/auth/AuthCallbackView.vue:1-74` — 현재 전체 파일. Lines 8-57이 `<script setup>` 블록으로 재작성 대상
  - `src/stores/auth.js:110-120` — `hydrateFromSession(nextSession)` 시그니처 및 동작: session/user ref 설정 → `fetchProfile()` → `setProfile()` → `syncRoleFromProfile()` 체인

  **API/Type References**:
  - `src/stores/auth.js:216-228` — auth store에서 사용 가능한 메서드 목록. Task 2 이후 `hydrateFromSession` 포함
  - `src/stores/auth.js:17` — `role` ref: `'trainer' | 'member' | null`

  **External References**:
  - Supabase JS: `supabase.auth.exchangeCodeForSession(code)` — PKCE 인가 코드를 세션으로 교환. Returns `{ data: { session, user }, error }`
  - Supabase JS: `supabase.auth.getSession()` — 현재 세션 조회. Returns `{ data: { session }, error }`

  **WHY Each Reference Matters**:
  - `AuthCallbackView.vue:8-57` — 이 부분을 재작성. template/style은 유지
  - `auth.js:110-120` — `hydrateFromSession`의 동작을 이해해야 올바르게 호출. session 객체를 인자로 전달하면 내부에서 `fetchProfile` → `setProfile` → `syncRoleFromProfile` 실행하여 `auth.role` 설정
  - `auth.js:17` — `role`이 null/trainer/member 중 하나임을 확인. null이면 온보딩 필요

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 직접 ref 할당이 제거됨
    Tool: Bash (grep)
    Preconditions: Task 3 수정 완료
    Steps:
      1. `grep -n "auth.user =" src/views/auth/AuthCallbackView.vue` 실행
      2. `grep -n "auth.session =" src/views/auth/AuthCallbackView.vue` 실행
      3. 두 grep 모두 결과 없음 확인
    Expected Result: 두 명령 모두 빈 출력 (직접 할당 없음)
    Failure Indicators: `auth.user =` 또는 `auth.session =` 패턴이 발견됨
    Evidence: .sisyphus/evidence/task-3-no-direct-assignment.txt

  Scenario: hydrateFromSession 호출이 존재함
    Tool: Bash (grep)
    Preconditions: Task 3 수정 완료
    Steps:
      1. `grep -n "hydrateFromSession" src/views/auth/AuthCallbackView.vue` 실행
      2. `auth.hydrateFromSession` 호출이 존재하는지 확인
    Expected Result: `auth.hydrateFromSession(session)` 또는 유사 호출이 1회 존재
    Failure Indicators: hydrateFromSession 호출 없음
    Evidence: .sisyphus/evidence/task-3-hydrate-called.txt

  Scenario: code 없이 접근 시 /login으로 리다이렉트 로직
    Tool: Bash (grep)
    Preconditions: Task 3 수정 완료
    Steps:
      1. `grep -n "route.query.code" src/views/auth/AuthCallbackView.vue` 실행
      2. code 추출 및 체크 로직이 존재하는지 확인
      3. code 없을 때 `/login`으로 replace하는 로직 확인
    Expected Result: code 파라미터 추출 + 없을 시 login 리다이렉트 로직 존재
    Failure Indicators: code 체크 로직 없음
    Evidence: .sisyphus/evidence/task-3-code-check.txt

  Scenario: 역할 기반 리다이렉트 로직이 올바름
    Tool: Bash (grep)
    Preconditions: Task 3 수정 완료
    Steps:
      1. `grep -n "auth.role" src/views/auth/AuthCallbackView.vue` 실행
      2. `/onboarding/role`, `/trainer/home`, `/home` 세 경로 모두 존재하는지 확인
    Expected Result: 3개 리다이렉트 경로 모두 존재
    Failure Indicators: 리다이렉트 경로 누락
    Evidence: .sisyphus/evidence/task-3-role-redirects.txt

  Scenario: supabase import가 유지됨
    Tool: Bash (grep)
    Preconditions: Task 3 수정 완료
    Steps:
      1. `grep "import.*supabase.*from" src/views/auth/AuthCallbackView.vue` 실행
      2. `@/lib/supabase` import 존재 확인
    Expected Result: supabase import가 존재
    Failure Indicators: import 누락 (exchangeCodeForSession 호출 불가)
    Evidence: .sisyphus/evidence/task-3-supabase-import.txt
  ```

  **Commit**: YES (groups with Tasks 1-2, 4-5)
  - Message: `fix(auth): resolve PKCE race condition in OAuth callback flow`
  - Files: `src/views/auth/AuthCallbackView.vue`
  - Pre-commit: `npm run build`

- [ ] 5. App.vue — BottomNav 조건부 렌더링 수정

  **What to do**:
  - `src/App.vue`의 `<template>` 블록에서 BottomNav 렌더링 조건 수정
  - 현재 (line 4-7):
    ```html
    <template v-if="!route.meta.hideNav">
      <TrainerBottomNav v-if="auth.role === 'trainer'" />
      <BottomNav v-else />
    </template>
    ```
  - 변경 후:
    ```html
    <template v-if="!route.meta.hideNav && auth.role">
      <TrainerBottomNav v-if="auth.role === 'trainer'" />
      <BottomNav v-else-if="auth.role === 'member'" />
    </template>
    ```
  - **변경 사항 2개**:
    1. 외부 `<template>`에 `&& auth.role` 추가 — role이 없으면 nav 자체를 렌더링하지 않음
    2. `<BottomNav v-else />` → `<BottomNav v-else-if="auth.role === 'member'" />` — 명시적 member 체크

  **Why**: 현재 `v-else`는 `auth.role`이 null일 때도 BottomNav를 렌더링. 이로 인해:
  - `/auth/callback` 페이지에서 (hideNav: true이므로 실제로는 안 보임 — 하지만 보안상 이중 방어)
  - 프로필이 없는 신규 사용자 (role: null)가 온보딩 중 BottomNav를 볼 수 있음
  - 미인증 상태에서도 BottomNav가 렌더링될 수 있음

  **Must NOT do**:
  - `<script setup>` 블록 변경 금지
  - `<router-view />` 변경 금지
  - import 변경 금지
  - CSS 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, template 블록의 2줄 변경
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 이 task에서는 코드 변경만
    - `frontend-ui-ux`: 조건문 수정이며 시각적 변경 아님

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: F1-F4
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/App.vue:1-19` — 전체 파일 (19줄). Lines 4-7이 변경 대상
  - `src/stores/auth.js:17` — `role` ref: `'trainer' | 'member' | null`. null이면 nav 숨김

  **WHY Each Reference Matters**:
  - `App.vue:4-7` — 정확히 이 4줄이 수정 대상. line 4에 `&& auth.role` 추가, line 6에 `v-else` → `v-else-if="auth.role === 'member'"` 변경
  - `auth.js:17` — role의 가능한 값을 확인. null일 때 nav가 표시되면 안 됨

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 외부 template에 auth.role 체크 추가됨
    Tool: Bash (grep)
    Preconditions: Task 5 수정 완료
    Steps:
      1. `grep "hideNav" src/App.vue` 실행
      2. `auth.role` 조건이 같은 줄에 포함되는지 확인
    Expected Result: `!route.meta.hideNav && auth.role` 패턴 존재
    Failure Indicators: `auth.role` 체크 없음
    Evidence: .sisyphus/evidence/task-5-role-check.txt

  Scenario: BottomNav이 v-else-if로 변경됨
    Tool: Bash (grep)
    Preconditions: Task 5 수정 완료
    Steps:
      1. `grep "BottomNav" src/App.vue` 실행
      2. `v-else-if="auth.role === 'member'"` 패턴 확인
      3. `v-else />` (조건 없는 else)가 없는지 확인
    Expected Result: BottomNav에 `v-else-if` 조건 존재, 무조건 `v-else`는 없음
    Failure Indicators: `v-else />`가 여전히 존재
    Evidence: .sisyphus/evidence/task-5-else-if.txt

  Scenario: script 블록이 변경되지 않음
    Tool: Bash (grep)
    Preconditions: Task 5 수정 완료
    Steps:
      1. `grep -c "import" src/App.vue` 실행
      2. import 개수가 4개 (useRoute, BottomNav, TrainerBottomNav, useAuthStore)인지 확인
    Expected Result: import 4줄 유지
    Failure Indicators: import 수 변경
    Evidence: .sisyphus/evidence/task-5-imports-unchanged.txt
  ```

  **Commit**: YES (groups with Tasks 1-4)
  - Message: `fix(auth): resolve PKCE race condition in OAuth callback flow`
  - Files: `src/App.vue`
  - Pre-commit: `npm run build`

- [ ] 4. main.js — `auth.initialize()` await 처리

  **What to do**:
  - `src/main.js`에서 `auth.initialize()`를 `await`하고, `app.mount('#app')`이 그 이후에 실행되도록 수정
  - `auth.initialize()` (line 22)를 await하고 `app.mount('#app')` (line 24)가 그 뒤에 실행되도록 async IIFE로 감싸기:

  ```javascript
  ;(async () => {
    await auth.initialize()
    app.mount('#app')
  })()
  ```

  - 기존 line 22 (`auth.initialize()`)와 line 24 (`app.mount('#app')`)를 위 코드로 교체

  **Why**: 현재 `auth.initialize()`가 await 없이 호출되어 `app.mount('#app')`이 초기화 완료 전에 실행됨. 이로 인해:
  1. Router guard의 `if (auth.loading) await auth.initialize()`가 초기화를 한 번 더 트리거할 수 있음
  2. `detectSessionInUrl: true`일 때 (Task 1 이전) 코드 자동 소비 타이밍이 불확실
  3. 앱 마운트 시 `auth.loading = true` 상태에서 UI가 잠깐 깜빡일 수 있음

  **Must NOT do**:
  - Pinia/Router 등록 순서 변경 금지 (`app.use(pinia)`, `app.use(router)` 유지)
  - `useAuthStore(pinia)` 호출 위치 변경 금지
  - import 순서 변경 금지
  - 새로운 import 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, 2줄을 async IIFE로 감싸는 단순 변경
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 코드 변경만, UI 검증은 Final Wave에서
    - `frontend-ui-ux`: 부트스트랩 코드이며 UI 아님

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 5)
  - **Blocks**: F1-F4
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/main.js:1-24` — 전체 파일 (24줄). Line 22: `auth.initialize()` (await 없음), Line 24: `app.mount('#app')`. 이 두 줄을 async IIFE로 교체

  **WHY Each Reference Matters**:
  - `main.js:22-24` — 정확히 이 2줄이 async IIFE로 교체되어야 함. 나머지 (import, app 생성, plugin 등록)는 그대로 유지

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: auth.initialize()가 await됨
    Tool: Bash (grep)
    Preconditions: Task 4 수정 완료
    Steps:
      1. `grep -n "await auth.initialize" src/main.js` 실행
      2. `await auth.initialize()` 패턴이 존재하는지 확인
    Expected Result: `await auth.initialize()` 한 줄 출력
    Failure Indicators: await 없이 `auth.initialize()` 호출
    Evidence: .sisyphus/evidence/task-4-await-initialize.txt

  Scenario: app.mount가 initialize 이후에 호출됨
    Tool: Bash (grep)
    Preconditions: Task 4 수정 완료
    Steps:
      1. `grep -n "app.mount\|await auth.initialize" src/main.js` 실행
      2. `await auth.initialize()` 줄 번호가 `app.mount('#app')` 줄 번호보다 앞인지 확인
    Expected Result: initialize가 mount보다 먼저 나옴
    Failure Indicators: mount가 initialize보다 앞에 있거나, await 없음
    Evidence: .sisyphus/evidence/task-4-mount-after-init.txt

  Scenario: async IIFE 구조로 감싸졌는지 확인
    Tool: Bash (grep)
    Preconditions: Task 4 수정 완료
    Steps:
      1. `grep -n "async" src/main.js` 실행
      2. async IIFE 패턴 (async () => 또는 async function) 존재 확인
    Expected Result: async 키워드가 IIFE와 함께 존재
    Failure Indicators: top-level await 사용 (ESM only) 또는 async 없음
    Evidence: .sisyphus/evidence/task-4-async-iife.txt
  ```

  **Commit**: YES (groups with Tasks 1-3, 5)
  - Message: `fix(auth): resolve PKCE race condition in OAuth callback flow`
  - Files: `src/main.js`
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep for exact string). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` to verify production build succeeds. Review all 5 changed files for: `as any`/`@ts-ignore` (should be none — JS project), empty catches, console.log left in prod code (console.error is OK for error handling), commented-out code, unused imports. Check no AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start dev server. Use Playwright to:
  1. Navigate to `/login` — verify no BottomNav visible
  2. Navigate to `/auth/callback` without code param — verify redirect to `/login`
  3. Verify `npm run build` succeeds (no compile errors)
  4. Verify file contents match plan requirements via grep
  Save screenshots to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | VERDICT`

  Note: Full Kakao OAuth E2E test requires real Kakao credentials and cannot be automated without them. QA verifies all code paths are correct via code review + partial flow testing.

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual file changes. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Only these 5 files should be modified: `src/lib/supabase.js`, `src/stores/auth.js`, `src/views/auth/AuthCallbackView.vue`, `src/main.js`, `src/App.vue`. Flag any other file changes.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Single commit** after all 5 tasks: `fix(auth): resolve PKCE race condition in OAuth callback flow` — all 5 files
  - Pre-commit: `npm run build`

---

## Success Criteria

### Verification Commands
```bash
# Build must succeed
npm run build  # Expected: no errors

# detectSessionInUrl must be false
grep "detectSessionInUrl" src/lib/supabase.js  # Expected: detectSessionInUrl: false

# hydrateFromSession must be exported
grep "hydrateFromSession" src/stores/auth.js  # Expected: appears in return { ... }

# main.js must await initialize
grep "await auth.initialize" src/main.js  # Expected: await auth.initialize()

# App.vue must check role for BottomNav
grep "auth.role" src/App.vue  # Expected: condition includes auth.role check for both navs
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] `npm run build` passes
- [ ] 5 files modified, 0 other files changed
