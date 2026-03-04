# MVP Roadmap — Decisions

## 2026-03-04 Session Start
- Working directly in main worktree (no separate worktree needed for this plan)
- Wave execution strategy: Wave 1 (T1-T6) → Wave 2 (T7-T12) → Wave 3 (T13-T18) → Final (F1-F4)
- Task 1 (TrainerProfileView save) is P0 blocker — must complete first before T2, T7
- Task 2 depends on Task 1 (trainer name in DB)
- Tasks 3, 4, 5, 6, 12 are independent — can run in parallel with T1
- Commit strategy: T1 separate commit, T2-T6 grouped, T7-T12 grouped, T13-T16 grouped
