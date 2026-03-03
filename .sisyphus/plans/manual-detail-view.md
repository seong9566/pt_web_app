# 매뉴얼 상세 보기 화면 구현

## TL;DR

> **Quick Summary**: 운동 매뉴얼 카드 클릭 시 상세 정보(히어로, 메타, 운동순서, 타겟부위, 장비, 팁)를 보여주는 상세 뷰 생성. 회원/트레이너 양쪽 라우트에서 동일 컴포넌트 사용.
> 
> **Deliverables**:
> - `ManualDetailView.vue` + `ManualDetailView.css` 신규 생성
> - 라우터에 2개 상세 라우트 추가
> - MemberManualView, TrainerManualView 카드 클릭 핸들러 수정
> 
> **Estimated Effort**: Short
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 (뷰+CSS) → Task 2 (라우터) → Task 3 (핸들러 수정)

---

## Context

### Original Request
"매뉴얼 상세 보기 화면 구성 해줘"

### Interview Summary
**Key Discussions**:
- 회원/트레이너 모두 동일한 상세 뷰 사용
- 상세 뷰는 읽기 전용 (편집/삭제 없음)
- 히어로 그라디언트 + 메타 정보 + 운동 순서 + 타겟 부위 + 장비 + 팁 섹션

**Research Findings**:
- 기존 상세 뷰 패턴: `TrainerMemberDetailView.vue` — 헤더(뒤로/제목/액션), 바디 섹션, `router.back()`
- 매뉴얼 목록 mock 데이터: 8개 항목, 필드: `id, title, category, duration, unit, difficulty, gradient`
- `ManualRegisterView`에 `description, categories[], youtubeUrl` 필드 존재 — 향후 정합 가능

### Metis Review
**Identified Gaps** (addressed):
- `route.params.id`는 항상 string → `Number()` 변환 필수
- ID가 유효하지 않을 때(1-8 외) fallback 처리 필요
- 라우트명 미지정 → `member-manual-detail`, `trainer-manual-detail`로 확정
- BEM 블록명 → `manual-detail`로 확정
- `hideNav: true` 양쪽 라우트 모두 적용 (기존 `/member/reservation` 선례)

---

## Work Objectives

### Core Objective
매뉴얼 카드 클릭 시 운동 상세 정보를 보여주는 풀스크린 뷰 생성.

### Concrete Deliverables
- `src/views/member/ManualDetailView.vue` — 상세 뷰 컴포넌트
- `src/views/member/ManualDetailView.css` — 동반 CSS 파일
- `src/router/index.js` — 2개 라우트 추가
- `src/views/member/MemberManualView.vue` — handleCardClick 수정
- `src/views/trainer/TrainerManualView.vue` — handleCardClick 수정

### Definition of Done
- [ ] `npm run build` 성공 (exit 0, 에러 없음)
- [ ] 회원: `/member/manual` → 카드 클릭 → `/member/manual/:id` 이동
- [ ] 트레이너: `/trainer/settings/manual` → 카드 클릭 → `/trainer/settings/manual/:id` 이동
- [ ] 상세 뷰에서 뒤로가기 → 목록으로 복귀
- [ ] 양쪽 라우트에서 BottomNav 숨김
- [ ] `alert()` 호출 제거 (카드 클릭 시)

### Must Have
- 히어로 섹션: 그라디언트 배경 + 뒤로가기 + 카테고리 뱃지 + 제목
- 메타 바: 시간, 난이도, 세트 수
- 운동 설명 섹션
- 타겟 부위 태그
- 필요 장비 태그 (장비 있을 때만 표시)
- 운동 순서: 번호 + 제목 + 설명 + 반복 수
- 주의사항/팁 섹션
- 유효하지 않은 ID 접근 시 fallback (빈 화면 + 뒤로가기 버튼)
- 8개 매뉴얼 전체 mock 데이터

### Must NOT Have (Guardrails)
- ❌ 편집/삭제 버튼, FAB, 어떤 쓰기 기능도 없음
- ❌ YouTube 임베드나 미디어 갤러리 없음
- ❌ 공유 데이터 모듈 (`src/data/manuals.js` 등) 생성 금지 — mock 데이터 인라인 유지
- ❌ `App` 접두사 공유 컴포넌트 추출 금지 (히어로, 스텝카드 등)
- ❌ 페이지 전환 애니메이션 없음
- ❌ 지정된 5개 파일 외 다른 파일 수정 금지
- ❌ TypeScript, CSS 모듈, Tailwind 사용 금지
- ❌ 하드코딩 색상/사이즈 금지 — CSS 변수만 사용

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: none

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **Build**: Use Bash — `npm run build`, check exit code

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 파일 생성):
├── Task 1: ManualDetailView.vue + CSS 생성 [visual-engineering]
└── Task 2: 라우터에 2개 상세 라우트 추가 [quick]

Wave 2 (After Wave 1 — 핸들러 수정 + 검증):
├── Task 3: MemberManualView + TrainerManualView 핸들러 수정 [quick]
└── Task 4: 빌드 검증 + QA [unspecified-high]

Wave FINAL (After ALL tasks):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 3 → Task 4
Max Concurrent: 2 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 3, 4 |
| 2 | — | 3, 4 |
| 3 | 1, 2 | 4 |
| 4 | 3 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks — T1 → `visual-engineering`, T2 → `quick`
- **Wave 2**: 2 tasks — T3 → `quick`, T4 → `unspecified-high`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + playwright, F4 → `deep`

---

## TODOs

- [ ] 1. ManualDetailView.vue + ManualDetailView.css 생성

  **What to do**:
  - `src/views/member/ManualDetailView.vue` 생성
  - `src/views/member/ManualDetailView.css` 생성 (companion CSS)
  - BEM 블록명: `manual-detail`
  - `<script setup>` + Composition API, `<style src="./ManualDetailView.css" scoped>`
  - `useRouter()` + `useRoute()` 사용
  - `route.params.id`를 `Number()`로 변환하여 mock 데이터 lookup
  - 유효하지 않은 ID 시 fallback 처리 (빈 뷰 + 뒤로가기)

  **Template 구조**:
  ```
  .manual-detail
    .manual-detail__hero (gradient 배경, aspect-ratio 16/9)
      .manual-detail__hero-overlay (어두운 gradient 오버레이)
      .manual-detail__back (뒤로가기 버튼, 흰색, position absolute top-left)
      .manual-detail__hero-bottom (하단 정렬)
        .manual-detail__badge (카테고리 뱃지)
        .manual-detail__title (매뉴얼 제목, 흰색)
    .manual-detail__body
      .manual-detail__meta (flex row, 3등분)
        .manual-detail__meta-item × 3 (시간 / 난이도 / 세트)
        .manual-detail__meta-divider (구분선)
      section.manual-detail__section "운동 설명"
        .manual-detail__desc (본문)
      section.manual-detail__section "타겟 부위"
        .manual-detail__tags > .manual-detail__tag
      section.manual-detail__section "필요 장비" (v-if 장비 있을 때만)
        .manual-detail__tags > .manual-detail__tag--outline
      section.manual-detail__section "운동 순서"
        .manual-detail__steps > .step-card × N
          .step-card__num (번호 원)
          .step-card__content
            .step-card__title
            .step-card__desc
            .step-card__reps (반복/세트 정보)
      section.manual-detail__section "주의사항 및 팁"
        .manual-detail__tips > .tip-item × N
          .tip-item__icon (info SVG)
          .tip-item__text
  ```

  **Mock 데이터 스키마** (8개 항목 전체 포함):
  ```js
  {
    id: Number,           // 1-8, 목록 뷰 ID와 일치
    title: String,        // 매뉴얼 제목
    category: String,     // 카테고리명
    duration: Number,     // 소요 시간 값
    unit: String,         // '분' | '주'
    difficulty: String,   // '초급' | '중급' | '고급' | '쉬움' | '영양'
    sets: Number,         // 세트 수
    gradient: String,     // CSS 그라디언트 (목록 뷰와 동일)
    description: String,  // 2-3문장 운동 설명
    muscles: String[],    // 타겟 부위 배열
    equipment: String[],  // 필요 장비 배열 (빈 배열 가능)
    steps: Array<{
      title: String,      // 동작 이름
      desc: String,       // 동작 설명
      reps: String        // '10회 × 3세트' 형식
    }>,
    tips: String[]        // 주의사항/팁 배열
  }
  ```

  **CSS 디자인 사양**:
  - 히어로: `aspect-ratio: 16/9`, gradient 배경, 하단 어둡게 오버레이
  - 뒤로가기: 흰색 반투명 원, absolute top-left, `color: white`
  - 뱃지: 흰색 반투명 배경 (`rgba(255,255,255,0.92)`), 파란 텍스트
  - 메타 바: 가운데 정렬 flex, 아이콘 + 텍스트, 구분선
  - 섹션 제목: `--fs-subtitle`, `--fw-subtitle`, 하단 마진 12px
  - 태그: pill shape (`border-radius: 20px`), 회색 배경 / outline 변형
  - 스텝 카드: 좌측 번호 원(파란 배경 흰 텍스트) + 우측 내용
  - 팁: 아이콘 + 텍스트, 연한 배경

  **Must NOT do**:
  - 편집/삭제 기능 없음
  - YouTube 임베드 없음
  - 공유 컴포넌트 추출 없음
  - 하드코딩 색상 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 중심 뷰 생성 — 히어로, 카드, 태그 등 시각적 컴포넌트 다수
  - **Skills**: [`playwright`]
    - `playwright`: QA 시나리오 실행에 필요
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 디자인 목업 없이 코드 구조만 작성하므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 2와 동시)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 3, Task 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberDetailView.vue` — 상세 뷰 전체 구조 패턴 (헤더+바디+섹션)
  - `src/views/trainer/TrainerMemberDetailView.css` — BEM CSS, 섹션 타이틀, 카드, 태그 스타일
  - `src/views/member/MemberManualView.vue:111-184` — mock 데이터 8개 항목 (ID, gradient 일치 필수)
  - `src/components/AppBottomSheet.vue` — Teleport + Transition 패턴 참고 (오버레이)

  **API/Type References**:
  - `src/router/index.js:67-70` — `route.params.id` 동적 라우트 사용 패턴

  **External References**:
  - 없음

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 상세 뷰가 올바른 매뉴얼 데이터를 표시
    Tool: Playwright
    Preconditions: dev 서버 실행 중 (npm run dev)
    Steps:
      1. goto('http://localhost:5173/member/manual/1')
      2. waitForSelector('.manual-detail__title')
      3. assert textContent('.manual-detail__title') === '허리 재활 운동'
      4. assert textContent('.manual-detail__badge') === '재활'
      5. assert '.manual-detail__meta-item' 요소 3개 존재
      6. assert '.step-card' 요소 5개 존재 (허리 재활 운동의 스텝 수)
      7. screenshot
    Expected Result: 제목 "허리 재활 운동", 뱃지 "재활", 메타 3개, 스텝 5개 표시
    Evidence: .sisyphus/evidence/task-1-detail-data.png

  Scenario: 유효하지 않은 ID 접근 시 fallback
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. goto('http://localhost:5173/member/manual/999')
      2. assert '.manual-detail__back' 버튼이 존재
      3. assert 페이지가 크래시하지 않음 (no error overlay)
      4. screenshot
    Expected Result: 빈 상태 또는 기본 데이터로 표시, 뒤로가기 버튼 작동
    Evidence: .sisyphus/evidence/task-1-fallback.png
  ```

  **Evidence to Capture:**
  - [ ] task-1-detail-data.png
  - [ ] task-1-fallback.png

  **Commit**: YES (groups with 2, 3)
  - Message: `feat(manual): add manual detail view with exercise steps, meta info, and tips`
  - Files: `src/views/member/ManualDetailView.vue`, `src/views/member/ManualDetailView.css`
  - Pre-commit: `npm run build`

---

- [ ] 2. 라우터에 상세 보기 라우트 추가

  **What to do**:
  - `src/router/index.js`에 2개 라우트 추가
  - 회원: `/member/manual/:id` → name `member-manual-detail`
  - 트레이너: `/trainer/settings/manual/:id` → name `trainer-manual-detail`
  - 양쪽 모두 `meta: { hideNav: true }`
  - 양쪽 모두 같은 컴포넌트: `() => import('@/views/member/ManualDetailView.vue')`
  - 회원 라우트: 기존 `/member/manual` 라우트 **바로 뒤에** 삽입
  - 트레이너 라우트: 기존 `/trainer/settings/manual` 라우트 **바로 뒤에**, `/trainer/settings/manual/register` **앞에** 삽입

  **구체적 코드 위치**:
  ```
  // 기존 member-manual 라우트 (line ~127-130) 뒤에:
  {
    path: '/member/manual/:id',
    name: 'member-manual-detail',
    component: () => import('@/views/member/ManualDetailView.vue'),
    meta: { hideNav: true },
  },

  // 기존 trainer-manual 라우트 (line ~104-109) 뒤, trainer-manual-register 앞에:
  {
    path: '/trainer/settings/manual/:id',
    name: 'trainer-manual-detail',
    component: () => import('@/views/member/ManualDetailView.vue'),
    meta: { hideNav: true },
  },
  ```

  **주의**: `/trainer/settings/manual/:id`는 `/trainer/settings/manual/register`보다 **앞에** 위치하면 `register`가 `:id`로 매칭됨. Vue Router 4는 자동으로 정적 라우트를 우선하므로 순서 상관없지만, 명확성을 위해 `register` 라우트를 먼저 배치하고 `:id`를 뒤에 배치.

  **Must NOT do**:
  - 기존 라우트 수정 금지
  - 라우트 가드 추가 금지
  - scrollBehavior 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단순 라우트 2개 추가, 3분 내 완료 가능
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 1과 동시)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 3, Task 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/router/index.js:66-70` — 동적 라우트 `:id` 패턴 (`trainer-member-detail`)
  - `src/router/index.js:136-141` — `/member/reservation` hideNav 패턴

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 라우트가 올바르게 등록됨
    Tool: Bash (curl)
    Preconditions: dev 서버 실행 중
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/member/manual/1
      2. assert status code === 200
      3. curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/trainer/settings/manual/1
      4. assert status code === 200
    Expected Result: 양쪽 라우트 모두 200 응답
    Evidence: .sisyphus/evidence/task-2-routes.txt

  Scenario: register 라우트가 :id에 매칭되지 않음
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. goto('http://localhost:5173/trainer/settings/manual/register')
      2. assert URL에 'register' 포함
      3. assert 페이지가 ManualRegisterView를 렌더링 (ManualDetailView 아님)
    Expected Result: /trainer/settings/manual/register는 기존 등록 뷰로 이동
    Evidence: .sisyphus/evidence/task-2-register-safe.png
  ```

  **Commit**: YES (groups with 1, 3)
  - Message: `feat(manual): add manual detail view with exercise steps, meta info, and tips`
  - Files: `src/router/index.js`

---

- [ ] 3. MemberManualView + TrainerManualView 카드 클릭 핸들러 수정

  **What to do**:

  **MemberManualView.vue** (`src/views/member/MemberManualView.vue`):
  - `handleCardClick` 함수에서 `alert()` 제거
  - `router.push({ name: 'member-manual-detail', params: { id: item.id } })` 로 교체

  **TrainerManualView.vue** (`src/views/trainer/TrainerManualView.vue`):
  - `handleCardClick` 함수에서 `alert()` 제거
  - `router.push({ name: 'trainer-manual-detail', params: { id: item.id } })` 로 교체

  **Must NOT do**:
  - 다른 함수(handleMore, handleAdd 등) 수정 금지
  - 템플릿이나 스타일 수정 금지
  - mock 데이터 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 파일에서 각 1줄 수정, 2분 내 완료
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (Sequential)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `src/views/member/MemberManualView.vue:198-200` — 현재 handleCardClick (alert 호출)
  - `src/views/trainer/TrainerManualView.vue:205-207` — 현재 handleCardClick (alert 호출)
  - `src/views/trainer/TrainerManualView.vue:209-211` — handleAdd의 router.push 패턴 참고

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 회원 매뉴얼 카드 클릭 시 상세 뷰로 이동
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. goto('http://localhost:5173/member/manual')
      2. waitForSelector('.manual-list__card')
      3. click('.manual-list__card:first-child')
      4. waitForURL('**/member/manual/**')
      5. assert URL이 /member/manual/1 을 포함
      6. assert alert 다이얼로그가 나타나지 않음
      7. assert '.manual-detail__title' 요소 존재
      8. screenshot
    Expected Result: 카드 클릭 → 상세 뷰 이동, alert 없음
    Evidence: .sisyphus/evidence/task-3-member-nav.png

  Scenario: 트레이너 매뉴얼 카드 클릭 시 상세 뷰로 이동
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. goto('http://localhost:5173/trainer/settings/manual')
      2. waitForSelector('.manual-list__card')
      3. click('.manual-list__card:first-child')
      4. waitForURL('**/trainer/settings/manual/**')
      5. assert URL이 /trainer/settings/manual/1 을 포함
      6. assert '.manual-detail__title' 요소 존재
      7. screenshot
    Expected Result: 카드 클릭 → 상세 뷰 이동
    Evidence: .sisyphus/evidence/task-3-trainer-nav.png

  Scenario: 상세 뷰에서 뒤로가기
    Tool: Playwright
    Preconditions: 회원 매뉴얼 목록에서 카드 클릭하여 상세 진입
    Steps:
      1. goto('http://localhost:5173/member/manual')
      2. click('.manual-list__card:first-child')
      3. waitForSelector('.manual-detail__back')
      4. click('.manual-detail__back')
      5. waitForURL('**/member/manual')
      6. assert '.manual-list__grid' 요소 존재 (목록 뷰 복귀)
      7. screenshot
    Expected Result: 뒤로가기 클릭 → 목록 뷰 복귀
    Evidence: .sisyphus/evidence/task-3-back-nav.png
  ```

  **Evidence to Capture:**
  - [ ] task-3-member-nav.png
  - [ ] task-3-trainer-nav.png
  - [ ] task-3-back-nav.png

  **Commit**: YES (groups with 1, 2)
  - Message: `feat(manual): add manual detail view with exercise steps, meta info, and tips`
  - Files: `src/views/member/MemberManualView.vue`, `src/views/trainer/TrainerManualView.vue`

---

- [ ] 4. 빌드 검증 + alert 잔여 확인

  **What to do**:
  - `npm run build` 실행 → exit 0 확인
  - `ast_grep_search`로 수정된 파일에서 `alert(` 호출 잔여 확인
  - TrainerManualView의 `handleMore`에 있는 alert은 **그대로 유지** (이번 스코프 아님)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 빌드 + 코드 검증 + QA 통합
  - **Skills**: [`playwright`]
    - `playwright`: 브라우저 QA 실행

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 3)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 3

  **References**:
  - `package.json:8` — `"build": "vite build"` 빌드 명령

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 프로덕션 빌드 성공
    Tool: Bash
    Steps:
      1. npm run build
      2. assert exit code === 0
      3. assert dist/ 디렉토리에 ManualDetailView 청크 존재
    Expected Result: 빌드 성공, ManualDetailView가 코드 스플리팅됨
    Evidence: .sisyphus/evidence/task-4-build.txt

  Scenario: handleCardClick에서 alert 제거 확인
    Tool: ast_grep_search
    Steps:
      1. ast_grep_search pattern='alert($MSG)' lang=javascript globs=['src/views/member/MemberManualView.vue']
      2. assert 결과에 handleCardClick 관련 alert 없음
      3. ast_grep_search pattern='alert($MSG)' lang=javascript globs=['src/views/trainer/TrainerManualView.vue']
      4. assert handleCardClick 관련 alert 없음 (handleMore의 alert은 허용)
    Expected Result: 카드 클릭 핸들러에서 alert 완전 제거됨
    Evidence: .sisyphus/evidence/task-4-no-alert.txt
  ```

  **Commit**: NO (이미 Task 1-3에서 커밋됨)

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search for forbidden patterns. Check evidence files exist. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [4/4] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build`. Review all 5 changed files for: hard-coded colors, missing CSS variables, `as any`, empty catches. Check BEM naming consistency (`manual-detail__*`). Verify no `export default` (Options API). Check `@/` alias usage.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` + `playwright` skill
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test all 8 manual detail pages (/member/manual/1 through /member/manual/8). Test cross-task integration. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read spec, read actual changes. Verify 1:1 match. Check "Must NOT do" compliance. Detect scope creep: shared data modules, edit buttons, YouTube embeds, new components.
  Output: `Tasks [4/4 compliant] | Creep [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **1-3**: `feat(manual): add manual detail view with exercise steps, meta info, and tips` — ManualDetailView.vue, ManualDetailView.css, router/index.js, MemberManualView.vue, TrainerManualView.vue → `npm run build`

---

## Success Criteria

### Verification Commands
```bash
npm run build    # Expected: ✓ built, exit 0
```

### Final Checklist
- [ ] ManualDetailView.vue + CSS 생성됨
- [ ] 라우터에 member-manual-detail, trainer-manual-detail 등록됨
- [ ] 회원/트레이너 카드 클릭 → 상세 뷰 이동
- [ ] 상세 뷰에 히어로, 메타, 설명, 부위, 장비, 순서, 팁 섹션 존재
- [ ] 뒤로가기 동작
- [ ] BottomNav 숨김
- [ ] alert() 제거됨
- [ ] 빌드 성공
- [ ] 하드코딩 색상 없음
