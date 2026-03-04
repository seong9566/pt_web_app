# Learnings — fix-auth-callback

## 2026-03-04 Session Start

### Architecture
- `src/lib/supabase.js` — Supabase client singleton. Line 18: `detectSessionInUrl: true` → must be `false`
- `src/stores/auth.js` — Pinia auth store. `hydrateFromSession` defined at line 110 but NOT in return object (lines 216-228). Must add to return.
- `src/views/auth/AuthCallbackView.vue` — OAuth callback. Currently uses direct ref assignment (`auth.user = session.user`) which bypasses fetchProfile chain. Must use `auth.hydrateFromSession(session)` instead.
- `src/main.js` — 24 lines. `auth.initialize()` at line 22 NOT awaited. `app.mount('#app')` at line 24. Must wrap in async IIFE.
- `src/App.vue` — 19 lines. `<BottomNav v-else />` renders when role is null. Must add `&& auth.role` to outer template + `v-else-if="auth.role === 'member'"` to BottomNav.

### Key Insight
- Two different "role" concepts: `session.user.role = "authenticated"` (Supabase JWT, always this value) vs `profiles.role` ('trainer'|'member') — app custom role from DB
- Auth store's `role` ref is synced from `profile.value?.role ?? null` via `syncRoleFromProfile()`
- `hydrateFromSession(session)` → sets session/user refs → calls `fetchProfile()` → calls `setProfile()` → calls `syncRoleFromProfile()` — this is the full chain that sets `auth.role`

### Conventions
- Plain JavaScript only (no TypeScript)
- `<script setup>` only (no Options API)
- `@/` alias for all internal imports
- CSS custom properties for all design tokens
- BEM class naming
