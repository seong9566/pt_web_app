# Issues — workout-assignment

## [2026-03-06] Session ses_33f92e282ffeDZpWgKk9CRKamW — Plan Start

### Known Risks
1. `res.member_id` in TrainerScheduleView sessions computed — need to verify this field exists in reservations data returned by fetchMyReservations('trainer'). Task 5 agent must check useReservations.js to confirm.
2. upsert + select chain: `.upsert({...}).select('id').single()` — Supabase JS v2 supports this. Verify in Task 2.
3. createNotification is never called anywhere yet — first use case. Must match exact signature from useNotifications.js:99-115.

## [2026-03-06] Task F4 Follow-up

### Resolved Risks
1. `TrainerScheduleView` uses `member_id` in sessions mapping and forwards it via `goWorkout(session)` query.
2. upsert + `.select('id').single()` is implemented in `useWorkoutPlans.js` and validated by passing tests.
3. `createNotification` call exists with expected argument order and is covered by test assertions.

### Open Issues
- None found in scope fidelity audit.
