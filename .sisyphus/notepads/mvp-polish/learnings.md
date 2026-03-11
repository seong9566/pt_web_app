# MVP Polish — Learnings

## Project Context
- Vue 3 + Vite + Pinia + Vue Router 4 + Supabase
- No TypeScript — plain JavaScript
- Mobile-first, max-width 480px
- BEM CSS naming, CSS custom properties
- `<script setup>` Composition API only
- `@/` alias for all imports

## Design Tokens (from global.css)
- Colors: --color-blue-primary #007AFF, --color-gray-100 #F2F4F7, --color-gray-200 #EEEEEE, --color-gray-600 #666666, --color-gray-900 #111111, --color-green #34C759, --color-red #FF3B30, --color-yellow #FFCC00, --color-white #FFFFFF, --color-blue-light #E5F1FF
- Spacing: --spacing-section 28px, --spacing-item 14px, --side-margin 20px, --nav-height 68px
- Radius: --radius-large 16px, --radius-medium 12px, --radius-small 8px
- Font sizes: --fs-display 24px, --fs-title 20px, --fs-subtitle 18px, --fs-body1 16px, --fs-body2 14px, --fs-caption 12px

## Existing Infrastructure
- AppToast + useToast: already 12 views use per-component pattern
- chatBadge.js: Realtime subscription pattern (subscribe/unsubscribe)
- 15/16 composable tests exist, useConnection missing
- EmailLoginView at /email-login for E2E auth bypass
- Vitest configured, tests in src/composables/__tests__/

## Task 17: Global Toast System Refactor (Completed)

### Implementation Pattern
- **Pinia Store**: `src/stores/toast.js` — Composition API style with `defineStore('toast', () => { ... })`
  - State: `message`, `type` ('info'|'success'|'error'), `visible`
  - Actions: `showToast(msg, type, duration)`, `hideToast()`
  - Auto-hide via `setTimeout` inside store (not in component)
- **Composable Wrapper**: `src/composables/useToast.js` — backward-compatible API
  - Exports: `showToast(msg, type, duration)`, `hideToast()`, `showError(msg)`, `showSuccess(msg)`
  - Internally calls `useToastStore()` — no per-component state
- **Component**: `src/components/AppToast.vue` — simplified to pure store subscriber
  - Removed props (`modelValue`, `message`, `duration`, `type`)
  - Removed watch/emit logic
  - Direct store subscription: `const toastStore = useToastStore()`
  - Renders `toastStore.visible`, `toastStore.message`, `toastStore.type`
- **Root Mount**: `src/App.vue` — single `<AppToast />` instance
  - Teleports to body, no per-view instances needed

### Key Decisions
1. **Store owns timer**: `_timer` in store prevents race conditions (multiple showToast calls)
2. **Backward compat**: `useToast()` API unchanged — existing 12 views work without modification
3. **Type mapping**: Store uses 'info'|'success'|'error'; AppToast maps to CSS classes
4. **No props**: AppToast is now a pure presentational component reading from store

### Testing Results
- `npm test`: 99 passed, 6 failed (pre-existing failures in useProfile, useInvite, useChat — unrelated)
- `npm run build`: ✓ Success, 314.38 kB gzipped

### Files Modified
- ✅ Created: `src/stores/toast.js` (51 lines)
- ✅ Updated: `src/composables/useToast.js` (23 lines, was 21)
- ✅ Updated: `src/components/AppToast.vue` (62 lines, was 85 — removed 23 lines of logic)
- ✅ Updated: `src/App.vue` (48 lines, added AppToast import + instance)

### Next: Task 18
Remove per-component `<AppToast>` instances from 12 views (they now use global instance).

## Task 15: Build Baseline Capture (Completed)

### Build Output Summary (2026-03-11)
- **Build Tool**: Vite 5.4.21
- **Modules Transformed**: 221
- **Build Time**: 1.37s
- **Output Directory**: dist/

### Bundle Composition
- **Main JS Bundle** (index-BUkagqNa.js): 313.90 kB uncompressed → 98.43 kB gzip (31.4% compression)
- **Total JS Chunks**: 87 files, ~550 kB uncompressed → ~175 kB gzip
- **Total CSS Chunks**: 49 files, ~250 kB uncompressed → ~50 kB gzip
- **HTML**: 0.39 kB

### Large Chunks Analysis
- ⚠️ **index-BUkagqNa.js (313.90 kB)**: Main vendor + app bundle
  - Contains: Vue 3, Pinia, Vue Router, Supabase client, all views, all composables
  - Gzip: 98.43 kB (acceptable for SPA)
  - No individual chunks exceed 500 kB threshold

### CSS Distribution
- Well-distributed across component-scoped files
- Largest CSS: TodayWorkoutView (11.76 kB), ReservationManageView (10.85 kB)
- All CSS chunks < 12 kB (good for lazy loading)

### Build Warnings
- Minor CSS syntax warnings in global.css (animation-duration-fast variable) — non-critical
- Router dynamic import warning (expected, no impact)

### Baseline File
- **Location**: `.sisyphus/evidence/build-baseline.txt`
- **Format**: Detailed chunk listing with gzip sizes, summary stats, large chunk warnings
- **Purpose**: Reference for Task 16 (pagination optimization) and future bundle analysis

### Key Metrics for Task 16
- Current main bundle: 313.90 kB (98.43 kB gzip)
- Pagination optimization target: Reduce main bundle by lazy-loading view components
- Potential savings: ~10-20% if heavy views (Chat, Schedule, Workout) are code-split

## [2026-03-11] Task 1: AppSkeleton 형식
- `src/components/AppSkeleton.vue` 신규 생성, `<script setup>` + `defineProps()` 패턴으로 범용 스켈레턴 구현
- type 변형(`line`/`circle`/`rect`)과 `count` 반복 렌더링(v-for) 지원, 기본 높이는 type별로 line 16px / circle 48px / rect 120px 적용
- `borderRadius` 미지정 시 type별 기본 반경(line `var(--radius-small)`, circle `50%`, rect `var(--radius-medium)`) 사용
- `@keyframes pulse` 애니메이션(opacity 0.3~0.7)과 배경색 `var(--color-gray-100)`으로 통일
- 검증: LSP diagnostics clean, `npm run build` 성공(기존 global.css 경고 2건은 선행 이슈)

## Task 3: Playwright E2E Infrastructure Setup (Completed)

### Installation & Configuration
- **Playwright**: @playwright/test ^1.58.2 (installed via npm)
- **Browser**: Chromium v145.0.7632.6 (headless shell + FFmpeg for video)
- **Config**: playwright.config.js with mobile viewport (480x844), baseURL http://localhost:5173
- **Test Runner**: Native Playwright test framework (6 parallel workers, 1 retry on failure)

### Test Structure
- **Location**: tests/e2e/
- **Files Created**:
  - `playwright.config.js` — Chromium-only, mobile viewport, screenshot on failure
  - `tests/e2e/auth.setup.js` — Helper functions for /email-login page verification
  - `tests/e2e/smoke.spec.js` — 8 smoke tests covering page load, form elements, tab switching, branding
  - `tests/e2e/screenshots/` — Baseline images (email-login-baseline.png, email-login-form-baseline.png)

### Test Results
- **Command**: npm run test:e2e
- **Result**: 8 passed (5.4s)
- **Coverage**:
  1. Email login page loads
  2. Email/password input fields visible
  3. Login/signup tabs display
  4. Submit button visible
  5. Full page baseline screenshot
  6. Form container baseline screenshot
  7. Tab switching functionality
  8. App branding display

### Key Design Decisions
1. **No actual auth required**: Tests verify page structure only (Supabase credentials not needed)
2. **Chromium only**: Minimal setup, fast execution (no Firefox/WebKit)
3. **Mobile-first**: 480x844 viewport matches app design
4. **Baseline screenshots**: Serve as reference for visual regression testing in future tasks
5. **/email-login route**: Used directly (not /dev-login which redirects)

### Integration
- **package.json**: Added `"test:e2e": "npx playwright test"` script
- **CI-ready**: webServer auto-starts npm run dev, reuseExistingServer for local dev
- **HTML Report**: Generated in playwright-report/ directory

### Evidence
- **Location**: `.sisyphus/evidence/task-3-e2e-smoke.txt`
- **Contents**: Full execution log, deliverables checklist, technical details, command reference

### Next Steps
- Task 15: Implement full E2E authentication flow tests (actual login/signup)
- Add feature-specific test suites (chat, reservations, payments, etc.)
- Integrate into CI/CD pipeline
- Set up visual regression testing with baseline comparison
