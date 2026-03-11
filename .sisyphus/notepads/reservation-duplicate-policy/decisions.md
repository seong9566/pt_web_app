# Decisions — reservation-duplicate-policy

## [2026-03-11] Session ses_3258a72feffepyAhte0xLwexOS — Plan Start

### Policy Decision
- **Old**: First-come-first-served (unique index on pending+approved)
- **New**: Allow duplicates + trainer chooses (unique index on approved only)
- **Auto-reject**: DB trigger (CTE pattern) when status → approved
- **Notifications**: Both auto-reject (trigger) AND manual approve/reject (frontend)

### Same-member duplicate: BLOCK
- Same member cannot create 2 pending reservations for same slot
- RPC explicit check: `IF EXISTS ... WHERE member_id = v_member_id AND status = 'pending'`

### Approved slot: BLOCK new pending
- If slot already has approved reservation, new pending is blocked
- RPC explicit check: `IF EXISTS ... WHERE status = 'approved'`

### Past pending cleanup: ADD to cron
- `auto_complete_past_reservations` extended to also reject past pending reservations
- rejection_reason: '예약 시간이 경과하여 자동 거절되었습니다'

### Slot display (3 states)
- approved exists → '마감' (disabled)
- pending only → '대기중' + pendingCount (selectable)
- empty → '가능' (selectable)

### Trainer UI
- Keep flat list (no grouping)
- Add notification on manual approve/reject only
- Auto-reject notifications handled by DB trigger (no frontend duplication)

### Test strategy
- Vitest unit tests AFTER implementation (Task 8)
- DB verification via mcp_supabase_execute_sql
- UI verification via Playwright
