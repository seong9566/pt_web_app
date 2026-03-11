# MVP Polish — Decisions

## Architecture Decisions
- Global Toast: src/stores/toast.js (Pinia) + App.vue single instance + useToast.js updated internally
- AppSkeleton: single component with type prop (line/circle/rect), no per-view components
- Playwright: chromium only, 480px viewport, EmailLoginView for auth bypass
- SVG cleanup: currentColor + parent CSS color variable, fill="none" stays

## Guardrails Confirmed
- NO new CSS variables beyond what's necessary
- NO component-specific sizes (48px avatar, 6px dot) as variables
- NO box-shadow px values as variables
- NO Auth view (6 files) Supabase direct call cleanup
- NO reservations Realtime
- NO external icon libraries
