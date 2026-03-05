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

## 2026-03-05 — T38 Test design decisions
- 단위 테스트는 composable별 파일 분리(`src/composables/__tests__/*.test.js`)로 유지하고, 각 파일에 독립된 Supabase/Auth mock을 둬 테스트 간 상태 오염을 방지함
- `useReservations`의 PT 0 예약 차단 요구는 `checkPtCount` 반환값 검증으로 커버 (UI/E2E 대신 composable 비즈니스 로직 단위 검증)
- 날짜 기준 로직(`useNotifications` 7일 필터)은 `vi.setSystemTime`으로 고정해 flaky 없이 임계값 문자열을 직접 검증함
