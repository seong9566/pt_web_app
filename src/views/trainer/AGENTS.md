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

### Mock Data (hard-coded, not yet implemented)

| View | Route | Notes |
|------|-------|-------|
| `TrainerChatView` | `/trainer/chat` | No companion CSS |
| `TrainerManualView` | `/trainer/settings/manual` | List view |
| `ManualRegisterView` | `/trainer/settings/manual/register` | Form view |
| `TodayWorkoutView` | `/trainer/schedule/workout` | Workout plan |
| `MemberPaymentView` | `/trainer/members/:id/payment` | Payment records |
| `PaymentWriteView` | `/trainer/members/:id/payment/write` | Payment form |
| `MemoWriteView` | `/trainer/members/:id/memo/write` | Memo form |

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
