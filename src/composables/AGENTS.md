# Composables — Supabase Data Access Layer

All Supabase interactions MUST go through composables. Views never call Supabase directly.

```
View → useXxx() → supabase client → DB
```

---

## Pattern

Every composable follows this structure:

```js
export function useXxx() {
  const data = ref(...)
  const loading = ref(false)
  const error = ref(null)

  async function fetchData() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase.from('table').select(...)
      if (fetchError) throw fetchError
      // transform and assign
    } catch (e) {
      error.value = e?.message ?? '한국어 fallback message'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchData }
}
```

Key rules:
- Always return `loading` + `error` refs alongside data
- Error messages in Korean (한국어)
- Private helper functions (not exported) for domain logic (e.g., time math in `useReservations`)
- Import auth store via `useAuthStore()` for current user ID

---

## Inventory

| Composable | Domain | Supabase Tables/RPC |
|---|---|---|
| `useReservations` | Slot calculation, booking CRUD, status changes | `work_schedules`, `reservations`, `trainer_members` + `create_reservation` RPC |
| `useMembers` | Trainer's member list + reservation stats | `trainer_members`, `profiles`, `member_profiles`, `reservations` |
| `useInvite` | Invite code generate/validate/connect | `invite_codes` + `connect_via_invite` RPC |
| `useWorkHours` | Trainer schedule settings (per-weekday) | `work_schedules` |
| `useTrainerSearch` | Search trainers + connection requests | `trainer_members`, `profiles`, `trainer_profiles` |
| `useProfile` | Avatar upload to Storage | Supabase Storage `avatars` bucket |
| `useMemos` | Member notes CRUD | `memos`, `profiles` |

---

## Anti-Patterns

- `RoleSelectView.vue` calls Supabase directly — should use a composable
- Utility functions (time math, date helpers) are embedded in composables, not shared across them
