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
