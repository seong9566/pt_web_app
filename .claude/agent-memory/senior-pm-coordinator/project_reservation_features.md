---
name: Reservation Management Feature Planning (6, 7, 8)
description: Mid/long-term feature plan for trainer bottom nav dot, undo toast, and Supabase Realtime subscription for reservations
type: project
---

Feature 6/7/8 spec written to `docs/specs/feature-6-7-8-spec.md` on 2026-03-20.

**Why:** Trainer needs real-time awareness of member change requests without manual refresh. Three features build on each other: nav dot (awareness), undo toast (safety net), realtime (instant updates).

**How to apply:**
- Implementation order: 6 (nav dot) -> 7 (undo toast) -> 8 (realtime)
- Existing Realtime pattern in chatBadgeStore and notificationBadgeStore should be reused for feature 8
- Toast system currently has `pointer-events: none` -- must be changed for action buttons in feature 7
- `approve_change_request` RPC behavior (whether it clears requested_* fields) must be verified before implementing Undo
- Supabase Realtime must be enabled for `reservations` table in dashboard
