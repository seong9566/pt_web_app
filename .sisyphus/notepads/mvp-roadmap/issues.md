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
