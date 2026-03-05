# PRD Full Completion — Learnings

## Inherited from mvp-roadmap

### Project Conventions
- Vue 3 + Vite + Pinia + Vue Router 4 + Supabase
- No TypeScript — plain JavaScript throughout
- `<script setup>` only — no Options API
- `@/` alias for all internal imports
- CSS Custom Properties for all design tokens (src/assets/css/global.css)
- BEM class naming: `.block__element--modifier`
- Korean strings throughout (no i18n)
- Mobile-first, max-width 480px
- No ESLint, Prettier, or test runner (Vitest being added in T1)

### Composable Pattern (canonical)
```js
export function useXxx() {
  const loading = ref(false)
  const error = ref(null)
  
  async function doSomething() {
    loading.value = true
    error.value = null
    try {
      // supabase call
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }
  
  return { loading, error, doSomething }
}
```

### View Wiring Pattern (canonical)
```js
import { useXxx } from '@/composables/useXxx'
const { data, loading, error, fetchData } = useXxx()
onMounted(async () => {
  await fetchData()
})
```

### Key Existing Files
- `src/composables/useProfile.js` — uploadAvatar, saveTrainerProfile, saveRole, updateProfilePhoto
- `src/composables/useReservations.js` — fetchAvailableSlots, createReservation, getConnectedTrainerId, fetchMyReservations, updateReservationStatus
- `src/composables/useMembers.js` — fetchMembers()
- `src/composables/useWorkHours.js` — fetchWorkHours(), saveWorkHours()
- `src/composables/useTrainerSearch.js` — searchTrainers(), requestConnection()
- `src/composables/useMemos.js` — fetchMemos(), fetchMemberDetail(), deleteMemo(), createMemo()
- `src/composables/useInvite.js` — invite code management
- `src/stores/auth.js` — signOut() (NOT logout()), user/profile/role/session/loading refs
- `src/router/index.js` — all routes with lazy loading

### DB Tables (current)
- profiles (id uuid PK → auth.users, role user_role, name, phone, photo_url)
- trainer_profiles (id FK → profiles, specialties text[], bio)
- member_profiles (id FK → profiles, age, height, weight, goals text[], notes)
- trainer_members (id, trainer_id, member_id, invite_code_used, connected_at, status connection_status)
- invite_codes (id, trainer_id, code UNIQUE, is_active, created_at)
- work_schedules (id, trainer_id, day_of_week 0-6, start_time, end_time, is_enabled, slot_duration_minutes)
- reservations (id, trainer_id, member_id, date, start_time, end_time, status reservation_status, session_type, created_at, updated_at)
- memos (id, trainer_id, member_id, content, tags jsonb, created_at)

### Enums (current)
- user_role: 'trainer', 'member'
- connection_status: 'active', 'disconnected' (T8 adds 'pending')
- reservation_status: 'pending', 'approved', 'rejected', 'cancelled', 'completed'

### RPCs (current)
- connect_via_invite(p_code) — invite code connection
- create_reservation(p_trainer_id, p_date, p_start_time, p_end_time, p_session_type) — T10 modifies this

### Storage (current)
- avatars bucket (public)

### Known Bugs Fixed (from mvp-roadmap)
- useProfile.js: local ref shadowing fixed — functions return boolean (true=success, false=error)
- TrainerScheduleView: missing .value on reservations ref fixed
- MemberScheduleView: missing .value + incomplete cancel handler fixed

### BottomNav Structure
- BottomNav.vue (member): navItems v-for loop, icon span + label span per item
- TrainerBottomNav.vue (trainer): same structure
- Badge goes AFTER icon span, BEFORE label span
- Visibility: `!route.meta.hideNav && auth.role` in App.vue

### Stub Views (to be replaced in Phase 2)
- TrainerChatView.vue — "채팅 기능을 준비 중입니다"
- MemberChatView.vue — "준비 중입니다"
- MemberManualView.vue — "운동 매뉴얼 기능을 준비 중입니다"
- TrainerManualView.vue — "운동 매뉴얼 기능을 준비 중입니다"
- ManualDetailView.vue — partial (mock data)
- ManualRegisterView.vue — partial (form UI)
- TodayWorkoutView.vue — "오늘의 운동 기능을 준비 중입니다"
- MemberPaymentView.vue — "수납 기록 기능을 준비 중입니다"
- PaymentWriteView.vue — "수납 기록 기능을 준비 중입니다"

## Tasks 13-14: usePayments + usePtSessions Composables

**Date**: 2026-03-05

### Implementation Summary
- Created `src/composables/usePayments.js` with 4 functions:
  - `fetchPayments(memberId)` — 수납 목록 조회 (최신순)
  - `createPayment(memberId, amount, paymentDate, memo?)` — 수납 기록 생성 (amount > 0 검증)
  - `deletePayment(paymentId)` — 수납 기록 삭제
  - `totalAmount` computed — 총 수납액 계산

- Created `src/composables/usePtSessions.js` with 4 functions:
  - `fetchPtHistory(memberId)` — PT 횟수 변동 이력 조회 (최신순)
  - `getRemainingCount(memberId)` — 잔여 횟수 조회 (DB SUM)
  - `addSessions(memberId, amount, reason?)` — 횟수 추가 (amount > 0 검증)
  - `deductSessions(memberId, amount, reason?)` — 횟수 차감 (음수 저장, 잔여 횟수 검증)
  - `remainingCount` computed — 잔여 횟수 계산

### Pattern Adherence
- Followed `useMemos.js` pattern exactly:
  - `loading`, `error`, `data` refs
  - Try-catch-finally with Korean error messages
  - Mutation functions return boolean (true/false)
  - Auth store integration via `useAuthStore()`
  - Supabase client via `@/lib/supabase`

### Validation Rules Implemented
- **usePayments**: amount ≤ 0 → error, return false
- **usePtSessions**: 
  - addSessions: amount ≤ 0 → error, return false
  - deductSessions: amount ≤ 0 → error, return false
  - deductSessions: remaining < amount → error, return false

### Build Status
- `npm run build` → exit 0 ✓
- No TypeScript, no new packages added
- Commit: `c35abb0`

### Notes
- Both composables follow the established docstring convention (module-level + function-level JSDoc)
- No direct Supabase calls in views — all data access goes through composables
- Ready for integration into payment/PT session views

## Task 12: useNotifications Composable

**Date**: 2026-03-05

### Implementation Summary
- Created `src/composables/useNotifications.js` with 5 functions:
  - `fetchNotifications()` — 7일 이내 알림 목록 조회 (최신순), unreadCount 자동 갱신
  - `getUnreadCount()` — 미읽은 알림 수만 조회 (배지용, count 쿼리)
  - `markAsRead(notificationId)` — 개별 읽음 처리 + 로컬 상태 동기화
  - `markAllAsRead()` — 전체 읽음 처리 + 로컬 상태 동기화
  - `createNotification(userId, type, title, body, targetId?, targetType?)` — 알림 생성 유틸 (silent error)

### Key Design Decisions
- `createNotification` uses `console.error` only (no throw) — silent utility for other composables
- `markAsRead`/`markAllAsRead` update local `notifications.value` in-place after DB update (no re-fetch)
- `getUnreadCount` uses `{ count: 'exact', head: true }` for efficient count-only query
- 7-day filter applied consistently in both `fetchNotifications` and `getUnreadCount`/`markAllAsRead`

### notification_type enum values
`'reservation_requested'`, `'reservation_approved'`, `'reservation_rejected'`, `'reservation_cancelled'`, `'new_message'`, `'workout_assigned'`, `'connection_requested'`, `'connection_approved'`, `'pt_count_changed'`, `'payment_recorded'`

### notifications table columns
`id`, `user_id`, `type` (notification_type enum), `title`, `body`, `target_id` (uuid, nullable), `target_type` (text, nullable), `is_read`, `created_at`

### Build Status
- `npm run build` → exit 0 ✓
- Commit: `abdf354`

## Tasks 16-17: useWorkoutPlans + useHolidays Composables

### Implementation Pattern
- Both composables follow the established pattern from `useWorkHours.js` and `useMemos.js`
- Consistent structure: `loading`, `error`, `data` refs + async functions returning boolean for mutations
- Error messages in Korean (한국어)

### useWorkoutPlans.js
- **fetchWorkoutPlan(memberId, date)**: Single date lookup via `.maybeSingle()`
- **fetchWorkoutPlans(memberId)**: Full history ordered by date DESC
- **saveWorkoutPlan(memberId, date, content)**: UPSERT with `onConflict: 'trainer_id,member_id,date'`
  - Includes `updated_at: new Date().toISOString()` for tracking modifications
  - Returns boolean; refetches after successful save
- **deleteWorkoutPlan(planId)**: Removes from DB and local array

### useHolidays.js
- **fetchHolidays(trainerId, month?)**: Optional month filter (YYYY-MM format)
  - Stores dates as array of strings for easy `.includes()` checks
  - Filters via `.gte()` and `.lte()` on date range
- **setHoliday(date)**: INSERT with duplicate prevention (checks local array first)
  - Maintains sorted array after insertion
- **removeHoliday(date)**: DELETE by trainer_id + date
- **isHoliday(date)**: Pure function for holiday status check

### Key Decisions
1. **UPSERT pattern**: Used `onConflict` parameter matching DB unique constraints
2. **Array storage for holidays**: Enables O(1) lookup via `.includes()` for UI checks
3. **Month filtering**: Implemented client-side via date range queries (not RPC)
4. **Sorted holidays**: Maintained via `.sort()` after insertion for consistency

### Build Status
- ✅ `npm run build` → exit 0
- ✅ No TypeScript added
- ✅ No new npm packages
- ✅ Follows existing composable conventions

## Task 11 — useChat composable

### Realtime subscription pattern
- Channel name must be unique per conversation pair: `chat-${partnerId}-${me}` (not just `chat-${partnerId}`)
- Always call `unsubscribe()` before re-subscribing to avoid duplicate channels
- Filter at DB level: `filter: 'receiver_id=eq.${me}'`, then additionally filter in callback for the specific partner
- `supabase.removeChannel(channel)` cleanly tears down the Realtime subscription

### fetchConversations grouping strategy
- Query messages with `or(sender_id.eq.${me},receiver_id.eq.${me})` ordered DESC
- Use `Map` to group by partner — insertion order guarantees most-recent conversation first
- First message encountered per partner is the latest message (DESC order)
- Count unread per partner in same pass (avoid N+1 queries)

### getUnreadCount pattern
- `select('id', { count: 'exact', head: true })` returns `count` not `data` — head:true skips row fetching
- Sets `unreadCount.value` reactive ref directly for badge use

### uploadChatFile
- Check `file.type.startsWith('image/')` for image vs other detection
- 10MB for images, 50MB for other files
- Path: `${userId}/${Date.now()}-${filename}` avoids collisions
- `getPublicUrl()` is synchronous (no await) — returns `{ data: { publicUrl } }`

### Build result
- 171 modules transformed, 938ms build — no new bundle overhead from this composable

## Task 15 — useManuals composable (2026-03-05)

### Pattern: Multi-step create with media upload
- `createManual` does: validate → DB insert → loop file uploads → insert manual_media records
- Returns `manual.id` (truthy) on success, `false` on failure — callers check truthiness
- `uploadManualMedia` is separate public function so views can upload individual files independently

### Validation approach
- Photo count cap (10): checked before any DB/storage calls, sets `error.value` + returns `false`
- YouTube regex: checked before DB insert; also re-checked in `updateManual` if `updates.youtube_url` present
- File size: thrown inside `uploadManualMedia` so the error propagates to `createManual`'s catch block

### YouTube regex
```js
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/
```
Covers: `http(s)://`, `www.` optional, both `youtube.com/watch?v=` and `youtu.be/` short URLs.

### Storage pattern (manual-media bucket)
- Path: `{userId}/{timestamp}.{ext}` — same convention as avatars bucket
- `supabase.storage.from('manual-media').upload(path, file)` — no `upsert:true` (media never overwritten)
- `getPublicUrl(path)` returns `{ data: { publicUrl } }`

### Size limits
- Video (`file.type.startsWith('video/')`) → 500MB = `500 * 1024 * 1024`
- Photo → 10MB = `10 * 1024 * 1024`

### Supabase joins
- `profiles!trainer_id(name, photo_url)` — disambiguate FK when table has multiple FK to profiles
- `manual_media(*)` joined as `media` alias via `.select('*, media:manual_media(*)')`

### build check
- 171 modules, built in ~955ms — file has zero side effects on bundle

## TrainerSearchView + TrainerMemberView — Connection Status & Pending Tab (2026-03-05)

### useTrainerSearch.js — searchTrainers() update
- Changed single `status='active'` query to `in('status', ['active', 'pending'])` + select `trainer_id, status`
- Use `forEach` to populate two Sets: `connectedTrainerIds` and `pendingTrainerIds`
- Added `pending` field to trainer object alongside existing `connected`

### TrainerSearchView.vue — 3-state button pattern
- `trainer.pending` → `<div class="trainer-card__badge trainer-card__badge--pending">요청 중</div>`
- `trainer.connected` → `<div class="trainer-card__badge trainer-card__badge--connected">연결됨</div>`
- neither → `<button class="trainer-card__btn trainer-card__btn--primary" ...>연결 요청</button>`
- Badge is a `<div>` (not a button) — no interactivity needed for status display

### TrainerMemberView.vue — Tab system pattern
- `activeTab` ref ('members' | 'pending'), tab bar between header and search
- `<template v-if="activeTab === 'members'">` wraps all existing content
- `<template v-else-if="activeTab === 'pending'">` for pending content
- `pendingRequests` ref managed locally in component (fetchPendingRequests returns array, no internal ref)
- Badge on tab: `v-if="pendingRequests.length > 0"` red badge
- `switchToPending()`: avoids re-fetch if data already loaded and pendingRequests.length > 0
  → But on first switch (length === 0 && !loading), always triggers load
- `processingId` ref prevents double-tap during approve/reject API calls

### formatRelativeTime helper
- Pure function, no composable needed — simple date math inline in view
- Returns: 방금 전 / N분 전 / N시간 전 / N일 전

### Pending operations pattern
- approve: DB update → filter local array → refresh active members (`fetchMembers()`)
- reject: DB delete → filter local array only (no member list refresh needed)

### CSS conventions followed
- Tab bar uses `border-bottom` underline pattern (not background-color active)
- Badge uses `var(--color-red)` for urgency indicator on tab
- Pending item approve/reject buttons: approve=blue-primary filled, reject=white+red-border

## Task 38 — Vitest composable unit tests (2026-03-05)

### Supabase mocking pattern for composables
- 각 테스트 파일에서 `vi.hoisted()`로 `authStore`/`supabase` mock 객체를 먼저 만들고, `vi.mock('@/lib/supabase')`, `vi.mock('@/stores/auth')`에 주입하면 ESM hoisting 문제 없이 안정적으로 동작한다.
- 체이닝 쿼리 테스트는 `createBuilder()` 헬퍼로 `select/eq/order/...`를 기본 self-return으로 두고, 마지막 체인 메서드(`maybeSingle`, `in`, `order`, `single`)만 `mockResolvedValue`로 시나리오별 값을 주는 방식이 가장 단순하다.

### Business-rule coverage added
- `useReservations`: PT 0 케이스(`checkPtCount`), 예약 슬롯 계산(마감/가능), 휴일 슬롯 초기화
- `usePtSessions`: 잔여 초과 차감 차단, 0 이하 차감 차단, 0 이하 추가 차단, 정상 추가 후 히스토리 갱신
- `useChat`: 대화 목록 그룹핑 + 안읽은 수 집계, 메시지 전송 insert payload 검증, 읽음 처리 필터 검증
- `useNotifications`: 7일 필터(`gte(created_at, sevenDaysAgo)`), 알림 생성 payload, 개별 읽음 처리 후 로컬 unreadCount 동기화

### Verification
- `npx vitest run` 통과: 5 files, 16 tests
- `npm run build` 통과: exit 0

## Profile Edit Views (2026-03-05)

### TrainerProfileEditView + MemberProfileEditView

- Both views follow the same structure as their onboarding counterparts (TrainerProfileView/MemberProfileView) but pre-fill from `auth.profile` refs
- `onMounted` pre-fills form from `auth.profile?.name`, `auth.profile?.phone`, `auth.profile?.trainer_profiles?.specialties` etc. — always use optional chaining since `trainer_profiles`/`member_profiles` may be null (fetchProfile only does `select('*')` on profiles table — no join)
- `useProfile()` returns `{ uploading, error, ... }` — rename `error` to `profileError` via destructuring alias to avoid shadowing in template
- Photo upload flow: click → `triggerFileInput()` → file `@change` → `URL.createObjectURL()` for local preview → `uploadAvatar(file)` → `updateProfilePhoto(url)` — no separate loading state needed (uploading ref handles it)
- Trainer specialty chips: `{ id: 'rehab'|'strength'|'diet'|'sports'|'core'|'flexibility', label: '재활'|'근력'|'다이어트'|'스포츠'|'코어'|'유연성' }` — 6 options in 2-column grid
- Member goal chips: `{ id: 'weight-loss'|'muscle-gain'|'rehab'|'endurance'|'flexibility'|'stress-relief', label: '체중감량'|'근력강화'|'재활'|'체력향상'|'유연성'|'스트레스해소' }` — 6 options in 2-column grid
- `updateTrainerProfile(name, specialties, bio)` → phone not saved (API limitation; phone field shown for display only)
- `updateMemberProfile(name, parseInt(age)||null, parseFloat(height)||null, parseFloat(weight)||null, goals)` → same pattern
- Routes: `/trainer/profile-edit` (name: `trainer-profile-edit`), `/member/profile-edit` (name: `member-profile-edit`), both `meta: { hideNav: true }`
- `npm run build` → exit 0 ✓ (188 modules)

## Account Management Features (2026-03-05)

### Pattern: useProfile composable extension
- Added `disconnectMember(memberId)`, `disconnectTrainer()`, `softDeleteAccount()` to `useProfile.js`
- All three follow the same try/catch/error.value pattern already used in the file
- `softDeleteAccount()` calls `supabase.auth.signOut()` directly (not `auth.signOut()` from store) to avoid store dependency issues — the composable already imports supabase directly
- New functions added to return object alongside existing ones

### Pattern: Bottom sheet confirmation flows
- AppBottomSheet uses `<Teleport to="body">` so placement in template doesn't affect rendering
- For two-button (cancel/confirm) sheets: wrap in `.settings__sheet-actions` with `flex: 1` on buttons
- For input+submit sheets: standalone input + full-width button (no wrapper needed)
- `v-model` controls open/close; close on cancel by setting ref to false

### CSS: Danger variant pattern
- No `--color-red-light` token exists — use `var(--color-gray-100)` for danger icon bg + `var(--color-red)` for text/icon color
- Override via BEM modifier: `.settings__row-icon--danger` + `.settings__row-label--danger`
- For quick-action danger: use child selectors `.quick-action--danger .quick-action__icon` and `.quick-action--danger .quick-action__label` to avoid extra modifier classes on child elements

### Shared CSS file strategy
- `SettingsView.css` is imported by both `SettingsView.vue` (trainer) AND `MemberSettingsView.vue`
- New sheet styles added to SettingsView.css are therefore available in both settings views
- TrainerMemberDetailView has its own CSS file — detail-specific sheet styles go there

## T35: MemberHomeView 대시보드 통합 (2026-03-05)

### usePtSessions 회원 컨텍스트 주의
- `getRemainingCount(memberId)`는 `auth.user.id`를 `trainer_id`로 필터 → 회원이 로그인한 경우 잘못된 쿼리
- 해결: `fetchRemainingByPair(memberId, trainerId)` 추가 — 양쪽 ID를 명시적으로 전달
- 회원 홈에서는 반드시 `getConnectedTrainerId()`로 트레이너 ID를 먼저 구한 뒤 호출

### useWorkoutPlans 회원 컨텍스트
- `fetchWorkoutPlan(memberId, date)` — auth 필터 없이 memberId+date로만 조회 → 회원 측에서 그대로 사용 가능
- 반환: `currentPlan` ref (single plan object or null)

### 데드 코드 정리
- `ptCount`, `ptCountPct`, `ptBars` computed — reservations 기반의 부정확한 PT 횟수 계산이었음. 제거.
- `todayWorkouts = []` — 사용하지 않는 빈 배열. 제거.
- `trainerIcon` import — 템플릿에서 미사용. 제거.

### onMounted 병렬/순차 전략
- `fetchMyReservations`, `fetchWorkoutPlan`, `getUnreadCount` → fire-and-forget (await 없이 호출)
- `getConnectedTrainerId` → await 필요 (결과로 fetchRemainingByPair 호출)
- `fetchRemainingByPair` → await 필요 (결과를 ptRemaining ref에 저장)

## T39: schema.sql 동기화 + AGENTS.md + README.md 업데이트 (2026-03-05)

### schema.sql 상태
- Phase 2 테이블들이 이미 schema.sql에 완전히 포함되어 있었음 (16개 테이블)
- messages, pt_sessions, payments, manuals, manual_media, workout_plans, notifications, trainer_holidays 모두 포함
- notification_type enum, connection_status 'pending', chat-files/manual-media 버킷, PT 자동차감 trigger 모두 포함
- schema.sql은 이미 최신 상태 → 수정 불필요

### AGENTS.md 변경사항
- Commands에 `npm test` / `npx vitest run` 추가 (vitest가 package.json에 이미 설치되어 있었음)
- "no test runner" 문구 → "Vitest is configured" 로 수정
- 디렉토리 구조에 `common/` 폴더 추가 (NotificationListView)
- member 뷰 카운트 8개로 업데이트, trainer 뷰 카운트 18개로 업데이트
- Where to Look 테이블에 useChat, useNotifications, usePayments, usePtSessions, useManuals, useWorkoutPlans, useHolidays 추가
- Notes의 "준비 중 스텁 views" → "Phase 2 완료" 로 업데이트

### README.md 변경사항
- composables 목록에 7개 새 composable 추가
- member/ views: [미구현] 제거, MemberMemoView/MemberProfileEditView 추가
- trainer/ views: [미구현] 제거, TrainerProfileEditView/PtCountManageView 추가, common/ 섹션 추가
- DB 스키마 테이블 8개 추가 (Phase 2 테이블)
- RPC 함수: create_reservation 설명에 PT 잔여 횟수 검증 추가
- Triggers 섹션 신규 추가 (trg_auto_deduct_pt)
- Storage 버킷: chat-files, manual-media 추가
- "미구현 기능 (Phase 2 예정)" → "구현 완료 기능 (Phase 2)" 로 완전 변경

### 빌드 결과
- npm run build → exit code 0 ✅ (188 modules transformed)
