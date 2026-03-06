# Learnings — data-fetch-optimization

## [2026-03-06] Session Start
- Project: Vue 3 + Pinia + Supabase PWA, JavaScript only (no TypeScript)
- Only 1 Pinia store exists: src/stores/auth.js — use as pattern for new stores
- All composables are per-instance stateful (reactive refs inside exported function)
- BottomNav.vue has duplicate getUnreadCount() bug: line 31 discards result, line 32 re-calls
- BottomNav polls chat unread (messages table), NOT notifications
- MemberHomeView bell uses notifications unread (notifications table) — DIFFERENT data
- DB trigger trg_auto_deduct_pt fires on completed reservation → pt_sessions INSERT (invisible to client)
- 6 tab views all use identical pattern: onMounted(!loaded → loadData) + onActivated(loaded → loadData)
- keep-alive covers 7 views: TrainerHomeView, TrainerScheduleView, TrainerMemberView, TrainerMemberDetailView, MemberHomeView, MemberScheduleView, MemberSettingsView
- ptSessions needs Map-based cache (per-member data, multiple cache keys)
- Composable API surface MUST NOT change — thin wrapper pattern
- loading/error MUST stay component-local, NOT in Pinia stores
- useReservations thin-wrapper migration can keep composable-local `loading`/`error` while delegating list fetch to `reservationsStore.loadReservations(role, false)`
- For test stability, instantiate `useReservationsStore()` inside `fetchMyReservations()` (lazy) instead of top-level composable scope when some unit tests run without active Pinia

## Task 10 — Badge Store Delegation (2026-03-06)

### Pattern Applied
- `useChat.getUnreadCount()` and `useNotifications.getUnreadCount()` now delegate to Pinia badge stores instead of querying Supabase directly
- BottomNav + TrainerBottomNav replaced `useChat()` with `useChatBadgeStore()` directly — uses `storeToRefs` for reactive `chatUnreadCount`

### Key Pinia Detail
- Pinia setup-store properties ARE auto-unwrapped on the store proxy: `store.unreadCount` returns the raw number (not a ref)
- `storeToRefs(store).unreadCount` returns the actual Ref object — correct for reactive binding in templates
- Visibility-change handler calls `loadUnreadCount(true)` (force=true) to bypass cache; onMounted calls `loadUnreadCount()` (no force, uses cache if fresh)

### Import Pattern
```js
import { storeToRefs } from 'pinia'
import { useChatBadgeStore } from '@/stores/chatBadge'
const chatBadgeStore = useChatBadgeStore()
const { unreadCount: chatUnreadCount } = storeToRefs(chatBadgeStore)
```
- [2026-03-06] Task 8: useMembers.js thin wrapper pattern
  - Pinia setup stores: `store.property` auto-unwraps refs (via reactive() internally) → use `membersStore.members` NOT `membersStore.members.value`
  - Test pattern for composables that depend on Pinia stores: add `setActivePinia(createPinia())` in beforeEach — creates fresh store state per test, bypassing TTL cache
  - vi.mock for supabase/auth modules applies to store imports too — no extra mocking needed for store internals
  - loadMembers(false) with fresh Pinia instance: isStale() returns true (lastFetchedAt=null) → proceeds to fetch ✓

## Task 13 — AppPullToRefresh 6개 탭 뷰 적용 (2026-03-06)

### 패턴
- `<AppPullToRefresh @refresh="handleRefresh">` 를 최외곽 div 바로 안에 삽입
- 닫는 태그는 spacer div 바로 뒤에 배치 (nav-height spacer 포함)
- import는 기존 import 블록 마지막에 추가 — 중복 금지
- handleRefresh는 onMounted/onActivated 바로 위에 선언

### MemberSettingsView 특이사항
- 파일에 루트 레벨에 AppBottomSheet 2개 있음 → settings div 안에만 래퍼 삽입
- AppPullToRefresh가 settings div 안, AppBottomSheet들은 settings div 밖 유지

### MemberScheduleView 특이사항
- FAB(position:fixed) 버튼도 AppPullToRefresh 안에 포함 — fixed 포지셔닝이라 DOM 위치와 무관하게 뷰포트 기준 렌더링됨

### store 메서드 확인
- `reservationsStore.loadReservations(role, force)` — trainer/member 양쪽 사용
- `membersStore.loadMembers(force)` — TrainerHome + TrainerMember
- `ptSessionsStore.loadMemberOwnPtCount(force)` — MemberSettings

## Task 14 — View-level cross-invalidation wiring (2026-03-06)

- Mutation orchestration stays in views: composables/store 내부에서 다른 store invalidate를 직접 호출하지 않음
- `ReservationManageView`에서 status mutation 성공 시 `reservationsStore.invalidate()` 호출, `completed`는 `ptSessionsStore.invalidate()`도 함께 호출
- `MemberReservationView` 예약 생성 성공 직후 `reservationsStore.invalidate()` 호출로 member/trainer 예약 목록 캐시 동기화
- `PtCountManageView`의 수동 PT 증감 성공 직후 `ptSessionsStore.invalidate()` + `membersStore.invalidate()` 호출로 횟수/회원 요약 카드 캐시 동시 무효화
- `TrainerMemberView` 연결 승인 성공 직후 `membersStore.invalidate()` 호출 후 기존 UI refresh 흐름 유지
