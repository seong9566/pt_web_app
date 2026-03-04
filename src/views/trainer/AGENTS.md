# Trainer Views

Largest view domain: 16 views + 15 companion CSS files. Covers trainer dashboard,
member management, scheduling, reservations, settings, and several mock-data placeholders.

---

## Implementation Status

### Live (Supabase-connected)

| View | Route | Composable |
|------|-------|------------|
| `TrainerHomeView` | `/trainer/home` | `useMembers`, `useReservations` |
| `TrainerScheduleView` | `/trainer/schedule` | `useReservations` |
| `TrainerMemberView` | `/trainer/members` | `useMembers` |
| `TrainerMemberDetailView` | `/trainer/members/:id` | `useMemos` |
| `ReservationManageView` | `/trainer/reservations` | `useReservations` |
| `TrainerProfileView` | `/trainer/profile` | `useProfile` |
| `WorkTimeSettingView` | `/trainer/settings/work-time` | `useWorkHours` |
| `SettingsView` | `/trainer/settings` | (auth store) |
| `TrainerSearchView` | `/search` | `useTrainerSearch` |
| `MemoWriteView` | `/trainer/members/:id/memo/write` | `useMemos` |

### 준비 중 스텁 (Phase 2 예정 — DB 테이블 없음)

| View | Route | Notes |
|------|-------|-------|
| `TrainerChatView` | `/trainer/chat` | 준비 중 스텁 (No companion CSS) |
| `TrainerManualView` | `/trainer/settings/manual` | 준비 중 스텁 |
| `ManualRegisterView` | `/trainer/settings/manual/register` | 일부 mock 콘텐츠 잔존 |
| `TodayWorkoutView` | `/trainer/schedule/workout` | 준비 중 스텁 |
| `MemberPaymentView` | `/trainer/members/:id/payment` | 준비 중 스텁 |
| `PaymentWriteView` | `/trainer/members/:id/payment/write` | 준비 중 스텁 |

---

## Conventions (specific to this directory)

- Every view has a companion `.css` file (exception: `TrainerChatView.vue`)
- CSS linked via `<style src="./ViewName.css" scoped>`
- Route paths: `/trainer/*` (except `TrainerSearchView` at `/search`)
- `meta: { hideNav: true }` on sub-pages (write forms, settings sub-views)
- `TrainerSearchView` is semantically member-facing (members search for trainers) but lives here

---

## Anti-Patterns

- Hard-coded SVG colors (`fill="#9CA3AF"`) in `TrainerScheduleView.vue` — use `currentColor`
- 3 TODO comments in `ManualRegisterView.vue` and `SettingsView.vue` (API integration, notifications)
- Stat card counts (24, 18, 4) in `TrainerMemberView.vue` remain hardcoded — not yet connected to real data
