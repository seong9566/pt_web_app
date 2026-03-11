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

## [2026-03-11] Playwright 검증 결과

### invite-flow 프론트엔드 UI 검증

**서버**: localhost:5174 (5173 포트 이미 사용 중)

**시나리오 1 - 미인증 접근 허용**
- `/invite/enter` 접근 시 `/login`으로 리다이렉트 되지 않음 ✅
- PUBLIC_ROUTES 설정 정상 동작 확인
- 페이지 타이틀 "초대 코드 입력" 표시됨 ✅

**시나리오 2 - 딥링크 코드 자동 채우기**
- `?code=CF4VO2` 쿼리 파라미터로 접근 시
- 6개 텍스트박스에 C, F, 4, V, O, 2 순서대로 자동 채워짐 ✅
- `onMounted`에서 route.query.code 파싱 후 각 필드에 할당 정상 동작

**시나리오 3 - 미인증 상태 버튼**
- 하단 버튼: "로그인 / 회원가입 하러 가기" 표시됨 ✅
- CSS 클래스 `.invite-enter__confirm-btn` 확인됨
- auth.user가 null일 때 조건부 렌더링 정상 동작

**스크린샷 증거**
- `.sisyphus/evidence/task-1-unauthenticated-access.png`
- `.sisyphus/evidence/task-2-auto-fill-code.png`
- `.sisyphus/evidence/task-2-unauthenticated-btn.png`
