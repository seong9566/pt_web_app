# 운동 프로그램 배정 — 구조화된 입력 + 회원 상세 뷰 + 알림

## TL;DR

> **Quick Summary**: 기존 자유 텍스트 운동 배정을 구조화된 입력 폼(운동명/세트/횟수)으로 전환하고, 회원용 운동 상세 뷰를 신규 생성하며, 트레이너↔회원 간 네비게이션을 연결하고, 운동 배정 시 인앱 알림을 발송합니다.
>
> **Deliverables**:
> - DB 스키마 변경: `workout_plans.content` TEXT → `exercises` JSONB
> - `useWorkoutPlans.js` 컴포저블: exercises 배열 처리 + 알림 발송
> - `TodayWorkoutView.vue` 리팩토링: textarea → 구조화된 운동 입력 폼
> - `MemberWorkoutDetailView.vue` 신규 생성: 회원용 운동 상세 뷰
> - 4개 뷰 네비게이션 연결 (TrainerSchedule → Workout, MemberSchedule → Detail, MemberHome → Detail, Notification → Detail)
> - Vitest 테스트 업데이트 + 신규 테스트
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Task 2 → Tasks 3/4/6 (parallel) → Task 5 → Task 7

---

## Context

### Original Request
PRD `docs/운동배정.md` 기반으로 운동 프로그램 배정 기능의 누락된 부분을 완성합니다. 기존 TodayWorkoutView(트레이너용)와 useWorkoutPlans 컴포저블은 자유 텍스트 기반으로 구현되어 있으나, 사용자 결정에 따라 구조화된 입력 폼으로 전환합니다.

### Interview Summary
**Key Discussions**:
- 운동 입력 방식: 자유 텍스트 → **구조화된 입력 폼** (운동명, 세트 수, 횟수, 메모)
- 테스트: **구현 후 Vitest 테스트 추가**
- 알림 네비게이션: workout 알림 클릭 시 **/home이 아닌 MemberWorkoutDetailView로 직접 이동**

**Research Findings**:
- `workout_plans` 테이블에 기존 데이터 0건 → 안전하게 컬럼 교체 가능
- `createNotification()` 유틸이 `useNotifications.js`에 존재하나, 아직 어디서도 호출되지 않음 → 첫 사용 사례
- `NotificationListView`에 `workout_assigned` 타입 아이콘 매핑과 `navigateByTarget` 이미 구현됨
- `goWorkout()` 함수가 `TrainerScheduleView`에 존재하나 호출되지 않으며, memberName을 전달 (memberId 필요)
- `TodayWorkoutView`는 route.query를 읽지 않음 → 자동 선택 로직 추가 필요

### Metis Review
**Identified Gaps** (addressed):
- DB 마이그레이션 전략: 데이터 0건 확인 → DROP `content` + ADD `exercises` JSONB 안전
- `createNotification` 호출 위치: 비즈니스 규칙이므로 composable 내부에서 호출
- 알림 네비게이션에 날짜 전달: `target_id` 대신 notification의 target_type + view에서 date query param 사용
- exercises 배열 유효성 검증: 최소 1개 운동 필수, 운동명 필수
- 이력 미리보기 포맷: 첫 2개 운동명 표시 (예: "스쿼트, 벤치프레스 외 1개")

---

## Work Objectives

### Core Objective
트레이너가 구조화된 운동 폼으로 회원에게 운동을 배정하고, 회원이 전용 상세 뷰에서 운동 내용을 확인할 수 있도록 하며, 배정 시 인앱 알림이 자동 발송됩니다.

### Concrete Deliverables
- DB 마이그레이션: `workout_plans` 테이블 스키마 변경
- `useWorkoutPlans.js`: exercises 배열 기반 CRUD + 알림 발송
- `TodayWorkoutView.vue` + `.css`: 구조화된 운동 입력 폼
- `MemberWorkoutDetailView.vue` + `.css`: 회원용 운동 상세 뷰 (신규)
- 4개 뷰 네비게이션 업데이트
- `useWorkoutPlans.test.js` 업데이트 + 알림 테스트

### Definition of Done
- [ ] `npm run build` 성공 (exit code 0)
- [ ] `npx vitest run` 전체 테스트 통과
- [ ] 트레이너: 구조화된 폼으로 운동 배정 → DB에 exercises JSONB 저장
- [ ] 회원: MemberWorkoutDetailView에서 배정된 운동 확인
- [ ] 배정 시 notification INSERT 확인
- [ ] 4개 네비게이션 경로 모두 정상 작동

### Must Have
- 운동 항목 동적 추가/제거 UI (최소 1개, 최대 20개)
- 운동명 필수 입력 validation
- 세트/횟수 숫자 입력 (기본값: 3세트 10회)
- UPSERT 경고 배너 유지
- 배정 이력 섹션 (exercises 포맷으로 미리보기)
- MemberWorkoutDetailView: 날짜 표시, 운동 카드 리스트, 이전/다음 화살표
- 알림 발송: `workout_assigned` 타입, 운동 요약 body

### Must NOT Have (Guardrails)
- ❌ 운동 완료/수행 결과 기록 기능 (PRD 범위 외)
- ❌ 매뉴얼에서 드래그 앤 드롭 배정 (PRD 범위 외)
- ❌ PT 히스토리 별도 뷰 (별도 기능)
- ❌ 운동 카테고리/태그 시스템
- ❌ 운동 템플릿/프리셋 저장
- ❌ 운동 순서 드래그 앤 드롭 정렬
- ❌ 운동 이미지/동영상 첨부
- ❌ 쉬는 시간/무게 추적
- ❌ 캘린더 뷰에 운동 dots 추가
- ❌ Supabase Realtime 운동 업데이트
- ❌ TypeScript 추가
- ❌ 새로운 npm 의존성 추가
- ❌ Options API 사용
- ❌ 회원 선택 / 날짜 피커 UI 구조 변경 (TodayWorkoutView의 기존 섹션 유지)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: Tests-after (구현 완료 후 테스트 추가)
- **Framework**: Vitest
- **Test files**: `src/composables/__tests__/useWorkoutPlans.test.js` 업데이트

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **DB**: Use Supabase MCP — Execute SQL queries, verify schema/data

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
└── Task 1: DB Schema Migration (no dependencies)

Wave 2 (After Wave 1 — composable update):
└── Task 2: useWorkoutPlans composable update + notification (depends: Task 1)

Wave 3 (After Wave 2 — MAX PARALLEL, 3 tasks):
├── Task 3: TodayWorkoutView restructure (depends: Task 2)
├── Task 4: MemberWorkoutDetailView NEW (depends: Task 2)
└── Task 6: Vitest updates (depends: Task 2)

Wave 4 (After Wave 3 — navigation wiring):
└── Task 5: Navigation wiring across 4 views (depends: Tasks 3, 4)

Wave FINAL (After ALL tasks):
└── Task 7: Final build + test verification (depends: all)

Wave REVIEW (After FINAL — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 3/4 → Task 5 → Task 7 → F1-F4
Parallel Speedup: ~35% faster than sequential (Wave 3 runs 3 tasks in parallel)
Max Concurrent: 3 (Wave 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2 | 1 |
| 2 | 1 | 3, 4, 5, 6 | 2 |
| 3 | 2 | 5, 7 | 3 |
| 4 | 2 | 5, 7 | 3 |
| 5 | 3, 4 | 7 | 4 |
| 6 | 2 | 7 | 3 |
| 7 | 3, 4, 5, 6 | F1-F4 | FINAL |
| F1-F4 | 7 | — | REVIEW |

### Agent Dispatch Summary

| Wave | Tasks | Categories |
|------|-------|-----------|
| 1 | 1 | Task 1 → `quick` |
| 2 | 1 | Task 2 → `unspecified-high` |
| 3 | 3 | Task 3 → `visual-engineering`, Task 4 → `visual-engineering`, Task 6 → `quick` |
| 4 | 1 | Task 5 → `unspecified-low` |
| FINAL | 1 | Task 7 → `quick` |
| REVIEW | 4 | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep` |

---

## TODOs

- [x] 1. DB 스키마 마이그레이션: `workout_plans.content` → `exercises` JSONB

  **What to do**:
  - Supabase MCP `apply_migration`으로 `workout_plans` 테이블 변경:
    1. `content TEXT NOT NULL` 컬럼 삭제 (DROP COLUMN)
    2. `exercises JSONB NOT NULL DEFAULT '[]'::jsonb` 컬럼 추가 (ADD COLUMN)
  - 기존 데이터 0건 확인됨 → 안전하게 DROP + ADD 가능
  - `supabase/schema.sql` 문서 파일도 업데이트: `content text not null` → `exercises jsonb not null default '[]'::jsonb`
  - 마이그레이션 이름: `migrate_workout_plans_to_exercises`

  **Must NOT do**:
  - 테이블 자체를 DROP/재생성하지 말 것 (다른 컬럼, 인덱스, RLS 정책 보존)
  - RLS 정책 변경하지 말 것 (JSONB 컬럼은 기존 RLS에 자동 적용)
  - UNIQUE 제약조건 변경하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단순 SQL DDL 변경 + 문서 파일 수정. 복잡한 로직 없음
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 브라우저 작업 불필요
    - `frontend-ui-ux`: UI 작업 아님

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (단독)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `supabase/schema.sql:711-727` — 현재 workout_plans 테이블 정의. `content text not null` 라인을 `exercises jsonb not null default '[]'::jsonb`로 변경

  **API/Type References**:
  - exercises JSONB 구조: `[{ "name": "스쿼트", "sets": 3, "reps": 10, "memo": "" }]`

  **WHY Each Reference Matters**:
  - `schema.sql`은 문서 역할을 하므로 실제 DB와 동기화 필수. 마이그레이션만 적용하고 schema.sql을 안 고치면 이후 작업자가 혼동

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: exercises 컬럼 존재 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workout_plans' AND column_name = 'exercises'`
      2. Assert: 결과 1행, data_type = 'jsonb'
      3. `SELECT column_name FROM information_schema.columns WHERE table_name = 'workout_plans' AND column_name = 'content'`
      4. Assert: 결과 0행 (content 컬럼 삭제됨)
    Expected Result: exercises JSONB 컬럼 존재, content 컬럼 없음
    Failure Indicators: content 컬럼이 여전히 존재하거나 exercises 컬럼이 없음
    Evidence: .sisyphus/evidence/task-1-schema-verify.txt

  Scenario: 기존 제약조건 보존 확인
    Tool: Supabase MCP (execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'workout_plans' AND constraint_type = 'UNIQUE'`
      2. Assert: UNIQUE 제약조건 존재 (trainer_id, member_id, date)
      3. `SELECT indexname FROM pg_indexes WHERE tablename = 'workout_plans'`
      4. Assert: `idx_workout_plans_member_date` 인덱스 존재
    Expected Result: UNIQUE 제약조건 + 인덱스 모두 보존
    Failure Indicators: 제약조건 또는 인덱스 누락
    Evidence: .sisyphus/evidence/task-1-constraints-verify.txt

  Scenario: JSONB INSERT 테스트
    Tool: Supabase MCP (execute_sql)
    Preconditions: exercises 컬럼 존재
    Steps:
      1. `INSERT INTO workout_plans (trainer_id, member_id, date, exercises) SELECT p1.id, p2.id, '2099-12-31', '[{"name":"test","sets":3,"reps":10,"memo":""}]'::jsonb FROM profiles p1, profiles p2 WHERE p1.role='trainer' AND p2.role='member' LIMIT 1`
      2. Assert: INSERT 성공
      3. `DELETE FROM workout_plans WHERE date = '2099-12-31'` (cleanup)
    Expected Result: JSONB 데이터 정상 INSERT/DELETE
    Failure Indicators: INSERT 에러, 데이터 타입 불일치
    Evidence: .sisyphus/evidence/task-1-insert-test.txt
  ```

  **Commit**: YES
  - Message: `chore(db): migrate workout_plans content to exercises JSONB`
  - Files: `supabase/schema.sql`
  - Pre-commit: —

- [x] 2. `useWorkoutPlans.js` 컴포저블 업데이트: exercises 배열 + 알림 발송

  **What to do**:
  - `saveWorkoutPlan(memberId, date, content)` 시그니처를 `saveWorkoutPlan(memberId, date, exercises)` 로 변경
    - `exercises`: `[{ name: string, sets: number, reps: number, memo: string }]` 배열
  - upsert payload에서 `content` → `exercises` 로 변경
  - upsert 성공 후 `select` 결과에서 plan ID를 확보:
    ```js
    const { data, error: err } = await supabase
      .from('workout_plans')
      .upsert({ trainer_id: auth.user.id, member_id: memberId, date, exercises, updated_at: new Date().toISOString() }, { onConflict: 'trainer_id,member_id,date' })
      .select('id')
      .single()
    ```
  - 알림 발송: upsert 성공 후 `createNotification` 호출
    ```js
    import { useNotifications } from '@/composables/useNotifications'
    // saveWorkoutPlan 함수 내부, upsert 성공 후:
    const { createNotification } = useNotifications()
    await createNotification(
      memberId,
      'workout_assigned',
      '오늘의 운동이 배정되었습니다',
      formatExerciseSummary(exercises),
      data.id,      // workout plan ID
      'workout'
    )
    ```
  - private helper 함수 추가: `formatExerciseSummary(exercises)`
    ```js
    function formatExerciseSummary(exercises) {
      if (!exercises || exercises.length === 0) return '운동이 배정되었습니다'
      const first = exercises[0].name
      if (exercises.length === 1) return first
      return `${first} 외 ${exercises.length - 1}개`
    }
    ```
  - `fetchWorkoutPlan`, `fetchWorkoutPlans` 는 `select('*')` 사용 중이므로 쿼리 변경 불필요 (exercises 컬럼 자동 포함)
  - `currentPlan.value` 구조가 `{ id, exercises: [...], date, ... }` 로 변경됨

  **Must NOT do**:
  - composable의 API 표면(export하는 함수/ref 이름) 변경 금지 — `saveWorkoutPlan`, `fetchWorkoutPlan` 등 이름 유지
  - `loading`/`error` ref 패턴 변경 금지
  - `deleteWorkoutPlan` 로직 변경 불필요 (ID 기반이므로 영향 없음)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: composable 로직 변경 + 다른 composable import + 알림 통합. 중간 복잡도
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 순수 JS 로직, UI 아님

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (단독)
  - **Blocks**: Tasks 3, 4, 5, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/composables/useWorkoutPlans.js:71-96` — 현재 `saveWorkoutPlan` 함수 전체. `content` → `exercises` 변경, `.select('id').single()` 체인 추가
  - `src/composables/useNotifications.js:99-115` — `createNotification(userId, type, title, body, targetId, targetType)` 정확한 시그니처와 사용 패턴. 첫 번째 인자는 **수신자** ID

  **API/Type References**:
  - exercises 배열 구조: `[{ name: string, sets: number, reps: number, memo: string }]`
  - notification_type enum: `'workout_assigned'` (supabase/schema.sql:731-736)
  - upsert onConflict: `'trainer_id,member_id,date'`

  **Test References**:
  - `src/composables/__tests__/useWorkoutPlans.test.js:64-86` — 현재 saveWorkoutPlan 테스트. `content: '스쿼트'` → `exercises: [...]` 로 변경 필요

  **External References**:
  - Supabase upsert + select 체인: `.upsert({...}).select('id').single()` 패턴으로 INSERT 후 ID 반환

  **WHY Each Reference Matters**:
  - `useNotifications.js`의 `createNotification` 은 이 프로젝트에서 처음 사용되는 사례. 정확한 시그니처 참조 필수
  - 기존 테스트 파일은 Task 6에서 업데이트하지만, composable 변경 시 호환성 인지 필요

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: exercises 배열로 운동 저장 성공
    Tool: Bash (node REPL 또는 직접 import 테스트)
    Preconditions: Task 1 DB 마이그레이션 완료, composable 업데이트 완료
    Steps:
      1. `npm run build` 실행 — composable 문법 오류 없음 확인
      2. exercises 배열 구조의 upsert payload 확인: `grep -n "exercises" src/composables/useWorkoutPlans.js`
      3. Assert: upsert에 `exercises` 필드 사용, `content` 필드 없음
    Expected Result: build 성공, exercises 필드 사용 확인
    Failure Indicators: build 에러, content 필드 잔존
    Evidence: .sisyphus/evidence/task-2-build-verify.txt

  Scenario: createNotification 호출 패턴 확인
    Tool: Bash (grep)
    Preconditions: composable 업데이트 완료
    Steps:
      1. `grep -n "createNotification" src/composables/useWorkoutPlans.js`
      2. Assert: createNotification 호출 존재, 인자 순서 확인 (memberId, 'workout_assigned', title, body, planId, 'workout')
      3. `grep -n "import.*useNotifications" src/composables/useWorkoutPlans.js`
      4. Assert: useNotifications import 존재
    Expected Result: createNotification 정상 호출, import 존재
    Failure Indicators: import 누락, 호출 누락, 잘못된 인자
    Evidence: .sisyphus/evidence/task-2-notification-verify.txt

  Scenario: formatExerciseSummary 헬퍼 존재 확인
    Tool: Bash (grep)
    Preconditions: composable 업데이트 완료
    Steps:
      1. `grep -n "formatExerciseSummary" src/composables/useWorkoutPlans.js`
      2. Assert: 함수 정의 존재
      3. Assert: export되지 않음 (private helper)
    Expected Result: 함수 존재, private
    Failure Indicators: 함수 누락
    Evidence: .sisyphus/evidence/task-2-helper-verify.txt
  ```

  **Commit**: YES
  - Message: `feat(composable): update useWorkoutPlans for exercises array + notification`
  - Files: `src/composables/useWorkoutPlans.js`
  - Pre-commit: `npm run build`

- [ ] 3. `TodayWorkoutView.vue` 리팩토링: textarea → 구조화된 운동 입력 폼

  **What to do**:
  - **운동 내용 섹션 (③)** 교체: `<textarea>` (line 76-80) → 동적 운동 항목 리스트
  - 각 운동 항목 UI:
    ```
    ┌─────────────────────────────────────┐
    │ [삭제 X]                            │
    │ 운동명: [_____________] (필수)       │
    │ 세트:   [3]    횟수: [10]           │
    │ 메모:   [_______________] (선택)     │
    └─────────────────────────────────────┘
    ```
  - 항목 아래 "운동 추가" 버튼 (`+` 아이콘 + 텍스트)
  - **상태 관리 변경**:
    - `workoutContent` ref (string) → `exercises` ref (배열): `ref([{ name: '', sets: 3, reps: 10, memo: '' }])`
    - `addExercise()`: exercises 배열에 새 항목 추가 (최대 20개)
    - `removeExercise(index)`: exercises 배열에서 항목 제거 (최소 1개 유지)
  - **기존 기능 유지**:
    - 회원 선택 (①) — 변경 없음
    - 날짜 선택 (②) — 변경 없음
    - UPSERT 경고 배너 — 유지, 단 `currentPlan.exercises` 확인으로 변경
    - 배정 이력 (④) — `plan.content.slice(0,50)` → exercises 요약으로 변경
    - 저장 버튼 — disabled 조건: `exercises 배열이 비어있거나 첫 번째 운동명이 비어있으면 disabled`
  - **`onDateChange`와 `loadPlanAndHistory` 업데이트**:
    - `workoutContent.value = currentPlan.value?.content ?? ''` → `exercises.value = currentPlan.value?.exercises ?? [{ name: '', sets: 3, reps: 10, memo: '' }]`
  - **`handleSave` 업데이트**:
    - `saveWorkoutPlan(memberId, date, workoutContent.trim())` → `saveWorkoutPlan(memberId, date, exercises.value.filter(e => e.name.trim()))`
    - 저장 전 빈 이름 운동 항목 필터링
  - **이력 미리보기 포맷**:
    - `plan.content?.slice(0,50)` → `formatHistoryPreview(plan.exercises)` — 첫 2개 운동명 + "외 N개" 형식
  - **route.query에서 자동 선택**:
    - `onMounted`에서 `route.query.memberId`가 있으면 해당 회원 자동 선택
    - `route.query.date`가 있으면 해당 날짜 자동 설정
  - **CSS 업데이트** (`TodayWorkoutView.css`):
    - `.today-workout__textarea` 스타일 제거
    - 새 스타일 추가: `.today-workout__exercise-item`, `__exercise-input`, `__exercise-row`, `__exercise-remove`, `__exercise-add`
    - BEM 네이밍, CSS 커스텀 프로퍼티 사용

  **Must NOT do**:
  - 회원 선택 드롭다운 UI 구조 변경 금지
  - 날짜 피커 UI 구조 변경 금지
  - 헤더 영역 변경 금지
  - npm 패키지 추가 금지 (순수 Vue 구현)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 폼 재구성 + CSS 작성 + 인터랙션 구현. 프론트엔드 중심 작업
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 폼 UX 디자인, 입력 필드 레이아웃, 버튼 인터랙션
  - **Skills Evaluated but Omitted**:
    - `playwright`: 이 태스크에서 QA는 빌드 확인 수준 — F3에서 전체 QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 6)
  - **Blocks**: Task 5
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/views/trainer/TodayWorkoutView.vue:76-80` — 현재 textarea 영역. 이 부분을 운동 항목 리스트로 교체
  - `src/views/trainer/TodayWorkoutView.vue:86-103` — 배정 이력 섹션. `plan.content.slice(0,50)` 를 exercises 요약으로 변경
  - `src/views/trainer/TodayWorkoutView.vue:145-200` — script setup 전체. 상태 관리와 핸들러 함수들
  - `src/views/trainer/MemoWriteView.vue` — 동적 폼 입력 패턴 참조 (트레이너 메모 작성)

  **API/Type References**:
  - `useWorkoutPlans.saveWorkoutPlan(memberId, date, exercises)` — Task 2에서 변경된 시그니처
  - exercises 배열: `[{ name: string, sets: number, reps: number, memo: string }]`

  **External References**:
  - Vue 3 `<script setup>` + `ref()` 패턴: 기존 코드와 동일

  **WHY Each Reference Matters**:
  - lines 76-80: 정확한 교체 위치. textarea를 운동 폼으로 바꿔야 함
  - lines 86-103: 이력 미리보기가 `plan.content` 를 참조하므로 `plan.exercises` 로 변경 필수
  - MemoWriteView: 이 프로젝트의 동적 입력 패턴 예시 — 같은 스타일로 구현

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 구조화된 운동 폼 렌더링
    Tool: Playwright (playwright skill)
    Preconditions: dev 서버 실행 중, 트레이너 로그인 상태
    Steps:
      1. Navigate to `/trainer/schedule/workout`
      2. Wait for member list to load (selector: `.today-workout__member-item`)
      3. Click first member
      4. Assert: 운동 항목 폼이 보임 (selector: `.today-workout__exercise-item`)
      5. Assert: 기본 1개 항목 존재, 세트 기본값 3, 횟수 기본값 10
      6. Screenshot
    Expected Result: textarea 대신 구조화된 운동 입력 폼 표시
    Failure Indicators: textarea 여전히 존재, exercise-item 셀렉터 없음
    Evidence: .sisyphus/evidence/task-3-form-render.png

  Scenario: 운동 항목 추가/제거
    Tool: Playwright (playwright skill)
    Preconditions: 회원 선택 상태
    Steps:
      1. Click "운동 추가" 버튼 (selector: `.today-workout__exercise-add`)
      2. Assert: 운동 항목 2개로 증가
      3. Click 두 번째 항목의 삭제 버튼 (selector: `.today-workout__exercise-remove`)
      4. Assert: 운동 항목 1개로 감소
      5. Try removing last item — assert: 삭제 불가 (최소 1개 유지)
    Expected Result: 추가/제거 정상 작동, 최소 1개 유지
    Failure Indicators: 추가 안 됨, 삭제 시 0개 됨
    Evidence: .sisyphus/evidence/task-3-add-remove.png

  Scenario: 빈 운동명으로 저장 불가
    Tool: Playwright (playwright skill)
    Preconditions: 회원 선택 상태
    Steps:
      1. 운동명 필드를 비워둠
      2. Assert: 저장 버튼 disabled 상태 (selector: `.today-workout__save-btn:disabled`)
      3. 운동명 입력: "스쿼트"
      4. Assert: 저장 버튼 enabled 상태
    Expected Result: 빈 운동명 시 저장 불가, 입력 시 저장 가능
    Failure Indicators: 빈 상태에서 저장 가능, 입력해도 disabled
    Evidence: .sisyphus/evidence/task-3-validation.png
  ```

  **Commit**: YES
  - Message: `feat(trainer): restructure TodayWorkoutView with exercise form`
  - Files: `src/views/trainer/TodayWorkoutView.vue`, `src/views/trainer/TodayWorkoutView.css`
  - Pre-commit: `npm run build`

- [ ] 4. `MemberWorkoutDetailView.vue` 신규 생성: 회원용 운동 상세 뷰

  **What to do**:
  - **신규 파일 생성**: `src/views/member/MemberWorkoutDetailView.vue` + `src/views/member/MemberWorkoutDetailView.css`
  - **라우트 추가** (`src/router/index.js`):
    ```js
    {
      path: '/member/workout',
      name: 'member-workout-detail',
      component: () => import('@/views/member/MemberWorkoutDetailView.vue'),
      meta: { hideNav: true },
    }
    ```
  - **레이아웃 구조**:
    ```
    ┌─────────────────────────────────────┐
    │ [← 뒤로]   오늘의 운동             │  ← 헤더
    ├─────────────────────────────────────┤
    │      ← 2026년 3월 6일 →            │  ← 날짜 + 화살표
    ├─────────────────────────────────────┤
    │ ┌─────────────────────────────────┐ │
    │ │ 스쿼트                          │ │
    │ │ 3세트 × 10회                    │ │  ← 운동 카드
    │ │ 메모: 깊게 앉기                 │ │
    │ └─────────────────────────────────┘ │
    │ ┌─────────────────────────────────┐ │
    │ │ 벤치프레스                      │ │
    │ │ 3세트 × 8회                     │ │
    │ └─────────────────────────────────┘ │
    ├─────────────────────────────────────┤
    │ (운동이 없으면 빈 상태 표시)       │
    └─────────────────────────────────────┘
    ```
  - **데이터 흐름**:
    1. `route.query.date`에서 초기 날짜 읽기 (없으면 오늘)
    2. `useWorkoutPlans().fetchWorkoutPlans(auth.user.id)`로 회원의 전체 이력 로드
    3. 이력에서 날짜 목록 추출 → 이전/다음 날짜 계산
    4. `useWorkoutPlans().fetchWorkoutPlan(auth.user.id, selectedDate)`로 선택된 날짜 운동 로드
  - **날짜 네비게이션**:
    - 좌측 화살표: 이전 운동 날짜 (이력 날짜 중 현재보다 이전)
    - 우측 화살표: 다음 운동 날짜 (이력 날짜 중 현재보다 이후)
    - 경계에서 화살표 disabled (비활성화 스타일)
  - **빈 상태**: "배정된 운동이 없습니다" + 캘린더 아이콘 (MemberHomeView 빈 상태 패턴 참조)
  - **로딩 상태**: "로딩 중..." 텍스트
  - **CSS**: BEM 네이밍 (`.workout-detail__header`, `__date-nav`, `__exercise-card`, `__empty`), 디자인 토큰 사용, 모바일 480px 레이아웃

  **Must NOT do**:
  - 운동 내용 수정/삭제 UI 추가 금지 (읽기 전용)
  - 운동 완료 체크박스 추가 금지 (PRD 범위 외)
  - 새 npm 패키지 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 신규 뷰 + CSS 전체 구현. UI/UX 디자인 결정 필요
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 카드 레이아웃, 빈 상태 디자인, 네비게이션 UX
  - **Skills Evaluated but Omitted**:
    - `playwright`: QA는 F3에서 통합 수행

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 3, 6)
  - **Blocks**: Task 5
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/views/member/ManualDetailView.vue:1-50` — 회원 상세 뷰 패턴: 헤더(뒤로 버튼 + 제목), 로딩/에러/빈 상태 분기, 메인 콘텐츠
  - `src/views/member/MemberHomeView.vue:118-147` — "오늘의 운동" 카드 빈 상태 UI 패턴 (캘린더 SVG + 텍스트)
  - `src/views/member/MemberScheduleView.vue:1-10` — 회원 뷰 기본 레이아웃 구조

  **API/Type References**:
  - `useWorkoutPlans().fetchWorkoutPlan(memberId, date)` → `currentPlan.value.exercises`
  - `useWorkoutPlans().fetchWorkoutPlans(memberId)` → `workoutPlans.value` (날짜 목록용)
  - `useAuthStore().user.id` → 현재 회원 ID
  - exercises 구조: `[{ name, sets, reps, memo }]`

  **WHY Each Reference Matters**:
  - ManualDetailView: 같은 member 도메인의 상세 뷰. 헤더/로딩/에러 패턴 그대로 따름
  - MemberHomeView 빈 상태: 동일한 디자인 언어 유지 (캘린더 아이콘 + 한국어 메시지)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: MemberWorkoutDetailView 라우트 접근
    Tool: Playwright (playwright skill)
    Preconditions: dev 서버 실행, 회원 로그인 상태
    Steps:
      1. Navigate to `/member/workout?date=2026-03-06`
      2. Wait for page load (selector: `.workout-detail`)
      3. Assert: 페이지 렌더링됨, 헤더에 "오늘의 운동" 표시
      4. Assert: 날짜 표시 영역에 "2026년 3월 6일" 포맷
      5. Screenshot
    Expected Result: 뷰 정상 렌더링, 날짜 표시
    Failure Indicators: 404, 빈 페이지, 라우트 미등록
    Evidence: .sisyphus/evidence/task-4-route-access.png

  Scenario: 운동이 없는 날짜의 빈 상태
    Tool: Playwright (playwright skill)
    Preconditions: 회원 로그인 상태
    Steps:
      1. Navigate to `/member/workout?date=2099-01-01` (운동 없는 미래 날짜)
      2. Assert: 빈 상태 표시 (selector: `.workout-detail__empty`)
      3. Assert: "배정된 운동이 없습니다" 텍스트 포함
    Expected Result: 빈 상태 UI 정상 표시
    Failure Indicators: 에러, 빈 상태 미표시
    Evidence: .sisyphus/evidence/task-4-empty-state.png

  Scenario: 날짜 네비게이션 화살표
    Tool: Playwright (playwright skill)
    Preconditions: 회원에게 2개 이상 날짜에 운동 배정된 상태
    Steps:
      1. Navigate to 첫 번째 운동 날짜
      2. Assert: 좌측 화살표 disabled (이전 없음)
      3. Click 우측 화살표
      4. Assert: 날짜 변경됨, 다음 운동 내용 표시
    Expected Result: 화살표 네비게이션 정상 작동
    Failure Indicators: 화살표 미작동, 날짜 미변경
    Evidence: .sisyphus/evidence/task-4-date-nav.png
  ```

  **Commit**: YES
  - Message: `feat(member): add MemberWorkoutDetailView`
  - Files: `src/views/member/MemberWorkoutDetailView.vue`, `src/views/member/MemberWorkoutDetailView.css`, `src/router/index.js`
  - Pre-commit: `npm run build`

- [ ] 5. 네비게이션 연결: 4개 뷰에서 운동 화면으로 이동

  **What to do**:
  5개 파일 수정:

  **(1) `src/views/trainer/TrainerScheduleView.vue`** — 카드 클릭 → 운동 배정:
  - `sessions` computed (line 432-444)에 `member_id: res.member_id` 필드 추가 (현재 reservations 데이터에서 가져옴)
    - 주의: `res.member_id`가 직접 있는지 확인. 없으면 `useReservations`의 fetchMyReservations('trainer') 반환값에서 확인 필요
  - `goWorkout(memberName)` 함수 (line 544-546) 변경:
    ```js
    function goWorkout(session) {
      router.push({
        name: 'trainer-today-workout',
        query: { memberId: session.member_id, date: selectedDateStr.value }
      })
    }
    ```
    - `selectedDateStr`을 computed로 추출 필요 (현재 sessions computed 내부에서만 사용)
  - session 카드 `<div class="scard">` (line 213-241)에 `@click="goWorkout(session)"` 추가
    - approved 상태 카드만 클릭 가능하도록 조건부 적용: `@click="session.status === 'approved' && goWorkout(session)"`
    - 클릭 가능 카드에 `cursor: pointer` CSS 추가

  **(2) `src/views/member/MemberScheduleView.vue`** — 승인/완료 카드 클릭 → 운동 상세:
  - session 카드 `<div class="scard">` (line 81-122)에 클릭 핸들러 추가:
    ```js
    @click="(session.status === 'approved' || session.status === 'completed') && goWorkoutDetail(session)"
    ```
  - 새 함수:
    ```js
    function goWorkoutDetail(session) {
      const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2,'0')}-${String(selectedDate.value).padStart(2,'0')}`
      router.push({ name: 'member-workout-detail', query: { date: dateStr } })
    }
    ```

  **(3) `src/views/member/MemberHomeView.vue`** — "오늘의 운동" 카드 클릭:
  - 운동 카드 `<div v-else class="member-home__workout-card">` (line 144)에 `@click` 추가:
    ```html
    <div v-else class="member-home__workout-card" @click="goWorkoutDetail" style="cursor: pointer;">
    ```
  - 새 함수:
    ```js
    function goWorkoutDetail() {
      const today = new Date().toISOString().split('T')[0]
      router.push({ name: 'member-workout-detail', query: { date: today } })
    }
    ```
  - 운동 내용 표시 변경: `currentPlan.content?.slice(0,100)` → exercises 배열 요약
    ```js
    // computed 또는 inline
    const workoutPreview = computed(() => {
      const ex = currentPlan.value?.exercises
      if (!ex || ex.length === 0) return ''
      const names = ex.slice(0, 2).map(e => e.name).join(', ')
      return ex.length > 2 ? `${names} 외 ${ex.length - 2}개` : names
    })
    ```
    - 템플릿에서 `{{ workoutPreview }}` 사용

  **(4) `src/views/common/NotificationListView.vue`** — workout 알림 네비게이션 변경:
  - `navigateByTarget` 함수 (line 95-105) 수정:
    - 기존: `workout: isTrainer ? '/trainer/schedule/workout' : '/home'`
    - 변경: `workout: isTrainer ? '/trainer/schedule/workout' : '/member/workout'`
    - 단, notification에서 date 정보를 전달하려면 `handleNotificationClick`도 수정:
      ```js
      async function handleNotificationClick(notification) {
        await markAsRead(notification.id)
        navigateByTarget(notification.target_type, notification)
      }

      function navigateByTarget(targetType, notification = null) {
        const isTrainer = auth.role === 'trainer'
        if (targetType === 'workout' && !isTrainer) {
          router.push({ name: 'member-workout-detail' })
          return
        }
        // ... 나머지 기존 로직 유지
      }
      ```

  **(5) `src/router/index.js`** — Task 4에서 이미 라우트 추가됨. 여기서는 확인만:
  - `member-workout-detail` 라우트 존재 확인. 없으면 추가

  **Must NOT do**:
  - 카드 레이아웃/스타일 변경 금지 (클릭 핸들러만 추가)
  - 캘린더 컴포넌트 변경 금지
  - 기존 취소 버튼 동작 변경 금지 (`@click.stop` 유지)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 여러 파일에 걸친 작은 변경. 각 파일에서 1-2개 함수 추가/수정
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 새 UI 없음, 기존 요소에 클릭 핸들러만 추가

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (단독)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerScheduleView.vue:213-241` — 트레이너 session 카드 템플릿. `@click` 추가 위치
  - `src/views/trainer/TrainerScheduleView.vue:432-444` — sessions computed. `member_id` 필드 추가 위치
  - `src/views/trainer/TrainerScheduleView.vue:544-546` — goWorkout 함수. 시그니처 변경
  - `src/views/member/MemberScheduleView.vue:81-122` — 회원 session 카드 템플릿. `@click` 추가 위치
  - `src/views/member/MemberHomeView.vue:144-146` — 운동 카드. `@click` + 내용 표시 변경
  - `src/views/common/NotificationListView.vue:90-105` — handleNotificationClick + navigateByTarget. workout 경로 변경

  **API/Type References**:
  - `router.push({ name: 'member-workout-detail', query: { date } })`
  - `router.push({ name: 'trainer-today-workout', query: { memberId, date } })`

  **WHY Each Reference Matters**:
  - TrainerScheduleView line 432-444: sessions computed에 `member_id` 가 없으면 goWorkout에서 전달 불가
  - MemberHomeView line 144: exercises 기반 미리보기로 변경 필수 (Task 2에서 DB 구조 변경됨)
  - NotificationListView line 100: `/home` → `/member/workout` 변경이 핵심

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: TrainerScheduleView 카드 클릭 → TodayWorkoutView
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 로그인, 승인된 예약 존재
    Steps:
      1. Navigate to `/trainer/schedule`
      2. Select date with approved reservation
      3. Click approved session card
      4. Assert: `/trainer/schedule/workout` 페이지로 이동
      5. Assert: URL에 memberId query param 존재
    Expected Result: 카드 클릭 시 운동 배정 페이지로 이동
    Failure Indicators: 클릭 미반응, 잘못된 페이지 이동
    Evidence: .sisyphus/evidence/task-5-trainer-nav.png

  Scenario: MemberHomeView 운동 카드 클릭
    Tool: Playwright (playwright skill)
    Preconditions: 회원 로그인, 오늘 운동 배정됨
    Steps:
      1. Navigate to `/home`
      2. Assert: 운동 카드에 exercises 요약 표시 (content 아님)
      3. Click 운동 카드
      4. Assert: `/member/workout` 페이지로 이동
    Expected Result: 카드 클릭 → 상세 뷰 이동
    Failure Indicators: 클릭 미반응, content 텍스트 표시
    Evidence: .sisyphus/evidence/task-5-member-home-nav.png

  Scenario: NotificationListView workout 알림 클릭
    Tool: Bash (grep)
    Preconditions: 코드 변경 완료
    Steps:
      1. `grep -A3 "workout:" src/views/common/NotificationListView.vue`
      2. Assert: member 경로가 `/member/workout` 또는 `member-workout-detail`
      3. Assert: `/home` 으로의 매핑 제거됨
    Expected Result: workout 알림이 상세 뷰로 라우팅
    Failure Indicators: 여전히 /home 으로 라우팅
    Evidence: .sisyphus/evidence/task-5-notification-nav.txt
  ```

  **Commit**: YES
  - Message: `feat(nav): wire workout navigation across views`
  - Files: `src/views/trainer/TrainerScheduleView.vue`, `src/views/member/MemberScheduleView.vue`, `src/views/member/MemberHomeView.vue`, `src/views/common/NotificationListView.vue`, `src/router/index.js`
  - Pre-commit: `npm run build`

- [ ] 6. Vitest 테스트 업데이트: exercises 구조 + 알림 호출 검증

  **What to do**:
  - `src/composables/__tests__/useWorkoutPlans.test.js` 전체 업데이트:

  **(1) 기존 테스트 수정**:
  - `fetchWorkoutPlan` 테스트 (line 40-51): mock data의 `content: '스쿼트 3세트'` → `exercises: [{ name: '스쿼트', sets: 3, reps: 10, memo: '' }]`
  - `saveWorkoutPlan` 테스트 (line 64-86):
    - 호출: `saveWorkoutPlan('member-1', '2026-03-01', '스쿼트')` → `saveWorkoutPlan('member-1', '2026-03-01', [{ name: '스쿼트', sets: 3, reps: 10, memo: '' }])`
    - assert: upsert payload에 `exercises` 필드 확인, `content` 없음
    - upsert mock에 `.select().single()` 체인 반환 추가: `{ data: { id: 'wp1' }, error: null }`
  - `saveWorkoutPlan 오류` 테스트 (line 88-98): 동일한 exercises 배열로 변경
  - `deleteWorkoutPlan` 테스트 (line 100-111): 변경 불필요 (ID 기반)

  **(2) 신규 테스트 추가**:
  - `saveWorkoutPlan 성공 시 createNotification을 호출한다`:
    - useNotifications mock 추가: `vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => ({ createNotification: vi.fn().mockResolvedValue() }) }))`
    - saveWorkoutPlan 호출 후 createNotification이 올바른 인자로 호출되었는지 확인
    - 인자: `(memberId, 'workout_assigned', title, body, planId, 'workout')`
  - `saveWorkoutPlan 실패 시 createNotification을 호출하지 않는다`:
    - upsert 에러 반환 → createNotification 미호출 확인

  **(3) createBuilder 업데이트**:
  - `.select` → `.single` 체인 지원 추가 (upsert → select → single 패턴)

  **Must NOT do**:
  - 다른 composable 테스트 파일 변경 금지
  - 테스트 프레임워크(Vitest) 설정 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 테스트 파일 수정 + 2개 테스트 추가. 단일 파일 작업
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 테스트 코드, UI 아님

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 3, 4)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/composables/__tests__/useWorkoutPlans.test.js:1-112` — 전체 테스트 파일. 모든 테스트가 `content` → `exercises` 로 변경 필요
  - `src/composables/__tests__/useWorkoutPlans.test.js:15-33` — createBuilder 헬퍼. `.select().single()` 체인 지원 추가 필요

  **API/Type References**:
  - `saveWorkoutPlan(memberId, date, exercises)` — Task 2에서 변경된 시그니처
  - `createNotification(userId, type, title, body, targetId, targetType)` — useNotifications 시그니처

  **Test References**:
  - `src/composables/__tests__/useWorkoutPlans.test.js:64-86` — saveWorkoutPlan 테스트 패턴. upsert mock + 성공 확인

  **WHY Each Reference Matters**:
  - 전체 테스트 파일이 `content` 필드 참조 → 모두 `exercises` 로 변경해야 테스트 통과
  - createBuilder에 select/single 체인 없으면 composable의 `.select('id').single()` 호출 시 에러

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 전체 테스트 통과
    Tool: Bash
    Preconditions: Task 2 composable 변경 완료
    Steps:
      1. `npx vitest run src/composables/__tests__/useWorkoutPlans.test.js`
      2. Assert: exit code 0
      3. Assert: 모든 테스트 pass (기존 4개 + 신규 2개 = 6개)
    Expected Result: 6 tests passed, 0 failed
    Failure Indicators: 테스트 실패, import 에러
    Evidence: .sisyphus/evidence/task-6-test-results.txt

  Scenario: notification mock 검증
    Tool: Bash
    Preconditions: 테스트 파일 업데이트 완료
    Steps:
      1. `grep -c "createNotification" src/composables/__tests__/useWorkoutPlans.test.js`
      2. Assert: 3회 이상 (mock 정의 + 호출 확인 + 미호출 확인)
    Expected Result: createNotification 테스트 존재
    Failure Indicators: createNotification 미테스트
    Evidence: .sisyphus/evidence/task-6-notification-test.txt
  ```

  **Commit**: YES
  - Message: `test(composable): update useWorkoutPlans tests for exercises + notification`
  - Files: `src/composables/__tests__/useWorkoutPlans.test.js`
  - Pre-commit: `npx vitest run`

- [ ] 7. 최종 빌드 + 테스트 검증

  **What to do**:
  - `npm run build` 실행 → clean build 확인
  - `npx vitest run` 실행 → 전체 테스트 통과 확인
  - `supabase/schema.sql` 파일에서 `exercises jsonb` 반영 확인
  - 코드에서 `currentPlan.content` 또는 `plan.content` 잔존 참조 없는지 검색
  - 코드에서 `workoutContent` ref 잔존 참조 없는지 검색
  - 라우트 `member-workout-detail` 정상 등록 확인

  **Must NOT do**:
  - 새로운 코드 작성 금지 (검증만)
  - 코드 변경 금지 (문제 발견 시 리포트만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 빌드/테스트 실행 + grep 검색. 단순 검증 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave FINAL (단독)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 3, 4, 5, 6

  **References**:

  **WHY Each Reference Matters**: N/A — 검증 전용 태스크

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 프로덕션 빌드 성공
    Tool: Bash
    Preconditions: 모든 구현 태스크 완료
    Steps:
      1. `npm run build`
      2. Assert: exit code 0
      3. Assert: `dist/` 디렉토리 생성
    Expected Result: 빌드 성공, 에러 0건
    Failure Indicators: 빌드 에러, 누락된 import
    Evidence: .sisyphus/evidence/task-7-build.txt

  Scenario: 전체 테스트 통과
    Tool: Bash
    Preconditions: 모든 구현 태스크 완료
    Steps:
      1. `npx vitest run`
      2. Assert: exit code 0
      3. Assert: 모든 테스트 pass
    Expected Result: 전체 테스트 통과
    Failure Indicators: 테스트 실패
    Evidence: .sisyphus/evidence/task-7-tests.txt

  Scenario: 잔존 참조 없음 확인
    Tool: Bash (grep)
    Preconditions: 모든 구현 태스크 완료
    Steps:
      1. `grep -rn "currentPlan\.content\|plan\.content" src/`
      2. Assert: 매치 0건
      3. `grep -rn "workoutContent" src/`
      4. Assert: 매치 0건
      5. `grep -rn "'content'" src/composables/useWorkoutPlans.js`
      6. Assert: 매치 0건
    Expected Result: 레거시 참조 완전 제거
    Failure Indicators: content 관련 참조 잔존
    Evidence: .sisyphus/evidence/task-7-legacy-check.txt

  Scenario: schema.sql 동기화 확인
    Tool: Bash (grep)
    Preconditions: Task 1 schema.sql 수정 완료
    Steps:
      1. `grep "exercises" supabase/schema.sql`
      2. Assert: `exercises jsonb` 포함
      3. `grep "content text" supabase/schema.sql | grep workout`
      4. Assert: 매치 0건
    Expected Result: schema.sql에 exercises 반영, content 제거
    Failure Indicators: schema.sql 미동기화
    Evidence: .sisyphus/evidence/task-7-schema-sync.txt
  ```

  **Commit**: NO (검증 전용)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify BEM naming, CSS custom properties usage, no hard-coded hex colors.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (trainer assigns → member views → notification navigates). Test edge cases: empty exercises, max exercises, duplicate date assignment. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Task | Commit Message | Files | Pre-commit |
|------|---------------|-------|-----------|
| 1 | `chore(db): migrate workout_plans content to exercises JSONB` | `supabase/schema.sql` | — |
| 2 | `feat(composable): update useWorkoutPlans for exercises array + notification` | `src/composables/useWorkoutPlans.js` | `npx vitest run src/composables/__tests__/useWorkoutPlans.test.js` |
| 3 | `feat(trainer): restructure TodayWorkoutView with exercise form` | `src/views/trainer/TodayWorkoutView.vue`, `src/views/trainer/TodayWorkoutView.css` | `npm run build` |
| 4 | `feat(member): add MemberWorkoutDetailView` | `src/views/member/MemberWorkoutDetailView.vue`, `src/views/member/MemberWorkoutDetailView.css` | `npm run build` |
| 5 | `feat(nav): wire workout navigation across views` | `src/views/trainer/TrainerScheduleView.vue`, `src/views/member/MemberScheduleView.vue`, `src/views/member/MemberHomeView.vue`, `src/views/common/NotificationListView.vue`, `src/router/index.js` | `npm run build` |
| 6 | `test(composable): update useWorkoutPlans tests for exercises + notification` | `src/composables/__tests__/useWorkoutPlans.test.js` | `npx vitest run` |
| 7 | (no commit — verification only) | — | — |

---

## Success Criteria

### Verification Commands
```bash
npm run build        # Expected: exit code 0, no errors
npx vitest run       # Expected: all tests pass
```

### Final Checklist
- [ ] All "Must Have" present (구조화된 폼, UPSERT 경고, 이력, 상세 뷰, 알림, 네비게이션)
- [ ] All "Must NOT Have" absent (완료 기록, D&D, 히스토리 뷰, 카테고리, 템플릿 등)
- [ ] All tests pass
- [ ] DB 스키마 exercises JSONB 컬럼 존재
- [ ] 4개 네비게이션 경로 정상 작동
