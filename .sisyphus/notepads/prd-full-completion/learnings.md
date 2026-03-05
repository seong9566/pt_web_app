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
