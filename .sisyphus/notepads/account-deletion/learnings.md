# Account Deletion — Learnings

## [2026-03-08] Session Start

### Key Architecture Facts
- `softDeleteAccount()` already exists in `useProfile.js` lines 251-266 — incomplete (only renames profile + signOut)
- Both Settings views already have deletion UI (AppBottomSheet + '탈퇴' text confirmation)
- All 23 FK relationships use ON DELETE CASCADE — deleting auth.users auto-deletes everything
- Supabase blocks deleting users who own Storage objects → Storage cleanup MUST happen BEFORE auth.users deletion
- `notification_type` enum has 10 values, needs `account_deleted` added
- `chat-files` bucket has NO SELECT policy → storage.list() returns empty → policy must be added
- auth.admin.deleteUser() requires service_role key → use RPC function (SECURITY DEFINER) instead

### Execution Order (CRITICAL)
1. Notify connected users (before CASCADE deletes trainer_members)
2. Clean up Storage files (before auth.users deletion — Supabase blocks deletion if user owns objects)
3. Call RPC `delete_user_account()` → CASCADE deletes all public tables
4. signOut() → clear local session

### Pattern References
- SECURITY DEFINER RPC pattern: `supabase/schema.sql:458-494` (connect_via_invite)
- Storage best-effort delete: `src/composables/useManuals.js:189-201`
- createNotification signature: `src/composables/useNotifications.js:99-115`
- Test mock pattern: `src/composables/__tests__/useWorkoutPlans.test.js:1-38`

## [2026-03-09] Task 1: DB Migrations — COMPLETED

### Migrations Applied
1. ✅ RPC function `delete_user_account()` created
   - Uses SECURITY DEFINER + SET search_path = public pattern
   - Deletes auth.users by auth.uid() (no user_id parameter)
   - Verified: pg_proc query returned 1 row

2. ✅ Enum value `account_deleted` added to notification_type
   - Used IF NOT EXISTS guard (idempotent)
   - Verified: pg_enum query returned 1 row

3. ✅ Storage policy "Users can list own chat files" created
   - Allows SELECT on chat-files bucket
   - Condition: (storage.foldername(name))[1] = auth.uid()::text
   - Verified: pg_policies query returned 1 row

### Key Findings
- Project ID: ajafzzmojhtpczjvovmm (FitLink)
- All migrations applied successfully using apply_migration tool
- All verifications passed with execute_sql
- Evidence files saved to .sisyphus/evidence/task-1-*.txt

### Next Steps
- Implement useProfile.deleteAccount() composable (calls RPC + cleanup)
- Add account deletion UI to Settings views
- Create notification system for connected users

## [2026-03-09] Task 2: softDeleteAccount Enhancement — COMPLETED

### Import pattern used
- Added `import { useNotifications } from '@/composables/useNotifications'` after useAuthStore import
- Destructured inside useProfile(): `const { createNotification } = useNotifications()`
- Placed BEFORE uploading/error refs (line 16)

### Storage list path format
- `supabase.storage.from('avatars').list(auth.user.id)` — folder = user ID
- Response: `{ data: [{ name: 'filename.jpg', ... }] }`
- Full path for remove: `${auth.user.id}/${item.name}`

### Implementation details
- Step 1: Query trainer_members with `.or()` filter for both trainer_id and member_id
- Step 2: Notifications in try-catch with empty catch (silently ignored per spec)
- Step 3a: avatars bucket cleanup — try-catch with console.warn on failure
- Step 3b: chat-files bucket cleanup — try-catch with console.warn on failure
- Step 4: RPC `delete_user_account()` — no params, throws on error
- Step 5: signOut() after successful RPC
- Old `profiles.update({ name: '탈퇴한 사용자' })` logic fully removed

### Build result
- `npm run build` → exit code 0 ✅
- 206 modules transformed, built in 1.23s
- useProfile chunk: 4.54 kB (gzip: 1.63 kB)

## [2026-03-09] Task 2 Fix: manual-media + notification body

### manual-media path extraction
- URL format: `https://xxx.supabase.co/storage/v1/object/public/manual-media/path/file.jpg`
- Extract with: `url.slice(url.indexOf('/manual-media/') + '/manual-media/'.length)`
- Gated on `auth.profile?.role === 'trainer'` — no-op for member role

### notification body with user name
- `const userName = auth.profile?.name || '사용자'` declared before notification loop
- Body: `${userName}님이 탈퇴했습니다.`
- Test mock has no profile → userName = '사용자' → test expects '사용자님이 탈퇴했습니다.'

### Test update required
- useProfile.test.js line 114: updated from old body text to new personalized text
- All 85 tests passed after update
