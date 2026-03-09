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

## 2026-03-09 Video Thumbnail Auto-Generation

- `src/utils/video.js` 신규 유틸 추가: `generateVideoThumbnail(file)`는 `<video>` + `<canvas>`로 0.1초 지점 프레임을 JPEG Blob(quality 0.7)으로 변환하고 실패 시 `null` 반환.
- `useManuals.createManual()`/`useManuals.addManualMedia()`에서 영상 업로드 성공 직후 썸네일 생성/업로드를 동일 플로우로 실행.
- 썸네일은 `manual_media`에 `file_type: image/jpeg`, `sort_order: -1`로 저장되어 기존 `getThumbUrl()`의 `image/` 검색 로직에서 자동 선택됨.
- 썸네일 생성 실패(`.mov` 디코딩 실패 등)는 catch에서 무시하여 원본 영상 업로드 흐름을 막지 않음.
- 검증 결과: `npm run build` 통과, `npx vitest run` 85/85 통과.
