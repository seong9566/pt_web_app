# Decisions — manual-feature-gaps

## [2026-03-06] Session: ses_33f92e282ffeDZpWgKk9CRKamW

### User-Confirmed Decisions
1. **Scope**: Core gaps + quality improvements (no pagination, bookmarks, comments)
2. **Category strategy**: DB enum expansion — rename 스포츠퍼포먼스→스포츠, add 코어+유연성
3. **Edit UI**: Reuse ManualRegisterView with edit mode via route.params.id
4. **Tests**: Vitest unit tests included (Task 8)

### Architecture Decisions
- PostgreSQL enum cannot RENAME/DELETE values → must recreate enum type
- Storage delete failures must NOT block DB delete (try/catch independent)
- extractStoragePath helper needed: URL → Storage path for remove() calls
- ManualRegisterView handles both create + edit modes (no new file)
- Trainer-only buttons: v-if="auth.user?.id === manual.trainer_id"
