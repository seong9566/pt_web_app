# Account Workout Dashboard - Learnings

## Conventions
- Animation timing tokens go in global.css after Components section
- Use fadeSlideUp keyframes for card entrance animations
- Always include prefers-reduced-motion media query
- Soft delete uses 30-day grace period
- Individual exercise copy appends to current list (not replace)

## Patterns
- RPC functions use SECURITY DEFINER + set search_path = public
- pg_cron uses function→schedule 2-step structure
- RLS policies need deleted_at IS NULL filter for searchable/connected
- Owner policy remains unchanged (needed for account cancellation)
#PQ|- profiles.deleted_at is nullable timestamptz and should be placed after created_at
#LK|- soft_delete_user_account/cancel_account_deletion follow auth.uid() update pattern on profiles
#RT|- purge_deleted_accounts should delete from auth.users via 30-day deleted_at threshold and run by pg_cron daily
