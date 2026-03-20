# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Git Policy

- **모든 작업은 `dev` 브랜치에서 직접 진행한다.** feature branch 또는 worktree 생성 금지.
- `main` 브랜치는 릴리스 전용 — 직접 커밋하지 않는다.

---

## Commands

```bash
npm run dev       # Dev server at http://localhost:5175 (binds 0.0.0.0)
npm run build     # Production build → dist/
npm run preview   # Preview built dist
npm test          # Run unit tests (Vitest)
npm run test:e2e  # Run E2E tests (Playwright, Pixel 5 480×844)
```

No ESLint or Prettier configured.

---

## Architecture

**App**: Vue 3 mobile-first PWA for PT session management between trainers and members. 480px max-width layout. No TypeScript — plain JavaScript throughout.

**Stack**: Vue 3 (Composition API) + Vite 5 + Pinia + Vue Router 4 + Supabase (PostgreSQL + Auth + Storage + Realtime)

### Data Flow

```
View → Composable (src/composables/use*.js) → Supabase client (src/lib/supabase.js)
                ↕
         Pinia store (caching layer)
```

- **Views never call Supabase directly** — always go through composables.
- **Composables** handle all queries and expose `loading`/`error` refs.
- **Pinia stores** cache frequently-accessed data with TTL-based invalidation (e.g., reservations store: 5-min TTL + dirty flag).

### Auth Flow

```
Kakao OAuth → Supabase PKCE → /auth/callback
  → auth.initialize() → getSession() → hydrateFromSession() → fetchProfile()
  → Has role? → /trainer/home or /home
  → No role? → /onboarding/role
```

Router `beforeEach` guard: (1) wait for `auth.initialize()`, (2) redirect unauthenticated users to `/login`, (3) redirect role mismatch to correct home.

### Role-Based Routing

- `/member/*` → member views; `/trainer/*` → trainer views
- `App.vue` renders `TrainerBottomNav` or `BottomNav` based on `auth.role`
- `meta: { hideNav: true }` hides bottom nav for full-screen views

### Key Files

| Task | Location |
|------|----------|
| Add new page | `src/views/<domain>/` + `src/router/index.js` (lazy-loaded route) |
| Add data fetching | `src/composables/use*.js` |
| Add shared component | `src/components/App*.vue` |
| Change design tokens | `src/assets/css/global.css` |
| Add Pinia store | `src/stores/*.js` |
| Auth logic / route guards | `src/stores/auth.js` + `src/router/index.js` |
| DB schema + RLS | `supabase/schema.sql` |
| Design specs | `docs/font_color_guide.md`, `docs/ui/` |

---

## Vue Conventions

- **`<script setup>` only** — no Options API ever.
- `defineProps()` and `defineEmits()` are compiler macros — no imports needed.
- `v-model` on custom inputs: `modelValue` prop + `update:modelValue` emit.
- **All imports use `@/` alias** (resolves to `src/`) — never relative `../..` paths.
- All views are lazy-loaded in the router via dynamic `import()`.

```vue
<script setup>
import { ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
</script>
```

### Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| View files | `PascalCase` + `View` suffix | `TrainerScheduleView.vue` |
| Shared components | `PascalCase`, `App` prefix | `AppButton.vue` |
| CSS companion files | Same name as view | `TrainerScheduleView.css` |
| Route names/paths | `kebab-case` | `trainer-profile`, `/trainer/profile` |
| CSS classes | BEM | `.trainer-card__btn--primary` |

---

## CSS / Styling

**All design tokens in `src/assets/css/global.css`.** Always use CSS variables — never hard-code hex colors or raw px for spacing/typography.

Key tokens:
```css
/* Colors */
--color-blue-primary: #007AFF   /* primary actions */
--color-gray-100: #F2F4F7       /* input backgrounds */
--color-gray-900: #111111       /* primary text */
--color-green: #34C759          /* success */
--color-red: #FF3B30            /* error/destructive */

/* Layout */
--app-max-width: 480px
--side-margin: 20px
--nav-height: 68px

/* Components */
--btn-height: 52px
--radius-large: 16px   /* cards, bottom sheets */
--radius-medium: 12px  /* buttons, inputs */
```

**Scoped styles**: inline `<style scoped>` for small components; `<style src="./ViewName.css" scoped>` companion file for large views. BEM naming, no Tailwind, no CSS Modules.

**View layout pattern** (every view):
```css
.view-name { min-height: 100vh; display: flex; flex-direction: column; }
/* header: fixed height | body: flex: 1 | footer: fixed/sticky */
```

Bottom nav spacer to prevent content hiding: `<div style="height: calc(var(--nav-height) + 16px);" />`

---

## Known Tech Debt

- Inline SVGs with hard-coded `stroke="#007AFF"` (should use `stroke="currentColor"`).
- Some CSS uses raw px values instead of design token variables.
- Auth listener (`_authSubscription`) in `src/stores/auth.js` is never unsubscribed.

---

## Notes

- **응답 언어**: 사용자에게 설명할 때 항상 **한글**로 응답할 것. 코드는 영어, 대화/설명은 한글.
- **Code comments and UI strings**: all in Korean (한국어).
- Unit tests live in `src/composables/__tests__/`. Run a specific test file: `npx vitest run src/composables/__tests__/useReservations.test.js`
- E2E tests are in `tests/e2e/`. The Playwright config targets Pixel 5 (480×844) and auto-starts the dev server.
- Environment: copy `.env.example` → `.env.local` and fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_KAKAO_REST_API_KEY`.
- `console.log` and `debugger` statements are stripped in production builds (esbuild config in `vite.config.js`).
