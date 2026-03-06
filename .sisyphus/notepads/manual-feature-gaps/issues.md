# Issues — manual-feature-gaps

## [2026-03-06] Session: ses_33f92e282ffeDZpWgKk9CRKamW

### Known Issues (Pre-implementation)
1. `manual_category` enum has 4 values but UI expects 6 — DB-UI mismatch
2. ManualRegisterView uses `form.categories.join(',')` → DB enum violation on save
3. `fetchManuals()` has no `manual_media` JOIN → thumbnails impossible
4. `deleteManual()` doesn't clean Storage → orphan files accumulate
5. No edit UI exists despite `updateManual()` composable being ready
6. Trainer detail route shares member read-only view (no edit/delete buttons)
