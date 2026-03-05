# FitLink PRD 전체 완성 — Phase 2

## TL;DR

> **목표**: MVP 이후 남은 PRD 전체 기능 10개를 구현하여 제품을 완성한다.
> 채팅(Supabase Realtime), 운동 매뉴얼(영상+사진), 오늘의 운동, PT 횟수 관리,
> 수납 기록, 프로필 수정, 계정 관리(탈퇴/연결 해제), 인앱 알림, 휴무일 설정,
> 트레이너 검색 승인 플로우를 모두 구현한다.
> 
> **산출물**:
> - 새 DB 테이블 7개 + 기존 테이블 확장 2개 + Storage 버킷 2개
> - 새 composable 7개 + 기존 composable 확장 3개
> - 새 뷰 6개 + 기존 "준비 중" 뷰 9개 교체 + 기존 뷰 업데이트 6개
> - Vitest 설정 + 핵심 composable 단위 테스트
> - BottomNav 알림 배지 추가
> 
> **예상 소요**: XL (2-3주)
> **병렬 실행**: YES — 6 waves
> **크리티컬 패스**: DB 스키마 → Composables → Views → Dashboard 통합 → E2E 검증

---

## Context

### Original Request
MVP 로드맵 완료 후, PRD에 정의된 전체 기능을 한번에 구현하는 계획 요청.

### Interview Summary
**핵심 결정사항**:
- 전체 PRD 완성 (10개 미구현 기능 전부)
- 채팅: Supabase Realtime 실시간 메시지
- 매뉴얼 영상: 직접 업로드(500MB) + YouTube URL 모두 지원
- 테스트: Vitest 설정 + 핵심 composable 단위 테스트 추가
- DB: Supabase MCP로 직접 SQL 실행 + schema.sql 동기화

**PRD 조정사항**:
- PT 횟수 0이면 예약 차단 (PRD는 "경고만" → "불가"로 변경)
- 알림 7일 보관 후 삭제 (PRD 30일 → 7일로 단축)

### Metis Review
**식별된 갭** (해결됨):
- connection_status enum에 'pending' 추가 필요 → Wave 1에서 처리
- memos 테이블 회원 읽기 RLS 누락 → Wave 1에서 수정
- 알림 트리거 목록 미정의 → 아래 Notification Triggers에 명시
- 매뉴얼 가시성 범위 → 모든 인증 사용자 열람 가능 (PRD 원문 준수)
- 계정 삭제 시 CASCADE vs Archive → 소프트 삭제 (프로필 익명화 + 데이터 보존)
- 채팅 방 모델 → trainer_members 쌍 기반 암묵적 채팅방 (별도 테이블 불필요)
- PT 횟수 자동 차감 → 예약 'completed' 상태 변경 시 DB trigger로 자동 -1
- 대시보드 업데이트 → 각 기능 완성 후 마지막 Wave에서 통합 업데이트

---

## Work Objectives

### Core Objective
PRD에 명시된 전체 기능을 구현하여 트레이너-회원 간 PT 관리 앱을 제품 수준으로 완성한다.

### Concrete Deliverables
**새 DB 테이블**: messages, payments, pt_sessions, manuals, manual_media, workout_plans, notifications
**기존 테이블 변경**: connection_status enum에 'pending' 추가, memos에 회원 읽기 RLS 추가, trainer_holidays 테이블 추가
**새 Storage 버킷**: chat-files (이미지 10MB, 파일 50MB), manual-media (사진 + 영상 500MB)
**새 Composable**: useChat, useNotifications, usePayments, usePtSessions, useManuals, useWorkoutPlans, useHolidays
**기존 Composable 확장**: useProfile (프로필 수정), useReservations (PT횟수 검증), useTrainerSearch (승인 플로우)
**새 뷰**: NotificationListView, PtCountManageView, ProfileEditView (트레이너/회원), ConnectionDisconnectView
**교체 뷰**: TrainerChatView, MemberChatView, TrainerManualView, ManualRegisterView, MemberManualView, ManualDetailView, TodayWorkoutView, MemberPaymentView, PaymentWriteView
**업데이트 뷰**: TrainerHomeView, MemberHomeView, TrainerMemberDetailView, SettingsView, MemberSettingsView, TrainerSearchView
**테스트**: Vitest 설정 + 핵심 composable 테스트

### Definition of Done
- [ ] `npm run build` → 에러 없이 완료
- [ ] `npx vitest run` → 모든 테스트 통과
- [ ] PRD §2-§16 전 기능 동작
- [ ] 채팅 메시지 실시간 수신 (Supabase Realtime)
- [ ] PT 횟수 0일 때 예약 차단 동작
- [ ] 매뉴얼 영상 업로드 + YouTube URL 재생
- [ ] 알림 배지 + 알림 목록 동작
- [ ] 계정 삭제 + 연결 해제 동작
- [ ] 모든 "준비 중" 스텁 뷰 교체 완료

### Must Have
- 모든 새 DB 테이블에 RLS 정책 적용
- 채팅 Realtime 구독은 채팅방 마운트 시에만 활성
- PT 횟수 0 → create_reservation RPC에서 차단
- 알림 7일 보관 (DB cleanup 또는 쿼리 필터)
- 프로필 수정 시 이름 필수값 검증
- 매뉴얼 영상 500MB, 사진 10장 제한
- 채팅 파일 이미지 10MB, 일반 파일 50MB 제한
- 계정 삭제 시 프로필 익명화 + 기존 데이터 보존
- 연결 해제 시 승인된 예약 자동 취소 경고
- 모든 에러 메시지 한국어 인라인 표시

### Must NOT Have (Guardrails)
- ❌ 타이핑 인디케이터, 온라인 상태, 메시지 검색, 리액션
- ❌ 커스텀 비디오 플레이어 (네이티브 HTML5 video + YouTube iframe)
- ❌ 비디오 트랜스코딩, 썸네일 자동 생성
- ❌ OS 푸시 알림 (인앱만)
- ❌ 알림 유형별 설정, 알림 그룹핑/배칭
- ❌ 수납 기록 CSV/PDF 내보내기
- ❌ 차트/그래프 (대시보드는 단순 요약 카드)
- ❌ 프로필 완성도 퍼센트, 프로필 공개 설정
- ❌ 드래그 앤 드롭 운동 배정
- ❌ TypeScript 추가 금지
- ❌ 새 npm 패키지 설치 금지 (Vitest 제외)
- ❌ cross-feature 의존성 (각 기능 독립 배포 가능)
- ❌ 범용 "미디어 업로드" composable (기능별 분리)

### Notification Triggers (명시적 목록)
| 이벤트 | 수신자 | 메시지 |
|--------|--------|--------|
| 예약 요청 | 트레이너 | "OOO님이 MM/DD HH:MM 예약을 요청했습니다" |
| 예약 승인 | 회원 | "MM/DD HH:MM 예약이 승인되었습니다" |
| 예약 거절 | 회원 | "MM/DD HH:MM 예약이 거절되었습니다" |
| 예약 취소 | 상대방 | "OOO님이 MM/DD 예약을 취소했습니다" |
| 새 채팅 메시지 | 수신자 | "OOO님이 메시지를 보냈습니다" |
| 운동 배정 | 회원 | "트레이너가 오늘의 운동을 배정했습니다" |
| 연결 요청 (검색) | 트레이너 | "OOO님이 연결을 요청했습니다" |
| 연결 승인 | 회원 | "OOO 트레이너와 연결되었습니다" |
| PT 횟수 변경 | 회원 | "PT 횟수가 N회 추가/차감되었습니다 (잔여: M회)" |
| 수납 기록 추가 | 회원 | "새로운 수납 기록이 등록되었습니다" |

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — 모든 검증은 에이전트가 실행. 예외 없음.

### Test Decision
- **인프라 존재**: NO → YES (Vitest 설치)
- **자동 테스트**: Tests-after (구현 후 테스트)
- **프레임워크**: Vitest
- **범위**: Composable 단위 테스트만 (뷰 테스트 제외)

### QA Policy
모든 태스크에 에이전트 실행 QA 시나리오 포함.
증거 저장: `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`

- **Frontend/UI**: Playwright — 네비게이트, 인터랙션, DOM 확인, 스크린샷
- **Backend/DB**: Bash (Supabase MCP 또는 curl) — 데이터 검증
- **Realtime**: Playwright + 2개 브라우저 탭 — 실시간 메시지 수신 확인
- **빌드**: `npm run build` — exit code 0 확인
- **테스트**: `npx vitest run` — 전체 통과 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (즉시 시작 — DB 스키마 + 인프라):
├── Task 1:  Vitest 설정 + 테스트 인프라 [quick]
├── Task 2:  DB 스키마 — messages 테이블 + RLS [quick]
├── Task 3:  DB 스키마 — payments + pt_sessions 테이블 + RLS [quick]
├── Task 4:  DB 스키마 — manuals + manual_media 테이블 + RLS [quick]
├── Task 5:  DB 스키마 — workout_plans 테이블 + RLS [quick]
├── Task 6:  DB 스키마 — notifications 테이블 + RLS [quick]
├── Task 7:  DB 스키마 — trainer_holidays 테이블 + RLS [quick]
├── Task 8:  DB 변경 — connection_status enum 'pending' 추가 + memos 회원 읽기 RLS [quick]
├── Task 9:  Storage 버킷 — chat-files + manual-media 생성 [quick]
└── Task 10: DB 변경 — create_reservation RPC PT횟수 검증 추가 + PT 자동 차감 trigger [deep]

Wave 2 (Wave 1 이후 — Composable 레이어):
├── Task 11: useChat composable (depends: 2, 9) [unspecified-high]
├── Task 12: useNotifications composable (depends: 6) [unspecified-low]
├── Task 13: usePayments composable (depends: 3) [quick]
├── Task 14: usePtSessions composable (depends: 3, 10) [quick]
├── Task 15: useManuals composable + 미디어 업로드 (depends: 4, 9) [unspecified-high]
├── Task 16: useWorkoutPlans composable (depends: 5) [quick]
├── Task 17: useHolidays composable (depends: 7) [quick]
├── Task 18: useProfile 확장 — 프로필 수정 기능 추가 [quick]
├── Task 19: useTrainerSearch 확장 — 승인 플로우 (depends: 8) [quick]
└── Task 20: useReservations 확장 — 휴무일 + PT횟수 검증 (depends: 7, 10) [quick]

Wave 3 (Wave 2 이후 — 핵심 뷰 구현):
├── Task 21: 1:1 채팅 뷰 — TrainerChatView + MemberChatView (depends: 11) [visual-engineering]
├── Task 22: 운동 매뉴얼 뷰 — TrainerManualView + ManualRegisterView (depends: 15) [visual-engineering]
├── Task 23: 운동 매뉴얼 뷰 — MemberManualView + ManualDetailView (depends: 15) [visual-engineering]
├── Task 24: 오늘의 운동 뷰 — TodayWorkoutView (depends: 16) [visual-engineering]
├── Task 25: PT 횟수 관리 뷰 — PtCountManageView (depends: 14) [visual-engineering]
├── Task 26: 수납 기록 뷰 — MemberPaymentView + PaymentWriteView (depends: 13) [visual-engineering]
├── Task 27: 알림 목록 뷰 — NotificationListView + 라우트 추가 (depends: 12) [visual-engineering]
└── Task 28: 휴무일 설정 뷰 — TrainerScheduleView 확장 (depends: 17) [quick]

Wave 4 (Wave 3 이후 — 계정/프로필/검색/네비게이션):
├── Task 29: 프로필 수정 뷰 — 트레이너 + 회원 (depends: 18) [visual-engineering]
├── Task 30: 계정 관리 — 탈퇴 + 연결 해제 (depends: 전체 스키마) [deep]
├── Task 31: 트레이너 검색 승인 플로우 뷰 업데이트 (depends: 19) [quick]
├── Task 32: BottomNav + TrainerBottomNav 알림 배지 추가 (depends: 12) [quick]
└── Task 33: 회원 메모 읽기 뷰 추가 (depends: 8) [quick]

Wave 5 (Wave 4 이후 — 대시보드 통합 + 테스트):
├── Task 34: TrainerHomeView 대시보드 통합 업데이트 (depends: 11, 14) [quick]
├── Task 35: MemberHomeView 대시보드 통합 업데이트 (depends: 14, 16) [quick]
├── Task 36: TrainerMemberDetailView 통합 업데이트 (depends: 14, 13, 16) [quick]
├── Task 37: SettingsView + MemberSettingsView 프로필 수정/계정 관리 링크 (depends: 29, 30) [quick]
├── Task 38: Vitest 단위 테스트 작성 (depends: 11-20) [unspecified-high]
└── Task 39: schema.sql 동기화 + AGENTS.md 업데이트 [writing]

Wave 6 (Wave 5 이후 — 검증):
├── Task 40: E2E 크리티컬 패스 검증 (depends: ALL) [deep]
└── Task 41: npm run build + vitest run 최종 검증 [quick]

Wave FINAL (ALL 완료 후 — 독립 리뷰, 4 병렬):
├── Task F1: 플랜 준수 감사 (oracle)
├── Task F2: 코드 품질 리뷰 (unspecified-high)
├── Task F3: 실제 QA 검증 (unspecified-high + playwright)
└── Task F4: 스코프 충실도 점검 (deep)

크리티컬 패스: T2-T10 → T11 → T21 → T34 → T40 → F1-F4
병렬 속도 향상: ~65% 순차 대비 빠름
최대 동시: 10 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 38 |
| 2 | — | 11 |
| 3 | — | 13, 14 |
| 4 | — | 15 |
| 5 | — | 16 |
| 6 | — | 12 |
| 7 | — | 17, 20 |
| 8 | — | 19, 33 |
| 9 | — | 11, 15 |
| 10 | — | 14, 20 |
| 11 | 2, 9 | 21, 34 |
| 12 | 6 | 27, 32 |
| 13 | 3 | 26, 36 |
| 14 | 3, 10 | 25, 34, 35, 36 |
| 15 | 4, 9 | 22, 23 |
| 16 | 5 | 24, 35, 36 |
| 17 | 7 | 28 |
| 18 | — | 29 |
| 19 | 8 | 31 |
| 20 | 7, 10 | 40 |
| 21 | 11 | 40 |
| 22 | 15 | 40 |
| 23 | 15 | 40 |
| 24 | 16 | 40 |
| 25 | 14 | 40 |
| 26 | 13 | 40 |
| 27 | 12 | 40 |
| 28 | 17 | 40 |
| 29 | 18 | 37 |
| 30 | 전체 스키마 | 37 |
| 31 | 19 | 40 |
| 32 | 12 | 40 |
| 33 | 8 | 40 |
| 34 | 11, 14 | 40 |
| 35 | 14, 16 | 40 |
| 36 | 14, 13, 16 | 40 |
| 37 | 29, 30 | 40 |
| 38 | 11-20, 1 | 41 |
| 39 | ALL | — |
| 40 | ALL | F1-F4 |
| 41 | 38, 40 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 10개 — T1-T9 → `quick`, T10 → `deep`
- **Wave 2**: 10개 — T11,T15 → `unspecified-high`, T12 → `unspecified-low`, T13-14,T16-20 → `quick`
- **Wave 3**: 8개 — T21-T27 → `visual-engineering`, T28 → `quick`
- **Wave 4**: 5개 — T29 → `visual-engineering`, T30 → `deep`, T31-T33 → `quick`
- **Wave 5**: 6개 — T34-T37 → `quick`, T38 → `unspecified-high`, T39 → `writing`
- **Wave 6**: 2개 — T40 → `deep`, T41 → `quick`
- **FINAL**: 4개 — F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Vitest 테스트 인프라 설정

  **What to do**:
  - `npm install -D vitest` 실행
  - `vite.config.js`에 Vitest 설정 추가 (`test: { environment: 'jsdom' }`)
  - `src/__tests__/` 디렉토리 생성
  - `src/__tests__/setup.js` 생성 — Supabase client mock 설정
  - `package.json`에 `"test": "vitest run"` 스크립트 추가
  - 샘플 테스트 `src/__tests__/example.test.js` 작성하여 인프라 검증

  **Must NOT do**:
  - Vue 컴포넌트 테스트 추가하지 않기 (composable만)
  - happy-dom 대신 jsdom 사용 (호환성)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-10)
  - **Blocks**: Task 38
  - **Blocked By**: None

  **References**:
  - `vite.config.js` — 기존 Vite 설정. `defineConfig` 안에 `test` 속성 추가
  - `package.json` — scripts 섹션에 test 명령 추가

  **Acceptance Criteria**:
  - [ ] `npx vitest run` → exit code 0 (샘플 테스트 1개 통과)
  - [ ] `npm run test` 스크립트 동작

  **QA Scenarios**:
  ```
  Scenario: Vitest 실행 확인
    Tool: Bash
    Steps:
      1. npx vitest run
    Expected Result: "1 passed" 출력, exit code 0
    Evidence: .sisyphus/evidence/task-1-vitest-setup.txt
  ```

  **Commit**: YES
  - Message: `chore: Vitest 테스트 인프라 설정`
  - Files: `vite.config.js`, `package.json`, `src/__tests__/setup.js`, `src/__tests__/example.test.js`

- [ ] 2. DB 스키마 — messages 테이블 + RLS

  **What to do**:
  - Supabase MCP로 SQL 실행:
    ```sql
    CREATE TABLE IF NOT EXISTS public.messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      content text,
      file_url text,
      file_name text,
      file_type text,
      file_size bigint,
      is_read boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT sender_id_ne_receiver CHECK (sender_id <> receiver_id)
    );
    CREATE INDEX idx_messages_participants ON public.messages (sender_id, receiver_id, created_at DESC);
    CREATE INDEX idx_messages_receiver_unread ON public.messages (receiver_id) WHERE is_read = false;
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
    ```
  - RLS 정책:
    - SELECT: `auth.uid() = sender_id OR auth.uid() = receiver_id` (참여자만 읽기)
    - INSERT: `auth.uid() = sender_id` (본인만 전송)
    - UPDATE: `auth.uid() = receiver_id` (수신자만 읽음 처리)
  - INSERT 추가 검증: active trainer_members 연결 존재 확인

  **Must NOT do**:
  - message_participants 같은 별도 테이블 만들지 않기 (1:1 채팅이므로 sender/receiver 직접)
  - chat_rooms 테이블 만들지 않기 (trainer_members 쌍으로 암묵적 채팅방)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 11
  - **Blocked By**: None

  **References**:
  - `supabase/schema.sql` — 기존 테이블 패턴 (uuid PK, ON DELETE CASCADE, timestamptz)
  - `supabase/schema.sql:387-414` — memos 테이블 RLS 패턴 참고

  **Acceptance Criteria**:
  - [ ] `SELECT * FROM public.messages LIMIT 0` → 에러 없이 실행
  - [ ] RLS 정책 4개 존재 확인

  **QA Scenarios**:
  ```
  Scenario: messages 테이블 생성 확인
    Tool: Bash (Supabase MCP)
    Steps:
      1. SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' ORDER BY ordinal_position;
    Expected Result: id, sender_id, receiver_id, content, file_url, file_name, file_type, file_size, is_read, created_at 컬럼 존재
    Evidence: .sisyphus/evidence/task-2-messages-schema.txt

  Scenario: RLS 정책 확인
    Tool: Bash (Supabase MCP)
    Steps:
      1. SELECT policyname, cmd FROM pg_policies WHERE tablename = 'messages';
    Expected Result: SELECT, INSERT, UPDATE 정책 존재
    Evidence: .sisyphus/evidence/task-2-messages-rls.txt
  ```

  **Commit**: YES (groups with T3-T10)

- [ ] 3. DB 스키마 — payments + pt_sessions 테이블 + RLS

  **What to do**:
  - Supabase MCP로 SQL 실행:
    ```sql
    -- PT 횟수 관리
    CREATE TABLE IF NOT EXISTS public.pt_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      change_amount int NOT NULL,
      reason text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_pt_sessions_member ON public.pt_sessions (member_id, created_at DESC);
    ALTER TABLE public.pt_sessions ENABLE ROW LEVEL SECURITY;

    -- 수납 기록
    CREATE TABLE IF NOT EXISTS public.payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      amount int NOT NULL CHECK (amount > 0),
      memo text,
      payment_date date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_payments_member ON public.payments (member_id, created_at DESC);
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    ```
  - pt_sessions RLS: 트레이너 INSERT/UPDATE, 양쪽 SELECT
  - payments RLS: 트레이너 INSERT/DELETE, 양쪽 SELECT
  - pt_sessions.change_amount: 양수 = 추가, 음수 = 차감. 잔여 = SUM(change_amount)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: None

  **References**:
  - `supabase/schema.sql` — 기존 RLS 패턴
  - PRD §12 (PT 횟수) — change_amount 방식으로 이력 관리, 마이너스 불가
  - PRD §13 (수납) — 금액 > 0 필수, 메모 선택

  **Acceptance Criteria**:
  - [ ] pt_sessions, payments 테이블 생성 확인
  - [ ] `SELECT SUM(change_amount) FROM pt_sessions WHERE member_id = $ID` 동작
  - [ ] `INSERT INTO payments (amount) VALUES (0)` → CHECK 위반 에러

  **QA Scenarios**:
  ```
  Scenario: pt_sessions 잔여 횟수 계산
    Tool: Bash (Supabase MCP)
    Steps:
      1. INSERT INTO pt_sessions (trainer_id, member_id, change_amount, reason) VALUES ('<trainer>', '<member>', 10, '등록');
      2. INSERT INTO pt_sessions (trainer_id, member_id, change_amount, reason) VALUES ('<trainer>', '<member>', -3, '사용');
      3. SELECT SUM(change_amount) FROM pt_sessions WHERE member_id = '<member>';
    Expected Result: 7
    Evidence: .sisyphus/evidence/task-3-pt-sessions.txt
  ```

  **Commit**: YES (groups with T2, T4-T10)

- [ ] 4. DB 스키마 — manuals + manual_media 테이블 + RLS

  **What to do**:
  - Supabase MCP로 SQL 실행:
    ```sql
    CREATE TYPE public.manual_category AS ENUM ('재활', '근력', '다이어트', '스포츠퍼포먼스');

    CREATE TABLE IF NOT EXISTS public.manuals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      title text NOT NULL,
      category public.manual_category NOT NULL,
      description text,
      youtube_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_manuals_category ON public.manuals (category);
    ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;

    CREATE TABLE IF NOT EXISTS public.manual_media (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      manual_id uuid NOT NULL REFERENCES public.manuals(id) ON DELETE CASCADE,
      file_url text NOT NULL,
      file_type text NOT NULL,
      file_size bigint,
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE public.manual_media ENABLE ROW LEVEL SECURITY;
    ```
  - manuals RLS: 트레이너 CRUD (본인 것만), 모든 인증 사용자 SELECT
  - manual_media RLS: manuals의 trainer_id를 JOIN으로 확인
  - updated_at trigger 추가 (set_updated_at 함수 재활용)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 15
  - **Blocked By**: None

  **References**:
  - `supabase/schema.sql` — set_updated_at() trigger 함수 (reservations에 사용 중)
  - PRD §14 — 카테고리: 재활, 근력, 다이어트, 스포츠 퍼포먼스
  - 사진 최대 10장, 영상 직접 업로드 + YouTube URL

  **Acceptance Criteria**:
  - [ ] manuals, manual_media 테이블 생성 확인
  - [ ] manual_category enum 생성 확인
  - [ ] 모든 인증 사용자가 SELECT 가능

  **QA Scenarios**:
  ```
  Scenario: 매뉴얼 테이블 + RLS 확인
    Tool: Bash (Supabase MCP)
    Steps:
      1. SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'manuals';
      2. SELECT policyname FROM pg_policies WHERE tablename = 'manuals';
    Expected Result: 컬럼 목록 + SELECT/INSERT/UPDATE/DELETE 정책 존재
    Evidence: .sisyphus/evidence/task-4-manuals-schema.txt
  ```

  **Commit**: YES (groups with T2-T3, T5-T10)

- [ ] 5. DB 스키마 — workout_plans 테이블 + RLS

  **What to do**:
  - Supabase MCP로 SQL 실행:
    ```sql
    CREATE TABLE IF NOT EXISTS public.workout_plans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      date date NOT NULL,
      content text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (trainer_id, member_id, date)
    );
    CREATE INDEX idx_workout_plans_member_date ON public.workout_plans (member_id, date DESC);
    ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
    ```
  - RLS: 트레이너 INSERT/UPDATE/DELETE, 양쪽 SELECT
  - UNIQUE(trainer_id, member_id, date): 하루에 하나의 운동만 (덮어쓰기 = UPSERT)
  - updated_at trigger 추가

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 16
  - **Blocked By**: None

  **References**:
  - PRD §15 — 자유 텍스트 형태, 하루에 하나만, 재작성 시 덮어쓰기

  **Acceptance Criteria**:
  - [ ] workout_plans 테이블 생성 확인
  - [ ] UNIQUE 제약 동작 (같은 날짜 중복 INSERT → 에러)

  **QA Scenarios**:
  ```
  Scenario: workout_plans UNIQUE 제약 확인
    Tool: Bash (Supabase MCP)
    Steps:
      1. INSERT workout_plan for member/date
      2. INSERT duplicate for same member/date
    Expected Result: unique_violation 에러
    Evidence: .sisyphus/evidence/task-5-workout-unique.txt
  ```

  **Commit**: YES (groups with T2-T4, T6-T10)

- [ ] 6. DB 스키마 — notifications 테이블 + RLS

  **What to do**:
  - Supabase MCP로 SQL 실행:
    ```sql
    CREATE TYPE public.notification_type AS ENUM (
      'reservation_requested', 'reservation_approved', 'reservation_rejected', 'reservation_cancelled',
      'new_message', 'workout_assigned',
      'connection_requested', 'connection_approved',
      'pt_count_changed', 'payment_recorded'
    );

    CREATE TABLE IF NOT EXISTS public.notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      type public.notification_type NOT NULL,
      title text NOT NULL,
      body text NOT NULL,
      target_id uuid,
      target_type text,
      is_read boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_notifications_user ON public.notifications (user_id, created_at DESC);
    CREATE INDEX idx_notifications_unread ON public.notifications (user_id) WHERE is_read = false;
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    ```
  - RLS: 본인 SELECT/UPDATE만 (is_read 토글), INSERT는 authenticated 전체 (알림 생성)
  - target_id + target_type: 알림 클릭 시 이동할 대상 (예: reservation_id + 'reservation')
  - 7일 보관: 쿼리 시 `WHERE created_at > now() - interval '7 days'` 필터

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 12
  - **Blocked By**: None

  **References**:
  - 플랜 상단 Notification Triggers 테이블 — 10개 알림 유형 정의

  **Acceptance Criteria**:
  - [ ] notifications 테이블 생성 확인
  - [ ] notification_type enum 생성 확인 (10개 값)

  **QA Scenarios**:
  ```
  Scenario: 알림 생성 + 읽음 처리
    Tool: Bash (Supabase MCP)
    Steps:
      1. INSERT notification for user
      2. UPDATE SET is_read = true WHERE id = <notification_id>
      3. SELECT is_read FROM notifications WHERE id = <notification_id>
    Expected Result: is_read = true
    Evidence: .sisyphus/evidence/task-6-notifications.txt
  ```

  **Commit**: YES (groups with T2-T5, T7-T10)

- [ ] 7. DB 스키마 — trainer_holidays 테이블 + RLS

  **What to do**:
  - Supabase MCP로 SQL 실행:
    ```sql
    CREATE TABLE IF NOT EXISTS public.trainer_holidays (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      date date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (trainer_id, date)
    );
    ALTER TABLE public.trainer_holidays ENABLE ROW LEVEL SECURITY;
    ```
  - RLS: 트레이너 CRUD, 연결된 회원 SELECT

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 17, 20
  - **Blocked By**: None

  **References**:
  - PRD §8 — 캘린더에서 특정 날짜 선택 → 휴무 설정/해제
  - `supabase/schema.sql` — work_schedules RLS 패턴 (트레이너 CRUD + 연결 회원 SELECT)

  **Acceptance Criteria**:
  - [ ] trainer_holidays 테이블 생성 확인
  - [ ] UNIQUE(trainer_id, date) 동작

  **QA Scenarios**:
  ```
  Scenario: 휴무일 설정 + 중복 방지
    Tool: Bash (Supabase MCP)
    Steps:
      1. INSERT holiday for trainer/date
      2. INSERT duplicate → unique_violation
    Expected Result: 두번째 INSERT 에러
    Evidence: .sisyphus/evidence/task-7-holidays.txt
  ```

  **Commit**: YES (groups with T2-T6, T8-T10)

- [ ] 8. DB 변경 — connection_status enum 'pending' 추가 + memos 회원 읽기 RLS

  **What to do**:
  - Supabase MCP로 SQL 실행:
    ```sql
    -- connection_status에 'pending' 추가
    ALTER TYPE public.connection_status ADD VALUE IF NOT EXISTS 'pending';

    -- memos 테이블에 회원 읽기 RLS 추가
    CREATE POLICY "Memos are readable by member"
      ON public.memos FOR SELECT TO authenticated
      USING (auth.uid() = member_id);
    ```
  - 기존 invite_codes 기반 연결 (connect_via_invite)은 여전히 status='active'로 즉시 연결
  - 검색 기반 연결 요청만 status='pending'으로 생성 → 트레이너 승인 시 'active'로 변경

  **Must NOT do**:
  - 기존 connect_via_invite RPC 수정하지 않기 (초대 코드는 즉시 연결 유지)
  - 기존 trainer_members RLS 변경하지 않기

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 19, 33
  - **Blocked By**: None

  **References**:
  - `supabase/schema.sql` — connection_status enum: 현재 'active', 'disconnected'만 존재
  - `supabase/schema.sql:387-414` — memos RLS: 현재 trainer 전용 SELECT만 있음
  - PRD §5 — 검색 연결은 트레이너 승인 필요, 초대 코드는 즉시 연결
  - PRD §16 — 회원은 본인 메모 읽기만 가능

  **Acceptance Criteria**:
  - [ ] `SELECT enum_range(NULL::connection_status)` → 'active', 'disconnected', 'pending' 포함
  - [ ] 회원 계정으로 본인 member_id의 memos SELECT 가능

  **QA Scenarios**:
  ```
  Scenario: pending 상태 연결 요청
    Tool: Bash (Supabase MCP)
    Steps:
      1. INSERT INTO trainer_members (trainer_id, member_id, status) VALUES (..., 'pending');
    Expected Result: 에러 없이 INSERT 성공
    Evidence: .sisyphus/evidence/task-8-pending-status.txt
  ```

  **Commit**: YES (groups with T2-T7, T9-T10)

- [ ] 9. Storage 버킷 — chat-files + manual-media 생성

  **What to do**:
  - Supabase MCP로 SQL 실행:
    ```sql
    -- 채팅 파일 버킷
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('chat-files', 'chat-files', false)
    ON CONFLICT (id) DO NOTHING;

    -- 매뉴얼 미디어 버킷
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('manual-media', 'manual-media', true)
    ON CONFLICT (id) DO NOTHING;
    ```
  - chat-files: private (인증 사용자만 접근), 이미지 10MB / 파일 50MB 제한은 클라이언트 검증
  - manual-media: public 읽기, 인증 사용자 업로드, 사진 + 영상 500MB
  - Storage RLS 정책: avatars 버킷 패턴 따름

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 11, 15
  - **Blocked By**: None

  **References**:
  - `supabase/schema.sql` — avatars 버킷 생성 + Storage 정책 패턴

  **Acceptance Criteria**:
  - [ ] `SELECT id FROM storage.buckets WHERE id IN ('chat-files', 'manual-media')` → 2행 반환

  **QA Scenarios**:
  ```
  Scenario: 버킷 생성 확인
    Tool: Bash (Supabase MCP)
    Steps:
      1. SELECT id, public FROM storage.buckets WHERE id IN ('chat-files', 'manual-media');
    Expected Result: chat-files (public=false), manual-media (public=true)
    Evidence: .sisyphus/evidence/task-9-storage-buckets.txt
  ```

  **Commit**: YES (groups with T2-T8, T10)

- [ ] 10. DB 변경 — create_reservation RPC PT횟수 검증 + PT 자동 차감 trigger

  **What to do**:
  - create_reservation RPC 수정: 예약 생성 전 PT 잔여 횟수 확인
    ```sql
    -- create_reservation 함수 안에 추가
    SELECT COALESCE(SUM(change_amount), 0) INTO v_remaining
    FROM public.pt_sessions
    WHERE member_id = v_member_id AND trainer_id = p_trainer_id;

    IF v_remaining <= 0 THEN
      RAISE EXCEPTION 'PT 잔여 횟수가 부족합니다. 예약이 불가능합니다.';
    END IF;
    ```
  - PT 자동 차감 trigger: 예약 상태 'completed'로 변경 시 자동 -1
    ```sql
    CREATE OR REPLACE FUNCTION public.auto_deduct_pt_session()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        INSERT INTO public.pt_sessions (trainer_id, member_id, change_amount, reason)
        VALUES (NEW.trainer_id, NEW.member_id, -1, '수업 완료 자동 차감');
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE TRIGGER trg_auto_deduct_pt
    AFTER UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_deduct_pt_session();
    ```

  **Must NOT do**:
  - create_reservation의 기존 로직 변경하지 않기 (PT 횟수 검증만 추가)
  - pt_sessions 없는 회원은 잔여 0으로 간주 (COALESCE)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 14, 20
  - **Blocked By**: None (pt_sessions 테이블은 Task 3에서 생성되지만, Wave 내 순차 실행)

  **References**:
  - `supabase/schema.sql` — create_reservation RPC 전체 코드
  - `supabase/schema.sql` — set_updated_at trigger 패턴

  **Acceptance Criteria**:
  - [ ] PT 잔여 0일 때 create_reservation → "PT 잔여 횟수가 부족합니다" 에러
  - [ ] 예약 status 'completed' 변경 시 pt_sessions에 -1 자동 INSERT

  **QA Scenarios**:
  ```
  Scenario: PT 횟수 0 예약 차단
    Tool: Bash (Supabase MCP)
    Steps:
      1. 회원의 pt_sessions 합계가 0인 상태 확인
      2. create_reservation RPC 호출
    Expected Result: "PT 잔여 횟수가 부족합니다" 에러
    Evidence: .sisyphus/evidence/task-10-pt-block.txt

  Scenario: 자동 차감 trigger
    Tool: Bash (Supabase MCP)
    Steps:
      1. pt_sessions에 10회 추가
      2. reservation status를 'completed'로 UPDATE
      3. SELECT SUM(change_amount) FROM pt_sessions
    Expected Result: 9 (10 - 1)
    Evidence: .sisyphus/evidence/task-10-auto-deduct.txt
  ```

  **Commit**: YES (groups with T2-T9)

- [ ] 11. useChat composable — 실시간 채팅

  **What to do**:
  - `src/composables/useChat.js` 생성:
    - `fetchConversations()` — 대화 목록 (최근 메시지 + 안읽은 수)
    - `fetchMessages(partnerId)` — 특정 상대와의 메시지 목록 (cursor 기반 페이지네이션)
    - `sendMessage(receiverId, content, file?)` — 메시지 전송 (텍스트 또는 파일)
    - `markAsRead(partnerId)` — 상대 메시지 읽음 처리
    - `subscribeToMessages(partnerId)` — Supabase Realtime 구독 (INSERT 이벤트)
    - `unsubscribe()` — Realtime 구독 해제
    - `uploadChatFile(file)` — chat-files 버킷에 파일 업로드 (크기 검증 포함)
    - `getUnreadCount()` — 전체 미읽은 메시지 수 (배지용)
  - 파일 크기 검증: 이미지 10MB, 기타 50MB (클라이언트 사이드)
  - 대화 목록: GROUP BY sender/receiver, ORDER BY 최근 메시지
  - Realtime 구독: 채팅방 마운트 시 활성, 언마운트 시 해제

  **Must NOT do**:
  - 타이핑 인디케이터 구현하지 않기
  - 온라인/오프라인 상태 구현하지 않기
  - 메시지 삭제/수정 기능 구현하지 않기
  - 전역 Realtime 구독하지 않기 (채팅방 뷰에서만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 12-20)
  - **Blocks**: Tasks 21, 34
  - **Blocked By**: Tasks 2, 9

  **References**:
  - `src/composables/useReservations.js` — composable 패턴 (loading/error/try-catch-finally)
  - `src/lib/supabase.js` — Supabase 클라이언트 (Realtime 채널 생성)
  - messages 테이블 스키마 (Task 2)

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] useChat.js에 fetchConversations, fetchMessages, sendMessage, subscribeToMessages export 존재

  **QA Scenarios**:
  ```
  Scenario: 메시지 전송 + 실시간 수신
    Tool: Playwright (2 tabs)
    Steps:
      1. Tab 1: 트레이너 로그인 → 채팅 페이지
      2. Tab 2: 회원 로그인 → 채팅 페이지
      3. Tab 1: 메시지 "안녕하세요" 전송
      4. Tab 2: 2초 이내 메시지 수신 확인
    Expected Result: Tab 2에서 실시간 메시지 표시
    Evidence: .sisyphus/evidence/task-11-realtime-chat.png
  ```

  **Commit**: YES (groups with T12-T20)

- [ ] 12. useNotifications composable

  **What to do**:
  - `src/composables/useNotifications.js` 생성:
    - `fetchNotifications()` — 알림 목록 (7일 이내, 최신순)
    - `getUnreadCount()` — 미읽은 알림 수 (배지용)
    - `markAsRead(notificationId)` — 개별 읽음 처리
    - `markAllAsRead()` — 전체 읽음 처리
    - `createNotification(userId, type, title, body, targetId?, targetType?)` — 알림 생성 유틸
  - 7일 필터: `WHERE created_at > now() - interval '7 days'`
  - createNotification은 다른 composable에서 호출하는 유틸 함수

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 27, 32
  - **Blocked By**: Task 6

  **References**:
  - `src/composables/useMemos.js` — CRUD composable 패턴
  - notifications 테이블 스키마 (Task 6)
  - Notification Triggers 테이블 (플랜 상단)

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] useNotifications.js에 모든 함수 export 존재

  **Commit**: YES (groups with T11, T13-T20)

- [ ] 13. usePayments composable

  **What to do**:
  - `src/composables/usePayments.js` 생성:
    - `fetchPayments(memberId)` — 수납 목록 (최신순)
    - `createPayment(memberId, amount, paymentDate, memo?)` — 수납 기록 생성
    - `deletePayment(paymentId)` — 수납 기록 삭제
    - `getTotalAmount(memberId)` — 누적 합계 (computed)
  - 금액 > 0 검증 (클라이언트 + DB CHECK)
  - 알림 연동: createPayment 성공 시 useNotifications.createNotification 호출

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 26, 36
  - **Blocked By**: Task 3

  **References**:
  - `src/composables/useMemos.js` — CRUD composable 패턴
  - payments 테이블 스키마 (Task 3)

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] amount ≤ 0 전송 시 에러 반환

  **Commit**: YES (groups with T11-T12, T14-T20)

- [ ] 14. usePtSessions composable

  **What to do**:
  - `src/composables/usePtSessions.js` 생성:
    - `fetchPtHistory(memberId)` — PT 횟수 변동 이력 (최신순)
    - `getRemainingCount(memberId)` — 잔여 횟수 (SUM)
    - `addSessions(memberId, amount, reason)` — 횟수 추가 (양수)
    - `deductSessions(memberId, amount, reason)` — 횟수 차감 (음수)
  - 차감 검증: 현재 잔여 < 차감량이면 에러 ("남은 횟수보다 많이 차감할 수 없습니다")
  - 알림 연동: 변경 시 useNotifications.createNotification 호출

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 25, 34, 35, 36
  - **Blocked By**: Tasks 3, 10

  **References**:
  - pt_sessions 테이블 스키마 (Task 3)
  - PRD §12 — 과다 차감 방지, 이력 관리

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 잔여 3회, 5회 차감 시도 → 에러

  **Commit**: YES (groups with T11-T13, T15-T20)

- [ ] 15. useManuals composable + 미디어 업로드

  **What to do**:
  - `src/composables/useManuals.js` 생성:
    - `fetchManuals(category?)` — 매뉴얼 목록 (카테고리 필터)
    - `fetchManual(manualId)` — 매뉴얼 상세 (media JOIN)
    - `searchManuals(query)` — 이름 검색 (ilike)
    - `createManual(title, category, description, youtubeUrl?, mediaFiles?)` — 매뉴얼 생성 + 미디어 업로드
    - `updateManual(manualId, ...)` — 매뉴얼 수정
    - `deleteManual(manualId)` — 매뉴얼 삭제 (CASCADE로 media도 삭제)
    - `uploadManualMedia(file)` — manual-media 버킷에 파일 업로드
  - 사진 최대 10장 검증 (클라이언트)
  - 영상 500MB 검증 (클라이언트)
  - YouTube URL 형식 검증 (정규식)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 22, 23
  - **Blocked By**: Tasks 4, 9

  **References**:
  - `src/composables/useProfile.js` — uploadAvatar 패턴 (Supabase Storage 업로드)
  - manuals + manual_media 테이블 스키마 (Task 4)

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 10장 초과 사진 업로드 시 에러

  **Commit**: YES (groups with T11-T14, T16-T20)

- [ ] 16. useWorkoutPlans composable

  **What to do**:
  - `src/composables/useWorkoutPlans.js` 생성:
    - `fetchWorkoutPlan(memberId, date)` — 특정 날짜 운동 조회
    - `fetchWorkoutPlans(memberId)` — 전체 운동 이력 (최신순)
    - `saveWorkoutPlan(memberId, date, content)` — 생성/수정 (UPSERT)
    - `deleteWorkoutPlan(planId)` — 삭제
  - UPSERT: `ON CONFLICT (trainer_id, member_id, date) DO UPDATE`
  - 알림 연동: 생성 시 회원에게 알림

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 24, 35, 36
  - **Blocked By**: Task 5

  **References**:
  - workout_plans 테이블 스키마 (Task 5)
  - PRD §15 — UPSERT 패턴, 날짜별 하나

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 같은 날짜 재저장 시 덮어쓰기 동작

  **Commit**: YES (groups with T11-T15, T17-T20)

- [ ] 17. useHolidays composable

  **What to do**:
  - `src/composables/useHolidays.js` 생성:
    - `fetchHolidays(trainerId, month?)` — 휴무일 목록
    - `setHoliday(date)` — 휴무 설정
    - `removeHoliday(date)` — 휴무 해제
    - `isHoliday(date)` — 특정 날짜 휴무 여부

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 28
  - **Blocked By**: Task 7

  **References**:
  - trainer_holidays 테이블 스키마 (Task 7)
  - `src/composables/useWorkHours.js` — 근무시간 composable 패턴

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0

  **Commit**: YES (groups with T11-T16, T18-T20)

- [ ] 18. useProfile 확장 — 프로필 수정 기능

  **What to do**:
  - `src/composables/useProfile.js`에 함수 추가:
    - `updateTrainerProfile(name, specialties, bio?)` — 트레이너 프로필 수정
    - `updateMemberProfile(name, age?, height?, weight?, goals?, notes?)` — 회원 프로필 수정
  - 이름 빈값 검증: "이름을 입력해주세요" 에러
  - 성공 후 auth.fetchProfile() 호출하여 스토어 동기화

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 29
  - **Blocked By**: None

  **References**:
  - `src/composables/useProfile.js` — 기존 saveTrainerProfile 패턴
  - PRD §3 — 프로필 수정 화면 필드 목록

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 빈 이름으로 수정 시 에러

  **Commit**: YES (groups with T11-T17, T19-T20)

- [ ] 19. useTrainerSearch 확장 — 승인 플로우

  **What to do**:
  - `src/composables/useTrainerSearch.js` 수정:
    - `requestConnection(trainerId)` — status='pending'으로 INSERT (기존은 'active')
    - `fetchPendingRequests()` — 트레이너가 받은 대기 중 연결 요청 목록
    - `approveConnection(connectionId)` — status='pending' → 'active' UPDATE
    - `rejectConnection(connectionId)` — status='pending' → 'disconnected' UPDATE
  - 알림 연동: 요청 시 트레이너에게, 승인 시 회원에게 알림
  - 기존 초대 코드 연결 (connect_via_invite)은 변경 없음

  **Must NOT do**:
  - connect_via_invite RPC 수정하지 않기

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 31
  - **Blocked By**: Task 8

  **References**:
  - `src/composables/useTrainerSearch.js` — 기존 requestConnection 함수
  - trainer_members 테이블 + connection_status enum (Task 8)

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 검색 연결 시 status='pending' 확인
  - [ ] 초대 코드 연결은 여전히 status='active'

  **Commit**: YES (groups with T11-T18, T20)

- [ ] 20. useReservations 확장 — 휴무일 + PT횟수 검증

  **What to do**:
  - `src/composables/useReservations.js` 수정:
    - `fetchAvailableSlots(trainerId, date)` — 휴무일이면 빈 배열 반환
    - 예약 생성 전 PT 잔여 횟수 확인 (클라이언트 사이드 검증도 추가)
    - 휴무일 체크: `useHolidays.isHoliday(date)` 호출 또는 직접 쿼리
  - 서버 사이드(RPC)에서도 검증하지만, UX를 위해 클라이언트에서도 사전 검증

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 40
  - **Blocked By**: Tasks 7, 10

  **References**:
  - `src/composables/useReservations.js:65-163` — fetchAvailableSlots 기존 로직
  - trainer_holidays 테이블 (Task 7)
  - create_reservation RPC PT 검증 (Task 10)

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 휴무일에 슬롯 조회 → 빈 배열

  **Commit**: YES (groups with T11-T19)

- [ ] 21. 1:1 채팅 뷰 — TrainerChatView + MemberChatView

  **What to do**:
  - `src/views/trainer/TrainerChatView.vue` 교체 (현재 스텁):
    - 대화 목록 화면: 상대 프로필, 최근 메시지, 시간, 안읽은 배지
    - 채팅방 진입 시 메시지 목록 + 입력창 + 전송 버튼
    - Supabase Realtime 구독 (마운트 시 구독, 언마운트 시 해제)
    - 파일 첨부: [+] 버튼 → 사진/파일 선택 → 업로드 → 전송
    - 읽음 처리: 채팅방 진입 시 markAsRead 호출
    - 내 메시지 오른쪽(파랑), 상대 왼쪽(회색) 버블 레이아웃
  - `src/views/member/MemberChatView.vue` 교체: 동일 구조 (역할만 다름)
  - 각각 companion CSS 파일 생성
  - 채팅방은 별도 라우트가 아닌, 목록 뷰 안에서 조건부 렌더링 또는 새 라우트 추가

  **Must NOT do**:
  - 타이핑 인디케이터, 온라인 상태, 메시지 검색
  - 커스텀 이모지 키보드
  - 메시지 삭제/수정

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 22-28)
  - **Blocks**: Task 40
  - **Blocked By**: Task 11

  **References**:
  - `src/views/trainer/TrainerChatView.vue` — 현재 스텁 (23줄, 완전 교체)
  - `src/views/member/MemberChatView.vue` — 현재 스텁 (23줄, 완전 교체)
  - PRD §11 — 채팅 UI 상세 (대화 목록, 채팅방, 파일 첨부)
  - `src/assets/css/global.css` — 디자인 토큰

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 트레이너/회원 채팅 뷰에서 메시지 목록 로드
  - [ ] Realtime 구독으로 새 메시지 실시간 표시

  **QA Scenarios**:
  ```
  Scenario: 채팅 메시지 전송 + 실시간 수신
    Tool: Playwright
    Preconditions: 트레이너-회원 연결 상태
    Steps:
      1. 트레이너: /trainer/chat 접속
      2. 회원 대화 선택 또는 자동 표시
      3. 입력창에 "안녕하세요" 입력 후 전송
      4. 회원 측에서 메시지 수신 확인
    Expected Result: 메시지가 DB에 저장 + 상대방에게 실시간 표시
    Evidence: .sisyphus/evidence/task-21-chat-send.png

  Scenario: 파일 전송
    Tool: Playwright
    Steps:
      1. [+] 버튼 클릭
      2. 이미지 파일 선택 (< 10MB)
      3. 전송 확인
    Expected Result: 이미지 썸네일 표시 + chat-files 버킷에 업로드
    Evidence: .sisyphus/evidence/task-21-chat-file.png
  ```

  **Commit**: YES (groups with T22-T28)

- [ ] 22. 운동 매뉴얼 뷰 (트레이너) — TrainerManualView + ManualRegisterView

  **What to do**:
  - `src/views/trainer/TrainerManualView.vue` 교체 (현재 스텁):
    - 매뉴얼 목록: 검색바 + 카테고리 탭 (전체/재활/근력/다이어트/스포츠퍼포먼스)
    - 매뉴얼 카드: 썸네일, 운동명, 카테고리 태그, 작성자
    - FAB [+ 매뉴얼 추가] 버튼 → ManualRegisterView로 이동
  - `src/views/trainer/ManualRegisterView.vue` 수정 (현재 부분 구현):
    - 기존 폼 UI 유지 (카테고리 선택, 제목, 설명, 미디어, YouTube)
    - useManuals.createManual() 연결
    - 파일 업로드 → manual-media 버킷
    - 사진 10장 제한 검증
    - 영상 500MB 제한 검증
    - 저장 후 목록으로 이동
  - 수정/삭제: 본인 매뉴얼에만 버튼 노출

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 40
  - **Blocked By**: Task 15

  **References**:
  - `src/views/trainer/TrainerManualView.vue` — 현재 스텁 (23줄)
  - `src/views/trainer/ManualRegisterView.vue` — 부분 구현 (217줄, 폼 UI + 파일 핸들링 보존)
  - PRD §14 — 매뉴얼 목록/등록/수정/삭제 화면 상세

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 매뉴얼 등록 → DB 저장 → 목록에 표시
  - [ ] 사진 11장 업로드 시도 → 에러 메시지

  **QA Scenarios**:
  ```
  Scenario: 매뉴얼 등록
    Tool: Playwright
    Preconditions: 트레이너 로그인
    Steps:
      1. goto /trainer/settings/manual
      2. FAB 클릭 → 등록 페이지
      3. 카테고리 "근력" 선택, 제목 "벤치프레스", 설명 입력
      4. 사진 1장 업로드
      5. YouTube URL 입력
      6. "저장" 클릭
    Expected Result: 목록에 새 매뉴얼 표시
    Evidence: .sisyphus/evidence/task-22-manual-create.png
  ```

  **Commit**: YES (groups with T21, T23-T28)

- [ ] 23. 운동 매뉴얼 뷰 (회원) — MemberManualView + ManualDetailView

  **What to do**:
  - `src/views/member/MemberManualView.vue` 교체 (현재 스텁):
    - 매뉴얼 목록: 검색바 + 카테고리 탭 (읽기 전용, FAB 없음)
    - 카드 클릭 → ManualDetailView로 이동
  - `src/views/member/ManualDetailView.vue` 수정 (현재 8개 mock 데이터):
    - mock 데이터 배열 제거
    - useManuals.fetchManual(manualId) 연결
    - 기존 UI 구조 유지 (hero, meta, description, gallery, youtube)
    - 영상: YouTube는 iframe, 직접 업로드는 HTML5 video 태그
    - 수정/삭제 버튼 없음 (회원)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 40
  - **Blocked By**: Task 15

  **References**:
  - `src/views/member/MemberManualView.vue` — 현재 스텁 (23줄)
  - `src/views/member/ManualDetailView.vue` — 부분 구현 (227줄, UI 보존 + mock 제거)
  - PRD §14 — 매뉴얼 열람 화면

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] mock 데이터 0개 (하드코딩 배열 제거)
  - [ ] YouTube iframe + HTML5 video 재생

  **Commit**: YES (groups with T21-T22, T24-T28)

- [ ] 24. 오늘의 운동 뷰 — TodayWorkoutView

  **What to do**:
  - `src/views/trainer/TodayWorkoutView.vue` 교체 (현재 스텁):
    - 회원 선택 → 날짜 선택 (기본 오늘) → 텍스트 입력 → 저장
    - 기존 배정 이력 리스트 (날짜별 미리보기)
    - UPSERT: 같은 날짜 재저장 시 "기존 내용을 덮어쓰시겠습니까?" 확인
    - useWorkoutPlans composable 연결
  - 회원 선택: useMembers.fetchMembers()로 연결된 회원 목록 표시
  - 라우트: `/trainer/schedule/workout` 또는 `/trainer/members/:id/workout`

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 40
  - **Blocked By**: Task 16

  **References**:
  - `src/views/trainer/TodayWorkoutView.vue` — 현재 스텁 (23줄)
  - PRD §15 — 운동 배정 화면 (회원 선택, 날짜, 텍스트 입력)
  - `src/composables/useMembers.js` — fetchMembers 패턴

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 운동 배정 → DB 저장 → 이력에 표시
  - [ ] 같은 날짜 재저장 → 확인 팝업 → 덮어쓰기

  **Commit**: YES (groups with T21-T23, T25-T28)

- [ ] 25. PT 횟수 관리 뷰 — PtCountManageView (신규)

  **What to do**:
  - `src/views/trainer/PtCountManageView.vue` 신규 생성:
    - 상단: 총 등록 횟수 + 잔여 횟수 (큰 숫자)
    - [+ 횟수 추가] 버튼 → 바텀시트 (숫자 입력 + 메모)
    - [- 횟수 차감] 버튼 → 바텀시트 (숫자 입력 + 메모)
    - 하단: 날짜별 변동 이력 리스트
    - usePtSessions composable 연결
  - 라우트 추가: `/trainer/members/:id/pt-count` → router/index.js
  - TrainerMemberDetailView에서 진입 링크 추가
  - 과다 차감 방지: 잔여 < 차감량 시 입력 차단 + 에러

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 40
  - **Blocked By**: Task 14

  **References**:
  - PRD §12 — PT 횟수 관리 화면 상세
  - `src/components/AppBottomSheet.vue` — 바텀시트 컴포넌트

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 10회 추가 → 잔여 10 표시
  - [ ] 15회 차감 시도 → 에러 메시지

  **QA Scenarios**:
  ```
  Scenario: PT 횟수 추가/차감
    Tool: Playwright
    Preconditions: 트레이너 로그인, 회원 연결
    Steps:
      1. goto /trainer/members/:id/pt-count
      2. [+ 횟수 추가] 클릭 → 10 입력 → 저장
      3. 잔여 횟수 "10" 확인
      4. [- 횟수 차감] 클릭 → 3 입력 → 저장
      5. 잔여 횟수 "7" 확인
      6. [- 횟수 차감] 클릭 → 10 입력 → 저장
    Expected Result: Step 6에서 "남은 횟수보다 많이 차감할 수 없습니다" 에러
    Evidence: .sisyphus/evidence/task-25-pt-count.png
  ```

  **Commit**: YES (groups with T21-T24, T26-T28)

- [ ] 26. 수납 기록 뷰 — MemberPaymentView + PaymentWriteView

  **What to do**:
  - `src/views/trainer/MemberPaymentView.vue` 교체 (현재 스텁):
    - 상단: 누적 수납 합계
    - 리스트: 결제 날짜, 금액, 메모 (최신순)
    - 삭제 가능 (스와이프 또는 버튼)
    - FAB [+] → PaymentWriteView로 이동
  - `src/views/trainer/PaymentWriteView.vue` 교체 (현재 스텁):
    - 금액 입력 (숫자)
    - 날짜 선택 (AppCalendar)
    - 메모 입력 (선택)
    - [저장] 버튼
    - 0원 이하 검증
  - 회원용 수납 조회: MemberSettingsView에 읽기 전용 리스트 또는 별도 뷰
  - usePayments composable 연결

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 40
  - **Blocked By**: Task 13

  **References**:
  - `src/views/trainer/MemberPaymentView.vue` — 현재 스텁 (24줄)
  - `src/views/trainer/PaymentWriteView.vue` — 현재 스텁 (24줄)
  - PRD §13 — 수납 기록 화면 상세
  - `src/components/AppCalendar.vue` — 날짜 선택 컴포넌트

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 수납 등록 → 목록에 표시 → 합계 갱신
  - [ ] 0원 입력 → 저장 차단

  **Commit**: YES (groups with T21-T25, T27-T28)

- [ ] 27. 알림 목록 뷰 — NotificationListView + 라우트 추가

  **What to do**:
  - `src/views/common/NotificationListView.vue` 신규 생성:
    - 상단: "알림" 타이틀 + [전체 읽음 처리] 버튼
    - 리스트: 알림 아이콘 + 내용 + 시간 + 읽음/안읽음 색상
    - 알림 클릭 → target_type에 따라 해당 화면으로 이동
    - 빈 상태: "새로운 알림이 없습니다" + 일러스트
    - 7일 이내 알림만 표시
    - useNotifications composable 연결
  - 라우트 추가: `/notifications` → router/index.js
  - 대상 화면 이동: target_type → 라우트 매핑
    - 'reservation' → `/trainer/reservations` 또는 `/member/schedule`
    - 'message' → `/trainer/chat` 또는 `/member/chat`
    - 'workout' → `/member/workout` (회원) 또는 관련 페이지
    - 'connection' → `/trainer/members` (트레이너)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 40
  - **Blocked By**: Task 12

  **References**:
  - PRD §4 — 알림 센터 화면 상세

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 알림 목록 로드 (7일 이내)
  - [ ] 전체 읽음 처리 동작
  - [ ] 알림 클릭 → 대상 화면 이동

  **Commit**: YES (groups with T21-T26, T28)

- [ ] 28. 휴무일 설정 — TrainerScheduleView 확장

  **What to do**:
  - `src/views/trainer/TrainerScheduleView.vue` 수정:
    - 캘린더에 휴무일 표시 (별도 색상 — 예: 회색 배경)
    - 날짜 선택 시 하단에 [휴무 설정] 또는 [휴무 해제] 토글 표시
    - useHolidays composable 연결
    - 휴무일의 dot과 일반 예약 dot 구분
  - 기존 캘린더 + 예약 목록 로직 유지

  **Must NOT do**:
  - AppCalendar 컴포넌트 수정하지 않기 (뷰 레벨에서 처리)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 40
  - **Blocked By**: Task 17

  **References**:
  - `src/views/trainer/TrainerScheduleView.vue` — 기존 캘린더 + 예약 뷰
  - PRD §8 — 휴무일 설정 화면

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 휴무 설정 → 캘린더에 표시 → 해당일 슬롯 비활성

  **Commit**: YES (groups with T21-T27)

---

### Wave 4 — 프로필/계정/내비게이션 (T29-T33, depends: Wave 2-3)

- [ ] 29. 프로필 수정 — 트레이너/회원 프로필 편집 뷰

  **What to do**:
  - 트레이너 프로필 편집 뷰 생성: `src/views/trainer/TrainerProfileEditView.vue` + `.css`
    - 기존 프로필 데이터 로드 (useProfile 활용)
    - 이름, 전화번호, 전문분야(specialties), 소개글(bio) 편집
    - 프로필 사진 변경 (avatars 버킷 업로드)
    - 저장 버튼 → Supabase UPDATE → 성공 시 뒤로가기
  - 회원 프로필 편집 뷰 생성: `src/views/member/MemberProfileEditView.vue` + `.css`
    - 이름, 전화번호, 나이, 키, 몸무게, 목표(goals) 편집
    - 프로필 사진 변경
    - 저장 → UPDATE → 뒤로가기
  - useProfile composable 확장: `updateTrainerProfile()`, `updateMemberProfile()` 함수 추가
  - 라우터에 두 경로 추가 (`meta: { hideNav: true }`)
  - SettingsView / MemberSettingsView에서 프로필 편집 버튼 → 해당 뷰로 이동 연결

  **Must NOT do**:
  - 프로필 완성도 % 표시 금지
  - 새 npm 패키지 추가 금지 (이미지 크롭 등)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 프로필 편집은 폼 UI가 핵심 — 입력 필드 레이아웃, 이미지 업로드 UX
  - **Skills**: [`playwright`]
    - `playwright`: QA 시나리오에서 폼 작성 + 저장 검증 필요
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 기존 온보딩 뷰 패턴 복제이므로 별도 디자인 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 30, 31, 32, 33)
  - **Blocks**: T36 (Dashboard 통합)
  - **Blocked By**: T11 (useProfile 확장), T14 (useProfile composable)

  **References**:

  **Pattern References**:
  - `src/views/onboarding/TrainerProfileView.vue` — 트레이너 프로필 생성 폼 패턴 (동일 필드, 편집 모드로 재활용)
  - `src/views/onboarding/MemberProfileView.vue` — 회원 프로필 생성 폼 패턴
  - `src/composables/useProfile.js` — 프로필 이미지 업로드 + saveRole 패턴

  **API/Type References**:
  - `supabase/schema.sql` — profiles, trainer_profiles, member_profiles 테이블 구조
  - `src/stores/auth.js` — profile ref 구조 (편집 후 스토어 갱신 필요)

  **External References**:
  - Supabase Storage docs: 파일 업로드 upsert 패턴

  **WHY Each Reference Matters**:
  - 온보딩 뷰: 동일 필드를 사용하므로 폼 구조 + 유효성 검증 로직을 복제/확장
  - auth store: 프로필 저장 후 `fetchProfile()` 재호출하여 전역 상태 갱신 필수

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 트레이너 프로필 편집 → 저장 → SettingsView 돌아옴 → 변경사항 반영
  - [ ] 회원 프로필 편집 → 저장 → MemberSettingsView 돌아옴 → 변경사항 반영

  **QA Scenarios**:

  ```
  Scenario: 트레이너 프로필 편집 및 저장
    Tool: Playwright
    Preconditions: 트레이너 계정 로그인, 프로필 존재
    Steps:
      1. /trainer/settings로 이동
      2. 프로필 편집 버튼 클릭 → /trainer/profile-edit 이동
      3. `.profile-edit__name input` 필드 값을 "테스트트레이너수정"으로 변경
      4. `.profile-edit__bio textarea`에 "수정된 소개글입니다" 입력
      5. 저장 버튼 `.profile-edit__submit` 클릭
      6. /trainer/settings로 리다이렉트 확인
      7. 화면에 "테스트트레이너수정" 텍스트 존재 확인
    Expected Result: 프로필 수정 후 설정 페이지에서 변경된 이름 표시
    Failure Indicators: 저장 후 리다이렉트 안됨, 이전 이름 그대로 표시
    Evidence: .sisyphus/evidence/task-29-trainer-profile-edit.png

  Scenario: 필수 필드 미입력 시 저장 차단
    Tool: Playwright
    Preconditions: 트레이너 프로필 편집 화면
    Steps:
      1. `.profile-edit__name input` 값을 빈 문자열로 변경
      2. 저장 버튼 클릭
      3. 폼이 제출되지 않고 에러 표시 확인
    Expected Result: 이름 필드 비어있으면 저장 불가, 인라인 에러 메시지 표시
    Failure Indicators: 빈 이름으로 저장 성공
    Evidence: .sisyphus/evidence/task-29-profile-edit-validation-error.png
  ```

  **Commit**: YES (groups with T30-T33)
  - Message: `feat(profile): 트레이너/회원 프로필 편집 기능`
  - Files: `src/views/trainer/TrainerProfileEditView.vue`, `src/views/member/MemberProfileEditView.vue`, `src/composables/useProfile.js`, `src/router/index.js`

- [ ] 30. 계정 관리 — 회원 연결 해제 + 계정 삭제(소프트)

  **What to do**:
  - SettingsView + MemberSettingsView에 "연결 해제" / "계정 삭제" 섹션 추가
  - 회원 연결 해제: trainer_members.status → 'disconnected' UPDATE
    - 확인 모달(AppBottomSheet) → "정말 해제하시겠습니까?" → 확인 시 실행
    - 해제 후 /home으로 리다이렉트, 트레이너 연결 없는 상태 표시
  - 트레이너→회원 연결 해제: TrainerMemberDetailView에 "연결 해제" 버튼 추가
    - 확인 모달 → trainer_members.status = 'disconnected'
    - 해제 후 회원 목록에서 제거
  - 계정 삭제 (소프트 삭제):
    - 확인 모달 → 2차 확인 ("탈퇴" 텍스트 직접 입력)
    - profiles 테이블: name → '탈퇴한 사용자', phone → null, photo_url → null
    - supabase.auth.signOut() → /login 리다이렉트
    - DB 데이터(예약, 메모 등)는 보존 (CASCADE 삭제 아님)
  - useProfile composable에 `disconnectMember()`, `softDeleteAccount()` 추가

  **Must NOT do**:
  - 하드 삭제 (auth.users 삭제) 금지 — 소프트 삭제만
  - 관련 데이터(예약/메모/수납) 삭제 금지 — 프로필만 익명화

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 계정 삭제 로직은 데이터 무결성 + 보안 고려 필요, RLS 정책 영향 분석
  - **Skills**: [`playwright`]
    - `playwright`: 삭제 플로우 QA (모달 확인, 리다이렉트)
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: UI는 기존 모달 패턴 재활용

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 29, 31, 32, 33)
  - **Blocks**: T36 (Dashboard 통합)
  - **Blocked By**: T11 (useProfile), T13 (useMembers 확장)

  **References**:

  **Pattern References**:
  - `src/components/AppBottomSheet.vue` — 확인 모달 패턴
  - `src/views/trainer/TrainerMemberDetailView.vue` — 회원 상세 뷰 (연결 해제 버튼 추가 위치)
  - `src/views/trainer/SettingsView.vue` — 트레이너 설정 (계정 삭제 섹션 추가 위치)
  - `src/views/member/MemberSettingsView.vue` — 회원 설정 (연결 해제 + 계정 삭제 추가 위치)

  **API/Type References**:
  - `supabase/schema.sql` — trainer_members 테이블, connection_status enum, profiles 테이블

  **WHY Each Reference Matters**:
  - AppBottomSheet: 삭제/해제 확인 UI의 기본 패턴
  - trainer_members: status 필드를 'disconnected'로 변경하는 UPDATE 쿼리 필요

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 회원이 연결 해제 → trainer_members.status = 'disconnected'
  - [ ] 트레이너가 회원 연결 해제 → 동일 결과
  - [ ] 계정 삭제 → profiles 익명화 + 로그아웃 + /login 리다이렉트

  **QA Scenarios**:

  ```
  Scenario: 회원 연결 해제 플로우
    Tool: Playwright
    Preconditions: 회원 계정 로그인, 트레이너와 연결된 상태
    Steps:
      1. /member/settings로 이동
      2. "연결 해제" 버튼 클릭
      3. AppBottomSheet 모달 표시 확인 — "정말 해제하시겠습니까?" 텍스트
      4. "확인" 버튼 클릭
      5. /home으로 리다이렉트 확인
      6. 트레이너 정보 섹션이 "연결된 트레이너 없음" 상태로 변경
    Expected Result: 연결 해제 후 홈에서 트레이너 미연결 상태 표시
    Failure Indicators: 모달 안 뜸, 해제 후에도 트레이너 정보 표시
    Evidence: .sisyphus/evidence/task-30-member-disconnect.png

  Scenario: 계정 삭제 — 2차 확인 실패 시 차단
    Tool: Playwright
    Preconditions: 설정 화면
    Steps:
      1. "계정 삭제" 버튼 클릭
      2. 모달에서 확인 입력란에 "잘못된텍스트" 입력
      3. "삭제" 버튼이 비활성(disabled) 상태 확인
    Expected Result: "탈퇴" 정확히 입력하지 않으면 삭제 버튼 비활성
    Failure Indicators: 잘못된 텍스트로 삭제 진행됨
    Evidence: .sisyphus/evidence/task-30-delete-confirm-block.png
  ```

  **Commit**: YES (groups with T29, T31-T33)
  - Message: `feat(account): 연결 해제 + 소프트 계정 삭제`
  - Files: `src/composables/useProfile.js`, `src/views/trainer/SettingsView.vue`, `src/views/member/MemberSettingsView.vue`, `src/views/trainer/TrainerMemberDetailView.vue`

- [ ] 31. 트레이너 검색 승인 플로우 — 연결 요청 + 승인/거절 UI

  **What to do**:
  - connection_status enum에 'pending' 값이 Wave 1(T4)에서 추가됨
  - TrainerSearchView 수정:
    - 검색 결과에서 "연결 요청" 버튼 → trainer_members에 status='pending' INSERT
    - 이미 pending인 트레이너에는 "요청 중" 표시, 버튼 비활성
    - 이미 active인 트레이너에는 "연결됨" 표시
  - useTrainerSearch composable 확장: `requestConnection()` 함수 추가 (status='pending' INSERT)
  - 트레이너 측 승인 UI:
    - TrainerMemberView에 "대기 중" 탭/섹션 추가 — pending 상태 회원 목록
    - 각 항목에 "승인" / "거절" 버튼
    - 승인 → status='active', 거절 → 해당 row 삭제
  - useMembers composable 확장: `getPendingMembers()`, `approveConnection()`, `rejectConnection()` 추가
  - 연결 승인 시 알림 발생 (useNotifications.createNotification 호출)

  **Must NOT do**:
  - 초대 코드 방식 변경 금지 — 기존 초대 코드 + 검색 승인 두 방식 공존

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 비즈니스 로직 + UI 변경이 혼합, 다수 파일 수정
  - **Skills**: [`playwright`]
    - `playwright`: 검색 → 요청 → 승인 전체 플로우 QA
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 기존 TrainerSearchView/TrainerMemberView 패턴 확장

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 29, 30, 32, 33)
  - **Blocks**: T36 (Dashboard 통합)
  - **Blocked By**: T4 (enum 확장), T13 (useTrainerSearch/useMembers 확장)

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerSearchView.vue` — 현재 트레이너 검색 뷰 (수정 대상)
  - `src/views/trainer/TrainerMemberView.vue` — 회원 목록 뷰 (대기 탭 추가)
  - `src/composables/useTrainerSearch.js` — 검색 + 연결 로직
  - `src/composables/useMembers.js` — 회원 목록 조회

  **API/Type References**:
  - `supabase/schema.sql` — trainer_members 테이블 (status 필드)
  - `supabase/schema.sql` — connect_via_invite RPC (참고용, 승인은 별도 로직)

  **WHY Each Reference Matters**:
  - TrainerSearchView: 기존 "초대 코드로 연결" 외에 "연결 요청" 버튼 추가 필요
  - trainer_members: pending → active 상태 전이 로직의 근거

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 회원이 검색 → 연결 요청 → trainer_members에 status='pending' row 생성
  - [ ] 트레이너가 대기 목록에서 승인 → status='active'
  - [ ] 트레이너가 거절 → row 삭제

  **QA Scenarios**:

  ```
  Scenario: 회원이 트레이너에게 연결 요청
    Tool: Playwright
    Preconditions: 회원 로그인, 트레이너와 미연결
    Steps:
      1. /search로 이동 (트레이너 검색)
      2. 검색란에 트레이너 이름 입력
      3. 검색 결과에서 "연결 요청" 버튼 클릭
      4. 버튼이 "요청 중" (비활성) 상태로 변경 확인
    Expected Result: 연결 요청 후 버튼이 "요청 중"으로 변경
    Failure Indicators: 버튼 상태 안 바뀜, 에러 발생
    Evidence: .sisyphus/evidence/task-31-connection-request.png

  Scenario: 트레이너가 연결 요청 승인
    Tool: Playwright
    Preconditions: 트레이너 로그인, pending 요청 1건 존재
    Steps:
      1. /trainer/members로 이동
      2. "대기 중" 탭/섹션 확인 — pending 회원 1명 표시
      3. "승인" 버튼 클릭
      4. 대기 목록에서 해당 회원 사라짐 확인
      5. "회원" 탭에서 해당 회원 표시 확인
    Expected Result: 승인 후 회원이 활성 목록으로 이동
    Failure Indicators: 승인 후 대기 목록에 여전히 표시
    Evidence: .sisyphus/evidence/task-31-approve-connection.png
  ```

  **Commit**: YES (groups with T29-T30, T32-T33)
  - Message: `feat(search): 트레이너 검색 연결 요청 + 승인/거절 플로우`
  - Files: `src/views/trainer/TrainerSearchView.vue`, `src/views/trainer/TrainerMemberView.vue`, `src/composables/useTrainerSearch.js`, `src/composables/useMembers.js`

- [ ] 32. BottomNav 알림 배지 — 채팅 + 알림 미읽음 카운트

  **What to do**:
  - BottomNav.vue (회원용):
    - 채팅 탭에 미읽음 메시지 카운트 배지 추가
    - useChat composable의 `unreadCount` 활용
    - 배지 위치: 아이콘 `<span>` 뒤, 라벨 `<span>` 앞
    - 0이면 배지 숨김, 99+ 처리
  - TrainerBottomNav.vue (트레이너용):
    - 채팅 탭에 미읽음 카운트 배지 추가
    - 홈 탭에 대기 회원 수 배지 (pending connections count)
  - 배지 CSS: 빨간 원형, 흰색 텍스트, position: absolute
  - Supabase Realtime 구독으로 실시간 배지 업데이트 (이미 채팅에서 구독 중이므로 카운트만 추가)
  - useNotifications composable의 `unreadCount`도 설정 탭에 배지로 표시

  **Must NOT do**:
  - OS 푸시 알림 금지 — 인앱 배지만
  - 새 npm 패키지 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 배지 UI 디자인 + 위치 조정이 핵심
  - **Skills**: [`playwright`]
    - `playwright`: 배지 표시/숨김 상태 스크린샷 검증
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 배지는 단순 UI 요소

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 29-31, 33)
  - **Blocks**: T36 (Dashboard 통합)
  - **Blocked By**: T11 (useChat), T12 (useNotifications), T21 (채팅 뷰)

  **References**:

  **Pattern References**:
  - `src/components/BottomNav.vue` — 회원 nav (line 3-32: navItems 루프, icon/label 구조)
  - `src/components/TrainerBottomNav.vue` — 트레이너 nav (동일 구조)
  - `src/composables/useChat.js` (Wave 2에서 생성) — unreadCount ref

  **API/Type References**:
  - `src/composables/useNotifications.js` (Wave 2에서 생성) — unreadCount ref

  **WHY Each Reference Matters**:
  - BottomNav: navItems v-for 루프 내 icon span 뒤에 배지 span 삽입해야 함
  - useChat/useNotifications: 미읽음 카운트 값을 제공하는 소스

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 미읽음 메시지 있을 때 채팅 탭에 빨간 배지 숫자 표시
  - [ ] 모든 메시지 읽으면 배지 사라짐
  - [ ] 99개 초과 시 "99+" 표시

  **QA Scenarios**:

  ```
  Scenario: 채팅 미읽음 배지 표시
    Tool: Playwright
    Preconditions: 회원 로그인, 미읽음 채팅 메시지 3건 존재
    Steps:
      1. /home으로 이동
      2. 하단 네비 `.bottom-nav` 내 채팅 탭 확인
      3. `.bottom-nav__badge` 요소 존재 확인
      4. 배지 텍스트가 "3" 확인
    Expected Result: 채팅 탭 아이콘 옆에 빨간 배지 "3" 표시
    Failure Indicators: 배지 미표시, 숫자 불일치
    Evidence: .sisyphus/evidence/task-32-chat-badge.png

  Scenario: 미읽음 0건 시 배지 숨김
    Tool: Playwright
    Preconditions: 모든 채팅 메시지 읽음 상태
    Steps:
      1. /home으로 이동
      2. 하단 네비 채팅 탭에서 `.bottom-nav__badge` 요소 부재 확인
    Expected Result: 미읽음 0이면 배지 DOM에 렌더링되지 않음
    Failure Indicators: "0" 배지 표시됨
    Evidence: .sisyphus/evidence/task-32-no-badge.png
  ```

  **Commit**: YES (groups with T29-T31, T33)
  - Message: `feat(nav): BottomNav 채팅/알림 미읽음 배지`
  - Files: `src/components/BottomNav.vue`, `src/components/TrainerBottomNav.vue`

- [ ] 33. 회원 메모 읽기 — 회원이 트레이너 메모 열람

  **What to do**:
  - 회원 측 메모 열람 뷰 생성: `src/views/member/MemberMemoView.vue` + `.css`
    - 자신에게 작성된 메모 목록 조회 (useMemos 활용)
    - 날짜별 정렬 (최신순)
    - 각 메모: 작성일, 태그, 내용 표시
    - 읽기 전용 — 수정/삭제 불가
  - useMemos composable 확장: `getMemberMemos(memberId)` — 회원 본인 메모 조회
  - RLS 정책: Wave 1(T8)에서 memos 회원 읽기 RLS 추가됨 (SELECT WHERE member_id = auth.uid())
  - 라우터에 `/member/memos` 경로 추가
  - MemberHomeView에서 "메모" 섹션 또는 링크 추가

  **Must NOT do**:
  - 회원이 메모 수정/삭제 불가 — 읽기 전용
  - 다른 회원의 메모 조회 불가 (RLS로 보장)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단순 읽기 전용 목록 뷰 — 기존 패턴 복제
  - **Skills**: [`playwright`]
    - `playwright`: 메모 목록 표시 QA
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 단순 목록 UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 29-32)
  - **Blocks**: T36 (Dashboard 통합)
  - **Blocked By**: T8 (memos RLS), T20 (useMemos 확장)

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberDetailView.vue` — 메모 목록 UI 패턴 (트레이너 측)
  - `src/composables/useMemos.js` — 메모 CRUD composable
  - `src/views/member/MemberScheduleView.vue` — 회원 뷰 레이아웃 패턴

  **API/Type References**:
  - `supabase/schema.sql` — memos 테이블 구조 (content, tags jsonb, created_at)

  **WHY Each Reference Matters**:
  - TrainerMemberDetailView: 메모 카드 UI를 회원 뷰에서도 동일하게 사용
  - useMemos: 기존 getMemos 함수를 회원 ID 기반으로 확장

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 회원이 /member/memos에서 자신의 메모 목록 확인
  - [ ] 다른 회원 메모 접근 불가 (RLS)

  **QA Scenarios**:

  ```
  Scenario: 회원 메모 목록 조회
    Tool: Playwright
    Preconditions: 회원 로그인, 트레이너가 작성한 메모 2건 존재
    Steps:
      1. /member/memos로 이동
      2. `.memo-list` 내 메모 카드 2개 확인
      3. 각 카드에 작성일, 내용 텍스트 표시 확인
      4. 수정/삭제 버튼이 없음 확인
    Expected Result: 메모 2건 표시, 읽기 전용 (수정/삭제 버튼 없음)
    Failure Indicators: 메모 안 뜸, 수정 버튼 존재
    Evidence: .sisyphus/evidence/task-33-member-memos.png

  Scenario: 메모 없을 때 빈 상태
    Tool: Playwright
    Preconditions: 회원 로그인, 메모 0건
    Steps:
      1. /member/memos로 이동
      2. `.memo-list--empty` 빈 상태 메시지 확인 — "작성된 메모가 없습니다"
    Expected Result: 빈 상태 안내 메시지 표시
    Failure Indicators: 빈 화면 또는 에러
    Evidence: .sisyphus/evidence/task-33-no-memos.png
  ```

  **Commit**: YES (groups with T29-T32)
  - Message: `feat(memo): 회원 메모 열람 뷰`
  - Files: `src/views/member/MemberMemoView.vue`, `src/views/member/MemberMemoView.css`, `src/composables/useMemos.js`, `src/router/index.js`

---

### Wave 5 — 대시보드 통합 + 테스트 + 문서화 (T34-T39, depends: Wave 3-4)

- [ ] 34. TrainerHomeView 대시보드 통합 — 실제 데이터 연결

  **What to do**:
  - TrainerHomeView.vue에서 하드코딩된 목 데이터를 실제 composable 호출로 교체:
    - "오늘 예약" 섹션 → useReservations로 오늘 날짜 예약 조회
    - "최근 메시지" 섹션 → useChat로 최근 메시지 미리보기 (sender, preview, time)
    - 회원 수 → useMembers.members.length
    - PT 소화율 → usePtSessions에서 계산 (completed / total * 100)
    - 하드코딩된 "8", "92%" 등 제거
  - 로딩 상태 표시 (스켈레톤 or 스피너)
  - 에러 상태 표시 (인라인 에러 메시지)

  **Must NOT do**:
  - 차트/그래프 금지 — 단순 숫자 통계만
  - 새 npm 패키지 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 여러 composable 통합 + 기존 뷰 수정, 데이터 흐름 이해 필요
  - **Skills**: [`playwright`]
    - `playwright`: 대시보드 데이터 표시 QA
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 기존 UI 레이아웃 유지, 데이터만 교체

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 35, 36, 37, 38, 39)
  - **Blocks**: T40 (E2E 검증)
  - **Blocked By**: T21 (채팅 뷰), T24 (PT 횟수), T25 (수납), T32 (배지)

  **References**:

  **Pattern References**:
  - `src/views/home/MemberHomeView.vue` — 홈 대시보드 패턴 (참고)
  - `src/views/trainer/TrainerHomeView.vue` — 수정 대상 파일

  **API/Type References**:
  - `src/composables/useReservations.js` — getReservations(date)
  - `src/composables/useChat.js` (Wave 2) — getRecentMessages()
  - `src/composables/useMembers.js` — members ref
  - `src/composables/usePtSessions.js` (Wave 2) — PT 세션 통계

  **WHY Each Reference Matters**:
  - TrainerHomeView: 하드코딩 "8" (회원 수), "92%" (PT 소화율) 등을 실제 데이터로 교체

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 하드코딩 숫자 0개 (git diff로 확인)
  - [ ] 모든 섹션이 composable에서 데이터 로드

  **QA Scenarios**:

  ```
  Scenario: 트레이너 홈 실제 데이터 표시
    Tool: Playwright
    Preconditions: 트레이너 로그인, 회원 3명, 오늘 예약 2건
    Steps:
      1. /trainer/home으로 이동
      2. 회원 수 표시가 "3" 확인 (하드코딩 "8" 아님)
      3. 오늘 예약 섹션에 2건 표시 확인
      4. 최근 메시지 섹션에 실제 메시지 or "메시지가 없습니다" 표시
    Expected Result: 모든 섹션이 DB 데이터 기반으로 표시
    Failure Indicators: 하드코딩 숫자 그대로, 로딩 무한
    Evidence: .sisyphus/evidence/task-34-trainer-home-data.png

  Scenario: 데이터 없는 트레이너 홈
    Tool: Playwright
    Preconditions: 트레이너 로그인, 회원 0명, 예약 0건
    Steps:
      1. /trainer/home으로 이동
      2. 회원 수 "0", 오늘 예약 "없음" 표시 확인
      3. 빈 상태 안내 메시지 확인
    Expected Result: 빈 데이터에도 깨지지 않고 적절한 빈 상태 표시
    Failure Indicators: 에러 발생, NaN 표시, 무한 로딩
    Evidence: .sisyphus/evidence/task-34-trainer-home-empty.png
  ```

  **Commit**: YES (groups with T35-T39)
  - Message: `feat(dashboard): 트레이너 홈 실제 데이터 통합`
  - Files: `src/views/trainer/TrainerHomeView.vue`

- [ ] 35. MemberHomeView 대시보드 통합 — 실제 데이터 연결

  **What to do**:
  - MemberHomeView.vue에서 기존 데이터를 실제 composable 호출로 확장:
    - "오늘의 운동" 섹션 → useWorkoutPlans로 오늘 운동 계획 조회 (있으면 미리보기, 없으면 "운동 계획 없음")
    - "다음 예약" 섹션은 이미 구현됨 → 유지
    - "남은 PT 횟수" 표시 → usePtSessions에서 remaining_sessions 조회
    - "최근 알림" 미리보기 (1-2건) → useNotifications
  - 로딩/에러 상태 처리

  **Must NOT do**:
  - 차트/그래프 금지
  - 기존 "다음 예약" 섹션 변경 금지 (이미 작동 중)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 여러 composable 통합 + 기존 뷰 확장
  - **Skills**: [`playwright`]
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 기존 레이아웃 확장

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 34, 36, 37, 38, 39)
  - **Blocks**: T40 (E2E 검증)
  - **Blocked By**: T22 (오늘의 운동), T24 (PT 횟수), T26 (알림)

  **References**:

  **Pattern References**:
  - `src/views/home/MemberHomeView.vue` — 수정 대상 파일
  - `src/views/home/MemberHomeView.css` — 스타일 파일

  **API/Type References**:
  - `src/composables/useWorkoutPlans.js` (Wave 2) — 오늘 운동 계획
  - `src/composables/usePtSessions.js` (Wave 2) — 남은 PT 횟수
  - `src/composables/useNotifications.js` (Wave 2) — 최근 알림

  **WHY Each Reference Matters**:
  - MemberHomeView: "오늘의 운동" 섹션이 현재 스텁이므로 실제 데이터로 교체

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 오늘의 운동 섹션에 실제 데이터 or 빈 상태 표시
  - [ ] 남은 PT 횟수 표시 (하드코딩 아닌 실제 값)

  **QA Scenarios**:

  ```
  Scenario: 회원 홈 운동 계획 표시
    Tool: Playwright
    Preconditions: 회원 로그인, 오늘 운동 계획 1건 존재
    Steps:
      1. /home으로 이동
      2. "오늘의 운동" 섹션 확인
      3. 운동 제목 또는 미리보기 텍스트 표시 확인
      4. "남은 PT" 섹션에 숫자 표시 확인
    Expected Result: 실제 운동 계획 + PT 횟수가 DB 기반으로 표시
    Failure Indicators: "준비 중" 텍스트 여전히 표시, 하드코딩 숫자
    Evidence: .sisyphus/evidence/task-35-member-home-data.png

  Scenario: 운동 계획 없는 날
    Tool: Playwright
    Preconditions: 회원 로그인, 오늘 운동 계획 0건
    Steps:
      1. /home으로 이동
      2. "오늘의 운동" 섹션에 "운동 계획 없음" 표시 확인
    Expected Result: 빈 상태 메시지 표시 (에러 아님)
    Failure Indicators: 에러 발생 또는 섹션 미표시
    Evidence: .sisyphus/evidence/task-35-member-home-no-workout.png
  ```

  **Commit**: YES (groups with T34, T36-T39)
  - Message: `feat(dashboard): 회원 홈 실제 데이터 통합`
  - Files: `src/views/home/MemberHomeView.vue`, `src/views/home/MemberHomeView.css`

- [ ] 36. Settings 뷰 통합 — 실제 기능 연결 + 스텁 제거

  **What to do**:
  - SettingsView.vue (트레이너):
    - 프로필 편집 → T29에서 만든 TrainerProfileEditView로 router.push
    - 근무시간 설정 → 기존 WorkTimeSettingView로 연결 (이미 구현)
    - 휴무일 설정 → T28에서 구현한 TrainerScheduleView 휴무 탭
    - 알림 → T26에서 만든 NotificationView로 router.push
    - 계정 삭제 → T30에서 구현한 소프트 삭제 호출
    - 로그아웃 → 기존 구현 유지
    - alert('준비 중입니다') 모두 제거
  - MemberSettingsView.vue (회원):
    - 프로필 편집 → T29의 MemberProfileEditView
    - 트레이너 연결 해제 → T30의 연결 해제 기능
    - 알림 → NotificationView
    - 계정 삭제 → 소프트 삭제
    - 남은 PT 횟수 → usePtSessions에서 실제 값 (하드코딩 "12회" 제거)
    - alert() 모두 제거

  **Must NOT do**:
  - 알림 설정(on/off) 기능 금지 — 알림 목록 조회만
  - CSV/PDF 내보내기 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 뷰에서 alert 제거 + router.push 연결만, 새 UI 없음
  - **Skills**: [`playwright`]
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: UI 변경 없음, 라우팅 연결만

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 34, 35, 37, 38, 39)
  - **Blocks**: T40 (E2E 검증)
  - **Blocked By**: T29 (프로필 편집), T30 (계정 관리), T26 (알림 뷰)

  **References**:

  **Pattern References**:
  - `src/views/trainer/SettingsView.vue` — 트레이너 설정 (수정 대상)
  - `src/views/member/MemberSettingsView.vue` — 회원 설정 (수정 대상)

  **API/Type References**:
  - `src/router/index.js` — 각 뷰의 라우트 이름

  **WHY Each Reference Matters**:
  - SettingsView: 현재 alert('준비 중입니다')로 된 핸들러를 실제 router.push로 교체

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 코드베이스에서 `alert('준비 중입니다')` 0건 (grep 확인)
  - [ ] 모든 설정 항목이 실제 뷰로 이동

  **QA Scenarios**:

  ```
  Scenario: 트레이너 설정 모든 메뉴 작동
    Tool: Playwright
    Preconditions: 트레이너 로그인
    Steps:
      1. /trainer/settings로 이동
      2. "프로필 편집" 클릭 → /trainer/profile-edit 이동 확인
      3. 뒤로가기 → /trainer/settings
      4. "알림" 클릭 → /notifications 이동 확인
      5. 뒤로가기 → /trainer/settings
      6. alert() 다이얼로그가 한 번도 뜨지 않음 확인
    Expected Result: 모든 메뉴가 실제 페이지로 이동, alert 없음
    Failure Indicators: alert('준비 중입니다') 다이얼로그 팝업
    Evidence: .sisyphus/evidence/task-36-settings-navigation.png

  Scenario: 회원 설정 PT 횟수 실제 값
    Tool: Playwright
    Preconditions: 회원 로그인, PT 잔여 5회
    Steps:
      1. /member/settings로 이동
      2. PT 횟수 섹션 확인 — "5회" 표시
      3. 하드코딩 "12회" 아님 확인
    Expected Result: DB 기반 실제 PT 잔여 횟수 표시
    Failure Indicators: 하드코딩 숫자, "12회" 그대로
    Evidence: .sisyphus/evidence/task-36-member-pt-count.png
  ```

  **Commit**: YES (groups with T34-T35, T37-T39)
  - Message: `feat(settings): 설정 뷰 실제 기능 연결 + 스텁 제거`
  - Files: `src/views/trainer/SettingsView.vue`, `src/views/member/MemberSettingsView.vue`

- [ ] 37. TrainerMemberDetailView 통합 — PT 횟수/수납/메모 링크

  **What to do**:
  - TrainerMemberDetailView.vue에서:
    - PT 잔여 횟수 표시 → usePtSessions에서 조회
    - "수납 기록" 섹션 추가 → /trainer/members/:id/payments로 링크
    - "PT 횟수 관리" 버튼 → /trainer/members/:id/pt-sessions로 링크
    - 메모 작성(MemoWriteView) 링크 확인 (이미 구현된 경우 유지)
    - 최근 수납 1-2건 미리보기
  - 기존 회원 상세 레이아웃 유지, 섹션만 추가

  **Must NOT do**:
  - 기존 메모 목록 UI 변경 금지
  - 차트/그래프 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 뷰에 섹션/링크 추가만
  - **Skills**: [`playwright`]
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 기존 레이아웃에 항목 추가

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 34-36, 38, 39)
  - **Blocks**: T40 (E2E 검증)
  - **Blocked By**: T24 (PT 횟수 뷰), T25 (수납 뷰), T20 (useMemos 확장)

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberDetailView.vue` — 수정 대상

  **API/Type References**:
  - `src/composables/usePtSessions.js` (Wave 2) — PT 세션 데이터
  - `src/composables/usePayments.js` (Wave 2) — 수납 데이터

  **WHY Each Reference Matters**:
  - TrainerMemberDetailView: 현재 메모만 있는 상세 뷰에 PT/수납 정보 추가

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 회원 상세에서 PT 잔여 횟수 표시
  - [ ] 수납 기록 링크 클릭 → 수납 뷰 이동

  **QA Scenarios**:

  ```
  Scenario: 회원 상세 PT 횟수 + 수납 링크
    Tool: Playwright
    Preconditions: 트레이너 로그인, 회원 상세 페이지
    Steps:
      1. /trainer/members/:id로 이동
      2. "PT 잔여" 섹션에 횟수 표시 확인
      3. "수납 기록" 링크 클릭 → 수납 뷰 이동 확인
      4. 뒤로가기 → 회원 상세로 복귀
    Expected Result: PT 횟수 + 수납 기록 모두 접근 가능
    Failure Indicators: PT 횟수 미표시, 수납 링크 깨짐
    Evidence: .sisyphus/evidence/task-37-member-detail-integration.png
  ```

  **Commit**: YES (groups with T34-T36, T38-T39)
  - Message: `feat(member-detail): PT 횟수/수납/메모 통합`
  - Files: `src/views/trainer/TrainerMemberDetailView.vue`

- [ ] 38. Vitest 단위 테스트 — 핵심 composable 테스트

  **What to do**:
  - Vitest 설정은 T1에서 완료됨 (vitest.config.js, @vue/test-utils)
  - 핵심 composable 단위 테스트 작성:
    - `src/composables/__tests__/useReservations.test.js` — 슬롯 계산 로직, PT 0 예약 차단
    - `src/composables/__tests__/usePtSessions.test.js` — 횟수 차감, 잔여 계산
    - `src/composables/__tests__/useChat.test.js` — 메시지 전송/수신 로직
    - `src/composables/__tests__/useNotifications.test.js` — 알림 생성, 읽음 처리, 7일 삭제
  - 각 테스트: Supabase 클라이언트를 모킹 (vi.mock)
  - 각 테스트에서 composable 함수의 핵심 비즈니스 로직 검증
  - `npx vitest run` → 전체 통과 확인

  **Must NOT do**:
  - E2E 테스트 금지 (그건 T40에서)
  - 뷰 컴포넌트 테스트 금지 (composable만)
  - 새 npm 패키지 추가 금지 (Vitest + @vue/test-utils는 T1에서 설치됨)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Supabase 모킹 + composable 로직 이해 + 에지 케이스 커버리지
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 단위 테스트이므로 브라우저 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 34-37, 39)
  - **Blocks**: T40 (E2E 검증)
  - **Blocked By**: T11-T20 (모든 composable 완성), T1 (Vitest 설정)

  **References**:

  **Pattern References**:
  - `vitest.config.js` (T1에서 생성) — Vitest 설정
  - `src/composables/useReservations.js` — 테스트 대상 (슬롯 계산 로직)

  **External References**:
  - Vitest docs: vi.mock, vi.fn 사용법
  - @vue/test-utils: composable 테스트 패턴

  **WHY Each Reference Matters**:
  - useReservations: PT 0 예약 차단 로직이 가장 중요한 비즈니스 룰 → 반드시 테스트

  **Acceptance Criteria**:
  - [ ] `npx vitest run` → exit code 0
  - [ ] 최소 4개 테스트 파일, 각 파일 최소 3개 테스트 케이스
  - [ ] PT 0 예약 차단 테스트 포함

  **QA Scenarios**:

  ```
  Scenario: Vitest 전체 통과
    Tool: Bash
    Preconditions: T1에서 Vitest 설정 완료
    Steps:
      1. npx vitest run 실행
      2. 출력에서 "Tests" 라인 확인
      3. 실패 0건 확인
    Expected Result: "X passed, 0 failed" 출력
    Failure Indicators: 실패 테스트 존재, exit code 1
    Evidence: .sisyphus/evidence/task-38-vitest-results.txt

  Scenario: PT 0 예약 차단 테스트 존재
    Tool: Bash
    Preconditions: 테스트 파일 작성 완료
    Steps:
      1. grep -r "PT.*0\|remaining.*0\|예약.*차단\|block.*reservation" src/composables/__tests__/
      2. 매칭 결과 확인
    Expected Result: PT 0 차단 관련 테스트 케이스 최소 1건
    Failure Indicators: 매칭 없음
    Evidence: .sisyphus/evidence/task-38-pt-block-test.txt
  ```

  **Commit**: YES (groups with T34-T37, T39)
  - Message: `test(composables): 핵심 composable 단위 테스트 추가`
  - Files: `src/composables/__tests__/*.test.js`

- [ ] 39. schema.sql 동기화 + AGENTS.md 업데이트

  **What to do**:
  - supabase/schema.sql 파일을 실제 DB 상태와 동기화:
    - Wave 1에서 Supabase MCP로 직접 실행한 SQL을 schema.sql에 반영
    - 새 테이블 7개, enum 변경, RPC 함수, RLS 정책, Storage 버킷, trigger 모두 포함
    - 기존 테이블의 변경사항 (memos RLS 등) 반영
  - AGENTS.md 업데이트:
    - "미구현 기능" 섹션에서 구현 완료된 항목 제거
    - 새 테이블/composable/뷰 목록 추가
    - "Commands" 섹션에 `npx vitest run` 추가
    - "Where to Look" 테이블 업데이트
  - README.md 업데이트:
    - 미구현 기능 목록 → 구현 완료로 변경
    - 새 테이블 추가

  **Must NOT do**:
  - 별도 마이그레이션 파일 생성 금지 (schema.sql 단일 파일 유지)
  - docs/ 디렉토리 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 문서 작성/업데이트가 핵심
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 문서 작업이므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 34-38)
  - **Blocks**: T40 (E2E 검증)
  - **Blocked By**: T1-T10 (모든 DB 변경), T11-T20 (모든 composable)

  **References**:

  **Pattern References**:
  - `supabase/schema.sql` — 현재 스키마 파일 (업데이트 대상)
  - `AGENTS.md` — 프로젝트 가이드 (업데이트 대상)
  - `README.md` — 프로젝트 설명 (업데이트 대상)

  **WHY Each Reference Matters**:
  - schema.sql: Phase 2 테이블이 추가되었으므로 파일이 실제 DB와 일치해야 함
  - AGENTS.md: 에이전트들이 참조하는 프로젝트 맵이므로 최신 상태 유지 필수

  **Acceptance Criteria**:
  - [ ] schema.sql에 새 테이블 7개 + RLS + RPC + trigger 포함
  - [ ] AGENTS.md "미구현 기능" 섹션에서 구현 완료 항목 제거
  - [ ] `npm run build` → exit code 0 (코드 변경 없으므로 기존 빌드 유지 확인)

  **QA Scenarios**:

  ```
  Scenario: schema.sql 완전성 확인
    Tool: Bash
    Preconditions: 모든 DB 변경 완료
    Steps:
      1. grep -c "CREATE TABLE" supabase/schema.sql
      2. 결과가 15 이상 (기존 8 + 신규 7) 확인
      3. grep "messages\|payments\|pt_sessions\|manuals\|manual_media\|workout_plans\|notifications\|trainer_holidays" supabase/schema.sql
      4. 모든 신규 테이블명 매칭 확인
    Expected Result: 15개 이상 CREATE TABLE, 모든 신규 테이블 포함
    Failure Indicators: 일부 테이블 누락
    Evidence: .sisyphus/evidence/task-39-schema-completeness.txt

  Scenario: AGENTS.md 최신성 확인
    Tool: Bash
    Preconditions: 문서 업데이트 완료
    Steps:
      1. grep "준비 중\|미구현" AGENTS.md
      2. Phase 2에서 구현한 기능이 "미구현"으로 남아있지 않은지 확인
    Expected Result: 구현 완료된 기능이 "미구현"으로 표시되지 않음
    Failure Indicators: "채팅 — 미구현" 등이 여전히 존재
    Evidence: .sisyphus/evidence/task-39-agents-md-updated.txt
  ```

  **Commit**: YES (groups with T34-T38)
  - Message: `docs: schema.sql 동기화 + AGENTS.md/README.md 업데이트`
  - Files: `supabase/schema.sql`, `AGENTS.md`, `README.md`

---

### Wave 6 — E2E 검증 + 최종 빌드 (T40-T41, depends: Wave 5)

- [ ] 40. E2E 통합 검증 — 전체 플로우 Playwright 테스트

  **What to do**:
  - 주요 사용자 플로우 E2E 테스트 (Playwright로 실행):
    1. 트레이너 플로우: 로그인 → 홈 → 회원 관리 → 메모 작성 → 채팅 → 매뉴얼 등록 → 설정
    2. 회원 플로우: 로그인 → 홈 → 예약 → 채팅 → 매뉴얼 조회 → 메모 조회 → 설정
    3. 연결 플로우: 회원 검색 → 연결 요청 → 트레이너 승인 → 채팅 가능
    4. PT 횟수 플로우: 트레이너 PT 추가 → 회원 예약 → 완료 → 자동 차감 확인
    5. 결제 플로우: 수납 기록 작성 → 목록 조회 → 삭제
  - 각 플로우: 네비게이션 확인, 데이터 CRUD 확인, 에러 상태 확인
  - 스크린샷 증거를 `.sisyphus/evidence/e2e/` 에 저장

  **Must NOT do**:
  - Playwright 설치/설정 금지 — skill로 직접 실행
  - 새 npm 패키지 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 전체 앱 플로우 이해 + 다수 시나리오 실행
  - **Skills**: [`playwright`]
    - `playwright`: E2E 브라우저 자동화 필수
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 테스트 실행이므로 디자인 불필요

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after all Wave 5 tasks)
  - **Blocks**: T41 (최종 빌드)
  - **Blocked By**: T34-T39 (모든 Wave 5 태스크)

  **References**:

  **Pattern References**:
  - 전체 `src/views/` 디렉토리 — 모든 뷰 파일
  - `src/router/index.js` — 전체 라우트 맵

  **WHY Each Reference Matters**:
  - router: 모든 경로를 순회하며 404 없는지 확인

  **Acceptance Criteria**:
  - [ ] 5개 주요 플로우 모두 통과
  - [ ] `.sisyphus/evidence/e2e/` 에 각 플로우 스크린샷 저장
  - [ ] 콘솔 에러 0건

  **QA Scenarios**:

  ```
  Scenario: 트레이너 전체 플로우
    Tool: Playwright
    Preconditions: 트레이너 계정 로그인, 회원 1명 연결
    Steps:
      1. /trainer/home → 대시보드 데이터 표시 확인
      2. /trainer/members → 회원 목록 1명 표시
      3. 회원 클릭 → 상세 → PT 횟수 + 메모 표시
      4. /trainer/chat → 채팅 목록 표시
      5. /trainer/manuals → 매뉴얼 목록 표시
      6. /trainer/settings → 모든 메뉴 클릭 가능
      7. 전체 네비게이션 중 console.error 0건 확인
    Expected Result: 트레이너 전체 기능 정상 작동, 에러 없음
    Failure Indicators: 404, 빈 화면, console.error
    Evidence: .sisyphus/evidence/e2e/trainer-full-flow.png

  Scenario: PT 횟수 0 예약 차단
    Tool: Playwright
    Preconditions: 회원 로그인, PT 잔여 0회
    Steps:
      1. /member/reservation으로 이동
      2. 날짜/시간 선택 시도
      3. 예약 차단 메시지 확인 — "남은 PT 횟수가 없습니다"
      4. 예약 버튼 비활성(disabled) 확인
    Expected Result: PT 0이면 예약 불가, 안내 메시지 표시
    Failure Indicators: 예약 진행됨, 차단 메시지 없음
    Evidence: .sisyphus/evidence/e2e/pt-zero-block.png
  ```

  **Commit**: NO (검증 태스크)

- [ ] 41. 최종 빌드 + 정리

  **What to do**:
  - `npm run build` → dist/ 생성 확인
  - `npx vitest run` → 전체 테스트 통과 확인
  - 코드 정리:
    - console.log 제거 (디버그용)
    - 사용하지 않는 import 제거
    - 주석 처리된 코드 제거
  - `alert('준비 중입니다')` grep → 0건 확인
  - 하드코딩된 목 데이터 grep → 0건 확인 (mock, 하드코딩 패턴)
  - git status → 모든 변경사항 커밋 확인

  **Must NOT do**:
  - 새 기능 추가 금지
  - 기존 기능 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 빌드 실행 + grep 확인 + 정리
  - **Skills**: [`git-master`]
    - `git-master`: 최종 커밋 정리
  - **Skills Evaluated but Omitted**:
    - `playwright`: 빌드 검증이므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after T40)
  - **Blocks**: Final Verification Wave (F1-F4)
  - **Blocked By**: T40 (E2E 검증)

  **References**:

  **Pattern References**:
  - `package.json` — build 스크립트
  - `vite.config.js` — 빌드 설정

  **WHY Each Reference Matters**:
  - package.json: 빌드 명령어 확인
  - vite.config.js: alias 설정 등 빌드 오류 시 참조

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] `npx vitest run` → exit code 0
  - [ ] `grep -r "준비 중입니다" src/` → 0 matches
  - [ ] `grep -r "console.log" src/` → 0 matches (디버그용)
  - [ ] `git status` → clean working tree

  **QA Scenarios**:

  ```
  Scenario: 프로덕션 빌드 성공
    Tool: Bash
    Preconditions: 모든 구현 완료
    Steps:
      1. npm run build 실행
      2. exit code 0 확인
      3. ls dist/ → index.html + assets/ 존재 확인
    Expected Result: dist/ 디렉토리에 빌드 산출물 생성
    Failure Indicators: exit code 1, dist/ 미생성
    Evidence: .sisyphus/evidence/task-41-build-output.txt

  Scenario: 스텁 코드 완전 제거 확인
    Tool: Bash
    Preconditions: 코드 정리 완료
    Steps:
      1. grep -rn "준비 중입니다" src/
      2. grep -rn "alert(" src/ (confirm/prompt 제외)
      3. 두 명령 모두 0건 확인
    Expected Result: "준비 중" 스텁과 alert() 모두 제거됨
    Failure Indicators: 매칭 존재
    Evidence: .sisyphus/evidence/task-41-no-stubs.txt
  ```

  **Commit**: YES
  - Message: `chore: 최종 빌드 검증 + 코드 정리`
  - Files: (정리된 파일들)

---

## Final Verification Wave (MANDATORY — ALL 구현 태스크 완료 후)

> 4개 리뷰 에이전트가 병렬 실행. 모두 APPROVE 필요. 거부 시 수정 → 재실행.

- [ ] F1. **플랜 준수 감사** — `oracle`
  플랜 전체를 읽고, 각 "Must Have"에 대해 구현 존재 확인 (파일 읽기, curl, 명령 실행). 각 "Must NOT Have"에 대해 코드베이스에서 금지 패턴 검색 — 발견 시 file:line과 함께 거부. `.sisyphus/evidence/` 파일 존재 확인. 산출물과 플랜 비교.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **코드 품질 리뷰** — `unspecified-high`
  `npm run build` + `npx vitest run` 실행. 변경된 모든 파일에서: 빈 catch, console.log (프로덕션), 주석 처리된 코드, 미사용 import 검사. AI 슬롭 패턴: 과도한 주석, 과도한 추상화, 일반적 변수명.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **실제 QA 검증** — `unspecified-high` (+ `playwright` skill)
  클린 상태에서 시작. 모든 태스크의 QA 시나리오를 순서대로 실행. 크로스 태스크 통합 테스트. 엣지 케이스. `.sisyphus/evidence/final-qa/`에 저장.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **스코프 충실도 점검** — `deep`
  각 태스크별: "What to do" 읽기, 실제 diff 확인 (git log/diff). 1:1 검증. "Must NOT do" 준수 확인. 크로스 태스크 오염 감지.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit | Message |
|------|--------|---------|
| 1 | T1 | `chore: Vitest 테스트 인프라 설정` |
| 1 | T2-T10 | `feat(db): Phase 2 DB 스키마 — 채팅, 수납, PT횟수, 매뉴얼, 운동, 알림, 휴무일` |
| 2 | T11-T20 | `feat(composables): Phase 2 composable 레이어 — 7개 신규 + 3개 확장` |
| 3 | T21-T28 | `feat(views): Phase 2 핵심 뷰 — 채팅, 매뉴얼, 운동, 횟수, 수납, 알림, 휴무일` |
| 4 | T29-T33 | `feat(views): 프로필 수정, 계정 관리, 검색 승인, 알림 배지, 메모 읽기` |
| 5 | T34-T37 | `feat(views): 대시보드 통합 + 설정 업데이트` |
| 5 | T38 | `test: Vitest 단위 테스트 — 핵심 composable` |
| 5 | T39 | `docs: schema.sql 동기화 + AGENTS.md 업데이트` |

---

## Success Criteria

### Verification Commands
```bash
npm run build      # Expected: exit code 0, no errors
npx vitest run     # Expected: all tests pass
npm run dev        # Expected: dev server starts on :5173
```

### Final Checklist
- [ ] PRD §2-§16 전 기능 동작
- [ ] 모든 "Must Have" 구현
- [ ] 모든 "Must NOT Have" 미존재
- [ ] `npm run build` 성공
- [ ] `npx vitest run` 전체 통과
- [ ] Supabase Realtime 채팅 동작
- [ ] 모든 "준비 중" 스텁 교체 완료
- [ ] 알림 배지 + 알림 목록 동작
- [ ] PT 횟수 0 → 예약 차단 동작
- [ ] 계정 삭제 + 연결 해제 동작
