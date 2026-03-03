# 카카오 로그인 플로우 수정 및 검증

## TL;DR

> **Quick Summary**: 카카오 OAuth 로그인 후 `/auth/callback`에서 빈 화면으로 멈추는 문제를 진단·수정하고, 트레이너/회원 양쪽 전체 플로우를 검증한다. TrainerProfileView DB 미저장, TrainerHomeView 목데이터 문제도 함께 수정.
>
> **Deliverables**:
> - AuthCallbackView 빈 화면 문제 해결 (PKCE 코드 교환 + 에러 핸들링)
> - TrainerProfileView에 Supabase DB 저장 로직 추가
> - TrainerHomeView 실제 데이터 로딩으로 전환
> - 트레이너/회원 양쪽 로그인→온보딩→홈 플로우 E2E 검증
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 5 → Task 7 → F1-F4

---

## Context

### Original Request
카카오 로그인 이후 플로우 검증 및 테스트 실행 계획 작성. 트레이너/회원 양쪽 플로우 검증. 현재 카카오 로그인 후 아무것도 보이지 않으며 바텀 네비가 동작하지 않는 문제 해결.

### Interview Summary
**Key Discussions**:
- 카카오 로그인 후 `http://localhost:5173/auth/callback?code=...`에서 빈 화면으로 멈춤
- 신규 사용자 (프로필 없는 계정), 콘솔 에러 없음
- 바텀 네비가 callback 페이지에서 안 보이는 것은 `meta.hideNav: true`로 인한 정상 동작 — 진짜 문제는 callback 페이지에서 벗어나지 못하는 것
- 전부 수정 포함: callback 빈화면 + 트레이너 프로필 DB 저장 + 트레이너 홈 실데이터

**Research Findings**:
- AuthCallbackView: `await auth.initialize()` 호출 시 PKCE 코드 교환이 실패하면 행(hang) 가능
- `main.js`에서 `auth.initialize()`가 await 없이 호출 — 레이스 컨디션 가능
- TrainerProfileView: "완료" 버튼이 `router.push('/trainer/home')`만 수행, DB 저장 코드 없음
- TrainerHomeView: 모든 데이터가 하드코딩 ("마커스 코치님", 예약 2건 등), 컴포저블 미사용
- MemberProfileView: 정상 동작 (profiles + member_profiles 테이블 upsert)
- RoleSelectView: 정상 동작 (profiles 테이블에 역할 upsert)

---

## Work Objectives

### Core Objective
카카오 OAuth 로그인 후 전체 인증 플로우가 트레이너/회원 양쪽에서 끊김 없이 동작하도록 수정하고 검증한다.

### Concrete Deliverables
- `src/views/auth/AuthCallbackView.vue` — PKCE 코드 교환 + 에러 핸들링 + 로딩 UI 개선
- `src/stores/auth.js` — initialize() 안정성 강화 (타임아웃, 에러 복구)
- `src/main.js` — auth.initialize() await 처리
- `src/views/trainer/TrainerProfileView.vue` — DB 저장 로직 추가
- `src/views/trainer/TrainerHomeView.vue` — 실제 데이터 로딩으로 교체

### Definition of Done
- [ ] 회원: 카카오 로그인 → 역할 선택 → 프로필 입력 → 홈 도달, 바텀 네비 표시
- [ ] 트레이너: 카카오 로그인 → 역할 선택 → 프로필 입력 → 홈 도달, 바텀 네비 표시
- [ ] `npm run build` PASS
- [ ] Supabase DB에 profiles, trainer_profiles, member_profiles 행이 실제 생성됨

### Must Have
- AuthCallbackView에서 빈 화면 없이 적절한 라우팅 진행
- PKCE 코드 교환 실패 시 에러 메시지 표시 + /login 복귀
- TrainerProfileView "완료" 시 profiles + trainer_profiles 테이블에 데이터 저장
- TrainerHomeView에서 실제 트레이너 이름/예약 데이터 표시
- 두 역할 모두 홈 페이지에서 바텀 네비게이션 정상 표시

### Must NOT Have (Guardrails)
- CSS 파일 수정 금지 — `<script setup>`과 `<template>`만 변경
- TypeScript 사용 금지 — Plain JavaScript만
- 뷰에서 Supabase 직접 호출 금지 — 컴포저블 경유
- 기존 AppButton/AppInput/AppCalendar 등 컴포넌트 props 인터페이스 변경 금지
- 미구현 기능(채팅, 매뉴얼, 수납) 건드리지 않음
- `auth.js` 스토어의 기존 API 시그니처 변경 금지 (내부 구현만 개선)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (No test runner configured)
- **Automated tests**: NONE (no unit tests)
- **Framework**: none
- **QA Method**: Agent-Executed QA Scenarios (Playwright for browser, curl for API, Bash for build)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Build**: Use Bash — `npm run build` PASS 확인
- **DB**: Use Supabase MCP — SQL 쿼리로 데이터 생성 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 진단 + 인프라 수정):
├── Task 1: AuthCallbackView 진단 및 PKCE 수정 [deep]
├── Task 2: auth.js 안정성 강화 + main.js await [deep]
└── Task 3: TrainerProfileView DB 저장 추가 [unspecified-high]

Wave 2 (After Wave 1 — 데이터 로딩 + 플로우 연결):
├── Task 4: TrainerHomeView 실제 데이터 로딩 [unspecified-high]
├── Task 5: 회원 전체 플로우 E2E 검증 [unspecified-high]
└── Task 6: 트레이너 전체 플로우 E2E 검증 [unspecified-high]

Wave 3 (After Wave 2 — 빌드 + 통합 검증):
└── Task 7: 빌드 검증 + 크로스 플로우 통합 점검 [deep]

Wave FINAL (After ALL tasks — 독립 리뷰, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 5 → Task 7 → F1-F4
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 3 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 5, 6 | 1 |
| 2 | — | 5, 6 | 1 |
| 3 | — | 4, 6 | 1 |
| 4 | 3 | 6 | 2 |
| 5 | 1, 2 | 7 | 2 |
| 6 | 1, 2, 3, 4 | 7 | 2 |
| 7 | 5, 6 | F1-F4 | 3 |
| F1-F4 | 7 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `deep`, T2 → `deep`, T3 → `unspecified-high`
- **Wave 2**: **3** — T4 → `unspecified-high`, T5 → `unspecified-high` + `playwright`, T6 → `unspecified-high` + `playwright`
- **Wave 3**: **1** — T7 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

- [ ] 1. AuthCallbackView 진단 및 PKCE 코드 교환 수정

  **What to do**:
  - `src/views/auth/AuthCallbackView.vue` 열기 — 현재 `onMounted`에서 `await auth.initialize()` 호출 후 라우팅 로직 확인
  - **핵심 문제 진단**: `auth.initialize()` 내부의 `supabase.auth.getSession()` 이 PKCE 코드 교환 시 행(hang)하는지 확인
  - `getSession()` 호출 전후로 console.log 추가하여 어디서 멈추는지 확인
  - **수정 1**: AuthCallbackView의 `onMounted`에 PKCE 코드 교환을 명시적으로 처리하는 로직 추가. URL에 `code` 파라미터가 있으면 `supabase.auth.exchangeCodeForSession(code)` 를 먼저 호출한 뒤 `auth.initialize()` 실행
  - **수정 2**: 에러 발생 시 사용자에게 에러 메시지 표시 (현재는 빈 화면). 에러 텍스트를 template에 렌더링
  - **수정 3**: 타임아웃 처리 — 10초 내 응답 없으면 에러 메시지 표시 + /login 복귀 버튼 제공
  - **수정 4**: `router.replace()` 호출 후 실제로 라우팅이 되는지 확인. 라우터 가드가 차단하고 있지 않은지 점검
  - **CSS 수정 금지**: AuthCallbackView.css는 건드리지 않는다. template의 기존 클래스명을 그대로 사용

  **Must NOT do**:
  - AuthCallbackView.css 수정
  - auth.js 스토어의 기존 exported API 시그니처 변경 (이 태스크에서는 콜백 뷰만 수정)
  - TypeScript 사용

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: PKCE 인증 플로우 디버깅은 비동기 타이밍 + 네트워크 + Supabase 내부 동작 이해가 필요한 깊은 문제
  - **Skills**: [`playwright`]
    - `playwright`: 수정 후 브라우저에서 실제 callback 페이지 동작 확인

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/auth/AuthCallbackView.vue` — 전체 파일. `onMounted` 훅의 `await auth.initialize()` 호출과 이후 라우팅 분기가 핵심. 현재 에러 시 `console.error`만 하고 UI에는 아무것도 표시 안 함
  - `src/views/login/LoginView.vue:28-38` — OAuth 시작점. `signInWithOAuth`의 `redirectTo` 옵션 확인

  **API/Type References**:
  - `src/lib/supabase.js` — Supabase 클라이언트 설정. `flowType: 'pkce'`, `detectSessionInUrl: true` 확인. `exchangeCodeForSession()` 메서드 사용법 확인
  - Supabase JS v2 공식 문서: `supabase.auth.exchangeCodeForSession(code)` — PKCE 코드를 세션으로 교환하는 메서드

  **Dependency References**:
  - `src/stores/auth.js:initialize()` (line ~162) — 콜백에서 호출되는 초기화 함수. `getSession()` → `hydrateFromSession()` 체인
  - `src/router/index.js:beforeEach` — 라우터 가드가 `auth.loading` 체크 후 `await auth.initialize()` 대기. `/auth/callback`이 PUBLIC_ROUTES에 포함되어 있는지 확인

  **WHY Each Reference Matters**:
  - AuthCallbackView: 빈 화면의 직접적인 원인이 되는 파일. onMounted 훅이 어디서 멈추는지 파악해야 함
  - supabase.js: PKCE 설정이 올바른지, `detectSessionInUrl`이 제대로 작동하는지 확인
  - auth.js: `initialize()`가 중복 호출 시 어떻게 동작하는지 (`_initializePromise` 패턴)
  - router/index.js: callback 후 `router.replace()` 호출 시 가드가 차단하지 않는지

  **Acceptance Criteria**:
  - [ ] `/auth/callback?code=...` 접근 시 빈 화면이 아닌 로딩 스피너 또는 "로그인 처리 중..." 텍스트 표시
  - [ ] PKCE 코드 교환 성공 시 → 신규 유저는 `/onboarding/role`로 이동
  - [ ] PKCE 코드 교환 실패 시 → 에러 메시지 표시 + `/login` 복귀 링크 제공
  - [ ] 10초 타임아웃 시 → "인증 시간 초과" 메시지 + 재시도 안내
  - [ ] `npm run build` PASS

  **QA Scenarios:**

  ```
  Scenario: PKCE 코드 교환 성공 후 온보딩 라우팅 (신규 유저)
    Tool: Playwright
    Preconditions: dev server 실행 중 (localhost:5173), 카카오 OAuth 설정 완료
    Steps:
      1. localhost:5173/login 접속
      2. 페이지 로드 대기 (selector: '.login-view')
      3. "카카오로 시작하기" 버튼이 보이는지 확인
      4. [대안: URL 직접 접근 테스트] localhost:5173/auth/callback 에 code 없이 접속
      5. 에러 메시지 또는 /login 리다이렉트 확인
    Expected Result: code 없이 접근 시 /login으로 리다이렉트 또는 에러 메시지 표시
    Failure Indicators: 빈 화면으로 멈춤, 콘솔 에러 무한 반복
    Evidence: .sisyphus/evidence/task-1-callback-no-code.png

  Scenario: callback 페이지 에러 핸들링
    Tool: Playwright
    Preconditions: dev server 실행 중
    Steps:
      1. localhost:5173/auth/callback?code=invalid-fake-code 접속
      2. 5초 대기
      3. 페이지에 에러 메시지가 표시되는지 확인 (selector: '.auth-callback' 내 텍스트)
      4. /login으로 복귀 가능한 링크/버튼이 있는지 확인
    Expected Result: "인증 처리에 실패했습니다" 같은 에러 메시지 + 로그인 버튼
    Failure Indicators: 빈 화면으로 계속 멈춤, 무한 로딩
    Evidence: .sisyphus/evidence/task-1-callback-invalid-code.png
  ```

  **Evidence to Capture**:
  - [ ] task-1-callback-no-code.png — code 없이 /auth/callback 접근 시 동작
  - [ ] task-1-callback-invalid-code.png — 잘못된 code로 접근 시 에러 표시

  **Commit**: YES (groups with Task 2)
  - Message: `fix(auth): resolve blank screen on OAuth callback with PKCE code exchange`
  - Files: `src/views/auth/AuthCallbackView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 2. auth.js 안정성 강화 + main.js await 처리

  **What to do**:
  - `src/main.js` — `auth.initialize()` 호출을 `await` 처리. 현재 fire-and-forget 방식이라 레이스 컨디션 가능
    - 변경: `auth.initialize()` → `await auth.initialize()`. `main.js`의 즉시 실행 부분을 async IIFE로 감싸거나, top-level 호출 방식 유지하면서 앱 마운트 전 세션 복원 보장
  - `src/stores/auth.js` — `initialize()` 함수에 안전장치 추가:
    - `getSession()` 호출에 타임아웃 래핑 (15초). Promise.race 패턴 사용
    - `fetchProfile()` 실패 시 retry 1회 추가 (네트워크 일시 오류 대비)
    - `onAuthStateChange` 리스너에서 `hydrateFromSession()` 호출 시 에러가 throw되지 않도록 try-catch 강화
  - **주의**: auth.js 스토어의 exported API (`initialize`, `fetchProfile`, `setRole`, `clearRole`, `role`, `user`, `profile`, `session`, `loading`, `error`)는 시그니처를 변경하지 않는다. 내부 구현만 개선

  **Must NOT do**:
  - auth.js exported API 시그니처 변경
  - TypeScript 사용
  - 다른 스토어 추가

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Pinia 스토어 + Supabase auth 내부 동작 + async/Promise 패턴을 깊이 이해해야 함
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/stores/auth.js` — 전체 파일 (특히 `initialize()` line ~162, `hydrateFromSession()` line ~110, `fetchProfile()` line ~79)
  - `src/main.js` — line 22: `auth.initialize()` 호출부. 현재 await 없음

  **API/Type References**:
  - Supabase JS `getSession()` — 세션 복원 API. PKCE URL 파라미터 자동 감지 설정 (`detectSessionInUrl: true`)
  - Supabase JS `onAuthStateChange` — 이벤트 타입: `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `INITIAL_SESSION`, `USER_UPDATED`

  **WHY Each Reference Matters**:
  - auth.js: 빈 화면의 근본 원인. `getSession()` 행이 발생하면 전체 앱이 멈춤
  - main.js: await 없이 initialize() 호출 → 라우터 가드가 아직 초기화 안 된 상태에서 동작 가능

  **Acceptance Criteria**:
  - [ ] `main.js`에서 `auth.initialize()`가 await 처리되어 앱 마운트 전 세션 복원 완료
  - [ ] `auth.initialize()`가 15초 내 getSession() 응답 없으면 타임아웃 처리 (error.value 설정, loading.value = false)
  - [ ] `fetchProfile()` 네트워크 에러 시 1회 자동 재시도
  - [ ] 기존 exported API 시그니처 변경 없음 (role, user, profile, session, loading, error, initialize, fetchProfile, setRole, clearRole)
  - [ ] `npm run build` PASS

  **QA Scenarios:**

  ```
  Scenario: main.js initialize await 확인
    Tool: Bash
    Steps:
      1. src/main.js 파일에서 auth.initialize() 호출부 확인
      2. await 키워드가 포함되어 있는지 grep
      3. async 함수 또는 IIFE로 감싸져 있는지 확인
    Expected Result: auth.initialize()가 await 처리됨
    Evidence: .sisyphus/evidence/task-2-main-await.txt

  Scenario: auth.js 타임아웃 동작 확인
    Tool: Bash
    Steps:
      1. src/stores/auth.js에서 Promise.race 또는 setTimeout 패턴 검색
      2. 타임아웃 값이 15초(15000ms)인지 확인
    Expected Result: getSession()에 타임아웃 래핑 존재
    Evidence: .sisyphus/evidence/task-2-timeout-pattern.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `fix(auth): add await to initialize and timeout safety in auth store`
  - Files: `src/main.js`, `src/stores/auth.js`
  - Pre-commit: `npm run build`

---

- [ ] 3. TrainerProfileView DB 저장 로직 추가

  **What to do**:
  - `src/views/trainer/TrainerProfileView.vue` — 현재 "완료" 버튼이 `router.push('/trainer/home')`만 실행하고 DB에 아무것도 저장하지 않음
  - **수정 1**: "완료" 버튼 클릭 핸들러를 async 함수로 변경:
    1. `supabase.from('profiles').update({ name: name.value, phone: '' }).eq('id', auth.user.id)` — 이름 저장
    2. `supabase.from('trainer_profiles').upsert({ id: auth.user.id, specialties: selectedSpecialties.value, bio: '' })` — 전문분야 저장
    3. `await auth.fetchProfile()` — 스토어 동기화
    4. `router.push('/trainer/home')` — 저장 성공 후 라우팅
  - **수정 2**: 저장 실패 시 `alert()` 또는 인라인 에러 메시지 표시 (MemberProfileView 패턴 참고)
  - **수정 3**: 저장 중 버튼 비활성화 (loading 상태)
  - MemberProfileView.vue의 `handleComplete()` 패턴을 참고하여 동일한 구조로 구현
  - **CSS 수정 금지**: TrainerProfileView.css 건드리지 않음

  **Must NOT do**:
  - TrainerProfileView.css 수정
  - 사진 업로드 기능 추가 (현재 UI에 있지만 이 태스크 범위 외)
  - TypeScript 사용
  - AppButton/AppInput 프롭스 인터페이스 변경

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Supabase DB 쓰기 + Pinia 스토어 연동. 복잡도는 중간이지만 정확한 DB 스키마 이해 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/onboarding/MemberProfileView.vue:163-208` — `handleComplete()` 함수. 동일한 패턴으로 구현해야 함: profiles update → 서브테이블 upsert → auth.fetchProfile() → router.push()
  - `src/views/trainer/TrainerProfileView.vue` — 전체 파일. 현재 script setup의 변수: `name`, `selectedSpecialties`, `router`

  **API/Type References**:
  - `supabase/schema.sql` — `trainer_profiles` 테이블 스키마: `id (UUID FK)`, `specialties (text[])`, `bio (text)`, `created_at`
  - `supabase/schema.sql` — `profiles` 테이블: `id`, `role`, `name`, `phone`, `photo_url`

  **WHY Each Reference Matters**:
  - MemberProfileView: 동일한 DB 저장 패턴을 그대로 복사. 구조 일관성 유지
  - schema.sql: trainer_profiles 테이블의 정확한 컨럼명을 확인해야 upsert 실패 방지

  **Acceptance Criteria**:
  - [ ] "완료" 버튼 클릭 시 `profiles` 테이블에 name 업데이트됨
  - [ ] "완료" 버튼 클릭 시 `trainer_profiles` 테이블에 specialties 저장됨
  - [ ] DB 저장 성공 후 `auth.fetchProfile()` 호출로 스토어 동기화
  - [ ] 저장 실패 시 에러 메시지 표시 (빈 화면 아님)
  - [ ] `npm run build` PASS

  **QA Scenarios:**

  ```
  Scenario: 트레이너 프로필 DB 저장 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 트레이너 온보딩 완료 후
    Steps:
      1. SELECT * FROM profiles WHERE role = 'trainer' ORDER BY created_at DESC LIMIT 1;
      2. name 컨럼이 빈 문자열이 아닌 실제 입력값인지 확인
      3. SELECT * FROM trainer_profiles ORDER BY created_at DESC LIMIT 1;
      4. specialties 컨럼에 선택한 분야 배열이 있는지 확인
    Expected Result: profiles.name 이 입력값, trainer_profiles.specialties 가 선택한 분야 배열
    Failure Indicators: 데이터 없음, name이 빈 문자열, specialties가 null
    Evidence: .sisyphus/evidence/task-3-trainer-profile-db.txt

  Scenario: 저장 실패 시 에러 표시
    Tool: Playwright
    Steps:
      1. 네트워크 탭의 Offline 모드 활성화 (또는 Supabase URL을 일시적으로 잘못된 값으로 변경)
      2. 트레이너 프로필에서 "완료" 클릭
      3. 에러 메시지가 표시되는지 확인
    Expected Result: "프로필 저장에 실패했습니다" 같은 메시지 표시
    Evidence: .sisyphus/evidence/task-3-save-error.png
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `fix(onboarding): save trainer profile to database on completion`
  - Files: `src/views/trainer/TrainerProfileView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 4. TrainerHomeView 실제 데이터 로딩으로 전환

  **What to do**:
  - `src/views/trainer/TrainerHomeView.vue` — 현재 모든 데이터가 하드코딩됨 ("마커스 코치님", 예약 2건 등). 실제 DB 데이터로 교체
  - **수정 1**: `useReservations()` 컴포저블 import 및 호출하여 실제 예약 데이터 로드
    - `onMounted`에서 `fetchMyReservations('trainer')` 호출
  - **수정 2**: 하드코딩된 트레이너 이름을 `auth.profile?.name || '트레이너'`로 교체
  - **수정 3**: 예약 수, 완료율 등 통계를 `reservations` 배열 기반 computed로 교체
  - **수정 4**: 오늘 예약 카드를 `reservations` 데이터에서 필터링하여 렌더링 (뻔대 유지, 데이터만 동적으로)
  - **수정 5**: `useMembers()` 컴포저블 import 및 호출하여 실제 회원 수 표시
  - MemberHomeView.vue의 데이터 로딩 패턴 참고
  - **CSS 수정 금지**: TrainerHomeView.css 건드리지 않음. template 내 기존 CSS 클래스 그대로 사용

  **Must NOT do**:
  - TrainerHomeView.css 수정
  - 새로운 UI 컴포넌트 추가 (기존 레이아웃에 데이터만 연결)
  - 미구현 기능 구현 (채팅, 매뉴얼 등)
  - TypeScript 사용

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 컴포저블 연동 + 템플릿 데이터 바인딩 + computed 속성 작성
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 6
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `src/views/home/MemberHomeView.vue:185-252` — `onMounted`에서 `useReservations()` 호출 + `checkTrainerConnection()` + `fetchMyReservations('member')`. 동일한 패턴으로 trainer 버전 구현
  - `src/views/trainer/TrainerHomeView.vue` — 전체 파일. 현재 목 데이터 구조 파악 (어떤 섹션이 있는지, 클래스명 등)

  **API/Type References**:
  - `src/composables/useReservations.js` — `fetchMyReservations(role)`, `reservations` ref, `loading`, `error`. role='trainer' 전달 시 trainer_id 기준 필터링
  - `src/composables/useMembers.js` — `fetchMembers()`, `members` ref. 트레이너의 연결된 회원 목록 조회

  **WHY Each Reference Matters**:
  - MemberHomeView: 동일한 데이터 로딩 패턴을 trainer 버전으로 적용
  - useReservations: 예약 데이터 API 확인, role='trainer' 전달 시 어떤 필터링이 적용되는지
  - useMembers: 회원 수 표시에 필요한 컴포저블

  **Acceptance Criteria**:
  - [ ] 트레이너 홈에서 실제 트레이너 이름 표시 ("마커스 코치님" 아님)
  - [ ] 예약 데이터가 DB에서 로드됨 (하드코딩 아님)
  - [ ] 예약 없을 때 빈 상태 UI 정상 표시
  - [ ] 회원 수가 DB에서 로드됨
  - [ ] `npm run build` PASS

  **QA Scenarios:**

  ```
  Scenario: 트레이너 홈 실제 데이터 로딩
    Tool: Playwright
    Preconditions: dev server 실행, 트레이너 계정으로 로그인 된 상태
    Steps:
      1. /trainer/home 접속
      2. 페이지 로드 대기 (selector: '.trainer-home')
      3. 트레이너 이름 영역에 "마커스 코치님"이 아닌 실제 이름이 표시되는지 확인
      4. 예약 섹션이 로딩 스피너 또는 실제 데이터 표시하는지 확인
    Expected Result: 실제 트레이너 이름 표시, 예약 데이터 DB에서 로드 (0건이어도 빈상태 UI)
    Failure Indicators: "마커스 코치님" 표시, 하드코딩된 수치 표시
    Evidence: .sisyphus/evidence/task-4-trainer-home-data.png
  ```

  **Commit**: YES
  - Message: `feat(trainer): load real data in trainer home dashboard`
  - Files: `src/views/trainer/TrainerHomeView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 5. 회원 전체 플로우 E2E 검증

  **What to do**:
  - Playwright로 회원 전체 로그인 플로우를 분석적으로 검증:
    1. `/login` 페이지 로드 확인 (카카오 버튼 존재)
    2. 카카오 OAuth 시작 → `/auth/callback` 도달 → 빈 화면 아닌지 확인
    3. 신규 유저: `/onboarding/role` 도달 확인
    4. "회원" 선택 → `/onboarding/member-profile` 이동 확인
    5. 프로필 입력 (이름, 나이, 키, 몫무게, 목표) → 완료
    6. `/search` 또는 `/home` 도달 확인
    7. 바텀 네비게이션 표시 확인 (BottomNav, 5개 탭)
    8. 각 탭 클릭 시 라우팅 동작 확인
  - dev server (localhost:5173) 사용
  - 실제 카카오 OAuth 테스트가 어려울 수 있음 — 그 경우 Supabase Dashboard에서 수동으로 테스트 유저 생성 후 세션 주입하는 대안 접근 사용

  **Must NOT do**:
  - 코드 수정 (검증만)
  - CSS 파일 수정

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: E2E 플로우 검증은 브라우저 자동화 + 다단계 검증 필요
  - **Skills**: [`playwright`]
    - `playwright`: 브라우저 자동화로 전체 플로우 검증

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/views/login/LoginView.vue` — 로그인 페이지 구조. 카카오 버튼 selector 확인
  - `src/views/onboarding/RoleSelectView.vue` — 역할 선택 UI. "회원" 버튼 selector
  - `src/views/onboarding/MemberProfileView.vue` — 프로필 입력 폼. input selector들
  - `src/views/home/MemberHomeView.vue` — 홈 페이지. 도달 확인용 selector
  - `src/components/BottomNav.vue` — 회원용 네비. 5개 탭 구성 확인

  **Acceptance Criteria**:
  - [ ] 로그인 페이지 정상 로드
  - [ ] 카카오 OAuth 시작 또는 대안 세션 주입 성공
  - [ ] callback → onboarding → home 전체 플로우 완료
  - [ ] 바텀 네비 5개 탭 모두 동작
  - [ ] 각 단계 스크린샷 증거 저장

  **QA Scenarios:**

  ```
  Scenario: 회원 전체 플로우
    Tool: Playwright
    Preconditions: dev server 실행, 신규 카카오 계정 또는 테스트 세션
    Steps:
      1. localhost:5173/login 접속
      2. 로그인 페이지 로드 확인 (selector: '.login-view')
      3. 카카오 OAuth 시작 또는 Supabase 세션 주입
      4. /auth/callback 이후 최대 15초 대기
      5. /onboarding/role 도달 확인 (selector: '.role-select')
      6. "회원" 카드 클릭
      7. "다음" 버튼 클릭
      8. /onboarding/member-profile 도달 확인
      9. 이름 입력: "테스트회원"
      10. "완료" 버튼 클릭
      11. /search 또는 /home 도달 확인 (최대 10초)
      12. 바텀 네비게이션 존재 확인 (selector: '.bottom-nav' 또는 '.nav-bar')
      13. 각 탭 클릭하여 라우팅 동작 확인
    Expected Result: 전체 플로우 완료, 바텀 네비 정상 동작
    Failure Indicators: 빈 화면, 라우팅 실패, 네비 미표시
    Evidence: .sisyphus/evidence/task-5-member-flow-complete.png
  ```

  **Commit**: NO (검증만)

---

- [ ] 6. 트레이너 전체 플로우 E2E 검증

  **What to do**:
  - Playwright로 트레이너 전체 로그인 플로우를 검증:
    1. `/login` → 카카오 OAuth → `/auth/callback` → 빈 화면 아닌지 확인
    2. 신규 유저: `/onboarding/role` 도달
    3. "트레이너" 선택 → `/trainer/profile` 이동
    4. 이름 입력 + 전문분야 선택 → "완료" 클릭
    5. `/trainer/home` 도달 확인
    6. 실제 트레이너 이름 표시 확인 ("마커스 코치님" 아님)
    7. TrainerBottomNav 표시 확인 (5개 탭)
    8. 각 탭 클릭 시 라우팅 동작 확인
  - DB 검증: Supabase SQL로 profiles + trainer_profiles 행 존재 확인

  **Must NOT do**:
  - 코드 수정 (검증만)
  - CSS 파일 수정

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: E2E 플로우 검증
  - **Skills**: [`playwright`]
    - `playwright`: 브라우저 자동화

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 5와 동시 가능하지만, Task 4는 완료되어야 함)
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2, 3, 4

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerProfileView.vue` — 트레이너 프로필 입력 UI. 이름 input + 전문분야 버튼 selector
  - `src/views/trainer/TrainerHomeView.vue` — 트레이너 홈. 이름 표시 영역 selector
  - `src/components/TrainerBottomNav.vue` — 트레이너 네비. 5개 탭 구성 확인

  **Acceptance Criteria**:
  - [ ] 트레이너 전체 플로우 완료 (login → callback → onboarding → profile → home)
  - [ ] DB에 profiles + trainer_profiles 행 생성 확인
  - [ ] TrainerBottomNav 5개 탭 모두 동작
  - [ ] 실제 트레이너 이름 표시
  - [ ] 각 단계 스크린샷 증거 저장

  **QA Scenarios:**

  ```
  Scenario: 트레이너 전체 플로우
    Tool: Playwright
    Preconditions: dev server 실행, 신규 카카오 계정 또는 테스트 세션
    Steps:
      1. localhost:5173/login 접속
      2. 로그인 → callback → 최대 15초 대기
      3. /onboarding/role 도달 확인 (selector: '.role-select')
      4. "트레이너" 카드 클릭
      5. "다음" 버튼 클릭
      6. /trainer/profile 도달 확인 (selector: '.trainer-profile')
      7. 이름 입력: "테스트트레이너"
      8. "재활/교정" 칩 클릭
      9. "완료" 버튼 클릭
      10. /trainer/home 도달 확인 (최대 10초)
      11. 트레이너 이름에 "테스트트레이너" 표시 확인
      12. TrainerBottomNav 존재 확인
      13. 각 탭 클릭하여 라우팅 확인
    Expected Result: 전체 플로우 완료, 실제 이름 표시, 네비 동작
    Failure Indicators: 빈 화면, 라우팅 실패, "마커스 코치님" 표시
    Evidence: .sisyphus/evidence/task-6-trainer-flow-complete.png

  Scenario: 트레이너 프로필 DB 확인
    Tool: Supabase MCP (execute_sql)
    Steps:
      1. SELECT p.name, p.role, tp.specialties FROM profiles p LEFT JOIN trainer_profiles tp ON p.id = tp.id WHERE p.role = 'trainer' ORDER BY p.created_at DESC LIMIT 1;
      2. name이 "테스트트레이너", specialties에 'rehab' 포함 확인
    Expected Result: 입력한 이름과 선택한 전문분야가 DB에 저장됨
    Evidence: .sisyphus/evidence/task-6-trainer-db-verify.txt
  ```

  **Commit**: NO (검증만)

---

- [ ] 7. 빌드 검증 + 크로스 플로우 통합 점검

  **What to do**:
  - `npm run build` 실행하여 PASS 확인
  - 크로스 플로우 통합 점검:
    1. 회원으로 로그인 후 트레이너 라우트 접근 시 리다이렉트 동작 확인
    2. 트레이너로 로그인 후 회원 라우트 접근 시 리다이렉트 동작 확인
    3. 로그아웃 후 보호된 라우트 접근 시 /login 리다이렉트 확인
    4. 에러 없는 빌드 완료 확인

  **Must NOT do**:
  - 코드 수정 (검증만, 빌드 오류 발견 시에만 수정)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 크로스 플로우 통합 검증은 라우터 가드 + 역할 기반 접근 제어 + 에지 케이스 이해 필요
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2 완료 후)
  - **Parallel Group**: Wave 3 (solo)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 5, 6

  **References**:
  - `src/router/index.js` — beforeEach 가드의 역할 기반 리다이렉트 로직 확인
  - `src/stores/auth.js` — `clearRole()` 호출 후 상태 확인

  **Acceptance Criteria**:
  - [ ] `npm run build` PASS
  - [ ] 역할 기반 리다이렉트 정상 동작
  - [ ] 로그아웃 후 보호된 라우트 접근 차단
  - [ ] 모든 증거 스크린샷 저장

  **QA Scenarios:**

  ```
  Scenario: 빌드 성공
    Tool: Bash
    Steps:
      1. npm run build
      2. exit code 0 확인
      3. "✓ built in" 출력 확인
    Expected Result: 0 errors, build success
    Evidence: .sisyphus/evidence/task-7-build-pass.txt

  Scenario: 크로스 역할 접근 제어
    Tool: Playwright
    Steps:
      1. 회원으로 로그인된 상태에서 /trainer/home 접근 시도
      2. /home으로 리다이렉트되는지 확인
      3. 트레이너로 로그인된 상태에서 /home 접근 시도
      4. /trainer/home으로 리다이렉트되는지 확인
    Expected Result: 역할에 맞지 않는 라우트 접근 시 적절한 홈으로 리다이렉트
    Evidence: .sisyphus/evidence/task-7-cross-role.png
  ```

  **Commit**: YES (최종 커밋)
  - Message: `test: verify login flow and cross-role routing for both member and trainer`
  - Files: (evidence files only, no code changes expected)
  - Pre-commit: `npm run build`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify CSS files were NOT modified. Verify no TypeScript was introduced.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (login → onboarding → home for both roles). Test edge cases: expired OAuth code, network failure mid-onboarding, rapid button clicks. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1 완료 후**: `fix(auth): resolve blank screen on OAuth callback and add trainer profile save` — AuthCallbackView.vue, auth.js, main.js, TrainerProfileView.vue
- **Wave 2 완료 후**: `feat(trainer): load real data in trainer home dashboard` — TrainerHomeView.vue
- **Wave 3 완료 후**: `chore: verify build and cross-flow integration` — (빌드 확인만, 코드 변경 없을 수 있음)

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: ✓ built in ~2s, 0 errors
```

### Final Checklist
- [ ] 카카오 로그인 → /auth/callback → 온보딩 or 홈으로 이동 (빈 화면 없음)
- [ ] 신규 회원: /onboarding/role → /onboarding/member-profile → /search (or /home)
- [ ] 신규 트레이너: /onboarding/role → /trainer/profile → /trainer/home
- [ ] 회원 홈: 바텀 네비 표시, 데이터 로딩
- [ ] 트레이너 홈: 바텀 네비 표시, 실제 트레이너 이름 표시
- [ ] Supabase DB: profiles/trainer_profiles/member_profiles 행 생성 확인
- [ ] PKCE 코드 교환 실패 시 에러 표시 + /login 복귀
- [ ] `npm run build` PASS
- [ ] CSS 파일 미수정
- [ ] TypeScript 미사용
