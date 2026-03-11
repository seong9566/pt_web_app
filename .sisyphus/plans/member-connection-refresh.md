# 회원 트레이너 연결/해제 후 BottomNav 화면 갱신

## TL;DR

> **Quick Summary**: 회원이 트레이너와 연결하거나 해제한 후, BottomNav 5개 탭(홈/일정/채팅/매뉴얼/설정)의 화면이 최신 데이터로 갱신되지 않는 문제를 해결한다. 핵심 원인은 연결/해제 시점에 전역 Pinia Store의 캐시가 invalidate되지 않아 keep-alive 캐시된 뷰가 stale 데이터를 표시하는 것이다.
> 
> **Deliverables**:
> - 연결 진입점(InviteEnterView, MemberProfileView)에서 store invalidation 추가
> - 해제 진입점(MemberSettingsView)에서 store reset + 다른 탭 갱신
> - 연결/해제 성공 시 토스트 메시지 표시
> - MemberSettingsView onActivated 조건 보강
> 
> **Estimated Effort**: Short (2-3시간)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 4 → F1-F4

---

## Context

### Original Request
회원의 트레이너 연결 및 해제 동작 이후 BottomNav에 있는 화면들이 갱신되어야 함. 연결되어 있는 기능들 확인하고 새로고침 해야하는 API들 찾아서 계획 잡기.

### Interview Summary
**Key Discussions**:
- 실시간 감지 불필요: 트레이너가 해제하더라도 회원은 다음 화면 진입 시 갱신으로 충분
- 갱신 전략: 최초 provide/inject 이벤트 버스 요청 → Metis 분석 결과 기존 store invalidation 패턴이 더 적합 (프로젝트에 provide/inject 패턴 미사용, 기존 invalidate+onActivated 패턴 성숙)
- 토스트 피드백: 연결/해제 성공 시 토스트 메시지 표시 (기존 AppToast + useToast 활용)

**Research Findings**:
- keep-alive 캐시 대상 회원 뷰: MemberHomeView, MemberScheduleView, MemberSettingsView (3개)
- 비캐시 뷰: MemberChatView, MemberManualView (매번 re-mount → onMounted에서 자동 갱신)
- 전역 Store 3개(reservationsStore, ptSessionsStore, chatBadgeStore)가 연결/해제 시 invalidate 안 됨
- 연결 진입점 4곳 중 AuthCallbackView/EmailLoginView는 로그인 직후라 store가 비어있어 수정 불필요
- MemberSettingsView의 onActivated 조건이 ptSessionsStore._dirty만 체크하여 불완전

### Metis Review
**Identified Gaps** (addressed):
- provide/inject 이벤트 버스는 코드베이스에 전혀 사용되지 않는 패턴 → 기존 store invalidation 패턴으로 변경
- AuthCallbackView/EmailLoginView는 로그인 직후이므로 store가 비어있어 수정 불필요 → scope에서 제외
- 해제 시 `$reset()` vs `invalidate()` 결정 필요 → 해제 시 `$reset()` 사용 (이전 트레이너 데이터가 잠깐이라도 보이면 안 됨)
- MemberSettingsView의 onActivated 조건이 불완전 → reservationsStore.isStale() 추가
- chatBadgeStore는 loadUnreadCount(true) 강제 호출로 갱신

---

## Work Objectives

### Core Objective
연결/해제 시점에 관련 Pinia Store들을 적절히 invalidate/reset하여, keep-alive 캐시된 뷰들이 다음 진입 시 자동으로 최신 데이터를 로드하도록 한다.

### Concrete Deliverables
- `src/views/invite/InviteEnterView.vue` — 연결 후 store invalidation + 토스트 추가
- `src/views/onboarding/MemberProfileView.vue` — pending code 연결 후 store invalidation 추가
- `src/views/member/MemberSettingsView.vue` — 해제 후 store reset + 토스트 추가 + onActivated 조건 보강
- `src/stores/chatBadge.js` — loadUnreadCount 강제 갱신 활용

### Definition of Done
- [x] 연결 후 홈 탭에서 트레이너 정보, PT 잔여, 운동 계획이 표시됨
- [x] 해제 후 홈 탭에서 "트레이너 없음" 상태가 즉시 표시됨
- [x] 해제 후 일정 탭에서 "트레이너 연결되지 않음" 메시지가 표시됨
- [x] 해제 후 설정 탭에서 "트레이너 연결하기" 버튼이 표시됨
- [x] 연결/해제 성공 시 토스트 메시지가 표시됨
- [x] `npm run build` 성공

### Must Have
- 연결/해제 시 reservationsStore, ptSessionsStore, chatBadgeStore 갱신
- 토스트 메시지 피드백
- MemberSettingsView onActivated 조건 보강

### Must NOT Have (Guardrails)
- provide/inject 이벤트 버스 도입 금지 — 코드베이스에 전혀 사용되지 않는 패턴
- keep-alive 목록(App.vue의 keepAliveViews) 변경 금지
- AuthCallbackView / EmailLoginView 수정 금지 — 로그인 직후이므로 store가 비어있어 불필요
- Supabase Realtime subscription 추가 금지
- MemberProfileView의 직접 Supabase 호출 anti-pattern을 이번에 수정하지 말 것
- 새로운 컴포넌트나 composable 생성 금지

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: Tests-after (기존 composable 테스트 패턴 따름)
- **Framework**: Vitest (bun test / npx vitest run)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Build**: Use Bash — `npm run build` 성공 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 연결/해제 시점 수정, MAX PARALLEL):
├── Task 1: InviteEnterView — 연결 후 store invalidation + 토스트 [quick]
├── Task 2: MemberProfileView — pending code 연결 후 store invalidation [quick]
├── Task 3: MemberSettingsView — 해제 후 store reset + 토스트 + onActivated 보강 [quick]

Wave 2 (After Wave 1 — 빌드 검증 + QA):
├── Task 4: 빌드 검증 + 전체 통합 QA [unspecified-high]

Wave FINAL (After ALL tasks — 독립 리뷰, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
├── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 4 → F1-F4
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 3 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4 | 1 |
| 2 | — | 4 | 1 |
| 3 | — | 4 | 1 |
| 4 | 1, 2, 3 | F1-F4 | 2 |
| F1-F4 | 4 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `quick`, T2 → `quick`, T3 → `quick`
- **Wave 2**: **1** — T4 → `unspecified-high`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. InviteEnterView — 연결 후 store invalidation + 토스트

  **What to do**:
  - `src/views/invite/InviteEnterView.vue`의 `handleConfirm()` 함수에서 `redeemInviteCode()` 성공 후, `router.push('/member/home')` 전에 다음을 추가:
    1. `useReservationsStore()`의 `invalidate()` 호출
    2. `usePtSessionsStore()`의 `invalidate()` 호출
    3. `useChatBadgeStore()`의 `loadUnreadCount(true)` 호출 (force reload)
  - 필요한 import 추가: `useReservationsStore`, `usePtSessionsStore`, `useChatBadgeStore`
  - `useToast` + `AppToast` 컴포넌트 추가:
    1. `const { showToast, toastMessage, toastType, showSuccess } = useToast()` 선언
    2. 연결 성공 후 `showSuccess('트레이너와 연결되었습니다')` 호출
    3. 템플릿에 `<AppToast v-model="showToast" :message="toastMessage" :type="toastType" />` 추가
  - 토스트가 표시된 후 홈으로 이동하도록 약간의 딜레이 추가 (`setTimeout(() => router.push('/member/home'), 300)`)

  **Must NOT do**:
  - provide/inject 이벤트 버스 도입 금지
  - keep-alive 목록 변경 금지
  - 코드 확인/검증 로직(handleCheckCode) 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, 명확한 3줄 추가 + import 추가 작업
  - **Skills**: [`playwright`]
    - `playwright`: QA 시나리오에서 브라우저 검증 필요
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: UI 변경 없음, 로직 추가만

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: [Task 4]
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/views/invite/InviteEnterView.vue:155-181` — 현재 handleConfirm() 함수 전체. 라인 167에서 `redeemInviteCode()` 호출, 174에서 `auth.fetchProfile()`, 175에서 `router.push('/member/home')`. **이 175번 줄 전에 store invalidation과 토스트를 추가해야 함**
  - `src/views/member/MemberHomeView.vue:268-269` — `onActivated`에서 `reservationsStore.isStale()` 체크 패턴. **이것이 invalidation 후 자동 갱신이 작동하는 메커니즘**
  - `src/views/member/MemberChatView.vue:289,314` — useToast + AppToast 사용 패턴 참고

  **API/Type References**:
  - `src/stores/reservations.js:94-96` — `invalidate()` 함수 시그니처: `_dirty.value = true`
  - `src/stores/ptSessions.js:82-84` — `invalidate()` 함수 시그니처: `_dirty.value = true`
  - `src/stores/chatBadge.js:20-42` — `loadUnreadCount(force)` 함수: `force=true`로 호출하면 캐시 무시

  **External References**: 없음

  **WHY Each Reference Matters**:
  - `InviteEnterView.vue:155-181`: 정확한 삽입 위치를 파악하기 위해 handleConfirm() 전체를 이해해야 함
  - `MemberHomeView.vue:268-269`: invalidation이 왜 작동하는지 이해 — isStale()이 true가 되면 loadData() 재호출
  - store 파일들: import 경로와 함수 시그니처 확인

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 초대 코드 연결 후 store invalidation 확인 (코드 삽입 검증)
    Tool: Bash (grep)
    Preconditions: Task 1 코드 수정 완료
    Steps:
      1. grep -n "invalidate\|loadUnreadCount" src/views/invite/InviteEnterView.vue
      2. 결과에서 reservationsStore.invalidate(), ptSessionsStore.invalidate(), chatBadgeStore.loadUnreadCount(true) 호출이 handleConfirm 내에 존재하는지 확인
      3. grep -n "showSuccess\|showToast\|AppToast" src/views/invite/InviteEnterView.vue
      4. 결과에서 showSuccess 호출과 AppToast 컴포넌트가 존재하는지 확인
    Expected Result: 3개의 store invalidation 호출 + 토스트 호출 + AppToast 컴포넌트가 모두 존재
    Failure Indicators: grep 결과에서 invalidate, loadUnreadCount, showSuccess, AppToast 중 하나라도 누락
    Evidence: .sisyphus/evidence/task-1-store-invalidation-grep.txt

  Scenario: 빌드 성공 확인
    Tool: Bash
    Preconditions: Task 1 코드 수정 완료
    Steps:
      1. npm run build
    Expected Result: Build succeeds without errors, dist/ directory created
    Failure Indicators: Build fails with import errors or syntax errors
    Evidence: .sisyphus/evidence/task-1-build-result.txt
  ```

  **Evidence to Capture:**
  - [ ] task-1-store-invalidation-grep.txt
  - [ ] task-1-build-result.txt

  **Commit**: YES
  - Message: `fix(member): invalidate stores after trainer connection via invite code`
  - Files: `src/views/invite/InviteEnterView.vue`
  - Pre-commit: `npm run build`

- [x] 2. MemberProfileView — pending code 연결 후 store invalidation

  **What to do**:
  - `src/views/onboarding/MemberProfileView.vue`에서 `redeemInviteCode()` 성공 후 store invalidation 추가:
    1. `useReservationsStore()`의 `invalidate()` 호출
    2. `usePtSessionsStore()`의 `invalidate()` 호출
    3. `useChatBadgeStore()`의 `loadUnreadCount(true)` 호출
  - 필요한 import 추가: `useReservationsStore`, `usePtSessionsStore`, `useChatBadgeStore`
  - 토스트는 이 뷰에서는 추가하지 않음 (온보딩 플로우이므로 연결 직후 홈으로 이동하는 것이 자연스러움)

  **Must NOT do**:
  - 기존 Supabase 직접 호출 anti-pattern 수정 금지 (이번 scope 밖)
  - 온보딩 플로우 구조 변경 금지
  - 토스트 추가 금지 (온보딩 중에는 불필요)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, 명확한 3줄 추가 + import 추가 작업
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 온보딩 플로우 QA는 Task 4에서 통합 수행

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: [Task 4]
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/views/onboarding/MemberProfileView.vue:226` — `redeemInviteCode(pendingCode)` 호출 위치. **이 줄 성공 후에 store invalidation 추가**
  - `src/views/invite/InviteEnterView.vue:155-181` — Task 1에서 동일한 패턴 적용 예시

  **API/Type References**:
  - `src/stores/reservations.js:94-96` — `invalidate()` 함수
  - `src/stores/ptSessions.js:82-84` — `invalidate()` 함수
  - `src/stores/chatBadge.js:20-42` — `loadUnreadCount(force)` 함수

  **WHY Each Reference Matters**:
  - `MemberProfileView.vue:226`: 정확한 삽입 위치. pending_invite_code가 있을 때만 이 코드 경로가 실행됨
  - Task 1의 InviteEnterView 패턴: 동일한 invalidation 패턴을 복사 적용

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: pending code 연결 후 store invalidation 코드 삽입 검증
    Tool: Bash (grep)
    Preconditions: Task 2 코드 수정 완료
    Steps:
      1. grep -n "invalidate\|loadUnreadCount" src/views/onboarding/MemberProfileView.vue
      2. 결과에서 reservationsStore.invalidate(), ptSessionsStore.invalidate(), chatBadgeStore.loadUnreadCount(true) 호출이 존재하는지 확인
    Expected Result: 3개의 store invalidation/reload 호출이 redeemInviteCode 성공 블록 내에 존재
    Failure Indicators: grep 결과에서 invalidate 또는 loadUnreadCount 누락
    Evidence: .sisyphus/evidence/task-2-store-invalidation-grep.txt

  Scenario: 빌드 성공 확인
    Tool: Bash
    Preconditions: Task 2 코드 수정 완료
    Steps:
      1. npm run build
    Expected Result: Build succeeds without errors
    Failure Indicators: Build fails with import errors
    Evidence: .sisyphus/evidence/task-2-build-result.txt
  ```

  **Evidence to Capture:**
  - [ ] task-2-store-invalidation-grep.txt
  - [ ] task-2-build-result.txt

  **Commit**: YES
  - Message: `fix(onboarding): invalidate stores after pending invite code redemption`
  - Files: `src/views/onboarding/MemberProfileView.vue`
  - Pre-commit: `npm run build`

- [x] 3. MemberSettingsView — 해제 후 store reset + 토스트 + onActivated 보강

  **What to do**:
  - **해제 후 store reset** — `handleDisconnect()` 함수(라인 260-266)에서 `disconnectTrainer()` 성공 후, `loadData()` 전에:
    1. `useReservationsStore()`의 `$reset()` 호출 (해제 시에는 invalidate가 아닌 reset — 이전 트레이너 예약 데이터가 잠깐이라도 보이면 안 됨)
    2. `usePtSessionsStore()`의 `$reset()` 호출
    3. `useChatBadgeStore()`의 `$reset()` 호출
  - **토스트 추가** — 해제 성공 후 `showSuccess('트레이너 연결이 해제되었습니다')` 호출:
    1. `useToast` import + 구조분해 할당
    2. `AppToast` 컴포넌트 import + 템플릿에 추가
  - **onActivated 조건 보강** — 라인 236의 onActivated 콜백 수정:
    - 현재: `if (loaded.value && ptSessionsStore._dirty) loadData()`
    - 변경: `if (loaded.value && (ptSessionsStore._dirty || reservationsStore.isStale())) loadData()`
    - `reservationsStore` import가 이미 없으므로 `useReservationsStore` import 추가 필요
  - 필요한 import 추가: `useReservationsStore`, `useChatBadgeStore`, `useToast`, `AppToast`

  **Must NOT do**:
  - handleLogout, handleDeleteAccount 등 다른 핸들러 수정 금지
  - 기존 UI 레이아웃/스타일 변경 금지
  - 다른 뷰 파일 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, 명확한 수정 위치 3곳 (handleDisconnect, onActivated, template)
  - **Skills**: [`playwright`]
    - `playwright`: 해제 후 UI 상태 검증에 브라우저 필요
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: UI 변경 없음, 토스트만 추가

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: [Task 4]
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `src/views/member/MemberSettingsView.vue:260-266` — 현재 handleDisconnect() 함수. `disconnectTrainer()` 호출 후 `loadData()` 호출. **loadData() 전에 store reset을 삽입해야 함**
  - `src/views/member/MemberSettingsView.vue:236` — 현재 onActivated 조건: `if (loaded.value && ptSessionsStore._dirty)`. **reservationsStore.isStale() 조건을 OR로 추가**
  - `src/views/member/MemberSettingsView.vue:197-200` — 현재 import 목록. `AppBottomSheet`, `AppPullToRefresh`가 import됨. **여기에 AppToast 추가**
  - `src/views/member/MemberChatView.vue:288-289,314` — useToast 사용 패턴 참고: `const { showToast, toastMessage, toastType, showError } = useToast()`

  **API/Type References**:
  - `src/stores/reservations.js:99-103` — `$reset()` 함수: `reservations.value = [], lastFetchedAt.value = null, _dirty.value = false`
  - `src/stores/ptSessions.js:86-89` — `$reset()` 함수: `_cache.value = new Map(), _dirty.value = false`
  - `src/stores/chatBadge.js:54-57` — `$reset()` 함수: `unreadCount.value = 0, lastFetchedAt.value = null`

  **WHY Each Reference Matters**:
  - `MemberSettingsView.vue:260-266`: handleDisconnect의 정확한 삽입 위치
  - `MemberSettingsView.vue:236`: onActivated 조건 수정 위치
  - `$reset()` 함수들: 해제 시 즉시 데이터를 비워 이전 트레이너 데이터가 노출되지 않도록 함

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 해제 후 store reset 코드 삽입 검증
    Tool: Bash (grep)
    Preconditions: Task 3 코드 수정 완료
    Steps:
      1. grep -n "\$reset\|invalidate\|loadUnreadCount\|showSuccess\|AppToast" src/views/member/MemberSettingsView.vue
      2. 결과에서 $reset() 호출 3개 + showSuccess 호출 + AppToast 컴포넌트가 존재하는지 확인
      3. grep -n "reservationsStore.isStale\|ptSessionsStore._dirty" src/views/member/MemberSettingsView.vue
      4. onActivated 조건에 reservationsStore.isStale()이 추가되었는지 확인
    Expected Result: $reset() 3개 + showSuccess + AppToast + onActivated 조건 보강 모두 존재
    Failure Indicators: 누락된 항목이 하나라도 있음
    Evidence: .sisyphus/evidence/task-3-disconnect-grep.txt

  Scenario: 빌드 성공 확인
    Tool: Bash
    Preconditions: Task 3 코드 수정 완료
    Steps:
      1. npm run build
    Expected Result: Build succeeds without errors
    Failure Indicators: Build fails
    Evidence: .sisyphus/evidence/task-3-build-result.txt
  ```

  **Evidence to Capture:**
  - [ ] task-3-disconnect-grep.txt
  - [ ] task-3-build-result.txt

  **Commit**: YES
  - Message: `fix(member): reset stores and show toast after trainer disconnection`
  - Files: `src/views/member/MemberSettingsView.vue`
  - Pre-commit: `npm run build`

- [x] 4. 빌드 검증 + 전체 통합 QA

  **What to do**:
  - `npm run build` 실행하여 전체 빌드 성공 확인
  - Playwright로 전체 통합 시나리오 검증 (가능한 범위 내에서)
  - 변경된 3개 파일의 코드 품질 확인:
    - 불필요한 import 없는지
    - console.log 남아있지 않은지
    - 기존 코드 패턴과 일관성 유지되는지

  **Must NOT do**:
  - 코드 수정 금지 (QA만 수행)
  - 새 파일 생성 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 빌드 + 다중 파일 코드 리뷰 + Playwright QA 필요
  - **Skills**: [`playwright`]
    - `playwright`: 브라우저 기반 통합 QA
  - **Skills Evaluated but Omitted**:
    - `git-master`: 커밋은 개별 태스크에서 수행

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Wave 1)
  - **Blocks**: [F1-F4]
  - **Blocked By**: [Tasks 1, 2, 3]

  **References** (CRITICAL):

  **Pattern References**:
  - `src/views/invite/InviteEnterView.vue` — Task 1 수정 결과 확인
  - `src/views/onboarding/MemberProfileView.vue` — Task 2 수정 결과 확인
  - `src/views/member/MemberSettingsView.vue` — Task 3 수정 결과 확인

  **WHY Each Reference Matters**:
  - 3개 파일 모두 변경 내용이 올바르게 적용되었는지, 기존 기능이 깨지지 않았는지 검증

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 전체 프로젝트 빌드 성공
    Tool: Bash
    Preconditions: Tasks 1-3 모두 완료
    Steps:
      1. npm run build
    Expected Result: Build succeeds with exit code 0, dist/ directory updated
    Failure Indicators: Any build error or warning
    Evidence: .sisyphus/evidence/task-4-full-build.txt

  Scenario: 변경 파일 코드 품질 검증
    Tool: Bash (grep)
    Preconditions: Tasks 1-3 모두 완료
    Steps:
      1. grep -n "console.log" src/views/invite/InviteEnterView.vue src/views/onboarding/MemberProfileView.vue src/views/member/MemberSettingsView.vue
      2. 결과가 비어있어야 함 (console.log 없어야 함)
      3. grep -rn "provide\|inject\|EventBus\|mitt" src/views/invite/InviteEnterView.vue src/views/onboarding/MemberProfileView.vue src/views/member/MemberSettingsView.vue
      4. 결과가 비어있어야 함 (이벤트 버스 패턴 금지)
    Expected Result: console.log 없음, 이벤트 버스 패턴 없음
    Failure Indicators: console.log 또는 provide/inject/EventBus 발견
    Evidence: .sisyphus/evidence/task-4-code-quality.txt

  Scenario: InviteEnterView store import 일관성 확인
    Tool: Bash (grep)
    Preconditions: Task 1 완료
    Steps:
      1. grep -n "import.*Store.*from" src/views/invite/InviteEnterView.vue
      2. useReservationsStore, usePtSessionsStore, useChatBadgeStore import가 모두 존재하는지 확인
      3. grep -n "reservationsStore\|ptSessionsStore\|chatBadgeStore" src/views/invite/InviteEnterView.vue
      4. 각 store가 실제로 사용(호출)되는지 확인
    Expected Result: 3개 store 모두 import + 사용됨
    Failure Indicators: import는 있지만 사용되지 않거나, 사용되지만 import가 없음
    Evidence: .sisyphus/evidence/task-4-import-check.txt
  ```

  **Evidence to Capture:**
  - [ ] task-4-full-build.txt
  - [ ] task-4-code-quality.txt
  - [ ] task-4-import-check.txt

  **Commit**: NO (QA only)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `fix(member): invalidate stores after trainer connection via invite code` — InviteEnterView.vue
- **2**: `fix(onboarding): invalidate stores after pending invite code redemption` — MemberProfileView.vue
- **3**: `fix(member): reset stores and show toast after trainer disconnection` — MemberSettingsView.vue
- **4**: (no commit — QA only)

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: Build succeeds with no errors
```

### Final Checklist
- [x] 연결 후 홈/일정/설정 탭 데이터 갱신됨
- [x] 해제 후 홈/일정/설정 탭 데이터 갱신됨
- [x] 토스트 메시지 표시됨
- [x] provide/inject 이벤트 버스 미사용
- [x] keep-alive 목록 변경 없음
- [x] AuthCallbackView/EmailLoginView 변경 없음
- [x] npm run build 성공
