# Learnings — ux-improvements-email-auth

## 2026-03-09 Session Start

### Project Conventions
- `<script setup>` only — no Options API
- `@/` alias for all internal imports
- CSS Custom Properties + BEM naming
- No code comments (// comment forbidden)
- No TypeScript, no new npm packages
- Composable-only tests (no Vue component tests)
- Large views use companion `.css` file; small components use inline `<style scoped>`

### Key Data Facts
- useManuals.js already fetches `trainer:profiles!trainer_id(name, photo_url)` — ManualDetailView just needs to display photo_url
- `getThumbUrl()` function is duplicated in TrainerManualView (line 171) and MemberManualView (line 133) — both only check image media, no YouTube fallback
- YouTube video ID extraction already exists in ManualDetailView (lines 171-178)
- YouTube thumbnail URL pattern: `https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg`
- MemberScheduleView uses `scard--${session.status}` dynamic class — DB status is `completed` but CSS only has `.scard--done` (bug!)
- Supabase email auth is already enabled, auto-confirm ON (test users have email_confirmed_at set immediately)
- DevLoginView.vue already has working signUp + signInWithPassword logic
- auth.user.app_metadata.provider = 'kakao' | 'email' for provider detection

### Auth Flow (post-auth is identical for Kakao and Email)
1. Auth → session → hydrateFromSession() → fetchProfile()
2. If no profile → /onboarding/role
3. If profile exists → role-based home

### Supabase Project
- Project ID: ajafzzmojhtpczjvovmm (ap-northeast-1)
- Email auto-confirm: ON (no email verification UI needed)
