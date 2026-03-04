# AGENTS.md — PT 매니저 Web App

Reference guide for AI coding agents working in this repository.

**Generated:** 2026-03-04
**Commit:** b53c4a9
**Branch:** main

---

## Project Overview

A Vue 3 mobile-first PWA for managing personal training (PT) sessions between trainers and members.
480 px max-width container layout (simulated phone shell). Backend: **Supabase** (PostgreSQL + Auth + Storage).
Stack: **Vue 3 + Vite + Pinia + Vue Router 4 + Supabase**. No TypeScript — plain JavaScript throughout.

---

## Commands

```bash
# Development server (http://localhost:5173)
npm run dev

# Production build → dist/
npm run build

# Preview production build
npm run preview
```

There is **no test runner** configured. No lint/format tooling (ESLint, Prettier) is set up.

---

## Directory Structure

```
pt_web_app/
├── src/
│   ├── main.js               # Bootstrap: createApp → Pinia → Router → auth.initialize() → mount
│   ├── App.vue               # Root: <router-view> + role-based bottom nav
│   ├── assets/
│   │   ├── css/global.css    # Design system tokens (CSS custom properties)
│   │   └── icons/            # SVG icon files
│   ├── components/           # Shared UI primitives (App-prefixed)
│   ├── composables/          # Supabase data access layer (useXxx pattern)
│   ├── lib/
│   │   └── supabase.js       # Supabase client singleton (PKCE auth flow)
│   ├── router/index.js       # Routes + beforeEach guard (auth + role access control)
│   ├── stores/
│   │   └── auth.js           # Auth state: user, profile, role, session, loading
│   └── views/                # Feature pages, grouped by domain
│       ├── auth/             # OAuth callback handler
│       ├── home/             # Member home dashboard
│       ├── invite/           # Invite code management
│       ├── login/            # Kakao OAuth login
│       ├── member/           # Member-side views (10 files)
│       ├── onboarding/       # Role selection, profile setup
│       └── trainer/          # Trainer-side views (31 files — see trainer/AGENTS.md)
├── supabase/
│   └── schema.sql            # Full DB schema: tables, RLS, RPC functions
├── docs/                     # PRD, font/color guide, UI reference screenshots
├── index.html
├── vite.config.js
└── package.json
```

---

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add new page | `src/views/<domain>/` + `src/router/index.js` | Create `*View.vue` + `.css`, add lazy route |
| Add data fetching | `src/composables/use*.js` | Never call Supabase directly from views |
| Add shared component | `src/components/App*.vue` | `App` prefix for shared primitives |
| Change design tokens | `src/assets/css/global.css` | Colors, typography, spacing, radii |
| Add Pinia store | `src/stores/*.js` | Composition API style, `useXxxStore()` naming |
| Change auth/guards | `src/stores/auth.js` + `src/router/index.js` | Auth store + router `beforeEach` |
| Modify DB schema | `supabase/schema.sql` | Include RLS policies |
| Check design specs | `docs/` | PRD, font/color guide, `docs/ui/` screenshots |
| Environment vars | `.env.local` (from `.env.example`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

---

## Vue Component Conventions

### Always use `<script setup>` (Composition API)

```vue
<template>
  <div class="my-component">...</div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const count = ref(0)

function handleClick() { ... }
</script>

<style scoped>
/* or: <style src="./MyView.css" scoped> for large views */
</style>
```

- **No Options API**. Never use `export default { ... }`.
- `defineProps()` and `defineEmits()` are used without imports (compiler macros).
- `v-model` on custom inputs uses the `modelValue` prop + `update:modelValue` emit pattern.

### Props Definition

```js
defineProps({
  variant: { type: String, default: 'primary' },  // inline comment for allowed values
  fullWidth: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
})
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| View files | `PascalCase` + `View` suffix | `TrainerSearchView.vue` |
| Component files | `PascalCase`, `App` prefix for shared | `AppButton.vue`, `ProgressBar.vue` |
| CSS companion files | Same name as view | `TrainerSearchView.css` |
| Route names | `kebab-case` | `trainer-profile`, `invite-manage` |
| Route paths | `kebab-case` URL segments | `/onboarding/trainer-profile` |
| JS variables/functions | `camelCase` | `selectedRole`, `handleNext` |
| Reactive refs | `camelCase`, no suffix | `const name = ref('')` |
| CSS classes | BEM — `block__element--modifier` | `.trainer-card__btn--primary` |

---

## Import Conventions

- **Always use `@/` alias** (resolves to `src/`) for imports — never relative `../..` paths.
- Third-party packages imported bare: `import { ref } from 'vue'`
- SVG icons imported as URL strings: `import trainerIcon from '@/assets/icons/trainer.svg'`

```js
// Correct
import AppButton from '@/components/AppButton.vue'
import { useRouter } from 'vue-router'
import trainerIcon from '@/assets/icons/trainer.svg'

// Wrong
import AppButton from '../../components/AppButton.vue'
```

---

## Routing

Defined entirely in `src/router/index.js`. All routes use **lazy loading** via dynamic import.

```js
{
  path: '/onboarding/trainer-profile',
  name: 'trainer-profile',
  component: () => import('@/views/onboarding/TrainerProfileView.vue'),
  meta: { hideNav: true },   // hides BottomNav for full-screen views
}
```

- `meta: { hideNav: true }` on routes that should not show the bottom navigation bar.
- Default redirect: `/` → `/login`.
- Navigation: use `useRouter()` and `router.push(...)` / `router.back()`.

---

## State Management (Pinia)

Pinia is installed and registered in `main.js`. One store exists:

```js
// src/stores/auth.js
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)      // Supabase auth.users object
  const profile = ref(null)   // profiles table data (name, role, photo_url)
  const role = ref(null)      // 'trainer' | 'member' | null (synced from profile.role)
  const session = ref(null)   // Supabase session (access_token)
  const loading = ref(true)   // initialization/auth in progress
  const error = ref(null)     // last error message

  // Double-init prevention: _initialized flag + _initializePromise
  async function initialize() { /* getSession() → hydrateFromSession() → fetchProfile() */ }
  async function signOut() { /* supabase.auth.signOut() + resetAuthState() */ }
  return { user, profile, role, session, loading, error, setRole, clearRole, fetchProfile, initialize, signOut }
})
```

- `App.vue` uses `auth.role` to switch between `TrainerBottomNav` and `BottomNav`.
- Place new stores in `src/stores/`.
- Use `defineStore('storeName', () => { ... })` (Composition API style).
- Import with `useXxxStore()` naming.

---

## Auth Flow

```
Kakao OAuth button → Supabase PKCE flow → /auth/callback
  → auth.initialize() → getSession() → hydrateFromSession() → fetchProfile()
  → Has profile+role? → role-based home (/trainer/home or /home)
  → No profile? → /onboarding/role (role selection)
```

Router guard (`beforeEach`) — three stages:
1. Wait for `auth.initialize()` if `auth.loading`
2. Unauthenticated + protected route → `/login`
3. Role mismatch → redirect to role-appropriate home

Public routes (no auth): `/login`, `/auth/callback`

---

## CSS / Styling

### Design System (CSS Custom Properties)

All design tokens live in `src/assets/css/global.css`. **Always use CSS variables — never
hard-code hex colors, px sizes for spacing, or font values.**

```css
/* Colors */
--color-blue-primary: #007AFF   /* primary actions, active states */
--color-blue-light:  #E5F1FF    /* active backgrounds, badges */
--color-white:       #FFFFFF    /* page/card backgrounds */
--color-gray-100:    #F2F4F7    /* input backgrounds, secondary buttons */
--color-gray-200:    #EEEEEE    /* dividers, borders */
--color-gray-600:    #666666    /* secondary/hint text */
--color-gray-900:    #111111    /* primary text */
--color-green:       #34C759    /* success states */
--color-red:         #FF3B30    /* error/destructive */
--color-yellow:      #FFCC00    /* warnings, calendar pending dots */

/* Typography */
--fs-display: 24px   --fw-display: 700
--fs-title:   20px   --fw-title:   700
--fs-subtitle: 18px  --fw-subtitle: 600
--fs-body1:   16px   --fw-body1-bold: 600  --fw-body1-reg: 400
--fs-body2:   14px   --fw-body2:   400
--fs-caption: 12px   --fw-caption: 400
--lh-display: 1.4    --lh-body: 1.5

/* Layout */
--app-max-width: 480px
--side-margin:   20px
--nav-height:    68px

/* Spacing */
--spacing-section: 28px
--spacing-item:    14px

/* Components */
--btn-height:     52px
--radius-large:   16px  /* cards, bottom sheets */
--radius-medium:  12px  /* buttons, inputs, list items */
--radius-small:   8px   /* tags, badges */
--shadow-card:    0 4px 12px rgba(0,0,0,0.05)
```

### Scoped Styles

- Small components: inline `<style scoped>` block.
- Large views: external `<style src="./ViewName.css" scoped>` companion file.
- CSS uses BEM naming: `.block__element--modifier`.
- No CSS modules, no Tailwind, no utility classes.

### Layout Pattern

Every view follows this flex column structure:

```css
.view-name {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-white);
}
/* header: fixed height */
/* content: flex: 1 */
/* footer: fixed/sticky with padding var(--side-margin) */
```

Bottom-nav spacer pattern (prevents content hiding behind nav):
```html
<div style="height: calc(var(--nav-height) + 16px);" />
```

---

## Shared Components

| Component | Props | Notes |
|---|---|---|
| `AppButton` | `variant` (`primary`\|`secondary`\|`outline`), `fullWidth`, `disabled` | Full-width primary by default; use `<slot>` for label |
| `AppInput` | `modelValue`, `type`, `placeholder` | v-model compatible; `icon` named slot for prefix icon |
| `AppBottomSheet` | `modelValue`, `title` | v-model toggleable; uses `<Teleport>` + `<Transition>` |
| `AppCalendar` | `modelValue` (YYYY-MM-DD), `dots` | v-model date picker; dots: `{ day: ['pending'\|'approved'\|'done'\|'cancelled'] }` |
| `AppTimePicker` | `modelValue` (HH:MM 24h) | v-model scroll-wheel picker; 5-min intervals |
| `ProgressBar` | `currentStep`, `totalSteps` | Renders step-indicator dots for onboarding flows |
| `BottomNav` | — | Fixed bottom nav for member role; hidden via route `meta.hideNav` |
| `TrainerBottomNav` | — | Fixed bottom nav for trainer role; shown when `auth.role === 'trainer'` |

---

## Inline SVG Pattern

Icons are either:
1. Inline `<svg>` directly in templates (small, one-off icons)
2. Imported as `.svg` file URL and rendered via `<img :src="icon" />`

Inline SVGs use `stroke="currentColor"` so they inherit text color.

---

## Error Handling

No global error handler or toast system exists. Current pattern:
- Simple `alert('준비 중입니다')` for unimplemented features.
- No try/catch in components (no async API calls yet).

When adding real error handling: show inline error messages near the relevant field/action.

---

## Key Conventions Summary

1. `<script setup>` only — no Options API.
2. `@/` alias for all internal imports.
3. CSS custom properties for all design tokens — no hard-coded values.
4. BEM class naming in all CSS files.
5. Views are lazy-loaded in the router.
6. Feature views are grouped in `src/views/<domain>/`.
7. Shared primitives live in `src/components/` with `App` prefix.
8. Large view CSS goes in a companion `.css` file; small components use inline `<style scoped>`.
9. No TypeScript — plain JavaScript. Do not add `.ts` files or `lang="ts"`.
10. Mobile-first layout: all views are designed for max-width 480 px.

---

## Anti-Patterns (Known Tech Debt)

- **Hard-coded hex in inline SVGs**: `stroke="#007AFF"` in 12+ view files. Should use `stroke="currentColor"` + CSS color.
- **Hard-coded px in CSS**: Widespread despite convention. Design token vars exist but only cover spacing/typography at macro level; component-specific values still raw px.
- **Direct Supabase in views**: ~~`RoleSelectView.vue`~~ FIXED — now uses `useProfile.saveRole()` composable. No remaining direct Supabase calls in views.
- **Auth listener leak**: `_authSubscription` in auth store never unsubscribed (low risk in SPA but not ideal).

---

## Notes

- **Korean throughout**: All code comments, error messages, and UI strings are in Korean (한국어).
- **준비 중 스텁 views**: Chat, manual, workout, payment views now show "준비 중" stubs (Phase 2 예정). MemoWriteView is now live. Look for `준비 중입니다` text in stub views.
- **No test runner, no linting**: Code quality is convention-based only. No ESLint, Prettier, or Vitest configured.
- **Dev server on 0.0.0.0**: Vite binds all interfaces for mobile testing on local network.
