# MVP Polish — Issues & Gotchas

## Known Issues
- /dev-login redirects to /email-login — always use /email-login directly for E2E
- SVG fill="none" must NOT be changed (viewBox background)

## Watch Out For
- AppSkeleton: use BEM naming .app-skeleton--line, .app-skeleton--circle, .app-skeleton--rect
- Toast store: keep useToast() API backward compatible
- Auth cleanup: only add unsubscribe to signOut(), don't change auth flow logic
