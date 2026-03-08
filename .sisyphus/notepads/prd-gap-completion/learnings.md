# Learnings — prd-gap-completion

## 2026-03-08 Session Start

### Project Conventions
- Vue 3 `<script setup>` only — no Options API
- `@/` alias for all internal imports
- CSS Custom Properties — no hardcoded hex/px
- BEM naming in all CSS files
- Mobile-first layout: max-width 480px
- Korean UI text throughout
- Never call Supabase directly from views — always use composables

### Key Patterns
- Logout confirm: use browser `confirm()` — see `SettingsView.vue:handleLogout()`
- Destructive action confirm: use `AppBottomSheet` — see `TrainerMemberDetailView.vue:202-208`
- New views: follow `MemberMemoView.vue` pattern (header + loading + empty + list)
- Edit mode via route param: follow `ManualRegisterView.vue` pattern
- Composable pattern: `loading` + `error` refs, Korean error messages, try/catch/finally

### Guardrails (from Metis)
- 글로벌 토스트/알림 시스템 신규 생성 금지
- 확인(confirm) 전용 composable 생성 금지
- auth 외 composable에 재시도 로직 추가 금지
- 회원 수납 뷰에 결제 생성/분석/차트 추가 금지 — 읽기전용 리스트만
- MemoWriteView 외 별도 메모 편집 뷰 생성 금지
- 캘린더 주간/일간 뷰 추가 금지

## Task: Add "완료" Button to Approved Reservation Card

**Completed:** 2026-03-08

### What Was Done
- Added "완료" (Complete) button to approved reservation cards in `ReservationManageView.vue`
- Button placed in new `res-card__actions` div after `res-card__meta` section
- Button uses existing `handleComplete(item)` function (line 294)
- Styled with `res-card__btn res-card__btn--approve` classes
- Includes checkmark SVG icon matching pending card pattern

### Key Details
- **File Modified:** `src/views/trainer/ReservationManageView.vue`
- **Lines Added:** 186-195 (divider + actions section)
- **Pattern Reference:** Pending card actions (lines 124-137)
- **Build Status:** ✅ Passed (`npm run build`)

### Implementation Pattern
```html
<div class="res-card__divider" />
<div class="res-card__actions">
  <button class="res-card__btn res-card__btn--approve" @click="handleComplete(item)">
    <svg>...</svg>
    완료
  </button>
</div>
```

### Verification
- Build completed successfully with no errors
- No new functions created (reused existing `handleComplete`)
- Button only appears on approved cards (not pending)
- Consistent with existing UI patterns

## Task: Add Delete Button to Memo Card in TrainerMemberDetailView

**Completed:** 2026-03-08

### What Was Done
- Added delete button (trash icon) to memo card in `memo-card__top` section
- Button placed next to time display in new `memo-card__actions` div
- Clicking button opens `AppBottomSheet` confirmation dialog
- Confirmation dialog shows: "이 메모를 삭제하시겠습니까?" (Delete this memo?)
- Confirmed deletion calls `deleteMemo(memo.id)` and closes dialog
- Cancel button closes dialog without deleting

### Key Details
- **File Modified:** `src/views/trainer/TrainerMemberDetailView.vue`
- **Lines Added:**
  - Template: memo card delete button (lines 176-184)
  - Template: AppBottomSheet dialog (lines 218-224)
  - Script: `showDeleteMemoSheet` ref (line 246)
  - Script: `deleteMemoTarget` ref (line 247)
  - Script: `handleDeleteMemo(memo)` function (lines 289-292)
  - Script: `confirmDeleteMemo()` function (lines 294-300)
  - Script: Added `deleteMemo` to useMemos destructure (line 241)
- **Pattern Reference:** Existing disconnect sheet (lines 210-216)
- **Build Status:** ✅ Passed (`npm run build` - 953ms)

### Implementation Pattern
```html
<!-- Delete button in memo card -->
<button class="memo-card__delete-btn" @click="handleDeleteMemo(memo)">
  <svg>...</svg>
</button>

<!-- Confirmation sheet -->
<AppBottomSheet v-model="showDeleteMemoSheet" title="메모 삭제">
  <p class="mem-detail__sheet-desc">이 메모를 삭제하시겠습니까?</p>
  <div class="mem-detail__sheet-actions">
    <button @click="showDeleteMemoSheet = false">취소</button>
    <button @click="confirmDeleteMemo">삭제</button>
  </div>
</AppBottomSheet>
```

### Verification
- Build completed successfully with no errors
- Delete button only appears on memo cards (not elsewhere)
- AppBottomSheet pattern matches existing disconnect dialog
- All refs and functions properly scoped to component
- No new composables or global state created

## 2026-03-08: Notification Filter Extension (7→30 days)

**Task**: Extended notification fetch window from 7 days to 30 days in `useNotifications.js`

**Changes Made**:
- Line 4: Updated JSDoc comment '7일 이내' → '30일 이내'
- Line 22: Updated function comment '7일 이내' → '30일 이내'
- Line 27: Changed `fetchNotifications()` filter: `7 * 24 * 60 * 60 * 1000` → `30 * 24 * 60 * 60 * 1000`
- Line 73: Changed `markAllAsRead()` filter: `7 * 24 * 60 * 60 * 1000` → `30 * 24 * 60 * 60 * 1000`

**Verification**:
- ✅ grep confirms 0 instances of '7 * 24' remaining
- ✅ 2 instances of '30 * 24' found (lines 27, 73)
- ✅ npm run build succeeded (310.69 kB gzipped)

**Pattern**: Composable time-window filters are calculated inline using `Date.now() - milliseconds`. Variable naming (`sevenDaysAgo`) kept for clarity despite 30-day window.


## Task: Add Cancel Button to Approved Reservation Card

**Completed:** 2026-03-08

### What Was Done
- Added "취소" (Cancel) button to approved reservation cards in `ReservationManageView.vue`
- Button placed in `res-card__actions` div next to "완료" (Complete) button
- Clicking button opens `AppBottomSheet` confirmation dialog
- Confirmation dialog shows: "{{ cancelTarget?.partner_name }} 님의 예약을 취소하시겠습니까?" (Cancel reservation?)
- Dialog includes optional textarea for cancellation reason (max 200 chars)
- Confirmed cancellation calls `updateReservationStatus(item.id, 'cancelled')`
- Button styled with `res-card__btn res-card__btn--reject` classes (red color)

### Key Details
- **File Modified:** `src/views/trainer/ReservationManageView.vue`
- **Lines Added:**
  - Template: Cancel dialog (lines 25-47)
  - Template: Cancel button in approved card (lines 215-220)
  - Script: `showCancelDialog`, `cancelTarget`, `cancelReason` refs (lines 317-319)
  - Script: `handleCancel(item)` function (lines 321-326)
  - Script: `confirmCancel()` function (lines 328-337)
- **Pattern Reference:** Reject dialog (lines 6-23) and reject functions (lines 299-315)
- **Build Status:** ✅ Passed (`npm run build` - 998ms)

### Implementation Pattern
```html
<!-- Cancel button in approved card actions -->
<button class="res-card__btn res-card__btn--reject" @click="handleCancel(item)">
  <svg>...</svg>
  취소
</button>

<!-- Confirmation sheet -->
<AppBottomSheet v-model="showCancelDialog" title="예약 취소">
  <div class="cancel-dialog">
    <p class="cancel-dialog__text">
      <strong>{{ cancelTarget?.partner_name }}</strong> 님의 예약을 취소하시겠습니까?
    </p>
    <textarea
      v-model="cancelReason"
      class="cancel-dialog__textarea"
      placeholder="취소 사유를 입력해주세요 (선택)"
      rows="3"
      maxlength="200"
    />
    <div class="cancel-dialog__actions">
      <button @click="showCancelDialog = false">취소</button>
      <button @click="confirmCancel">취소</button>
    </div>
  </div>
</AppBottomSheet>
```

### Verification
- ✅ Build completed successfully with no errors
- ✅ Cancel button only appears on approved cards (not pending)
- ✅ AppBottomSheet pattern matches existing reject dialog
- ✅ Uses existing `updateReservationStatus()` composable function
- ✅ No new composables or global state created
- ✅ Follows established pattern from reject dialog implementation

### Key Insight
Destructive action dialogs in this codebase follow a consistent pattern:
1. Template: `AppBottomSheet` with title + content + action buttons
2. Script: Three refs (`show*Dialog`, `*Target`, optional `*Reason`)
3. Script: Two functions (`handle*()` to open, `confirm*()` to execute)
4. Styling: Dialog content uses `*-dialog__*` BEM classes
5. Confirmation calls composable function and refreshes data via `store.invalidate()` + `fetch*()`

## Task: Add Notifications on Connection Request/Approval

**Completed:** 2026-03-08

### What Was Done
- Added notification when member requests connection to trainer in `useTrainerSearch.js`
- Added notification when trainer approves connection request in `TrainerMemberView.vue`
- Both notifications use existing `createNotification()` utility from `useNotifications.js`
- Notification failures wrapped in try/catch to prevent blocking main functionality

### Key Details
- **Files Modified:**
  - `src/composables/useTrainerSearch.js` (lines 11, 95-130)
  - `src/views/trainer/TrainerMemberView.vue` (lines 241-242, 307-339)

- **Notification Types Used:**
  - `connection_requested` — sent to trainer when member requests connection
  - `connection_approved` — sent to member when trainer approves connection

- **Pattern Reference:** 
  - Enum values from `supabase/schema.sql:732-737`
  - createNotification signature: `createNotification(userId, type, title, body, targetId?, targetType?)`

- **Build Status:** ✅ Passed (`npm run build` - 976ms, 310.69 kB gzipped)

### Implementation Details

**useTrainerSearch.js - requestConnection()**
```javascript
// After successful insert into trainer_members table:
try {
  const memberProfile = auth.profile
  await createNotification(
    trainerId,
    'connection_requested',
    '새로운 연결 요청',
    `${memberProfile?.name || '회원'}님이 연결을 요청했습니다.`
  )
} catch (notifError) {
  console.error('알림 발송 실패:', notifError)
  // 알림 발송 실패가 메인 기능을 막지 않도록 처리
}
```

**TrainerMemberView.vue - handleApprove()**
```javascript
// After successful approveConnection():
const connection = pendingRequests.value.find(r => r.id === connectionId)
const memberId = connection?.member_id

if (memberId) {
  try {
    const { createNotification } = useNotifications()
    const auth = useAuthStore()
    await createNotification(
      memberId,
      'connection_approved',
      '연결 승인',
      `트레이너 ${auth.profile?.name || '님'}님이 연결을 승인했습니다.`
    )
  } catch (notifError) {
    console.error('알림 발송 실패:', notifError)
  }
}
```

### Key Insights
1. **Composable Usage in Views**: `useNotifications()` can be called inside event handlers (not just at component setup)
2. **Error Isolation**: Notification failures should never block the main operation (connection request/approval)
3. **Enum Validation**: Always verify notification_type enum values in schema.sql before using
4. **Profile Access**: Use `auth.profile?.name` for trainer name in notifications (safer than `auth.user.user_metadata`)

### Verification
- ✅ Build completed successfully with no errors
- ✅ Both notification types exist in schema.sql enum
- ✅ createNotification properly imported in both files
- ✅ Error handling prevents notification failures from blocking main flow
- ✅ No duplicate imports (fixed initial issue with TrainerMemberView.vue)

---
## 인증/로그인 에러 UI 패턴 (2026-03-08)

### AuthCallbackView.vue 에러 처리
- `loading = ref(true)` + `error = ref(null)` 추가 — 초기 loading=true로 시작
- 템플릿: `v-if="error"` → 에러 UI | `v-else-if="loading"` → 로딩 텍스트
- `handleRedirect(session)`: `!session` → error.value 설정 후 return (redirect 하지 않음)
- `auth.hydrateFromSession` try/catch 감싸기 — 에러 시 error.value 설정
- 타임아웃: `router.replace('/login')` 대신 `error.value` + `loading.value = false`
- 에러 아이콘: inline SVG, `stroke="currentColor"` + `.auth-callback__error-icon { color: var(--color-red) }` 로 색상 주입
- '다시 시도' 버튼: `@click="router.replace('/login')"` (자동 retry 없음)

### LoginView.vue 에러 처리
- `const { error }` 구조분해가 outer `error` ref를 섀도잉하므로 → `const { error: oauthError }` 로 rename 필수
- `error.value = null` reset을 handleKakao 시작 시 반드시 추가 (재시도 시 이전 에러 지우기)
- 에러 메시지는 `.login-view__actions` 안 카카오 버튼 위에 `v-if="error"` p 태그로 표시
- CSS는 동반 파일(LoginView.css)에 추가: `color: var(--color-red)`, 하드코딩 금지

### 공통 패턴
- 에러 메시지: 한국어 완성형 문장으로 (예: '카카오 로그인에 실패했습니다. 다시 시도해주세요.')
- 글로벌 에러 핸들러 금지 — 뷰 로컬 error ref만 사용
- CSS custom property `--color-red` 사용 (#FF3B30 하드코딩 금지)
