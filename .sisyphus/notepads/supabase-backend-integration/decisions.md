- 2026-03-01: Added RPCs as `security invoker` so RLS policies still apply to caller identity; function-level validation handles invite and reservation preconditions.
- 2026-03-01: Added `storage.objects` policies for `avatars` to allow public reads and authenticated uploads, with owner-based update/delete constraints.

- Kept / for backward compatibility, but made them update  first and sync  from profile state.
- Triggered  in  immediately after Pinia registration so auth restore starts before first navigation settles.

- Kept setRole()/clearRole() for backward compatibility, but made them update profile first and sync role from profile state.
- Triggered auth.initialize() in main.js immediately after Pinia registration so auth restore starts before first navigation settles.
