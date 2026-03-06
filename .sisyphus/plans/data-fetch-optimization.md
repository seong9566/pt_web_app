# 데이터 조회 최적화 — Redundant Fetch Elimination

## TL;DR

> **Quick Summary**: 탭 전환마다 발생하는 16+개 불필요한 Supabase 재호출을 제거하고, Pinia 도메인 캐시 store + dirty flag + Visibility API 기반 조건부 갱신 패턴으로 전환.
> 
> **Deliverables**:
> - 5개 Pinia 캐시 store 신규 생성 (reservations, members, ptSessions, chatBadge, notifications)
> - 6개 탭 뷰 onActivated 패턴을 stale-check 방식으로 교체
> - BottomNav 30초 폴링 제거 → Visibility API 전환 (+ 중복 호출 버그 수정)
> - Pull-to-refresh 외부 라이브러리 통합
> - Composable → Pinia store 위임 (thin wrapper) 전환
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Task 3 → Task 7 → Task 10 → Task 13 → F1-F4

---

## Context

### Original Request
탭 뷰에서 onActivated마다 loadData() 전체 재호출 패턴, BottomNav 30초 폴링, composable 무캐싱 문제를 해결하여 API 호출을 최소화하고 데이터를 Pinia 캐시로 관리.

### Interview Summary
**Key Discussions**:
- Pull-to-refresh: 외부 npm 라이브러리 사용 (패키지 설치 허용)
- BottomNav 뱃지: Visibility API로 전환 (30초 폴링 제거)
- 테스트: 자동화 테스트 없음, Agent QA 시나리오로 검증
- non-tab 뷰: 현재 스코프 제외

**Research Findings**:
- GitLab/Airweave 등 프로덕션에서 `lastFetchedAt` + `isStale` 패턴 검증됨
- 14개 composable 모두 per-instance state, 캐싱 제로
- `reservations` 5개 뷰, `trainer_members` 4개 뷰, `pt_sessions` 4개 뷰에서 중복 호출
- BottomNav.vue에 `getUnreadCount()` 중복 호출 버그 확인 (line 31+32)
- BottomNav은 **채팅** 미읽은 수 (`messages` 테이블), MemberHomeView 벨은 **알림** 미읽은 수 (`notifications` 테이블) — 별개 데이터

### Metis Review
**Identified Gaps** (addressed):
- BottomNav이 notifications가 아니라 chat unread를 폴링 → chatBadge store와 notifications store 분리
- `updateReservationStatus('completed')` → DB trigger `trg_auto_deduct_pt` → pt_sessions INSERT — 서버사이드 mutation이 클라이언트 캐시에 불가시적 → 명시적 cross-invalidation 필수
- Composable per-instance state ≠ Pinia shared store → loading/error는 component-local 유지
- Non-tab views (ReservationManageView 등)도 동일 store 소비 → 수동적으로 혜택받되 명시적 변경 없음

---

## Work Objectives

### Core Objective
탭 전환 시 불필요한 API 재호출을 제거하고, Pinia 캐시 store + dirty flag + stale-check 패턴으로 "필요할 때만" 데이터를 조회하도록 전환.

### Concrete Deliverables
- `src/stores/reservations.js` — 예약 데이터 캐시 (TTL 5min)
- `src/stores/members.js` — 회원 목록 캐시 (TTL 5min)
- `src/stores/ptSessions.js` — PT 이력 캐시 (TTL 5min)
- `src/stores/chatBadge.js` — 채팅 미읽은 수 (Visibility-driven)
- `src/stores/notifications.js` — 알림 미읽은 수 (Visibility-driven)
- 6개 탭 뷰 onActivated → stale-check 교체
- BottomNav/TrainerBottomNav 폴링 제거 + Visibility API
- Pull-to-refresh UI 통합

### Definition of Done
- [ ] `npm test` — 66/66 테스트 통과
- [ ] `npm run build` — exit code 0
- [ ] 탭 전환 시 5분 이내 재방문이면 API 호출 0건 (Playwright network intercept)
- [ ] BottomNav에서 setInterval 코드 완전 제거
- [ ] Pull-to-refresh로 강제 새로고침 동작 확인

### Must Have
- Pinia store는 Composition API 스타일 (`defineStore('name', () => { ... })`)
- Composable 함수 시그니처 변경 금지 (thin wrapper)
- Cross-invalidation: `updateReservationStatus('completed')` 시 reservations + ptSessions 모두 dirty
- BottomNav 중복 호출 버그 수정

### Must NOT Have (Guardrails)
- Composable 내부 로직 리팩토링 (시간 계산, 슬롯 로직 등)
- Pinia store에 `loading`/`error` UI 상태 포함
- localStorage 캐시 영속화
- Supabase Realtime 추가 구독
- Non-tab 뷰의 데이터 로딩 변경
- Composable 통합/합병
- Pull-to-refresh 외 npm 패키지 추가
- Store 간 직접 호출 (뷰에서 orchestration)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: NO
- **Framework**: Vitest (기존 66개 테스트 회귀 확인만)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, intercept network, screenshot
- **Build/Test**: Use Bash — `npm test`, `npm run build`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — BottomNav fix + Pinia stores):
├── Task 1: BottomNav 폴링 제거 + Visibility API + 중복 호출 버그 수정 [quick]
├── Task 2: Pull-to-refresh 라이브러리 설치 + 공통 컴포넌트 생성 [quick]
├── Task 3: reservations Pinia store 생성 [unspecified-high]
├── Task 4: members Pinia store 생성 [unspecified-high]
├── Task 5: ptSessions Pinia store 생성 [unspecified-high]
├── Task 6: chatBadge + notifications store 생성 [quick]
└── (7 tasks, max parallel)

Wave 2 (After Wave 1 — composable → store 위임):
├── Task 7: useReservations → reservations store 위임 [deep]
├── Task 8: useMembers → members store 위임 [unspecified-high]
├── Task 9: usePtSessions → ptSessions store 위임 [unspecified-high]
├── Task 10: useChat/useNotifications → badge store 위임 [unspecified-high]
└── (4 tasks, all parallel)

Wave 3 (After Wave 2 — 뷰 수정 + UI):
├── Task 11: Trainer 탭 뷰 3개 onActivated → stale-check [unspecified-high]
├── Task 12: Member 탭 뷰 3개 onActivated → stale-check [unspecified-high]
├── Task 13: Pull-to-refresh UI 적용 (6개 탭 뷰) [visual-engineering]
└── (3 tasks, Task 11+12 parallel, Task 13 depends on Task 2)

Wave 4 (After Wave 3 — cross-invalidation + 검증):
├── Task 14: Cross-invalidation 연결 (mutation → dirty) [deep]
├── Task 15: 전체 회귀 테스트 + 빌드 검증 [unspecified-high]
└── (2 tasks, sequential)

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 3 → Task 7 → Task 11 → Task 14 → Task 15 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 7 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 10 (badge stores used by BottomNav) |
| 2 | — | 13 |
| 3 | — | 7, 11, 14 |
| 4 | — | 8, 11, 12 |
| 5 | — | 9, 11, 12, 14 |
| 6 | — | 10 |
| 7 | 3 | 11 |
| 8 | 4 | 11, 12 |
| 9 | 5 | 11, 12 |
| 10 | 1, 6 | 12 |
| 11 | 7, 8, 9 | 14 |
| 12 | 8, 9, 10 | 14 |
| 13 | 2, 11, 12 | 15 |
| 14 | 11, 12 | 15 |
| 15 | 13, 14 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 7 tasks — T1 `quick`, T2 `quick`, T3-T5 `unspecified-high`, T6 `quick`
- **Wave 2**: 4 tasks — T7 `deep`, T8-T10 `unspecified-high`
- **Wave 3**: 3 tasks — T11-T12 `unspecified-high`, T13 `visual-engineering`
- **Wave 4**: 2 tasks — T14 `deep`, T15 `unspecified-high`
- **FINAL**: 4 tasks — F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high` + `playwright`, F4 `deep`

---

## TODOs

- [ ] 1. BottomNav 폴링 제거 + Visibility API + 중복 호출 버그 수정

  **What to do**:
  - `src/components/BottomNav.vue`:
    - Line 31 `await getUnreadCount()` 제거 (중복 호출 버그)
    - Lines 35-37 `setInterval` 제거
    - Lines 40-44 `onUnmounted` clearInterval 제거
    - `document.addEventListener('visibilitychange', handler)` 추가: `document.hidden === false`일 때 `getUnreadCount()` 호출
    - `onUnmounted`에서 `removeEventListener` cleanup
  - `src/components/TrainerBottomNav.vue`:
    - Lines 41-43 `setInterval` 제거
    - Lines 46-50 `onUnmounted` clearInterval 제거
    - 동일한 Visibility API 패턴 적용
  - 양쪽 Nav에서 `onMounted` 초기 로드는 유지 (1회)

  **Must NOT do**:
  - Nav의 라우팅/스타일/아이콘 수정
  - Supabase Realtime 추가
  - useChat composable 내부 수정

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 파일, 각 파일에서 setInterval→visibilitychange 패턴 교체만 수행
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA에서만 필요하지만 quick 에이전트가 직접 검증 가능

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-6)
  - **Blocks**: Task 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/components/BottomNav.vue:29-44` — 현재 polling 코드 (제거 대상)
  - `src/components/TrainerBottomNav.vue:36-50` — 현재 polling 코드 (제거 대상)

  **API/Type References**:
  - `src/composables/useChat.js:getUnreadCount()` — messages 테이블 count 쿼리. 함수 시그니처 변경 금지.

  **External References**:
  - MDN: `https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event`

  **WHY Each Reference Matters**:
  - BottomNav의 line 31 `await getUnreadCount()`는 결과를 버리는 중복 호출. line 32에서 다시 호출하여 chatUnreadCount에 할당. line 31만 제거.
  - TrainerBottomNav은 중복 없이 line 38에서 1회 호출 — 유지.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: BottomNav 초기 로드 시 getUnreadCount 1회만 호출
    Tool: Playwright
    Preconditions: 회원 계정 로그인, /member/home 접속
    Steps:
      1. page.route('**/rest/v1/messages*', ...) 로 네트워크 인터셉트 설정
      2. page.goto('/member/home')
      3. 5초 대기
      4. 인터셉트된 messages 요청 count 확인
    Expected Result: messages 테이블 count 요청 정확히 1회 (기존 2회 → 1회)
    Failure Indicators: 요청 2회 이상 = 중복 버그 미수정
    Evidence: .sisyphus/evidence/task-1-bottomnav-single-call.png

  Scenario: 30초 후에도 추가 폴링 없음
    Tool: Playwright
    Preconditions: 회원 계정 로그인, /member/home 접속
    Steps:
      1. page.route('**/rest/v1/messages*select=id&receiver_id*', ...) 인터셉트
      2. page.goto('/member/home'), 초기 로드 대기 (3초)
      3. 인터셉트 카운터 리셋
      4. page.waitForTimeout(35000) — 35초 대기
      5. 인터셉트 카운터 확인
    Expected Result: 35초 동안 추가 messages count 요청 0건
    Failure Indicators: 1건 이상 = setInterval 미제거
    Evidence: .sisyphus/evidence/task-1-no-polling.png

  Scenario: 탭 숨김 → 복귀 시 badge 업데이트
    Tool: Playwright
    Preconditions: 회원 계정 로그인, /member/home 접속
    Steps:
      1. page.route('**/rest/v1/messages*', ...) 인터셉트
      2. 초기 로드 완료 대기
      3. 인터셉트 카운터 리셋
      4. page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); Object.defineProperty(document, 'hidden', { value: false, writable: true }) })
      5. 2초 대기 후 인터셉트 카운터 확인
    Expected Result: visibilitychange 이벤트 후 messages count 요청 1회 발생
    Failure Indicators: 0건 = Visibility API 미연동
    Evidence: .sisyphus/evidence/task-1-visibility-refetch.png
  ```

  **Commit**: YES
  - Message: `refactor(nav): BottomNav 폴링 제거 + Visibility API 전환`
  - Files: `src/components/BottomNav.vue`, `src/components/TrainerBottomNav.vue`
  - Pre-commit: `npm run build`

- [ ] 2. Pull-to-refresh 라이브러리 설치 + 공통 래퍼 컴포넌트 생성

  **What to do**:
  - `npm install vue-pull-refresh` (또는 동등한 Vue 3 호환 라이브러리 — `vue3-pull-to-refresh`, `vue-pull-to` 등 npm에서 Vue 3 호환 + 최근 업데이트 + 다운로드 수 기준 선택)
  - `src/components/AppPullToRefresh.vue` 래퍼 컴포넌트 생성:
    - Props: `@refresh` event (async callback)
    - 라이브러리를 감싸서 프로젝트 디자인 시스템에 맞는 스타일 적용 (color: `var(--color-blue-primary)`, 스피너 크기 등)
    - `<slot>` 안에 콘텐츠 렌더링
  - 래퍼는 라이브러리 교체 시 이 파일만 수정하면 되도록 추상화

  **Must NOT do**:
  - 실제 뷰에 적용 (Task 13에서 수행)
  - 다른 npm 패키지 추가 설치
  - 기존 컴포넌트 수정

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: npm install + 단일 래퍼 컴포넌트 생성
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3-6)
  - **Blocks**: Task 13
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/components/AppButton.vue` — 공유 컴포넌트 네이밍/구조 패턴 (`App` prefix, `defineProps`, scoped style)
  - `src/assets/css/global.css` — 디자인 토큰 (--color-blue-primary, --spacing-item 등)

  **External References**:
  - npm: `vue-pull-refresh` 또는 `vue3-pull-to-refresh` — 사용법 확인 후 선택

  **WHY Each Reference Matters**:
  - AppButton.vue는 이 프로젝트의 공유 컴포넌트 작성 패턴의 정석. 동일 구조를 따라야 함.
  - global.css의 디자인 토큰을 사용해야 hard-coded 값 회피.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 라이브러리 설치 확인
    Tool: Bash
    Steps:
      1. cat package.json | grep pull
      2. ls node_modules/ | grep pull
    Expected Result: pull-to-refresh 관련 패키지가 package.json dependencies에 존재하고 node_modules에 설치됨
    Evidence: .sisyphus/evidence/task-2-npm-install.txt

  Scenario: 래퍼 컴포넌트 파일 존재 및 빌드 성공
    Tool: Bash
    Steps:
      1. ls src/components/AppPullToRefresh.vue
      2. npm run build
    Expected Result: 파일 존재, 빌드 exit code 0
    Evidence: .sisyphus/evidence/task-2-build-success.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): pull-to-refresh 라이브러리 설치 + 공통 컴포넌트`
  - Files: `package.json`, `package-lock.json`, `src/components/AppPullToRefresh.vue`
  - Pre-commit: `npm run build`

- [ ] 3. reservations Pinia store 생성

  **What to do**:
  - `src/stores/reservations.js` 생성:
    - Composition API style: `defineStore('reservations', () => { ... })`
    - State: `reservations` (ref, array), `lastFetchedAt` (ref, null), `_dirty` (ref, false)
    - Getter: `isStale(ttlMs = 300000)` — `!lastFetchedAt || Date.now() - lastFetchedAt > ttlMs || _dirty`
    - Action: `loadReservations(role, force = false)` — if force OR isStale → Supabase query → update lastFetchedAt → clear dirty
    - Action: `invalidate()` — set `_dirty = true`
    - Action: `$reset()` — clear all data (signOut 시 사용)
    - Supabase 쿼리 로직은 `useReservations.js`의 `fetchMyReservations()` 복사 (join profiles, 날짜 변환 등 동일)
  - **주의**: `loading`, `error` ref는 store에 포함하지 않음 — component-local로 유지

  **Must NOT do**:
  - `useReservations.js` 수정 (Task 7에서 수행)
  - 슬롯 계산 로직 (`fetchAvailableSlots`) 포함 — 이건 composable에 유지
  - 다른 store import/호출

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Pinia store 패턴 설계 + Supabase 쿼리 이관이 핵심. 아키텍처 이해 필요.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-2, 4-6)
  - **Blocks**: Task 7, Task 11, Task 14
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/stores/auth.js` — Pinia store 구조 패턴 (Composition API, ref, return)
  - `src/composables/useReservations.js:217-264` — `fetchMyReservations(role)` 쿼리 로직 (reservations + profiles join + 날짜 변환)

  **API/Type References**:
  - `supabase/schema.sql` — reservations 테이블 스키마 (date, start_time, end_time, status, trainer_id, member_id)

  **WHY Each Reference Matters**:
  - auth.js는 이 프로젝트의 유일한 Pinia store — 동일 패턴 따라야 함
  - useReservations.js의 fetchMyReservations 쿼리는 그대로 복사해야 함 (select 컬럼, join, order, filter 동일)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Store 생성 및 import 가능
    Tool: Bash
    Steps:
      1. grep -c "defineStore" src/stores/reservations.js
      2. npm run build
    Expected Result: defineStore 1회 존재, 빌드 성공
    Evidence: .sisyphus/evidence/task-3-store-created.txt

  Scenario: isStale이 TTL 내 false, 초과 시 true
    Tool: Bash (node --eval)
    Steps:
      1. node -e "..." 으로 store의 isStale 로직을 단위 검증 (Date.now mock)
    Expected Result: lastFetchedAt이 5분 이내이면 false, 5분 초과이면 true, dirty이면 항상 true
    Evidence: .sisyphus/evidence/task-3-stale-logic.txt
  ```

  **Commit**: NO (groups with Commit 2: Tasks 3-6)

- [ ] 4. members Pinia store 생성

  **What to do**:
  - `src/stores/members.js` 생성:
    - State: `members` (ref, array), `lastFetchedAt`, `_dirty`
    - Getter: `isStale(ttlMs = 300000)`
    - Action: `loadMembers(force = false)` — Supabase query from `useMembers.js:fetchMembers()` 복사
    - Action: `invalidate()`, `$reset()`
    - `fetchMembers()`는 trainer_members + pt_sessions 2개 테이블 쿼리 + 클라이언트 사이드 변환 (dotStatus, barColor, group) — 이 변환 로직도 포함

  **Must NOT do**:
  - `useMembers.js` 수정 (Task 8에서 수행)
  - loading/error 포함

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 8, Task 11, Task 12
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/stores/auth.js` — Pinia store 구조
  - `src/composables/useMembers.js:20-65` — `fetchMembers()` 전체 (trainer_members select + pt_sessions select + transform)

  **WHY Each Reference Matters**:
  - useMembers.js의 fetchMembers는 2단계 쿼리 (trainer_members → pt_sessions) + 복잡한 클라이언트 변환 (barColor 계산, dotStatus, group 분류) — 정확히 동일하게 복사 필수

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Store 파일 존재 및 빌드 성공
    Tool: Bash
    Steps:
      1. grep -c "defineStore" src/stores/members.js
      2. npm run build
    Expected Result: defineStore 존재, 빌드 성공
    Evidence: .sisyphus/evidence/task-4-store-created.txt
  ```

  **Commit**: NO (groups with Commit 2: Tasks 3-6)

- [ ] 5. ptSessions Pinia store 생성

  **What to do**:
  - `src/stores/ptSessions.js` 생성:
    - State: `_cache` (ref, Map — key: `${memberId}` or `${memberId}_${trainerId}`, value: `{ data, lastFetchedAt }`)
    - `_dirty` (ref, false)
    - Action: `loadPtHistory(memberId, force = false)` — cache key로 TTL 체크 후 조회
    - Action: `loadRemainingByPair(memberId, trainerId, force = false)` — 별도 cache key
    - Action: `loadMemberOwnPtCount(force = false)` — auth.user.id 기준
    - Action: `invalidate()` — `_dirty = true`, 전체 캐시 만료
    - Action: `$reset()` — Map 클리어
    - 쿼리 로직은 `usePtSessions.js`에서 복사

  **Must NOT do**:
  - `usePtSessions.js` 수정 (Task 9에서 수행)
  - addSessions/deductSessions 같은 mutation 로직 포함 — composable에 유지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 9, Task 11, Task 12, Task 14
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/stores/auth.js` — Pinia store 구조
  - `src/composables/usePtSessions.js:30-100` — fetchPtHistory, fetchRemainingByPair, fetchMemberOwnPtCount 쿼리

  **WHY Each Reference Matters**:
  - ptSessions는 member별로 다른 데이터를 캐싱해야 하므로 Map 구조 필요 (reservations/members와 다름)
  - 3가지 fetch 함수가 각각 다른 필터를 사용하므로 별도 cache key 필요

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Store 파일 존재 및 빌드 성공
    Tool: Bash
    Steps:
      1. grep -c "defineStore" src/stores/ptSessions.js
      2. npm run build
    Expected Result: defineStore 존재, 빌드 성공
    Evidence: .sisyphus/evidence/task-5-store-created.txt
  ```

  **Commit**: NO (groups with Commit 2: Tasks 3-6)

- [ ] 6. chatBadge + notifications store 생성

  **What to do**:
  - `src/stores/chatBadge.js` 생성:
    - State: `unreadCount` (ref, 0), `lastFetchedAt`
    - Action: `loadUnreadCount(force = false)` — `useChat.getUnreadCount()` 쿼리 복사 (messages 테이블, receiver_id=me, is_read=false count)
    - Visibility-driven: 별도 TTL 없음, 앱 복귀 시 항상 refetch (BottomNav에서 호출)
    - Action: `$reset()`
  - `src/stores/notificationBadge.js` 생성:
    - State: `unreadCount` (ref, 0), `lastFetchedAt`
    - Action: `loadUnreadCount(force = false)` — `useNotifications.getUnreadCount()` 쿼리 복사 (notifications 테이블, is_read=false, 7일 필터 count)
    - Action: `invalidate()`, `$reset()`

  **Must NOT do**:
  - useChat.js / useNotifications.js 수정 (Task 10에서 수행)
  - Supabase Realtime 추가
  - loading/error 포함

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 작은 store, 각각 count 쿼리 하나만 포함
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/composables/useChat.js:290-312` — `getUnreadCount()` (messages 테이블 count 쿼리)
  - `src/composables/useNotifications.js:44-58` — `getUnreadCount()` (notifications 테이블 count 쿼리, 7일 필터)

  **WHY Each Reference Matters**:
  - chat과 notification은 다른 테이블 — 별도 store 필수 (Metis 지적)
  - notifications는 7일 필터(`created_at >= now() - 7days`) 포함 — 정확히 복사

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 두 store 파일 존재 및 빌드 성공
    Tool: Bash
    Steps:
      1. ls src/stores/chatBadge.js src/stores/notificationBadge.js
      2. npm run build
    Expected Result: 두 파일 모두 존재, 빌드 성공
    Evidence: .sisyphus/evidence/task-6-stores-created.txt
  ```

  **Commit**: NO (groups with Commit 2: Tasks 3-6 한꺼번에)

- [ ] 7. useReservations → reservations store 위임

  **What to do**:
  - `src/composables/useReservations.js` 수정:
    - `import { useReservationsStore } from '@/stores/reservations'` 추가
    - `fetchMyReservations(role)` 변경: store의 `loadReservations(role, false)` 호출 → store에서 stale 체크 → 필요하면 fetch
    - `reservations` ref를 store의 `reservations`로 교체 (computed 또는 storeToRefs)
    - **함수 시그니처 변경 금지** — 호출하는 뷰 코드 수정 없어야 함
    - `fetchAvailableSlots()`, `createReservation()`, `updateReservationStatus()`, `checkTrainerConnection()`, `getConnectedTrainerId()`, `checkPtCount()` — 변경 없음 (store에 없는 기능)
    - `loading`, `error` ref는 composable 내부에 유지

  **Must NOT do**:
  - 함수 시그니처 변경
  - fetchAvailableSlots 등 다른 함수 수정
  - 슬롯 계산 로직 이동
  - 뷰 파일 수정

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: composable → store 위임 패턴의 첫 번째 구현. 정확한 API 호환성 유지가 핵심.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8-10)
  - **Blocks**: Task 11
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `src/stores/reservations.js` (Task 3에서 생성) — store API
  - `src/composables/useReservations.js:205-264` — 현재 fetchMyReservations 구현

  **API/Type References**:
  - `src/views/trainer/TrainerHomeView.vue:258,286-287` — `const { reservations, loading, error, fetchMyReservations } = useReservations()` — 이 destructuring이 그대로 동작해야 함
  - `src/views/member/MemberHomeView.vue:201-205` — 동일 패턴

  **WHY Each Reference Matters**:
  - 뷰에서 `const { reservations, fetchMyReservations } = useReservations()`로 destructuring하므로, composable이 여전히 동일 이름의 ref와 함수를 return해야 함

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 기존 테스트 회귀 없음
    Tool: Bash
    Steps:
      1. npm test
    Expected Result: 66 passed, 0 failed (useReservations 테스트 3개 포함)
    Failure Indicators: useReservations 테스트 실패
    Evidence: .sisyphus/evidence/task-7-test-regression.txt

  Scenario: 빌드 성공
    Tool: Bash
    Steps:
      1. npm run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-7-build.txt
  ```

  **Commit**: NO (groups with Commit 4: Tasks 7-10)

- [ ] 8. useMembers → members store 위임

  **What to do**:
  - `src/composables/useMembers.js` 수정:
    - `import { useMembersStore } from '@/stores/members'` 추가
    - `fetchMembers()` → store의 `loadMembers(false)` 호출
    - `members` ref를 store의 `members`로 교체
    - 함수 시그니처 변경 금지

  **Must NOT do**:
  - 함수 시그니처 변경, loading/error를 store로 이동, 뷰 수정

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 9, 10)
  - **Blocks**: Task 11, Task 12
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - Task 7의 useReservations 위임 패턴 (동일 패턴 적용)
  - `src/composables/useMembers.js` — 현재 구현
  - `src/stores/members.js` (Task 4에서 생성) — store API

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 기존 테스트 회귀 없음
    Tool: Bash
    Steps:
      1. npm test
    Expected Result: 66 passed, 0 failed (useMembers 테스트 5개 포함)
    Evidence: .sisyphus/evidence/task-8-test-regression.txt
  ```

  **Commit**: NO (groups with Commit 4)

- [ ] 9. usePtSessions → ptSessions store 위임

  **What to do**:
  - `src/composables/usePtSessions.js` 수정:
    - `import { usePtSessionsStore } from '@/stores/ptSessions'` 추가
    - `fetchPtHistory(memberId)` → store의 `loadPtHistory(memberId, false)` 호출
    - `fetchMemberOwnPtCount()` → store의 `loadMemberOwnPtCount(false)` 호출
    - `fetchRemainingByPair(memberId, trainerId)` → store의 `loadRemainingByPair(memberId, trainerId, false)` 호출
    - `ptHistory`, `remainingCount`, `totalCount` ref/computed → store에서 가져오기
    - `addSessions`, `deductSessions`, `updatePtSession` — **변경 없음** (mutation은 composable에 유지)
    - 함수 시그니처 변경 금지

  **Must NOT do**:
  - mutation 로직 이동, 함수 시그니처 변경

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 10)
  - **Blocks**: Task 11, Task 12
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `src/composables/usePtSessions.js` — 현재 구현
  - `src/stores/ptSessions.js` (Task 5에서 생성) — store API (Map 기반 캐시)

  **WHY Each Reference Matters**:
  - ptSessions는 Map 구조 캐시를 사용하므로 composable에서 올바른 cache key를 전달해야 함

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 기존 테스트 회귀 없음
    Tool: Bash
    Steps:
      1. npm test
    Expected Result: 66 passed, 0 failed (usePtSessions 테스트 4개 포함)
    Evidence: .sisyphus/evidence/task-9-test-regression.txt
  ```

  **Commit**: NO (groups with Commit 4)

- [ ] 10. useChat/useNotifications → badge store 위임

  **What to do**:
  - `src/composables/useChat.js` 수정:
    - `getUnreadCount()` → `useChatBadgeStore().loadUnreadCount()` 호출 위임
    - `unreadCount` ref → store에서 가져오기
    - **다른 함수 (fetchConversations, fetchMessages, sendMessage, markAsRead, subscribe 등) 변경 없음**
  - `src/composables/useNotifications.js` 수정:
    - `getUnreadCount()` → `useNotificationBadgeStore().loadUnreadCount()` 호출 위임
    - `unreadCount` ref → store에서 가져오기
    - **다른 함수 (fetchNotifications, markAsRead, markAllAsRead, createNotification) 변경 없음**
  - `src/components/BottomNav.vue` 수정 (Task 1 결과 위에):
    - `useChat()` 대신 `useChatBadgeStore()` 직접 import하여 `chatUnreadCount` 바인딩
    - Visibility handler에서 `chatBadgeStore.loadUnreadCount(true)` 호출
  - `src/components/TrainerBottomNav.vue` 동일 수정

  **Must NOT do**:
  - Chat의 메시지/대화/구독 로직 수정
  - Notification의 목록/읽음 처리 로직 수정

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 4개 파일 수정, chat/notification 분리 정확성 중요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7-9)
  - **Blocks**: Task 12
  - **Blocked By**: Task 1, Task 6

  **References**:

  **Pattern References**:
  - `src/composables/useChat.js:290-312` — 현재 getUnreadCount (messages count 쿼리)
  - `src/composables/useNotifications.js:44-58` — 현재 getUnreadCount (notifications count 쿼리)
  - `src/components/BottomNav.vue:22-32` — 현재 useChat import 및 badge 바인딩
  - `src/components/TrainerBottomNav.vue:22-38` — 동일

  **WHY Each Reference Matters**:
  - chat unread (messages 테이블) vs notification unread (notifications 테이블) 혼동 방지가 핵심

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 기존 테스트 회귀 없음
    Tool: Bash
    Steps:
      1. npm test
    Expected Result: 66 passed (useChat 3개, useNotifications 3개 포함)
    Evidence: .sisyphus/evidence/task-10-test-regression.txt

  Scenario: BottomNav badge가 chatBadge store에서 데이터 읽음
    Tool: Bash
    Steps:
      1. grep "useChatBadgeStore\|chatBadge" src/components/BottomNav.vue
      2. grep "useChatBadgeStore\|chatBadge" src/components/TrainerBottomNav.vue
    Expected Result: 두 파일 모두 chatBadge store import 존재
    Evidence: .sisyphus/evidence/task-10-badge-store.txt
  ```

  **Commit**: NO (groups with Commit 4: Tasks 7-10)

- [ ] 11. Trainer 탭 뷰 3개 onActivated → stale-check 패턴 전환

  **What to do**:
  - `src/views/trainer/TrainerHomeView.vue`:
    - `import { useReservationsStore } from '@/stores/reservations'` 등 store import 추가
    - `loadData()` 수정: 각 composable의 fetch 함수 호출이 내부적으로 store의 stale-check를 통과하므로 **함수 호출은 유지하되 force=false가 기본**
    - `onActivated(() => { if (loaded.value) loadData() })` 유지 — 차이점은 composable이 내부적으로 store를 체크하여 fresh이면 skip
    - **대안**: `onActivated`에서 직접 stale 체크하여 skip: `onActivated(() => { if (loaded.value && reservationsStore.isStale()) loadData() })`
    - 권장: 후자 (명시적 stale 체크) — 불필요한 함수 호출 자체를 방지
  - `src/views/trainer/TrainerScheduleView.vue`:
    - 동일 패턴: `onActivated`에서 `reservationsStore.isStale() || holidaysStore?.isStale()` 체크
    - holidays는 store가 없으므로 (out of scope) 항상 refetch 또는 composable 내부 로직 유지
    - **결정**: holidays는 store가 없으므로 기존 fetch 유지. reservations만 stale-check.
  - `src/views/trainer/TrainerMemberView.vue`:
    - `onActivated`에서 `membersStore.isStale()` 체크

  **Must NOT do**:
  - 뷰의 template/style 수정
  - 새 composable/store 생성
  - fetchAvailableSlots나 다른 non-tab 기능 수정

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 3개 뷰 파일 수정, store 연동 패턴 이해 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 12와 병렬)
  - **Parallel Group**: Wave 3 (with Task 12)
  - **Blocks**: Task 14
  - **Blocked By**: Tasks 7, 8, 9

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerHomeView.vue:283-297` — 현재 loadData + onMounted + onActivated
  - `src/views/trainer/TrainerScheduleView.vue:261-270` — 현재 패턴
  - `src/views/trainer/TrainerMemberView.vue:338-347` — 현재 패턴
  - `src/views/trainer/TrainerMemberDetailView.vue:232-246` — 이미 최적화된 onActivated 참고 (PT history만 refetch)

  **WHY Each Reference Matters**:
  - TrainerMemberDetailView는 이미 선별적 refetch를 하는 모범 사례 — 이 패턴을 다른 뷰에 적용

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: TrainerHomeView 탭 복귀 시 캐시 내 재호출 없음
    Tool: Playwright
    Preconditions: 트레이너 계정 로그인
    Steps:
      1. page.route('**/rest/v1/**', ...) 네트워크 인터셉트
      2. page.goto('/trainer/home'), 초기 로드 완료 대기
      3. 인터셉트 카운터 리셋
      4. page.click('[data-testid="nav-schedule"]') 또는 '/trainer/schedule' 이동
      5. 3초 대기
      6. page.click('[data-testid="nav-home"]') 또는 '/trainer/home' 이동
      7. 3초 대기
      8. 인터셉트 카운터 확인
    Expected Result: /trainer/home 복귀 시 rest/v1 요청 0건 (5분 이내)
    Failure Indicators: 1건 이상 = stale-check 미적용
    Evidence: .sisyphus/evidence/task-11-trainer-home-cache.png

  Scenario: 기존 테스트 + 빌드 통과
    Tool: Bash
    Steps:
      1. npm test && npm run build
    Expected Result: 66 passed, build exit 0
    Evidence: .sisyphus/evidence/task-11-regression.txt
  ```

  **Commit**: NO (groups with Commit 5: Tasks 11-12)

- [ ] 12. Member 탭 뷰 3개 onActivated → stale-check 패턴 전환

  **What to do**:
  - `src/views/member/MemberHomeView.vue`:
    - Store import 추가 (reservationsStore, ptSessionsStore, notificationBadgeStore)
    - `onActivated`에서 각 store의 isStale 체크: stale인 store의 데이터만 refetch
    - `checkTrainerConnection()`은 store가 없으므로 기존 유지 (빈번하지 않음, 단순 boolean)
    - `fetchWorkoutPlan()`도 store 없으므로 기존 유지
  - `src/views/member/MemberScheduleView.vue`:
    - `onActivated`에서 `reservationsStore.isStale()` 체크
  - `src/views/member/MemberSettingsView.vue`:
    - `onActivated`에서 `ptSessionsStore.isStale()` 체크

  **Must NOT do**:
  - 뷰의 template/style 수정
  - store가 없는 데이터 (workoutPlan, trainerConnection)에 대한 캐시 추가

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 11과 병렬)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 14
  - **Blocked By**: Tasks 8, 9, 10

  **References**:

  **Pattern References**:
  - `src/views/member/MemberHomeView.vue:224-246` — 현재 loadData + hooks
  - `src/views/member/MemberScheduleView.vue:177-185` — 현재 패턴
  - `src/views/member/MemberSettingsView.vue:181-191` — 현재 패턴
  - Task 11의 Trainer 뷰 수정 패턴 참고

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: MemberHomeView 탭 복귀 시 캐시 내 재호출 없음
    Tool: Playwright
    Preconditions: 회원 계정 로그인
    Steps:
      1. page.route('**/rest/v1/**', ...) 네트워크 인터셉트
      2. page.goto('/member/home'), 초기 로드 완료 대기
      3. 인터셉트 카운터 리셋
      4. '/member/schedule' 이동 → 3초 대기
      5. '/member/home' 복귀 → 3초 대기
      6. 인터셉트 카운터 확인
    Expected Result: 복귀 시 rest/v1 요청 0건 (5분 이내)
    Evidence: .sisyphus/evidence/task-12-member-home-cache.png
  ```

  **Commit**: NO (groups with Commit 5: Tasks 11-12)

- [ ] 13. Pull-to-refresh UI 적용 (6개 탭 뷰)

  **What to do**:
  - 6개 탭 뷰에 `AppPullToRefresh` 래퍼 적용:
    - `TrainerHomeView.vue`, `TrainerScheduleView.vue`, `TrainerMemberView.vue`
    - `MemberHomeView.vue`, `MemberScheduleView.vue`, `MemberSettingsView.vue`
  - 각 뷰의 template 최외곽 스크롤 컨테이너를 `<AppPullToRefresh @refresh="handleRefresh">` 로 감싸기
  - `handleRefresh` 함수: 관련 store를 `force=true`로 호출
    - 예: TrainerHomeView — `reservationsStore.loadReservations('trainer', true)`, `membersStore.loadMembers(true)`, etc.
  - 스크롤 영역이 올바르게 작동하도록 CSS 조정 (flex layout 유지)

  **Must NOT do**:
  - 기존 뷰 로직 수정 (loadData, onActivated 등)
  - pull-to-refresh 외 UI 변경

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 6개 뷰에 UI 컴포넌트 삽입 + CSS 레이아웃 조정 필요
  - **Skills**: [`playwright`]
    - `playwright`: pull-to-refresh 동작 Playwright로 검증 필요

  **Parallelization**:
  - **Can Run In Parallel**: NO (Task 11, 12 완료 후)
  - **Parallel Group**: Wave 3 (after Tasks 11, 12)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 2, 11, 12

  **References**:

  **Pattern References**:
  - `src/components/AppPullToRefresh.vue` (Task 2에서 생성) — 래퍼 컴포넌트 사용법
  - `src/views/trainer/TrainerHomeView.vue` template — 현재 레이아웃 구조 (flex column)

  **WHY Each Reference Matters**:
  - 각 뷰의 레이아웃 구조가 `min-height: 100vh; display: flex; flex-direction: column`이므로 pull-to-refresh가 올바른 스크롤 컨테이너에 연결되어야 함

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: TrainerHomeView pull-to-refresh 동작
    Tool: Playwright
    Preconditions: 트레이너 계정 로그인, /trainer/home
    Steps:
      1. page.route('**/rest/v1/**', ...) 인터셉트
      2. 초기 로드 완료 대기, 카운터 리셋
      3. pull-to-refresh 제스처 시뮬레이션 (touchstart → touchmove 70px down → touchend)
      4. 3초 대기
      5. 인터셉트 카운터 확인
    Expected Result: pull-to-refresh 후 API 재호출 발생 (force=true이므로 캐시 무시)
    Failure Indicators: 요청 0건 = force refresh 미연동
    Evidence: .sisyphus/evidence/task-13-pull-refresh.png

  Scenario: 빌드 성공
    Tool: Bash
    Steps: npm run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-13-build.txt
  ```

  **Commit**: YES
  - Message: `feat(views): pull-to-refresh UI 적용`
  - Files: 6 tab view files
  - Pre-commit: `npm run build`

- [ ] 14. Cross-invalidation 연결 (mutation → dirty flag)

  **What to do**:
  - **뷰 파일**에서 mutation 성공 후 관련 store를 `invalidate()` 호출:

  | 뷰/위치 | Mutation | Dirty Stores |
  |---------|----------|-------------|
  | `ReservationManageView.vue` — handleApprove/Reject/Complete | `updateReservationStatus()` | `reservationsStore.invalidate()` |
  | `ReservationManageView.vue` — handleComplete | `updateReservationStatus('completed')` | `reservationsStore.invalidate()` + `ptSessionsStore.invalidate()` (DB trigger) |
  | `MemberReservationView.vue` — 예약 생성 | `createReservation()` | `reservationsStore.invalidate()` |
  | `PtCountManageView.vue` — PT 충전/차감 | `addSessions()`/`deductSessions()` | `ptSessionsStore.invalidate()` + `membersStore.invalidate()` |
  | `TrainerMemberView.vue` — 연결 승인 | `approveConnection()` | `membersStore.invalidate()` |

  - 각 뷰에서 mutation 함수 호출 후 `store.invalidate()` 1줄 추가
  - `updateReservationStatus('completed')` 시 반드시 `ptSessionsStore.invalidate()` 포함 (서버 trigger `trg_auto_deduct_pt` 대응)

  **Must NOT do**:
  - Composable 내부에서 store invalidation 호출 (뷰에서 orchestration)
  - Store 간 직접 호출
  - Mutation 로직 자체 수정

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: cross-invalidation map을 정확히 구현해야 하며, DB trigger chain 이해 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 11, 12

  **References**:

  **Pattern References**:
  - `src/views/trainer/ReservationManageView.vue` — handleApprove, handleReject, handleComplete 함수 위치
  - `src/views/member/MemberReservationView.vue` — 예약 생성 로직
  - `src/views/trainer/PtCountManageView.vue` — PT 충전/차감 로직
  - `src/views/trainer/TrainerMemberView.vue` — approveConnection 로직
  - `supabase/schema.sql` — `trg_auto_deduct_pt` trigger 정의 (completed → pt_sessions -1)

  **WHY Each Reference Matters**:
  - `trg_auto_deduct_pt`는 서버사이드 trigger로, 클라이언트가 직접 pt_sessions INSERT를 하지 않음. 따라서 completed 시 ptSessionsStore를 명시적으로 invalidate해야 함.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 예약 완료 → reservations + ptSessions 모두 dirty
    Tool: Playwright
    Preconditions: 트레이너 계정, pending 예약 존재
    Steps:
      1. /trainer/reservations 이동
      2. pending 예약 승인 → complete
      3. /trainer/home 이동
      4. network 인터셉트: reservations 테이블 + pt_sessions 테이블 요청 발생 확인
    Expected Result: home 복귀 시 reservations + pt_sessions 모두 refetch (dirty → stale)
    Failure Indicators: 둘 중 하나라도 refetch 안됨 = cross-invalidation 누락
    Evidence: .sisyphus/evidence/task-14-cross-invalidation.png

  Scenario: 빌드 + 테스트
    Tool: Bash
    Steps: npm test && npm run build
    Expected Result: 66 passed, build exit 0
    Evidence: .sisyphus/evidence/task-14-regression.txt
  ```

  **Commit**: YES
  - Message: `feat(views): cross-invalidation 연결 (mutation → dirty flag)`
  - Files: ReservationManageView, MemberReservationView, PtCountManageView, TrainerMemberView
  - Pre-commit: `npm test && npm run build`

- [ ] 15. 전체 회귀 테스트 + 빌드 검증

  **What to do**:
  - `npm test` 실행 — 66/66 테스트 통과 확인
  - `npm run build` 실행 — exit code 0 확인
  - Playwright로 주요 시나리오 검증:
    1. 트레이너 로그인 → 홈/일정/회원 탭 순환 → 5분 이내 재방문 시 API 0건
    2. 회원 로그인 → 홈/일정/설정 탭 순환 → 동일 검증
    3. BottomNav 30초 대기 → 추가 폴링 없음
    4. Pull-to-refresh → force reload 동작
    5. 예약 완료 → cross-invalidation → 탭 복귀 시 refetch
  - `grep -r "setInterval" src/components/BottomNav.vue src/components/TrainerBottomNav.vue` — 결과 0건 확인

  **Must NOT do**:
  - 코드 수정 (검증만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 종합 검증. Playwright + Bash 복합 사용
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Task 14)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 13, 14

  **References**:

  **Pattern References**:
  - 전체 Task 1-14의 QA 시나리오 재실행

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 전체 테스트 스위트
    Tool: Bash
    Steps: npm test
    Expected Result: 66 passed, 0 failed
    Evidence: .sisyphus/evidence/task-15-tests.txt

  Scenario: 프로덕션 빌드
    Tool: Bash
    Steps: npm run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-15-build.txt

  Scenario: setInterval 완전 제거 확인
    Tool: Bash
    Steps: grep -r "setInterval" src/components/BottomNav.vue src/components/TrainerBottomNav.vue
    Expected Result: 출력 0줄 (setInterval 코드 없음)
    Evidence: .sisyphus/evidence/task-15-no-polling.txt

  Scenario: 트레이너 탭 순환 캐시 검증
    Tool: Playwright
    Preconditions: 트레이너 계정 로그인
    Steps:
      1. network 인터셉트 설정
      2. /trainer/home 초기 로드 완료
      3. 카운터 리셋
      4. /trainer/schedule → /trainer/members → /trainer/home 순환
      5. 각 전환 사이 2초 대기
      6. 총 rest/v1 요청 수 확인
    Expected Result: 탭 순환 중 rest/v1 요청 0건 (모든 데이터 캐시 hit)
    Failure Indicators: 1건 이상 = 캐시 미적용 뷰 존재
    Evidence: .sisyphus/evidence/task-15-trainer-cycle.png

  Scenario: 회원 탭 순환 캐시 검증
    Tool: Playwright
    Preconditions: 회원 계정 로그인 (트레이너 연결됨)
    Steps:
      1. network 인터셉트 설정
      2. /member/home 초기 로드 완료
      3. 카운터 리셋
      4. /member/schedule → /member/settings → /member/home 순환
      5. 총 rest/v1 요청 수 확인
    Expected Result: 요청 0건 (5분 이내 캐시)
    Evidence: .sisyphus/evidence/task-15-member-cycle.png
  ```

  **Commit**: NO (검증 전용)

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Test edge cases: rapid tab switching, expired cache, pull-to-refresh. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Commit 1** (after Wave 1): `refactor(nav): BottomNav 폴링 제거 + Visibility API 전환`
  - Files: `src/components/BottomNav.vue`, `src/components/TrainerBottomNav.vue`
- **Commit 2** (after Wave 1): `feat(stores): Pinia 데이터 캐시 store 5개 생성`
  - Files: `src/stores/reservations.js`, `src/stores/members.js`, `src/stores/ptSessions.js`, `src/stores/chatBadge.js`, `src/stores/notifications.js`
- **Commit 3** (after Wave 1): `feat(ui): pull-to-refresh 라이브러리 설치 + 공통 컴포넌트`
  - Files: `package.json`, `src/components/PullToRefresh.vue` (or library wrapper)
- **Commit 4** (after Wave 2): `refactor(composables): composable → Pinia store 위임 (thin wrapper)`
  - Files: `src/composables/useReservations.js`, `src/composables/useMembers.js`, `src/composables/usePtSessions.js`, `src/composables/useChat.js`, `src/composables/useNotifications.js`
- **Commit 5** (after Wave 3): `refactor(views): 탭 뷰 onActivated → stale-check 패턴 전환`
  - Files: 6 tab view files
- **Commit 6** (after Wave 3): `feat(views): pull-to-refresh UI 적용`
  - Files: 6 tab view files
- **Commit 7** (after Wave 4): `feat(views): cross-invalidation 연결 (mutation → dirty flag)`
  - Files: views that perform mutations

---

## Success Criteria

### Verification Commands
```bash
npm test          # Expected: 66 passed, 0 failed
npm run build     # Expected: exit code 0
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All 66 tests pass
- [ ] Build succeeds
- [ ] Tab switching within 5min = 0 API calls (Playwright verified)
- [ ] BottomNav setInterval completely removed
- [ ] Pull-to-refresh triggers force reload
- [ ] Cross-invalidation: complete reservation → refetch reservations + ptSessions
