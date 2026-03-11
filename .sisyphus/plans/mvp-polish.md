# MVP 이후 종합 품질 개선 (MVP Polish)

## TL;DR

> **Quick Summary**: MVP 100% 완료된 PT 매니저 앱의 사용자 경험과 코드 품질을 종합 개선. 스켈레턴 UI, 기술부채 해소, 테스트 커버리지 확대, 성능 최적화를 하나의 통합 계획으로 실행한다.
> 
> **Deliverables**:
> - AppSkeleton 범용 컴포넌트 + 25개 데이터 뷰에 적용
> - 글로벌 Toast 시스템 (App.vue 단일 인스턴스)
> - SVG 18파일 54인스턴스 + CSS 하드코딩 색상/px 정리
> - Notifications Realtime 구독 + Auth 구독 해제
> - Playwright E2E 인프라 + 핵심 플로우 5개 시나리오
> - useConnection 테스트 + 기존 15개 테스트 edge case 보강
> - 빌드 크기 분석 + 조건부 성능 최적화
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 (AppSkeleton) → Task 6-8 (뷰 적용) → Task 15 (E2E QA)

---

## Context

### Original Request
MVP가 100% 완료된 상태에서 다음 작업으로 4가지 영역 개선 요청:
1. UI/UX 개선 (스켈레턴 UI / 로딩 상태)
2. 품질 개선 (기술 부채 해소)
3. 성능 최적화 (번들 분석 + 페이지네이션)
4. 테스트 (유닛 + E2E)

### Interview Summary
**Key Discussions**:
- 특정 버그 없음 — 전반적 품질 개선 목표
- UI/UX: 스켈레턴 UI + 로딩 상태 집중 (사용자 선택)
- 테스트: Vitest 유닛 확대 + Playwright E2E
- 성능: 자동 판단에 맡김
- 우선순위: UI/UX > 품질 > 성능 > 테스트

**Research Findings**:
- 44개 뷰 전부 실제 구현체, 스텁 0개
- alert() 호출 0건 — AppToast + useToast 이미 12개 뷰 사용 중
- SVG 하드코딩: 18파일 54인스턴스 (AGENTS.md의 ~12 파일보다 많음)
- 테스트: 15/16 컴포저블 테스트 존재 (~94개), useConnection만 미커버
- 리얼타임: messages + chatBadge 구독 중, notifications/reservations 미적용
- 의존성 5개만 — 번들 최적화 ROI 낮을 가능성
- CSS 파일 내에도 하드코딩 색상 존재 (SVG 외)
- useToast는 per-component 패턴 (글로벌 싱글톤 아님)
- EmailLoginView (`/email-login`) 존재 — E2E 인증 우회 가능. `/dev-login`은 `/email-login`으로 리다이렉트됨
- MemberProfileView, AccountManageView에서 직접 Supabase 호출

### Metis Review
**Identified Gaps** (addressed):
- alert() 대체 작업 → 제거 (이미 0건)
- SVG 범위 12→18파일로 수정
- 컴포저블 테스트 "확대" → "보강"으로 변경 (15/16 이미 존재)
- 글로벌 에러 바운더리 → composable error ref + Toast 통일로 변경
- E2E 인프라를 Wave 1으로 당김 (CSS 변경 전 baseline 스크린샷)
- CSS 파일 내 하드코딩 색상 정리 추가
- BottomNav chatBadge cleanup 검증 추가
- fetchConversations .limit(500) 서버사이드 그룹화 검토 추가

---

## Work Objectives

### Core Objective
MVP 완료된 PT 매니저 앱의 사용자 경험(로딩 UX), 코드 품질(기술 부채), 안정성(테스트), 성능을 종합 개선하여 프로덕션 준비 수준으로 끌어올린다.

### Concrete Deliverables
- `src/components/AppSkeleton.vue` — 범용 스켈레턴 컴포넌트
- 25개 데이터 뷰에 스켈레턴 UI 적용
- 글로벌 Toast 시스템 (`src/stores/toast.js` + App.vue 단일 인스턴스)
- SVG 18파일 하드코딩 색상 → currentColor + CSS 변수
- CSS 하드코딩 px → CSS 변수 변환 (제한 범위)
- CSS 파일 내 하드코딩 색상 → CSS 변수 변환
- `src/stores/notificationBadge.js` Realtime 구독 추가
- Auth 구독 해제 수정
- Playwright E2E 인프라 + 5개 핵심 시나리오
- `useConnection` 테스트 + 기존 테스트 edge case 보강
- 빌드 크기 before/after 기록

### Definition of Done
- [ ] `npm run build` — exit code 0, 에러 없음
- [ ] `npm test` — 모든 유닛 테스트 통과
- [ ] `npx playwright test` — 모든 E2E 테스트 통과
- [ ] `grep -r 'stroke="#\|fill="#' src/views/ src/components/ | grep -v 'fill="none"'` → 0건
- [ ] `grep -rc '로딩 중' src/views/` → 0건 (스켈레턴으로 대체)
- [ ] 시각적 회귀 없음 (Playwright 스크린샷 비교)

### Must Have
- AppSkeleton 범용 컴포넌트 (line, circle, rect 변형)
- 글로벌 Toast (App.vue 단일 인스턴스 + Pinia store)
- SVG 하드코딩 색상 전부 currentColor로 변환
  - Playwright E2E 인프라 + EmailLoginView (`/email-login`) 활용 인증 우회
- useConnection.test.js 작성
- notifications Realtime 구독

### Must NOT Have (Guardrails)
- ❌ 뷰별 맞춤 스켈레턴 컴포넌트 생성 금지 (범용 AppSkeleton 조합으로)
- ❌ Login, AuthCallback, RoleSelect, Onboarding 뷰에 스켈레턴 적용 금지
- ❌ 새로운 CSS 변수 대량 생성 금지 (기존 변수로 대체 가능한 것만)
- ❌ 컴포넌트 고유 크기(아바타 48px, dot 6px 등) 변수화 금지
- ❌ 외부 아이콘 라이브러리 도입 금지
- ❌ Sentry, LogRocket 등 외부 에러 추적 도구 추가 금지
- ❌ retry 로직 추가 금지 (AppPullToRefresh로 커버)
- ❌ 뷰 컴포넌트 단위 테스트 작성 금지 (ROI 낮음)
- ❌ reservations Realtime 추가 금지 (빈도 낮아 폴링 충분)
- ❌ 번들 분석 도구(rollup-plugin-visualizer 등) 설치 금지
- ❌ 의존성 교체/제거 금지
- ❌ Auth 관련 뷰 6개의 직접 Supabase 호출 정리 금지 (합리적 예외)
- ❌ SVG 디자인/크기 변경 금지 (색상만 currentColor로)
- ❌ box-shadow px 값 변수화 금지

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest configured, 15 test files, ~94 tests)
- **Automated tests**: Tests-after (기존 테스트 보강 + 신규 추가)
- **Framework**: Vitest (유닛) + Playwright (E2E)
- **E2E Auth Strategy**: EmailLoginView (`/email-login`) 활용하여 Kakao OAuth 우회. 참고: `/dev-login`은 `/email-login`으로 리다이렉트됨

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Playwright — Navigate, interact, assert DOM, screenshot
- **Component**: Vitest — Import, render, assert output
- **Build**: Bash — npm run build, check exit code + output size

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — 기반 인프라, 6 tasks, MAX PARALLEL):
├── Task 1: AppSkeleton 범용 컴포넌트 생성 [visual-engineering]
├── Task 2: 글로벌 Toast 시스템 전환 [quick]
├── Task 3: Playwright E2E 인프라 설치 + baseline 스크린샷 [quick]
├── Task 4: Auth 구독 해제 + BottomNav cleanup 검증 [quick]
├── Task 5: Notifications Realtime 구독 추가 [quick]
└── Task 6: 빌드 크기 baseline 기록 [quick]

Wave 2 (Core Apply — 핵심 적용, 7 tasks, MAX PARALLEL):
├── Task 7: 스켈레턴 UI — 트레이너 뷰 적용 (depends: 1) [visual-engineering]
├── Task 8: 스켈레턴 UI — 멤버 뷰 적용 (depends: 1) [visual-engineering]
├── Task 9: 스켈레턴 UI — 공통 뷰 적용 (depends: 1) [visual-engineering]
├── Task 10: SVG 하드코딩 색상 정리 (depends: 3) [unspecified-high]
├── Task 11: CSS 하드코딩 색상 정리 (depends: 3) [unspecified-high]
├── Task 12: CSS px → 변수 변환 (depends: 3) [unspecified-high]
└── Task 13: 직접 Supabase 호출 정리 (2개 뷰) (depends: 2) [quick]

Wave 3 (Test & Perf — 테스트 + 성능, 5 tasks, MAX PARALLEL):
├── Task 14: useConnection 테스트 + 기존 테스트 edge case 보강 [unspecified-high]
├── Task 15: E2E 핵심 플로우 테스트 작성 (depends: 3) [unspecified-high]
├── Task 16: fetchConversations 페이지네이션 개선 검토 [deep]
├── Task 17: 에러 표시 패턴 통일 (depends: 2) [unspecified-high]
└── Task 18: 기존 12개 뷰 Toast per-component → 글로벌 전환 (depends: 2) [unspecified-low]

Wave 4 (Verification — 최종 검증):
├── Task F1: Plan Compliance Audit [oracle]
├── Task F2: Code Quality Review [unspecified-high]
├── Task F3: Real Manual QA [unspecified-high]
└── Task F4: Scope Fidelity Check [deep]

Critical Path: Task 1 → Task 7-9 → Task 15 (E2E) → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 7 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 (AppSkeleton) | — | 7, 8, 9 | 1 |
| 2 (Global Toast) | — | 13, 17, 18 | 1 |
| 3 (Playwright infra) | — | 10, 11, 12, 15 | 1 |
| 4 (Auth cleanup) | — | — | 1 |
| 5 (Notifications RT) | — | — | 1 |
| 6 (Build baseline) | — | — | 1 |
| 7 (Skeleton trainer) | 1 | 15 | 2 |
| 8 (Skeleton member) | 1 | 15 | 2 |
| 9 (Skeleton common) | 1 | 15 | 2 |
| 10 (SVG cleanup) | 3 | F2 | 2 |
| 11 (CSS color cleanup) | 3 | F2 | 2 |
| 12 (CSS px cleanup) | 3 | F2 | 2 |
| 13 (Supabase direct) | 2 | F4 | 2 |
| 14 (Unit tests) | — | F2 | 3 |
| 15 (E2E tests) | 3, 7-9 | F3 | 3 |
| 16 (Pagination) | — | F1 | 3 |
| 17 (Error display) | 2 | F3 | 3 |
| 18 (Toast migration) | 2 | F3 | 3 |

### Agent Dispatch Summary

- **Wave 1**: **6 tasks** — T1 → `visual-engineering`, T2-T6 → `quick`
- **Wave 2**: **7 tasks** — T7-T9 → `visual-engineering`, T10-T12 → `unspecified-high`, T13 → `quick`
- **Wave 3**: **5 tasks** — T14-T15 → `unspecified-high`, T16 → `deep`, T17 → `unspecified-high`, T18 → `unspecified-low`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. AppSkeleton 범용 컴포넌트 생성

  **What to do**:
  - `src/components/AppSkeleton.vue` 생성
  - 3가지 변형 지원: `line` (텍스트), `circle` (아바타), `rect` (카드/이미지)
  - Props: `type` (line|circle|rect), `width`, `height`, `borderRadius`, `count` (반복 개수)
  - 맥박 애니메이션 (CSS `@keyframes pulse` — opacity 0.3 ↔ 0.7)
  - 배경색: `var(--color-gray-100)` (#F2F4F7)
  - 사용 예시:
    ```html
    <AppSkeleton type="circle" width="48px" height="48px" />
    <AppSkeleton type="line" width="60%" height="16px" />
    <AppSkeleton type="rect" width="100%" height="120px" />
    ```
  - 기존 디자인 시스템(global.css) 토큰 활용

  **Must NOT do**:
  - 뷰별 전용 스켈레턴 컴포넌트 생성 금지
  - 외부 스켈레턴 라이브러리 설치 금지
  - 기존 CSS 변수 외 새 변수 생성 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 컴포넌트 디자인 + CSS 애니메이션 전문
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: UI 확인에 유용하나 컴포넌트 생성 단계에서는 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5, 6)
  - **Blocks**: Tasks 7, 8, 9
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/components/AppButton.vue` — 기존 App-prefix 컴포넌트 패턴 (props 정의, scoped styles)
  - `src/components/AppPullToRefresh.vue` — slot 패턴 참고
  - `src/assets/css/global.css` — 디자인 토큰 (`--color-gray-100`, `--radius-*`)

  **API/Type References**:
  - `src/components/` 디렉토리 — 기존 컴포넌트 네이밍/구조 컨벤션

  **WHY Each Reference Matters**:
  - `AppButton.vue`: props 정의 패턴(`defineProps`), scoped style, BEM 클래스 네이밍 추출
  - `global.css`: 사용 가능한 디자인 토큰 목록 — 새 변수 만들지 않고 기존 것 활용

  **Acceptance Criteria**:
  - [ ] `src/components/AppSkeleton.vue` 파일 존재
  - [ ] `npm run build` → exit code 0
  - [ ] 3가지 type (line, circle, rect) 렌더링 가능
  - [ ] pulse 애니메이션 동작

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: AppSkeleton 컴포넌트 렌더링 확인
    Tool: Playwright
    Preconditions: dev server 실행 (npm run dev)
    Steps:
      1. 테스트용 임시 라우트 또는 기존 뷰에 AppSkeleton 3가지 타입 삽입
      2. 브라우저에서 해당 페이지 접근
      3. `.app-skeleton--line` 요소 존재 확인
      4. `.app-skeleton--circle` 요소 존재 확인
      5. `.app-skeleton--rect` 요소 존재 확인
      6. CSS animation 속성에 'pulse' 포함 확인
    Expected Result: 3개 변형 모두 렌더링, pulse 애니메이션 활성
    Failure Indicators: 요소 미발견 또는 animation 속성 없음
    Evidence: .sisyphus/evidence/task-1-skeleton-render.png

  Scenario: AppSkeleton 빌드 호환성
    Tool: Bash
    Preconditions: None
    Steps:
      1. npm run build 실행
      2. exit code 확인
    Expected Result: exit code 0, 에러 없음
    Failure Indicators: build 실패 또는 경고
    Evidence: .sisyphus/evidence/task-1-build-output.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add AppSkeleton component with line/circle/rect variants`
  - Files: `src/components/AppSkeleton.vue`
  - Pre-commit: `npm run build`

- [x] 2. 글로벌 Toast 시스템 전환

  **What to do**:
  - `src/stores/toast.js` 생성 — Pinia store (Composition API)
    - `message` ref, `type` ref ('success'|'error'|'info'), `visible` ref
    - `showToast(message, type, duration=3000)` action
    - `hideToast()` action
  - `App.vue`에 `<AppToast>` 단일 인스턴스 추가 (Teleport to body)
  - `AppToast.vue` 수정 — props 대신 toast store 구독
  - `useToast.js` 수정 — 내부적으로 toast store 사용하도록 변경
  - 기존 12개 뷰에서 개별 `<AppToast>` 제거는 Task 18에서 수행

  **Must NOT do**:
  - 외부 Toast 라이브러리 설치 금지
  - Toast 위치/디자인 변경 금지 (기존 디자인 유지)
  - 기존 useToast() API 변경 금지 (호환성 유지)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: store 생성 + 기존 컴포넌트 수정의 단순 리팩토링
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5, 6)
  - **Blocks**: Tasks 13, 17, 18
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/stores/auth.js` — Pinia Composition API store 패턴 (defineStore + ref + 함수)
  - `src/stores/chatBadge.js` — 간단한 유틸리티 store 패턴
  - `src/composables/useToast.js` — 현재 per-component Toast 구현 (ref 기반)
  - `src/components/AppToast.vue` — 현재 Toast UI 컴포넌트

  **WHY Each Reference Matters**:
  - `auth.js`: Pinia store 작성 컨벤션 (Composition API style)
  - `useToast.js`: 기존 API를 유지하면서 내부 구현만 store 기반으로 변경해야 하므로 현재 인터페이스 파악 필수
  - `AppToast.vue`: 현재 Toast 렌더링 방식 파악 — props 기반에서 store 구독으로 전환

  **Acceptance Criteria**:
  - [ ] `src/stores/toast.js` 파일 존재
  - [ ] `useToast()` API 하위 호환 유지 (showToast, hideToast)
  - [ ] App.vue에 단일 `<AppToast>` 인스턴스 존재
  - [ ] `npm run build` → exit code 0
  - [ ] `npm test` → 기존 테스트 전부 통과

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 글로벌 Toast 정상 표시
    Tool: Playwright
    Preconditions: dev server 실행
    Steps:
      1. EmailLoginView (`/email-login`) 접근하여 이메일/비밀번호 로그인
      2. Toast를 트리거하는 액션 수행 (예: 프로필 저장)
      3. `.app-toast` 요소가 화면에 나타나는지 확인
      4. 3초 후 자동 사라지는지 확인
    Expected Result: Toast가 한 곳(App.vue)에서만 렌더링, 정상 표시 후 사라짐
    Failure Indicators: Toast 미표시 또는 중복 표시
    Evidence: .sisyphus/evidence/task-2-global-toast.png

  Scenario: 기존 테스트 호환성
    Tool: Bash
    Preconditions: None
    Steps:
      1. npm test 실행
      2. 결과 확인
    Expected Result: 모든 기존 테스트 통과 (useToast API 하위 호환)
    Failure Indicators: 테스트 실패
    Evidence: .sisyphus/evidence/task-2-test-output.txt
  ```

  **Commit**: YES
  - Message: `refactor(toast): convert to global toast system with Pinia store`
  - Files: `src/stores/toast.js`, `src/components/AppToast.vue`, `src/composables/useToast.js`, `src/App.vue`
  - Pre-commit: `npm test`

- [x] 3. Playwright E2E 인프라 설치 + Baseline 스크린샷

  **What to do**:
  - `npm install -D @playwright/test` 실행
  - `npx playwright install chromium` (chromium만, 최소 설치)
  - `playwright.config.js` 생성:
    - baseURL: `http://localhost:5173`
    - projects: chromium only (모바일 viewport 480px)
    - retries: 1
    - screenshot: on-failure
  - `tests/e2e/` 디렉토리 생성
  - `tests/e2e/auth.setup.js` — EmailLoginView (`/email-login`) 활용 인증 헬퍼 (`/dev-login`은 `/email-login`으로 리다이렉트되므로 직접 `/email-login` 사용)
  - `tests/e2e/smoke.spec.js` — 기본 스모크 테스트 (이메일 로그인 → 홈 표시 확인)
  - 주요 페이지 baseline 스크린샷 캡처 (CSS 변경 전):
    - TrainerHomeView, MemberHomeView, TrainerScheduleView, MemberChatView
  - `package.json`에 `"test:e2e": "npx playwright test"` 스크립트 추가

  **Must NOT do**:
  - Firefox, WebKit 설치 금지 (chromium만)
  - CI 파이프라인 설정 금지 (로컬 전용)
  - Kakao OAuth 자동화 시도 금지 (EmailLoginView 사용)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 패키지 설치 + 설정 파일 생성의 단순 인프라 작업
  - **Skills**: [`playwright`]
    - `playwright`: Playwright 설정 및 기본 테스트 작성 전문

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5, 6)
  - **Blocks**: Tasks 10, 11, 12, 15
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/login/EmailLoginView.vue` — E2E 테스트 인증 경로 (이메일/비밀번호 로그인). `/dev-login`은 `/email-login`으로 리다이렉트됨
  - `vite.config.js` — dev server 포트 설정 (5173)
  - `package.json` — scripts 섹션 + devDependencies

  **External References**:
  - Playwright 공식 문서: https://playwright.dev/docs/intro

  **WHY Each Reference Matters**:
  - `EmailLoginView.vue`: E2E에서 OAuth 대신 이메일 로그인으로 인증 — 로그인 폼 selector 확인
  - `vite.config.js`: baseURL 설정 시 올바른 포트/호스트 사용

  **Acceptance Criteria**:
  - [ ] `playwright.config.js` 파일 존재
  - [ ] `tests/e2e/` 디렉토리 존재
  - [ ] `tests/e2e/smoke.spec.js` 기본 스모크 테스트 존재
  - [ ] `npx playwright test` → 스모크 테스트 통과
  - [ ] Baseline 스크린샷 4장 저장

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Playwright 스모크 테스트 통과
    Tool: Bash
    Preconditions: dev server 실행 (npm run dev)
    Steps:
      1. npx playwright test tests/e2e/smoke.spec.js 실행
      2. exit code 확인
    Expected Result: exit code 0, 스모크 테스트 통과
    Failure Indicators: 테스트 실패 또는 playwright 미설치
    Evidence: .sisyphus/evidence/task-3-e2e-smoke.txt

  Scenario: Baseline 스크린샷 캡처 확인
    Tool: Bash
    Preconditions: 스모크 테스트 통과 후
    Steps:
      1. tests/e2e/screenshots/ 디렉토리 내 스크린샷 파일 확인
      2. 4장 이상 존재 확인
    Expected Result: TrainerHome, MemberHome 등 기본 스크린샷 존재
    Failure Indicators: 스크린샷 파일 미생성
    Evidence: .sisyphus/evidence/task-3-baseline-screenshots/
  ```

  **Commit**: YES
  - Message: `test(e2e): add Playwright infrastructure with smoke test and baseline screenshots`
  - Files: `playwright.config.js`, `tests/e2e/`, `package.json`
  - Pre-commit: `npx playwright test`

- [x] 4. Auth 구독 해제 + BottomNav Cleanup 검증

  **What to do**:
  - `src/stores/auth.js`에서 `_authSubscription` 해제 추가:
    - signOut() 시 `_authSubscription?.unsubscribe()` 호출
    - `_authSubscription = null` 리셋
  - BottomNav/TrainerBottomNav의 chatBadge cleanup 검증:
    - `chatBadge.subscribe()` 호출 위치 확인
    - `meta.hideNav` 뷰에서 v-if 제거 시 unsubscribe 되는지 확인
    - 필요시 `onUnmounted(() => chatBadge.unsubscribe())` 추가
  - HMR 중복 등록 방지: `_authSubscription` null 체크 강화

  **Must NOT do**:
  - Auth 플로우 로직 변경 금지
  - 새로운 상태 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 1-2줄 수정 수준의 간단한 버그 수정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/stores/auth.js` — `_authSubscription` 변수, `registerAuthListener()`, `signOut()` 함수
  - `src/stores/chatBadge.js` — `subscribe()`, `unsubscribe()` 패턴
  - `src/components/BottomNav.vue` — chatBadge 사용 위치
  - `src/components/TrainerBottomNav.vue` — chatBadge 사용 위치

  **WHY Each Reference Matters**:
  - `auth.js`: 수정 대상 파일. `_authSubscription` 할당 위치와 signOut 흐름 파악
  - `chatBadge.js`: subscribe/unsubscribe 패턴 — BottomNav에서 올바르게 cleanup 하는지 확인
  - BottomNav 파일들: v-if로 조건부 렌더링 시 cleanup 동작 검증

  **Acceptance Criteria**:
  - [ ] signOut() 시 `_authSubscription.unsubscribe()` 호출됨
  - [ ] BottomNav에서 chatBadge cleanup 보장
  - [ ] `npm test` → 기존 테스트 통과
  - [ ] `npm run build` → exit code 0

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Auth 구독 해제 코드 존재 확인
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -n 'unsubscribe' src/stores/auth.js 실행
      2. signOut 함수 내에서 호출되는지 확인
    Expected Result: signOut 함수 내 unsubscribe 호출 존재
    Failure Indicators: grep 결과 없음 또는 signOut 외부에만 존재
    Evidence: .sisyphus/evidence/task-4-auth-cleanup.txt

  Scenario: 빌드 + 테스트 통과
    Tool: Bash
    Preconditions: None
    Steps:
      1. npm run build && npm test 실행
    Expected Result: 둘 다 성공
    Failure Indicators: exit code ≠ 0
    Evidence: .sisyphus/evidence/task-4-build-test.txt
  ```

  **Commit**: YES
  - Message: `fix(auth): add subscription cleanup on signOut and BottomNav unmount`
  - Files: `src/stores/auth.js`, `src/components/BottomNav.vue`, `src/components/TrainerBottomNav.vue`
  - Pre-commit: `npm test`

- [x] 5. Notifications Realtime 구독 추가

  **What to do**:
  - `src/stores/notificationBadge.js` 수정:
    - `chatBadge.js` 패턴을 참고하여 notifications 테이블 Realtime 구독 추가
    - `subscribe(userId)` — notifications INSERT 이벤트 구독 → unreadCount 업데이트
    - `unsubscribe()` — 구독 해제
    - 새 알림 수신 시 `unreadCount++`
  - `src/components/BottomNav.vue`, `src/components/TrainerBottomNav.vue`에서:
    - `notificationBadge.subscribe(user.id)` 호출 (chatBadge와 동일 패턴)
    - `onUnmounted`에서 `notificationBadge.unsubscribe()` 호출

  **Must NOT do**:
  - reservations Realtime 추가 금지
  - 기타 테이블 Realtime 추가 금지
  - 기존 notificationBadge 로직 삭제 금지 (보완만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: chatBadge.js 패턴 복제 수준의 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/stores/chatBadge.js` — Realtime 구독 패턴 (subscribe/unsubscribe, supabase.channel().on())
  - `src/stores/notificationBadge.js` — 수정 대상 (현재 API 폴링 방식)
  - `src/composables/useChat.js` — Realtime 구독의 또 다른 예시 (채널 생성, 필터링)
  - `src/lib/supabase.js` — Supabase 클라이언트 import 경로

  **WHY Each Reference Matters**:
  - `chatBadge.js`: 거의 동일한 구조로 복제하면 됨 — channel 생성, on(INSERT), unsubscribe 패턴
  - `notificationBadge.js`: 기존 코드 위에 Realtime 추가 — 현재 상태 파악 필수

  **Acceptance Criteria**:
  - [ ] `notificationBadge.js`에 subscribe/unsubscribe 함수 존재
  - [ ] Realtime 채널이 notifications INSERT 이벤트 구독
  - [ ] BottomNav에서 subscribe 호출 + onUnmounted cleanup
  - [ ] `npm run build` → exit code 0

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Realtime 구독 코드 존재 확인
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -n 'channel\|subscribe\|INSERT' src/stores/notificationBadge.js
      2. Realtime 관련 코드 존재 확인
    Expected Result: channel 생성 + INSERT 이벤트 리스너 + subscribe/unsubscribe 존재
    Failure Indicators: Realtime 관련 코드 미발견
    Evidence: .sisyphus/evidence/task-5-realtime-code.txt

  Scenario: 빌드 성공 확인
    Tool: Bash
    Preconditions: None
    Steps:
      1. npm run build 실행
    Expected Result: exit code 0
    Failure Indicators: 빌드 에러
    Evidence: .sisyphus/evidence/task-5-build.txt
  ```

  **Commit**: YES
  - Message: `feat(notifications): add realtime subscription for instant badge updates`
  - Files: `src/stores/notificationBadge.js`, `src/components/BottomNav.vue`, `src/components/TrainerBottomNav.vue`
  - Pre-commit: `npm run build`

- [x] 6. 빌드 크기 Baseline 기록

  **What to do**:
  - `npm run build` 실행
  - 출력에서 각 청크 파일명 + 크기 기록
  - `.sisyphus/evidence/build-baseline.txt`에 저장
  - 500KB 이상 청크 식별 (있으면 Task 16에서 조치)
  - 총 JS 크기, 총 CSS 크기 기록

  **Must NOT do**:
  - 번들 분석 도구 설치 금지
  - 코드 변경 금지 (기록만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 빌드 실행 + 결과 기록만
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `vite.config.js` — 빌드 설정 확인
  - `package.json` — build script

  **WHY Each Reference Matters**:
  - `vite.config.js`: 빌드 출력 설정 (manualChunks 등) 확인

  **Acceptance Criteria**:
  - [ ] `.sisyphus/evidence/build-baseline.txt` 파일 존재
  - [ ] 각 청크 파일명 + 크기 기록됨
  - [ ] 500KB 이상 청크 유무 식별됨

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Baseline 기록 파일 존재 확인
    Tool: Bash
    Preconditions: None
    Steps:
      1. cat .sisyphus/evidence/build-baseline.txt
      2. 파일 내용에 .js, .css 크기 정보 포함 확인
    Expected Result: 청크별 크기 정보가 기록되어 있음
    Failure Indicators: 파일 미존재 또는 빈 파일
    Evidence: .sisyphus/evidence/task-6-baseline-verify.txt
  ```

  **Commit**: NO (기록만, 코드 변경 없음)

- [x] 7. 스켈레턴 UI — 트레이너 뷰 적용

  **What to do**:
  - 트레이너 도메인 뷰에서 기존 `v-if="loading"` + "로딩 중..." 텍스트를 AppSkeleton 조합으로 교체
  - 대상 뷰 (데이터 fetch가 있는 뷰만):
    - `TrainerHomeView.vue` — 오늘 예약 리스트 + 회원 수 카드 스켈레턴
    - `TrainerScheduleView.vue` — 캘린더 + 예약 리스트 스켈레턴
    - `TrainerMemberView.vue` — 회원 목록 스켈레턴
    - `TrainerMemberDetailView.vue` — 프로필 + 메모 리스트 스켈레턴
    - `ReservationManageView.vue` — 예약 요청 리스트 스켈레턴
    - `TrainerChatView.vue` — 대화 목록 스켈레턴
    - `TrainerManualView.vue` — 매뉴얼 리스트 스켈레턴
    - `TodayWorkoutView.vue` — 운동 내용 스켈레턴
    - `MemberPaymentView.vue` — 결제 리스트 스켈레턴
    - `PtCountManageView.vue` — PT 이력 리스트 스켈레턴
  - 패턴: `<div v-if="loading">로딩 중...</div>` → `<div v-if="loading"><AppSkeleton type="..." /></div>`
  - AppSkeleton의 조합으로 각 뷰의 레이아웃에 맞는 스켈레턴 구성 (예: 리스트 = line×3, 프로필 = circle+line)

  **Must NOT do**:
  - 뷰별 전용 스켈레턴 컴포넌트 생성 금지
  - 데이터 fetch 로직 변경 금지
  - Login, Onboarding 뷰에 스켈레턴 적용 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 각 뷰의 레이아웃을 파악하고 적절한 스켈레턴 조합 결정 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8, 9, 10, 11, 12, 13)
  - **Blocks**: Task 15
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/components/AppSkeleton.vue` — Task 1에서 생성한 스켈레턴 컴포넌트
  - `src/views/trainer/TrainerHomeView.vue` — 트레이너 홈 레이아웃 (loading 상태 패턴)
  - `src/views/trainer/TrainerMemberView.vue` — 회원 리스트 레이아웃
  - `src/views/trainer/TrainerChatView.vue` — 대화 목록 레이아웃

  **WHY Each Reference Matters**:
  - `AppSkeleton.vue`: 사용 가능한 props/타입 파악
  - 각 뷰 파일: 현재 loading 패턴 위치 + 레이아웃 구조 파악하여 적절한 스켈레턴 조합 결정

  **Acceptance Criteria**:
  - [ ] 10개 트레이너 뷰에서 "로딩 중" 텍스트 제거
  - [ ] 각 뷰에 AppSkeleton 조합 적용
  - [ ] `npm run build` → exit code 0

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 트레이너 홈 스켈레턴 표시
    Tool: Playwright
    Preconditions: dev server 실행, 트레이너 계정 로그인
    Steps:
      1. /trainer/home 접근
      2. 페이지 로딩 중 `.app-skeleton` 요소 존재 확인
      3. 데이터 로드 후 스켈레턴 사라지고 실제 콘텐츠 표시 확인
    Expected Result: 로딩 시 스켈레턴, 완료 시 실제 데이터
    Failure Indicators: "로딩 중" 텍스트 잔존 또는 스켈레턴 미표시
    Evidence: .sisyphus/evidence/task-7-trainer-home-skeleton.png

  Scenario: "로딩 중" 텍스트 완전 제거 확인
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -rc '로딩 중' src/views/trainer/ 실행
      2. 결과가 0인지 확인
    Expected Result: 0건
    Failure Indicators: 1건 이상
    Evidence: .sisyphus/evidence/task-7-no-loading-text.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): apply skeleton UI to trainer views`
  - Files: `src/views/trainer/*.vue`
  - Pre-commit: `npm run build`

- [x] 8. 스켈레턴 UI — 멤버 뷰 적용

  **What to do**:
  - 멤버 도메인 뷰에서 기존 로딩 텍스트를 AppSkeleton 조합으로 교체
  - 대상 뷰:
    - `MemberHomeView.vue` — 다음 예약 + PT 카운트 + 운동 카드 스켈레턴
    - `MemberScheduleView.vue` — 캘린더 + 예약 리스트 스켈레턴
    - `MemberReservationView.vue` — 슬롯 선택 영역 스켈레턴
    - `MemberChatView.vue` — 채팅 메시지 리스트 스켈레턴
    - `MemberManualView.vue` — 매뉴얼 카드 리스트 스켈레턴
    - `ManualDetailView.vue` — 매뉴얼 상세 콘텐츠 스켈레턴
    - `MemberMemoView.vue` — 메모 리스트 스켈레턴
    - `MemberPaymentHistoryView.vue` — 결제 이력 스켈레턴
    - `MemberWorkoutDetailView.vue` — 운동 상세 스켈레턴

  **Must NOT do**:
  - 뷰별 전용 스켈레턴 컴포넌트 생성 금지
  - 데이터 fetch 로직 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 레이아웃 파악 + 스켈레턴 조합 결정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 9, 10, 11, 12, 13)
  - **Blocks**: Task 15
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/components/AppSkeleton.vue` — Task 1에서 생성
  - `src/views/member/MemberHomeView.vue` — 멤버 홈 레이아웃
  - `src/views/member/MemberChatView.vue` — 채팅 레이아웃
  - `src/views/member/MemberManualView.vue` — 매뉴얼 리스트 레이아웃

  **WHY Each Reference Matters**:
  - 각 뷰의 loading 위치와 콘텐츠 구조 파악 → 적절한 스켈레턴 조합

  **Acceptance Criteria**:
  - [ ] 9개 멤버 뷰에서 "로딩 중" 텍스트 제거
  - [ ] 각 뷰에 AppSkeleton 조합 적용
  - [ ] `npm run build` → exit code 0

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 멤버 홈 스켈레턴 표시
    Tool: Playwright
    Preconditions: dev server 실행, 멤버 계정 로그인
    Steps:
      1. /member/home 접근 (또는 /home)
      2. 로딩 중 `.app-skeleton` 요소 존재 확인
      3. 완료 후 실제 콘텐츠 표시 확인
    Expected Result: 스켈레턴 → 실제 콘텐츠 전환
    Failure Indicators: "로딩 중" 잔존
    Evidence: .sisyphus/evidence/task-8-member-home-skeleton.png

  Scenario: "로딩 중" 텍스트 완전 제거 확인
    Tool: Bash
    Steps:
      1. grep -rc '로딩 중' src/views/member/ 실행
    Expected Result: 0건
    Evidence: .sisyphus/evidence/task-8-no-loading-text.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): apply skeleton UI to member views`
  - Files: `src/views/member/*.vue` (MemberHomeView.vue 포함)
  - Pre-commit: `npm run build`

- [x] 9. 스켈레턴 UI — 공통 뷰 적용

  **What to do**:
  - 공통/기타 도메인 뷰에서 로딩 텍스트를 AppSkeleton으로 교체
  - 대상 뷰:
    - `NotificationListView.vue` — 알림 리스트 스켈레턴
    - `InviteManageView.vue` — 초대 코드 + 최근 회원 스켈레턴
    - `InviteEnterView.vue` — 트레이너 정보 스켈레턴
    - `TrainerSearchView.vue` — 검색 결과 리스트 스켈레턴
    - `AccountManageView.vue` — 계정 정보 스켈레턴
    - `WorkTimeSettingView.vue` — 근무시간 테이블 스켈레턴

  **Must NOT do**:
  - LoginView, AuthCallbackView, RoleSelectView에 스켈레턴 적용 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 10, 11, 12, 13)
  - **Blocks**: Task 15
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/components/AppSkeleton.vue` — Task 1에서 생성
  - `src/views/common/NotificationListView.vue` — 알림 레이아웃
  - `src/views/invite/InviteManageView.vue` — 초대 관리 레이아웃

  **Acceptance Criteria**:
  - [ ] 6개 공통 뷰에서 "로딩 중" 텍스트 제거
  - [ ] `npm run build` → exit code 0

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 전체 "로딩 중" 텍스트 제거 확인
    Tool: Bash
    Steps:
      1. grep -rc '로딩 중' src/views/ | grep -v ':0$' 실행
    Expected Result: 0건 (전체 프로젝트에서)
    Evidence: .sisyphus/evidence/task-9-no-loading-text.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): apply skeleton UI to common and utility views`
  - Files: `src/views/common/*.vue`, `src/views/invite/*.vue`, `src/views/trainer/WorkTimeSettingView.vue`, `src/views/trainer/TrainerSearchView.vue`
  - Pre-commit: `npm run build`

- [x] 10. SVG 하드코딩 색상 정리

  **What to do**:
  - 18개 파일에서 54개 하드코딩된 SVG 색상을 `currentColor` + CSS 변수로 변환
  - 대상 패턴:
    - `stroke="#007AFF"` → `stroke="currentColor"` + 부모에 `color: var(--color-blue-primary)`
    - `stroke="#111111"` → `stroke="currentColor"` + 부모에 `color: var(--color-gray-900)`
    - `fill="#007AFF"` → `fill="currentColor"` (fill="none"은 예외로 유지)
    - `stroke="#FFFFFF"` → `stroke="currentColor"` + white 컨텍스트에서는 CSS로 제어
  - Playwright baseline 스크린샷과 비교하여 시각적 차이 없음 확인

  **Must NOT do**:
  - `fill="none"` 변경 금지 (SVG viewBox 배경)
  - SVG 디자인/크기 변경 금지
  - 외부 아이콘 라이브러리 도입 금지
  - SVG를 별도 아이콘 컴포넌트로 추출 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 18파일 54인스턴스의 정밀한 텍스트 치환 + CSS 조정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 11, 12, 13)
  - **Blocks**: F2
  - **Blocked By**: Task 3 (baseline 스크린샷 후 변경)

  **References**:

  **Pattern References**:
  - `src/assets/css/global.css` — 색상 변수 목록 (`--color-blue-primary`, `--color-gray-900` 등)
  - `src/views/trainer/TrainerHomeView.vue` — SVG 하드코딩 예시

  **Acceptance Criteria**:
  - [ ] `grep -r 'stroke="#\|fill="#' src/views/ src/components/ | grep -v 'fill="none"'` → 0건
  - [ ] `npm run build` → exit code 0
  - [ ] 시각적 차이 없음 (Playwright 스크린샷 비교)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 하드코딩 SVG 색상 0건 확인
    Tool: Bash
    Steps:
      1. grep -r 'stroke="#\|fill="#' src/views/ src/components/ | grep -v 'fill="none"' | wc -l
    Expected Result: 0
    Evidence: .sisyphus/evidence/task-10-svg-cleanup.txt

  Scenario: 시각적 회귀 없음 확인
    Tool: Playwright
    Steps:
      1. 주요 페이지 스크린샷 캡처
      2. Task 3 baseline과 비교
    Expected Result: 시각적 차이 없음 (아이콘 색상 동일)
    Evidence: .sisyphus/evidence/task-10-visual-regression/
  ```

  **Commit**: YES
  - Message: `refactor(svg): replace hard-coded colors with currentColor across 18 files`
  - Files: 18개 뷰/컴포넌트 파일
  - Pre-commit: `npm run build`

- [x] 11. CSS 하드코딩 색상 정리

  **What to do**:
  - CSS 파일(.css, `<style>` 블록) 내 하드코딩된 색상값을 CSS 변수로 변환
  - 대상 패턴 (예시):
    - `background-color: #FFE5E5` → `background-color: var(--color-red-light)` (필요시 global.css에 추가)
    - `color: #007AFF` → `color: var(--color-blue-primary)`
    - `background: #d0e8ff` → `background: var(--color-blue-light)`
    - `border-color: #EEEEEE` → `border-color: var(--color-gray-200)`
  - 기존 global.css에 변수가 없는 색상은 최소한으로만 추가 (파스텔 에러/성공 배경색 등)

  **Must NOT do**:
  - box-shadow 내 rgba 값 변수화 금지
  - 새 CSS 변수 대량 생성 금지 (꼭 필요한 것만 최소 추가)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 다수 CSS 파일 정밀 검색 + 치환
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10, 12, 13)
  - **Blocks**: F2
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `src/assets/css/global.css` — 기존 색상 변수 전체 목록
  - `src/views/trainer/TrainerScheduleView.css` — 하드코딩 색상 예시 (#FFE5E5, #d0e8ff)

  **Acceptance Criteria**:
  - [ ] CSS 파일 내 하드코딩 hex 색상 0건 (rgba/box-shadow 제외)
  - [ ] `npm run build` → exit code 0
  - [ ] 시각적 차이 없음

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: CSS 하드코딩 색상 0건
    Tool: Bash
    Steps:
      1. grep -rn '#[0-9A-Fa-f]\{3,6\}' src/views/**/*.css src/views/**/*.vue --include="*.css" | grep -v 'rgba\|box-shadow\|fill="none"' | wc -l
    Expected Result: 0
    Evidence: .sisyphus/evidence/task-11-css-colors.txt
  ```

  **Commit**: YES
  - Message: `refactor(css): replace hard-coded colors with CSS variables`
  - Files: CSS 파일들 + `src/assets/css/global.css`
  - Pre-commit: `npm run build`

- [x] 12. CSS px → 변수 변환 (제한 범위)

  **What to do**:
  - 기존 CSS 변수로 직접 대체 가능한 하드코딩 px만 변환:
    - `padding: 20px` / `margin: 0 20px` → `var(--side-margin)`
    - `border-radius: 16px` → `var(--radius-large)`
    - `border-radius: 12px` → `var(--radius-medium)`
    - `border-radius: 8px` → `var(--radius-small)`
    - `gap: 28px` → `var(--spacing-section)`
    - `gap: 14px` → `var(--spacing-item)`
    - `font-size` 값 → `var(--fs-*)` (이미 대부분 적용됨, 누락분만)
  - **새 CSS 변수 생성하지 않음** — 기존 변수 매핑만

  **Must NOT do**:
  - 컴포넌트 고유 크기 변수화 금지 (아바타 48px, dot 6px 등)
  - 새 CSS 변수 생성 금지
  - box-shadow px 변수화 금지
  - height, width의 고유 값 변수화 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 다수 파일에서 패턴 검색 + 안전한 치환
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10, 11, 13)
  - **Blocks**: F2
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `src/assets/css/global.css` — 모든 spacing/radius/typography 변수 정의

  **Acceptance Criteria**:
  - [ ] padding/margin 20px → `var(--side-margin)` 변환 완료
  - [ ] border-radius 16/12/8px → `var(--radius-*)` 변환 완료
  - [ ] `npm run build` → exit code 0
  - [ ] 시각적 차이 없음

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 대체 가능한 px 하드코딩 감소 확인
    Tool: Bash
    Steps:
      1. grep -rc 'padding.*20px\|margin.*20px' src/views/ | awk -F: '{sum += $2} END {print sum}'
      2. grep -rc 'border-radius.*16px\|border-radius.*12px\|border-radius.*8px' src/views/ | awk -F: '{sum += $2} END {print sum}'
    Expected Result: 두 결과 모두 0 또는 최소
    Evidence: .sisyphus/evidence/task-12-px-cleanup.txt
  ```

  **Commit**: YES
  - Message: `refactor(css): replace hard-coded px with CSS variables (spacing, radius)`
  - Files: CSS 파일들
  - Pre-commit: `npm run build`

- [x] 13. 직접 Supabase 호출 정리 (2개 뷰)

  **What to do**:
  - `MemberProfileView.vue` — 직접 Supabase 호출을 `useProfile` 컴포저블로 이동
  - `AccountManageView.vue` — 직접 Supabase 호출을 적절한 컴포저블로 이동
  - Auth 관련 뷰 6개(LoginView, EmailLoginView, DevLoginView, PasswordResetView, PasswordUpdateView, AuthCallbackView)는 현상 유지 (합리적 예외)

  **Must NOT do**:
  - Auth 관련 뷰 6개 수정 금지
  - 새 컴포저블 생성 금지 (기존 useProfile 활용)
  - 기능 변경 금지 (리팩토링만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2개 뷰의 단순 리팩토링
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10, 11, 12)
  - **Blocks**: F4
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/views/onboarding/MemberProfileView.vue` — 수정 대상 (직접 supabase import)
  - `src/views/common/AccountManageView.vue` — 수정 대상
  - `src/composables/useProfile.js` — Supabase 호출 이동 목적지

  **WHY Each Reference Matters**:
  - 두 뷰 파일: 어떤 Supabase 호출이 있는지 파악 → useProfile에 동등 함수 추가/사용

  **Acceptance Criteria**:
  - [ ] MemberProfileView에서 `supabase` direct import 제거
  - [ ] AccountManageView에서 `supabase` direct import 제거
  - [ ] `npm test` → 기존 테스트 통과
  - [ ] `npm run build` → exit code 0

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 직접 Supabase 호출 제거 확인
    Tool: Bash
    Steps:
      1. grep -l "from.*supabase" src/views/onboarding/MemberProfileView.vue src/views/common/AccountManageView.vue
    Expected Result: 0건 (두 파일 모두 supabase import 없음)
    Evidence: .sisyphus/evidence/task-13-supabase-direct.txt

  Scenario: 기능 동작 확인
    Tool: Playwright
    Steps:
      1. 멤버 프로필 생성 플로우 테스트
      2. 계정 관리 페이지 접근 + 기본 동작 확인
    Expected Result: 기존과 동일한 동작
    Evidence: .sisyphus/evidence/task-13-functional.png
  ```

  **Commit**: YES
  - Message: `refactor(views): move direct Supabase calls to composables in 2 views`
  - Files: `src/views/onboarding/MemberProfileView.vue`, `src/views/common/AccountManageView.vue`, `src/composables/useProfile.js`
  - Pre-commit: `npm test`

- [x] 14. useConnection 테스트 + 기존 테스트 Edge Case 보강

  **What to do**:
  - `src/composables/__tests__/useConnection.test.js` 신규 작성
    - 연결 상태 확인 (active/pending/disconnected)
    - 미연결 시 동작
    - 에러 핸들링
  - 기존 15개 테스트 파일 검토 후 edge case 보강:
    - 빈 데이터 반환 시 처리
    - 네트워크 에러 시 error ref 설정
    - null/undefined 입력값 처리
    - 각 테스트 파일에 최소 1개 edge case 추가
  - Supabase 클라이언트 mock 패턴은 기존 테스트 파일 참고

  **Must NOT do**:
  - 뷰 컴포넌트 단위 테스트 작성 금지
  - 새로운 테스트 프레임워크/라이브러리 추가 금지
  - 기존 테스트 삭제/재작성 금지 (추가만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 15개 테스트 파일 분석 + edge case 식별 + 신규 테스트 작성
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 15, 16, 17, 18)
  - **Blocks**: F2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/composables/__tests__/useChat.test.js` — Supabase mock 패턴 + 테스트 구조
  - `src/composables/__tests__/useReservations.test.js` — CRUD 테스트 패턴
  - `src/composables/useConnection.js` — 테스트 대상 (연결 상태 확인 유틸리티)

  **WHY Each Reference Matters**:
  - 기존 테스트 파일: mock 패턴, describe/it 구조, assertion 스타일 파악 → 일관성 유지
  - `useConnection.js`: 어떤 함수/상태를 테스트해야 하는지 파악

  **Acceptance Criteria**:
  - [ ] `src/composables/__tests__/useConnection.test.js` 존재
  - [ ] `npm test` → 모든 테스트 통과 (기존 + 신규)
  - [ ] 총 테스트 수 증가 (before > after 기록)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 전체 테스트 통과
    Tool: Bash
    Steps:
      1. npm test 실행
      2. 결과 확인 — 통과/실패/건너뜀 수
    Expected Result: 0 failed, 모든 테스트 통과
    Evidence: .sisyphus/evidence/task-14-test-results.txt

  Scenario: useConnection 테스트 존재 확인
    Tool: Bash
    Steps:
      1. test -f src/composables/__tests__/useConnection.test.js && echo "EXISTS"
    Expected Result: EXISTS
    Evidence: .sisyphus/evidence/task-14-connection-test.txt
  ```

  **Commit**: YES
  - Message: `test(unit): add useConnection tests and edge case coverage for existing composables`
  - Files: `src/composables/__tests__/useConnection.test.js`, 기존 테스트 파일들
  - Pre-commit: `npm test`

- [x] 15. E2E 핵심 플로우 테스트 작성

  **What to do**:
  - `tests/e2e/` 디렉토리에 5개 핵심 시나리오 작성:
    1. `login-flow.spec.js` — EmailLoginView (`/email-login`)로 로그인 → 역할별 홈 도달 확인
    2. `trainer-home.spec.js` — 트레이너 홈 로딩 → 스켈레턴 표시 → 콘텐츠 로드
    3. `member-home.spec.js` — 멤버 홈 로딩 → PT 카운트 표시 → 채팅 이동
    4. `navigation.spec.js` — BottomNav 탭 이동 → 각 페이지 도달 확인
    5. `chat-flow.spec.js` — 채팅 페이지 접근 → 대화 목록 표시 → 메시지 전송
  - 모든 테스트에서 EmailLoginView (`/email-login`) 활용 인증 우회
  - 480px viewport (모바일 레이아웃)
  - 각 테스트에 스크린샷 캡처

  **Must NOT do**:
  - Kakao OAuth 자동화 시도 금지
  - 모든 CRUD 시나리오 E2E 커버 금지 (핵심 플로우만)
  - 10개 이상 시나리오 작성 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: E2E 테스트 설계 + Playwright API 활용
  - **Skills**: [`playwright`]
    - `playwright`: E2E 테스트 작성 전문

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 14, 16, 17, 18)
  - **Blocks**: F3
  - **Blocked By**: Tasks 3, 7, 8, 9

  **References**:

  **Pattern References**:
  - `tests/e2e/smoke.spec.js` — Task 3에서 생성한 기본 테스트 패턴
  - `tests/e2e/auth.setup.js` — Task 3에서 생성한 인증 헬퍼
  - `playwright.config.js` — Task 3에서 생성한 설정
  - `src/views/login/EmailLoginView.vue` — E2E 인증 경로 (`/email-login`)

  **Acceptance Criteria**:
  - [ ] `tests/e2e/` 에 5개 spec 파일 존재
  - [ ] `npx playwright test` → 모든 E2E 테스트 통과
  - [ ] 각 테스트에서 스크린샷 캡처

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: E2E 전체 통과
    Tool: Bash
    Preconditions: dev server 실행
    Steps:
      1. npx playwright test 실행
      2. 결과 확인
    Expected Result: 5개 시나리오 전부 통과
    Failure Indicators: 1개 이상 실패
    Evidence: .sisyphus/evidence/task-15-e2e-results.txt

  Scenario: E2E 스크린샷 존재
    Tool: Bash
    Steps:
      1. ls tests/e2e/screenshots/ 또는 test-results/
      2. 스크린샷 파일 수 확인
    Expected Result: 5개 이상 스크린샷
    Evidence: .sisyphus/evidence/task-15-screenshots/
  ```

  **Commit**: YES
  - Message: `test(e2e): add 5 core flow E2E scenarios with Playwright`
  - Files: `tests/e2e/*.spec.js`
  - Pre-commit: `npx playwright test`

- [x] 16. fetchConversations 페이지네이션 개선 검토

  **What to do**:
  - `useChat.js`의 `fetchConversations()` 분석 — 현재 `.limit(500)` 설정
  - 대화가 많은 트레이너의 경우 500개 메시지를 클라이언트에서 그룹화
  - 개선 옵션 분석:
    - Option A: Supabase RPC 함수로 서버사이드 그룹화 (DB에서 최근 메시지만 반환)
    - Option B: 현재 방식 유지 + limit을 더 합리적인 값으로 조정
    - Option C: 가상 스크롤/무한 스크롤 적용
  - 분석 결과를 `.sisyphus/evidence/task-16-pagination-analysis.md`에 기록
  - **가장 적합한 옵션 1개만 구현** (분석 결과에 따라)

  **Must NOT do**:
  - 과도한 아키텍처 변경 금지
  - 새로운 DB 테이블/뷰 생성 금지 (RPC는 허용)
  - 기존 채팅 기능 장애 유발 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 현재 구현 분석 + 대안 평가 + 최적 선택 구현
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 14, 15, 17, 18)
  - **Blocks**: F1
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/composables/useChat.js` — `fetchConversations()` 함수 (`.limit(500)` + 클라이언트 그룹화)
  - `supabase/schema.sql` — messages 테이블 구조 + 인덱스

  **WHY Each Reference Matters**:
  - `useChat.js`: 현재 쿼리 패턴 파악 — WHERE 조건, ORDER BY, 클라이언트 처리 로직
  - `schema.sql`: 인덱스 존재 여부 + RPC 작성 시 참고할 테이블 구조

  **Acceptance Criteria**:
  - [ ] `.sisyphus/evidence/task-16-pagination-analysis.md` 분석 보고서 존재
  - [ ] 선택된 옵션 구현 완료
  - [ ] `npm run build` → exit code 0
  - [ ] `npm test` → 기존 채팅 테스트 통과

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 채팅 기능 정상 동작
    Tool: Playwright
    Preconditions: dev server, 로그인 상태
    Steps:
      1. 채팅 페이지 접근
      2. 대화 목록 로딩 확인
      3. 기존 대화 클릭 → 메시지 표시 확인
    Expected Result: 대화 목록 + 메시지 정상 표시
    Evidence: .sisyphus/evidence/task-16-chat-functional.png

  Scenario: 분석 보고서 존재
    Tool: Bash
    Steps:
      1. test -f .sisyphus/evidence/task-16-pagination-analysis.md && echo "EXISTS"
    Expected Result: EXISTS
    Evidence: .sisyphus/evidence/task-16-report-check.txt
  ```

  **Commit**: YES (구현 변경이 있는 경우)
  - Message: `perf(chat): optimize fetchConversations pagination`
  - Files: `src/composables/useChat.js`
  - Pre-commit: `npm test`

- [x] 17. 에러 표시 패턴 통일

  **What to do**:
  - 모든 데이터 fetch 뷰에서 composable의 `error` ref를 글로벌 Toast로 표시하는 패턴 통일
  - 패턴: composable `error` ref → `watch(error, (e) => { if(e) showToast(e, 'error') })`
  - 현재 Toast가 없는 뷰들에 에러 표시 추가 (글로벌 Toast이므로 `<AppToast>` 추가 불필요)
  - 주요 대상 뷰: 데이터 fetch가 있지만 에러 표시가 없는 뷰들

  **Must NOT do**:
  - Vue errorHandler 글로벌 에러 바운더리 추가 금지
  - retry 로직 추가 금지
  - 에러 메시지 한글 번역 변경 금지 (기존 유지)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 다수 뷰에서 일관된 패턴 적용
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 14, 15, 16, 18)
  - **Blocks**: F3
  - **Blocked By**: Task 2 (글로벌 Toast 시스템)

  **References**:

  **Pattern References**:
  - `src/stores/toast.js` — Task 2에서 생성한 글로벌 Toast store
  - `src/composables/useToast.js` — showToast API
  - 기존 Toast 사용 뷰 중 하나 — 에러 표시 패턴 참고

  **Acceptance Criteria**:
  - [ ] 데이터 fetch가 있는 모든 뷰에서 error ref → Toast 연결
  - [ ] `npm run build` → exit code 0

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 에러 시 Toast 표시 확인
    Tool: Playwright
    Preconditions: dev server, 로그인 상태
    Steps:
      1. 네트워크 에러 상황 시뮬레이션 (오프라인 모드 또는 잘못된 요청)
      2. 데이터 로딩 뷰 접근
      3. `.app-toast` 에러 메시지 표시 확인
    Expected Result: 에러 Toast 표시
    Evidence: .sisyphus/evidence/task-17-error-toast.png

  Scenario: 빌드 성공
    Tool: Bash
    Steps:
      1. npm run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-17-build.txt
  ```

  **Commit**: YES
  - Message: `refactor(error): unify error display pattern with global toast across views`
  - Files: 다수 뷰 파일
  - Pre-commit: `npm run build`

- [x] 18. 기존 12개 뷰 Toast per-component → 글로벌 전환

  **What to do**:
  - 기존에 개별 `<AppToast>` 인스턴스를 사용하는 12개 뷰에서:
    - `<AppToast>` 컴포넌트 import 및 template 태그 제거
    - 로컬 Toast state 제거 (이미 useToast가 글로벌 store 사용하므로 호출은 유지)
    - useToast() 호출은 유지 (API 하위 호환)
  - 대상 뷰 식별: grep으로 `AppToast` import가 있는 뷰 검색

  **Must NOT do**:
  - Toast 기능/디자인 변경 금지
  - 새로운 Toast 타입 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 12개 파일에서 동일한 패턴 제거의 반복 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 14, 15, 16, 17)
  - **Blocks**: F3
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/composables/useToast.js` — Task 2에서 수정된 API (글로벌 store 기반)
  - AppToast를 사용하는 12개 뷰 (grep으로 식별)

  **Acceptance Criteria**:
  - [ ] `grep -rl 'AppToast' src/views/ | wc -l` → 0 (App.vue만 AppToast 사용)
  - [ ] `npm run build` → exit code 0
  - [ ] Toast 기능 정상 동작

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 뷰에서 AppToast import 제거 확인
    Tool: Bash
    Steps:
      1. grep -rl 'AppToast' src/views/ | wc -l
    Expected Result: 0
    Evidence: .sisyphus/evidence/task-18-toast-cleanup.txt

  Scenario: Toast 정상 동작 확인
    Tool: Playwright
    Steps:
      1. Toast를 트리거하는 액션 수행
      2. Toast 정상 표시 확인
    Expected Result: 글로벌 Toast 정상 동작
    Evidence: .sisyphus/evidence/task-18-toast-works.png
  ```

  **Commit**: YES
  - Message: `refactor(toast): remove per-component AppToast instances from 12 views`
  - Files: 12개 뷰 파일
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npm test`. Review all changed files for: hard-coded hex colors in SVG (should be 0), hard-coded px where CSS vars exist (should be 0), console.log in prod, commented-out code, unused imports. Check no new `as any` or `@ts-ignore`.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state via EmailLoginView (`/email-login`). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (skeleton + toast + error display working together). Test edge cases: empty state, invalid input, rapid navigation. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(ui): add AppSkeleton component` — AppSkeleton.vue
- **Wave 1**: `refactor(toast): convert to global toast system` — toast store + App.vue
- **Wave 1**: `test(e2e): add Playwright infrastructure` — playwright config + base tests
- **Wave 1**: `fix(auth): add subscription cleanup` — auth.js
- **Wave 1**: `feat(notifications): add realtime subscription` — notificationBadge.js
- **Wave 2**: `feat(ui): apply skeleton UI to trainer views` — trainer views
- **Wave 2**: `feat(ui): apply skeleton UI to member views` — member views
- **Wave 2**: `refactor(svg): replace hard-coded colors with currentColor` — 18 files
- **Wave 2**: `refactor(css): replace hard-coded colors with CSS variables` — CSS files
- **Wave 2**: `refactor(css): replace hard-coded px with CSS variables` — CSS files
- **Wave 3**: `test(unit): add useConnection tests + edge case coverage` — test files
- **Wave 3**: `test(e2e): add core flow E2E scenarios` — e2e test files
- **Wave 3**: `refactor(error): unify error display pattern` — views

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: exit code 0, no errors
npm test               # Expected: all tests pass
npx playwright test    # Expected: all E2E tests pass

# SVG hard-coded colors = 0
grep -r 'stroke="#\|fill="#' src/views/ src/components/ | grep -v 'fill="none"' | wc -l
# Expected: 0

# "로딩 중..." text = 0
grep -rc '로딩 중' src/views/ | grep -v ':0$' | wc -l  
# Expected: 0

# AppSkeleton exists
test -f src/components/AppSkeleton.vue && echo "EXISTS"
# Expected: EXISTS

# Global toast store exists
test -f src/stores/toast.js && echo "EXISTS"
# Expected: EXISTS

# Notification realtime subscription exists
grep -c 'subscribe' src/stores/notificationBadge.js
# Expected: ≥1
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All unit tests pass (`npm test`)
- [ ] All E2E tests pass (`npx playwright test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No visual regressions (Playwright screenshot comparison)
- [ ] Build size before/after recorded in evidence
