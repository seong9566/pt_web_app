# Learnings — chat-enhancements

## 2026-03-10 Session Start

### Codebase Conventions
- Vue 3 `<script setup>` only, no Options API
- `@/` alias for all imports
- CSS: BEM naming, CSS custom properties only (no hardcoded hex)
- Large views: external `.css` companion file via `<style src="./ViewName.css" scoped>`
- Composables: always return `loading`, `error` refs
- Error messages in Korean

### Chat Architecture
- `messages` table: sender_id, receiver_id, content, file_url, file_name, file_type, file_size, is_read, created_at
- `chat-files` bucket: currently PRIVATE (public: false) — BUG: getPublicUrl() used
- `fetchMessages()`: currently ascending+limit(50) = oldest 50 — BUG: should be newest 50
- Realtime: postgres_changes INSERT on messages where receiver_id = currentUser
- Both MemberChatView and TrainerChatView are nearly identical — changes must be applied to BOTH
- TrainerChatView already handles `?partnerId=` query param in onMounted (lines 286-306)

### Notification System
- `new_message` type already in enum but UNUSED
- `createNotification(userId, type, title, body, targetId, targetType)` in useNotifications.js
- Pattern: useWorkoutPlans.js:110-118 (try-catch, don't block main flow)

### Test Infrastructure
- Vitest, tests in src/composables/__tests__/
- Mock pattern: vi.hoisted + createBuilder in useChat.test.js
- TDD required: RED → GREEN → REFACTOR

### Key File Paths
- useChat.js: src/composables/useChat.js
- MemberChatView: src/views/member/MemberChatView.vue + MemberChatView.css
- TrainerChatView: src/views/trainer/TrainerChatView.vue + TrainerChatView.css
- useChat.test.js: src/composables/__tests__/useChat.test.js
- schema.sql: supabase/schema.sql
- TrainerMemberDetailView: src/views/trainer/TrainerMemberDetailView.vue
- MemberSettingsView: src/views/member/MemberSettingsView.vue

## 2026-03-10 Task 1 — Storage URL Access

- `chat-files` 버킷을 `public: true`로 전환하면 `getPublicUrl()` 경로가 실제 접근 가능한 URL이 된다.
- Storage SELECT 정책은 업로더 폴더 제한만 두면 수신자 렌더링이 막히므로, `messages` 테이블 참여자(`sender_id`/`receiver_id`) 기준 확장이 필요하다.
- 정책 매칭은 `strpos(m.file_url, '/chat-files/' || name) > 0` 방식으로 오브젝트 경로와 메시지 첨부 URL을 연결할 수 있다.
- `useChat.uploadChatFile()` 시그니처/구현 변경 없이도 버킷 공개 + 정책 변경만으로 접근 버그를 해결할 수 있다.

## 2026-03-10 Task 2 — Message Ordering + REPLICA IDENTITY

- `fetchMessages()`에서 `ascending: true + limit(50)`는 오래된 50개를 고정으로 가져오므로 대화 최신 맥락이 잘린다.
- 최신 50개를 안정적으로 가져오려면 `.order('created_at', { ascending: false }).limit(50)` 후 결과를 `.reverse()`해서 UI 시간순으로 맞춘다.
- 테스트는 DB 반환값을 의도적으로 내림차순(mock)으로 만들고, 반환 배열이 오름차순으로 뒤집히는지까지 같이 검증해야 회귀를 막을 수 있다.
- Realtime UPDATE old/new payload 보장을 위해 `public.messages`에 `REPLICA IDENTITY FULL`을 명시하고, 검증은 `pg_class + pg_namespace` 조인으로 `public` 스키마만 확인하는 쿼리가 안전하다.
