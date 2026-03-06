# Learnings — workout-assignment

## [2026-03-06] Session ses_33f92e282ffeDZpWgKk9CRKamW — Plan Start

### Project Conventions
- Vue 3 `<script setup>` only, no Options API
- `@/` alias for all internal imports
- BEM CSS naming: `.block__element--modifier`
- CSS custom properties from `src/assets/css/global.css` — no hard-coded hex
- Large views: companion `.css` file via `<style src="./ViewName.css" scoped>`
- Korean strings throughout (UI text, error messages, comments)
- No TypeScript — plain JavaScript

### Key File Locations
- Supabase project ID: `ajafzzmojhtpczjvovmm`
- workout_plans table: 0 rows (safe to migrate)
- useNotifications.js: createNotification() at lines 99-115 — first use case
- TodayWorkoutView.vue: 209 lines, textarea at lines 76-80
- TrainerScheduleView.vue: goWorkout() at line 544 (unused), sessions computed at 432-444
- MemberScheduleView.vue: selectedDaySessions computed at 289-298
- MemberHomeView.vue: workout card at lines 144-146 (currentPlan.content)
- NotificationListView.vue: navigateByTarget at lines 95-105 (workout → /home)

### exercises JSONB Structure
```json
[{ "name": "스쿼트", "sets": 3, "reps": 10, "memo": "" }]
```

### Notification Pattern (createNotification)
```js
createNotification(userId, type, title, body, targetId, targetType)
// For workout: createNotification(memberId, 'workout_assigned', '오늘의 운동이 배정되었습니다', summary, planId, 'workout')
```

### Upsert + Select Pattern (Task 2)
```js
const { data, error: err } = await supabase
  .from('workout_plans')
  .upsert({...}, { onConflict: 'trainer_id,member_id,date' })
  .select('id')
  .single()
```

## [2026-03-06] Task 2 Complete — useWorkoutPlans.js updated

### Changes Made
- `saveWorkoutPlan(memberId, date, content)` → `saveWorkoutPlan(memberId, date, exercises)`
- Upsert payload: `content` field → `exercises` field (JSONB array)
- `.select('id').single()` chained after upsert to capture plan ID
- `useNotifications` imported at top of file
- `createNotification(memberId, 'workout_assigned', '오늘의 운동이 배정되었습니다', formatExerciseSummary(exercises), data.id, 'workout')` called after upsert
- Private helper `formatExerciseSummary(exercises)` added (not exported):
  - Empty/null → '운동이 배정되었습니다'
  - 1 exercise → exercise name
  - N exercises → '{first} 외 {N-1}개'

### Confirmed Patterns
- `useNotifications()` can be called inside another composable function (not at top level) — works fine in Vue 3
- `formatExerciseSummary` private (not in return {}) — consistent with composable AGENTS.md pattern
- Build: ✅ 200 modules transformed, exit 0

## [2026-03-06] Task 6 Complete — useWorkoutPlans.test.js updated

### Changes Made
- **Test file rewritten** with 7 tests (4 existing + 2 new + 1 existing deleteWorkoutPlan)
- **Existing 4 tests updated**:
  1. `fetchWorkoutPlan` — `content: '스쿼트 3세트'` → `exercises: [{ name: '스쿼트', sets: 3, reps: 10, memo: '' }]`
  2. `fetchWorkoutPlan null case` — no changes needed (already generic)
  3. `saveWorkoutPlan success` — `content: '스쿼트'` → `exercises: [...]`, upsert mock changed to `.single()` chain
  4. `saveWorkoutPlan error` — `content: '스쿼트'` → `exercises: [...]`, upsert mock changed to `.single()` chain
- **createBuilder() enhanced**:
  - Already had `single: vi.fn()` — no changes needed
  - Supports `.select().single()` chain (both return builder, final `single()` resolves)
- **2 new tests added**:
  1. `saveWorkoutPlan 성공 시 createNotification을 호출한다` — verifies mock called with correct args
  2. `saveWorkoutPlan 실패 시 createNotification을 호출하지 않는다` — verifies mock NOT called on error
- **Mock setup**:
  - `mockCreateNotification = vi.fn().mockResolvedValue(undefined)` at top
  - `vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => ({ createNotification: mockCreateNotification }) }))`
  - `beforeEach(() => { vi.clearAllMocks() })` ensures clean state

### Test Results
```
✓ src/composables/__tests__/useWorkoutPlans.test.js (7 tests) 6ms
Test Files: 1 passed (1)
Tests: 7 passed (7)
```

### Key Insights
- Vitest `vi.fn()` mocks return builder when chained (`.select()` → builder, `.single()` → resolves)
- `mockResolvedValue()` on final method in chain (`.single()`) captures the return value
- `mockReturnValueOnce()` sequence allows different builders for upsert vs fetch calls
- `expect(mockCreateNotification).toHaveBeenCalledWith(...)` validates exact args
- `expect(mockCreateNotification).not.toHaveBeenCalled()` validates no call on error path

## [2026-03-06] Task F4 Complete — Scope Fidelity Check

### Verification Results
- Last 8 commits align with plan sequence: `6c7cf87 → 2f37fb9 → 245cbfd/c86c466/53c6120 → 85f8b36`
- `git diff HEAD~5..HEAD --name-only` returned 11 files, all mapped to Tasks 2-6 with no extras
- Targeted test passed: `npx vitest run src/composables/__tests__/useWorkoutPlans.test.js` → 7/7
- Build passed: `npm run build` (Vite production build success)
- LSP diagnostics on all changed JS/Vue files: clean (no diagnostics)

### Task-to-File Contamination Check
- Task 3 commit `245cbfd` touched only `TodayWorkoutView.vue/.css` (did not touch member detail files)
- Task 4 commit `c86c466` touched only member detail files + router (did not touch `TodayWorkoutView`)
- Task 5 commit `85f8b36` touched only 4 navigation files (did not touch `useWorkoutPlans.js`)
