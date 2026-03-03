- 2026-03-01: Supabase schema uses enum types (`user_role`, `connection_status`, `reservation_status`) plus partial unique indexes to enforce business rules at DB level (single active trainer per member, no double-booking pending/approved slots).
- 2026-03-01: RLS coverage was implemented table-by-table with `auth.uid()` checks and explicit connected-user access via `trainer_members` joins for cross-profile reads.

- Auth store now keeps , , , and derives  from  to keep legacy role APIs compatible.
-  uses a shared in-flight promise to avoid duplicate concurrent session hydration from router guards and app bootstrap.
-  is registered once and handles , , and  with profile refetch to keep role access control fresh.

- Auth store now keeps session, user, profile, and derives role from profile.role to keep legacy role APIs compatible.
- initialize() uses a shared in-flight promise to avoid duplicate concurrent session hydration from router guards and app bootstrap.
- onAuthStateChange is registered once and handles SIGNED_IN, SIGNED_OUT, and TOKEN_REFRESHED with profile refetch to keep role access control fresh.
