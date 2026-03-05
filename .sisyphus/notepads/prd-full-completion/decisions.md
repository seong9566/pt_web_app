# PRD Full Completion — Decisions

## 2026-03-05 Session Start
- Working directly in main worktree (no separate worktree)
- mvp-roadmap confirmed complete (all 18 tasks + F1-F4 done, build passing)
- Switching to prd-full-completion plan
- Wave execution strategy:
  - Wave 1 (T1-T10): DB schema + infra — PARALLEL (T1 independent, T2-T10 parallel)
  - Wave 2 (T11-T20): Composables — PARALLEL (all independent, blocked by Wave 1)
  - Wave 3 (T21-T28): Core views — PARALLEL (blocked by Wave 2)
  - Wave 4 (T29-T33): Profile/account/nav — PARALLEL (blocked by Wave 2-3)
  - Wave 5 (T34-T39): Dashboard integration + tests — PARALLEL (blocked by Wave 3-4)
  - Wave 6 (T40-T41): E2E + final build — SEQUENTIAL (blocked by Wave 5)
  - Final (F1-F4): Verification — PARALLEL (blocked by Wave 6)

## Key Architecture Decisions (from user interview + Metis)
- Chat: Supabase Realtime, trainer_members pair = implicit chat room (no rooms table)
- Manual videos: direct upload (500MB) + YouTube URL both supported
- PT count: 0 blocks reservations (create_reservation RPC enforces this)
- Notifications: 7-day retention (not 30-day PRD default)
- Account deletion: soft delete (profile anonymization, data preserved)
- connection_status enum: 'pending' added for search-based connection flow
- memos RLS: member read access added (SELECT WHERE member_id = auth.uid())
- PT auto-deduction: DB trigger on reservation status → 'completed'
