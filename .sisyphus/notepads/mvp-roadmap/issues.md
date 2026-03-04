# MVP Roadmap — Issues

## Known Issues (from plan)
- TrainerProfileView has NO save logic (P0 blocker)
- TrainerHomeView is 100% hardcoded (0 composable imports)
- MemberReservationView: createReservation() never called
- MemberSettingsView: auth.logout() typo (should be auth.signOut())
- MemberSettingsView: hardcoded { name: '김회원', email: 'member@ptapp.com' }
- useMemos: createMemo() function missing
- RoleSelectView: direct supabase.from() call (tech debt)
- src/views/trainer/AGENTS.md: inaccurate "Live" status markers

## Fixed Issues (2026-03-04)

### Critical Runtime Bugs Fixed
1. **TrainerScheduleView.vue** — Missing `.value` on `reservations` ref (3 locations)
   - Line 282: `dotsData` computed — changed `reservations.forEach()` → `reservations.value.forEach()`
   - Line 351: `sessions` computed — changed `reservations.filter()` → `reservations.value.filter()`
   - Line 428: `getSessionsForDay()` function — changed `reservations.filter()` → `reservations.value.filter()`
   - Line 386: Fixed `weekDays` computed to use `dotsData.value[fullDate]` instead of `dotData[dateNum]`

2. **MemberScheduleView.vue** — Missing `.value` on `reservations` ref + incomplete cancel handler
   - Line 252: `selectedDaySessions` computed — changed `reservations.filter()` → `reservations.value.filter()`
   - Line 150: Added `updateReservationStatus` to destructured imports from `useReservations()`
   - Line 273-277: Implemented `handleCancel()` to call `updateReservationStatus()` and refresh data

3. **useProfile.js** — Local ref shadowing outer composable refs
   - `saveTrainerProfile()`: Removed local `loading` and `error` refs, now uses outer `uploading` and `error` refs
   - `saveRole()`: Removed local `loading` and `error` refs, now uses outer `uploading` and `error` refs
   - Both functions now return boolean (true = success, false = error) instead of `{ loading, error }`

4. **TrainerProfileView.vue** — Updated to handle boolean return from `saveTrainerProfile()`
   - Line 76: Added `error: profileError, uploading` to destructured imports
   - Line 120-134: Changed to check boolean return and read error from composable's `profileError` ref

5. **RoleSelectView.vue** — Updated to handle boolean return from `saveRole()`
   - Line 72: Added `error: roleError, uploading` to destructured imports
   - Line 83-98: Changed to check boolean return and read error from composable's `roleError` ref

6. **MemberSettingsView.vue** — Removed debug alert
   - Line 123: Changed `alert('이동: ' + target)` → `alert('준비 중입니다')`

### Build Status
✅ `npm run build` — Exit code 0 (946ms)
- All 171 modules transformed successfully
- No TypeScript errors
- Production bundle generated: dist/

### Impact
These fixes resolve runtime failures that occurred despite successful builds:
- Refs not being accessed with `.value` caused undefined behavior in computed properties
- Local ref shadowing prevented UI state updates during async operations
- Incomplete cancel handler prevented reservation cancellation
- Debug alert exposed unimplemented features
