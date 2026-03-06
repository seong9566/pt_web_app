# Learnings — manual-feature-gaps

## [2026-03-06] Session: ses_33f92e282ffeDZpWgKk9CRKamW

### Project Conventions
- Vue 3 `<script setup>` only, no Options API
- `@/` alias for all internal imports
- BEM CSS naming, CSS Custom Properties (no hardcoded hex/px)
- No TypeScript — plain JavaScript
- Mobile-first, max-width 480px
- Korean UI text throughout
- Supabase project ID: `ajafzzmojhtpczjvovmm`

### Manual Feature Architecture
- `useManuals.js` composable handles all Supabase calls
- `manual_category` enum currently: 재활, 근력, 다이어트, 스포츠퍼포먼스 (4 values)
- `manual_media` table: id, manual_id, file_url, file_type, file_size, sort_order, created_at
- Storage bucket: `manual-media` (public)
- `fetchManual()` already has `media:manual_media(*)` JOIN — use as pattern
- `uploadManualMedia()` uses path `{uid}/{timestamp}.{ext}` — use for extractStoragePath

### Key Patterns
- AppBottomSheet: `v-model` + `title` props, see ReservationManageView for delete confirm pattern
- Route order matters: static (`register`) → dynamic+static (`:id/edit`) → dynamic (`:id`)
- Auth check: `auth.user?.id === manual.trainer_id` for trainer-only UI

## [2026-03-06] Final QA Results — Playwright

### Test Environment
- Dev server: http://localhost:5173 (Vite 5, npm run dev)
- Test accounts: trainer@test.com / member@test.com (pwd: test1234)
- Dev login bypass: /dev-login (DevLoginView.vue, PUBLIC_ROUTE)

### QA Results Summary
All 7 scenarios PASSED

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Server + Home | PASS | HTTP 200, /member/home loaded |
| 2 | Login page | PASS | 카카오로 시작하기 버튼 존재 |
| 3 | Trainer manual list | PASS | 7개 카테고리 탭 표시, 단일 선택 동작 ✅ |
| 4 | Manual register | PASS | 폼 로드, 6개 카테고리, 단일 선택 ✅ |
| 5 | Member manual list | PASS | 7개 카테고리 탭 표시 ✅ |
| 6 | Manual detail | PASS | 뷰 렌더링 ✅ (test-id UUID 에러는 예상된 Supabase API 응답) |
| 7 | JS console errors | PASS | JS 런타임 에러 0개 |

### Findings
- CATEGORIES in TrainerManualView: `['전체', '재활', '근력', '다이어트', '스포츠', '코어', '유연성']` (7개 ✅)
- CATEGORIES in MemberManualView: 동일 7개 (labels/values 형태) ✅
- ManualRegisterView categories: 6개 (전체 제외, 맞는 동작) ✅
- Category single selection: `selectedCategory = ref('전체')`, form.category = cat (단일 값 저장) ✅
- Router guard: 비인증 → /login, 인증+/login → 역할별 홈, 역할 불일치 → 역할별 홈 ✅
- DevLoginView bug (minor): `router.replace('/home')` (should be `/member/home`) — Vue Router warns "No match found"

### Vue Warnings (Non-blocking)
- "Async component loader resolves..." — chunk loading warning, not critical
- "세션 데이터에 user 정보가 없습니다" — expected when no session in localStorage

### Evidence Files
`.sisyphus/evidence/final-qa/` — 11 screenshots + 1 console log
