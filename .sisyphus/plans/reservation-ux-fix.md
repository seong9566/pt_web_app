# 예약 충돌 에러 UX 개선 + 스케줄 캘린더 과거 날짜 회색 처리

## TL;DR

> **Quick Summary**: 예약 시간 충돌 시 영어 에러 대신 한국어 메시지 + 슬롯 자동 갱신, 회원 스케줄 캘린더에서 과거 날짜를 회색으로 표시(클릭은 유지)
> 
> **Deliverables**:
> - RPC 에러 메시지 한국어 매핑 (`useReservations.js`)
> - 예약 실패 후 슬롯 자동 새로고침 (`MemberReservationView.vue`)
> - 스케줄 캘린더 과거 날짜 회색 스타일링 (`MemberScheduleView.vue` + `.css`)
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 & Task 2 (parallel) → Final Verification

---

## Context

### Original Request
회원 예약 플로우에서 두 가지 UI/UX 이슈 수정:
1. 다른 회원이 이미 예약한(pending) 시간대에 예약 시도 시 400 Bad Request 영어 에러 발생 → 한국어 에러 + 슬롯 자동 갱신 필요
2. 회원 스케줄 캘린더(`/member/schedule`)에서 오늘 이전 날짜 + 비근무일 회색 처리 필요

### Interview Summary
**Key Discussions**:
- 과거 날짜: 회색으로 표시하되 **클릭은 가능** (과거 예약 내역 확인 용도)
- 에러 처리: 한국어 메시지 표시 + 슬롯 목록 **자동 갱신** (마감 반영)

**Research Findings**:
- DB 유니크 인덱스 `reservations_unique_active_slot`이 `(trainer_id, date, start_time) WHERE status IN ('pending', 'approved')`로 충돌 방지
- RPC `create_reservation`은 `unique_violation` 시 영어 에러 `'Reservation time slot is already booked'` 반환
- `MemberScheduleView`는 자체 커스텀 캘린더 사용 (AppCalendar 아님)
- `AppCalendar.vue`에 `isPast()` 참조 구현 존재 (line 142-145)

### Metis Review
**Identified Gaps** (addressed):
- 에러 발생 후 `selectedTime` 초기화 누락 → Task 1에 포함
- `'End time must be later than start time'` 에러 한국어 매핑 누락 → Task 1에 포함
- 과거+선택(selected) 상태 오버라이드 CSS 누락 → Task 2에 포함
- `isPast`에서 day number(1-31)를 full date string으로 변환 필요 → Task 2에 명시

---

## Work Objectives

### Core Objective
예약 시간 충돌 에러의 사용자 경험 개선 + 스케줄 캘린더의 과거 날짜 시각적 구분 추가

### Concrete Deliverables
- `src/composables/useReservations.js` — RPC 에러 한국어 매핑
- `src/views/member/MemberReservationView.vue` — 실패 후 슬롯 자동 갱신 + 시간 선택 초기화
- `src/views/member/MemberScheduleView.vue` — `isPast()` 함수 추가 + 템플릿 클래스 바인딩
- `src/views/member/MemberScheduleView.css` — `.cal-cell__num--past` 스타일

### Definition of Done
- [ ] `npm run build` 에러 없이 성공
- [ ] 에러 메시지에 영어 RPC 에러 노출 없음 (한국어만)
- [ ] 슬롯 충돌 에러 후 슬롯 UI 자동 갱신
- [ ] 스케줄 캘린더에서 과거 날짜가 회색(`--color-gray-200`)으로 표시
- [ ] 과거 날짜 클릭 시 정상 동작 (예약 내역 표시)

### Must Have
- 모든 영어 RPC 에러 메시지 한국어 매핑
- 예약 실패 후 `fetchAvailableSlots` 자동 호출
- 예약 실패 후 `selectedTime = null` 초기화
- 과거 날짜 회색 표시 + 클릭 가능 유지
- 과거+선택(selected) 상태에서 흰색 텍스트 오버라이드

### Must NOT Have (Guardrails)
- `createReservation` 함수 시그니처 변경 금지
- `AppCalendar.vue` 수정 금지 (이슈 2는 커스텀 캘린더 대상)
- `schema.sql` RPC 함수 수정 금지 (에러 매핑은 클라이언트 only)
- Toast/Snackbar 시스템 추가 금지 (기존 인라인 error-message 패턴 사용)
- 과거 날짜에 `pointer-events: none` 추가 금지 (클릭 가능 유지)
- `selectDate()` 함수 로직 변경 금지
- MemberScheduleView를 AppCalendar로 리팩터링 금지
- 에러 발생 시 애니메이션/트랜지션 추가 금지

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: None (UI/UX 변경으로 별도 유닛 테스트 불필요)
- **Framework**: Vitest (기존 테스트 회귀 확인용)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **Build**: Use Bash — `npm run build` 성공 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 파일 겹침 없음, 완전 독립):
├── Task 1: 한국어 에러 매핑 + 슬롯 자동 갱신 [quick]
└── Task 2: 스케줄 캘린더 과거 날짜 회색 처리 [quick]

Wave FINAL (After Wave 1 — 빌드 검증):
└── Task F1: 최종 빌드 + 회귀 검증 [quick]

Critical Path: Task 1 & Task 2 (parallel) → Task F1
Parallel Speedup: ~50% (두 독립 태스크 동시 실행)
Max Concurrent: 2 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1    | —         | F1     | 1    |
| 2    | —         | F1     | 1    |
| F1   | 1, 2      | —      | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **2** — T1 → `quick`, T2 → `quick`
- **Wave FINAL**: **1** — F1 → `quick`

---

## TODOs

- [x] 1. 한국어 에러 매핑 + 예약 실패 후 슬롯 자동 갱신

  **What to do**:
  1. `src/composables/useReservations.js`의 `createReservation` catch 블록(line 198-200)에 에러 매핑 오브젝트 추가:
     ```js
     const ERROR_MESSAGES = {
       'Reservation time slot is already booked': '해당 시간은 이미 예약되었습니다. 다른 시간을 선택해주세요.',
       'No active trainer-member connection': '트레이너와의 연결이 활성화되지 않았습니다.',
       'End time must be later than start time': '예약 시간이 올바르지 않습니다.',
     }
     ```
     `error.value` 할당을 매핑 룩업으로 교체: `error.value = ERROR_MESSAGES[e?.message] ?? e?.message ?? '예약 생성에 실패했습니다'`
     - 주의: `'PT 잔여 횟수가 부족합니다...'`는 이미 한국어이므로 fallback `e?.message`로 그대로 통과됨
  2. `src/views/member/MemberReservationView.vue`의 `submitReservation()` (line 321-334)에서 `createReservation` 실패 시 슬롯 자동 갱신:
     ```js
     if (result) {
       reservationsStore.invalidate()
       router.back()
     } else {
       // 슬롯 자동 갱신 — 충돌 시간 마감 반영
       selectedTime.value = null
       if (trainerId.value && selectedDate.value) {
         await fetchAvailableSlots(trainerId.value, selectedDate.value)
       }
     }
     ```
     - `isSubmitting.value = false`는 finally 블록이 아닌 기존 위치 유지 (이미 갱신 완료 후 해제되어야 함)
     - 주의: `isSubmitting` 래핑이 슬롯 갱신까지 포함하도록 `isSubmitting.value = false`를 갱신 후로 이동

  **Must NOT do**:
  - `createReservation` 함수 시그니처/리턴 타입 변경 금지
  - Toast/Snackbar 추가 금지 — 기존 인라인 error-message 사용
  - `schema.sql` RPC 함수 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 composable 에러 매핑 + 뷰 5줄 변경. 명확하고 사소한 작업
  - **Skills**: []
    - 특별한 스킬 불필요 — 순수 JS 문자열 매핑 + async 호출 추가

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task F1
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/composables/useReservations.js:180-204` — `createReservation` 함수 전체. catch 블록(198-200)에 에러 매핑 추가
  - `src/views/member/MemberReservationView.vue:321-334` — `submitReservation` 함수. result null 시 else 분기 추가
  - `src/views/member/MemberReservationView.vue:241-254` — `handleDateChange` 함수 참조. `selectedTime.value = null` + `fetchAvailableSlots` 패턴 복사

  **API/Type References**:
  - `supabase/schema.sql:1061-1125` — `create_reservation` RPC. 에러 메시지 원문 확인:
    - Line 1091: `'PT 잔여 횟수가 부족합니다. 예약이 불가능합니다.'` (이미 한국어)
    - Line 1123: `'Reservation time slot is already booked'` (영어 → 매핑 필요)
    - Line 1069: `'Authentication required'` (인증 에러 — 앱 레벨 처리)
    - Line 1072: `'End time must be later than start time'` (시간 유효성 — 매핑 필요)
    - Line 1082: `'No active trainer-member connection'` (연결 에러 — 매핑 필요)

  **WHY Each Reference Matters**:
  - `createReservation` 함수: catch 블록의 정확한 위치와 기존 에러 처리 패턴 확인
  - `submitReservation` 함수: 실패 후 else 분기 삽입 위치와 `isSubmitting` 흐름 확인
  - `handleDateChange` 함수: `selectedTime = null` + `fetchAvailableSlots` 호출 패턴 복사 대상
  - RPC 함수: 실제 throw되는 에러 메시지 원문 — 매핑 키 값으로 정확히 일치해야 함

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 에러 매핑 코드 존재 확인
    Tool: Bash (grep)
    Preconditions: Task 1 코드 변경 완료
    Steps:
      1. grep -c "이미 예약되었습니다" src/composables/useReservations.js
      2. grep -c "활성화되지 않았습니다" src/composables/useReservations.js
      3. grep -c "올바르지 않습니다" src/composables/useReservations.js
    Expected Result: 각각 1 출력
    Failure Indicators: 0 출력 → 매핑 누락
    Evidence: .sisyphus/evidence/task-1-error-mapping-grep.txt

  Scenario: 슬롯 자동 갱신 코드 존재 확인
    Tool: Bash (grep)
    Preconditions: Task 1 코드 변경 완료
    Steps:
      1. submitReservation 함수 내에서 fetchAvailableSlots 호출 존재 확인
      2. submitReservation 함수 내에서 selectedTime.value = null 존재 확인
    Expected Result: submitReservation 내에 fetchAvailableSlots, selectedTime.value = null 각각 존재
    Failure Indicators: 해당 라인 미존재
    Evidence: .sisyphus/evidence/task-1-auto-refresh-grep.txt

  Scenario: 빌드 성공 확인
    Tool: Bash
    Preconditions: 모든 코드 변경 완료
    Steps:
      1. npm run build
    Expected Result: exit code 0, "✓ built in" 메시지 출력
    Failure Indicators: exit code non-zero, 에러 메시지 존재
    Evidence: .sisyphus/evidence/task-1-build.txt
  ```

  **Commit**: YES (groups with 2)
  - Message: `fix: 예약 충돌 시 한국어 에러 메시지 + 슬롯 자동 갱신, 스케줄 캘린더 과거 날짜 회색 처리`
  - Files: `src/composables/useReservations.js`, `src/views/member/MemberReservationView.vue`, `src/views/member/MemberScheduleView.vue`, `src/views/member/MemberScheduleView.css`
  - Pre-commit: `npm run build`

---

- [x] 2. 스케줄 캘린더 과거 날짜 회색 처리

  **What to do**:
  1. `src/views/member/MemberScheduleView.vue` script 섹션에 `isPast(date)` 함수 추가 (`isNonWorkingDay` 함수 근처, line 420 이후):
     ```js
     function isPast(date) {
       const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`
       const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
       return dateStr < todayStr
     }
     ```
     - 주의: `date` 파라미터는 day number (1-31)이므로 반드시 full date string 구성 필요
     - `now`는 기존 line 316의 `const now = new Date()`를 재사용 (동일 패턴 유지)
  2. 템플릿의 `.cal-cell__num` 클래스 바인딩 (line 82-88)에 past 클래스 추가:
     기존:
     ```
     'cal-cell__num--sun': cell.isSun,
     'cal-cell__num--sat': cell.isSat,
     'cal-cell__num--off': isNonWorkingDay(cell.date),
     ```
     변경:
     ```
     'cal-cell__num--past': isPast(cell.date) && !isSelected(cell.date),
     'cal-cell__num--sun': !isPast(cell.date) && cell.isSun,
     'cal-cell__num--sat': !isPast(cell.date) && cell.isSat,
     'cal-cell__num--off': !isPast(cell.date) && isNonWorkingDay(cell.date),
     ```
     - 과거 날짜는 일요일/토요일/비근무일 색상 대신 과거 회색 적용
     - 선택(selected) 상태에서는 past 클래스 미적용 (파란 원 + 흰 텍스트 유지)
  3. `src/views/member/MemberScheduleView.css`에 `.cal-cell__num--past` 스타일 추가 (line 171 `--off` 다음):
     ```css
     .cal-cell__num--past {
       color: var(--color-gray-200);
     }
     ```
     선택 상태 오버라이드 추가 (line 178 이후):
     ```css
     .cal-cell__inner--selected .cal-cell__num--past {
       color: var(--color-white);
     }
     ```
  4. 클릭 핸들러 변경 **없음**: `@click="cell.date && selectDate(cell.date)"` 유지 — 과거 날짜도 클릭 가능

  **Must NOT do**:
  - `pointer-events: none` 또는 `cursor: default` 추가 금지
  - `AppCalendar.vue` 수정 금지
  - `selectDate()` 함수 로직 변경 금지
  - 과거+일요일에 빨간색 유지하려는 시도 금지 (과거면 일괄 회색)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 함수 1개 + 클래스 바인딩 수정 + CSS 규칙 2개. 사소하고 명확한 작업
  - **Skills**: []
    - 특별한 스킬 불필요 — 간단한 날짜 비교 + CSS 클래스

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task F1
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/member/MemberScheduleView.vue:412-420` — `isNonWorkingDay(date)` 함수. `isPast(date)` 함수 구조 동일 패턴 따르기
  - `src/views/member/MemberScheduleView.vue:422-430` — `isSelected(date)`, `isToday(date)` 함수. 날짜 비교 패턴 참조
  - `src/views/member/MemberScheduleView.vue:80-88` — 템플릿 클래스 바인딩 위치. `:class` 객체에 `isPast` 조건 추가
  - `src/components/AppCalendar.vue:142-145` — `isPast()` 참조 구현. `dateStr < todayStr` 비교 패턴 복사
  - `src/components/AppCalendar.vue:302-318` — `--past`, `--disabled` CSS 스타일링 패턴 참조

  **CSS References**:
  - `src/views/member/MemberScheduleView.css:168-178` — `--off` 클래스 + selected 오버라이드 패턴. `--past` 클래스도 동일 패턴

  **WHY Each Reference Matters**:
  - `isNonWorkingDay`: `isPast` 함수의 구조적 템플릿 — 동일한 인자(date number) + full date string 구성 패턴
  - 템플릿 클래스 바인딩: 정확한 삽입 위치 + 기존 조건들과의 우선순위 관계
  - `AppCalendar.vue isPast`: 검증된 날짜 비교 로직 — `dateStr < todayStr` 문자열 비교로 과거 판별
  - CSS `--off` 패턴: 네이밍 컨벤션 + selected 오버라이드 구조 동일하게 따르기

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: isPast 함수 존재 확인
    Tool: Bash (grep)
    Preconditions: Task 2 코드 변경 완료
    Steps:
      1. grep -c "function isPast" src/views/member/MemberScheduleView.vue
      2. grep -c "isPast(cell.date)" src/views/member/MemberScheduleView.vue
    Expected Result: 각각 1 이상 출력
    Failure Indicators: 0 출력 → 함수 또는 템플릿 바인딩 누락
    Evidence: .sisyphus/evidence/task-2-ispast-grep.txt

  Scenario: CSS 클래스 존재 확인
    Tool: Bash (grep)
    Preconditions: Task 2 코드 변경 완료
    Steps:
      1. grep -c "cal-cell__num--past" src/views/member/MemberScheduleView.css
    Expected Result: 2 이상 출력 (클래스 정의 + selected 오버라이드)
    Failure Indicators: 0 또는 1 출력
    Evidence: .sisyphus/evidence/task-2-css-grep.txt

  Scenario: pointer-events 미적용 확인
    Tool: Bash (grep)
    Preconditions: Task 2 코드 변경 완료
    Steps:
      1. grep "pointer-events" src/views/member/MemberScheduleView.css | grep -v "empty"
    Expected Result: 빈 출력 (기존 --empty에만 존재, --past에는 없음)
    Failure Indicators: past 관련 pointer-events 발견
    Evidence: .sisyphus/evidence/task-2-no-pointer-events.txt

  Scenario: 빌드 성공 확인
    Tool: Bash
    Preconditions: 모든 코드 변경 완료
    Steps:
      1. npm run build
    Expected Result: exit code 0
    Failure Indicators: exit code non-zero
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES (groups with 1)
  - Message: `fix: 예약 충돌 시 한국어 에러 메시지 + 슬롯 자동 갱신, 스케줄 캘린더 과거 날짜 회색 처리`
  - Files: `src/views/member/MemberScheduleView.vue`, `src/views/member/MemberScheduleView.css`
  - Pre-commit: `npm run build`

---

## Final Verification Wave

> 1 review agent. Task 1, 2 완료 후 실행.

- [x] F1. **빌드 + 회귀 검증** — `quick`
  `npm run build` 성공 확인. `npm test -- --run` 실행하여 기존 테스트 회귀 없음 확인. 전체 에러 매핑 grep 검증, isPast 함수 grep 검증, CSS 클래스 grep 검증 수행.
  Output: `Build [PASS/FAIL] | Tests [PASS/FAIL/SKIP] | Grep Checks [N/N pass] | VERDICT`

---

## Commit Strategy

- **1**: `fix: 예약 충돌 시 한국어 에러 메시지 + 슬롯 자동 갱신, 스케줄 캘린더 과거 날짜 회색 처리` — `src/composables/useReservations.js`, `src/views/member/MemberReservationView.vue`, `src/views/member/MemberScheduleView.vue`, `src/views/member/MemberScheduleView.css` — `npm run build`

---

## Success Criteria

### Verification Commands
```bash
npm run build                    # Expected: exit code 0, "✓ built in" message
npm test -- --run 2>/dev/null    # Expected: no regression (may have no relevant tests)

# Error mapping
grep -c "이미 예약되었습니다" src/composables/useReservations.js     # Expected: 1
grep -c "활성화되지 않았습니다" src/composables/useReservations.js   # Expected: 1
grep -c "올바르지 않습니다" src/composables/useReservations.js       # Expected: 1

# Auto-refresh
grep "fetchAvailableSlots" src/views/member/MemberReservationView.vue  # Expected: >= 3 occurrences

# Past date
grep -c "function isPast" src/views/member/MemberScheduleView.vue       # Expected: 1
grep -c "cal-cell__num--past" src/views/member/MemberScheduleView.css   # Expected: >= 2
```

### Final Checklist
- [ ] 모든 영어 RPC 에러 메시지 한국어 매핑 완료
- [ ] 예약 실패 후 슬롯 자동 갱신 + 시간 선택 초기화
- [ ] 스케줄 캘린더 과거 날짜 회색 표시 (`--color-gray-200`)
- [ ] 과거 날짜 클릭 가능 (pointer-events 제한 없음)
- [ ] 선택된 과거 날짜는 파란 원 + 흰 텍스트 유지
- [ ] `npm run build` 성공
- [ ] AppCalendar.vue 미수정
- [ ] schema.sql 미수정
