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
