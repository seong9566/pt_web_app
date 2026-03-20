---
name: PT Web App Architecture Patterns
description: Key architectural patterns and conventions discovered in the PT web app codebase
type: project
---

Key patterns observed in the codebase as of 2026-03-20:

**Realtime subscription pattern (validated):**
- chatBadgeStore and notificationBadgeStore both use identical subscribe/unsubscribe pattern
- Internal `_channel` variable prevents duplicate subscriptions
- TrainerBottomNav manages lifecycle via onMounted/onUnmounted
- visibilitychange event handler for foreground refresh

**Toast system:**
- Single-instance toast: stores/toast.js + composables/useToast.js + components/AppToast.vue
- Currently pointer-events: none (no interactive elements)
- Teleported to body, z-index 9999

**Reservations store:**
- TTL-based cache (5 min) with dirty flag invalidation
- No Realtime subscription yet (only chatBadge and notificationBadge have it)
- Exposed API: reservations, lastFetchedAt, isStale, loadReservations, invalidate, $reset

**How to apply:** When planning features that touch these systems, reference these patterns for consistency and effort estimation.
