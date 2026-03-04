# Fix: AuthCallbackView PKCE 코드 교환 복원

## TL;DR

> **Quick Summary**: 이전 fix-auth-flow 플랜에서 잘못 제거된 `exchangeCodeForSession()` 호출을 AuthCallbackView에 복원합니다. `detectSessionInUrl: false` 설정 하에서는 SDK가 URL의 PKCE 코드를 자동 교환하지 않으므로, 수동 호출이 필수입니다.
> 
> **Deliverables**:
> - `src/views/auth/AuthCallbackView.vue` — `exchangeCodeForSession()` 복원 + `whenReady()` 연계
> 
> **Estimated Effort**: Quick (1개 파일, ~15줄 변경)
> **Parallel Execution**: NO — 단일 태스크
> **Critical Path**: Task 1 → F1-F4

---

## Context

### Original Request
카카오 OAuth 로그인 후 `/auth/callback?code=...`에서 빈 화면이 표시되고 Supabase `profiles` 테이블에 데이터가 삽입되지 않는 문제.

### 이전 플랜 (fix-auth-flow) 요약
4개 태스크 모두 완료되었으나 핵심 버그가 지속됨:
- Task 1 ✅: auth store `whenReady()` API 추가
- Task 2 ✅: 라우터 가드 `whenReady()` 적용
- Task 3 ✅: AuthCallbackView 이중 hydration 제거 — **여기서 `exchangeCodeForSession()`도 함께 제거됨 (오진)**
- Task 4 ✅: TrainerProfileView DB 저장

### 근본 원인 (재진단)

**오진**: `onAuthStateChange` 리스너와 `initialize()`의 loading 상태 데드락
**실제 원인**: `detectSessionInUrl: false`로 인해 SDK가 URL의 PKCE 코드를 자동 교환하지 않음

**SDK 소스 코드 증거** (auth-js v2.98.0, `GoTrueClient.js`):
```js
// Line 278: detectSessionInUrl이 false이면 이 블록 전체를 건너뜀
if (isBrowser() && this.detectSessionInUrl && callbackUrlType !== 'none') {
    const { data, error } = await this._getSessionFromURL(params, callbackUrlType);
    // ... PKCE 코드 교환 + 세션 저장 + SIGNED_IN 이벤트 발행
}
// Line 308: detectSessionInUrl: false → 여기로 직행 (스토리지에서 기존 세션 복원만 시도)
await this._recoverAndRefresh();
```

**결과**: `exchangeCodeForSession()` 제거 후, 아무도 PKCE 코드를 교환하지 않음 → 세션 미생성 → `auth.user = null` → `/login`으로 리다이렉트 → 빈 화면

**올바른 플로우** (commit `c798962`에서 작동했던 방식):
1. AuthCallbackView에서 `exchangeCodeForSession(code)` 수동 호출
2. SDK가 코드 교환 → 세션 생성 → `onAuthStateChange` SIGNED_IN 이벤트 발행
3. auth store 리스너가 `hydrateFromSession()` 실행
4. `whenReady()`로 완료 대기 후 role 기반 라우팅

---

## Work Objectives

### Core Objective
AuthCallbackView에서 PKCE 코드 교환을 복원하여 OAuth 로그인 플로우가 정상 작동하도록 합니다.

### Concrete Deliverables
- `src/views/auth/AuthCallbackView.vue`: `exchangeCodeForSession()` 호출 복원 + supabase import 추가

### Definition of Done
- [ ] 최초 로그인 → 온보딩 페이지(`/onboarding/role`) 도달 (빈 화면 아님)
- [ ] 재로그인 → 역할별 홈 화면 도달
- [ ] `npm run build` 에러 없음

### Must Have
- `supabase.auth.exchangeCodeForSession(code)` 호출 복원
- `import { supabase } from '@/lib/supabase'` 복원
- 교환 실패 시 에러 핸들링 + `/login` 리다이렉트
- `whenReady()` 대기 (교환 후 리스너가 hydration 완료할 때까지)

### Must NOT Have (Guardrails)
- `supabase.js` 설정 변경 금지 (`detectSessionInUrl`, `flowType` 등)
- `main.js` 변경 금지
- `auth.js` 변경 금지 (이전 플랜의 whenReady() 수정은 이미 올바름)
- `router/index.js` 변경 금지
- DB 스키마 변경 금지
- `getSession()` + `hydrateFromSession()` 직접 호출 금지 (이중 hydration 재발 방지 — `exchangeCodeForSession`이 SIGNED_IN 이벤트를 발행하면 리스너가 자동 처리)
- TypeScript, 새 의존성 추가 금지

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

- **Code verification**: Use Bash — Read files, check for specific patterns
- **Build verification**: Use Bash — `npm run build`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — single fix):
└── Task 1: AuthCallbackView exchangeCodeForSession() 복원 [quick]

Wave FINAL (After Task 1 — verification):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real QA — 코드 레벨 검증 [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1 → F1-F4
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | F1-F4 | 1 |
| F1-F4 | 1 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **1 task** — T1 → `quick`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. AuthCallbackView에 exchangeCodeForSession() 복원

  **What to do**:
  - `src/views/auth/AuthCallbackView.vue`의 `<script setup>` 블록을 수정한다:
    1. `import { supabase } from '@/lib/supabase'` 추가 (현재 제거된 상태)
    2. `onMounted` 내에서 `await auth.whenReady()` 호출 **전에** PKCE 코드 교환 로직을 추가:
       ```js
       // 1. PKCE 인가 코드 → 세션 교환
       const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
       if (exchangeError) {
         console.error('PKCE 코드 교환 실패:', exchangeError.message)
         router.replace('/login')
         return
       }
       ```
    3. 교환 성공 후 `await auth.whenReady()`는 유지 (onAuthStateChange 리스너가 SIGNED_IN 이벤트로 hydration 완료할 때까지 대기)
    4. 기존의 `auth.user` 체크 + role 기반 리다이렉트 로직은 유지

  - 수정 후 전체 `onMounted` 구조:
    ```js
    onMounted(async () => {
      try {
        const code = route.query.code
        if (!code) {
          router.replace('/login')
          return
        }

        // 1. PKCE 인가 코드 → 세션 교환 (detectSessionInUrl: false이므로 수동 교환 필수)
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          console.error('PKCE 코드 교환 실패:', exchangeError.message)
          router.replace('/login')
          return
        }

        // 2. onAuthStateChange 리스너가 hydration 완료할 때까지 대기
        await auth.whenReady()

        // 3. 인증 실패 시 로그인으로 리다이렉트
        if (!auth.user) {
          router.replace('/login')
          return
        }

        // 4. 역할에 따라 리다이렉트
        if (!auth.role) {
          router.replace('/onboarding/role')
        } else if (auth.role === 'trainer') {
          router.replace('/trainer/home')
        } else {
          router.replace('/home')
        }
      } catch (e) {
        console.error('Auth callback 오류:', e)
        router.replace('/login')
      }
    })
    ```

  **Must NOT do**:
  - `getSession()` 직접 호출 금지 (이중 hydration 방지)
  - `hydrateFromSession()` 직접 호출 금지 (리스너가 자동 처리)
  - 템플릿/CSS 변경 금지
  - `auth.js`, `router/index.js`, `main.js`, `supabase.js` 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일에서 ~15줄 수정하는 간단한 작업. 이전 커밋(c798962)의 패턴을 whenReady()와 결합하기만 하면 됨
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 순수 로직 변경, UI 없음
    - `playwright`: 실제 Kakao OAuth 테스트는 라이브 자격증명 필요 — 코드 레벨 검증만 수행

  **Parallelization**:
  - **Can Run In Parallel**: NO (유일한 태스크)
  - **Parallel Group**: Wave 1
  - **Blocks**: F1-F4
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `git show c798962:src/views/auth/AuthCallbackView.vue` — 이전에 올바르게 작동했던 버전. `exchangeCodeForSession(code)` 호출 + `getSession()` + `hydrateFromSession()` 패턴. 이 중 `exchangeCodeForSession`만 복원하고, `getSession` + `hydrateFromSession`은 `whenReady()`로 대체 (이중 hydration 방지)
  - `src/views/auth/AuthCallbackView.vue` (현재) — `whenReady()` + role 체크 + 리다이렉트 로직. 이 구조를 유지하면서 `exchangeCodeForSession`만 앞에 추가

  **API/Type References**:
  - `node_modules/@supabase/auth-js/dist/module/GoTrueClient.js:511-514` — `exchangeCodeForSession(authCode)` 공개 API. 내부적으로 `_exchangeCodeForSession()`을 호출하여 code verifier를 스토리지에서 읽고 `/token?grant_type=pkce` 엔드포인트에 POST
  - `node_modules/@supabase/auth-js/dist/module/GoTrueClient.js:802-804` — 교환 성공 시 `_saveSession(session)` + `_notifyAllSubscribers('SIGNED_IN', session)` 호출 → auth store의 `onAuthStateChange` 리스너가 트리거됨
  - `src/stores/auth.js:129-151` — `onAuthStateChange` 리스너. SIGNED_IN 이벤트 시 `loading=true` → `hydrateFromSession()` → `loading=false`. `exchangeCodeForSession` 후 이 리스너가 자동 실행됨
  - `src/stores/auth.js:157-168` — `whenReady()` 메서드. `loading`이 `false`가 될 때까지 watch로 대기

  **External References**:
  - Supabase PKCE docs: `exchangeCodeForSession`은 `detectSessionInUrl: false` 설정 시 수동으로 호출해야 함

  **WHY Each Reference Matters**:
  - `c798962` 버전: 복원할 정확한 코드 패턴 참조 — 단, `getSession`+`hydrateFromSession`은 `whenReady()`로 대체
  - 현재 버전: 유지할 `whenReady()` + role 리다이렉트 구조 참조
  - GoTrueClient:802-804: `exchangeCodeForSession` 성공 시 SIGNED_IN 이벤트가 발행되므로 수동 hydration이 불필요하다는 근거
  - auth.js 리스너: SIGNED_IN 이벤트를 자동 처리하므로 AuthCallbackView에서 직접 `hydrateFromSession` 호출이 불필요하다는 근거

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: exchangeCodeForSession 호출이 복원됨
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 1 수정 완료
    Steps:
      1. grep -n "exchangeCodeForSession" src/views/auth/AuthCallbackView.vue — 호출 존재 확인
      2. grep -n "supabase" src/views/auth/AuthCallbackView.vue — supabase import 확인
      3. grep -n "whenReady" src/views/auth/AuthCallbackView.vue — whenReady 호출 유지 확인
    Expected Result: exchangeCodeForSession, supabase import, whenReady 모두 존재
    Failure Indicators: exchangeCodeForSession 또는 supabase import 누락
    Evidence: .sisyphus/evidence/task-1-exchange-restored.txt

  Scenario: 이중 hydration이 재발하지 않음
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 1 수정 완료
    Steps:
      1. grep -n "getSession" src/views/auth/AuthCallbackView.vue — getSession 직접 호출 없어야 함
      2. grep -n "hydrateFromSession" src/views/auth/AuthCallbackView.vue — hydrateFromSession 직접 호출 없어야 함
    Expected Result: getSession, hydrateFromSession 직접 호출 없음 (onAuthStateChange 리스너에 위임)
    Failure Indicators: getSession 또는 hydrateFromSession 직접 호출 존재
    Evidence: .sisyphus/evidence/task-1-no-dual-hydration.txt

  Scenario: 에러 핸들링 올바름
    Tool: Bash (코드 패턴 검증)
    Preconditions: Task 1 수정 완료
    Steps:
      1. grep -n "exchangeError" src/views/auth/AuthCallbackView.vue — 교환 에러 체크 존재
      2. grep -n "catch" src/views/auth/AuthCallbackView.vue — catch 블록 존재
      3. grep -c "router.replace.*login" src/views/auth/AuthCallbackView.vue — /login 리다이렉트 최소 2개 (code 없음 + 교환 실패 + catch)
    Expected Result: exchangeError 체크 + catch 블록 + /login 리다이렉트 3개 이상
    Failure Indicators: 에러 핸들링 누락
    Evidence: .sisyphus/evidence/task-1-error-handling.txt

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
  - Message: `fix(auth): restore exchangeCodeForSession in callback for PKCE code exchange`
  - Files: `src/views/auth/AuthCallbackView.vue`
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. Verify: exchangeCodeForSession 호출 복원됨, supabase import 존재, whenReady 유지, getSession/hydrateFromSession 직접 호출 없음. Check "Must NOT Have" 항목: auth.js/router/main.js/supabase.js 변경 없음. Check evidence files in .sisyphus/evidence/.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build`. Review AuthCallbackView.vue for: unused imports, empty catches, console.log in prod (console.error는 OK — 에러 디버깅용). 불필요한 코멘트 확인. 기존 코드와의 스타일 일관성 검증.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real QA — 코드 레벨 검증** — `unspecified-high`
  AuthCallbackView.vue의 전체 onMounted 플로우를 코드 레벨에서 추적: (1) code 파라미터 없으면 /login, (2) exchangeCodeForSession 호출 + 에러 시 /login, (3) whenReady() 대기, (4) user 없으면 /login, (5) role 기반 리다이렉트. SDK 소스(GoTrueClient.js:776-804)와 대조하여 exchangeCodeForSession이 SIGNED_IN 이벤트를 발행하는지, auth store 리스너가 이를 처리하는지 확인.
  Output: `Flow [VALID/INVALID] | SDK Integration [CORRECT/INCORRECT] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  git diff로 변경된 파일이 AuthCallbackView.vue 단일 파일인지 확인. "Must NOT do"의 auth.js/router/main.js/supabase.js 변경 없음 확인. getSession/hydrateFromSession 직접 호출 없음 확인. 이전 플랜의 수정사항(whenReady, TrainerProfileView 등)이 영향받지 않았는지 확인.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Task 1**: `fix(auth): restore exchangeCodeForSession in callback for PKCE code exchange` — AuthCallbackView.vue

---

## Success Criteria

### Verification Commands
```bash
# 변경된 파일 확인 (AuthCallbackView.vue만)
git diff --name-only  # Expected: src/views/auth/AuthCallbackView.vue

# 빌드 정상 확인
npm run build  # Expected: 에러 없이 dist/ 생성

# 핵심 패턴 확인
grep "exchangeCodeForSession" src/views/auth/AuthCallbackView.vue  # Expected: 매치 1개 이상
grep "whenReady" src/views/auth/AuthCallbackView.vue  # Expected: 매치 1개 이상
grep "getSession\|hydrateFromSession" src/views/auth/AuthCallbackView.vue  # Expected: 매치 0개
```

### Final Checklist
- [ ] `exchangeCodeForSession(code)` 호출 존재
- [ ] `import { supabase }` 존재
- [ ] `whenReady()` 대기 유지
- [ ] `getSession()` / `hydrateFromSession()` 직접 호출 없음
- [ ] 에러 핸들링 (exchangeError 체크 + catch 블록)
- [ ] auth.js, router/index.js, main.js, supabase.js 변경 없음
- [ ] 빌드 에러 없음
