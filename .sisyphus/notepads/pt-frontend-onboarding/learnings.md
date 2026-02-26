# PT Frontend Onboarding — Learnings

## [2026-02-26] Session Start

### Reference Project Patterns (dot_ment_web)
- Vue 3.4 + Vite 5 + Pinia 2.1.7 + Vue Router 4.2.5
- `type: "module"` in package.json
- vite.config.js: `@` alias via `path.resolve(__dirname, './src')`, host `0.0.0.0`, port `5173`
- main.js: `createApp(App).use(createPinia()).use(router)` then `.mount('#app')`
- App.vue: `<script setup>` + `useRoute()` for conditional logic + `<router-view />`
- Router: `createWebHistory(import.meta.env.BASE_URL)`, lazy-load with `() => import(...)`
- DO NOT copy dot_ment_web colors (#8800BB purple theme) — use font_color_guide.md values only

### Design System (font_color_guide.md)
- Primary: #007AFF | Light: #E5F1FF | White: #FFFFFF
- Surface: #F2F4F7 | Text Primary: #111111 | Text Secondary: #666666
- Divider: #EEEEEE | Green: #34C759 | Red: #FF3B30 | Yellow: #FFCC00
- Button: height 52px, padding H 20px, radius 12px
- Input: no border, bg #F2F4F7, padding H16/V14, radius 12px
- BottomNav: height 64-72px, icon 24px, active #007AFF, inactive #666666
- Card shadow: 0 4px 12px rgba(0,0,0,0.05)
- Radius: Large 16px / Medium 12px / Small 8px
- Side margin: 20px
- Font: 'Apple SD Gothic Neo', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif

### Project Constraints
- NO axios, uuid, tailwind, ESLint, Prettier, @font-face
- NO backend API calls, no Kakao OAuth SDK
- NO form validation logic, no dark mode, no i18n
- NO Pinia store logic (just empty stores)
- 7 screens only: login, role-select, trainer-profile, member-profile, search, invite-manage, invite-enter
- Inline SVG for all icons (no external icon libraries)
- Dummy/hardcoded data only

## [2026-02-26] Task 3 — Common Components + App.vue BottomNav

### Components Created
- `AppButton.vue`: variant prop ('primary'|'secondary'|'outline'), fullWidth, disabled. All CSS via `var(--...)` tokens.
- `AppInput.vue`: v-model via modelValue + `update:modelValue` emit. Optional icon slot shifts padding with `padding-left: calc(var(--input-padding-h) + 28px)`.
- `ProgressBar.vue`: v-for loop over totalSteps, `step <= currentStep` for active class.
- `BottomNav.vue`: data-testid="bottom-nav" for Playwright. isActive checks both `route.path` and `route.name`.

### App.vue Pattern
- `useRoute()` is reactive — `route.meta.hideNav` correctly reflects current route meta reactively.
- `v-if="!route.meta.hideNav"` hides BottomNav on login/onboarding routes (all have `meta: { hideNav: true }`).
- 3 routes without hideNav: trainer-search, invite-manage, invite-enter → show BottomNav.

### Build
- 46 modules, ✓ built in ~500-800ms. All 7 lazy-loaded view chunks emitted correctly.


## [2026-02-26] Task F2 — Code Quality Review

### Build Result
- `npm run build` EXIT_CODE: 0 ✅ — 52 modules, built in 613ms

### Vue File Audit (12 files total)
All 12 files use `<script setup>` (Composition API) — 0 Options API violations.

| File | script setup | style scoped | Notes |
|------|-------------|-------------|-------|
| App.vue | ✅ | N/A (no style block) | No styles needed — acceptable |
| LoginView.vue | ✅ | ✅ | |
| RoleSelectView.vue | ✅ | ✅ | |
| TrainerProfileView.vue | ✅ | ✅ | |
| MemberProfileView.vue | ✅ | ✅ | |
| TrainerSearchView.vue | ✅ | ✅ | |
| InviteManageView.vue | ✅ | ✅ | |
| InviteEnterView.vue | ✅ | ✅ | |
| AppButton.vue | ✅ | ✅ | |
| AppInput.vue | ✅ | ✅ | |
| ProgressBar.vue | ✅ | ✅ | |
| BottomNav.vue | ✅ | ✅ | |

### Code Quality Grep Results
- `console.log` occurrences: **0** ✅
- `as any` occurrences: **0** ✅
- `@ts-ignore` occurrences: **0** ✅
- Unused imports (best effort): **0** — all imports verified in use

### Minor Issues Found (Non-blocking)
- `LoginView.vue` line 53: `alert('준비 중입니다')` — placeholder UI for email login, not production-ready.
  This is expected placeholder code per project constraints (no backend), but should be removed before production.

### CSS Variable Comparison: global.css vs font_color_guide.md
| Variable | Guide Value | global.css Value | Match? |
|----------|-------------|-----------------|--------|
| --color-blue-primary | #007AFF | #007AFF | ✅ |
| --color-blue-light | #E5F1FF | #E5F1FF | ✅ |
| --color-white | #FFFFFF | #FFFFFF | ✅ |
| --color-gray-100 | #F2F4F7 | #F2F4F7 | ✅ |
| --color-gray-900 | #111111 | #111111 | ✅ |
| --color-gray-600 | #666666 | #666666 | ✅ |
| --color-gray-200 | #EEEEEE | #EEEEEE | ✅ |
| --color-green | #34C759 | #34C759 | ✅ |
| --color-red | #FF3B30 | #FF3B30 | ✅ |
| --color-yellow | #FFCC00 | #FFCC00 | ✅ |
| --nav-height | 64px–72px | 68px | ✅ (in range) |
| --app-max-width | 480px | 480px | ✅ |
| --btn-height | 52px | 52px | ✅ |
| --btn-padding-h | 20px | 20px | ✅ |
| --radius-large | 16px | 16px | ✅ |
| --radius-medium | 12px | 12px | ✅ |
| --radius-small | 8px | 8px | ✅ |
| --shadow-card | 0 4px 12px rgba(0,0,0,0.05) | 0 4px 12px rgba(0,0,0,0.05) | ✅ |
| --input-padding-h | 16px | 16px | ✅ |
| --input-padding-v | 14px | 14px | ✅ |
| --side-margin | 20px | 20px | ✅ |

### Final Verdict
**Build [PASS] | Vue Pattern [12 clean / 0 issues] | CSS Vars [MATCH] | VERDICT: ALL PASS**