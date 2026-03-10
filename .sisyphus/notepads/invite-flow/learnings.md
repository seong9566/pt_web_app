# Learnings — invite-flow

## [2026-03-10] Session: ses_329928efcffeY7wf2dZAaCvRXU

### Project Conventions
- Vue 3 + Vite + Pinia + Vue Router 4 + Supabase
- No TypeScript — plain JavaScript
- `<script setup>` only — no Options API
- `@/` alias for all internal imports
- CSS Custom Properties for all design tokens
- BEM class naming
- Korean UI strings throughout

### Key Files for This Plan
- `src/router/index.js` — PUBLIC_ROUTES array at line 12
- `src/views/invite/InviteEnterView.vue` — target for Task 2
- `src/views/auth/AuthCallbackView.vue` — handleRedirect() at lines 34-57
- `src/views/login/EmailLoginView.vue` — handleSubmit() at lines 136-190
- `src/views/onboarding/MemberProfileView.vue` — handleComplete() at lines 182-228
- `src/views/onboarding/RoleSelectView.vue` — script setup at lines 62-99
- `src/composables/useInvite.js` — redeemInviteCode() at lines 83-100
- `src/composables/useProfile.js` — saveRole(userId, role)
- `src/stores/auth.js` — setRole() at lines 47-64, user ref at lines 14-20

### Architecture Decisions
- localStorage key: `pending_invite_code`
- Code persists through login/signup flow, deleted only on success
- On RPC failure: keep code in localStorage for retry, still navigate to /member/home
- No new files — only modify existing 7 files
- No DB schema changes, no RLS changes
