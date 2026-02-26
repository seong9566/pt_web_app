# PT 매니저 프론트엔드 — 로그인/온보딩/트레이너검색/초대코드 구현 플랜

## TL;DR

> **Quick Summary**: PT 매니저 앱의 프론트엔드를 Vue 3 + Vite로 초기화하고, UI 목업 기반 7개 화면(로그인/역할선택/트레이너프로필/회원프로필/트레이너검색/초대코드관리/초대코드입력)을 구현한다. 백엔드 연동 없이 정적 UI + 기본 인터랙션(카드 토글, 라우트 이동).
> 
> **Deliverables**:
> - Vue 3 + Vite 프로젝트 초기화 (package.json, vite.config.js, 폴더 구조)
> - CSS 디자인 시스템 (font_color_guide.md 기반 CSS 변수)
> - 7개 Vue 화면 컴포넌트 + 라우팅
> - 공통 컴포넌트 (BottomNav, AppButton, AppInput 등)
> - 하단 네비게이션 공통 레이아웃
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Tasks 4-8 (parallel) → Task 9 → F1-F4

---

## Context

### Original Request
docs/font_color_guide.md에 디자인 가이드를 작성하고, docs/ui/ 아래에 7개 UI 목업 이미지를 준비하여 개발 검토 요청.

### Interview Summary
**Key Discussions**:
- 로그인: 카카오 + 이메일 모두 구현 (목업 기준)
- 트레이너 검색: PRD 기준 (이름+전문분야만, 지역/경력/모집마감 제외)
- 개발 범위: UI 목업 7개 화면만
- 프로젝트 초기화 포함 (Vue 3 + Vite 5 + Pinia + Vue Router 4)
- 하단 네비게이션 바: 공통 레이아웃으로 구현 (로그인/온보딩 숨김)
- 기본 인터랙션 포함 (카드 선택 토글, 버튼 라우트 이동, 포커스 스타일)

**Research Findings**:
- 기존 프로젝트(dot_ment_web) 패턴 참고: Vue 3.4 + Vite 5 + Pinia 2.1.7 + Vue Router 4.2.5
- `<script setup>` + `<style scoped>` 패턴
- `@` alias, createWebHistory, lazy-load routes
- body flex center + #container max-width 패턴

### Metis Review
**Identified Gaps** (addressed):
- 이메일 로그인 후속 화면 → 버튼 UI만 표시, 클릭 시 "준비 중" 알림 또는 미구현 상태
- 프로그레스바 3단계 중 3번째 화면 부재 → 2단계(역할선택→프로필)로 유지, 완료 후 자동 이동
- 회원 운동목표 PRD(텍스트) vs 목업(칩) → 목업 기준 2×2 칩 선택
- 폰트 로딩 → 시스템 폰트 fallback 전략 (웹폰트 번들 제외)
- 하단 네비게이션 → 공통 레이아웃, 로그인/온보딩에서 숨김
- 인터랙션 수준 → 기본 인터랙션 포함

---

## Work Objectives

### Core Objective
UI 목업 7개 화면을 Vue 3로 구현하여 피그마 디자인이 코드로 옮겨진 프론트엔드 프로토타입을 만든다.

### Concrete Deliverables
- `pt_web_app/` 루트에 Vue 3 + Vite 프로젝트 초기화
- `src/assets/css/global.css` — 디자인 시스템 CSS 변수
- `src/components/` — 공통 컴포넌트 (BottomNav, AppButton, AppInput 등)
- `src/views/` — 7개 화면 Vue 컴포넌트
- `src/router/index.js` — 7개 라우트 정의

### Definition of Done
- [ ] `npm run dev` 실행 시 Vite dev server 정상 시작 (에러 없음)
- [ ] `npm run build` 실행 시 exit code 0, dist/ 폴더 생성
- [ ] 7개 라우트 모두 접근 가능 (Playwright 검증)
- [ ] 각 화면이 UI 목업과 시각적으로 일치 (스크린샷 대조)
- [ ] CSS 변수가 font_color_guide.md 값과 일치

### Must Have
- 프로젝트 초기화 (Vue 3 + Vite 5 + Pinia + Vue Router 4)
- 디자인 시스템 CSS 변수 (font_color_guide.md 기반)
- 7개 화면 모두 구현
- 하단 네비게이션 공통 레이아웃 (로그인/온보딩 숨김)
- 기본 인터랙션 (카드 토글, 라우트 이동, 포커스 스타일)
- 더미 데이터 (트레이너 목록, 회원 목록 등 하드코딩)
- 아이콘은 인라인 SVG로 구현

### Must NOT Have (Guardrails)
- 백엔드 API 호출 코드
- 카카오 OAuth SDK 실제 연동
- 이미지 업로드 실제 기능 (placeholder UI만)
- 폼 유효성 검사 로직
- 다크 모드
- i18n/다국어 지원
- 애니메이션/트랜지션 (페이지 전환 포함)
- 로딩 스피너/스켈레톤 UI
- 에러 바운더리/404 페이지
- PWA 설정 (manifest, service worker)
- SEO 메타 태그 최적화
- 환경 변수 (.env) 설정
- ESLint/Prettier 설정
- 단위 테스트 파일
- README.md 작성
- Pinia store에 실제 로직
- 7개 화면 외 추가 화면 (대시보드, 캘린더, 채팅 등)
- CSS 프레임워크 (Tailwind, SCSS, styled-components)
- 외부 아이콘 라이브러리
- 웹폰트 파일 번들
- axios, uuid 등 불필요한 의존성
- 목업에 없는 UI 요소 추가

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (신규 프로젝트)
- **Automated tests**: None (정적 UI 프로토타입)
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **프론트엔드/UI**: Playwright — 페이지 로드, DOM 요소 확인, CSS 속성 검증, 스크린샷
- **빌드/설정**: Bash — npm run dev/build 실행, exit code 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 프로젝트 초기화 + 디자인 시스템):
├── Task 1: Vue 3 프로젝트 초기화 + 기본 설정 [quick]
├── Task 2: 디자인 시스템 CSS 변수 + global.css [quick]
└── Task 3: 공통 컴포넌트 + 라우터 + 레이아웃 [unspecified-high]

Wave 2 (After Wave 1 — 7개 화면 병렬 구현):
├── Task 4: 로그인 랜딩 화면 [visual-engineering]
├── Task 5: 역할 선택 + 트레이너 프로필 화면 [visual-engineering]
├── Task 6: 회원 프로필 화면 [visual-engineering]
├── Task 7: 트레이너 찾기 화면 [visual-engineering]
└── Task 8: 초대코드 관리 + 초대코드 입력 화면 [visual-engineering]

Wave 3 (After Wave 2 — 통합 검증):
└── Task 9: 빌드 검증 + 전체 라우트 QA [unspecified-high]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: 플랜 준수 감사 (oracle)
├── Task F2: 코드 품질 리뷰 (unspecified-high)
├── Task F3: UI 목업 대조 QA (visual-engineering)
└── Task F4: 범위 충실도 확인 (deep)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2, 3 | 1 |
| 2 | 1 | 3, 4-8 | 1 |
| 3 | 1, 2 | 4-8 | 1 |
| 4 | 3 | 9 | 2 |
| 5 | 3 | 9 | 2 |
| 6 | 3 | 9 | 2 |
| 7 | 3 | 9 | 2 |
| 8 | 3 | 9 | 2 |
| 9 | 4, 5, 6, 7, 8 | F1-F4 | 3 |
| F1-F4 | 9 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1 → `quick`, T2 → `quick`, T3 → `unspecified-high`
- **Wave 2**: 5 tasks — T4-T8 → `visual-engineering` (load_skills: `['playwright', 'frontend-ui-ux']`)
- **Wave 3**: 1 task — T9 → `unspecified-high` (load_skills: `['playwright']`)
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `visual-engineering`, F4 → `deep`

---

## TODOs


- [ ] 1. Vue 3 프로젝트 초기화 + 기본 설정

  **What to do**:
  - `pt_web_app/` 루트에 Vue 3 프로젝트를 수동 초기화한다 (기존 docs/ 폴더 유지)
  - `package.json` 생성: name `pt-web-app`, type `module`, scripts (dev/build/preview)
  - 의존성 설치: `vue@^3.4.0`, `vue-router@^4.2.5`, `pinia@^2.1.7`
  - devDependencies: `vite@^5.0.0`, `@vitejs/plugin-vue@^5.0.0`
  - `vite.config.js` 생성: `@` alias (`path.resolve(__dirname, './src')`), host `0.0.0.0`, port `5173`
  - `index.html` 생성: `lang="ko"`, viewport meta tag, `<div id="app"></div>`, `<script type="module" src="/src/main.js">`
  - `src/main.js` 생성: createApp + createPinia + router + global.css import
  - `src/App.vue` 생성: `<router-view />` 포함, `<script setup>` 스타일
  - 폴더 구조 생성: `src/assets/css/`, `src/components/`, `src/router/`, `src/views/`, `src/stores/`
  - `npm install` 실행하여 의존성 설치
  - `npm run dev` 실행하여 Vite dev server 정상 시작 확인

  **Must NOT do**:
  - 기존 `docs/` 폴더 삭제 또는 이동 금지
  - axios, uuid, tailwind 등 불필요한 의존성 추가 금지
  - ESLint/Prettier 설정 금지 (이 단계에서)
  - HelloWorld.vue 등 보일러플레이트 파일 생성 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential first)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:
  - `../dot_ment_web/package.json` — 의존성 버전 참고 (Vue 3.4, Vite 5, Pinia 2.1.7, Vue Router 4.2.5)
  - `../dot_ment_web/vite.config.js` — `@` alias, host/port 설정 패턴
  - `../dot_ment_web/src/main.js` — createApp + createPinia + router 구성 패턴
  - `../dot_ment_web/src/App.vue` — `<script setup>` + `<router-view />` 패턴

  **Acceptance Criteria**:
  - [ ] `package.json` 존재, 의존성 버전 일치
  - [ ] `node_modules/` 존재 (npm install 완료)
  - [ ] `npm run dev` 실행 시 에러 없이 서버 시작
  - [ ] `npm run build` 실행 시 exit code 0

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 프로젝트 초기화 및 빌드 검증
    Tool: Bash
    Preconditions: pt_web_app/ 디렉토리에 프로젝트 파일 생성됨
    Steps:
      1. cd /Users/stecdev/Desktop/workspace/vue_project/pt_web_app && npm run build
      2. test -d dist && echo "BUILD_OK" || echo "BUILD_FAIL"
      3. ls dist/index.html
    Expected Result: build 성공, dist/index.html 존재
    Evidence: .sisyphus/evidence/task-1-build.txt
  ```

  **Commit**: YES
  - Message: `chore: initialize Vue 3 + Vite project`
  - Files: `package.json, vite.config.js, index.html, src/main.js, src/App.vue`

---

- [ ] 2. 디자인 시스템 CSS 변수 + global.css

  **What to do**:
  - `src/assets/css/global.css` 생성
  - `:root`에 `docs/font_color_guide.md`의 모든 CSS 변수 정의:
    ```css
    :root {
      /* Colors */
      --color-blue-primary: #007AFF;
      --color-blue-light: #E5F1FF;
      --color-white: #FFFFFF;
      --color-gray-100: #F2F4F7;
      --color-gray-900: #111111;
      --color-gray-600: #666666;
      --color-gray-200: #EEEEEE;
      --color-green: #34C759;
      --color-red: #FF3B30;
      --color-yellow: #FFCC00;
      /* Typography */
      --fs-display: 24px;
      --fs-title: 20px;
      --fs-subtitle: 18px;
      --fs-body1: 16px;
      --fs-body2: 14px;
      --fs-caption: 12px;
      /* Layout */
      --app-max-width: 480px;
      --side-margin: 20px;
      --btn-height: 52px;
      --radius-large: 16px;
      --radius-medium: 12px;
      --radius-small: 8px;
      --nav-height: 68px;
      --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    ```
  - body 스타일: flex center, min-height 100vh, margin 0, 시스템 폰트 fallback
  - `font-family: 'Apple SD Gothic Neo', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif;`
  - `#app` 컨테이너: max-width `var(--app-max-width)`, min-height 100vh, position relative, box-shadow
  - 공통 reset: box-sizing border-box, 링크 텍스트 장식 없음
  - `main.js`에서 `import './assets/css/global.css'` 확인

  **Must NOT do**:
  - dot_ment_web의 색상값(#8800BB 등) 복사 금지 — 반드시 font_color_guide.md 값만 사용
  - 웹폰트 파일(@font-face)을 번들에 포함 금지
  - CSS 프레임워크 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (Task 1 완료 후)
  - **Parallel Group**: Wave 1 (sequential after Task 1)
  - **Blocks**: Task 3, Tasks 4-8
  - **Blocked By**: Task 1

  **References**:
  - `docs/font_color_guide.md` — 색상, 타이포그래피, 컴포넌트 규격, 레이아웃 가이드의 **원본 값**
  - `../dot_ment_web/src/assets/css/global.css` — body/container 스타일링 패턴 참고 (값은 font_color_guide.md 사용)

  **Acceptance Criteria**:
  - [ ] `src/assets/css/global.css` 존재
  - [ ] `:root`에 font_color_guide.md의 모든 색상 변수 정의됨
  - [ ] 시스템 폰트 fallback 설정됨
  - [ ] `@font-face` 선언 없음 (웹폰트 번들 제외)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: CSS 변수 정의 검증
    Tool: Bash (grep)
    Preconditions: src/assets/css/global.css 존재
    Steps:
      1. grep -c "--color-blue-primary: #007AFF" src/assets/css/global.css → 1건
      2. grep -c "--color-gray-900: #111111" src/assets/css/global.css → 1건
      3. grep -c "--color-red: #FF3B30" src/assets/css/global.css → 1건
      4. grep -c "Apple SD Gothic Neo" src/assets/css/global.css → 1건 이상
      5. grep -c "@font-face" src/assets/css/global.css → 0건 (웹폰트 제외)
    Expected Result: 모든 변수 존재, 웹폰트 없음
    Evidence: .sisyphus/evidence/task-2-css-vars.txt
  ```

  **Commit**: NO (Task 3과 함께 커밋)

---

- [ ] 3. 공통 컴포넌트 + 라우터 + 레이아웃

  **What to do**:
  - **공통 컴포넌트** (`src/components/`):
    - `AppButton.vue` — 주요 버튼 (파란 배경/흰 텍스트, height 52px, border-radius 12px)
    - `AppInput.vue` — 입력 필드 (배경 #F2F4F7, 테두리 없음, padding 16px/14px, border-radius 12px)
    - `ProgressBar.vue` — 온보딩 프로그레스바 (2~3단계, 활성/비활성 표시)
    - `BottomNav.vue` — 하단 네비게이션 (홈/검색/일정/내정보, height 68px, 아이콘 24px)
  - **레이아웃** (`src/App.vue` 수정):
    - `<router-view />` 위치에서 현재 라우트가 로그인/온보딩인지 확인
    - 로그인/온보딩 라우트에서는 BottomNav 숨김
    - 나머지 라우트(검색, 초대코드)에서는 BottomNav 표시
  - **라우터** (`src/router/index.js`):
    ```js
    routes: [
      { path: '/', redirect: '/login' },
      { path: '/login', name: 'login', component: () => import('@/views/login/LoginView.vue'), meta: { hideNav: true } },
      { path: '/onboarding/role', name: 'role-select', component: () => import('@/views/onboarding/RoleSelectView.vue'), meta: { hideNav: true } },
      { path: '/onboarding/trainer-profile', name: 'trainer-profile', component: () => import('@/views/onboarding/TrainerProfileView.vue'), meta: { hideNav: true } },
      { path: '/onboarding/member-profile', name: 'member-profile', component: () => import('@/views/onboarding/MemberProfileView.vue'), meta: { hideNav: true } },
      { path: '/search', name: 'trainer-search', component: () => import('@/views/trainer/TrainerSearchView.vue') },
      { path: '/invite/manage', name: 'invite-manage', component: () => import('@/views/invite/InviteManageView.vue') },
      { path: '/invite/enter', name: 'invite-enter', component: () => import('@/views/invite/InviteEnterView.vue') },
    ]
    ```
  - 각 뷰 파일을 **빈 placeholder로 생성** (제목 텍스트만 포함하여 라우트 확인 가능하도록)
  - 모든 컴포넌트: `<script setup>` + `<style scoped>`
  - BottomNav 아이콘: 인라인 SVG로 구현

  **Must NOT do**:
  - 각 뷰에 상세 UI 구현 금지 (placeholder만 — Task 4-8에서 구현)
  - Pinia store 로직 구현 금지
  - 외부 아이콘 라이브러리 사용 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `['frontend-ui-ux']`

  **Parallelization**:
  - **Can Run In Parallel**: NO (Task 2 완료 후)
  - **Parallel Group**: Wave 1 (sequential after Task 2)
  - **Blocks**: Tasks 4, 5, 6, 7, 8
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `../dot_ment_web/src/router/index.js` — createWebHistory, lazy-load 패턴
  - `docs/font_color_guide.md` — 버튼 높이(52px), 입력창 스타일, 하단 네비 크기, border-radius 값
  - `docs/ui/image copy 4.png` — 하단 네비게이션 디자인 참고 (홈/검색/일정/내정보, 아이콘+레이블)

  **Acceptance Criteria**:
  - [ ] `src/components/AppButton.vue`, `AppInput.vue`, `ProgressBar.vue`, `BottomNav.vue` 존재
  - [ ] `src/router/index.js`에 7개 라우트 정의
  - [ ] 모든 라우트 접근 시 placeholder 텍스트 표시
  - [ ] `/login` 접근 시 BottomNav 숨겨짐
  - [ ] `/search` 접근 시 BottomNav 표시됨

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 라우트 접근 + BottomNav 표시/숨김 검증
    Tool: Playwright
    Preconditions: npm run dev 실행 중
    Steps:
      1. Navigate to http://localhost:5173/login
         Assert: 페이지 로드됨, BottomNav 없음 (data-testid="bottom-nav" 미존재)
      2. Navigate to http://localhost:5173/onboarding/role
         Assert: 페이지 로드됨, BottomNav 없음
      3. Navigate to http://localhost:5173/search
         Assert: 페이지 로드됨, BottomNav 존재 (data-testid="bottom-nav" 존재)
      4. Navigate to http://localhost:5173/invite/manage
         Assert: 페이지 로드됨, BottomNav 존재
    Expected Result: 로그인/온보딩에서 BottomNav 숨김, 나머지에서 표시
    Evidence: .sisyphus/evidence/task-3-routes.png (스크린샷)
  ```

  **Commit**: YES
  - Message: `feat: add design system, common components, router, and layout`
  - Files: `src/assets/css/global.css, src/components/*, src/router/index.js, src/views/**/*.vue`

- [ ] 4. 로그인 랜딩 화면

  **What to do**:
  - `src/views/login/LoginView.vue` 구현 (기존 placeholder 대체)
  - **상단 브랜딩 영역**: 은은한 파란 원형 배경 패턴 + 파란 덤벨 아이콘(둥근 사각형, 연한 그림자) + "PT 매니저" 제목 + 부제
  - **버튼 영역**: 카카오 로그인 버튼 (#FEE500 배경, 검정 말풀선 아이콘+텍스트), "또는" 구분선, 이메일 로그인 버튼 (흰색 배경+회색 테두리, 회색 봉투 아이콘)
  - **하단 푸터**: "시작하면 ... 동의합니다" + "이용약관"/"개인정보처리방침" 파란 링크
  - 카카오 버튼 클릭 시: `router.push('/onboarding/role')` (실제 OAuth 연동 없음)
  - 이메일 버튼 클릭 시: `alert('준비 중입니다')` 또는 미동작
  - 덤벨 아이콘은 인라인 SVG로 직접 그림
  - 목업 이미지 `docs/ui/image.png`을 참고하여 픽셀 수준 재현

  **Must NOT do**:
  - 카카오 OAuth SDK 실제 연동 금지
  - 이메일 로그인 화면/폼 구현 금지
  - 목업에 없는 UI 요소 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `['playwright', 'frontend-ui-ux']`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 3

  **References**:
  - `docs/ui/image.png` — 로그인 화면 UI 목업 (픽셀 수준 재현 기준)
  - `docs/font_color_guide.md` — Primary #007AFF, 버튼 52px, radius 12px
  - `src/components/AppButton.vue` — 공통 버튼 컴포넌트 사용 (또는 카카오/이메일은 커스텀 스타일)

  **Acceptance Criteria**:
  - [ ] "/login" 접근 시 화면 렌더링
  - [ ] "PT 매니저" 텍스트 표시
  - [ ] 카카오 버튼(#FEE500 배경) 표시
  - [ ] 이메일 버튼(흰색+테두리) 표시
  - [ ] 카카오 버튼 클릭 시 /onboarding/role로 이동

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 로그인 화면 시각적 검증
    Tool: Playwright
    Preconditions: npm run dev 실행 중
    Steps:
      1. Navigate to http://localhost:5173/login
      2. Assert: text "PT 매니저" visible
      3. Assert: text "카카오로 시작하기" visible
      4. Assert: text "이메일로 로그인" visible
      5. Assert: text "이용약관" visible
      6. Click "카카오로 시작하기" 버튼
      7. Assert: URL = /onboarding/role
      8. Screenshot 저장
    Expected Result: 모든 요소 표시, 카카오 버튼 클릭시 역할선택으로 이동
    Evidence: .sisyphus/evidence/task-4-login.png
  ```

  **Commit**: NO (Task 9에서 통합 커밋)

---

- [ ] 5. 역할 선택 + 트레이너 프로필 화면

  **What to do**:
  - `src/views/onboarding/RoleSelectView.vue` 구현 (목업: `docs/ui/image copy.png`)
    - 뒤로가기 화살표 + ProgressBar(step 1/2)
    - "어떤 역할로 사용하시겠어요?" 제목
    - "나중에 역할을 변경하려면..." 안내 문구
    - 트레이너 카드: 파란 덤벨 아이콘, "트레이너 (전문가용)", 설명 텍스트
    - 회원 카드: 회색 사람 아이콘, "회원 (일반 사용자용)", 설명 텍스트
    - 카드 선택 시 파란 테두리 하이라이트 토글 (기본 인터랙션)
    - "다음 →" 버튼 클릭 시: 트레이너 선택시 /onboarding/trainer-profile, 회원 선택시 /onboarding/member-profile
  - `src/views/onboarding/TrainerProfileView.vue` 구현 (목업: `docs/ui/image copy 2.png`)
    - 뒤로가기 + ProgressBar(step 2/2)
    - "트레이너 프로필을 완성해 주세요" 제목
    - 프로필 사진 업로드 영역 (점선 원형 + 카메라 아이콘 + 파란 편집 FAB)
    - 이름(활동명) AppInput ("예: 김헬스" placeholder, 사람 아이콘)
    - 전문 분야 2×2 그리드 (재활/교정, 근력 증가, 다이어트/식단, 스포츠 퍼포먼스) — 중복선택 토글
    - "완료 ✓" 버튼 클릭 시: `/search`로 이동 (더미 완료)

  **Must NOT do**:
  - 실제 이미지 업로드 기능 구현 금지 (placeholder UI만)
  - 폼 유효성 검사 로직 금지
  - Pinia store에 역할 상태 저장 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `['playwright', 'frontend-ui-ux']`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 3

  **References**:
  - `docs/ui/image copy.png` — 역할 선택 화면 목업
  - `docs/ui/image copy 2.png` — 트레이너 프로필 화면 목업
  - `src/components/ProgressBar.vue` — 프로그레스바 컴포넌트 사용
  - `src/components/AppButton.vue` — "다음"/"완료" 버튼 사용
  - `src/components/AppInput.vue` — 이름 입력필드 사용

  **Acceptance Criteria**:
  - [ ] /onboarding/role 접근 시 역할 선택 화면 렌더링
  - [ ] 트레이너/회원 카드 선택 시 파란 테두리 토글
  - [ ] "다음" 버튼 클릭 시 역할에 따른 라우트 이동
  - [ ] /onboarding/trainer-profile 접근 시 트레이너 프로필 화면 렌더링
  - [ ] 전문분야 4개 카드 선택 토글 동작

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 역할 선택 화면 인터랙션 검증
    Tool: Playwright
    Preconditions: npm run dev 실행 중
    Steps:
      1. Navigate to http://localhost:5173/onboarding/role
      2. Assert: text "어떤 역할로" visible
      3. Assert: "트레이너" 카드와 "회원" 카드 visible
      4. Click "트레이너" 카드 → Assert: 파란 테두리 하이라이트
      5. Click "다음" 버튼
      6. Assert: URL = /onboarding/trainer-profile
      7. Screenshot 저장
    Expected Result: 카드 선택 토글, 다음 버튼으로 트레이너 프로필로 이동
    Evidence: .sisyphus/evidence/task-5-role-select.png

  Scenario: 트레이너 프로필 화면 검증
    Tool: Playwright
    Preconditions: npm run dev 실행 중
    Steps:
      1. Navigate to http://localhost:5173/onboarding/trainer-profile
      2. Assert: text "트레이너 프로필" visible
      3. Assert: 전문분야 4개 카드("재활", "근력", "다이어트", "스포츠") visible
      4. Click "재활" 카드 → Assert: 선택 상태 토글
      5. Click "근력" 카드 → Assert: 다중 선택 가능
      6. Screenshot 저장
    Expected Result: 전문분야 다중선택 토글 동작
    Evidence: .sisyphus/evidence/task-5-trainer-profile.png
  ```

  **Commit**: NO (Task 9에서 통합 커밋)

---

- [ ] 6. 회원 프로필 화면

  **What to do**:
  - `src/views/onboarding/MemberProfileView.vue` 구현 (목업: `docs/ui/image copy 3.png`)
    - 뒤로가기 + "프로필 입력" 제목 (상단 네비게이션 바)
    - 프로필 사진 업로드 (원형 placeholder + 카메라 아이콘)
    - **기본 정보** 섹션: 이름(AppInput, "홍길동" placeholder) + 연락처(AppInput, "010-0000-0000" placeholder)
    - **신체 정보** 섹션: 3열 배치 — 나이("세" suffix), 키("cm" suffix), 몸무게("kg" suffix)
    - **운동 목표** 섹션: 2×2 그리드 (체중 감량, 근력 증가, 체력 증진, 바디 프로필) — 토글 선택
    - **부상 및 특이사항**: 큰 텍스트 영역 ("허리 디스크, 관절 통증..." placeholder)
    - "작성 완료 ✓" 버튼 클릭 시: `/search`로 이동

  **Must NOT do**:
  - 실제 이미지 업로드 기능 금지
  - 폼 유효성 검사 로직 금지
  - 운동목표를 텍스트 입력으로 변경 금지 (목업 기준 2×2 칩 선택)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `['playwright', 'frontend-ui-ux']`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 3

  **References**:
  - `docs/ui/image copy 3.png` — 회원 프로필 화면 목업 (픽셀 수준 재현 기준)
  - `src/components/AppInput.vue` — 입력필드 컴포넌트 사용
  - `src/components/AppButton.vue` — "작성 완료" 버튼 사용

  **Acceptance Criteria**:
  - [ ] /onboarding/member-profile 접근 시 화면 렌더링
  - [ ] 기본정보/신체정보/운동목표/부상 섹션 모두 표시
  - [ ] 신체정보 3열(나이/키/몸무게) 배치
  - [ ] 운동목표 4개 칩 토글 동작
  - [ ] "작성 완료" 클릭 시 /search로 이동

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 회원 프로필 화면 검증
    Tool: Playwright
    Preconditions: npm run dev 실행 중
    Steps:
      1. Navigate to http://localhost:5173/onboarding/member-profile
      2. Assert: text "프로필 입력" visible
      3. Assert: text "기본 정보" visible
      4. Assert: text "신체 정보" visible
      5. Assert: text "운동 목표" visible
      6. Assert: 체중 감량/근력 증가/체력 증진/바디 프로필 4개 칩 visible
      7. Click "체중 감량" 칩 → Assert: 선택 상태 토글
      8. Click "작성 완료" 버튼 → Assert: URL = /search
      9. Screenshot 저장
    Expected Result: 모든 섹션 표시, 칩 선택 토글, 작성완료 클릭시 이동
    Evidence: .sisyphus/evidence/task-6-member-profile.png
  ```

  **Commit**: NO (Task 9에서 통합 커밋)

- [ ] 7. 트레이너 찾기 화면

  **What to do**:
  - `src/views/trainer/TrainerSearchView.vue` 구현 (목업: `docs/ui/image copy 4.png`, 단 PRD 기준 수정)
    - 상단: 뒤로가기 + "PT 트레이너 찾기" 제목 + 필터 아이콘
    - 검색바: 회색 배경, pill shape, 돋보기 아이콘 + "이름 검색" placeholder (지역 검색 제외 — PRD 기준)
    - 트레이너 카드 리스트 (더미 3~4명):
      - 각 카드: 정사각형 프로필 이미지 + 이름 + 전문분야 태그 (지역/경력 제외)
      - "연동 요청하기" 파란 버튼 또는 "프로필 보기" 흰색 버튼
      - 모집 마감 상태 제외 (PRD 기준)
    - 하단: BottomNav 표시 ("검색" 탭 활성)
    - 더미 데이터 하드코딩 (이름/전문분야/이미지 placeholder)

  **Must NOT do**:
  - 지역/경력/모집마감 표시 금지 (PRD 기준)
  - 검색 필터링 로직 구현 금지 (정적 더미 데이터만)
  - API 호출 코드 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `['playwright', 'frontend-ui-ux']`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 3

  **References**:
  - `docs/ui/image copy 4.png` — 트레이너 검색 화면 목업 (단, 지역/경력/모집마감은 PRD 기준 제외)
  - `docs/font_color_guide.md` — 카드 Shadow, 검색바 스타일
  - `src/components/BottomNav.vue` — 하단 네비게이션 ("검색" 탭 활성 상태)

  **Acceptance Criteria**:
  - [ ] /search 접근 시 화면 렌더링
  - [ ] 검색바 + 트레이너 카드 3~4개 표시
  - [ ] 카드에 지역/경력/모집마감 없음
  - [ ] 하단 BottomNav 표시, 검색 탭 활성

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 트레이너 검색 화면 검증
    Tool: Playwright
    Preconditions: npm run dev 실행 중
    Steps:
      1. Navigate to http://localhost:5173/search
      2. Assert: text "PT 트레이너 찾기" visible
      3. Assert: 검색바 존재 (input[placeholder*="검색"])
      4. Assert: 트레이너 카드 3개 이상 visible
      5. Assert: text "지역" NOT visible (제외 확인)
      6. Assert: text "경력" NOT visible (제외 확인)
      7. Assert: text "모집 마감" NOT visible (제외 확인)
      8. Assert: data-testid="bottom-nav" visible
      9. Screenshot 저장
    Expected Result: 카드 리스트 표시, PRD 기준 제외 항목 없음
    Evidence: .sisyphus/evidence/task-7-trainer-search.png
  ```

  **Commit**: NO (Task 9에서 통합 커밋)

---

- [ ] 8. 초대코드 관리 + 초대코드 입력 화면

  **What to do**:
  - `src/views/invite/InviteManageView.vue` 구현 (목업: `docs/ui/image copy 5.png`)
    - 뒤로가기 + "초대 코드 관리" 제목
    - QR코드 아이콘 (파란 배경 사각형) + 안내 문구 2줄
    - 초대 코드 카드: "PT24K9" 큰 관씨 + 파란 밑줄 + 코드 복사/링크 공유 버튼
    - 카카오톡 초대장 보내기 배너 (#FEE500 배경, 말풀선 아이콘)
    - 최근 연결된 회원 리스트 (더미 2~3명, 프로필 placeholder + 이름 + 가입일)
    - 하단: BottomNav 표시
  - `src/views/invite/InviteEnterView.vue` 구현 (목업: `docs/ui/image copy 6.png`)
    - 뒤로가기 + "초대 코드 입력" 제목
    - 연결 아이콘 (파란 배경 사각형) + 안내 텍스트 2줄
    - 6자리 코드 입력 필드 (개별 박스 6개, 회색 테두리, "-" placeholder)
    - "코드 확인" 버튼 (회색 pill, 체크마크 아이콘)
    - "연결 확정" 버튼 (파란 배경, 하단 고정)
    - 하단: BottomNav 표시

  **Must NOT do**:
  - 실제 코드 생성/복사/공유 기능 구현 금지 (UI만)
  - 카카오톡 SDK 연동 금지
  - 코드 유효성 검사 로직 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `['playwright', 'frontend-ui-ux']`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6, 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 3

  **References**:
  - `docs/ui/image copy 5.png` — 초대코드 관리 화면 목업
  - `docs/ui/image copy 6.png` — 초대코드 입력 화면 목업
  - `src/components/AppButton.vue` — 버튼 컴포넌트 사용
  - `src/components/BottomNav.vue` — 하단 네비게이션

  **Acceptance Criteria**:
  - [ ] /invite/manage 접근 시 초대코드 관리 화면 렌더링
  - [ ] "PT24K9" 코드 표시
  - [ ] 카카오톡 배너(#FEE500) 표시
  - [ ] /invite/enter 접근 시 코드 입력 화면 렌더링
  - [ ] 6개 코드 입력 박스 표시

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 초대코드 관리 화면 검증
    Tool: Playwright
    Preconditions: npm run dev 실행 중
    Steps:
      1. Navigate to http://localhost:5173/invite/manage
      2. Assert: text "초대 코드 관리" visible
      3. Assert: text "PT24K9" visible
      4. Assert: text "카카오톡" visible
      5. Assert: 최근 연결 회원 리스트 존재
      6. Screenshot 저장
    Expected Result: 모든 요소 표시
    Evidence: .sisyphus/evidence/task-8-invite-manage.png

  Scenario: 초대코드 입력 화면 검증
    Tool: Playwright
    Preconditions: npm run dev 실행 중
    Steps:
      1. Navigate to http://localhost:5173/invite/enter
      2. Assert: text "초대 코드 입력" visible
      3. Assert: 6개 input 박스 존재 (input[maxlength="1"] 또는 유사)
      4. Assert: text "코드 확인" visible
      5. Assert: text "연결 확정" visible
      6. Screenshot 저장
    Expected Result: 6자리 입력 + 버튼 2개 표시
    Evidence: .sisyphus/evidence/task-8-invite-enter.png
  ```

  **Commit**: NO (Task 9에서 통합 커밋)

---

- [ ] 9. 빌드 검증 + 전체 라우트 QA

  **What to do**:
  - `npm run build` 실행하여 빌드 성공 확인 (exit code 0, dist/ 생성)
  - Playwright로 7개 라우트 전체 접근 테스트:
    1. /login → "PT 매니저" 표시, BottomNav 없음
    2. /onboarding/role → "어떤 역할로" 표시, BottomNav 없음
    3. /onboarding/trainer-profile → "트레이너 프로필" 표시
    4. /onboarding/member-profile → "프로필 입력" 표시
    5. /search → "트레이너 찾기" 표시, BottomNav 있음
    6. /invite/manage → "초대 코드" 표시, BottomNav 있음
    7. /invite/enter → "초대 코드 입력" 표시
  - 각 화면 스크린샷 캐철 (390×844 뷰포트)
  - CSS 변수 검증: Primary color, font-family 확인
  - 문제 발견 시 직접 수정

  **Must NOT do**:
  - 새로운 화면 추가 금지
  - 빌드 성공을 위해 기능 삭제 금지 (수정만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `['playwright']`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Wave 2)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 4, 5, 6, 7, 8

  **References**:
  - `docs/ui/*.png` — 7개 UI 목업 이미지 (390×844 뷰포트로 대조)
  - `docs/font_color_guide.md` — CSS 변수 값 검증 기준

  **Acceptance Criteria**:
  - [ ] `npm run build` exit code 0
  - [ ] 7개 라우트 모두 접근 가능
  - [ ] 각 화면 스크린샷 캐철 완료
  - [ ] BottomNav 표시/숨김 정상 동작

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 빌드 + 전체 라우트 검증
    Tool: Bash + Playwright
    Preconditions: 모든 화면 구현 완료
    Steps:
      1. npm run build → exit code 0 확인
      2. npm run dev 실행
      3. Playwright: 7개 URL 순회 → 각각 핵심 텍스트 확인
      4. Viewport 390×844로 각 화면 스크린샷
      5. CSS 변수 검증: primary color = rgb(0, 122, 255)
    Expected Result: 빌드 성공, 7개 라우트 정상, CSS 일치
    Evidence: .sisyphus/evidence/task-9-build.txt, .sisyphus/evidence/task-9-screenshots/
  ```

  **Commit**: YES
  - Message: `feat: implement 7 onboarding screens (login, role, profiles, search, invite)`
  - Files: `src/views/**/*.vue`

---

## Final Verification Wave

- [ ] F1. **플랜 준수 감사** — `oracle`
  플랜의 모든 "Must Have"가 구현되었는지 확인. 각 화면 라우트 접근 가능 여부, CSS 변수 적용 확인, "Must NOT Have" 항목 grep 검색. 
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Routes [7/7] | VERDICT: APPROVE/REJECT`

- [ ] F2. **코드 품질 리뷰** — `unspecified-high`
  `npm run build` 성공 확인. 모든 Vue 파일에서: `<script setup>` 사용 확인, `<style scoped>` 사용 확인, console.log 제거, 미사용 import 없음, `as any` / `@ts-ignore` 없음. CSS 변수가 font_color_guide.md 값과 일치하는지 대조.
  Output: `Build [PASS/FAIL] | Vue Pattern [N clean/N issues] | CSS Vars [MATCH/MISMATCH] | VERDICT`

- [ ] F3. **UI 목업 대조 QA** — `visual-engineering` (skills: `['playwright', 'frontend-ui-ux']`)
  7개 화면 각각을 Playwright로 열고, docs/ui/ 목업 이미지와 시각적으로 대조. 레이아웃, 색상, 간격, 텍스트 내용이 목업과 일치하는지 확인. 각 화면 스크린샷 캡처하여 `.sisyphus/evidence/final-qa/` 저장.
  Output: `Screens [7/7 match] | Colors [MATCH/N issues] | Layout [MATCH/N issues] | VERDICT`

- [ ] F4. **범위 충실도 확인** — `deep`
  git diff로 모든 변경 파일 확인. 플랜에 없는 파일이 추가되지 않았는지, "Must NOT Have" 목록의 기능이 구현되지 않았는지 확인. 각 Task의 "What to do"와 실제 코드를 1:1 대조.
  Output: `Tasks [N/N compliant] | Scope Creep [CLEAN/N files] | Guardrails [CLEAN/N violations] | VERDICT`

---

## Commit Strategy

- **Task 1 완료 후**: `chore: initialize Vue 3 + Vite project` — package.json, vite.config.js, index.html, src/main.js, src/App.vue
- **Task 3 완료 후**: `feat: add design system, common components, router, and layout` — global.css, components/, router/, layouts/
- **Task 9 완료 후**: `feat: implement 7 onboarding screens (login, role, profiles, search, invite)` — views/

---

## Success Criteria

### Verification Commands
```bash
npm run dev          # Expected: Vite dev server starts without errors
npm run build        # Expected: exit code 0, dist/ folder created
```

### Final Checklist
- [ ] Vue 3 + Vite 프로젝트 정상 초기화
- [ ] 7개 라우트 모두 접근 가능
- [ ] CSS 변수 font_color_guide.md와 일치
- [ ] 각 화면이 UI 목업과 시각적 일치
- [ ] 하단 네비게이션 공통 레이아웃 동작
- [ ] 카드 선택 토글, 버튼 라우트 이동 등 기본 인터랙션 동작
- [ ] 빌드 성공 (npm run build)
- [ ] Must NOT Have 항목 모두 부재 확인
