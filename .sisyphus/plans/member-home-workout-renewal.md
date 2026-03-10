# 회원 홈 — 오늘의 운동 UI/UX 리뉴얼

## TL;DR

> **Quick Summary**: `/member/home`의 "오늘의 운동" 섹션을 텍스트 한 줄 미리보기에서 운동별 미니 카드 UI로 리뉴얼. "다음 PT 일정" 카드에서 중복되는 "배정된 운동 루틴" 영역을 제거하여 역할을 분리.
>
> **Deliverables**:
> - MemberHomeView.vue — 템플릿/스크립트 리팩토링
> - MemberHomeView.css — 새 미니 카드 CSS + 제거된 클래스 정리
>
> **Estimated Effort**: Short (2 files, 1 concern)
> **Parallel Execution**: NO — 단일 태스크
> **Critical Path**: Task 1 only

---

## Context

### Original Request
"오늘의 운동 아이템의 UI/UX를 리뉴얼 계획을 잡아줘. 다음PT일정 안에 배정된 운동 루틴과 오늘의 운동의 데이터가 겹치는 것 같으니 이 점도 고려 할 것"

### Interview Summary
**Key Discussions**:
- 데이터 중복 해결: PT카드에서 "배정된 운동 루틴" 제거, "오늘의 운동" 섹션에서만 운동 표시
- 리뉴얼 수준: 텍스트 프리뷰 → 운동별 미니 카드 (이름 + 세트×횟수 + 메모 인라인)
- 운동 4개까지 표시, 초과 시 "외 N개 더 보기" 버튼
- 메모는 카드에 인라인 표시 (회색 캡션)

**Research Findings**:
- `exercises` 데이터 모델: `{ name, sets, reps, memo }` per exercise
- TrainerHomeView에 확립된 fadeSlideUp + stagger 애니메이션 패턴 존재
- MemberWorkoutDetailView에서 `N세트 × N회` 포맷 이미 사용 중
- 디자인 토큰 완비: radius-large, shadow-card, blue-primary, blue-light 등
- `--color-gray-50`은 global.css에 **미정의** → 사용 금지

### Metis Review
**Identified Gaps** (addressed):
- **날짜 불일치 버그 발견**: `fetchNextWorkoutPlan`은 다음 예약 날짜, `goWorkoutDetail`은 오늘 날짜 사용 → 별도 후속 태스크로 분리 (이번 범위 외)
- **Dead code 정리 필요**: `nextSession.routine`, `nextSession.hasReservation`, CSS `pt-routine-*` 클래스들
- **방어적 렌더링 필요**: sets/reps가 null/0일 수 있음, memo가 빈 문자열일 수 있음
- **운동 이름 길이 제한**: 긴 이름 ellipsis 처리 필요
- **`v-else-if` 블록(line 102-104)**: 루틴 제거 시 함께 제거 필요

---

## Work Objectives

### Core Objective
"오늘의 운동" 섹션을 운동별 미니 카드 UI로 업그레이드하고, PT카드에서 중복 운동 루틴을 제거하여 데이터 표시 역할을 깔끔하게 분리한다.

### Concrete Deliverables
- `src/views/member/MemberHomeView.vue` — 템플릿 + 스크립트 변경
- `src/views/member/MemberHomeView.css` — 새 CSS 클래스 + dead CSS 정리

### Definition of Done
- [ ] PT 카드에 "배정된 운동 루틴" 영역 없음
- [ ] "오늘의 운동" 섹션에 운동별 미니 카드 표시 (이름 + 세트×횟수 + 메모)
- [ ] 운동 5개 이상일 때 4개 카드 + "외 N개 더 보기" 버튼
- [ ] Dead code (JS + CSS) 정리 완료
- [ ] `npm run build` 성공

### Must Have
- 운동별 미니 카드에 `name`, `sets × reps`, `memo` 표시
- 최대 4개 카드 + "외 N개 더 보기" (5개 이상일 때)
- 기존 상태 처리 유지: 로딩/에러/빈 상태
- 방어적 렌더링: null sets/reps, 빈 memo, 빈 exercises 배열
- 디자인 토큰만 사용 (하드코딩 금지)
- BEM 네이밍 패턴 준수
- fadeSlideUp + stagger 애니메이션 (prefers-reduced-motion 지원)
- "전체보기" / "더 보기" 클릭 시 `member-workout-detail` 라우트로 이동

### Must NOT Have (Guardrails)
- `useWorkoutPlans.js` 수정 (composable 변경 금지)
- `MemberWorkoutDetailView` 수정 (상세뷰 변경 금지)
- 트레이너뷰 수정
- DB 스키마/마이그레이션 변경
- 새로운 npm 패키지 설치
- TypeScript 파일 추가
- Options API 사용
- 하드코딩된 색상/크기 (`--color-gray-50` 포함 — 미정의 토큰)
- 운동 완료 체크 기능 (PRD 명시적 범위 외)
- 새로운 공유 컴포넌트 생성 (단일 사용처 → 인라인)
- 날짜 불일치 버그 수정 (별도 후속 태스크)
- PT 카드의 "배정된 운동 루틴" 제거 이외의 PT 카드 구조 변경
- 코드 주석 추가

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: NO — 순수 UI/템플릿/CSS 변경이므로 유닛 테스트 불필요
- **Framework**: Vitest (기존 — 이번 태스크에서는 미사용)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **Code verification**: Use Grep/ast-grep — Verify template/CSS changes

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Single task — no parallelization needed):
└── Task 1: 오늘의 운동 섹션 리뉴얼 + PT카드 루틴 제거 [visual-engineering]

Wave FINAL (After Task 1):
└── Task F1: Visual QA verification [unspecified-high + playwright]

Critical Path: Task 1 → F1
Max Concurrent: 1
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1   | None      | F1     | 1    |
| F1   | T1        | None   | FINAL |

### Agent Dispatch Summary

- **Wave 1**: 1 task — T1 → `visual-engineering` + `frontend-ui-ux` skill
- **FINAL**: 1 task — F1 → `unspecified-high` + `playwright` skill

---

## TODOs

- [x] 1. 오늘의 운동 섹션 미니 카드 리뉴얼 + PT카드 루틴 제거

  **What to do**:

  ### Part A: PT 카드에서 "배정된 운동 루틴" 제거

  1. `MemberHomeView.vue` 템플릿에서 "배정된 운동 루틴" 블록 제거:
     - Line 88 `<div v-if="nextSession.routine.length > 0" class="member-home__pt-routine">` ~ Line 101 `</div>` 제거
     - Line 102 `<div v-else-if="nextSession.hasReservation" class="member-home__pt-routine">` ~ Line 104 `</div>` 제거
     - 주의: Line 105 `</div>`는 `member-home__pt-card` 닫는 태그이므로 **유지**

  2. `nextSession` computed에서 dead 속성 제거:
     - Line 299: `const routine = currentPlan.value?.exercises?.map(e => e.name).filter(Boolean) || []` 삭제
     - Line 287: `routine: [],` (기본 반환값에서) 삭제
     - Line 294 (was 307): `routine,` 삭제
     - Line 308: `hasReservation: false,` → 유지 여부 확인 (템플릿에서 더 이상 사용 안 함 → 삭제)
     - Line 308: `hasReservation: true,` 도 삭제

  3. `MemberHomeView.css`에서 dead CSS 제거:
     - `.member-home__pt-routine` (line 234~240)
     - `.member-home__pt-routine-label` (line 242~246)
     - `.member-home__pt-routine-empty` (line 248~254)
     - `.member-home__pt-routine-list` (line 256~263)
     - `.member-home__pt-routine-item` (line 265~271)
     총 ~38줄 제거

  ### Part B: "오늘의 운동" 섹션 미니 카드로 교체

  4. 기존 "오늘의 운동" 섹션(Lines 108-132) 교체 — 새 템플릿 구조:

     ```html
     <section class="member-home__section" :style="{ '--stagger-index': 1 }">
       <div class="member-home__section-row">
         <h2 class="member-home__section-title">오늘의 운동</h2>
         <button
           v-if="displayExercises.length > 0"
           class="member-home__see-all"
           @click="goWorkoutDetail"
         >전체보기</button>
       </div>

       <!-- 로딩 상태 -->
       <div v-if="workoutLoading" class="member-home__workout-stub">
         <p class="member-home__workout-stub-text">로딩 중...</p>
       </div>

       <!-- 에러 상태 -->
       <div v-else-if="workoutError" class="member-home__workout-stub">
         <p class="member-home__workout-stub-text member-home__workout-stub-text--error">{{ workoutError }}</p>
       </div>

       <!-- 빈 상태: currentPlan 없거나 exercises 비어있음 -->
       <div v-else-if="!currentPlan || !currentPlan.exercises || currentPlan.exercises.length === 0" class="member-home__workout-stub">
         <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
           <rect x="3" y="4" width="18" height="18" rx="3" stroke="var(--color-gray-600)" stroke-width="1.6"/>
           <path d="M3 9H21" stroke="var(--color-gray-600)" stroke-width="1.6"/>
           <path d="M8 2V6M16 2V6" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
           <path d="M8 14H11" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
         </svg>
         <p class="member-home__workout-stub-text">오늘 운동 계획이 없습니다</p>
       </div>

       <!-- 운동 미니 카드 리스트 -->
       <template v-else>
         <div class="member-home__exercise-list">
           <div
             v-for="(exercise, idx) in displayExercises"
             :key="idx"
             class="member-home__exercise-card"
             :style="{ '--stagger-index': idx }"
           >
             <div class="member-home__exercise-header">
               <span class="member-home__exercise-number">{{ idx + 1 }}</span>
               <h3 class="member-home__exercise-name">{{ exercise.name }}</h3>
             </div>
             <p v-if="exercise.sets > 0 && exercise.reps > 0" class="member-home__exercise-detail">
               {{ exercise.sets }}세트 × {{ exercise.reps }}회
             </p>
             <p v-if="exercise.memo" class="member-home__exercise-memo">{{ exercise.memo }}</p>
           </div>
         </div>

         <!-- 더 보기 버튼 (5개 이상일 때) -->
         <button
           v-if="remainingExerciseCount > 0"
           class="member-home__exercise-more"
           @click="goWorkoutDetail"
         >
           외 {{ remainingExerciseCount }}개 더 보기
         </button>
       </template>
     </section>
     ```

  5. JS computed 교체 — `workoutPreview` 제거, 새 computed 추가:

     ```js
     // 삭제: workoutPreview computed (기존 Lines 339-344)

     // 추가:
     const displayExercises = computed(() => {
       const ex = currentPlan.value?.exercises
       if (!ex || ex.length === 0) return []
       return ex.slice(0, 4)
     })

     const remainingExerciseCount = computed(() => {
       const total = currentPlan.value?.exercises?.length || 0
       return Math.max(0, total - 4)
     })
     ```

  6. `goWorkoutDetail` 함수의 날짜를 다음 예약 날짜로 수정:
     - **주의**: 이 버그 수정은 Metis가 발견한 날짜 불일치 문제임.
       현재 `goWorkoutDetail`은 오늘 날짜를 사용하지만, 표시되는 운동은 다음 예약 날짜의 것임.
     - 하지만 이 태스크의 범위는 UI 리뉴얼이므로, **기존 동작 유지** (날짜 버그는 별도 후속으로 분리)

  ### Part C: 새 CSS 추가

  7. `MemberHomeView.css`에 새 클래스 추가 (기존 패턴 준수):

     ```css
     .member-home__exercise-list {
       display: flex;
       flex-direction: column;
       gap: 10px;
     }

     .member-home__exercise-card {
       display: flex;
       flex-direction: column;
       gap: 4px;
       padding: 14px 16px;
       background-color: var(--color-white);
       border-radius: var(--radius-medium);
       box-shadow: var(--shadow-card);
       animation: fadeSlideUp var(--animation-duration-normal) var(--animation-easing-decelerate) both;
       animation-delay: calc(var(--stagger-index) * var(--animation-stagger-delay));
     }

     .member-home__exercise-header {
       display: flex;
       align-items: center;
       gap: 10px;
     }

     .member-home__exercise-number {
       width: 24px;
       height: 24px;
       border-radius: 50%;
       background-color: var(--color-blue-light);
       color: var(--color-blue-primary);
       font-size: var(--fs-caption);
       font-weight: var(--fw-body1-bold);
       display: flex;
       align-items: center;
       justify-content: center;
       flex-shrink: 0;
     }

     .member-home__exercise-name {
       font-size: var(--fs-body2);
       font-weight: var(--fw-body1-bold);
       color: var(--color-gray-900);
       margin: 0;
       overflow: hidden;
       text-overflow: ellipsis;
       white-space: nowrap;
     }

     .member-home__exercise-detail {
       font-size: var(--fs-caption);
       font-weight: var(--fw-body1-bold);
       color: var(--color-blue-primary);
       margin: 0;
       padding-left: 34px;
     }

     .member-home__exercise-memo {
       font-size: var(--fs-caption);
       color: var(--color-gray-600);
       margin: 0;
       padding-left: 34px;
       overflow: hidden;
       text-overflow: ellipsis;
       white-space: nowrap;
     }

     .member-home__exercise-more {
       width: 100%;
       padding: 12px;
       background-color: var(--color-gray-100);
       border: 1px solid var(--color-gray-200);
       border-radius: var(--radius-medium);
       font-size: var(--fs-body2);
       font-weight: var(--fw-body1-bold);
       color: var(--color-blue-primary);
       cursor: pointer;
       text-align: center;
       transition: background-color var(--animation-duration-fast) var(--animation-easing-default);
     }

     .member-home__exercise-more:active {
       background-color: var(--color-blue-light);
     }
     ```

  8. `@media (prefers-reduced-motion: reduce)` 블록에 새 클래스 추가:
     ```css
     .member-home__section,
     .member-home__unconnected,
     .member-home__exercise-card {   /* ← 추가 */
       animation: none;
     }
     ```

  **Must NOT do**:
  - `useWorkoutPlans.js` 수정
  - `MemberWorkoutDetailView` 수정
  - 새 컴포넌트 파일 생성
  - `--color-gray-50` 사용 (미정의 토큰)
  - 하드코딩 색상/크기
  - 운동 완료 체크 기능 추가
  - 날짜 불일치 버그 수정 (기존 `goWorkoutDetail` 동작 유지)
  - 코드 주석 추가

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 순수 UI 템플릿 + CSS 변경. 비주얼 중심 태스크.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: BEM CSS, 반응형 카드 레이아웃, 애니메이션 패턴 전문
  - **Skills Evaluated but Omitted**:
    - `playwright`: 이 태스크는 구현 태스크. QA는 별도 F1에서 수행.

  **Parallelization**:
  - **Can Run In Parallel**: NO (단일 태스크)
  - **Parallel Group**: Wave 1 (단독)
  - **Blocks**: F1 (최종 검증)
  - **Blocked By**: None

  **References** (CRITICAL):

  **Pattern References** (existing code to follow):
  - `src/views/member/MemberHomeView.vue:88-105` — 제거할 "배정된 운동 루틴" 블록. PT카드 닫는 `</div>` (line 105) 유지 확인
  - `src/views/member/MemberHomeView.vue:108-132` — 교체할 "오늘의 운동" 전체 섹션
  - `src/views/member/MemberHomeView.vue:339-344` — 제거할 `workoutPreview` computed
  - `src/views/member/MemberHomeView.vue:299` — 제거할 `nextSession.routine` 속성
  - `src/views/member/MemberHomeView.vue:55-106` — PT 카드 전체 구조 (어디까지 제거하고 어디를 유지할지 맥락 파악용)
  - `src/views/member/MemberHomeView.css:234-271` — 제거할 `pt-routine-*` CSS 클래스들
  - `src/views/member/MemberHomeView.css:114-117` — `fadeSlideUp` + `--stagger-index` 애니메이션 패턴 (새 카드에 복제)
  - `src/views/member/MemberHomeView.css:492-497` — `prefers-reduced-motion` 블록 (새 클래스 추가할 위치)

  **API/Type References**:
  - `src/composables/useWorkoutPlans.js:18` — `currentPlan` ref 정의
  - `src/composables/useWorkoutPlans.js:22-23` — `loading`, `error` ref 정의
  - `src/composables/useWorkoutPlans.js:30-49` — `fetchWorkoutPlan` 함수 (데이터 형태 파악)

  **Existing Format References** (세트×횟수 표시 포맷):
  - `src/views/member/MemberWorkoutDetailView.vue:77` — `{{ exercise.sets }}세트 × {{ exercise.reps }}회` 포맷
  - `src/views/member/MemberWorkoutDetailView.css:134-161` — exercise-card 스타일 참고 (비슷한 패턴이지만 더 큰 카드)

  **Design Token References**:
  - `src/assets/css/global.css` — 모든 CSS 변수 정의 (`--color-*`, `--fs-*`, `--radius-*`, `--animation-*`)
  - 주의: `--color-gray-50`은 **미정의** → 사용 금지

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 코드 검증 — PT 루틴 제거 확인
    Tool: Bash (grep)
    Preconditions: Task 1 완료
    Steps:
      1. grep -c "pt-routine" src/views/member/MemberHomeView.vue
      2. grep -c "pt-routine" src/views/member/MemberHomeView.css
      3. grep -c "workoutPreview" src/views/member/MemberHomeView.vue
    Expected Result: 세 명령 모두 출력 0
    Failure Indicators: 출력이 1 이상이면 dead code 남아있음
    Evidence: .sisyphus/evidence/task-1-dead-code-check.txt

  Scenario: 코드 검증 — 새 미니 카드 존재 확인
    Tool: Bash (grep)
    Preconditions: Task 1 완료
    Steps:
      1. grep -c "exercise-card" src/views/member/MemberHomeView.vue
      2. grep -c "exercise-card" src/views/member/MemberHomeView.css
      3. grep -c "exercise-more" src/views/member/MemberHomeView.vue
      4. grep -c "displayExercises" src/views/member/MemberHomeView.vue
    Expected Result: 모든 명령 출력 1 이상
    Failure Indicators: 0이면 새 UI가 추가되지 않음
    Evidence: .sisyphus/evidence/task-1-new-ui-check.txt

  Scenario: 코드 검증 — 금지된 토큰 미사용
    Tool: Bash (grep)
    Preconditions: Task 1 완료
    Steps:
      1. grep -c "color-gray-50" src/views/member/MemberHomeView.css
    Expected Result: 기존값 이하 (새로 추가하지 않았음을 확인)
    Failure Indicators: 카운트 증가
    Evidence: .sisyphus/evidence/task-1-forbidden-token-check.txt

  Scenario: 빌드 성공 확인
    Tool: Bash
    Preconditions: Task 1 완료
    Steps:
      1. npm run build
    Expected Result: Exit code 0, dist/ 폴더 생성
    Failure Indicators: Build error, 컴파일 실패
    Evidence: .sisyphus/evidence/task-1-build-result.txt
  ```

  **Evidence to Capture:**
  - [ ] task-1-dead-code-check.txt
  - [ ] task-1-new-ui-check.txt
  - [ ] task-1-forbidden-token-check.txt
  - [ ] task-1-build-result.txt

  **Commit**: YES
  - Message: `refactor(member-home): 오늘의 운동 미니카드 UI로 변경 및 PT카드 루틴 중복 제거`
  - Files: `src/views/member/MemberHomeView.vue`, `src/views/member/MemberHomeView.css`
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

- [x] F1. **Visual QA + Code Quality** — `unspecified-high` + `playwright` skill

  **What to do**:
  1. 브라우저에서 `/member/home` 페이지를 열어 시각적 검증 수행
  2. 4가지 상태 모두 확인: 로딩, 에러, 빈 상태, 운동 있는 상태
  3. 미니 카드에 운동 이름 + 세트×횟수 + 메모가 올바르게 표시되는지 확인
  4. "더 보기" 버튼 클릭 시 상세뷰로 이동하는지 확인
  5. PT 카드에 "배정된 운동 루틴" 영역이 없는지 확인
  6. `tsc --noEmit` 또는 lint 검사 (해당되면)
  7. dead code 최종 확인 (grep)

  **QA Scenarios:**

  ```
  Scenario: 회원 홈 — 운동 미니 카드 표시 확인
    Tool: Playwright (playwright skill)
    Preconditions: 인증된 회원 계정, 트레이너 연결됨, 운동 계획 배정됨
    Steps:
      1. http://localhost:5174/member/home 으로 이동
      2. ".member-home__pt-routine" 셀렉터 존재 여부 확인
      3. ".member-home__exercise-card" 셀렉터 존재 여부 확인
      4. 첫 번째 exercise-card 안에서 텍스트 확인 (/\d+세트.*\d+회/ 패턴)
      5. 스크린샷 캡처
    Expected Result:
      - ".member-home__pt-routine" 요소 0개
      - ".member-home__exercise-card" 요소 1개 이상
      - 세트×횟수 텍스트 매칭
    Failure Indicators: pt-routine 요소 존재, exercise-card 없음
    Evidence: .sisyphus/evidence/f1-member-home-visual.png

  Scenario: 회원 홈 — "더 보기" 버튼 동작
    Tool: Playwright (playwright skill)
    Preconditions: 5개 이상 운동이 배정된 상태
    Steps:
      1. http://localhost:5174/member/home 으로 이동
      2. ".member-home__exercise-card" 개수 확인 (최대 4개)
      3. ".member-home__exercise-more" 버튼 존재 확인
      4. 버튼 텍스트에 "외" + "더 보기" 포함 확인
      5. 버튼 클릭
      6. URL이 /member/workout 포함하는지 확인
    Expected Result:
      - exercise-card 4개 이하
      - more 버튼 존재, 클릭 시 상세뷰 이동
    Failure Indicators: 5개 이상 카드 표시, 버튼 없음, 이동 실패
    Evidence: .sisyphus/evidence/f1-more-button-test.png

  Scenario: 회원 홈 — 빈 상태 표시
    Tool: Playwright (playwright skill)
    Preconditions: 운동 계획이 배정되지 않은 회원
    Steps:
      1. http://localhost:5174/member/home 으로 이동
      2. ".member-home__workout-stub" 존재 확인
      3. "오늘 운동 계획이 없습니다" 텍스트 확인
    Expected Result: 빈 상태 UI 정상 표시
    Evidence: .sisyphus/evidence/f1-empty-state.png
  ```

  **Evidence to Capture:**
  - [ ] f1-member-home-visual.png
  - [ ] f1-more-button-test.png
  - [ ] f1-empty-state.png

---

## Commit Strategy

| Wave | Message | Files | Pre-commit |
|------|---------|-------|------------|
| 1 | `refactor(member-home): 오늘의 운동 미니카드 UI로 변경 및 PT카드 루틴 중복 제거` | MemberHomeView.vue, MemberHomeView.css | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
grep -c "pt-routine" src/views/member/MemberHomeView.vue     # Expected: 0
grep -c "pt-routine" src/views/member/MemberHomeView.css      # Expected: 0
grep -c "workoutPreview" src/views/member/MemberHomeView.vue  # Expected: 0
grep -c "exercise-card" src/views/member/MemberHomeView.vue   # Expected: > 0
grep -c "exercise-card" src/views/member/MemberHomeView.css   # Expected: > 0
grep -c "displayExercises" src/views/member/MemberHomeView.vue # Expected: > 0
npm run build                                                   # Expected: exit 0
```

### Final Checklist
- [ ] PT 카드에 "배정된 운동 루틴" 영역 없음
- [ ] "오늘의 운동" 섹션에 운동별 미니 카드 표시
- [ ] 각 카드: 번호 + 이름 + 세트×횟수 + 메모 (해당 시)
- [ ] 4개 이하: 모두 표시, "더 보기" 없음
- [ ] 5개 이상: 4개 카드 + "외 N개 더 보기" 버튼
- [ ] 빈 상태/로딩/에러 상태 정상 동작
- [ ] fadeSlideUp 스태거 애니메이션 적용
- [ ] prefers-reduced-motion 지원
- [ ] 모든 CSS에 디자인 토큰만 사용
- [ ] BEM 네이밍 준수
- [ ] Dead code 없음 (JS + CSS)
- [ ] `npm run build` 성공

---

## Known Follow-up Tasks (OUT OF SCOPE)

1. **날짜 불일치 버그**: `goWorkoutDetail()`이 오늘 날짜를 사용하지만, `fetchNextWorkoutPlan()`은 다음 예약 날짜의 운동을 로드함. 다음 예약이 미래 날짜면 상세뷰가 빈 화면을 보여줄 수 있음.
2. **섹션 타이틀 날짜 반영**: "오늘의 운동" 대신 실제 예약 날짜를 표시 (예: "3월 12일 운동")
