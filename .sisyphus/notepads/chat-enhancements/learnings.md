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

## Task 10: Chat Button Implementation (2026-03-10)

### Changes Made
1. **TrainerMemberDetailView.vue**:
   - Added "채팅하기" button in quick-actions section (between "수납 기록" and "PT 횟수 관리")
   - Button uses chat bubble SVG icon with `stroke="currentColor"`
   - `goChat()` function navigates to `trainer-chat` route with `?partnerId=` query param
   - `useRouter` already imported, no new imports needed

2. **MemberSettingsView.vue**:
   - Added "채팅하기" button in "연결 관리" section (above disconnect button)
   - Button only shows when `trainerName` is set (trainer connected)
   - Added `settings__divider` between chat and disconnect buttons
   - `goChat()` function navigates to `member-chat` route (no params needed)
   - `useRouter` already imported, no new imports needed

### Key Implementation Details
- Both buttons reuse existing CSS classes (no new styles added)
- Chat bubble SVG icon: `<path d="M21 15C21 15.5304...">` with `stroke="currentColor"`
- TrainerChatView already handles `?partnerId=` query param in onMounted (lines 286-306)
- MemberChatView doesn't need query params (already knows trainer context)
- Build passes with no errors (✓ npm run build)
- LSP diagnostics clean on both files

### Evidence
- `.sisyphus/evidence/task-10-trainer-chat-btn.png` — Trainer member detail with chat button
- `.sisyphus/evidence/task-10-member-chat-btn.png` — Member settings with chat button (connected)
- `.sisyphus/evidence/task-10-no-btn-disconnected.png` — Member settings without chat button (disconnected)

### Testing Notes
- Screenshots taken at 480px viewport (mobile size)
- Both views render correctly without errors
- Chat buttons are positioned correctly in their respective sections

### Task 6: AppImageViewer Component
- Created `AppImageViewer.vue` using `<Teleport to="body">` and `<Transition name="image-viewer">`.
- Implemented `v-model` pattern for open/close state.
- Added ESC key listener to close the viewer.
- Used `object-fit: contain` and `max-width: 100vw`, `max-height: 100vh` for fullscreen image display.
- Ensured overlay click closes the viewer, but image click stops propagation.

## Task 3: 읽음 표시 "1" UI (2026-03-10)

### subscribeToReadReceipts 패턴
- 채널명: `read-receipts-${partnerId}-${me}`
- `postgres_changes` UPDATE 이벤트, `filter: sender_id=eq.${me}`
- callback: `payload.new.is_read === true`일 때 `messages.value[idx] = {..., is_read: true}`
- `readReceiptChannel` ref를 `unsubscribe()`에서 함께 해제 (channel과 동일 패턴)

### 테스트 패턴 (subscribeToReadReceipts)
- `sendMessage` 먼저 호출 → messages 배열 populate
- `channel.on()` 두 번째 인자의 `.on(type, filterObj, cb)` 시그니처 — cb를 캡처
- `capturedCallback({ new: { id, is_read: true } })` 직접 호출로 검증

### UI 위치
- `.member-chat__msg-time` / `.trainer-chat__msg-time` 바로 앞에 span 추가
- `v-if="msg.sender_id === auth.user?.id && !msg.is_read"` 조건 (내가 보낸 미읽은 것만)

### CSS
- `color: var(--color-blue-primary)`, `font-size: var(--fs-caption)`, `font-weight: 600`
- flex-column 메시지 컨테이너에서 indicator와 time이 별도 줄로 표시됨 (의도적)

## Task 4: sendMessage 후 인앱 알림 생성 (2026-03-10)

### 패턴
- `useChat.js` 내부에서 `useNotifications()` composable을 함수 스코프 안에서 호출
- `sendMessage` 성공 후 notification try-catch 블록으로 격리 (실패가 메시지 반환 차단 안 함)
- 알림 파라미터: `(receiverId, 'new_message', '새 메시지', content || '파일을 보냈습니다', data.id, 'message')`

### 테스트 패턴
- `vi.hoisted`에 `mockCreateNotification: vi.fn().mockResolvedValue(true)` 추가
- `vi.mock('@/composables/useNotifications', ...)` 으로 모듈 전체 mock
- `mockRejectedValueOnce`로 실패 시나리오 테스트
- TDD: RED(구현 전 테스트 작성) → GREEN(구현) 순서 준수

## Task 5: 메시지 페이지네이션 (2026-03-10)

### Pagination Composable Pattern
- `PAGE_SIZE = 30` 상수를 composable 상단에 두고 `fetchMessages`/`fetchOlderMessages`가 동일 상수를 공유하면 페이지 경계가 일관된다.
- 초기 조회(`fetchMessages`)는 `descending + limit(PAGE_SIZE) + reverse()`로 UI 시간순을 유지하면서 최신 구간을 확보한다.
- 과거 조회(`fetchOlderMessages`)는 `messages.value[0].created_at` 커서에 `.lt('created_at', cursor)`를 걸고, 응답을 `reverse()` 후 앞에 prepend하는 방식이 안정적이다.
- `hasMore`는 `응답 길이 === PAGE_SIZE` 여부로 판단하면 서버 total count 조회 없이도 다음 페이지 가능 여부를 관리할 수 있다.

### Chat View Scroll Pattern
- `scrollTop < 50` 임계값 기반으로 상단 스크롤 감지하고, 로드 전후 `scrollHeight` 차이만큼 `scrollTop`을 보정하면 prepend 시 화면 점프를 막을 수 있다.
- 기존 `watch(messages)` 자동 하단 스크롤은 prepend와 충돌하므로 `skipAutoScroll` 플래그로 과거 로드 구간만 예외 처리해야 한다.
- `selectedPartnerId` watcher에서 메시지 리스트 scroll listener를 attach/detach하면 채팅방 진입/이탈 시 이벤트 누수를 방지할 수 있다.

### Testing Pattern
- `fetchOlderMessages` 테스트에서 초기 메시지는 반드시 PAGE_SIZE(30)개로 세팅해야 `hasMore=true` 상태에서 실제 older query가 실행된다.
- 테스트 안정성을 위해 `beforeEach`에서 `supabase.from`, `channel`, `createNotification` mock을 `mockReset()` 후 기본 구현을 재설정해야 이전 테스트의 once-queue 오염을 막을 수 있다.

## Task 7: 이미지 뷰어 연동 (2026-03-10)

### 패턴
- AppImageViewer 연동 시 ref 2개(showImageViewer, viewerImageSrc) + openImageViewer 함수 패턴
- `<AppImageViewer v-model="showImageViewer" :src="viewerImageSrc" />` 는 AppToast 바로 다음에 배치 (template 최하단)
- TrainerChatView에서 AppImageViewer는 `</template>` 닫기 태그 **앞**에 배치해야 함 (v-else template 구조 때문)
- 이미지 전용: `msg.file_type?.startsWith('image/')` 조건으로 이미 필터된 img 태그에만 @click 추가
- cursor: pointer는 기존 CSS 블록에 속성 추가 방식 (별도 선언 불필요)

## 2026-03-10 Task 8 — 채팅방 인라인 검색

- `useChat`에 검색 전용 상태(`searchResults`, `searchLoading`)를 분리하면 기존 `messages`/페이지네이션 흐름과 충돌 없이 채팅방 내 검색 UI를 붙일 수 있다.
- `searchMessages(partnerId, query)`는 `query.trim().length < 2`에서 즉시 빈 배열 반환하면 불필요한 API 호출을 차단할 수 있다.
- 채팅방 검색 UI는 헤더 우측 검색 버튼 + 입력 바 + 결과 리스트를 같은 패널에 두고, `isSearchMode`로 기존 메시지 리스트와 상호 배타 렌더링하는 패턴이 단순하다.
- 디바운스는 `setTimeout` + `clearTimeout` 300ms 조합으로 충분하며, 채팅방 종료/컴포넌트 언마운트 시 타이머 정리가 필요하다.
- Member/Trainer 채팅 뷰는 구조가 거의 동일하므로 검색 관련 클래스/로직을 같은 네이밍으로 맞추면 유지보수 부담이 줄어든다.
