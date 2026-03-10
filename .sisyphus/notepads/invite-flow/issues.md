# Issues — invite-flow

## [2026-03-10] Session: ses_329928efcffeY7wf2dZAaCvRXU

### Known Bugs to Fix
- MemberProfileView line 224: `router.push('/home')` → must be `router.push('/member/home')`

### Constraints
- invite_codes RLS: authenticated only — cannot query from unauthenticated state
- connect_via_invite RPC requires auth.uid() + role='member'
- InviteManageView already generates ?code= deeplinks but InviteEnterView doesn't read them
