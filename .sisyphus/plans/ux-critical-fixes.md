# UX Critical Fixes — 에러 표시 + 이중 제출 방지

## TL;DR

> **Quick Summary**: 프로덕션 릴리스 전 CRITICAL UX 갭 해소. 6개 뷰에 에러 표시 추가, 2개 뷰에 이중 제출 방지 추가, 1개 composable에서 에러 상태 노출, AppToast 긴 텍스트 지원, useToast 유틸 composable 생성.
> 
> **Deliverables**:
> - useToast.js composable (보일러플레이트 제거용)
> - AppToast white-space 수정 (긴 에러 메시지 지원)
> - 6개 뷰에 에러 toast 표시 추가
> - MemberHomeView 부분 누락 에러 표시 보완
> - 2개 뷰에 버튼 비활성화 + 로딩 상태 추가
> - useNotifications.createNotification 에러 상태 노출
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 (useToast) → Task 3~8 (뷰 에러 표시) → F1~F4 (검증)

---

## Context

### Original Request
PRD 24개 기능 완료 후 UX/품질 개선 방향 선택. CRITICAL 수준 갭만 집중 수정.

### Interview Summary
**Key Discussions**:
- 범위: CRITICAL만 (에러 표시, 이중 제출 방지). MEDIUM/LOW 제외.
- 새 컴포넌트 생성 허용
- 에러 표시: 기존 AppToast(type="error") 활용
- 테스트: 뷰 변경이므로 composable 테스트 범위 밖. QA 시나리오로 검증.

**Research Findings**:
- 탐색 에이전트가 16뷰 에러 누락, 8뷰 버튼 disable 누락으로 보고
- Metis 교차검증 결과: 실제 에러 누락 6뷰, 버튼 disable 누락 2뷰 (나머지는 이미 구현됨)
- AppToast 이미 존재 (success/error/default 타입, auto-dismiss)
- AppToast에 white-space: nowrap이 있어 긴 한국어 에러 메시지 잘림 → 수정 필요
- InviteManageView에 AppToast 사용 패턴 존재 (3-ref 보일러플레이트)

### Metis Review
**Identified Gaps** (addressed):
- 원래 감사 데이터가 부정확 → 직접 grep 교차검증으로 실제 누락 뷰 확인
- AppToast white-space 문제 → Task 1에서 수정
- useToast 보일러플레이트 → Task 1에서 composable 생성
- ReservationManageView는 per-item processingId 패턴 필요 → TrainerMemberView 패턴 참조

---

## Work Objectives

### Core Objective
프로덕션 릴리스 전 사용자에게 에러를 알리고 이중 제출을 방지하는 CRITICAL UX 갭 해소.

### Concrete Deliverables
- `src/composables/useToast.js` — 신규 composable
- `src/components/AppToast.vue` — white-space 수정
- 6개 뷰 + MemberHomeView 에러 표시 추가
- 2개 뷰 버튼 비활성화 추가
- `src/composables/useNotifications.js` — createNotification 에러 노출

### Definition of Done
- [x] `npm run build` 성공
- [x] `npx vitest run` 85개+ 테스트 통과 (기존 테스트 깨지지 않음)
- [x] 6개 뷰 + MemberHomeView에서 에러 발생 시 toast 표시
- [x] ReservationManageView에서 작업 중 버튼 비활성화
- [x] TrainerScheduleView에서 휴무일 토글 중 버튼 비활성화

### Must Have
- 에러 발생 시 사용자에게 시각적 피드백 (AppToast type="error")
- 비동기 작업 중 버튼 비활성화 (이중 제출 방지)
- useNotifications.createNotification이 실패 시 error ref 설정
- AppToast가 긴 한국어 메시지를 정상 표시

### Must NOT Have (Guardrails)
- 이미 에러 표시가 있는 10개 뷰 수정 금지 (TodayWorkoutView, MemberMemoView, PtCountManageView, MemberPaymentHistoryView, WorkTimeSettingView, ManualRegisterView, PaymentWriteView, MemoWriteView, TrainerScheduleView 에러 부분, ReservationManageView 에러 부분)
- 기존 인라인 `v-if="error"` 패턴을 AppToast로 교체 금지 — 새로 추가하는 뷰만 AppToast 사용
- raw `<button>`을 `<AppButton>`으로 변환 금지
- useManuals.js console.warn (storage 삭제 실패) 수정 금지 — 의도적 설계
- useTrainerSearch.js 중첩 notification error 처리 수정 금지 — 의도적 설계
- 성공 toast 추가 금지 — 에러만 scope
- 빈 상태 CTA, 로딩 스켈레톤, confirm() 대체 등 MEDIUM/LOW 항목 금지
- 기존 테스트 파일 수정 금지
- 새 npm 패키지 설치 금지
- TypeScript 추가 금지
- 코드 주석(// comment) 금지

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: None for this plan (뷰 변경이 주 — composable만 테스트 규칙)
- **Framework**: Vitest (기존 테스트 깨지지 않는지 확인만)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Build verification**: Use Bash — `npm run build`, `npx vitest run`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — 즉시 시작):
├── Task 1: useToast composable + AppToast white-space 수정 [quick]
├── Task 2: useNotifications.createNotification 에러 노출 [quick]
└── Task 3: ReservationManageView 이중 제출 방지 [quick]

Wave 2 (뷰 에러 표시 — Wave 1 완료 후, Task 1에 의존):
├── Task 4: TrainerChatView + MemberChatView 에러 표시 [quick]
├── Task 5: TrainerManualView + MemberManualView 에러 표시 [quick]
├── Task 6: NotificationListView + MemberWorkoutDetailView 에러 표시 [quick]
├── Task 7: MemberHomeView 부분 누락 에러 보완 [quick]
└── Task 8: TrainerScheduleView 휴무일 버튼 disable [quick]

Wave FINAL (검증 — Wave 2 완료 후):
├── F1: Plan Compliance Audit (oracle)
├── F2: Code Quality Review (unspecified-high)
├── F3: Real Manual QA (unspecified-high + playwright)
└── F4: Scope Fidelity Check (deep)

Critical Path: Task 1 → Task 4~7 → F1~F4
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 5 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4, 5, 6, 7 | 1 |
| 2 | — | — | 1 |
| 3 | — | — | 1 |
| 4 | 1 | F1~F4 | 2 |
| 5 | 1 | F1~F4 | 2 |
| 6 | 1 | F1~F4 | 2 |
| 7 | 1 | F1~F4 | 2 |
| 8 | — | F1~F4 | 2 |
| F1~F4 | ALL | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1 `quick`, T2 `quick`, T3 `quick`
- **Wave 2**: 5 tasks — T4 `quick`, T5 `quick`, T6 `quick`, T7 `quick`, T8 `quick`
- **FINAL**: 4 tasks — F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`+`playwright`, F4 `deep`

---

## TODOs

- [x] 1. useToast composable 생성 + AppToast white-space 수정

  **What to do**:
  - `src/composables/useToast.js` 생성: showToast, toastMessage, toastType refs + showError(msg), showSuccess(msg) 함수를 반환하는 composable. duration은 기본 3000ms(에러는 더 길게).
  - `src/components/AppToast.vue`에서 `white-space: nowrap`을 `white-space: normal`로 변경. `overflow: hidden; text-overflow: ellipsis;`도 제거(있으면). 긴 텍스트가 줄바꿈되도록.
  - useToast composable은 InviteManageView의 3-ref 패턴(showToast, toastMsg, fireToast)을 캡슐화.

  **Must NOT do**:
  - 기존 InviteManageView나 WorkTimeSettingView의 AppToast 사용 방식 변경 금지 — 새 뷰만 useToast 사용
  - 새 npm 패키지 설치 금지
  - 코드 주석 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 composable 생성 + 기존 컴포넌트 CSS 1줄 변경
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: CSS 변경 검증에 불필요 — QA는 후속 태스크에서

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6, 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/invite/InviteManageView.vue:81-87` — 현재 AppToast 사용 패턴 (toastMsg, showToast, fireToast). useToast는 이 3-ref 보일러플레이트를 composable로 캡슐화해야 함.
  - `src/views/trainer/WorkTimeSettingView.vue` — 또 다른 AppToast 사용 예시. 동일 패턴 확인용.

  **API/Type References**:
  - `src/components/AppToast.vue:15-20` — AppToast props: modelValue(Boolean), message(String), duration(Number, default 2000), type(String, 'default'|'success'|'error'). useToast는 이 props와 호환되어야 함.
  - `src/components/AppToast.vue:61` — `white-space: nowrap` — 이 줄을 `white-space: normal`로 변경해야 함.

  **External References**:
  - 없음 — 순수 Vue 3 Composition API 사용

  **Acceptance Criteria**:

  - [ ] `src/composables/useToast.js` 파일 존재
  - [ ] useToast()가 { showToast, toastMessage, toastType, showError, showSuccess } 반환
  - [ ] AppToast.vue에서 white-space가 normal로 변경됨
  - [ ] `npm run build` 성공
  - [ ] `npx vitest run` 기존 테스트 전부 통과

  **QA Scenarios**:

  ```
  Scenario: useToast composable 파일 존재 및 export 확인
    Tool: Bash
    Preconditions: Wave 1 Task 1 구현 완료
    Steps:
      1. cat src/composables/useToast.js
      2. node -e "const m = require('./src/composables/useToast.js'); console.log(typeof m)" — ESM이므로 grep으로 export 확인
      3. grep "export" src/composables/useToast.js
    Expected Result: showToast, toastMessage, toastType, showError가 export됨
    Evidence: .sisyphus/evidence/task-1-usetoast-export.txt

  Scenario: AppToast white-space 변경 확인
    Tool: Bash
    Preconditions: AppToast.vue 수정 완료
    Steps:
      1. grep "white-space" src/components/AppToast.vue
    Expected Result: "white-space: normal" 출력. "nowrap" 없음.
    Evidence: .sisyphus/evidence/task-1-apptoast-whitespace.txt

  Scenario: 빌드 및 테스트 통과
    Tool: Bash
    Preconditions: 모든 변경 완료
    Steps:
      1. npm run build
      2. npx vitest run
    Expected Result: 빌드 성공, 85개+ 테스트 통과
    Evidence: .sisyphus/evidence/task-1-build-test.txt
  ```

  **Commit**: YES (groups with Tasks 2, 3)
  - Message: `feat(ux): add useToast composable and fix AppToast long text support`
  - Files: `src/composables/useToast.js`, `src/components/AppToast.vue`
  - Pre-commit: `npm run build && npx vitest run`

- [x] 2. useNotifications.createNotification 에러 상태 노출

  **What to do**:
  - `src/composables/useNotifications.js`의 `createNotification` 함수에서 `console.error` 대신 `error.value`를 설정.
  - 기존: catch 블록에서 `console.error('알림 생성 실패:', e.message)` → 변경: `error.value = '알림 생성에 실패했습니다'` + `return false`
  - createNotification의 반환값을 boolean으로 변경 (성공 시 true, 실패 시 false). 기존 호출자들이 반환값을 사용하지 않으므로 하위 호환성 유지됨.
  - 함수 시작 시 `error.value = null` 추가하여 이전 에러 클리어.

  **Must NOT do**:
  - useNotifications의 다른 함수 수정 금지
  - 기존 호출자(TrainerMemberView, useTrainerSearch 등) 수정 금지 — 반환값 무시해도 동작
  - console.error 제거 후 다른 console 문 추가 금지
  - 코드 주석 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: composable 함수 1개의 catch 블록 3줄 변경
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: None (뷰들은 이미 error를 destructure할 때 이 값을 받음)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/composables/useNotifications.js:113` — 현재 `console.error('알림 생성 실패:', e.message)` 위치. 이 줄을 `error.value = '알림 생성에 실패했습니다'`로 교체.
  - `src/composables/useNotifications.js` — error ref가 이미 정의되어 있는지 확인. 다른 함수(fetchNotifications 등)에서 error.value 설정 패턴 참조.

  **API/Type References**:
  - `src/composables/useNotifications.js` — return 문에서 error가 이미 반환되고 있는지 확인. 반환되고 있다면 뷰에서 destructure만 하면 됨.

  **WHY Each Reference Matters**:
  - createNotification의 catch 블록 위치를 정확히 찾기 위해 line 113 참조
  - error ref 존재 여부와 반환 여부를 확인하여 추가 작업 범위 결정

  **Acceptance Criteria**:

  - [ ] createNotification 실패 시 error.value가 설정됨
  - [ ] createNotification이 성공 시 true, 실패 시 false 반환
  - [ ] console.error 라인 제거됨
  - [ ] `npx vitest run` 기존 테스트 통과

  **QA Scenarios**:

  ```
  Scenario: createNotification 에러 노출 확인
    Tool: Bash
    Preconditions: useNotifications.js 수정 완료
    Steps:
      1. grep "error.value" src/composables/useNotifications.js — createNotification 내부에서 error.value 설정 확인
      2. grep "console.error" src/composables/useNotifications.js — console.error 제거 확인
      3. grep "return false" src/composables/useNotifications.js — 실패 시 false 반환 확인
    Expected Result: error.value 설정 있음, console.error 없음, return false 있음
    Evidence: .sisyphus/evidence/task-2-notifications-error.txt

  Scenario: 빌드 및 테스트 통과
    Tool: Bash
    Steps:
      1. npm run build
      2. npx vitest run
    Expected Result: 빌드 성공, 테스트 전부 통과
    Evidence: .sisyphus/evidence/task-2-build-test.txt
  ```

  **Commit**: YES (groups with Tasks 1, 3)
  - Message: `feat(ux): add useToast composable and fix AppToast long text support`
  - Files: `src/composables/useNotifications.js`
  - Pre-commit: `npx vitest run`

- [x] 3. ReservationManageView 이중 제출 방지

  **What to do**:
  - `src/views/trainer/ReservationManageView.vue`에 per-item `processingId` 패턴 추가.
  - `const processingId = ref(null)` 추가.
  - 승인/거절/완료/취소 버튼 클릭 핸들러에서: `processingId.value = reservation.id` → 비동기 작업 → `processingId.value = null`
  - 각 버튼에 `:disabled="processingId === reservation.id"` 추가.
  - 버튼 텍스트에 로딩 상태 표시: 예) `{{ processingId === reservation.id ? '처리 중...' : '승인' }}`

  **Must NOT do**:
  - 기존 에러 표시(`v-if="error"`) 수정 금지 — 이미 존재함
  - raw `<button>`을 `<AppButton>`으로 변환 금지
  - 성공 toast 추가 금지
  - 코드 주석 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 뷰 파일에 ref 1개 + 버튼 disabled 바인딩 추가
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: F1~F4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberView.vue:248-250` — `processingId` 패턴 참조. 연결 승인/거절에서 per-item disable 구현. ReservationManageView도 동일 패턴 적용.
  - `src/views/trainer/ReservationManageView.vue:247-260` — 현재 script setup 영역. useReservations에서 destructure하는 항목 확인.
  - `src/views/trainer/ReservationManageView.vue:61` — 기존 `v-if="error"` 에러 표시 위치. 이 부분은 수정하지 않음.

  **API/Type References**:
  - `src/composables/useReservations.js` — updateReservationStatus, rejectReservation 함수 시그니처 확인

  **WHY Each Reference Matters**:
  - TrainerMemberView의 processingId 패턴을 그대로 따라야 코드 일관성 유지
  - ReservationManageView의 현재 버튼 구조를 파악해야 disabled 바인딩 추가 위치 결정

  **Acceptance Criteria**:

  - [ ] processingId ref 존재
  - [ ] 승인/거절/완료/취소 버튼에 `:disabled` 바인딩
  - [ ] 비동기 작업 중 버튼 텍스트 변경 (예: "처리 중...")
  - [ ] `npm run build` 성공

  **QA Scenarios**:

  ```
  Scenario: ReservationManageView 버튼 disable 바인딩 확인
    Tool: Bash
    Preconditions: ReservationManageView.vue 수정 완료
    Steps:
      1. grep "processingId" src/views/trainer/ReservationManageView.vue
      2. grep ":disabled" src/views/trainer/ReservationManageView.vue
      3. grep "처리 중" src/views/trainer/ReservationManageView.vue
    Expected Result: processingId ref 정의, 버튼에 disabled 바인딩, "처리 중" 텍스트 존재
    Evidence: .sisyphus/evidence/task-3-reservation-disable.txt

  Scenario: 빌드 통과
    Tool: Bash
    Steps:
      1. npm run build
    Expected Result: 빌드 성공
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Commit**: YES (groups with Tasks 1, 2)
  - Message: `feat(ux): add useToast composable and fix AppToast long text support`
  - Files: `src/views/trainer/ReservationManageView.vue`
  - Pre-commit: `npm run build`

- [x] 4. TrainerChatView + MemberChatView 에러 표시 추가

  **What to do**:
  - **TrainerChatView.vue**: useChat()에서 `error`를 destructure. useToast 임포트. error watch → showError(error.value). 템플릿에 AppToast 추가.
  - **MemberChatView.vue**: 동일하게 useChat()에서 `error` destructure + useToast + AppToast 추가.
  - 두 뷰 모두 동일한 패턴: `watch(error, (val) => { if (val) showError(val) })`
  - 템플릿 최하단에 `<AppToast v-model="showToast" :message="toastMessage" :type="toastType" />` 추가.

  **Must NOT do**:
  - 채팅 기능 로직 변경 금지
  - sendMessage 에러 처리 추가 금지 — 페치 에러만 표시
  - 성공 toast 추가 금지
  - 코드 주석 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 뷰에 동일 패턴 적용 (import 3줄 + watch 3줄 + template 1줄)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7, 8)
  - **Blocks**: F1~F4
  - **Blocked By**: Task 1 (useToast)

  **References**:

  **Pattern References**:
  - `src/composables/useToast.js` — Task 1에서 생성됨. showError(msg) 호출 패턴.
  - `src/views/invite/InviteManageView.vue:76-87` — AppToast 임포트 + 사용 패턴 참조 (useToast 대신 수동 ref 사용하지만 AppToast 템플릿 위치 참고).
  - `src/views/trainer/TrainerChatView.vue:148-161` — 현재 useChat() destructure. `error`가 빠져 있음. 여기에 `error` 추가.
  - `src/views/member/MemberChatView.vue:148-161` — 동일하게 `error` 추가.

  **API/Type References**:
  - `src/composables/useChat.js` — error ref가 반환 목록에 포함되어 있는지 확인. fetchConversations 실패 시 error.value 설정되는지 확인.

  **Acceptance Criteria**:

  - [ ] TrainerChatView에서 error destructure + AppToast 렌더
  - [ ] MemberChatView에서 error destructure + AppToast 렌더
  - [ ] `npm run build` 성공

  **QA Scenarios**:

  ```
  Scenario: TrainerChatView 에러 toast 표시 확인
    Tool: Bash
    Steps:
      1. grep "error" src/views/trainer/TrainerChatView.vue — error destructure 확인
      2. grep "AppToast" src/views/trainer/TrainerChatView.vue — AppToast 사용 확인
      3. grep "useToast" src/views/trainer/TrainerChatView.vue — useToast 임포트 확인
      4. grep "showError" src/views/trainer/TrainerChatView.vue — showError 호출 확인
    Expected Result: error, AppToast, useToast, showError 모두 존재
    Evidence: .sisyphus/evidence/task-4-chat-error.txt

  Scenario: MemberChatView 에러 toast 표시 확인
    Tool: Bash
    Steps:
      1. grep "error" src/views/member/MemberChatView.vue
      2. grep "AppToast" src/views/member/MemberChatView.vue
      3. grep "useToast" src/views/member/MemberChatView.vue
    Expected Result: error, AppToast, useToast 모두 존재
    Evidence: .sisyphus/evidence/task-4-member-chat-error.txt

  Scenario: 빌드 통과
    Tool: Bash
    Steps:
      1. npm run build
    Expected Result: 빌드 성공
    Evidence: .sisyphus/evidence/task-4-build.txt
  ```

  **Commit**: YES (groups with Tasks 5, 6, 7, 8)
  - Message: `feat(ux): add error display and double-submit prevention to critical views`
  - Files: `src/views/trainer/TrainerChatView.vue`, `src/views/member/MemberChatView.vue`

- [x] 5. TrainerManualView + MemberManualView 에러 표시 추가

  **What to do**:
  - **TrainerManualView.vue**: useManuals()에서 `error`를 destructure (현재 빠져있음). useToast 임포트. error watch → showError. 템플릿에 AppToast 추가.
  - **MemberManualView.vue**: useManuals()에서 `error`를 destructure (현재 빠져있음). 동일 패턴 적용.

  **Must NOT do**:
  - 매뉴얼 CRUD 로직 변경 금지
  - useManuals.js의 console.warn (storage 삭제) 수정 금지
  - 코드 주석 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 뷰에 동일 패턴 (Task 4와 동일 작업)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7, 8)
  - **Blocks**: F1~F4
  - **Blocked By**: Task 1 (useToast)

  **References**:

  **Pattern References**:
  - `src/composables/useToast.js` — Task 1에서 생성. showError 사용.
  - `src/views/trainer/TrainerManualView.vue:152-157` — 현재 useManuals() destructure에 `error` 없음. `error` 추가 필요.
  - `src/views/member/MemberManualView.vue:110-113` — 현재 useManuals() destructure에 `error` 없음. `error` 추가 필요.

  **API/Type References**:
  - `src/composables/useManuals.js` — error ref 반환 확인. fetchManuals, deleteManual 실패 시 error.value 설정 확인.

  **Acceptance Criteria**:

  - [ ] TrainerManualView에서 error destructure + AppToast
  - [ ] MemberManualView에서 error destructure + AppToast
  - [ ] `npm run build` 성공

  **QA Scenarios**:

  ```
  Scenario: TrainerManualView 에러 표시 확인
    Tool: Bash
    Steps:
      1. grep "error" src/views/trainer/TrainerManualView.vue
      2. grep "AppToast" src/views/trainer/TrainerManualView.vue
      3. grep "useToast" src/views/trainer/TrainerManualView.vue
    Expected Result: error, AppToast, useToast 모두 존재
    Evidence: .sisyphus/evidence/task-5-manual-error.txt

  Scenario: MemberManualView 에러 표시 확인
    Tool: Bash
    Steps:
      1. grep "error" src/views/member/MemberManualView.vue
      2. grep "AppToast" src/views/member/MemberManualView.vue
    Expected Result: error, AppToast 존재
    Evidence: .sisyphus/evidence/task-5-member-manual-error.txt
  ```

  **Commit**: YES (groups with Tasks 4, 6, 7, 8)
  - Files: `src/views/trainer/TrainerManualView.vue`, `src/views/member/MemberManualView.vue`

- [x] 6. NotificationListView + MemberWorkoutDetailView 에러 표시 추가

  **What to do**:
  - **NotificationListView.vue**: useNotifications()에서 `error`를 destructure (현재 빠져있음). useToast + AppToast 추가.
  - **MemberWorkoutDetailView.vue**: useWorkoutPlans()에서 `error`를 destructure (현재 빠져있음). useToast + AppToast 추가.

  **Must NOT do**:
  - 알림/운동 상세 기능 로직 변경 금지
  - 코드 주석 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 뷰에 동일 패턴
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7, 8)
  - **Blocks**: F1~F4
  - **Blocked By**: Task 1 (useToast)

  **References**:

  **Pattern References**:
  - `src/composables/useToast.js` — showError 사용.
  - `src/views/common/NotificationListView.vue:73-78` — 현재 useNotifications() destructure에 `error` 없음.
  - `src/views/member/MemberWorkoutDetailView.vue:80-87` — 현재 useWorkoutPlans() destructure에 `error` 없음.

  **API/Type References**:
  - `src/composables/useNotifications.js` — error ref 반환 확인
  - `src/composables/useWorkoutPlans.js` — error ref 반환 확인

  **Acceptance Criteria**:

  - [ ] NotificationListView에서 error destructure + AppToast
  - [ ] MemberWorkoutDetailView에서 error destructure + AppToast
  - [ ] `npm run build` 성공

  **QA Scenarios**:

  ```
  Scenario: NotificationListView 에러 표시 확인
    Tool: Bash
    Steps:
      1. grep "error" src/views/common/NotificationListView.vue
      2. grep "AppToast" src/views/common/NotificationListView.vue
    Expected Result: error, AppToast 존재
    Evidence: .sisyphus/evidence/task-6-notification-error.txt

  Scenario: MemberWorkoutDetailView 에러 표시 확인
    Tool: Bash
    Steps:
      1. grep "error" src/views/member/MemberWorkoutDetailView.vue
      2. grep "AppToast" src/views/member/MemberWorkoutDetailView.vue
    Expected Result: error, AppToast 존재
    Evidence: .sisyphus/evidence/task-6-workout-detail-error.txt
  ```

  **Commit**: YES (groups with Tasks 4, 5, 7, 8)
  - Files: `src/views/common/NotificationListView.vue`, `src/views/member/MemberWorkoutDetailView.vue`

- [x] 7. MemberHomeView 부분 누락 에러 보완

  **What to do**:
  - `src/views/member/MemberHomeView.vue`는 현재 `workoutError`만 표시. `reservError`(useReservations)와 기타 에러 소스 미표시.
  - useReservations()에서 `error: reservError`를 destructure (현재 빠져있는지 확인).
  - useToast + AppToast 추가. 각 에러 소스를 watch하여 toast 표시.
  - 기존 `workoutError` 인라인 표시는 유지 — 추가로 AppToast를 통한 에러 표시만 보강.

  **Must NOT do**:
  - 기존 workoutError 인라인 표시 제거 금지
  - 대시보드 레이아웃 변경 금지
  - 코드 주석 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 뷰에서 추가 에러 소스 watch + AppToast
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6, 8)
  - **Blocks**: F1~F4
  - **Blocked By**: Task 1 (useToast)

  **References**:

  **Pattern References**:
  - `src/views/member/MemberHomeView.vue:129` — 현재 workoutError 표시 위치
  - `src/views/member/MemberHomeView.vue:201-224` — composable destructure 영역. reservError, workoutError 등 확인.
  - `src/composables/useToast.js` — showError 사용.

  **API/Type References**:
  - `src/composables/useReservations.js` — error ref 반환 확인
  - `src/composables/useWorkoutPlans.js` — error ref 반환 확인

  **Acceptance Criteria**:

  - [ ] MemberHomeView에서 reservError 등 추가 에러 소스 watch
  - [ ] AppToast 추가
  - [ ] 기존 workoutError 인라인 표시 유지
  - [ ] `npm run build` 성공

  **QA Scenarios**:

  ```
  Scenario: MemberHomeView 에러 표시 보완 확인
    Tool: Bash
    Steps:
      1. grep "AppToast" src/views/member/MemberHomeView.vue
      2. grep "useToast" src/views/member/MemberHomeView.vue
      3. grep "reservError\|workoutError" src/views/member/MemberHomeView.vue
    Expected Result: AppToast, useToast 존재. reservError와 workoutError 모두 참조됨.
    Evidence: .sisyphus/evidence/task-7-member-home-error.txt
  ```

  **Commit**: YES (groups with Tasks 4, 5, 6, 8)
  - Files: `src/views/member/MemberHomeView.vue`

- [x] 8. TrainerScheduleView 휴무일 버튼 이중 제출 방지

  **What to do**:
  - `src/views/trainer/TrainerScheduleView.vue`에서 휴무일 설정(setHoliday)/해제(removeHoliday) 버튼에 로딩 상태 추가.
  - `const holidayProcessing = ref(false)` 추가.
  - 휴무일 토글 핸들러에서: `holidayProcessing.value = true` → setHoliday/removeHoliday → `holidayProcessing.value = false`
  - 휴무일 버튼에 `:disabled="holidayProcessing"` 추가.
  - 버튼 텍스트에 로딩 상태: `{{ holidayProcessing ? '처리 중...' : (isHoliday(...) ? '휴무 해제' : '휴무 설정') }}`

  **Must NOT do**:
  - 기존 에러 표시(`v-if="error"`) 수정 금지
  - 예약 관련 로직 변경 금지
  - 코드 주석 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 뷰 내 ref 1개 + 버튼 disabled 바인딩
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6, 7)
  - **Blocks**: F1~F4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberView.vue:248-250` — processingId 패턴 참조 (boolean이 아닌 ID 기반이지만, 휴무일은 단일 토글이므로 boolean processingId로 충분)
  - `src/views/trainer/TrainerScheduleView.vue:265-276` — 현재 script setup 영역
  - `src/views/trainer/TrainerScheduleView.vue:18` — 기존 error 표시 위치 (수정 금지)

  **API/Type References**:
  - `src/composables/useHolidays.js` — setHoliday, removeHoliday 함수 시그니처

  **Acceptance Criteria**:

  - [ ] holidayProcessing ref 존재
  - [ ] 휴무일 버튼에 `:disabled` 바인딩
  - [ ] `npm run build` 성공

  **QA Scenarios**:

  ```
  Scenario: TrainerScheduleView 휴무일 버튼 disable 확인
    Tool: Bash
    Steps:
      1. grep "holidayProcessing" src/views/trainer/TrainerScheduleView.vue
      2. grep ":disabled" src/views/trainer/TrainerScheduleView.vue
      3. grep "처리 중" src/views/trainer/TrainerScheduleView.vue
    Expected Result: holidayProcessing ref, disabled 바인딩, "처리 중" 텍스트 존재
    Evidence: .sisyphus/evidence/task-8-schedule-disable.txt
  ```

  **Commit**: YES (groups with Tasks 4, 5, 6, 7)
  - Message: `feat(ux): add error display and double-submit prevention to critical views`
  - Files: `src/views/trainer/TrainerScheduleView.vue`
  - Pre-commit: `npm run build && npx vitest run`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify no code comments (// comment) exist in new/modified code.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (toast appearing correctly across different views). Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag any modifications to the 10 views that already have error display. Flag any success toasts, loading skeletons, or confirm dialogs added.
  Output: `Tasks [N/N compliant] | Scope [CLEAN/N violations] | VERDICT`

---

## Commit Strategy

- **Commit 1** (after Wave 1): `feat(ux): add useToast composable and fix AppToast long text support` — useToast.js, AppToast.vue, useNotifications.js
- **Commit 2** (after Wave 2): `feat(ux): add error display and double-submit prevention to critical views` — 6개 뷰 + MemberHomeView + ReservationManageView + TrainerScheduleView

---

## Success Criteria

### Verification Commands
```bash
npm run build        # Expected: build succeeds
npx vitest run       # Expected: 85+ tests pass, 0 failures
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] AppToast displays long Korean error messages without clipping
- [ ] 6 views show error toast on composable error
- [ ] MemberHomeView shows all error sources
- [ ] ReservationManageView buttons disabled during async
- [ ] TrainerScheduleView holiday buttons disabled during async
