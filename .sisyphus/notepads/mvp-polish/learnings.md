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
- 16/16 composable tests now exist (useConnection added in task-14)

## Task 14: useConnection Tests + Edge Case Coverage (2026-03-11)
- useConnection.js exports standalone async functions (not the standard composable pattern with loading/error refs)
- For functions ending in `.maybeSingle()`: just mock `builder.maybeSingle.mockResolvedValue(...)`
- For functions ending in `.eq()` (no maybeSingle): need `builder.eq.mockReturnValueOnce(builder).mockResolvedValueOnce(...)` for multi-eq chains
- For functions ending in `.eq()` with single eq after `.or()`: just `builder.eq.mockResolvedValueOnce(...)`
- useConnection has no authStore dependency — only imports supabase
- Edge case pattern: DB error → `builder.order.mockResolvedValue({ data: null, error: { message: '...' } })`
- All composables follow try/catch pattern: error sets `error.value`, returns false on failure
- Test count: 105 → 133 total (+28 new tests, all passing, 6 pre-existing failures unchanged)
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

## Task 4: Auth Subscription Cleanup (Completed)

### Implementation
- **File**: `src/stores/auth.js`
- **Function**: `signOut()` (lines 228-244)
- **Changes**: Added 2 lines in finally block:
  ```js
  _authSubscription?.unsubscribe()
  _authSubscription = null
  ```

### Context
- `_authSubscription` variable declared at line 25: `let _authSubscription = null`
- `registerAuthListener()` already has null check to prevent duplicate registration
- Cleanup prevents memory leak when user logs out

### Testing Results
- `npm test`: 99 passed, 6 failed (pre-existing failures — no regression)
- `npm run build`: ✓ Success, 314.41 kB gzipped
- Evidence: `.sisyphus/evidence/task-4-auth-cleanup.txt` contains grep output

### Files Modified
- ✅ Updated: `src/stores/auth.js` (2 lines added to signOut finally block)

## Task 5: Notification Badge Realtime Subscription (Completed)

### Implementation
- **File**: `src/stores/notificationBadge.js`
- **Changes**:
  1. Added `let _channel = null` at line 15 (state variable for Realtime channel)
  2. Added `subscribe()` function (lines 51-71):
     - Checks `auth.user?.id` and prevents duplicate subscription via `_channel` guard
     - Creates Supabase Realtime channel: `notification-badge-${auth.user.id}`
     - Subscribes to `notifications` table INSERT events with filter `user_id=eq.${auth.user.id}`
     - Increments `unreadCount.value` on each new notification
  3. Added `unsubscribe()` function (lines 75-80):
     - Removes channel via `supabase.removeChannel(_channel)`
     - Nullifies `_channel` to allow re-subscription
  4. Updated `$reset()` to call `unsubscribe()` (line 95)
  5. Exported `subscribe` and `unsubscribe` in return object (lines 102-103)

### Component Integration
- **BottomNav.vue**: Added `useNotificationBadgeStore` import + instance
  - `onMounted`: Added `await notificationBadgeStore.loadUnreadCount()` + `notificationBadgeStore.subscribe()`
  - `onUnmounted`: Added `notificationBadgeStore.unsubscribe()`
- **TrainerBottomNav.vue**: Identical pattern applied

### Pattern Reference
- Copied from `chatBadge.js` (lines 49-78) but adapted for `notifications` table + `user_id` filter
- chatBadge uses `messages` table + `receiver_id` filter; notificationBadge uses `notifications` + `user_id`

### Testing Results
- `npm run build`: ✓ Success, 315.50 kB gzipped (no regression)
- LSP diagnostics: Clean on all modified files
- Evidence: `.sisyphus/evidence/task-5-realtime-code.txt` contains grep output of subscribe/unsubscribe/INSERT

### Files Modified
- ✅ Updated: `src/stores/notificationBadge.js` (added _channel, subscribe, unsubscribe, updated $reset)
- ✅ Updated: `src/components/BottomNav.vue` (added notificationBadge import + subscribe/unsubscribe calls)
- ✅ Updated: `src/components/TrainerBottomNav.vue` (added notificationBadge import + subscribe/unsubscribe calls)

## [2026-03-11] Task: 트레이너 뷰 로딩 스켈레턴 치환
- 대상 10개 트레이너 뷰의 로딩 텍스트를 `AppSkeleton` 조합으로 치환했다.
- 리스트형 화면은 `type="line" :count="4"`를 기본으로 적용했다.
- 상세/연결 확인 로딩은 `type="circle" width="64px" height="64px"` + `type="line" :count="3"` 조합으로 통일했다.
- 대시보드/매뉴얼/수납 로딩은 카드 비율을 맞추기 위해 `type="rect"`와 `type="line"` 조합을 사용했다.
- 기존 `loading` ref만 있던 화면(`TrainerScheduleView`, `ReservationManageView`)에도 스켈레턴 분기를 추가했다.

## [2026-03-11] Task: 멤버 9개 뷰 로딩 텍스트 → AppSkeleton 치환
- 대상 9개 뷰(`MemberHomeView`, `MemberScheduleView`, `MemberReservationView`, `MemberChatView`, `MemberManualView`, `ManualDetailView`, `MemberMemoView`, `MemberPaymentHistoryView`, `MemberWorkoutDetailView`)에 `AppSkeleton` import + 로딩 UI 조합 적용
- `로딩 중...` 문자열은 카드 리스트(`type="rect" height="80px" :count="3"`), 채팅(`type="line" :count="5"`), 홈/상세 영역(`rect + line`, `circle + line`) 형태로 교체
- 연결 확인 단계(`hasActiveConnection === null`, `hasTrainer === null`)의 텍스트 로딩도 동일하게 스켈레턴으로 교체해 9개 뷰 모두 일관된 로딩 경험 유지
- 관련 스타일 보정: `MemberHomeView.css`, `ManualDetailView.css`의 로딩 컨테이너를 스켈레턴 레이아웃에 맞게 column/gap/padding 구조로 조정
- 검증: 변경 파일 LSP diagnostics clean, `npm run build` 성공(기존 CSS minify warning 2건 + router chunk warning은 선행 이슈), `grep -rc '로딩 중' src/views/member/` 전체 0

## [2026-03-11] Task: 공통/기타 6개 뷰 로딩 텍스트/상태 → AppSkeleton 치환
- 대상 6개 뷰(`NotificationListView`, `InviteManageView`, `InviteEnterView`, `TrainerSearchView`, `AccountManageView`, `WorkTimeSettingView`)에 `AppSkeleton` import와 로딩별 스켈레턴 조합 적용
- `NotificationListView`, `TrainerSearchView`의 `로딩 중...` 텍스트를 리스트형 스켈레턴(`type="rect"`)으로 교체해 텍스트 로딩 제거
- `InviteManageView`는 초대 코드 카드/최근 회원 리스트를 `loading && 데이터 없음` 조건으로 분기해 코드+회원 영역 스켈레턴을 노출하도록 구성
- `InviteEnterView`는 코드 검증 중(`isChecking`) 트레이너 정보 카드 자리에 `circle + line` 스켈레턴을 표시해 확인 단계 공백을 제거
- `AccountManageView`는 `auth.loading` 동안 계정 정보/입력 섹션 스켈레턴을 먼저 렌더링하고, 로딩 종료 후 기존 폼을 그대로 표시
- `WorkTimeSettingView`는 `isInitialLoading` 상태를 추가해 초기 조회 시 예약 단위/근무 일정 테이블 스켈레턴을 노출하고 저장 로딩(`loading`)과 구분
- 검증: 변경 파일 LSP diagnostics clean, `npm run build` 성공(exit code 0, 기존 CSS minify warning 2건 및 router chunk warning은 선행 이슈)

## Task 13: Remove Direct Supabase Imports from Views (Completed)

### Objective
Refactor `MemberProfileView.vue` and `AccountManageView.vue` to remove direct Supabase imports and use `useProfile` composable instead.

### Implementation

#### 1. Enhanced useProfile.js
Added 4 new functions to `src/composables/useProfile.js`:
- **saveMemberProfileBasic(name, phone, photoUrl)**
  - Updates `profiles` table with name, phone, photo_url
  - Returns boolean success/failure
- **saveMemberProfileDetails(age, height, weight, gender, goals, notes)**
  - Upserts `member_profiles` table with detailed member info
  - Handles type conversion (parseInt for age, parseFloat for height/weight)
  - Returns boolean success/failure
- **updateUserEmail(newEmail)**
  - Calls `supabase.auth.updateUser({ email })`
  - Returns boolean success/failure
- **updateUserPassword(newPassword)**
  - Calls `supabase.auth.updateUser({ password })`
  - Returns boolean success/failure

#### 2. MemberProfileView.vue Refactoring
- **Removed**: `import { supabase } from '@/lib/supabase'`
- **Updated**: useProfile() destructuring to include `saveMemberProfileBasic`, `saveMemberProfileDetails`
- **Refactored**: `handleComplete()` function
  - Replaced direct `supabase.from('profiles').update()` with `saveMemberProfileBasic()`
  - Replaced direct `supabase.from('member_profiles').upsert()` with `saveMemberProfileDetails()`
  - Maintained error handling and user feedback flow

#### 3. AccountManageView.vue Refactoring
- **Removed**: `import { supabase } from '@/lib/supabase'`
- **Added**: `import { useProfile } from '@/composables/useProfile'`
- **Updated**: useProfile() destructuring to include `updateUserEmail`, `updateUserPassword`
- **Refactored**: `handleEmailChange()` function
  - Replaced direct `supabase.auth.updateUser({ email })` with `updateUserEmail()`
  - Maintained error handling and success messaging
- **Refactored**: `handlePasswordChange()` function
  - Replaced direct `supabase.auth.updateUser({ password })` with `updateUserPassword()`
  - Maintained error handling and success messaging

### Verification Results
- ✅ **npm test**: 99 passed, 6 failed (pre-existing failures unrelated to changes)
  - Failures in useProfile.test.js, useInvite.test.js, useChat.test.js (existed before refactoring)
  - No new test failures introduced
- ✅ **npm run build**: SUCCESS (exit code 0)
  - 223 modules transformed
  - dist/ generated successfully
  - No breaking changes

### Architecture Compliance
- ✅ Composable Pattern: All Supabase calls now go through useProfile()
- ✅ No Direct Imports: Both views no longer import supabase directly
- ✅ Error Handling: Consistent error handling with error.value refs
- ✅ User Feedback: All success/error messages preserved
- ✅ Functionality: No behavioral changes — pure refactoring

### Files Modified
1. `src/composables/useProfile.js` (294 → 368 lines, +4 functions)
2. `src/views/onboarding/MemberProfileView.vue` (imports changed, handleComplete refactored)
3. `src/views/common/AccountManageView.vue` (imports changed, handlers refactored)

### Notes
- Auth-related views (LoginView, EmailLoginView, DevLoginView, PasswordResetView, PasswordUpdateView, AuthCallbackView) were NOT modified per requirements
- No new composable files created — all functions added to existing useProfile.js
- This is a pure refactoring to move Supabase calls to composables layer

## [2026-03-11] Task 10: SVG 인라인 하드코딩 색상 → currentColor 변환

### 변환 전략
- 인라인 SVG의 `stroke="#XXXXXX"` / `fill="#XXXXXX"` → `stroke="currentColor"` / `fill="currentColor"`
- 각 SVG 태그에 `style="color: var(--color-xxx)"` 인라인 스타일 추가 (부모에 color 없는 경우)
- `fill="none"` 는 SVG 배경 없음 표시이므로 **절대 변경 금지**

### 색상 매핑
| 하드코딩 값 | CSS 변수 | 비고 |
|------------|---------|------|
| `#007AFF` | `var(--color-blue-primary)` | 기존 변수 |
| `#111111` | `var(--color-gray-900)` | 기존 변수 |
| `#9CA3AF` | `var(--color-gray-400)` | **신규 추가** — global.css에 없던 색상 |
| `#34C759` | `var(--color-green)` | 기존 변수 |
| `#666666` | `var(--color-gray-600)` | 기존 변수 |
| `#000000` | `var(--color-gray-900)` | `#111111`이 가장 근접 |

### 신규 CSS 변수 추가
- `global.css`에 `--color-gray-400: #9CA3AF;` 추가 (4개 파일에서 공통 사용하는 색상)

### 변환 패턴 (혼합 색상 SVG)
SVG 내에 여러 색상이 있는 경우:
- 주요 색상(fill/stroke)에 currentColor 적용
- 고정 색상(예: `stroke="white"` 체크마크)은 그대로 유지
- SVG 태그 color를 주요 색상으로 설정

### 검증
- `grep -rn 'stroke="#\|fill="#' src/views/ src/components/ | grep -v 'fill="none"'` → **0건** ✅
- `npm run build` → **exit code 0** ✅

### 변경 파일 목록 (15개 파일)
1. `src/assets/css/global.css` — --color-gray-400 추가
2. `src/views/home/HomeView.vue`
3. `src/views/member/MemberMemoView.vue`
4. `src/views/member/MemberScheduleView.vue`
5. `src/views/invite/InviteEnterView.vue`
6. `src/views/login/EmailLoginView.vue`
7. `src/views/login/LoginView.vue`
8. `src/views/trainer/TrainerMemberView.vue`
9. `src/views/trainer/ReservationManageView.vue`
10. `src/views/trainer/MemoWriteView.vue`
11. `src/views/trainer/TrainerScheduleView.vue`
12. `src/views/trainer/WorkTimeSettingView.vue`
13. `src/views/trainer/TrainerMemberDetailView.vue`
14. `src/views/onboarding/RoleSelectView.vue`
15. `src/components/AppCalendar.vue`
16. `src/views/trainer/AGENTS.md` — 안티패턴 문서 업데이트 (FIXED 표시)

---

## Task 11: CSS Hard-coded Colors → CSS Variables (2026-03-11)

### 결과
- 신규 변수 3개 추가: `--color-red-light`, `--color-green-light`, `--color-green-dark`
- 변환 전: ~83건, 변환 후: 19건 (77% 감소)
- 빌드: exit code 0 ✓

### 변환 불가 19건 (정당한 유지)
- linear-gradient 내부 (8건) — 그라디언트 색상은 단일 변수 불가
- Kakao 브랜드 고정색 #fee500, #3c1e1e (4건) — 브랜드 정체성
- pending 상태 앰버 배지 #fff8e6/#e89a00 계열 (6건) — max 3 신규 변수 소진
- warning 앰버 #FFF9E5/#7A5C00/#B88900 (3건) — 동일
- 오렌지 액센트 #FF9500 (2건) — 해당 변수 없음

### 근사 매핑 사용
- `#F3F4F6` → `var(--color-gray-100)` (#F2F4F7, 차이 ≤ 2값)
- `#6B7280` → `var(--color-gray-600)` (#666666, 유사 중간회색)
- `#D1D5DB` → `var(--color-gray-400)` (#9CA3AF, 비활성 점/막대)
- `#E5E7EB` → `var(--color-gray-200)` (#EEEEEE, hover 배경)
- `#d0e8ff`/`#cce4ff`/`#F0F7FF` → `var(--color-blue-light)` (연한 파랑 패밀리)
- `#FFB340` → `var(--color-yellow)` (pending 점, 동일 의미)
- `#000000` → `var(--color-gray-900)` (#111111, 카카오 버튼 텍스트)

## Task 12: CSS Hard-coded px → CSS Variables (2026-03-11)

### 변환 규칙 & 결과
| 하드코딩 | → 변수 | 변환 건수 |
|---|---|---|
| `padding: 20px` (all 4) | `var(--side-margin)` | 7건 (CSS 6 + Vue inline 1) |
| `padding: 0 20px` (좌우) | `0 var(--side-margin)` | 3건 |
| `border-radius: 12px` | `var(--radius-medium)` | 2건 |
| `border-radius: 8px` | `var(--radius-small)` | 2건 |
| `gap: 28px` | `var(--spacing-section)` | 5건 |
| `gap: 14px` | `var(--spacing-item)` | 11건 |
| **합계** | | **~30건** |

### 변환 안 한 패턴 (명확한 이유)
- `padding: 60px 20px`, `padding: 20px 16px`, `padding: 10px 20px` — 다른 값 혼합, 변수 없음
- `padding: 20px 0` — 상하만 (의미 맞지 않음)
- `margin-top/bottom: 20px` — 단방향, 변수 의미 부적합
- `border-radius: 18px / 26px / 28px / 50%` — 대응 변수 없음
- `border-radius: 8px` (circle badge) — 변환함 (var(--radius-small) = 8px로 동일)

### 적용 범위
- CSS 파일 21개 + Vue 파일 2개 = **23개 파일** 수정
- `replaceAll: true` 사용 파일: TrainerHomeView, SettingsView, TrainerMemberDetailView, MemberHomeView
- 빌드: exit code 0 ✓

## [2026-03-11] Task 16: fetchConversations 페이지네이션 개선
- `fetchConversations()`는 대화 목록 1회 로딩 시 `messages` 최신 500건을 조회한 뒤 클라이언트에서 `Map` 그룹화로 최근 메시지/unreadCount를 계산하고 있었다.
- 스키마 인덱스(`idx_messages_participants`, `idx_messages_receiver_unread`) 기준에서 `sender_id OR receiver_id` 패턴은 데이터 증가 시 과조회 비용이 커질 수 있어, 네트워크/JS 처리량이 병목 지점이다.
- 옵션 비교 결과: A(RPC 그룹화)는 구조적으로 가장 좋지만 스키마/RLS/검증 범위가 커서 이번 작업 범위를 초과, C(무한 스크롤)는 목록 요약 문제에 과한 복잡도였다.
- 실용 최적안으로 B를 선택해 `src/composables/useChat.js`에서 대화 목록 조회 상한을 `500 -> 100`으로 축소하고 상수(`CONVERSATION_FETCH_LIMIT`)로 분리했다.
- 트레이드오프: unreadCount는 원래도 제한된 샘플 기반이었고, 이번 변경으로 상한이 더 낮아진 대신 초기 로드 비용과 payload를 즉시 줄였다.

## [2026-03-11] Task 15: 핵심 E2E 시나리오 5개 스펙 파일 작성

### 생성 파일 (tests/e2e/)
- `login-flow.spec.js` — 9개 테스트: 이메일 로그인 페이지 UI 검증 (public 라우트)
- `trainer-home.spec.js` — 5개 테스트: 비인증 접근 시 /login 리다이렉트 검증
- `member-home.spec.js` — 5개 테스트: 비인증 접근 시 /login 리다이렉트 검증
- `navigation.spec.js` — 7개 테스트: 라우팅 동작 검증 (루트→로그인, /dev-login→/email-login 등)
- `chat-flow.spec.js` — 5개 테스트: 채팅 페이지 비인증 접근 시 /login 리다이렉트 검증

### 핵심 발견
- `input[type="email"]`의 브라우저 네이티브 검증이 Vue의 `@submit.prevent` 이전에 동작
  - "잘못된 이메일 형식" 테스트는 form submit 자체가 막혀 Vue 핸들러가 실행되지 않음
  - 해결: 유효한 이메일 + 짧은 비밀번호로 Vue 커스텀 검증을 우회 없이 테스트
- 보호된 라우트(`/trainer/home`, `/member/home`, etc.) 접근 시 `/login`으로 리다이렉트됨 (router beforeEach 가드)
- `/dev-login` 경로는 `/email-login`으로 redirect 처리 — 테스트에서 직접 `/email-login` 사용 권장

### 테스트 실행 결과 (login-flow.spec.js)
- 9 passed (3.1s) — 100% 통과

## [2026-03-11] Task 18: per-component AppToast 제거
- 12개 뷰에서 AppToast import + template 태그 제거 완료
- useToast() 호출 및 showToast 사용은 유지
- App.vue의 단일 글로벌 인스턴스가 모든 Toast 처리
- InviteManageView, WorkTimeSettingView는 useToast() 미사용 (로컬 ref 방식) — import만 제거, 로컬 ref 유지
- grep -rl 'AppToast' src/views/ | wc -l → 0
- npm run build: exit code 0

## [2026-03-11] Task 17: 에러 표시 패턴 통일

### 변경 내용 요약
- **총 26개 파일** 수정 (+ 6개는 이미 처리됨 = 전체 32개 뷰 커버)
- **그룹 A (2개)**: 이미 `import { useToast }` 있으나 watch 없던 파일 → watch만 추가
  - ManualRegisterView.vue (`watch(error, ...)`, `showError` 사용)
  - InviteEnterView.vue (`watch(inviteError, ...)`)
- **그룹 B (24개)**: useToast 없던 파일 → import + `const { showToast }` + watch 모두 추가
  - 트레이너 뷰 14개: TrainerScheduleView, TrainerMemberView, TrainerMemberDetailView, TrainerProfileEditView, TrainerProfileView, MemoWriteView, TrainerSearchView, ReservationManageView, MemberPaymentView, PaymentWriteView, TrainerHomeView, PtCountManageView, WorkTimeSettingView, TodayWorkoutView
  - 회원 뷰 8개: RoleSelectView, MemberProfileView, ManualDetailView, MemberMemoView, MemberReservationView, MemberProfileEditView, MemberPaymentHistoryView, MemberScheduleView
  - 공통 뷰 2개: AccountManageView, InviteManageView

### 핵심 패턴
```js
import { watch } from 'vue'
import { useToast } from '@/composables/useToast'
const { showToast } = useToast()
watch(errorVar, (e) => { if (e) showToast(e, 'error') })
```

### 주의사항
- `showToast` 로컬 충돌 파일(WorkTimeSettingView, InviteManageView): `showToast: showToastGlobal`로 별칭
- TrainerHomeView: reservError, membersError, chatError 세 개 모두 watch
- TrainerMemberDetailView: error, ptError 두 개 watch
- 이미 처리된 6개 파일(skip): TrainerChatView, TrainerManualView, NotificationListView, MemberChatView, MemberManualView, MemberWorkoutDetailView
- MemberHomeView는 watch(reservError, workoutError)가 이미 있어 skip
- grep 패턴 `watch\(error`는 별칭 변수(reservError 등)를 탐지 못해 수동 확인 필요
- 멀티라인 destructure는 단일라인 grep으로 탐지 불가 (MemberScheduleView, TodayWorkoutView 등)

### 빌드
- `npm run build` → **exit code 0** ✓
- 메인 번들: 315.79 kB (98.82 kB gzip)

## F3: Playwright E2E 테스트 패턴 (2026-03-11)

### 테스트 격리
- `npx playwright test`는 각 테스트마다 격리된 브라우저 컨텍스트 사용
- playwright.config.js의 `webServer` 설정으로 dev server 자동 시작 (reuseExistingServer: true)
- MCP playwright 브라우저는 세션 공유 → 테스트 컨텍스트와 다름

### 검증된 라우터 가드 동작
- 비인증 → 보호 라우트: `/login`으로 리다이렉트
- 인증 + 역할 불일치 (member → trainer 라우트): 역할 홈으로 리다이렉트
- 인증 + 올바른 역할: 정상 접근
- `/dev-login` → `/email-login` 리다이렉트 존재

### /email-login 페이지 구조
- `.email-login__back` — 뒤로가기 버튼
- `.email-login__app-name` — "PT 매니저" 헤딩
- `.email-login__tab` — 로그인/회원가입 탭 (2개)
- `#email` — 이메일 입력, type="email"
- `#password` — 비밀번호 입력, type="password"
- `.email-login__forgot` — "비밀번호를 잊으셨나요?" 버튼
- `.email-login__btn--primary` — 제출 버튼
- `.email-login__error` — 유효성 검사 오류 메시지 영역

## [2026-03-11] F4 Scope Fidelity Learnings
- F4 1:1 검증은 단순 파일 존재 확인만으로 부족하고, 계획 Acceptance 명령 + 실제 파일 내용(예: AppSkeleton type validator) 교차 확인이 필요하다.
- Task 11/12는 지시된 최소 명령만 보면 통과처럼 보일 수 있으나, 계획 원문 grep 기준(뷰 CSS hex/px 잔존) 추가 점검에서 미준수(색상 20건, px 다수)가 드러났다.
- 스코프 검증 시 git status 기반으로 계획 외 파일 변동(.sisyphus/plans/mvp-polish.md 등)을 별도 오염/미계상 항목으로 분리 집계해야 최종 판정 일관성이 유지된다.
