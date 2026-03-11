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

## [2026-03-11] F4 Verdict Decision
- Scope fidelity 판정 기준은 "계획 Acceptance + 지정 검증 명령 + Must NOT" 3축으로 고정한다.
- Task 11, Task 12가 계획 수용 기준을 충족하지 못해 전체 F4 판정은 REJECT로 결정한다.
- 계획 문서 변경 파일은 구현 스코프 외 산출물로 보고 contamination/unaccounted에 별도 반영한다.
