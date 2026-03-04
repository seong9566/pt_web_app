# Fix: 로그인 → 온보딩 → 트레이너 홈 인증 플로우 버그 수정

## TL;DR

> **Quick Summary**: "로그인 처리 중" 화면에서 멈추는 버그를 수정합니다. auth store의 loading 상태 레이스 컨디션, 라우터 가드의 loading 대기 로직 결함, AuthCallbackView의 이중 hydration, TrainerProfileView의 DB 미저장 — 총 4가지 버그를 수정합니다.
> 
> **Deliverables**:
> - `src/stores/auth.js` — loading 상태 관리 개선 + `whenReady()` API 추가
> - `src/router/index.js` — 라우터 가드 loading 대기 로직 수정
> - `src/views/auth/AuthCallbackView.vue` — 이중 hydration 제거
> - `src/views/trainer/TrainerProfileView.vue` — 이름/전문분야 DB 저장 추가
> 
> **Estimated Effort**: Short (4개 파일 수정)
> **Parallel Execution**: YES — 2 waves + verification
> **Critical Path**: Task 1 → Task 2, 3 → Task 5

---

## Context

### Original Request
로그인 → 온보딩 → role 트레이너 선택 → 트레이너 홈 화면 진입 플로우에서 "로그인 처리 중" 화면에 멈추는 문제. 재로그인 시에도 role 값을 못 가져와서 동일하게 멈춤.

### Interview Summary
**Key Discussions**:
- 4가지 버그가 복합적으로 발생하는 문제로 진단
- auth store의 loading 레이스 컨디션이 근본 원인
- TrainerProfileView는 DB 저장 로직이 누락된 별도 문제

**Research Findings**:
- `exchangeCodeForSession()` 호출 시 Supabase SDK가 `onAuthStateChange`에 `SIGNED_IN` 이벤트를 자동 발행 → 리스너와 AuthCallbackView에서 이중 hydration 발생
- `initialize()`의 `_initialized` 플래그로 인해 재호출 시 loading을 false로 설정하지 않고 즉시 리턴
- MemberProfileView는 올바르게 DB 저장 + `auth.fetchProfile()` 호출하는 반면, TrainerProfileView는 단순 라우팅만 수행

### Metis Review
**Identified Gaps** (addressed):
- 라우터 가드가 `initialize()` 의존이 아닌 loading ref 감시 방식으로 수정 필요 → Task 2에 반영
- AuthCallbackView가 직접 hydration하지 않고 리스너에 위임하도록 수정 필요 → Task 3에 반영
- TrainerProfileView에 MemberProfileView 패턴 적용 필요 → Task 4에 반영
- 온보딩 중간 이탈(RoleSelect 후 브라우저 종료) 시 name 빈 문자열 상태로 남는 edge case → 기존 기술부채, 이번 스코프 밖

---

## Work Objectives

### Core Objective
"로그인 처리 중" 화면에서 멈추는 문제를 해결하여, 최초 로그인 → 온보딩 → 트레이너 홈, 재로그인 → 트레이너 홈 플로우가 정상 작동하도록 합니다.

### Concrete Deliverables
- `src/stores/auth.js`: `whenReady()` 메서드 추가, loading 상태 관리 개선
- `src/router/index.js`: 라우터 가드의 loading 대기 로직을 `whenReady()` 기반으로 변경
- `src/views/auth/AuthCallbackView.vue`: 이중 hydration 제거, `whenReady()` 기반 대기로 변경
- `src/views/trainer/TrainerProfileView.vue`: 이름/전문분야 DB 저장 로직 추가

### Definition of Done
- [ ] 최초 로그인 → 트레이너 온보딩 → `/trainer/home` 도달 (멈춤 없음)
- [ ] 재로그인 → `/trainer/home` 도달 (멈춤 없음)
- [ ] `auth.loading`이 모든 인증 이벤트 후 5초 내에 `false`로 해소됨
- [ ] `profiles` 테이블에 트레이너 이름 저장됨
- [ ] `trainer_profiles` 테이블에 전문분야 저장됨

### Must Have
- loading 레이스 컨디션 해소
- 라우터 가드의 안정적인 loading 대기
- AuthCallbackView의 단일 hydration 경로
- TrainerProfileView의 DB 저장

### Must NOT Have (Guardrails)
- `supabase.js` 설정 변경 금지 (`detectSessionInUrl`, `flowType` 등)
- `main.js` 부트스트랩 패턴 변경 금지 (`await auth.initialize()` → `app.mount()`)
- `App.vue`에 글로벌 loading 스크린 추가 금지
- `RoleSelectView.vue`의 직접 Supabase 호출 리팩토링 금지 (기존 기술부채, 스코프 밖)
- TypeScript, 새 의존성, 테스트 프레임워크 추가 금지
- 토스트/알림 시스템 추가 금지
- auth/onboarding 플로우 외 뷰 수정 금지
- DB 스키마 변경 금지

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: none

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Code verification**: Use Bash — Read files, check for specific patterns

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation + independent fix):
├── Task 1: auth store loading 상태 관리 개선 + whenReady() API [deep]
└── Task 4: TrainerProfileView DB 저장 로직 추가 [quick]

Wave 2 (After Wave 1 — depends on auth store fix):
├── Task 2: 라우터 가드 loading 대기 로직 수정 [quick]
└── Task 3: AuthCallbackView 이중 hydration 제거 [quick]

Wave FINAL (After ALL tasks — verification):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1 → Task 2 → F1-F4
Parallel Speedup: ~40% faster than sequential
Max Concurrent: 2 (Waves 1 & 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2, 3 | 1 |
| 4 | — | — | 1 |
| 2 | 1 | — | 2 |
| 3 | 1 | — | 2 |
| F1-F4 | 1, 2, 3, 4 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **2 tasks** — T1 → `deep`, T4 → `quick`
- **Wave 2**: **2 tasks** — T2 → `quick`, T3 → `quick`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. auth store loading 상태 관리 개선 + whenReady() API 추가

  **What to do**:
  - `src/stores/auth.js`에 `whenReady()` 메서드를 추가한다. 이 메서드는 `loading`이 `false`가 될 때까지 기다리는 Promise를 반환한다:
    ```js
    function whenReady() {
      if (!loading.value) return Promise.resolve()
      return new Promise(resolve => {
        const unwatch = watch(loading, (val) => {
          if (!val) { unwatch(); resolve() }
        })
      })
    }
    ```
  - `vue`에서 `watch`를 import한다 (기존 `ref`와 함께)
  - `whenReady`를 store의 return 객체에 추가한다
  - `initialize()` 함수에서 `_initialized`가 `true`이고 `_initializePromise`가 `null`인 경우에도 `loading`이 `true`면 `whenReady()`를 반환하도록 수정한다:
    ```js
    async function initialize() {
      if (_initialized && !_initializePromise) {
        if (loading.value) return whenReady()
        return
      }
      if (_initializePromise) return _initializePromise
      // ... 나머지 동일
    }
    ```

  **Must NOT do**:
  - `registerAuthListener()` 패턴 변경 금지
  - `onAuthStateChange` 이벤트 핸들링 변경 금지
  - `main.js` 수정 금지
  - `supabase.js` 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: auth store의 비동기 상태 관리는 레이스 컨디션을 정확히 이해하고 해결해야 하는 까다로운 로직이다
  - **Skills**: []
    - No special skills needed — pure Pinia store logic
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: UI/스타일 작업 없음, 순수 로직 작업

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 4)
  - **Blocks**: Task 2, Task 3
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References**:
  - `src/stores/auth.js:162-193` — 현재 `initialize()` 함수. `_initialized`, `_initializePromise` 플래그 로직과 `loading.value` 설정 위치를 정확히 이해해야 함
  - `src/stores/auth.js:126-155` — `registerAuthListener()` 함수. `onAuthStateChange` 콜백에서 `loading.value = true` (line 130)로 설정하고 `finally` 블록(line 151)에서 `loading.value = false`로 해제하는 패턴. 이 패턴은 유지해야 함
  - `src/stores/auth.js:110-120` — `hydrateFromSession()` 함수. 리스너와 callback view 모두에서 호출되는 함수로, 레이스 컨디션의 핵심 교차점

  **API/Type References**:
  - `src/stores/auth.js:14-17` — store의 reactive ref 선언. `loading`은 `ref(true)`로 초기화됨 — `whenReady()`가 초기 상태에서도 올바르게 작동해야 함
  - `src/stores/auth.js:216-229` — store return 객체. `whenReady`를 여기에 추가해야 함

  **External References**:
  - Vue `watch` API: `import { ref, watch } from 'vue'` — `watch(source, callback)` 패턴으로 reactive ref 변경 감시

  **WHY Each Reference Matters**:
  - `initialize()` (line 162-193): `whenReady()` 로직과 `_initialized` 분기점을 정확히 수정하려면 현재 코드를 완벽히 이해해야 함
  - `registerAuthListener()` (line 126-155): 이 코드가 `loading`을 `true/false`로 토글하는 주체. `whenReady()`는 이 토글을 감시하는 것이므로 변경하면 안 됨
  - store return (line 216-229): 새 메서드 export 위치

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: whenReady() 메서드가 export되고 올바르게 동작함
    Tool: Bash (grep + 코드 검증)
    Preconditions: Task 1 수정 완료
    Steps:
      1. grep -n "whenReady" src/stores/auth.js — whenReady 함수 정의 확인
      2. grep -n "watch" src/stores/auth.js — vue watch import 확인
      3. grep -n "return {" src/stores/auth.js — whenReady가 return 객체에 포함 확인
    Expected Result: whenReady 함수가 정의되고, watch가 import되고, return 객체에 whenReady가 포함됨
    Failure Indicators: grep 결과가 비어있거나 whenReady가 return에 없음
    Evidence: .sisyphus/evidence/task-1-whenready-export.txt

  Scenario: initialize()가 _initialized=true + loading=true 상태에서 whenReady() 반환
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 1 수정 완료
    Steps:
      1. src/stores/auth.js의 initialize() 함수 내용을 읽고, _initialized && !_initializePromise 분기에서 loading.value 체크 후 whenReady() 반환하는 코드가 있는지 확인
    Expected Result: `if (loading.value) return whenReady()` 또는 동등한 로직이 initialize() 함수 내에 존재
    Failure Indicators: _initialized 체크 후 단순 return만 있음 (loading 무시)
    Evidence: .sisyphus/evidence/task-1-initialize-fix.txt

  Scenario: 빌드 성공
    Tool: Bash
    Preconditions: Task 1 수정 완료
    Steps:
      1. npm run build
    Expected Result: 에러 없이 빌드 완료
    Failure Indicators: 빌드 에러 발생
    Evidence: .sisyphus/evidence/task-1-build.txt
  ```

  **Commit**: YES
  - Message: `fix(auth): add whenReady() API to resolve loading race condition`
  - Files: `src/stores/auth.js`
  - Pre-commit: `npm run build`

- [x] 4. TrainerProfileView DB 저장 로직 추가

  **What to do**:
  - `src/views/trainer/TrainerProfileView.vue`에 `handleComplete()` 함수를 추가한다 (MemberProfileView의 `handleComplete()` 패턴을 따른다):
    1. `name`이 비어있으면 에러 메시지 표시하고 리턴
    2. `isLoading = true`, `errorMsg = ''` 설정
    3. `supabase.from('profiles').update({ name: name.value }).eq('id', auth.user.id)` 실행
    4. 에러 시 에러 메시지 표시하고 리턴
    5. `supabase.from('trainer_profiles').upsert({ id: auth.user.id, specialties: selectedSpecialties.value })` 실행
    6. 에러 시 에러 메시지 표시하고 리턴
    7. `await auth.fetchProfile()` 호출하여 store 상태 갱신
    8. `isLoading = false` 설정
    9. `router.push('/trainer/home')` 실행
  - 필요한 import 추가: `useAuthStore`, `supabase` (현재 미import)
  - `isLoading`과 `errorMsg` ref 추가
  - 템플릿의 완료 버튼을 `@click="handleComplete"` + `:disabled="!name || isLoading"` 로 변경
  - 에러 메시지 표시용 `<p>` 엘리먼트 추가 (MemberProfileView line 102 패턴)

  **Must NOT do**:
  - 토스트/알림 시스템 추가 금지
  - 기존 CSS 변경 금지
  - 다른 뷰 파일 수정 금지
  - RoleSelectView의 직접 Supabase 호출 리팩토링 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: MemberProfileView의 명확한 패턴을 복사하여 적용하는 단순 작업
  - **Skills**: []
    - No special skills needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 기존 패턴 복사이므로 디자인 판단 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: None (Final verification wave만 의존)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/views/onboarding/MemberProfileView.vue:162-208` — **핵심 참조**. `handleComplete()` 함수의 전체 구현. 이 패턴을 정확히 따라야 함: validation → profiles update → sub-profile upsert → fetchProfile() → navigate. 에러 처리 패턴도 동일하게 적용
  - `src/views/onboarding/MemberProfileView.vue:102` — 에러 메시지 표시 `<p>` 태그의 스타일링 패턴. 인라인 스타일로 `color: var(--color-red); font-size: var(--fs-body2); text-align: center; margin-bottom: 12px;` 사용
  - `src/views/onboarding/MemberProfileView.vue:104` — AppButton의 disabled + 로딩 텍스트 패턴: `:disabled="isLoading"` + `{{ isLoading ? '저장 중...' : '작성 완료 ✓' }}`
  - `src/views/onboarding/MemberProfileView.vue:113-114` — supabase와 useAuthStore import 패턴

  **API/Type References**:
  - `src/views/trainer/TrainerProfileView.vue:51` — 현재 완료 버튼. `router.push('/trainer/home')`만 있고 저장 로직 없음. 이 부분을 `handleComplete()`로 교체
  - `src/views/trainer/TrainerProfileView.vue:68` — `name` ref. 현재 정의되어 있음
  - `src/views/trainer/TrainerProfileView.vue:93` — `selectedSpecialties` ref. 현재 정의되어 있음
  - `supabase/schema.sql:30-34` — `trainer_profiles` 테이블 스키마: `id uuid PK`, `specialties text[]`, `bio text`

  **WHY Each Reference Matters**:
  - MemberProfileView:162-208: 정확히 동일한 save 패턴을 적용해야 함 (profiles update → sub-profile upsert → fetchProfile)
  - MemberProfileView:102: 에러 표시 UI가 프로젝트 전체에서 일관되어야 함
  - TrainerProfileView:51: 교체 대상 코드
  - schema.sql:30-34: upsert 시 컬럼명과 타입을 정확히 맞춰야 함 (specialties는 text[])

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Happy path — 이름과 전문분야 입력 후 완료 시 DB 저장
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 4 수정 완료
    Steps:
      1. src/views/trainer/TrainerProfileView.vue에서 handleComplete 함수 정의 확인
      2. handleComplete 내에 supabase.from('profiles').update 호출 확인
      3. handleComplete 내에 supabase.from('trainer_profiles').upsert 호출 확인
      4. handleComplete 내에 auth.fetchProfile() 호출 확인
      5. 완료 버튼이 @click="handleComplete"로 바인딩되었는지 확인
    Expected Result: handleComplete 함수가 profiles update + trainer_profiles upsert + fetchProfile + router.push 순서로 실행됨
    Failure Indicators: handleComplete 함수 없거나, DB 호출 누락
    Evidence: .sisyphus/evidence/task-4-save-logic.txt

  Scenario: Validation — 이름 비어있을 때 에러 표시
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 4 수정 완료
    Steps:
      1. handleComplete 함수 시작부분에 name 빈 문자열 체크 로직 확인
      2. errorMsg ref 정의 확인
      3. 템플릿에 errorMsg 표시 <p> 태그 확인
    Expected Result: name.trim()이 비어있으면 errorMsg 설정 후 return
    Failure Indicators: validation 로직 없음
    Evidence: .sisyphus/evidence/task-4-validation.txt

  Scenario: 필수 import 추가 확인
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 4 수정 완료
    Steps:
      1. grep "useAuthStore" src/views/trainer/TrainerProfileView.vue
      2. grep "supabase" src/views/trainer/TrainerProfileView.vue
    Expected Result: useAuthStore와 supabase가 모두 import됨
    Failure Indicators: import 누락
    Evidence: .sisyphus/evidence/task-4-imports.txt

  Scenario: 빌드 성공
    Tool: Bash
    Preconditions: Task 4 수정 완료
    Steps:
      1. npm run build
    Expected Result: 에러 없이 빌드 완료
    Failure Indicators: 빌드 에러 발생
    Evidence: .sisyphus/evidence/task-4-build.txt
  ```

  **Commit**: YES
  - Message: `fix(trainer): save name and specialties to DB on profile completion`
  - Files: `src/views/trainer/TrainerProfileView.vue`
  - Pre-commit: `npm run build`

- [x] 2. 라우터 가드 loading 대기 로직 수정

  **What to do**:
  - `src/router/index.js`의 `beforeEach` 가드에서 loading 대기 로직을 수정한다:
    ```js
    // BEFORE (broken):
    if (auth.loading) {
      await auth.initialize();
    }
    
    // AFTER (fixed):
    if (auth.loading) {
      await auth.whenReady();
    }
    ```
  - 이것만 변경한다. 나머지 가드 로직(PUBLIC_ROUTES, 역할 검사 등)은 변경하지 않는다.

  **Must NOT do**:
  - `vue`에서 `watch` 직접 import 금지 (auth store의 `whenReady()` API 사용)
  - 라우트 정의 변경 금지
  - 역할 기반 접근 제어 로직 변경 금지
  - 새 라우트 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2줄 변경의 매우 단순한 작업
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 순수 로직 변경, UI 없음

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: None (Final verification wave만 의존)
  - **Blocked By**: Task 1 (whenReady() API가 먼저 추가되어야 함)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References**:
  - `src/router/index.js:192-198` — 현재 라우터 가드의 loading 대기 로직. `auth.loading` 체크 후 `auth.initialize()` 호출하는 부분을 `auth.whenReady()`로 교체해야 함
  - `src/stores/auth.js` — Task 1에서 추가한 `whenReady()` 메서드. Promise를 반환하며 `loading`이 `false`가 될 때 resolve됨

  **WHY Each Reference Matters**:
  - router/index.js:192-198: 변경 대상 코드의 정확한 위치. 이 코드만 수정하고 나머지는 건드리지 않아야 함
  - auth.js whenReady(): 대체 API. 이 메서드가 Task 1에서 구현되었음을 전제

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 라우터 가드가 whenReady() 사용
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 2 수정 완료
    Steps:
      1. grep -n "whenReady" src/router/index.js — whenReady 호출 확인
      2. grep -n "initialize" src/router/index.js — initialize 호출이 가드에서 제거되었는지 확인
    Expected Result: whenReady()가 호출되고, 가드 내 initialize() 호출은 없음
    Failure Indicators: initialize()가 여전히 가드에서 호출되거나, whenReady()가 없음
    Evidence: .sisyphus/evidence/task-2-guard-fix.txt

  Scenario: 빌드 성공
    Tool: Bash
    Preconditions: Task 2 수정 완료
    Steps:
      1. npm run build
    Expected Result: 에러 없이 빌드 완료
    Failure Indicators: 빌드 에러 발생
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `fix(router): use whenReady() in guard and eliminate dual hydration in callback`
  - Files: `src/router/index.js`, `src/views/auth/AuthCallbackView.vue`
  - Pre-commit: `npm run build`

- [x] 3. AuthCallbackView 이중 hydration 제거

  **What to do**:
  - `src/views/auth/AuthCallbackView.vue`의 `onMounted` 로직을 수정한다:
    1. `exchangeCodeForSession(code)` 호출은 유지 — PKCE 인가 코드 교환 필수
    2. 교환 성공 후, 기존의 `getSession()` + `hydrateFromSession()` 호출을 **제거**한다 (lines 37-45)
    3. 대신 `await auth.whenReady()`를 호출하여 `onAuthStateChange` 리스너가 hydration을 완료할 때까지 대기한다
    4. 그 다음 `auth.role`을 확인하여 라우팅한다
  - 수정 후 `onMounted` 구조:
    ```js
    onMounted(async () => {
      try {
        const code = route.query.code
        if (!code) { router.replace('/login'); return }
        
        // 1. PKCE 코드 → 세션 교환 (이 호출이 onAuthStateChange SIGNED_IN 이벤트를 자동 발행)
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) { console.error('PKCE 코드 교환 실패:', exchangeError.message); router.replace('/login'); return }
        
        // 2. onAuthStateChange 리스너가 hydration 완료할 때까지 대기
        await auth.whenReady()
        
        // 3. 역할에 따라 리다이렉트
        if (!auth.role) { router.replace('/onboarding/role') }
        else if (auth.role === 'trainer') { router.replace('/trainer/home') }
        else { router.replace('/home') }
      } catch (e) {
        console.error('Auth callback 오류:', e)
        router.replace('/login')
      }
    })
    ```
  - `supabase` import은 유지 (exchangeCodeForSession에 필요)
  - `getSession`과 `hydrateFromSession` 관련 코드 삭제 후 불필요한 import 정리

  **Must NOT do**:
  - 에러 핸들링 제거 금지 (catch 블록 유지)
  - 템플릿/CSS 변경 금지
  - `exchangeCodeForSession` 호출 제거 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: onMounted 내 ~10줄 수정의 단순 작업
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 순수 로직 변경, UI 없음

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: None (Final verification wave만 의존)
  - **Blocked By**: Task 1 (whenReady() API가 먼저 추가되어야 함)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References**:
  - `src/views/auth/AuthCallbackView.vue:18-59` — 현재 `onMounted` 전체 코드. lines 37-45의 `getSession()` + `hydrateFromSession()` 호출이 제거 대상
  - `src/stores/auth.js:126-155` — `onAuthStateChange` 리스너. `exchangeCodeForSession` 후 `SIGNED_IN` 이벤트로 자동 hydration 실행. AuthCallbackView에서 중복 호출할 필요 없음
  - `src/stores/auth.js` — Task 1에서 추가한 `whenReady()` 메서드

  **WHY Each Reference Matters**:
  - AuthCallbackView:18-59: 수정 대상 코드. lines 29-34(exchangeCodeForSession)는 유지, lines 37-45(getSession+hydrate)는 제거, lines 48-53(role 체크+라우팅)은 유지
  - auth.js:126-155: exchangeCodeForSession이 발행하는 SIGNED_IN 이벤트를 이 리스너가 처리한다는 것을 이해해야 함 — AuthCallbackView가 직접 hydrate할 필요 없는 이유

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: getSession과 hydrateFromSession 직접 호출 제거됨
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 3 수정 완료
    Steps:
      1. grep -n "getSession" src/views/auth/AuthCallbackView.vue — getSession 호출이 없어야 함
      2. grep -n "hydrateFromSession" src/views/auth/AuthCallbackView.vue — hydrateFromSession 호출이 없어야 함
      3. grep -n "whenReady" src/views/auth/AuthCallbackView.vue — whenReady 호출이 있어야 함
      4. grep -n "exchangeCodeForSession" src/views/auth/AuthCallbackView.vue — exchangeCodeForSession 호출은 유지
    Expected Result: getSession/hydrateFromSession 없음, whenReady 있음, exchangeCodeForSession 유지
    Failure Indicators: getSession 또는 hydrateFromSession이 여전히 존재
    Evidence: .sisyphus/evidence/task-3-dual-hydration-removed.txt

  Scenario: 에러 핸들링 유지됨
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 3 수정 완료
    Steps:
      1. grep -n "catch" src/views/auth/AuthCallbackView.vue — catch 블록 존재 확인
      2. grep -n "router.replace.*login" src/views/auth/AuthCallbackView.vue — 로그인 리다이렉트 유지 확인
    Expected Result: try-catch 구조 유지, 에러 시 /login 리다이렉트 유지
    Failure Indicators: catch 블록 없거나 에러 핸들링 누락
    Evidence: .sisyphus/evidence/task-3-error-handling.txt

  Scenario: 빌드 성공
    Tool: Bash
    Preconditions: Task 3 수정 완료
    Steps:
      1. npm run build
    Expected Result: 에러 없이 빌드 완료
    Failure Indicators: 빌드 에러 발생
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `fix(router): use whenReady() in guard and eliminate dual hydration in callback`
  - Files: `src/router/index.js`, `src/views/auth/AuthCallbackView.vue`
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, check code). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Review all changed files for: unnecessary console.log in prod, empty catches, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify no regressions in existing functionality.
  Output: `Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** (code-level verification — OAuth flow requires real Kakao credentials) — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Test the full login → onboarding → home flow for both trainer and member roles. Test re-login flow. Test page refresh. Verify no console errors. Save screenshots to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1 commit**: `fix(auth): add whenReady() API and fix loading race condition` — auth.js
- **Wave 1 commit**: `fix(trainer): save name and specialties to DB on profile completion` — TrainerProfileView.vue
- **Wave 2 commit**: `fix(router): use whenReady() in guard to properly await auth loading` — router/index.js, AuthCallbackView.vue

---

## Success Criteria

### Verification Commands
```bash
# 변경된 파일 확인
git diff --name-only  # Expected: auth.js, index.js, AuthCallbackView.vue, TrainerProfileView.vue

# 빌드 정상 확인
npm run build  # Expected: 에러 없이 dist/ 생성
```

### Final Checklist
- [ ] "로그인 처리 중" 화면에서 멈추지 않음
- [ ] 트레이너 온보딩 완료 시 profiles + trainer_profiles 테이블에 데이터 저장
- [ ] 재로그인 시 올바른 role로 홈 화면 진입
- [ ] 페이지 새로고침 시 세션 유지
- [ ] supabase.js, main.js 변경 없음
- [ ] App.vue에 글로벌 loading 스크린 없음
- [ ] 빌드 에러 없음
