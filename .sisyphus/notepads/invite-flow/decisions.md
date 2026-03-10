# Decisions — invite-flow

## [2026-03-10] Session: ses_329928efcffeY7wf2dZAaCvRXU

### Wave Execution Plan
- Wave 1: Task 1 (router) + Task 2 (InviteEnterView) — sequential (T2 depends on T1)
- Wave 2: Task 3 (AuthCallbackView) + Task 4 (EmailLoginView) — parallel
- Wave 3: Task 5 (MemberProfileView) + Task 6 (RoleSelectView) — parallel
- Wave FINAL: F1-F4 — parallel

### Commit Strategy
- Wave 1 commit: `feat(invite): allow unauthenticated access to invite enter page with deep link support`
- Wave 2 commit: `feat(auth): auto-detect pending invite code on login and set member role`
- Wave 3 commit: `feat(onboarding): auto-connect trainer via invite code after profile completion`
