# MVP Roadmap — Learnings

## Project Conventions
- Vue 3 + Vite + Pinia + Vue Router 4 + Supabase
- No TypeScript — plain JavaScript throughout
- `<script setup>` only — no Options API
- `@/` alias for all internal imports
- CSS Custom Properties for all design tokens
- BEM class naming
- Korean strings throughout (no i18n)
- Mobile-first, max-width 480px

## Composable Pattern
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

## View Wiring Pattern (canonical)
```js
// From MemberHomeView.vue:186-205
import { useXxx } from '@/composables/useXxx'
const { data, loading, error, fetchData } = useXxx()
onMounted(async () => {
  await fetchData()
})
```

## Key Files
- `src/composables/useProfile.js` — uploadAvatar/updateProfilePhoto
- `src/composables/useReservations.js` — fetchAvailableSlots, createReservation, getConnectedTrainerId, fetchMyReservations, updateReservationStatus
- `src/composables/useMembers.js` — fetchMembers()
- `src/composables/useWorkHours.js` — fetchWorkHours(), saveWorkHours()
- `src/composables/useTrainerSearch.js` — searchTrainers(), requestConnection()
- `src/composables/useMemos.js` — fetchMemos(), fetchMemberDetail(), deleteMemo()
- `src/composables/useInvite.js` — invite code management
- `src/stores/auth.js` — signOut() (NOT logout())
- `src/views/onboarding/MemberProfileView.vue:172-198` — double upsert pattern for profiles + member_profiles

## DB Tables
- profiles (id, role, name, phone, photo_url)
- trainer_profiles (id, specialties, bio)
- member_profiles (id, age, height, weight, goal)
- trainer_members (trainer_id, member_id)
- invite_codes
- work_schedules
- reservations (status: pending→approved→completed/rejected)
- memos (id, trainer_id, member_id, content, tags, created_at)

## AppCalendar dots format
`{ day: ['pending'|'approved'|'done'|'cancelled'] }`
