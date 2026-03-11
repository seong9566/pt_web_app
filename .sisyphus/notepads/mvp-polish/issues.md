# MVP Polish — Issues & Gotchas

## Known Issues
- /dev-login redirects to /email-login — always use /email-login directly for E2E
- SVG fill="none" must NOT be changed (viewBox background)

## Watch Out For
- AppSkeleton: use BEM naming .app-skeleton--line, .app-skeleton--circle, .app-skeleton--rect
- Toast store: keep useToast() API backward compatible
- Auth cleanup: only add unsubscribe to signOut(), don't change auth flow logic

- 2026-03-11 F1 audit: REJECT. Must NOT Have retry-pattern grep hit in src/views/auth/AuthCallbackView.vue:11 and :156; evidence for task 9 is missing (.sisyphus/evidence/task-9-no-loading-text.txt expected by plan).

- 2026-03-11 F4 scope check: Task 11/12 미준수 확인. 계획 기준 색상 잔존 20건, spacing/radius px 잔존 다수(20px 61건, radius 4건).
- 2026-03-11 F4 scope check: 계획 파일 `.sisyphus/plans/mvp-polish.md` 워킹트리 변경 감지(READ ONLY 규칙 위반 가능성, unaccounted change로 분류).
