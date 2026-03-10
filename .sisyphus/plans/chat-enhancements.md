# 채팅 기능 개선 — 5가지 빠진 기능 추가

## TL;DR

> **Quick Summary**: 이미 완전 구현된 채팅 시스템에 읽음 표시 UI, 인앱 알림, 메시지 페이지네이션, 이미지 미리보기, 메시지 검색 5가지 기능을 추가. 또한 TrainerMemberDetailView와 MemberSettingsView에 채팅하기 바로가기 버튼 추가. 사전 필수 작업으로 Storage 접근 버그와 메시지 정렬 버그를 먼저 수정.
> 
> **Deliverables**:
> - 읽음 표시 UI (메시지 옆 "1" 숫자 표시)
> - 새 메시지 인앱 알림 (notifications 테이블 연동)
> - 메시지 페이지네이션 (스크롤 시 과거 메시지 로드)
> - 이미지 미리보기/확대 (AppImageViewer 공유 컴포넌트)
> - 메시지 검색 (서버 사이드 ilike 검색)
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 (Storage Fix) → Task 2 (Ordering Fix) → Task 3-4 (Read Receipt + Notification) → Task 5-7 (Pagination + Image + Search) → Final Verification

---

## Context

### Original Request
사용자가 "채팅 기능 개발 계획 작성"을 요청. 탐색 결과 채팅은 이미 완전 구현되어 있었으며, 방향을 "빠진 기능 추가"로 재설정함.

### Interview Summary
**Key Discussions**:
- 채팅은 이미 완전 구현됨 (useChat.js 313줄, MemberChatView, TrainerChatView, DB 스키마, 실시간 구독, 파일 업로드 모두 완료)
- 사용자가 선택한 5가지 추가 기능: 읽음 표시, 알림, 페이지네이션, 이미지 미리보기, 검색
- 읽음 표시 스타일: 간단한 숫자 "1" (카카오톡 ✓✓ 아님)
- 알림: 인앱만 (푸시 제외), 기존 createNotification 패턴 따르기
- 테스트 전략: TDD (Vitest 인프라 존재)

**Research Findings**:
- `messages` 테이블: 완전한 스키마 + RLS 3개 + 인덱스 2개
- `notifications` 테이블: `new_message` 타입 enum 이미 정의되어 있으나 미사용
- `createNotification()` 유틸: useNotifications.js에 존재, 3개 사용 패턴 확인
- 양쪽 뷰 파일이 거의 동일한 구조 (병렬 변경 필요)

### Metis Review
**Identified Gaps** (addressed):
- 🔴 **Storage 버그**: `chat-files` 버킷이 private인데 `getPublicUrl()` 사용 → 수신자가 이미지 못 봄 → Pre-requisite Fix로 추가
- 🟡 **정렬 버그**: `fetchMessages()`가 ascending + limit(50) = 가장 오래된 50개 반환 → Pre-requisite Fix로 추가
- 🟡 **Realtime UPDATE**: 읽음 상태 변경 감지에 REPLICA IDENTITY FULL 필요할 수 있음 → Task에 포함
- 🟡 **Storage RLS**: 수신자가 발신자 폴더의 파일 접근 불가 → Storage Fix에 포함

---

## Work Objectives

### Core Objective
기존 완성된 채팅 시스템 위에 5가지 기능(읽음 표시, 알림, 페이지네이션, 이미지 미리보기, 검색)을 추가하고, 사전에 발견된 2개의 버그(Storage 접근, 메시지 정렬)를 수정한다.

### Concrete Deliverables
- `useChat.js` 수정: fetchOlderMessages(), searchMessages(), sendMessage()에 알림 추가, fetchMessages() 정렬 수정
- `MemberChatView.vue` 수정: 읽음 표시, 페이지네이션 UI, 검색 UI, 이미지 클릭 핸들러
- `TrainerChatView.vue` 수정: 동일 변경 사항
- `MemberChatView.css` 수정: 새 UI 요소 스타일
- `TrainerChatView.css` 수정: 동일 스타일
- `src/components/AppImageViewer.vue` 신규: 전체화면 이미지 뷰어
- `supabase/schema.sql` 수정: Storage RLS 정책 추가
- DB 마이그레이션: Storage 정책 + REPLICA IDENTITY
- `useChat.test.js` 수정: 새 함수 TDD 테스트 추가

### Definition of Done
- [ ] `npx vitest run` → 모든 테스트 PASS
- [ ] `npm run build` → 빌드 에러 0개
- [ ] Playwright: 메시지 전송 후 "1" 표시 확인
- [ ] Playwright: 채팅 이미지 클릭 시 전체화면 뷰어 표시
- [ ] Playwright: 검색 입력 시 결과 표시

### Must Have
- 읽음 표시 "1"이 내가 보낸 메시지에만 표시 (상대방이 안 읽었을 때)
- 알림이 기존 createNotification 패턴 따름
- 페이지네이션이 스크롤 업 시 과거 메시지 로드
- 이미지 뷰어가 Teleport + Transition 패턴 사용
- 검색이 서버 사이드 ilike 쿼리 사용
- TDD: 테스트 먼저 작성 후 구현

### Must NOT Have (Guardrails)
- MemberChatView와 TrainerChatView를 단일 공유 컴포넌트로 리팩토링하지 않음
- 메시지 삭제, 편집, 반응(이모지) 추가하지 않음
- 타이핑 인디케이터 추가하지 않음
- 푸시 알림(FCM/APNs) 구현하지 않음
- 그룹 채팅 지원하지 않음
- 핀치-투-줌 또는 제스처 핸들링 추가하지 않음
- 새 Pinia 스토어 생성하지 않음
- 새 npm 의존성 추가하지 않음
- 이모지 피커 추가하지 않음
- 음성 메시지 추가하지 않음
- CSS 애니메이션은 이미지 뷰어 Transition 외 추가하지 않음

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: TDD (RED → GREEN → REFACTOR)
- **Framework**: Vitest (bun test 대신 npx vitest run)
- **If TDD**: 각 새 composable 함수에 대해 테스트 먼저 작성

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Supabase API 호출 검증
- **Composable**: Use Bash (npx vitest run) — 유닛 테스트 실행

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — 버그 수정 + 테스트 준비, 2 tasks):
├── Task 1: Storage 접근 버그 수정 (chat-files RLS + 버킷 공개 전환) [deep]
└── Task 2: fetchMessages 정렬 버그 수정 + REPLICA IDENTITY 추가 [deep]

Wave 2 (Core Features — 독립적 5 tasks 병렬):
├── Task 3: 읽음 표시 UI (depends: 2) [visual-engineering]
├── Task 4: 새 메시지 인앱 알림 (depends: 2) [quick]
├── Task 5: 메시지 페이지네이션 (depends: 2) [deep]
├── Task 6: AppImageViewer 컴포넌트 (depends: 1) [visual-engineering]
└── Task 10: 채팅하기 버튼 추가 (depends: 1,2) [quick]

Wave 3 (Remaining Features + Integration, 3 tasks):
├── Task 7: 이미지 미리보기 뷰 연동 (depends: 6) [visual-engineering]
├── Task 8: 메시지 검색 기능 (depends: 2) [deep]
└── Task 9: 통합 테스트 + 빌드 검증 (depends: 3,4,5,7,8,10) [deep]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 6 → Task 7 → Task 9 → F1-F4
                Task 2 → Task 5 → Task 9
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 5 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 (Storage Fix) | — | 6, 7, 10 | 1 |
| 2 (Ordering Fix) | — | 3, 4, 5, 8, 10 | 1 |
| 3 (Read Receipt) | 2 | 9 | 2 |
| 4 (Notification) | 2 | 9 | 2 |
| 5 (Pagination) | 2 | 9 | 2 |
| 6 (ImageViewer) | 1 | 7 | 2 |
| 10 (Chat Buttons) | 1, 2 | 9 | 2 |
| 7 (Image Integration) | 6 | 9 | 3 |
| 8 (Search) | 2 | 9 | 3 |
| 9 (Integration Test) | 3,4,5,7,8,10 | F1-F4 | 3 |
| F1-F4 | 9 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **2** — T1 → `deep`, T2 → `deep`
- **Wave 2**: **5** — T3 → `visual-engineering`, T4 → `quick`, T5 → `deep`, T6 → `visual-engineering`, T10 → `quick`
- **Wave 3**: **3** — T7 → `visual-engineering`, T8 → `deep`, T9 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + playwright, F4 → `deep`

---

## TODOs

- [x] 1. Storage 접근 버그 수정 — chat-files 버킷 + RLS 정책

  **What to do**:
  - **RED (테스트 먼저)**: `useChat.test.js`에 파일 업로드 후 반환된 URL이 `createSignedUrl` 또는 public URL 형태인지 검증하는 테스트 작성
  - `chat-files` 버킷을 public으로 변경하는 DB 마이그레이션 작성 (가장 단순한 해결책 — `avatars` 버킷과 동일 패턴)
  - Storage RLS 정책 추가: 메시지 참여자(sender/receiver)가 관련 파일을 읽을 수 있도록 SELECT 정책 추가
  - `supabase/schema.sql`에 변경 사항 반영 (소스 오브 트루스)
  - Supabase MCP (`apply_migration`)로 실제 DB에 마이그레이션 적용
  - **GREEN**: `uploadChatFile()` 함수가 올바른 URL을 반환하는지 확인
  - **REFACTOR**: 불필요한 코드 정리

  **Must NOT do**:
  - `createSignedUrl` 방식으로 전환하지 않음 (복잡도 증가, 만료 시간 관리 필요)
  - 기존 `uploadChatFile()` 함수 시그니처 변경하지 않음
  - 다른 버킷(avatars, manual-media) 건드리지 않음

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: DB 마이그레이션 + RLS 정책 + Storage 설정이 연관된 복합 작업
  - **Skills**: [`playwright`]
    - `playwright`: 마이그레이션 적용 후 실제 이미지 로딩 검증에 사용
  - **Skills Evaluated but Omitted**:
    - `git-master`: 단순 커밋이므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 2와 동시 실행 가능)
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 6 (AppImageViewer), Task 7 (이미지 연동)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `supabase/schema.sql:975-992` — 기존 Storage 버킷 설정 (`avatars`는 `public: true`, `chat-files`는 `public: false`). avatars 패턴을 따라 chat-files도 public으로 변경
  - `supabase/schema.sql:987-992` — 기존 chat-files Storage RLS 정책 (`foldername(name)[1] = auth.uid()`). 이 정책은 발신자만 자기 파일 접근 가능 → 수신자도 접근하도록 확장 필요

  **API/Type References**:
  - `src/composables/useChat.js:258-286` — `uploadChatFile()` 함수. `getPublicUrl()` 사용 중. 버킷을 public으로 변경하면 이 코드 수정 불필요

  **External References**:
  - Supabase Storage docs: 버킷 public/private 설정 및 RLS 정책

  **WHY Each Reference Matters**:
  - `schema.sql:975-992`: avatars 버킷이 public=true인 패턴을 그대로 chat-files에 적용하면 가장 간단한 해결책
  - `schema.sql:987-992`: 기존 SELECT 정책이 `foldername(name)[1] = auth.uid()`로 자기 폴더만 접근 가능. 메시지 테이블 JOIN으로 참여자 접근 허용 정책 추가 필요
  - `useChat.js:258-286`: 버킷을 public으로 바꾸면 getPublicUrl()이 정상 작동하므로 코드 변경 최소화

  **Acceptance Criteria**:

  **If TDD:**
  - [ ] Test file updated: src/composables/__tests__/useChat.test.js
  - [ ] npx vitest run src/composables/__tests__/useChat.test.js → PASS

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 이미지 파일 URL이 접근 가능한지 확인
    Tool: Bash (curl)
    Preconditions: chat-files 버킷 마이그레이션 적용 완료
    Steps:
      1. Supabase MCP execute_sql로 messages 테이블에서 file_url이 있는 레코드 1개 조회
      2. 반환된 file_url에 대해 curl -I (HEAD 요청) 실행
      3. HTTP 상태 코드 확인
    Expected Result: HTTP 200 (not 400/403)
    Failure Indicators: HTTP 400, 403, or 404 응답
    Evidence: .sisyphus/evidence/task-1-storage-url-access.txt

  Scenario: 마이그레이션 적용 후 schema.sql 일관성 확인
    Tool: Bash (grep)
    Preconditions: schema.sql 수정 완료
    Steps:
      1. schema.sql에서 chat-files 버킷 설정 확인
      2. public 값이 true인지 확인
      3. Storage RLS 정책이 참여자 접근을 허용하는지 확인
    Expected Result: chat-files 버킷 public=true, 새 RLS 정책 존재
    Failure Indicators: public=false 유지, 또는 새 정책 누락
    Evidence: .sisyphus/evidence/task-1-schema-consistency.txt
  ```

  **Commit**: YES
  - Message: `fix(chat): make chat-files bucket public and add participant read policy`
  - Files: `supabase/schema.sql`, `src/composables/__tests__/useChat.test.js`
  - Pre-commit: `npx vitest run src/composables/__tests__/useChat.test.js`

- [x] 2. fetchMessages 정렬 버그 수정 + REPLICA IDENTITY

  **What to do**:
  - **RED (테스트 먼저)**: `useChat.test.js`에 `fetchMessages`가 최신 메시지를 반환하는지 검증하는 테스트 작성 (현재 ascending+limit=oldest가 반환됨을 확인하는 failing test)
  - `fetchMessages()` 수정: `.order('created_at', { ascending: false }).limit(50)` 후 결과를 `.reverse()` — 최신 50개를 시간순으로 표시
  - DB 마이그레이션: `ALTER TABLE public.messages REPLICA IDENTITY FULL;` — Realtime UPDATE 이벤트에서 이전/이후 값 모두 전달되도록
  - `supabase/schema.sql`에 REPLICA IDENTITY 설정 반영
  - Supabase MCP (`apply_migration`)로 실제 DB에 적용
  - **GREEN**: 테스트 통과 확인
  - **REFACTOR**: fetchMessages의 주석을 실제 동작과 일치하도록 수정

  **Must NOT do**:
  - `fetchConversations()` 함수 수정하지 않음 (이 함수는 정상 동작)
  - `subscribeToMessages()` 수정하지 않음 (INSERT 이벤트 구독은 정상)
  - PAGE_SIZE를 변경하지 않음 (50 유지, 페이지네이션은 Task 5에서 처리)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: DB 마이그레이션 + composable 로직 수정 + TDD
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: DB/composable 수정이므로 브라우저 검증 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 1과 동시 실행 가능)
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3, 4, 5, 8
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/composables/useChat.js:84-109` — 현재 `fetchMessages()` 구현. 라인 99: `.order('created_at', { ascending: true })` ← 이것이 버그. ascending=true + limit(50) = 가장 오래된 50개 반환

  **Test References**:
  - `src/composables/__tests__/useChat.test.js:31-60` — 기존 fetchConversations 테스트. createBuilder 패턴, mockSupabase.from() 구조 참고

  **WHY Each Reference Matters**:
  - `useChat.js:84-109`: 정확히 어느 라인의 ascending 값을 false로 바꿔야 하는지, 그리고 결과를 reverse()해야 하는 이유 (UI는 시간순 오름차순 표시)
  - `useChat.test.js:31-60`: 테스트 모킹 패턴을 그대로 따라서 fetchMessages 테스트를 작성해야 함

  **Acceptance Criteria**:

  **If TDD:**
  - [ ] Test file updated: src/composables/__tests__/useChat.test.js
  - [ ] npx vitest run src/composables/__tests__/useChat.test.js → PASS

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: fetchMessages가 최신 메시지를 반환하는지 확인
    Tool: Bash (npx vitest run)
    Preconditions: useChat.test.js에 새 테스트 추가됨
    Steps:
      1. npx vitest run src/composables/__tests__/useChat.test.js 실행
      2. fetchMessages 관련 테스트 결과 확인
    Expected Result: 모든 테스트 PASS, fetchMessages가 descending order로 쿼리 후 reverse
    Failure Indicators: 테스트 FAIL, 또는 ascending: true 유지
    Evidence: .sisyphus/evidence/task-2-test-results.txt

  Scenario: REPLICA IDENTITY 마이그레이션 적용 확인
    Tool: Bash (Supabase MCP execute_sql)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. Supabase execute_sql: `SELECT relreplident FROM pg_class WHERE relname = 'messages';`
      2. 결과 확인: 'f' = FULL
    Expected Result: relreplident = 'f' (FULL)
    Failure Indicators: relreplident = 'd' (DEFAULT) 또는 'n' (NOTHING)
    Evidence: .sisyphus/evidence/task-2-replica-identity.txt
  ```

  **Commit**: YES
  - Message: `fix(chat): correct message ordering to newest-first and add REPLICA IDENTITY`
  - Files: `src/composables/useChat.js`, `supabase/schema.sql`, `src/composables/__tests__/useChat.test.js`
  - Pre-commit: `npx vitest run src/composables/__tests__/useChat.test.js`

- [x] 3. 읽음 표시 UI — 미읽은 메시지에 "1" 숫자 표시

  **What to do**:
  - **RED (테스트 먼저)**: 읽음 상태 변경을 감지하기 위한 Realtime UPDATE 구독 테스트 작성 (useChat.test.js)
  - `useChat.js`에 `subscribeToReadReceipts(partnerId)` 함수 추가: Realtime으로 messages 테이블의 UPDATE 이벤트를 구독하여 `is_read` 변경 감지. `sender_id = me` 조건으로 내가 보낸 메시지의 읽음 상태만 추적
  - `MemberChatView.vue` 수정: 내가 보낸 메시지(`msg.sender_id === auth.user?.id`) 중 `msg.is_read === false`인 메시지의 버블 옆에 "1" 숫자 표시. 위치: 메시지 시간 옆 또는 바로 위
  - `TrainerChatView.vue` 수정: 동일 변경
  - `MemberChatView.css` 수정: `.member-chat__read-indicator` 스타일 추가 (작은 숫자, `var(--color-blue-primary)`, `var(--fs-caption)`)
  - `TrainerChatView.css` 수정: `.trainer-chat__read-indicator` 동일 스타일
  - `openChat()` 함수에서 `subscribeToReadReceipts()` 호출 추가
  - `closeChat()` 함수에서 구독 해제 추가
  - **GREEN**: Realtime UPDATE 수신 시 로컬 messages 배열에서 해당 메시지의 `is_read`를 `true`로 업데이트 → "1" 사라짐
  - **REFACTOR**: 구독 관리 로직 정리

  **Must NOT do**:
  - 받은 메시지에 읽음 표시 추가하지 않음 (내가 보낸 것만)
  - `markAsRead()` 함수 시그니처 변경하지 않음
  - 새 DB 컬럼 추가하지 않음 (기존 is_read 사용)
  - "✓✓" 체크마크 스타일 사용하지 않음 (간단한 숫자 "1"만)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 변경(숫자 표시) + CSS 스타일링이 핵심. Realtime 구독은 기존 패턴 따르기
  - **Skills**: [`playwright`]
    - `playwright`: 읽음 표시 UI 렌더링 확인
  - **Skills Evaluated but Omitted**:
    - `git-master`: 단순 커밋

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Task 9
  - **Blocked By**: Task 2 (Ordering Fix — messages 배열 구조가 올바라야 함)

  **References**:

  **Pattern References**:
  - `src/composables/useChat.js:217-242` — 기존 `subscribeToMessages()` Realtime 구독 패턴. 채널 이름, postgres_changes 설정, 필터 방식을 그대로 따라서 UPDATE 이벤트 구독 추가
  - `src/views/member/MemberChatView.vue:95-118` — 기존 메시지 버블 렌더링. `member-chat__message--mine` 클래스에 읽음 표시 추가
  - `src/views/member/MemberChatView.vue:117` — `member-chat__msg-time` 옆에 읽음 표시 배치

  **API/Type References**:
  - `messages.is_read` (boolean) — 이미 존재하는 필드. false = 미읽음, true = 읽음

  **Test References**:
  - `src/composables/__tests__/useChat.test.js` — 기존 Supabase 모킹 패턴 따르기

  **External References**:
  - Supabase Realtime docs: postgres_changes UPDATE 이벤트 구독 방법

  **WHY Each Reference Matters**:
  - `useChat.js:217-242`: Realtime 구독의 채널 생성, 이벤트 필터링, 페이로드 처리 패턴을 복제하여 UPDATE 이벤트용 구독 추가
  - `MemberChatView.vue:95-118`: 정확히 어디에 "1" 표시를 삽입할지 — `member-chat__msg-time` 스팬 바로 앞 또는 같은 줄에 조건부 렌더링
  - `messages.is_read`: 별도 API 호출 없이 이미 로드된 메시지 데이터에서 바로 사용 가능

  **Acceptance Criteria**:

  **If TDD:**
  - [ ] Test: subscribeToReadReceipts 구독 설정 테스트 → PASS
  - [ ] npx vitest run src/composables/__tests__/useChat.test.js → PASS

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 내가 보낸 미읽은 메시지에 "1" 표시
    Tool: Playwright
    Preconditions: 로그인 상태, 대화 상대와 메시지 존재
    Steps:
      1. /member/chat (또는 /trainer/chat) 페이지 이동
      2. 대화 목록에서 상대방 클릭하여 채팅방 진입
      3. 메시지 입력 "테스트 읽음 표시" 후 전송
      4. 내가 보낸 메시지 버블(`.member-chat__message--mine`) 영역 확인
      5. `.member-chat__read-indicator` 요소에 텍스트 "1" 존재 확인
    Expected Result: 보낸 메시지 옆에 "1" 숫자 표시됨
    Failure Indicators: "1" 미표시, 또는 받은 메시지에 표시됨
    Evidence: .sisyphus/evidence/task-3-read-indicator-shown.png

  Scenario: 받은 메시지에는 읽음 표시 없음
    Tool: Playwright
    Preconditions: 상대방이 보낸 메시지 존재
    Steps:
      1. 채팅방에서 상대방이 보낸 메시지(`.member-chat__message--theirs`) 확인
      2. `.member-chat__read-indicator` 요소가 없는지 확인
    Expected Result: 받은 메시지에 읽음 표시 없음
    Failure Indicators: 받은 메시지에 "1" 표시됨
    Evidence: .sisyphus/evidence/task-3-no-indicator-received.png
  ```

  **Commit**: YES
  - Message: `feat(chat): add read receipt "1" indicator on sent messages`
  - Files: `src/composables/useChat.js`, `src/views/member/MemberChatView.vue`, `src/views/trainer/TrainerChatView.vue`, `src/views/member/MemberChatView.css`, `src/views/trainer/TrainerChatView.css`, `src/composables/__tests__/useChat.test.js`
  - Pre-commit: `npx vitest run`

- [x] 4. 새 메시지 인앱 알림 — notifications 테이블 연동

  **What to do**:
  - **RED (테스트 먼저)**: `useChat.test.js`에 `sendMessage()` 호출 후 `createNotification()`이 호출되는지 검증하는 테스트 작성
  - `useChat.js`의 `sendMessage()` 함수에서 메시지 INSERT 성공 후 `createNotification()` 호출 추가
  - `useNotifications`를 useChat 내부에서 import하여 사용
  - 알림 생성 실패가 메시지 전송을 막지 않도록 try-catch로 감싸기
  - 알림 파라미터: `type: 'new_message'`, `title: '새 메시지'`, `body: content || '파일을 보냈습니다'`, `targetId: message.id`, `targetType: 'message'`
  - **GREEN**: 테스트 통과
  - **REFACTOR**: 에러 핸들링 정리

  **Must NOT do**:
  - 뷰 레이어에서 알림 생성하지 않음 (composable에서만)
  - 알림 실패 시 메시지 전송을 롤백하지 않음
  - 알림 디바운싱 구현하지 않음 (매 메시지마다 생성)
  - notifications 테이블 스키마 변경하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 패턴(useWorkoutPlans.js)을 그대로 따르는 단순 작업
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: composable 로직만 변경, UI 변경 없음

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5, 6)
  - **Blocks**: Task 9
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/composables/useWorkoutPlans.js:110-118` — 알림 생성 패턴. `createNotification(memberId, 'workout_assigned', title, body, data.id, 'workout')` 호출 후 try-catch 감싸기
  - `src/composables/useTrainerSearch.js:110-121` — 에러 격리 패턴. 알림 실패가 메인 로직을 막지 않도록 처리
  - `src/composables/useChat.js:125-177` — 현재 `sendMessage()` 구현. 라인 170 부근 INSERT 성공 후에 알림 코드 추가

  **API/Type References**:
  - `notification_type` enum: `'new_message'` — schema.sql 라인 916에 이미 정의됨
  - `useNotifications.js`의 `createNotification(userId, type, title, body, targetId, targetType)` 시그니처

  **WHY Each Reference Matters**:
  - `useWorkoutPlans.js:110-118`: 가장 최근에 추가된 알림 생성 패턴. 구조를 100% 복제
  - `useChat.js:125-177`: sendMessage의 성공 분기 정확한 위치를 알아야 알림 코드 삽입 위치 결정

  **Acceptance Criteria**:

  **If TDD:**
  - [ ] Test: sendMessage 성공 후 createNotification 호출 확인 → PASS
  - [ ] Test: sendMessage에서 알림 실패해도 메시지는 성공 → PASS
  - [ ] npx vitest run src/composables/__tests__/useChat.test.js → PASS

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 메시지 전송 후 수신자 알림 생성 확인
    Tool: Bash (Supabase MCP execute_sql)
    Preconditions: 테스트 사용자 2명 존재, 활성 연결 상태
    Steps:
      1. execute_sql: `SELECT COUNT(*) FROM notifications WHERE type = 'new_message' AND user_id = '{receiver_id}';` (전)
      2. 메시지 전송 수행 (Playwright 또는 직접 INSERT)
      3. execute_sql: 동일 쿼리 (후)
      4. 카운트 비교
    Expected Result: 카운트가 1 증가
    Failure Indicators: 카운트 변화 없음
    Evidence: .sisyphus/evidence/task-4-notification-created.txt

  Scenario: 파일 전송 시 알림 body가 '파일을 보냈습니다'인지 확인
    Tool: Bash (Supabase MCP execute_sql)
    Preconditions: 파일 메시지 전송 완료
    Steps:
      1. execute_sql: `SELECT body FROM notifications WHERE type = 'new_message' ORDER BY created_at DESC LIMIT 1;`
      2. body 값 확인
    Expected Result: body = '파일을 보냈습니다' (content가 null/empty인 경우)
    Failure Indicators: body가 null이거나 빈 문자열
    Evidence: .sisyphus/evidence/task-4-file-notification-body.txt
  ```

  **Commit**: YES (Task 3과 별도 커밋)
  - Message: `feat(chat): add in-app notification on new message send`
  - Files: `src/composables/useChat.js`, `src/composables/__tests__/useChat.test.js`
  - Pre-commit: `npx vitest run src/composables/__tests__/useChat.test.js`

- [x] 5. 메시지 페이지네이션 — 스크롤 업 시 과거 메시지 로드

  **What to do**:
  - **RED (테스트 먼저)**: `useChat.test.js`에 `fetchOlderMessages()` 테스트 작성 — cursor 기반 쿼리, 결과 prepend, hasMore 플래그
  - `useChat.js`에 `fetchOlderMessages(partnerId)` 함수 추가:
    - `messages.value[0].created_at`를 cursor로 사용
    - `.lt('created_at', cursor)` 필터로 이전 메시지만 조회
    - `.order('created_at', { ascending: false }).limit(PAGE_SIZE)` 후 `.reverse()`
    - 결과를 `messages.value` 배열 앞에 prepend (`messages.value = [...olderMsgs, ...messages.value]`)
    - `hasMore` ref 추가: 반환된 개수 < PAGE_SIZE면 false
  - `PAGE_SIZE` 상수 추가: 30 (composable 상단에 정의)
  - `fetchMessages()` 수정: PAGE_SIZE 상수 사용
  - `MemberChatView.vue` 수정:
    - `messageListRef`에 scroll 이벤트 리스너 추가
    - `scrollTop < 50` 일 때 `fetchOlderMessages()` 호출
    - 스크롤 위치 보존: prepend 전 scrollHeight 저장 → prepend 후 scrollTop 조정
    - 로딩 중 상단에 스피너 표시 (`.member-chat__load-more`)
    - `hasMore === false`이면 "모든 메시지를 불러왔습니다" 표시
  - `TrainerChatView.vue` 수정: 동일 변경
  - CSS 수정: 로딩 스피너 + "모든 메시지" 텍스트 스타일
  - **GREEN**: 테스트 통과 + UI 동작 확인
  - **REFACTOR**: 스크롤 핸들러에 throttle 적용 (성능 최적화)

  **Must NOT do**:
  - 기존 `subscribeToMessages()` 구독 변경하지 않음
  - 이미 로드된 메시지 재조회하지 않음
  - 무한 스크롤 대신 "더 불러오기" 버튼 사용하지 않음 (스크롤 감지 방식)
  - IntersectionObserver 사용하지 않음 (scrollTop 비교로 충분)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 커서 기반 페이지네이션 + 스크롤 위치 보존 + TDD — 로직 복잡도 높음
  - **Skills**: [`playwright`]
    - `playwright`: 스크롤 동작 + 과거 메시지 로드 검증
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 단순 스피너 추가, 디자인 복잡도 낮음

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 6)
  - **Blocks**: Task 9
  - **Blocked By**: Task 2 (정렬 수정 후 페이지네이션 구현)

  **References**:

  **Pattern References**:
  - `src/composables/useChat.js:84-109` — 기존 `fetchMessages()` 구현. 쿼리 구조를 복제하되 `.lt('created_at', cursor)` 필터 추가
  - `src/views/member/MemberChatView.vue:88-119` — `messageListRef` 사용하는 메시지 목록 영역. 여기에 scroll 이벤트 리스너 추가
  - `src/views/member/MemberChatView.vue:210-215` — `scrollToBottom()` 함수. 스크롤 위치 조작 패턴 참고

  **Test References**:
  - `src/composables/__tests__/useChat.test.js:31-60` — createBuilder mock 패턴. fetchOlderMessages도 동일 패턴으로 테스트

  **WHY Each Reference Matters**:
  - `useChat.js:84-109`: fetchMessages의 쿼리 구조를 그대로 가져와서 cursor 필터만 추가
  - `MemberChatView.vue:88-119`: messageListRef가 정확히 어떤 DOM 요소인지, scroll 이벤트를 어디에 붙일지
  - `scrollToBottom()`: nextTick() 사용하여 DOM 업데이트 후 스크롤 조작하는 패턴을 보존스크롤에도 적용

  **Acceptance Criteria**:

  **If TDD:**
  - [ ] Test: fetchOlderMessages 커서 기반 쿼리 검증 → PASS
  - [ ] Test: hasMore 플래그 설정 검증 → PASS
  - [ ] npx vitest run src/composables/__tests__/useChat.test.js → PASS

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 스크롤 업 시 과거 메시지 로드
    Tool: Playwright
    Preconditions: 30개 이상의 메시지가 있는 대화방
    Steps:
      1. /member/chat 이동, 대화방 진입
      2. `.member-chat__messages` 영역의 scrollTop을 0으로 설정 (page.evaluate)
      3. 500ms 대기
      4. DOM 내 `.member-chat__message` 요소 수 확인 (초기값보다 증가)
    Expected Result: 메시지 수가 초기 로드보다 증가 (예: 30 → 60)
    Failure Indicators: 메시지 수 변화 없음, 로딩 스피너 무한 표시
    Evidence: .sisyphus/evidence/task-5-pagination-loaded.png

  Scenario: 모든 메시지 로드 완료 시 안내 텍스트
    Tool: Playwright
    Preconditions: 총 메시지 수가 PAGE_SIZE 미만인 대화방
    Steps:
      1. 채팅방 진입
      2. `.member-chat__load-more` 또는 유사 요소 확인
      3. 스크롤 업 시도
      4. 추가 로딩 없이 "모든 메시지를 불러왔습니다" 텍스트 확인
    Expected Result: 추가 API 호출 없이 안내 텍스트 표시
    Failure Indicators: 계속 로딩 시도, 에러 발생
    Evidence: .sisyphus/evidence/task-5-all-loaded.png
  ```

  **Commit**: YES
  - Message: `feat(chat): add scroll-up pagination for older messages`
  - Files: `src/composables/useChat.js`, `src/views/member/MemberChatView.vue`, `src/views/trainer/TrainerChatView.vue`, `src/views/member/MemberChatView.css`, `src/views/trainer/TrainerChatView.css`, `src/composables/__tests__/useChat.test.js`
  - Pre-commit: `npx vitest run`

- [x] 6. AppImageViewer 공유 컴포넌트 생성

  **What to do**:
  - `src/components/AppImageViewer.vue` 신규 생성
  - Props: `modelValue` (Boolean, v-model으로 show/hide), `src` (String, 이미지 URL), `alt` (String, optional)
  - `<Teleport to="body">` + `<Transition name="image-viewer">` 패턴 사용 (AppBottomSheet.vue와 동일)
  - 풀스크린 오버레이: 어두운 배경 (`rgba(0,0,0,0.9)`), 중앙 이미지, 우측 상단 X 닫기 버튼
  - 오버레이 클릭 시 닫기 (이미지 클릭은 이벤트 전파 중지)
  - ESC 키 닫기 지원
  - 이미지: `object-fit: contain`, `max-width: 100vw`, `max-height: 100vh`
  - CSS: `.app-image-viewer__overlay`, `.app-image-viewer__image`, `.app-image-viewer__close` — BEM 네이밍
  - Transition: 페이드 인/아웃 (opacity 0 → 1)

  **Must NOT do**:
  - 핀치-투-줌 구현하지 않음
  - 이미지 간 스와이프 네비게이션 추가하지 않음 (단일 이미지 뷰어)
  - npm 의존성 추가하지 않음
  - 이미지 다운로드 버튼 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 순수 UI 컴포넌트 생성 — Teleport, Transition, 풀스크린 오버레이 디자인
  - **Skills**: [`playwright`]
    - `playwright`: 뷰어 열기/닫기 동작 확인
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 기존 AppBottomSheet 패턴을 그대로 따르므로 디자인 의사결정 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1 (Storage 수정 후 이미지가 실제로 로딩되어야 뷰어 의미 있음)

  **References**:

  **Pattern References**:
  - `src/components/AppBottomSheet.vue` — Teleport + Transition + v-model 패턴. 오버레이 클릭 닫기, ESC 키 닫기 등의 패턴을 그대로 복제
  - `src/components/AppButton.vue` — defineProps 패턴, 컴포넌트 구조 참고

  **API/Type References**:
  - `modelValue` (Boolean) + `update:modelValue` emit 패턴 — Vue 3 v-model 커스텀 컴포넌트

  **WHY Each Reference Matters**:
  - `AppBottomSheet.vue`: Teleport, Transition, 오버레이, v-model 패턴을 이미 구현한 레퍼런스. 동일 아키텍처 복제
  - `AppButton.vue`: defineProps 선언 스타일, 컴포넌트 파일 구조

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AppImageViewer 열기/닫기
    Tool: Playwright
    Preconditions: AppImageViewer를 사용하는 테스트 페이지 또는 채팅 뷰
    Steps:
      1. 이미지 뷰어가 닫힌 상태에서 `.app-image-viewer__overlay` 요소 부재 확인
      2. 이미지 클릭으로 뷰어 열기
      3. `.app-image-viewer__overlay` 요소 존재 확인
      4. `.app-image-viewer__image` 의 src 속성 확인
      5. `.app-image-viewer__close` 버튼 클릭
      6. `.app-image-viewer__overlay` 요소 부재 재확인
    Expected Result: 뷰어가 열리고 닫히며, 이미지 src가 올바름
    Failure Indicators: 오버레이 미표시, 닫기 실패, 이미지 미로드
    Evidence: .sisyphus/evidence/task-6-viewer-open-close.png

  Scenario: 오버레이 영역 클릭 시 닫기
    Tool: Playwright
    Preconditions: 이미지 뷰어 열린 상태
    Steps:
      1. `.app-image-viewer__overlay` 영역 (이미지 밖) 클릭
      2. 뷰어 닫힘 확인
    Expected Result: 오버레이 클릭으로 뷰어 닫힘
    Failure Indicators: 뷰어 유지됨
    Evidence: .sisyphus/evidence/task-6-overlay-close.png
  ```

  **Commit**: YES (Task 7과 함께 커밋)
  - Message: `feat(chat): add fullscreen image viewer component`
  - Files: `src/components/AppImageViewer.vue`
  - Pre-commit: `npm run build`

- [x] 7. 이미지 미리보기 뷰 연동 — 채팅 이미지 클릭 시 뷰어 열기

  **What to do**:
  - `MemberChatView.vue` 수정:
    - `AppImageViewer` import 추가
    - `showImageViewer` (ref, Boolean), `viewerImageSrc` (ref, String) 상태 추가
    - `.member-chat__file-img`에 `@click="openImageViewer(msg.file_url)"` 핸들러 추가
    - `openImageViewer(src)` 함수: `viewerImageSrc.value = src; showImageViewer.value = true`
    - 템플릿 하단에 `<AppImageViewer v-model="showImageViewer" :src="viewerImageSrc" />` 추가
  - `TrainerChatView.vue` 수정: 동일 변경
  - CSS 수정: `.member-chat__file-img`에 `cursor: pointer` 추가, `.trainer-chat__file-img` 동일

  **Must NOT do**:
  - 이미지 외 파일(PDF 등) 클릭 시 뷰어 열지 않음 (기존 링크 동작 유지)
  - 이미지 다운로드 버튼 추가하지 않음
  - 이미지 갤러리(여러 이미지 슬라이드) 구현하지 않음

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 기존 뷰에 컴포넌트 연동 + CSS 수정
  - **Skills**: [`playwright`]
    - `playwright`: 이미지 클릭 → 뷰어 열기 동작 확인
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 단순 연동, 디자인 결정 없음

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 8과 동시 실행 가능)
  - **Parallel Group**: Wave 3 (with Tasks 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 6 (AppImageViewer 생성 완료 후)

  **References**:

  **Pattern References**:
  - `src/views/member/MemberChatView.vue:103-113` — 기존 이미지 렌더링 코드. `<img>` 태그에 `@click` 추가
  - `src/views/member/MemberChatView.vue:154` — `<AppToast>` 사용 패턴. 동일하게 `<AppImageViewer>` 추가

  **WHY Each Reference Matters**:
  - `MemberChatView.vue:103-113`: 정확한 `<img>` 위치와 클래스명 — 여기에 @click 핸들러 부착
  - `MemberChatView.vue:154`: 기존 공유 컴포넌트 사용 패턴 (import + template + ref)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 채팅 이미지 클릭 시 전체화면 뷰어 열기
    Tool: Playwright
    Preconditions: 이미지가 포함된 채팅 메시지 존재
    Steps:
      1. 채팅방 진입
      2. `.member-chat__file-img` 이미지 클릭
      3. `.app-image-viewer__overlay` 요소 존재 확인
      4. `.app-image-viewer__image` src가 클릭한 이미지 URL과 일치 확인
      5. 스크린샷 캡처
    Expected Result: 전체화면 뷰어에 클릭한 이미지 표시
    Failure Indicators: 뷰어 미표시, 이미지 URL 불일치
    Evidence: .sisyphus/evidence/task-7-image-click-viewer.png

  Scenario: 파일 링크(PDF 등) 클릭 시 뷰어 열리지 않음
    Tool: Playwright
    Preconditions: PDF 등 비이미지 파일 메시지 존재
    Steps:
      1. 채팅방에서 `.member-chat__file-link` 요소 확인
      2. 해당 요소 클릭
      3. `.app-image-viewer__overlay` 요소가 여전히 부재인지 확인
    Expected Result: 뷰어 열리지 않음, 기존 새 탭 열기 동작 유지
    Failure Indicators: 뷰어가 열림
    Evidence: .sisyphus/evidence/task-7-file-link-no-viewer.png
  ```

  **Commit**: YES (Task 6과 합쳐서 커밋)
  - Message: `feat(chat): integrate image viewer into chat views`
  - Files: `src/views/member/MemberChatView.vue`, `src/views/trainer/TrainerChatView.vue`, `src/views/member/MemberChatView.css`, `src/views/trainer/TrainerChatView.css`
  - Pre-commit: `npm run build`

- [x] 8. 메시지 검색 기능 — 서버 사이드 ilike 검색

  **What to do**:
  - **RED (테스트 먼저)**: `useChat.test.js`에 `searchMessages()` 테스트 작성 — ilike 쿼리 구성, 빈 쿼리 처리, 결과 제한
  - `useChat.js`에 `searchMessages(partnerId, query)` 함수 추가:
    - 최소 쿼리 길이: 2자 미만이면 빈 배열 반환
    - Supabase 쿼리: `.from('messages').select('*').or(...)` + `.ilike('content', '%${query}%')`
    - 양방향 필터: `sender_id/receiver_id` 조합
    - `.order('created_at', { ascending: false }).limit(50)`
    - `searchResults` ref + `searchLoading` ref 추가
  - `MemberChatView.vue` 수정:
    - 채팅방 헤더에 검색 아이콘 버튼 추가
    - 클릭 시 검색 입력란 표시 (헤더 아래 슬라이드 다운)
    - 검색 input에 `@input` 핸들러 (300ms debounce)
    - 검색 결과: 기존 메시지 목록 대신 결과 리스트 표시
    - 결과 항목 클릭 시 해당 메시지로 스크롤 (또는 목록에서 하이라이트)
    - 검색 결과 수 표시: "N개 결과"
    - 빈 결과: "검색 결과가 없습니다" 표시
    - 검색 닫기(X) 시 원래 메시지 목록으로 복귀
  - `TrainerChatView.vue` 수정: 동일 변경
  - CSS 수정: 검색 바, 검색 결과 하이라이트 스타일
  - **GREEN**: 테스트 통과 + UI 동작 확인
  - **REFACTOR**: 디바운스 로직 정리

  **Must NOT do**:
  - Full-text search (tsvector, pg_trgm) 구현하지 않음 — ilike로 충분
  - 파일명/파일 내용 검색하지 않음 — 텍스트 메시지만
  - 별도 검색 결과 페이지 만들지 않음 — 채팅방 내에서 인라인
  - 검색 인덱스(GIN 등) 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 서버 사이드 쿼리 + 디바운스 + UI 상태 관리 + TDD
  - **Skills**: [`playwright`]
    - `playwright`: 검색 입력 → 결과 표시 검증
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 검색 바 디자인이 단순 (input + 아이콘)

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 7과 동시 실행 가능)
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/composables/useChat.js:84-109` — `fetchMessages()` 쿼리 구조. `.or()` 양방향 필터 패턴을 검색 쿼리에도 동일 적용
  - `src/views/member/MemberChatView.vue:78-85` — 채팅방 헤더. 여기에 검색 아이콘 버튼 추가
  - `src/views/common/NotificationListView.vue` — 탭 전환 UI 참고. 검색 모드와 일반 모드 전환에 유사 패턴 사용 가능

  **Test References**:
  - `src/composables/__tests__/useChat.test.js` — 기존 모킹 패턴. ilike 쿼리 체이닝 mock 추가

  **WHY Each Reference Matters**:
  - `useChat.js:84-109`: `.or()` 양방향 필터를 그대로 사용하되 `.ilike()` 추가
  - `MemberChatView.vue:78-85`: 헤더 레이아웃에 검색 아이콘을 넣을 정확한 위치
  - `NotificationListView.vue`: 같은 뷰 내에서 모드 전환(검색/일반) UI 패턴 참고

  **Acceptance Criteria**:

  **If TDD:**
  - [ ] Test: searchMessages ilike 쿼리 구성 검증 → PASS
  - [ ] Test: 2자 미만 쿼리 시 빈 배열 반환 → PASS
  - [ ] Test: 결과 50개 제한 검증 → PASS
  - [ ] npx vitest run src/composables/__tests__/useChat.test.js → PASS

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 검색어 입력 시 매칭 메시지 표시
    Tool: Playwright
    Preconditions: "테스트"가 포함된 메시지가 있는 대화방
    Steps:
      1. 채팅방 진입
      2. 검색 아이콘 버튼 클릭
      3. 검색 input에 "테스트" 입력
      4. 500ms 대기 (디바운스)
      5. 검색 결과 영역에 매칭 메시지 표시 확인
      6. "N개 결과" 텍스트 확인
    Expected Result: "테스트" 포함 메시지가 결과로 표시됨
    Failure Indicators: 결과 미표시, 에러 발생
    Evidence: .sisyphus/evidence/task-8-search-results.png

  Scenario: 검색 결과 없을 때 안내 메시지
    Tool: Playwright
    Preconditions: 채팅방에 존재하지 않는 문자열 사용
    Steps:
      1. 검색 input에 "zxcvbnm12345" 입력
      2. 500ms 대기
      3. "검색 결과가 없습니다" 텍스트 확인
    Expected Result: "검색 결과가 없습니다" 표시
    Failure Indicators: 빈 화면, 에러, 또는 잘못된 결과
    Evidence: .sisyphus/evidence/task-8-no-results.png

  Scenario: 1자 입력 시 검색 실행 안 됨
    Tool: Playwright
    Preconditions: 검색 모드 활성
    Steps:
      1. 검색 input에 "가" (1자) 입력
      2. 500ms 대기
      3. 검색 결과 영역 비어있음 확인 (API 호출 없음)
    Expected Result: 검색 미실행, 결과 영역 비어있음
    Failure Indicators: 검색 실행됨
    Evidence: .sisyphus/evidence/task-8-min-length.png
  ```

  **Commit**: YES
  - Message: `feat(chat): add message search within conversations`
  - Files: `src/composables/useChat.js`, `src/views/member/MemberChatView.vue`, `src/views/trainer/TrainerChatView.vue`, `src/views/member/MemberChatView.css`, `src/views/trainer/TrainerChatView.css`, `src/composables/__tests__/useChat.test.js`
  - Pre-commit: `npx vitest run`

- [x] 10. 채팅하기 버튼 추가 — TrainerMemberDetailView + MemberSettingsView

  **What to do**:
  - `src/views/trainer/TrainerMemberDetailView.vue` 수정:
    - `quick-actions` 섹션(line 124)에 "채팅하기" 버튼 추가 — 수납 기록과 PT 횟수 관리 사이에 배치
    - `goChat()` 함수 추가: `router.push({ name: 'trainer-chat', query: { partnerId: route.params.id } })`
    - 버튼 아이콘: 말풍선 SVG (채팅 아이콘)
    - 기존 `quick-action` 클래스 재사용 (스타일 변경 없음)
  - `src/views/member/MemberSettingsView.vue` 수정:
    - 연결 관리 섹션(line 101-126)에서 트레이너 연결 해제 버튼 위에 "채팅하기" 버튼 추가
    - 조건: `v-if="trainerName"` (트레이너 연결된 경우만 표시)
    - `goChat()` 함수 추가: `router.push({ name: 'member-chat' })`
    - 기존 `settings__row` 클래스 재사용
    - `settings__divider` 구분선 추가
  - CSS 수정 없음 — 기존 클래스 재사용

  **Must NOT do**:
  - 새 CSS 클래스 추가하지 않음 (기존 `quick-action`, `settings__row` 재사용)
  - `MemberChatView.vue`에 query param 처리 추가하지 않음 (회원은 트레이너 1명이므로 불필요)
  - `TrainerChatView.vue` 수정하지 않음 (이미 `?partnerId=` 처리 구현됨)
  - HomeView.vue 수정하지 않음 (단순 스텁 페이지)
  - 새 라우트 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 패턴을 그대로 복제하는 단순 버튼 추가 작업
  - **Skills**: [`playwright`]
    - `playwright`: 버튼 클릭 → 채팅 화면 이동 확인
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 기존 스타일 재사용, 디자인 결정 없음
    - `git-master`: 단순 커밋

  **Parallelization**:
  - **Can Run In Parallel**: YES (Tasks 3, 4, 5, 6과 동시 실행 가능 — 완전 독립적)
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 6)
  - **Blocks**: Task 9
  - **Blocked By**: None (can start immediately after Wave 1)

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberDetailView.vue:124-163` — 기존 `quick-actions` 섹션. 버튼 구조(`quick-action` 클래스, 아이콘 div, 라벨 span, 화살표 SVG)를 그대로 복제
  - `src/views/trainer/TrainerMemberDetailView.vue:299-305` — 기존 `goPayment()`, `goPtCount()` 함수. `router.push({ name: '...', params: { id: route.params.id } })` 패턴 참고
  - `src/views/member/MemberSettingsView.vue:101-126` — 연결 관리 섹션. `settings__row` 버튼 구조 + `settings__divider` 패턴 참고
  - `src/views/trainer/TrainerChatView.vue:286-306` — `onMounted`에서 `route.query.partnerId` 처리 이미 구현됨. 별도 수정 불필요

  **API/Type References**:
  - 라우트 이름: `'trainer-chat'` (router/index.js line 163-166), `'member-chat'` (line 226-229)
  - TrainerChatView query param: `?partnerId=<memberId>` — 이미 지원됨

  **WHY Each Reference Matters**:
  - `TrainerMemberDetailView.vue:124-163`: 버튼 HTML 구조를 100% 복제. 아이콘 div + 라벨 span + 화살표 SVG 패턴
  - `TrainerMemberDetailView.vue:299-305`: `route.params.id`를 `partnerId`로 전달하는 정확한 패턴
  - `MemberSettingsView.vue:101-126`: `settings__row` 버튼 + `settings__divider` 삽입 위치
  - `TrainerChatView.vue:286-306`: `?partnerId=` 쿼리 파라미터가 이미 처리됨을 확인 — 추가 작업 불필요

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 트레이너가 회원 상세에서 채팅하기 버튼 클릭
    Tool: Playwright
    Preconditions: 트레이너 로그인, 연결된 회원 존재
    Steps:
      1. /trainer/members/{memberId} 이동
      2. quick-actions 섹션에서 "채팅하기" 버튼 확인
      3. 버튼 클릭
      4. URL이 /trainer/chat?partnerId={memberId}로 변경 확인
      5. 채팅방이 해당 회원과 자동으로 열리는지 확인
    Expected Result: 해당 회원과의 채팅방이 자동으로 열림
    Failure Indicators: 버튼 미표시, URL 변경 안 됨, 채팅방 미열림
    Evidence: .sisyphus/evidence/task-10-trainer-chat-btn.png

  Scenario: 회원이 설정에서 채팅하기 버튼 클릭
    Tool: Playwright
    Preconditions: 회원 로그인, 트레이너 연결 상태
    Steps:
      1. /member/settings 이동
      2. 연결 관리 섹션에서 "채팅하기" 버튼 확인
      3. 버튼 클릭
      4. URL이 /member/chat으로 변경 확인
    Expected Result: 채팅 목록 화면으로 이동
    Failure Indicators: 버튼 미표시, 이동 실패
    Evidence: .sisyphus/evidence/task-10-member-chat-btn.png

  Scenario: 트레이너 미연결 시 채팅하기 버튼 미표시 (회원 설정)
    Tool: Playwright
    Preconditions: 회원 로그인, 트레이너 미연결 상태
    Steps:
      1. /member/settings 이동
      2. 연결 관리 섹션 확인
      3. "채팅하기" 버튼이 없는지 확인
    Expected Result: 채팅하기 버튼 미표시
    Failure Indicators: 미연결 상태에서 버튼 표시됨
    Evidence: .sisyphus/evidence/task-10-no-btn-disconnected.png
  ```

  **Commit**: YES
  - Message: `feat(chat): add chat shortcut buttons to member detail and settings views`
  - Files: `src/views/trainer/TrainerMemberDetailView.vue`, `src/views/member/MemberSettingsView.vue`
  - Pre-commit: `npm run build`

- [x] 9. 통합 테스트 + 빌드 검증

  **What to do**:
  - 전체 테스트 실행: `npx vitest run` — 모든 테스트 PASS 확인
  - 프로덕션 빌드: `npm run build` — 에러 0개 확인
  - Playwright로 전체 채팅 기능 통합 검증:
    1. 채팅 목록 → 채팅방 진입 → 메시지 전송 → 읽음 표시 "1" 확인
    2. 파일 전송 → 이미지 클릭 → 전체화면 뷰어 확인
    3. 스크롤 업 → 과거 메시지 로드 확인
    4. 검색 → 결과 표시 확인
    5. 알림 목록에서 새 메시지 알림 확인
  - 에러 발생 시 원인 파악 및 수정

  **Must NOT do**:
  - 새 기능 추가하지 않음 (검증만)
  - 기존 코드 리팩토링하지 않음
  - 성능 최적화하지 않음

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 전체 시스템 통합 검증 — 여러 기능의 상호작용 확인 필요
  - **Skills**: [`playwright`]
    - `playwright`: 전체 기능 통합 테스트 실행
  - **Skills Evaluated but Omitted**:
    - `git-master`: 커밋 불필요 (검증만)

  **Parallelization**:
  - **Can Run In Parallel**: NO (모든 이전 태스크 완료 후)
  - **Parallel Group**: Wave 3 (sequential, after Tasks 3-8)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 3, 4, 5, 7, 8

  **References**:

  **Pattern References**:
  - 모든 이전 태스크의 QA 시나리오 참고 — 통합 순서로 재실행

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 전체 기능 통합 워크플로우
    Tool: Playwright
    Preconditions: 모든 Task 1-8 완료, 개발 서버 실행 중
    Steps:
      1. 로그인 → /member/chat 이동
      2. 대화 목록에서 대화방 진입
      3. 텍스트 메시지 전송 → "1" 읽음 표시 확인
      4. 이미지 전송 → 이미지 버블 확인
      5. 이미지 클릭 → AppImageViewer 열기 → X 닫기
      6. 스크롤 업 → 과거 메시지 로드 확인
      7. 검색 아이콘 클릭 → 검색어 입력 → 결과 확인
      8. 검색 닫기 → 일반 모드 복귀
      9. /common/notifications 이동 → 새 메시지 알림 확인
    Expected Result: 모든 단계 정상 동작
    Failure Indicators: 어떤 단계에서든 실패
    Evidence: .sisyphus/evidence/task-9-integration-flow.png

  Scenario: 빌드 + 테스트 통과
    Tool: Bash
    Preconditions: 모든 소스 코드 변경 완료
    Steps:
      1. npx vitest run 실행
      2. npm run build 실행
      3. 두 명령 모두 exit code 0 확인
    Expected Result: 테스트 전체 PASS, 빌드 성공
    Failure Indicators: 테스트 실패 또는 빌드 에러
    Evidence: .sisyphus/evidence/task-9-build-test.txt
  ```

  **Commit**: YES (검증 결과에 따라 수정 사항 있을 경우만)
  - Message: `test(chat): verify all chat enhancements pass integration tests`
  - Pre-commit: `npx vitest run && npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npx vitest run`. Review all changed files for: `as any`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify CSS follows BEM naming. Verify all imports use `@/` alias.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Task 1**: `fix(chat): make chat-files bucket accessible to message participants` — schema.sql, useChat.js
- **Task 2**: `fix(chat): correct message ordering to newest-first and add REPLICA IDENTITY` — useChat.js, schema.sql
- **Task 3**: `feat(chat): add read receipt "1" indicator on sent messages` — MemberChatView.vue, TrainerChatView.vue, *.css
- **Task 4**: `feat(chat): add in-app notification on new message` — useChat.js, useChat.test.js
- **Task 5**: `feat(chat): add scroll-up pagination for older messages` — useChat.js, MemberChatView.vue, TrainerChatView.vue, *.css, useChat.test.js
- **Task 6+7**: `feat(chat): add fullscreen image viewer on chat image click` — AppImageViewer.vue, MemberChatView.vue, TrainerChatView.vue, *.css
- **Task 8**: `feat(chat): add message search within conversations` — useChat.js, MemberChatView.vue, TrainerChatView.vue, *.css, useChat.test.js
- **Task 9**: `test(chat): verify all chat enhancements pass integration tests` — npx vitest run
- **Task 10**: `feat(chat): add chat shortcut buttons to member detail and settings views` — TrainerMemberDetailView.vue, MemberSettingsView.vue

---

## Success Criteria

### Verification Commands
```bash
npx vitest run                    # Expected: all tests PASS
npm run build                     # Expected: exit code 0, zero errors
```

### Final Checklist
- [ ] 읽음 표시 "1"이 내가 보낸 미읽은 메시지에 표시됨
- [ ] 상대방이 채팅방 열면 "1"이 사라짐
- [ ] 메시지 전송 시 수신자 알림 목록에 표시됨
- [ ] 스크롤 업 시 과거 메시지 로드됨
- [ ] 채팅 이미지 클릭 시 전체화면 뷰어 열림
- [ ] 검색어 입력 시 매칭 메시지 표시됨
- [ ] 트레이너 회원 상세 페이지에 "채팅하기" 버튼 표시됨
- [ ] 버튼 클릭 시 해당 회원과의 채팅방 자동 열림
- [ ] 회원 설정 페이지에 "채팅하기" 버튼 표시됨 (트레이너 연결 시)
- [ ] 트레이너 미연결 시 채팅하기 버튼 미표시
- [ ] 모든 테스트 PASS
- [ ] 빌드 에러 없음
