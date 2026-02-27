# AGENTS.md — PT 매니저 Web App

Reference guide for AI coding agents working in this repository.

---

## Project Overview

A Vue 3 mobile-first PWA for managing personal training sessions. The app centers on a
480 px max-width container layout (simulated phone shell). Stack: **Vue 3 + Vite + Pinia +
Vue Router 4**. No TypeScript — plain JavaScript throughout.

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
│   ├── main.js               # App bootstrap: createApp → Pinia → Router → mount
│   ├── App.vue               # Root: <router-view> + conditional <BottomNav>
│   ├── assets/
│   │   ├── css/global.css    # Design system: CSS custom properties, reset, base styles
│   │   └── icons/            # SVG icon files
│   ├── components/           # Shared UI primitives (App-prefixed)
│   ├── router/index.js       # All route definitions (flat list, lazy-loaded)
│   └── views/                # Feature pages, grouped by domain
│       ├── home/
│       ├── invite/
│       ├── login/
│       ├── onboarding/
│       └── trainer/
├── docs/                     # Design specs (font_color_guide.md, PRD)
├── index.html
├── vite.config.js
└── package.json
```

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

Pinia is installed and registered in `main.js`. **No stores exist yet** — all view state is
local `ref()` variables. When adding stores:

- Place in `src/stores/` (create the directory).
- Use `defineStore('storeName', () => { ... })` (Composition API style).
- Import with `useXxxStore()` naming.

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

/* Typography */
--fs-display: 24px  --fw-display: 700
--fs-title:   20px  --fw-title:   700
--fs-body1:   16px  --fw-body1-bold: 600  --fw-body1-reg: 400
--fs-body2:   14px  --fw-body2:   400
--fs-caption: 12px  --fw-caption: 400

/* Layout */
--app-max-width: 480px
--side-margin:   20px
--nav-height:    68px

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
| `ProgressBar` | `currentStep`, `totalSteps` | Renders step-indicator dots for onboarding flows |
| `BottomNav` | — | Fixed bottom navigation; hidden via route `meta.hideNav` |

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
