# PRD 갭 완성 — 누락 기능 해소 + 품질 개선

## TL;DR

> **Quick Summary**: PRD 16개 섹션 대비 미구현된 11개 갭(회원 수납 뷰, 메모 수정/삭제, 예약 완료/취소 UI, 인증 에러 표시, 알림 30일 필터, 검색 연결 알림, 트레이너 프로필 뷰 등)을 해소하고, 변경된 composable에 대해 Vitest 테스트를 추가합니다.
>
> **Deliverables**:
> - 회원 수납 내역 조회 뷰 신규 생성 (MemberPaymentHistoryView)
> - 트레이너 메모 수정/삭제 기능 (MemoWriteView edit mode + updateMemo composable)
> - 트레이너 프로필 읽기전용 뷰 신규 생성 (연결 회원 수 포함)
> - ReservationManageView에 예약 완료/취소 버튼 추가
> - AuthCallbackView 인증 에러 + 네트워크 에러 UI 표시
> - 알림 30일 필터 확장 + 검색 연결 알림 발송
> - MemberSettingsView 로그아웃 확인 팝업
> - 메모 삭제 확인 다이얼로그
> - Vitest 테스트 (useMemos, usePayments)
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1-3 (parallel) → Task 4-7 (parallel) → Task 8-10 (parallel) → Task 11 → F1-F4

---

## Context

### Original Request
PRD (docs/PRD_헬스트레이너앱.md) 전체 16개 섹션 대비 소스코드 갭 분석 후 미구현 기능을 모두 해소합니다.

### Interview Summary
**Key Discussions**:
- 작업 범위: PRD 갭 전체 해소 (캘린더 주간/일간 뷰 추가는 제외)
- 테스트: Tests-after (Vitest composable 단위 테스트)
- 미커밋 파일: 플랜 시작 전 별도 커밋
- 캘린더 뷰: 월간만 유지 (주간/일간 스킵)

**Research Findings**:
- 6/16 섹션 완전 구현 (Auth, Dashboard, WorkHours, Chat, PT Count, Workout)
- 10/16 섹션에 갭 존재하나, Metis 검증 결과 3개는 이미 구현됨
- 검색 연결 승인 플로우: `requestConnection()`이 이미 `status='pending'`으로 생성, `TrainerMemberView`에 승인/거절 UI 완비
- 영상 500MB 제한: `useManuals.js`에 이미 검증 로직 존재
- 중복 가입 감지: `AuthCallbackView`에서 기존 프로필+역할 확인 후 홈으로 리다이렉트
- 연결 요청/승인 시 알림 미발송 (새로 발견된 갭)

### Metis Review
**Identified Gaps** (addressed):
- 3개 팬텀 갭 제거: 검색 승인(#8), 영상 제한(#9), 중복 감지(#14) — 이미 구현됨
- 신규 갭 발견: 연결 요청/승인 시 createNotification() 미호출
- 갭 #5(예약 완료): handleComplete() 함수는 존재, 템플릿 버튼만 추가 필요
- 갭 #6+#13 병합 권고: 인증 에러 + 네트워크 에러를 AuthCallbackView에서 통합 처리
- 갭 #11+#12 병합 권고: 트레이너 프로필 뷰 + 연결 회원 수를 하나의 뷰로
- 갭 #7(30일 알림): pg_cron 미확인 시 클라이언트 필터 확장으로 대응 권고
- Scope creep 경고: 글로벌 토스트 시스템, 확인 composable, 전체 composable 재시도 로직 금지

---

## Work Objectives

### Core Objective
PRD 대비 미구현된 11개 기능 갭을 해소하여 PRD 완전 충족 상태를 달성합니다.

### Concrete Deliverables
- `src/views/member/MemberPaymentHistoryView.vue` + `.css` 신규
- `src/views/trainer/TrainerProfileReadOnlyView.vue` + `.css` 신규
- `src/composables/useMemos.js` — `updateMemo()` 함수 추가
- `src/views/trainer/MemoWriteView.vue` — edit mode 추가
- `src/views/trainer/ReservationManageView.vue` — 완료/취소 버튼 추가
- `src/views/auth/AuthCallbackView.vue` — 에러/네트워크 UI 추가
- `src/views/member/MemberSettingsView.vue` — 로그아웃 확인 추가
- `src/router/index.js` — 신규 라우트 2개 추가
- `src/composables/__tests__/useMemos.test.js` — updateMemo 테스트

### Definition of Done
- [ ] `npm run build` 성공 (0 errors)
- [ ] `npm test` 전체 통과
- [ ] 14개 원본 갭 중 11개 해소 (3개는 이미 구현 확인)

### Must Have
- 회원이 자신의 수납 내역을 조회할 수 있어야 함
- 트레이너가 기존 메모를 수정/삭제할 수 있어야 함
- 트레이너가 승인된 예약을 취소/완료 처리할 수 있어야 함
- 인증 실패 시 사용자에게 에러 메시지 + 재시도 버튼이 보여야 함
- 회원 로그아웃 시 확인 팝업이 표시되어야 함
- 메모 삭제 전 확인 다이얼로그가 표시되어야 함

### Must NOT Have (Guardrails)
- 글로벌 토스트/알림 시스템 신규 생성 금지
- 확인(confirm) 전용 composable 생성 금지 — `confirm()` 또는 기존 AppBottomSheet 사용
- auth 외 composable에 재시도 로직 추가 금지
- 회원 수납 뷰에 결제 생성/분석/차트 추가 금지 — 읽기전용 리스트만
- MemoWriteView 외 별도 메모 편집 뷰 생성 금지
- 캘린더 주간/일간 뷰 추가 금지

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: Vitest (bun 아님, npx vitest run)
- **Scope**: 변경된 composable (useMemos, usePayments)에 대해서만 테스트 추가

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **Build**: Use Bash — `npm run build`, `npm test`
- **Composable**: Use Bash — `npx vitest run {file}`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — quick wins, 3 parallel):
├── Task 1: 회원 로그아웃 확인 팝업 [quick] — 3줄 변경
├── Task 2: 예약 "완료" 버튼 추가 [quick] — 8줄 템플릿
└── Task 3: 메모 삭제 확인 다이얼로그 [quick] — AppBottomSheet 추가

Wave 2 (After Wave 1 — small features, 4 parallel):
├── Task 4: 트레이너 예약 취소 버튼 [quick] — ReservationManageView
├── Task 5: 인증 에러 + 네트워크 에러 UI [unspecified-high] — AuthCallbackView + LoginView
├── Task 6: 30일 알림 필터 확장 [quick] — useNotifications 수정
└── Task 7: 검색 연결 알림 발송 [quick] — requestConnection + approveConnection

Wave 3 (After Wave 2 — medium features, 3 parallel):
├── Task 8: 메모 수정/삭제 기능 [unspecified-high] — composable + MemoWriteView + 라우트
├── Task 9: 회원 수납 내역 뷰 [visual-engineering] — 신규 뷰 + 라우트
└── Task 10: 트레이너 프로필 읽기전용 뷰 [visual-engineering] — 신규 뷰 + 라우트

Wave 4 (After Wave 3 — tests):
└── Task 11: Vitest 단위 테스트 [quick] — useMemos + usePayments

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1-3 → Task 4-7 → Task 8-10 → Task 11 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | — | 1 |
| 2 | — | — | 1 |
| 3 | — | 8 (패턴 참조) | 1 |
| 4 | — | — | 2 |
| 5 | — | — | 2 |
| 6 | — | — | 2 |
| 7 | — | — | 2 |
| 8 | 3 (삭제 확인 패턴) | 11 | 3 |
| 9 | — | 11 | 3 |
| 10 | — | — | 3 |
| 11 | 8, 9 | F1-F4 | 4 |

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `quick`, T2 → `quick`, T3 → `quick`
- **Wave 2**: **4** — T4 → `quick`, T5 → `unspecified-high`, T6 → `quick`, T7 → `quick`
- **Wave 3**: **3** — T8 → `unspecified-high`, T9 → `visual-engineering`, T10 → `visual-engineering`
- **Wave 4**: **1** — T11 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

- [ ] 1. 회원 로그아웃 확인 팝업 추가

  **What to do**:
  - `MemberSettingsView.vue`의 `handleLogout()` 함수(236번째 줄 부근)에 `confirm('로그아웃 하시겠습니까?')` 가드를 추가한다
  - confirm이 false를 반환하면 함수를 즉시 return한다
  - 트레이너 `SettingsView.vue`의 `handleLogout()` 패턴(confirm 사용)과 동일하게 구현한다

  **Must NOT do**:
  - AppBottomSheet 사용 금지 — 단순 confirm()만 사용 (트레이너 설정 패턴과 동일)
  - 확인 전용 composable 생성 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 3줄 변경의 단순 작업
  - **Skills**: []
    - 브라우저/git 작업 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/SettingsView.vue:handleLogout()` — 트레이너 로그아웃의 confirm() 패턴 복사 대상

  **API/Type References**:
  - 없음 (브라우저 내장 confirm API)

  **Target File**:
  - `src/views/member/MemberSettingsView.vue:236-239` — handleLogout 함수 위치

  **WHY Each Reference Matters**:
  - SettingsView의 handleLogout: confirm() 호출 패턴과 한국어 메시지를 그대로 복사하여 일관성 유지

  **Acceptance Criteria**:
  - [ ] MemberSettingsView.vue의 handleLogout에 confirm() 가드가 추가됨
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 로그아웃 확인 후 취소
    Tool: Playwright
    Preconditions: /dev-login으로 회원 계정 로그인 상태
    Steps:
      1. /member/settings 페이지로 이동
      2. '로그아웃' 버튼 클릭 (.settings__logout 셀렉터)
      3. confirm 다이얼로그에서 '취소' 클릭 (page.on('dialog', d => d.dismiss()))
      4. 현재 URL이 /member/settings 그대로인지 확인
    Expected Result: 페이지가 /member/settings에 유지됨
    Failure Indicators: /login으로 리다이렉트됨
    Evidence: .sisyphus/evidence/task-1-logout-cancel.png

  Scenario: 로그아웃 확인 후 승인
    Tool: Playwright
    Preconditions: /dev-login으로 회원 계정 로그인 상태
    Steps:
      1. /member/settings 페이지로 이동
      2. '로그아웃' 버튼 클릭 (.settings__logout 셀렉터)
      3. confirm 다이얼로그에서 '확인' 클릭 (page.on('dialog', d => d.accept()))
      4. URL이 /login으로 변경되었는지 확인
    Expected Result: /login 페이지로 이동
    Failure Indicators: /member/settings에 머물거나 에러 발생
    Evidence: .sisyphus/evidence/task-1-logout-confirm.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(ux): add logout confirm, reservation complete button, memo delete dialog`
  - Files: `src/views/member/MemberSettingsView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 2. 예약 "완료" 버튼 추가 (ReservationManageView)

  **What to do**:
  - `ReservationManageView.vue`의 승인된 예약 섹션(approvedList, 143번째 줄 부근)에 "완료" 버튼을 추가한다
  - 승인된 예약 카드(res-card--approved) 안에 `res-card__actions` div를 추가하고, '완료' 버튼을 넣는다
  - 기존 `handleComplete(item)` 함수(294번째 줄)를 그대로 사용 — 이미 구현되어 있음
  - 완료 버튼 스타일: 기존 res-card__btn--approve 클래스 패턴 활용
  - 버튼 아이콘: 체크마크 SVG (승인 버튼과 동일)

  **Must NOT do**:
  - handleComplete 함수를 수정하지 않음 — 이미 구현되어 있으므로 템플릿에 버튼만 추가
  - 대기중(pending) 예약 카드에는 완료 버튼을 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 템플릿에 버튼 추가만 하는 8줄 미만 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: None (Task 4가 같은 파일을 수정하나 별도 섹션이므로 Wave 2에서 독립 작업 가능)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/ReservationManageView.vue:124-137` — 대기중 예약의 거절/승인 버튼 액션 영역 패턴

  **API/Type References**:
  - `src/views/trainer/ReservationManageView.vue:294-301` — handleComplete 함수 (이미 구현됨, 호출만 하면 됨)

  **Target File**:
  - `src/views/trainer/ReservationManageView.vue:184-187` — 승인된 예약 카드의 닫는 div 위치 (여기에 actions 추가)

  **WHY Each Reference Matters**:
  - 124-137줄의 pending 카드 actions 영역: 동일한 구조(res-card__actions + res-card__btn)를 approved 카드에 복제
  - handleComplete 함수: 이미 store invalidate + 목록 재조회 로직이 포함되어 있어 호출만 하면 완성

  **Acceptance Criteria**:
  - [ ] 승인된 예약 카드에 '완료' 버튼이 표시됨
  - [ ] 버튼 클릭 시 handleComplete이 호출되어 상태가 completed로 변경됨
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 승인된 예약에서 완료 버튼 존재 확인
    Tool: Playwright
    Preconditions: 트레이너 계정으로 /dev-login 로그인, 승인된(approved) 예약이 1건 이상 존재
    Steps:
      1. /trainer/reservations 페이지로 이동
      2. '승인됨' 필터 칩 클릭 (.reservation__chip:nth-child(3))
      3. .res-card--approved .res-card__actions 영역에 '완료' 텍스트가 포함된 버튼 존재 확인
    Expected Result: 승인된 예약 카드에 '완료' 버튼이 보임
    Failure Indicators: .res-card__actions 영역이 없거나 '완료' 버튼이 없음
    Evidence: .sisyphus/evidence/task-2-complete-btn-visible.png

  Scenario: 완료 버튼이 없는 대기중 예약
    Tool: Playwright
    Preconditions: 대기중(pending) 예약이 1건 이상 존재
    Steps:
      1. /trainer/reservations 페이지로 이동
      2. '대기중' 필터 칩 클릭
      3. .res-card (not .res-card--approved) 카드에 '완료' 버튼이 없는지 확인
    Expected Result: 대기중 카드에는 '승인'과 '거절'만 표시, '완료' 없음
    Failure Indicators: 대기중 카드에 '완료' 버튼이 나타남
    Evidence: .sisyphus/evidence/task-2-pending-no-complete.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(ux): add logout confirm, reservation complete button, memo delete dialog`
  - Files: `src/views/trainer/ReservationManageView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 3. 메모 삭제 확인 다이얼로그 추가

  **What to do**:
  - `TrainerMemberDetailView.vue`의 메모 카드에 삭제 버튼(아이콘)을 추가한다
  - 삭제 버튼 클릭 시 `AppBottomSheet`를 통한 확인 다이얼로그를 표시한다
  - 확인 시 기존 `deleteMemo(memoId)` composable 함수를 호출한다
  - AppBottomSheet 패턴은 같은 파일 내 기존 연결해제 확인(202-208줄)과 동일하게 구현한다
  - 메모 카드 상단(memo-card__top) 영역의 시간 옆에 삭제 아이콘(쓰레기통 SVG) 배치

  **Must NOT do**:
  - 확인 전용 composable 생성 금지
  - browser confirm() 대신 AppBottomSheet 사용 (파괴적 동작이므로)
  - 메모 편집 기능은 이 태스크에서 추가하지 않음 (Task 8에서 처리)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 템플릿+스크립트 변경만, 새 파일 없음
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 8 (삭제 확인 패턴 참조)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberDetailView.vue:202-208` — 기존 AppBottomSheet 확인 다이얼로그 (연결해제)
  - `src/views/trainer/TrainerMemberDetailView.vue:165-186` — 메모 카드 템플릿 구조 (삭제 버튼 삽입 위치)

  **API/Type References**:
  - `src/composables/useMemos.js:deleteMemo()` — 이미 구현된 메모 삭제 함수

  **Target File**:
  - `src/views/trainer/TrainerMemberDetailView.vue` — 템플릿(메모 카드) + 스크립트(상태 ref + 핸들러)

  **WHY Each Reference Matters**:
  - 202-208줄 연결해제 BottomSheet: 동일 파일 내에서 v-model + title + actions 패턴을 복사하여 일관성 유지
  - deleteMemo composable: useMemos()에서 이미 destructure하고 있으므로 추가 import 불필요 — 현재 225줄에서 `fetchMemos`만 사용 중이므로 `deleteMemo`를 destructure에 추가 필요

  **Acceptance Criteria**:
  - [ ] 메모 카드에 삭제 아이콘이 표시됨
  - [ ] 삭제 아이콘 클릭 시 AppBottomSheet 확인 다이얼로그가 표시됨
  - [ ] 확인 클릭 시 메모가 삭제되고 목록에서 제거됨
  - [ ] 취소 클릭 시 다이얼로그만 닫히고 메모는 유지됨
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 메모 삭제 확인 후 삭제
    Tool: Playwright
    Preconditions: 트레이너 로그인, 회원 상세에 메모 1건 이상 존재
    Steps:
      1. /trainer/members/:id 페이지로 이동 (실제 회원 ID 사용)
      2. 메모 카드의 삭제 아이콘 클릭
      3. AppBottomSheet가 표시되는지 확인 (title: '메모 삭제' 텍스트 확인)
      4. '확인' 버튼 클릭
      5. 메모 목록에서 해당 메모가 사라졌는지 확인
    Expected Result: 메모가 목록에서 제거됨
    Failure Indicators: 메모가 여전히 목록에 남아있거나 에러 발생
    Evidence: .sisyphus/evidence/task-3-memo-delete-confirm.png

  Scenario: 메모 삭제 취소
    Tool: Playwright
    Preconditions: 트레이너 로그인, 회원 상세에 메모 1건 이상 존재
    Steps:
      1. /trainer/members/:id 페이지로 이동
      2. 메모 삭제 전 메모 개수 기록
      3. 메모 카드의 삭제 아이콘 클릭
      4. AppBottomSheet에서 '취소' 버튼 클릭
      5. 메모 개수가 동일한지 확인
    Expected Result: 메모가 삭제되지 않고 유지됨
    Failure Indicators: 메모 개수가 변경됨
    Evidence: .sisyphus/evidence/task-3-memo-delete-cancel.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(ux): add logout confirm, reservation complete button, memo delete dialog`
  - Files: `src/views/trainer/TrainerMemberDetailView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 4. 트레이너 승인된 예약 취소 기능

  **What to do**:
  - `ReservationManageView.vue`의 승인된 예약 카드에 '취소' 버튼을 추가한다
  - 취소 버튼 클릭 시 AppBottomSheet 확인 다이얼로그를 표시한다 (거절 다이얼로그 패턴 참조)
  - 확인 시 `updateReservationStatus(item.id, 'cancelled')` 호출
  - 취소 사유 입력은 선택사항 (textarea 포함)
  - 취소 버튼 스타일: `res-card__btn--reject` 클래스 패턴 활용 (빨간색 계열)
  - 스크립트에 showCancelDialog, cancelTarget, cancelReason ref 추가
  - confirmCancel 함수 추가 (confirmReject 패턴 복사)

  **Must NOT do**:
  - 대기중(pending) 예약에는 취소 버튼 추가 금지 — 거절로 처리
  - useReservations composable 수정 금지 — updateReservationStatus가 이미 범용으로 동작

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 거절 패턴을 복제하여 취소로 적용하는 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/ReservationManageView.vue:5-23` — 거절 확인 AppBottomSheet 다이얼로그 패턴 (동일 구조로 취소 다이얼로그 생성)
  - `src/views/trainer/ReservationManageView.vue:264-284` — showRejectDialog, rejectTarget, confirmReject 스크립트 패턴

  **API/Type References**:
  - `src/composables/useReservations.js:updateReservationStatus()` — status를 'cancelled'로 변경 (이미 범용 함수)

  **Target File**:
  - `src/views/trainer/ReservationManageView.vue` — 템플릿(승인 카드에 취소 버튼 + 바텀시트) + 스크립트(상태 ref + 핸들러)

  **WHY Each Reference Matters**:
  - 5-23줄 거절 다이얼로그: 동일 구조(AppBottomSheet + textarea + 확인/취소 버튼)를 복사하여 '취소 확인'으로 변경
  - 264-284줄 스크립트: ref 이름만 바꿔서 (reject→cancel) 동일 로직 적용

  **Acceptance Criteria**:
  - [ ] 승인된 예약 카드에 '취소' 버튼이 표시됨
  - [ ] 버튼 클릭 시 취소 확인 AppBottomSheet가 표시됨
  - [ ] 확인 시 예약 상태가 cancelled로 변경됨
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 승인된 예약 취소 확인 다이얼로그
    Tool: Playwright
    Preconditions: 트레이너 로그인, 승인된(approved) 예약 1건 이상 존재
    Steps:
      1. /trainer/reservations 페이지로 이동
      2. '승인됨' 필터 칩 클릭
      3. 승인된 예약 카드의 '취소' 버튼 클릭
      4. AppBottomSheet가 표시되는지 확인 (title에 '취소' 텍스트)
      5. 취소 사유 입력란(textarea)이 있는지 확인
      6. '취소' 확인 버튼 클릭
      7. 예약이 목록에서 사라지거나 상태가 변경되었는지 확인
    Expected Result: 예약 상태가 cancelled로 변경되고 승인 목록에서 제거됨
    Failure Indicators: 예약이 여전히 approved 상태로 남아있음
    Evidence: .sisyphus/evidence/task-4-cancel-approved.png

  Scenario: 취소 다이얼로그 닫기
    Tool: Playwright
    Preconditions: 취소 다이얼로그가 열린 상태
    Steps:
      1. 다이얼로그의 '취소'(닫기) 버튼 클릭
      2. 다이얼로그가 닫히고 예약이 그대로인지 확인
    Expected Result: 다이얼로그가 닫히고 예약 상태 유지
    Failure Indicators: 예약이 삭제/변경됨
    Evidence: .sisyphus/evidence/task-4-cancel-dismiss.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(ux): add auth error UI, reservation cancel, notification filter, connection notifications`
  - Files: `src/views/trainer/ReservationManageView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 5. 인증 에러 + 네트워크 에러 UI 표시

  **What to do**:
  - `AuthCallbackView.vue`에 에러 상태 UI를 추가한다:
    - `error` ref를 추가하고 handleRedirect에서 에러 발생 시 error 상태를 설정한다
    - Supabase auth 에러 (세션 없음, token 교환 실패 등)를 UI에 한국어로 표시한다
    - 에러 표시: 에러 아이콘 + 메시지 + '다시 시도' 버튼 (→ `/login`으로 이동)
    - '로그인 처리 중...' 텍스트는 loading 시에만, 에러 시에는 에러 UI를 표시
  - `LoginView.vue`에 OAuth 에러 표시를 추가한다:
    - handleKakao에서 error 발생 시 alert() 대신 인라인 에러 메시지를 표시한다
    - error ref 추가, 에러 발생 시 `error.value = '카카오 로그인에 실패했습니다. 다시 시도해주세요.'` 설정
    - 에러 메시지는 로그인 버튼 위에 표시 (빨간색 텍스트)

  **Must NOT do**:
  - 글로벌 에러 핸들러 생성 금지
  - 재시도 로직(자동 retry) 추가 금지 — 수동 '다시 시도' 버튼만
  - auth 외 composable에 에러 처리 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 2개 파일 수정 + 에러 상태 관리 + UI 추가 (quick보다 약간 복잡)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/auth/AuthCallbackView.vue:1-102` — 현재 전체 파일 (에러 처리 추가 위치 파악)
  - `src/views/login/LoginView.vue:59-71` — handleKakao 함수 (에러 표시 추가 위치)

  **API/Type References**:
  - `src/lib/supabase.js` — Supabase 클라이언트 (auth.getSession, auth.signInWithOAuth 에러 형태 확인)

  **Target Files**:
  - `src/views/auth/AuthCallbackView.vue` — 에러 상태 ref + 조건부 렌더링 (loading vs error)
  - `src/views/login/LoginView.vue` — 에러 ref + 인라인 에러 메시지 표시

  **WHY Each Reference Matters**:
  - AuthCallbackView 전체: 현재 에러를 console에만 로깅하고 UI에 미표시. '로그인 처리 중...' 텍스트를 조건부로 변경하는 구조 필요
  - LoginView handleKakao: error 객체를 받지만 console.error만 호출. error ref 추가 + 템플릿에 표시 필요

  **Acceptance Criteria**:
  - [ ] AuthCallbackView에서 인증 실패 시 에러 메시지 + '다시 시도' 버튼이 표시됨
  - [ ] LoginView에서 OAuth 에러 시 인라인 에러 메시지가 표시됨
  - [ ] '다시 시도' 버튼 클릭 시 /login으로 이동
  - [ ] 에러 메시지가 한국어로 표시됨
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: AuthCallback 에러 UI 존재 확인
    Tool: Playwright
    Preconditions: 없음 (static HTML 확인)
    Steps:
      1. AuthCallbackView.vue 소스 코드에서 에러 상태 분기 확인
      2. v-if="error" 조건부 렌더링이 존재하는지 확인
      3. '다시 시도' 버튼이 router.replace('/login') 호출하는지 확인
    Expected Result: 에러 상태에서 에러 메시지 + 다시 시도 버튼이 렌더링됨
    Failure Indicators: 에러 상태 분기가 없거나 loading만 표시됨
    Evidence: .sisyphus/evidence/task-5-auth-error-code-review.txt

  Scenario: LoginView OAuth 에러 표시
    Tool: Playwright
    Preconditions: 없음 (코드 리뷰 기반)
    Steps:
      1. LoginView.vue 소스 코드에서 error ref 존재 확인
      2. 템플릿에 v-if="error" 에러 메시지 영역이 존재하는지 확인
      3. 에러 메시지 텍스트가 한국어인지 확인
    Expected Result: error ref와 인라인 에러 표시 영역이 존재
    Failure Indicators: error 상태가 없거나 console.error만 존재
    Evidence: .sisyphus/evidence/task-5-login-error-code-review.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(ux): add auth error UI, reservation cancel, notification filter, connection notifications`
  - Files: `src/views/auth/AuthCallbackView.vue`, `src/views/login/LoginView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 6. 30일 알림 필터 확장

  **What to do**:
  - `useNotifications.js`의 `fetchNotifications()` 함수에서 7일 필터를 30일로 확장한다
  - 27번째 줄의 `7 * 24 * 60 * 60 * 1000`을 `30 * 24 * 60 * 60 * 1000`으로 변경
  - `markAllAsRead()` 함수(73줄)도 동일하게 7일→30일 변경
  - 주석의 '7일 이내'를 '30일 이내'로 수정

  **Must NOT do**:
  - DB 자동 삭제 트리거(pg_cron) 추가 금지 — 클라이언트 필터만 확장
  - 알림 삭제 기능 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2줄 수정 + 1줄 주석 변경
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Target File**:
  - `src/composables/useNotifications.js:22-42` — fetchNotifications 함수 (27번째 줄이 7일 필터)
  - `src/composables/useNotifications.js:70-88` — markAllAsRead 함수 (73번째 줄이 7일 필터)

  **WHY Each Reference Matters**:
  - 27줄: `7 * 24 * 60 * 60 * 1000` → `30 * 24 * 60 * 60 * 1000` (날짜 계산 상수)
  - 73줄: 동일한 7일 상수가 markAllAsRead에도 있어 함께 변경 필요

  **Acceptance Criteria**:
  - [ ] fetchNotifications에서 30일 이내 알림 조회
  - [ ] markAllAsRead에서 30일 이내 알림만 읽음 처리
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 30일 필터 코드 적용 확인
    Tool: Bash (grep)
    Preconditions: 없음
    Steps:
      1. grep -n '30 \* 24' src/composables/useNotifications.js
      2. fetchNotifications과 markAllAsRead 둘 다 30일로 변경되었는지 확인
      3. grep '7 \* 24' src/composables/useNotifications.js 로 7일 잔여 확인 (결과 없어야 함)
    Expected Result: '30 * 24'가 2곳에서 발견, '7 * 24'는 0건
    Failure Indicators: '7 * 24'가 여전히 존재
    Evidence: .sisyphus/evidence/task-6-notification-filter.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(ux): add auth error UI, reservation cancel, notification filter, connection notifications`
  - Files: `src/composables/useNotifications.js`
  - Pre-commit: `npm run build`

---

- [ ] 7. 검색 연결 요청/승인 시 알림 발송

  **What to do**:
  - `useTrainerSearch.js`의 `requestConnection()` 함수(95줄)에서, 연결 요청 성공 후 트레이너에게 알림을 전송한다:
    - `useNotifications`의 `createNotification`을 import하여 호출
    - userId: trainerId (알림 수신자 = 트레이너)
    - type: 'connection' (notification_type enum에 이미 존재하는지 확인 필요, 없으면 'general' 사용)
    - title: '새로운 연결 요청'
    - body: '{memberName}님이 연결을 요청했습니다.'
  - `TrainerMemberView.vue`의 `handleApprove()` 함수(307줄)에서, 승인 성공 후 회원에게 알림을 전송한다:
    - pendingRequests에서 connection을 찾아 member_id를 가져와서 알림 대상으로 사용
    - title: '연결 승인'
    - body: '트레이너 {trainerName}님이 연결을 승인했습니다.'

  **Must NOT do**:
  - notification_type enum이 DB에 없는 값을 사용하지 않음 — schema.sql에서 확인 후 적절한 type 사용
  - useNotifications composable 자체를 수정하지 않음 — 기존 createNotification 함수를 그대로 사용

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 함수에 createNotification 호출 추가만
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/composables/usePayments.js` 유사 패턴에서도 createNotification을 호출하는 곳이 있을 수 있음 — 기존 알림 생성 패턴 확인

  **API/Type References**:
  - `src/composables/useNotifications.js:99-115` — createNotification(userId, type, title, body, targetId, targetType) 함수 시그니처
  - `supabase/schema.sql` — notification_type enum 값 확인 (reservation, chat, workout, pt_count, payment, connection, manual, general 등)

  **Target Files**:
  - `src/composables/useTrainerSearch.js:95-113` — requestConnection 함수 (성공 후 알림 추가)
  - `src/views/trainer/TrainerMemberView.vue:307-319` — handleApprove 함수 (성공 후 알림 추가)

  **WHY Each Reference Matters**:
  - createNotification 시그니처: 정확한 파라미터 순서를 알아야 하므로 필수 참조
  - notification_type enum: DB에 없는 type을 사용하면 insert 실패하므로 schema.sql 확인 필수
  - requestConnection: if (err) throw err 다음에 return true 앞에 createNotification 호출 삽입
  - handleApprove: approveConnection 성공 후 createNotification 호출 삽입

  **Acceptance Criteria**:
  - [ ] requestConnection 성공 후 트레이너에게 알림이 생성됨
  - [ ] handleApprove 성공 후 회원에게 알림이 생성됨
  - [ ] 알림 type이 notification_type enum에 존재하는 값이어야 함
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 연결 요청 시 알림 생성 코드 확인
    Tool: Bash (grep)
    Preconditions: 없음
    Steps:
      1. grep -n 'createNotification' src/composables/useTrainerSearch.js
      2. requestConnection 함수 내에서 createNotification 호출이 존재하는지 확인
      3. 호출 파라미터가 올바른지 확인 (userId=trainerId, type, title, body)
    Expected Result: createNotification이 requestConnection 내에서 호출됨
    Failure Indicators: createNotification 호출이 없음
    Evidence: .sisyphus/evidence/task-7-request-notification.txt

  Scenario: 연결 승인 시 알림 생성 코드 확인
    Tool: Bash (grep)
    Preconditions: 없음
    Steps:
      1. grep -n 'createNotification' src/views/trainer/TrainerMemberView.vue
      2. handleApprove 함수 내에서 createNotification 호출이 존재하는지 확인
      3. 수신자가 member_id인지 확인
    Expected Result: createNotification이 handleApprove 내에서 호출됨
    Failure Indicators: createNotification 호출이 없음
    Evidence: .sisyphus/evidence/task-7-approve-notification.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(ux): add auth error UI, reservation cancel, notification filter, connection notifications`
  - Files: `src/composables/useTrainerSearch.js`, `src/views/trainer/TrainerMemberView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 8. 메모 수정/삭제 기능 추가

  **What to do**:
  - **composable**: `useMemos.js`에 `updateMemo(memoId, content, tags)` 함수를 추가한다:
    - createMemo 패턴을 복사하여 insert 대신 update 사용
    - `.eq('id', memoId)` + `.eq('trainer_id', auth.user.id)` 조건
    - return 패턴은 createMemo과 동일 (success boolean)
    - return 문에 updateMemo를 추가하여 export
  - **라우터**: `router/index.js`에 메모 편집 라우트를 추가한다:
    - path: `/trainer/members/:id/memo/:memoId/edit`
    - name: `trainer-memo-edit`
    - component: MemoWriteView.vue (기존 작성 뷰 재사용)
    - meta: { hideNav: true }
  - **MemoWriteView.vue**: edit mode를 추가한다:
    - `route.params.memoId` 유무로 편집/작성 모드 구분
    - 편집 모드시: onMounted에서 기존 메모를 supabase에서 fetch하여 폼에 채움 (content, tags, date, time)
    - 헤더 타이틀: '메모 수정' (편집 시) / '메모 작성' (새 로 작성 시)
    - 저장 버튼 텍스트: '메모 수정하기' (편집) / '메모 저장하기' (생성)
    - handleSave에서 모드에 따라 createMemo 또는 updateMemo 호출
    - useMemos()의 destructure에 updateMemo 추가
  - **TrainerMemberDetailView.vue**: 메모 카드에 편집 버튼을 추가한다:
    - 메모 카드의 memo-card__top 영역에 편집 아이콘(연필 SVG) 버튼 추가
    - 클릭 시 `router.push({ name: 'trainer-memo-edit', params: { id: route.params.id, memoId: memo.id } })`
    - memos 배열에 원본 memoId가 포함되어야 함 (현재 fetchMemos에서 이미 `memo.id` 매핑)

  **Must NOT do**:
  - MemoWriteView 외 별도 메모 편집 뷰 생성 금지
  - 사진 차부 편집 기능 추가 금지 (현재 사진은 로컬 미리보기만)
  - 날짜/시간 편집은 편집 모드에서 불가 — content와 tags만 수정 가능 (created_at은 DB 자동 관리)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 4개 파일 수정, composable + 라우터 + 뷰 로직 변경
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: Task 11 (테스트)
  - **Blocked By**: Task 3 (삭제 확인 패턴 참조)

  **References**:

  **Pattern References**:
  - `src/views/trainer/ManualRegisterView.vue` — edit mode via route param 패턴 (route.params.id 유무로 생성/편집 모드 구분)
  - `src/composables/useMemos.js:192-207` — createMemo 함수 (복사하여 updateMemo 생성)
  - `src/views/trainer/MemoWriteView.vue:135-231` — 전체 스크립트 (편집 모드 추가 위치)

  **API/Type References**:
  - `src/composables/useMemos.js:return 문` — updateMemo를 export에 추가해야 함

  **Target Files**:
  - `src/composables/useMemos.js` — updateMemo 함수 추가
  - `src/views/trainer/MemoWriteView.vue` — edit mode 로직 추가
  - `src/router/index.js` — memo edit 라우트 추가
  - `src/views/trainer/TrainerMemberDetailView.vue` — 편집 버튼 추가

  **WHY Each Reference Matters**:
  - ManualRegisterView: route.params.id 유무로 생성/편집 모드를 구분하는 정확한 패턴
  - createMemo 함수: insert → update로 대체, .eq('id', memoId) 조건 추가
  - MemoWriteView 스크립트: onMounted에 edit 모드 판별 + 데이터 fetch 로직 삽입

  **Acceptance Criteria**:
  - [ ] updateMemo 함수가 useMemos에 추가되고 export됨
  - [ ] memo edit 라우트가 라우터에 등록됨
  - [ ] MemoWriteView에서 edit 모드로 진입 시 기존 데이터가 폼에 채워짐
  - [ ] 편집 후 저장하면 updateMemo가 호출되고 이전 페이지로 돌아감
  - [ ] TrainerMemberDetailView 메모 카드에 편집 아이콘이 표시됨
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 메모 편집 모드 진입 후 저장
    Tool: Playwright
    Preconditions: 트레이너 로그인, 회원 상세에 메모 1건 이상 존재
    Steps:
      1. /trainer/members/:id 페이지로 이동
      2. 메모 카드의 편집 아이콘 클릭
      3. MemoWriteView로 이동되고 헤더에 '메모 수정' 텍스트 확인
      4. 기존 content가 textarea에 채워져 있는지 확인 (.memo-write__textarea)
      5. content를 수정하고 '메모 수정하기' 버튼 클릭
      6. 이전 페이지로 돌아가는지 확인
    Expected Result: 메모가 수정되고 회원 상세 페이지로 돌아감
    Failure Indicators: 에러 발생 또는 편집 데이터가 로딩되지 않음
    Evidence: .sisyphus/evidence/task-8-memo-edit-save.png

  Scenario: 새 메모 작성 모드 유지 확인
    Tool: Playwright
    Preconditions: 트레이너 로그인
    Steps:
      1. /trainer/members/:id 페이지에서 FAB 버튼(.mem-detail__fab) 클릭
      2. MemoWriteView로 이동되고 헤더에 '메모 작성' 텍스트 확인
      3. textarea가 비어있는지 확인
      4. 저장 버튼에 '메모 저장하기' 텍스트 확인
    Expected Result: 새 작성 모드로 정상 진입
    Failure Indicators: 편집 모드로 잘못 진입하거나 헤더가 '메모 수정'으로 표시
    Evidence: .sisyphus/evidence/task-8-memo-create-mode.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: add member payment view, memo edit/delete, trainer profile view`
  - Files: `src/composables/useMemos.js`, `src/views/trainer/MemoWriteView.vue`, `src/views/trainer/TrainerMemberDetailView.vue`, `src/router/index.js`
  - Pre-commit: `npm run build`

---

- [ ] 9. 회원 수납 내역 조회 뷰 신규 생성

  **What to do**:
  - **신규 뷰** `src/views/member/MemberPaymentHistoryView.vue` + `.css`를 생성한다:
    - `MemberMemoView.vue` 패턴을 복사하여 읽기전용 리스트 뷰로 구현
    - 헤더: '내 수납 내역' + 뒤로가기
    - composable: `usePayments`의 `fetchPayments` 사용 (회원 본인 ID로)
    - 수납 카드: 날짜(payment_date), 금액(amount), 메모(memo) 표시
    - 빈 상태: '수납 내역이 없습니다' + 아이콘
    - 로딩 상태: '로딩 중...' 텍스트
    - CSS: BEM 네이밍 (.member-payment-history__*), CSS custom properties 사용
  - **usePayments composable**: `fetchMemberOwnPayments()` 함수 추가:
    - auth.user.id를 member_id로 사용하여 payments 조회
    - 기존 fetchPayments를 복사하되 memberId 대신 auth.user.id 사용
  - **라우터**: `router/index.js`에 라우트 추가:
    - path: `/member/payments`
    - name: `member-payments`
    - component: MemberPaymentHistoryView
    - meta: { hideNav: true }
  - **MemberSettingsView.vue**: 설정 페이지에 '수납 내역' 매뉴 버튼 추가 (내 계정 섹션 또는 별도 섹션)

  **Must NOT do**:
  - 결제 생성/편집/삭제 기능 추가 금지 — 읽기전용 리스트만
  - 분석/차트/통계 UI 추가 금지
  - 금액 포맷팅은 단순 toLocaleString('ko-KR') 사용

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 신규 뷰 + CSS 파일 생성, 모바일 UI 레이아웃 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10)
  - **Blocks**: Task 11 (테스트)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/member/MemberMemoView.vue` — 읽기전용 회원 뷰 패턴 (헤더 + 로딩 + 빈 상태 + 목록 렌더링)
  - `src/views/member/MemberMemoView.css` — CSS 구조 참조 (BEM + custom properties)

  **API/Type References**:
  - `src/composables/usePayments.js:26-45` — fetchPayments 함수 (복사하여 fetchMemberOwnPayments 생성)
  - `supabase/schema.sql` — payments 테이블 구조 (id, trainer_id, member_id, amount, payment_date, memo, created_at)

  **Target Files (new)**:
  - `src/views/member/MemberPaymentHistoryView.vue` — 신규 뷰 파일
  - `src/views/member/MemberPaymentHistoryView.css` — 신규 CSS

  **Target Files (modify)**:
  - `src/composables/usePayments.js` — fetchMemberOwnPayments 추가
  - `src/router/index.js` — /member/payments 라우트 추가
  - `src/views/member/MemberSettingsView.vue` — '수납 내역' 매뉴 버튼 추가

  **WHY Each Reference Matters**:
  - MemberMemoView: 동일한 구조를 복사하여 일관성 유지 (헤더/로딩/빈 상태/목록)
  - fetchPayments: member_id 대신 auth.user.id를 사용하는 변형 필요
  - payments 테이블: 렌더링할 필드 확인 (amount, payment_date, memo)

  **Acceptance Criteria**:
  - [ ] MemberPaymentHistoryView.vue + .css 생성됨
  - [ ] 라우터에 /member/payments 등록됨
  - [ ] MemberSettingsView에 '수납 내역' 매뉴 버튼 추가됨
  - [ ] fetchMemberOwnPayments 함수가 usePayments에 추가됨
  - [ ] 회원 로그인 후 수납 내역 목록이 표시됨 (또는 빈 상태)
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 수납 내역 페이지 접근 및 빈 상태 확인
    Tool: Playwright
    Preconditions: 회원으로 /dev-login 로그인, 수납 내역이 없는 회원
    Steps:
      1. /member/settings 페이지로 이동
      2. '수납 내역' 메뉴 버튼 클릭
      3. /member/payments 페이지로 이동확인
      4. '수납 내역이 없습니다' 빈 상태 메시지 확인
    Expected Result: 빈 상태 UI가 정상 표시
    Failure Indicators: 404 에러 또는 페이지 로딩 실패
    Evidence: .sisyphus/evidence/task-9-payment-history-empty.png

  Scenario: 수납 내역이 있는 회원
    Tool: Playwright
    Preconditions: 수납 기록이 있는 회원으로 로그인
    Steps:
      1. /member/payments 페이지로 이동
      2. 수납 카드가 1건 이상 렌더링되는지 확인
      3. 각 카드에 날짜(payment_date), 금액(amount 표시) 확인
    Expected Result: 수납 목록이 날짜순으로 표시
    Failure Indicators: 목록이 비어있거나 데이터 누락
    Evidence: .sisyphus/evidence/task-9-payment-history-list.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: add member payment view, memo edit/delete, trainer profile view`
  - Files: `src/views/member/MemberPaymentHistoryView.vue`, `MemberPaymentHistoryView.css`, `src/composables/usePayments.js`, `src/router/index.js`, `src/views/member/MemberSettingsView.vue`
  - Pre-commit: `npm run build`

---

- [ ] 10. 트레이너 프로필 읽기전용 뷰 + 연결 회원 수

  **What to do**:
  - **신규 뷰** `src/views/trainer/TrainerProfileReadOnlyView.vue` + `.css`를 생성한다:
    - 트레이너의 프로필 정보를 읽기전용으로 표시
    - 헤더: 프로필 사진 + 이름 + 변트 (회원 수 표시)
    - 정보 섹션: 전문 분야, 자기소개, 연락처 (프로필에 있는 경우)
    - 연결 회원 수: `useMembers`의 fetchMembers로 members 조회 후 `members.value.length` 표시
    - 데이터: auth store의 profile + useMembers의 members
    - auth.profile의 name, photo_url + trainer_profiles의 specialties, bio
    - CSS: BEM 네이밍 (.trainer-profile-ro__*), CSS custom properties
    - 레이아웃: MemberMemoView 헤더 패턴 + 프로필 카드 + 정보 섹션
  - **라우터**: `router/index.js`에 라우트 추가:
    - path: `/trainer/profile-view`
    - name: `trainer-profile-view`
    - component: TrainerProfileReadOnlyView
    - meta: { hideNav: true }
  - **SettingsView.vue**: 트레이너 설정의 '내 프로필 보기' 버튼 클릭 시 이 뷰로 이동 추가 (또는 기존 profile-edit 옆에 보기 버튼 추가)

  **Must NOT do**:
  - 프로필 편집 기능 추가 금지 — 읽기전용만
  - TrainerProfileEditView를 수정하지 않음

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 신규 뷰 + CSS 파일 생성, 모바일 프로필 UI
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/member/MemberMemoView.vue` — 헤더 구조 (뒤로가기 + 타이틀)
  - `src/views/trainer/TrainerProfileEditView.vue` — 프로필 데이터 로딩 패턴 (auth store + trainer_profiles fetch)

  **API/Type References**:
  - `src/stores/auth.js` — auth.profile (name, photo_url, phone)
  - `src/composables/useMembers.js` — fetchMembers + members.value.length (연결 회원 수)
  - `supabase/schema.sql` — trainer_profiles 테이블 (specialties, bio)

  **Target Files (new)**:
  - `src/views/trainer/TrainerProfileReadOnlyView.vue` — 신규 뷰
  - `src/views/trainer/TrainerProfileReadOnlyView.css` — 신규 CSS

  **Target Files (modify)**:
  - `src/router/index.js` — trainer-profile-view 라우트 추가
  - `src/views/trainer/SettingsView.vue` — '프로필 보기' 버튼 추가 (선택)

  **WHY Each Reference Matters**:
  - TrainerProfileEditView: 동일한 데이터를 가져오는 패턴을 참조하되 편집 기능은 제외
  - useMembers: 연결된 회원 수 표시에 members.value.length 활용

  **Acceptance Criteria**:
  - [ ] TrainerProfileReadOnlyView.vue + .css 생성됨
  - [ ] 라우터에 /trainer/profile-view 등록됨
  - [ ] 프로필 정보 (이름, 사진, 전문 분야, 소개글)가 표시됨
  - [ ] 연결 회원 수가 표시됨
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 트레이너 프로필 읽기전용 뷰 표시
    Tool: Playwright
    Preconditions: 트레이너로 /dev-login 로그인
    Steps:
      1. /trainer/profile-view 페이지로 이동
      2. 프로필 이름이 표시되는지 확인
      3. 전문 분야 태그가 표시되는지 확인
      4. 연결 회원 수가 표시되는지 확인 ('회원' 또는 '명' 텍스트 포함)
      5. 편집 버튼이 없는지 확인 (읽기전용)
    Expected Result: 프로필 정보 + 회원 수가 정상 표시, 편집 버튼 없음
    Failure Indicators: 데이터 누락 또는 편집 버튼 존재
    Evidence: .sisyphus/evidence/task-10-trainer-profile-readonly.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat: add member payment view, memo edit/delete, trainer profile view`
  - Files: `src/views/trainer/TrainerProfileReadOnlyView.vue`, `.css`, `src/router/index.js`
  - Pre-commit: `npm run build`

---

- [ ] 11. Vitest 단위 테스트 추가

  **What to do**:
  - `src/composables/__tests__/useMemos.test.js` 신규 생성:
    - updateMemo 함수 테스트 (supabase mock)
    - 성공 시 true 반환 확인
    - 에러 시 error ref 설정 + false 반환 확인
    - 금액 검증 이 없으므로 단순 supabase update mock 테스트
  - `src/composables/__tests__/usePayments.test.js`에 fetchMemberOwnPayments 테스트 추가 (파일 존재 여부 확인 후 신규 생성 또는 추가):
    - auth.user.id로 member_id 조회 확인
    - 성공 시 payments ref에 데이터 설정 확인
    - 에러 시 error ref 설정 확인

  **Must NOT do**:
  - E2E 테스트 추가 금지 — 단위 테스트만
  - 기존 테스트 수정 금지 — 신규 테스트 케이스만 추가 (파일이 이미 존재하면 기존 파일에 추가, 없으면 신규 생성)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 테스트 패턴 복사 + 몇 개 테스트 작성
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential, after Tasks 8, 9)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 8 (updateMemo 함수), Task 9 (fetchMemberOwnPayments 함수)

  **References**:

  **Pattern References**:
  - `src/composables/__tests__/` — 기존 테스트 파일 패턴 (supabase mock 방식, vitest import)
  - `.sisyphus/notepads/workout-assignment/learnings.md` — 프로젝트 테스트 패턴 문서

  **API/Type References**:
  - `src/composables/useMemos.js:updateMemo()` — 테스트 대상 함수
  - `src/composables/usePayments.js:fetchMemberOwnPayments()` — 테스트 대상 함수

  **Target Files (new)**:
  - `src/composables/__tests__/useMemos.test.js` — 신규 테스트
  - `src/composables/__tests__/usePayments.test.js` — 신규 또는 기존에 추가

  **WHY Each Reference Matters**:
  - 기존 __tests__/ 파일: supabase 모킹 방식 + vitest describe/it 구조 참조
  - learnings.md: 프로젝트별 테스트 컨벤션 및 supabase mock 패턴 문서화

  **Acceptance Criteria**:
  - [ ] useMemos.test.js 생성됨
  - [ ] usePayments.test.js 생성됨 (또는 기존에 추가)
  - [ ] `npx vitest run` 전체 통과
  - [ ] updateMemo 성공/실패 테스트 포함
  - [ ] fetchMemberOwnPayments 성공/실패 테스트 포함

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: 전체 테스트 실행
    Tool: Bash
    Preconditions: 없음
    Steps:
      1. npx vitest run 실행
      2. 전체 테스트 PASS 확인
      3. 신규 테스트 파일 (useMemos.test.js, usePayments.test.js)이 포함되었는지 확인
    Expected Result: 모든 테스트 PASS, 0 failures
    Failure Indicators: 테스트 실패 또는 신규 테스트 미실행
    Evidence: .sisyphus/evidence/task-11-vitest-results.txt
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `test: add useMemos and usePayments unit tests`
  - Files: `src/composables/__tests__/useMemos.test.js`, `src/composables/__tests__/usePayments.test.js`
  - Pre-commit: `npx vitest run`

---
## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify CSS uses custom properties (no hardcoded hex). Verify BEM naming.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state via /dev-login. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (member payment history accessible from settings, memo edit flow, reservation cancel flow). Test edge cases: empty state, invalid input, network simulation. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit Message | Files | Pre-commit |
|------|---------------|-------|------------|
| 1 | `fix(ux): add logout confirm, reservation complete button, memo delete dialog` | MemberSettingsView.vue, ReservationManageView.vue, TrainerMemberDetailView.vue | `npm run build` |
| 2 | `feat(ux): add auth error UI, reservation cancel, notification filter, connection notifications` | AuthCallbackView.vue, LoginView.vue, ReservationManageView.vue, useNotifications.js, useTrainerSearch.js, TrainerMemberView.vue | `npm run build` |
| 3 | `feat: add member payment view, memo edit/delete, trainer profile view` | MemberPaymentHistoryView.vue/.css, MemoWriteView.vue, useMemos.js, TrainerProfileReadOnlyView.vue/.css, router/index.js | `npm run build` |
| 4 | `test: add useMemos and usePayments unit tests` | useMemos.test.js, usePayments.test.js | `npm test` |

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
- [ ] 11 gaps resolved (per revised list after Metis validation)
