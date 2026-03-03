# Supabase 백엔드 연동 — Phase 1: 인증 + 회원관리 + 예약

## TL;DR

> **Quick Summary**: 기존 Vue 3 PWA의 하드코딩된 목 데이터를 Supabase 백엔드(PostgreSQL + Auth + Storage)와 연결합니다. 카카오 OAuth 인증, 트레이너-회원 연결, PT 예약 시스템을 실제로 동작하게 만듭니다.
> 
> **Deliverables**:
> - 카카오 OAuth 로그인 → 역할 선택 → 프로필 생성 → 홈 화면 전체 플로우
> - 트레이너-회원 초대코드/검색 연결 시스템
> - PT 예약 생성/승인/거절/완료 전체 라이프사이클
> - 근무시간 설정 저장/로드
> - 캘린더/대시보드 실제 데이터 표시
> - 프로필 이미지 업로드 (Supabase Storage)
> - RLS 기반 데이터 격리
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Task 1 → Task 4 → Task 6 → Task 7 → Task 13 → Task 16 → Final Wave

---

## Context

### Original Request
PRD 갭 분석 결과, 모든 UI 화면(15/16 섹션)이 완성되었으나 백엔드 연동이 전무합니다. 사용자는 Supabase BaaS를 선택하여 인증 → 회원관리 → 예약 순서로 실제 동작하는 앱을 만들고자 합니다.

### Interview Summary
**Key Discussions**:
- 백엔드: Supabase (PostgreSQL + Auth + Realtime + Storage) 선택
- 배포: Vercel (프론트) + Supabase (백엔드)
- 우선순위: 로그인/인증 → 회원관리 → 예약
- 카카오 OAuth: 개발자 앱 등록됨, REST API 키 보유
- 알림 기능: 현재 버전에서 제외
- DB 구조: 분리 테이블 (profiles + trainer_profiles + member_profiles)
- 미연결 회원 상태: Phase 1에 포함
- 이메일 로그인: '준비 중' alert 유지
- Phase 1 데이터 연동: TrainerMemberDetailView, TrainerSearchView, 프로필 이미지 업로드 모두 포함

**Research Findings**:
- Supabase에 네이티브 카카오 OAuth 지원 있음 (커스텀 OIDC 불필요)
- PKCE 플로우 + `detectSessionInUrl: true`로 SPA OAuth 처리
- Vue 3 공식 예제에서 `onMounted` + `onAuthStateChange` 패턴 확인

### Metis Review
**Identified Gaps** (addressed):
- OAuth 콜백 라우트 없음 → Task 3에서 `/auth/callback` 라우트 추가
- 세션 영속성 없음 → Task 4에서 auth 스토어 확장 + Supabase persistSession 연동
- 라우트 가드 없음 → Task 3에서 `router.beforeEach` 추가
- 시간대 불일치 리스크 → `timestamptz` + KST 변환 가이드라인 설정
- 동시 예약 충돌 리스크 → unique constraint + DB function으로 해결

---

## Work Objectives

### Core Objective
하드코딩된 목 데이터로 동작하는 Vue 3 PWA를 Supabase 백엔드와 연결하여 인증, 회원관리, 예약 기능이 실제로 동작하게 만듭니다.

### Concrete Deliverables
- `src/lib/supabase.js` — Supabase 클라이언트 인스턴스
- `.env.local` — Supabase URL + anon key
- `src/stores/auth.js` — 확장된 인증 스토어 (user, profile, role, session, loading)
- `src/composables/` — useMembers, useReservations, useWorkHours, useInvite, useTrainerSearch, useMemos, useProfile 컴포저블
- `src/router/index.js` — 라우트 가드 + `/auth/callback` 라우트 추가
- DB 스키마 SQL — profiles, trainer_profiles, member_profiles, trainer_members, invite_codes, work_schedules, reservations, memos 테이블 + RLS
- 13개 뷰 파일 — 목 데이터 → 실제 Supabase 쿼리로 교체

### Definition of Done
- [x] `npm run build` → 0 에러
- [x] 카카오 OAuth 로그인 → 역할 선택 → 프로필 생성 → 홈 전체 플로우 동작
- [x] 미인증 사용자 `/trainer/home` 접근 시 `/login`으로 리다이렉트
- [x] 트레이너가 다른 트레이너의 회원 데이터 조회 불가 (RLS)
- [x] 초대 코드로 트레이너-회원 연결 동작
- [x] 예약 생성 → 승인/거절 → 완료/취소 전체 라이프사이클 동작
- [x] 페이지 새로고침 후에도 세션 유지

### Must Have
- 카카오 OAuth PKCE 플로우
- `auth.uid()` 기반 RLS on ALL tables
- 라우트 가드 (미인증/역할 불일치 시 리다이렉트)
- 컴포저블 패턴 (뷰에서 Supabase 직접 호출 금지)
- `.env.local`에 Supabase 키 관리 (코드에 하드코딩 금지)
- 모든 타임스탬프 `timestamptz` (UTC 저장, KST 표시)
- 미연결 회원 상태 UI 처리

### Must NOT Have (Guardrails)
- ❌ TypeScript — 프로젝트는 순수 JavaScript
- ❌ CSS 파일 수정 — 모든 CSS는 완성됨, `<script setup>`과 `<template>` 변경만
- ❌ 컴포넌트 인터페이스 변경 — AppButton, AppInput, AppCalendar 등의 props 계약 유지
- ❌ 채팅 뷰 연동 (TrainerChatView, MemberChatView) — 목 데이터 유지
- ❌ 매뉴얼 뷰 연동 (TrainerManualView, ManualRegisterView, ManualDetailView, MemberManualView)
- ❌ 오늘의 운동 연동 (TodayWorkoutView)
- ❌ 수납 기록 연동 (MemberPaymentView, PaymentWriteView)
- ❌ 메모 작성 뷰 연동 (MemoWriteView) — **단, TrainerMemberDetailView의 메모 목록 읽기는 포함**
- ❌ Supabase Realtime 구독 — 클라이언트 새로고침/재방문으로 처리
- ❌ PWA 서비스워커 API 캐싱
- ❌ 계정 삭제 플로우
- ❌ 프로필 수정 뷰 (온보딩 프로필 생성만 Phase 1)
- ❌ 알림 시스템 (PRD §4)
- ❌ 스켈레톤 스크린, 로딩 라이브러리 — 간단한 `v-if="loading"` 텍스트만
- ❌ 글로벌 토스트/에러 바운더리 — 인라인 에러 메시지만
- ❌ axios, fetch 래퍼 등 HTTP 클라이언트 — Supabase JS 클라이언트만 사용

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: none
- **QA Method**: Agent-Executed QA Scenarios only (Playwright for UI, curl for API/DB)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests to Supabase REST API, assert status + response
- **Database**: Use Bash (curl to Supabase REST API or psql) — Query tables, assert RLS policies
- **Auth flows**: Use Playwright — Full OAuth flow simulation where possible, session state verification

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — blocking everything):
├── Task 1: Supabase 클라이언트 설정 + 환경변수 [quick]
├── Task 2: DB 스키마 설계 + SQL 생성 [deep]
└── Task 3: 라우터 가드 + auth 콜백 라우트 [unspecified-high]

Wave 2 (Auth — blocking data integration):
├── Task 4: Auth 스토어 확장 + 세션 관리 [deep]
├── Task 5: 카카오 OAuth 로그인 플로우 [unspecified-high]
└── Task 6: 온보딩 플로우 (역할 선택 + 프로필 저장) [unspecified-high]

Wave 3 (Core Data — max parallel):
├── Task 7: useMembers 컴포저블 + TrainerMemberView 연동 [unspecified-high]
├── Task 8: useInvite 컴포저블 + InviteManageView/InviteEnterView 연동 [unspecified-high]
├── Task 9: useWorkHours 컴포저블 + WorkTimeSettingView 연동 [unspecified-high]
├── Task 10: useTrainerSearch 컴포저블 + TrainerSearchView 연동 [unspecified-high]
├── Task 11: useProfile 컴포저블 + 프로필 이미지 업로드 [unspecified-high]
└── Task 12: useMemos 컴포저블 + TrainerMemberDetailView 연동 [unspecified-high]

Wave 4 (Reservation + Dashboard — depends on Wave 3):
├── Task 13: useReservations 컴포저블 + MemberReservationView 연동 [deep]
├── Task 14: ReservationManageView 연동 (예약 승인/거절) [unspecified-high]
├── Task 15: 캘린더 뷰 연동 (TrainerScheduleView + MemberScheduleView) [unspecified-high]
├── Task 16: 대시보드 연동 (TrainerHomeView + MemberHomeView) [unspecified-high]
└── Task 17: SettingsView + MemberSettingsView 연동 + 로그아웃 [quick]

Wave 5 (Integration + QA):
├── Task 18: 미연결 회원 상태 처리 + 빈 상태 UI [unspecified-high]
└── Task 19: 전체 통합 빌드 검증 + 에러 처리 [deep]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4, 5, 6, 7-19 | 1 |
| 2 | — | 4, 5, 6, 7-19 | 1 |
| 3 | — | 5, 6 | 1 |
| 4 | 1, 2 | 5, 6, 7-19 | 2 |
| 5 | 3, 4 | 6 | 2 |
| 6 | 4, 5 | 7-19 | 2 |
| 7 | 6 | 12, 16 | 3 |
| 8 | 6 | — | 3 |
| 9 | 6 | 13, 15 | 3 |
| 10 | 6 | — | 3 |
| 11 | 6 | — | 3 |
| 12 | 7 | — | 3 |
| 13 | 9 | 14, 15 | 4 |
| 14 | 13 | 15 | 4 |
| 15 | 9, 13, 14 | 16 | 4 |
| 16 | 7, 15 | — | 4 |
| 17 | 4 | — | 4 |
| 18 | 7, 16 | — | 5 |
| 19 | ALL | FINAL | 5 |

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `quick`, T2 → `deep`, T3 → `unspecified-high`
- **Wave 2**: **3** — T4 → `deep`, T5 → `unspecified-high`, T6 → `unspecified-high`
- **Wave 3**: **6** — T7-T12 → `unspecified-high`
- **Wave 4**: **5** — T13 → `deep`, T14-T16 → `unspecified-high`, T17 → `quick`
- **Wave 5**: **2** — T18 → `unspecified-high`, T19 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

### Wave 1 — Foundation (parallel)

- [x] 1. Supabase 클라이언트 설정 + 환경변수

  **What to do**:
  - `npm install @supabase/supabase-js` 실행
  - `src/lib/supabase.js` 생성:
    ```js
    import { createClient } from '@supabase/supabase-js'
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
      }
    })
    ```
  - `.env.local` 생성 (실제 키는 사용자가 입력):
    ```
    VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
    VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
    ```
  - `.env.example` 생성 (같은 구조, 값은 placeholder)
  - `.gitignore`에 `.env.local` 추가 확인

  **Must NOT do**:
  - TypeScript 사용 금지
  - Supabase 키를 소스코드에 하드코딩 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일 생성 + npm install, 간단한 설정 작업
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: UI 테스트 불필요한 설정 작업

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6, 7-19
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/main.js:1-13` — 앱 부트스트랩 패턴, Pinia/Router 등록 순서 확인
  - `package.json:11-15` — 현재 dependencies (vue, pinia, vue-router만 있음)

  **External References**:
  - Supabase JS 공식: `createClient(url, anonKey, { auth: { flowType: 'pkce', detectSessionInUrl: true } })`
  - Vue 3 + Supabase 공식 튜토리얼: `src/supabase.js` 패턴

  **WHY Each Reference Matters**:
  - `main.js` — Supabase 클라이언트가 앱 초기화와 어떻게 연결되는지 확인
  - `package.json` — 의존성 추가 위치와 기존 버전 확인

  **Acceptance Criteria**:
  - [ ] `@supabase/supabase-js` in package.json dependencies
  - [ ] `src/lib/supabase.js` exists with `supabase` named export
  - [ ] `.env.local` exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  - [ ] `.env.example` exists with placeholder values
  - [ ] `.env.local` is in .gitignore
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: Supabase 클라이언트 모듈 export 확인
    Tool: Bash
    Preconditions: npm install 완료
    Steps:
      1. npm run build 실행
      2. grep -r 'VITE_SUPABASE_URL' .env.local
      3. grep -r 'VITE_SUPABASE_ANON_KEY' .env.local
      4. grep '.env.local' .gitignore
    Expected Result: 빌드 성공, 환경변수 존재, gitignore에 포함
    Failure Indicators: 빌드 에러, 환경변수 누락
    Evidence: .sisyphus/evidence/task-1-supabase-client-setup.txt

  Scenario: 키가 소스코드에 하드코딩되지 않음
    Tool: Bash (grep)
    Preconditions: 파일 생성 완료
    Steps:
      1. grep -r 'supabase.co' src/ --include='*.js' --include='*.vue' → import.meta.env 참조만 허용
      2. grep -r 'eyJ' src/ → JWT 토큰 하드코딩 없어야 함
    Expected Result: src/ 내 직접 URL/키 하드코딩 0건
    Failure Indicators: src/ 파일에 실제 supabase URL이나 anon key가 직접 포함
    Evidence: .sisyphus/evidence/task-1-no-hardcoded-keys.txt
  ```

  **Commit**: YES
  - Message: `feat(supabase): add client setup and env config`
  - Files: `src/lib/supabase.js`, `.env.local`, `.env.example`, `package.json`, `package-lock.json`
  - Pre-commit: `npm run build`

- [x] 2. DB 스키마 설계 + SQL 생성

  **What to do**:
  - `supabase/schema.sql` 파일 생성 (Supabase SQL Editor에서 실행할 전체 스키마)
  - 테이블 정의:
    - `profiles` — id (uuid, FK to auth.users.id, PK), role ('trainer'|'member'), name (text), phone (text), photo_url (text), created_at (timestamptz)
    - `trainer_profiles` — id (uuid, FK to profiles.id, PK), specialties (text[]), bio (text)
    - `member_profiles` — id (uuid, FK to profiles.id, PK), age (int), height (numeric), weight (numeric), goals (text[]), notes (text)
    - `trainer_members` — id (uuid, PK), trainer_id (uuid, FK), member_id (uuid, FK), invite_code_used (text), connected_at (timestamptz), status ('active'|'disconnected'). UNIQUE(member_id) WHERE status='active'
    - `invite_codes` — id (uuid, PK), trainer_id (uuid, FK), code (text, UNIQUE), is_active (boolean default true), created_at (timestamptz)
    - `work_schedules` — id (uuid, PK), trainer_id (uuid, FK), day_of_week (int 0-6), start_time (time), end_time (time), is_enabled (boolean), slot_duration_minutes (int default 60). UNIQUE(trainer_id, day_of_week)
    - `reservations` — id (uuid, PK), trainer_id (uuid, FK), member_id (uuid, FK), date (date), start_time (time), end_time (time), status ('pending'|'approved'|'rejected'|'cancelled'|'completed'), session_type (text), created_at (timestamptz), updated_at (timestamptz). UNIQUE(trainer_id, date, start_time) WHERE status IN ('pending','approved')
    - `memos` — id (uuid, PK), trainer_id (uuid, FK), member_id (uuid, FK), content (text), tags (jsonb), created_at (timestamptz)
  - RLS 정책 (모든 테이블에 ENABLE RLS):
    - `profiles`: 본인 프로필 읽기/수정. 연결된 트레이너/회원의 프로필 읽기 (trainer_members JOIN)
    - `trainer_profiles`: 본인 읽기/수정. 연결된 회원이 트레이너 프로필 읽기. 검색용 전체 공개 SELECT
    - `member_profiles`: 본인 읽기/수정. 연결된 트레이너가 회원 프로필 읽기
    - `trainer_members`: 본인이 trainer_id 또는 member_id인 행만 접근
    - `invite_codes`: 트레이너 본인 코드 CRUD. 모든 인증된 사용자가 code로 SELECT 가능 (입력 확인용)
    - `work_schedules`: 트레이너 본인 CRUD. 연결된 회원이 SELECT 가능
    - `reservations`: trainer_id 또는 member_id가 본인인 행만 접근
    - `memos`: trainer_id가 본인인 행만 접근 (회원은 접근 불가)
  - Storage 버킷: `avatars` 버킷 생성 + 인증된 사용자 업로드, 공개 읽기 정책
  - DB Function (RPC):
    - `connect_via_invite(p_code text)` — 초대 코드로 트레이너-회원 연결. 코드 유효성 검증 + trainer_members INSERT를 트랜잭션으로 처리
    - `create_reservation(p_trainer_id uuid, p_date date, p_start_time time, p_end_time time, p_session_type text)` — 예약 생성. UNIQUE constraint로 동시 충돌 방지

  **Must NOT do**:
  - 채팅, 매뉴얼, 운동, 수납 관련 테이블 생성 금지
  - TypeScript 타입 파일 생성 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 복잡한 DB 스키마 설계, RLS 정책, DB Function 작성 필요
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: DB 작업에 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5, 6, 7-19
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberView.vue:173-239` — 회원 목록 목 데이터 구조: `{id, name, photo, sub, dotStatus, done, total, barColor, group}`
  - `src/views/trainer/ReservationManageView.vue:215-266` — 예약 목 데이터: `{id, name, sessionType, date, time, remaining, status, elapsed}`
  - `src/views/trainer/TrainerMemberDetailView.vue:132-164` — 회원 상세 + 메모 구조
  - `src/views/member/MemberReservationView.vue:167-182` — 시간대 슬롯: `{label, val, status}[]`
  - `src/views/trainer/WorkTimeSettingView.vue:128-145` — 근무시간: `{id, label, enabled, start, end}[]`
  - `src/views/invite/InviteManageView.vue:68-72` — 초대 코드 "PT24K9" + 최근 회원 구조

  **API/Type References**:
  - `src/stores/auth.js:4-17` — 현재 auth 스토어 구조 (role만 있음)

  **External References**:
  - Supabase RLS 가이드: `https://supabase.com/docs/guides/auth/row-level-security`
  - Supabase Storage 정책: `CREATE POLICY ... ON storage.objects ...`
  - Supabase DB Functions: `CREATE OR REPLACE FUNCTION ... RETURNS ... LANGUAGE plpgsql`

  **WHY Each Reference Matters**:
  - 뷰 파일의 목 데이터 구조 → DB 테이블 컬럼을 이 구조에 맞춰 설계하면 뷰 변환 코드 최소화
  - auth 스토어 → profiles 테이블이 스토어 확장에 필요한 데이터를 제공해야 함

  **Acceptance Criteria**:
  - [ ] `supabase/schema.sql` 파일 존재, 모든 테이블 CREATE 문 포함
  - [ ] 8개 테이블: profiles, trainer_profiles, member_profiles, trainer_members, invite_codes, work_schedules, reservations, memos
  - [ ] 모든 테이블에 RLS ENABLE + 최소 1개 정책
  - [ ] `connect_via_invite` RPC 함수 정의
  - [ ] `create_reservation` RPC 함수 정의
  - [ ] Storage `avatars` 버킷 설정 포함
  - [ ] 모든 타임스탬프가 `timestamptz` 타입

  **QA Scenarios:**

  ```
  Scenario: SQL 파일 구조 검증
    Tool: Bash
    Preconditions: supabase/schema.sql 생성됨
    Steps:
      1. grep -c 'CREATE TABLE' supabase/schema.sql → 8
      2. grep -c 'ENABLE ROW LEVEL SECURITY' supabase/schema.sql → 8 이상
      3. grep -c 'CREATE POLICY' supabase/schema.sql → 최소 8
      4. grep 'timestamptz' supabase/schema.sql → 매치 확인
      5. grep 'connect_via_invite' supabase/schema.sql → 함수 존재
      6. grep 'create_reservation' supabase/schema.sql → 함수 존재
    Expected Result: 8 테이블, 8+ RLS enable, 8+ 정책, timestamptz 사용, RPC 함수 2개
    Failure Indicators: 테이블 수 불일치, RLS 누락, timestamp (tz 없음) 사용
    Evidence: .sisyphus/evidence/task-2-schema-validation.txt

  Scenario: RLS 정책이 auth.uid() 기반인지 확인
    Tool: Bash (grep)
    Preconditions: supabase/schema.sql 생성됨
    Steps:
      1. grep 'auth.uid()' supabase/schema.sql → 다수 매치
      2. 하드코딩된 UUID 패턴 grep → 0건이어야 함
    Expected Result: 모든 RLS 정책이 auth.uid() 기반
    Failure Indicators: 하드코딩된 UUID, auth.uid() 미사용 정책
    Evidence: .sisyphus/evidence/task-2-rls-auth-uid.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add Phase 1 database schema SQL`
  - Files: `supabase/schema.sql`
  - Pre-commit: —

- [x] 3. 라우터 가드 + auth 콜백 라우트

  **What to do**:
  - `src/views/auth/AuthCallbackView.vue` 생성:
    - OAuth 리다이렉트 후 세션 처리 화면
    - `onMounted`에서 Supabase 세션 확인
    - 세션 있으면 → profiles 테이블에서 역할 조회
    - 프로필 존재 → role에 따라 `/trainer/home` 또는 `/home` 이동
    - 프로필 없음 (신규 유저) → `/onboarding/role` 이동
    - 로딩 중 간단한 "로그인 처리 중..." 텍스트 표시 (CSS 파일 생성 금지, 인라인 scoped style만)
  - `src/router/index.js` 수정:
    - `/auth/callback` 라우트 추가 (meta: { hideNav: true })
    - `router.beforeEach` 네비게이션 가드 추가:
      - 공개 라우트: `/login`, `/auth/callback`
      - 인증 필요 라우트: 나머지 전부
      - 미인증 + 비공개 라우트 → `/login` 리다이렉트
      - 인증됨 + role='trainer' + `/member/*` or `/home` 접근 → `/trainer/home`
      - 인증됨 + role='member' + `/trainer/*` 접근 → `/home`
      - 온보딩 라우트 (`/onboarding/*`)는 인증 필요하지만 역할 체크 불필요
    - **주의**: 가드에서 auth 스토어의 초기화 완료를 기다려야 함 (loading 상태 체크)

  **Must NOT do**:
  - CSS 파일 생성/수정 금지 (AuthCallbackView는 인라인 scoped style만)
  - 기존 라우트 경로/이름 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 라우트 가드 로직이 복잡하고, auth 상태와의 연동이 필요
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 구현 단계에서는 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/router/index.js:1-167` — 전체 라우트 정의 (35개 라우트, meta.hideNav 패턴)
  - `src/stores/auth.js:4-17` — auth 스토어 (role ref), setRole/clearRole 함수
  - `src/App.vue:1-19` — route.meta.hideNav + auth.role 기반 네비게이션 조건부 렌더링

  **External References**:
  - Vue Router Navigation Guards: `router.beforeEach((to, from) => { ... })`
  - Supabase Auth getSession() + onAuthStateChange() 패턴

  **WHY Each Reference Matters**:
  - `router/index.js` — 기존 35개 라우트를 보존하면서 가드와 콜백 라우트 추가
  - `auth.js` — 가드가 참조할 인증 상태 구조 파악
  - `App.vue` — hideNav 메타 패턴 따라 콜백 라우트에도 적용

  **Acceptance Criteria**:
  - [ ] `/auth/callback` 라우트가 router/index.js에 존재
  - [ ] `src/views/auth/AuthCallbackView.vue` 파일 존재
  - [ ] `router.beforeEach` 가드가 정의됨
  - [ ] 기존 35개 라우트 경로/이름 변경 없음
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 미인증 사용자가 보호된 라우트 접근 시 리다이렉트
    Tool: Playwright (playwright skill)
    Preconditions: 브라우저 localStorage에 인증 토큰 없음, dev server 실행 중
    Steps:
      1. page.goto('http://localhost:5173/trainer/home')
      2. page.waitForURL('**/login', { timeout: 5000 })
      3. assert page.url().includes('/login')
    Expected Result: /login으로 리다이렉트됨
    Failure Indicators: /trainer/home이 그대로 표시되거나 빈 화면
    Evidence: .sisyphus/evidence/task-3-unauth-redirect.png

  Scenario: /auth/callback 라우트가 존재하고 렌더링됨
    Tool: Playwright (playwright skill)
    Preconditions: dev server 실행 중
    Steps:
      1. page.goto('http://localhost:5173/auth/callback')
      2. 페이지에 텍스트 '로그인 처리 중' 또는 유사 메시지 존재 확인
      3. 하단 네비게이션 바가 없는지 확인 (meta.hideNav)
    Expected Result: 콜백 페이지 렌더링 성공, 네비게이션 바 없음
    Failure Indicators: 404 에러, 빈 화면, 또는 네비 표시
    Evidence: .sisyphus/evidence/task-3-callback-route.png
  ```

  **Commit**: YES
  - Message: `feat(router): add auth guards and callback route`
  - Files: `src/router/index.js`, `src/views/auth/AuthCallbackView.vue`
  - Pre-commit: `npm run build`

### Wave 2 — Auth (depends on Wave 1)

- [x] 4. Auth 스토어 확장 + 세션 관리

  **What to do**:
  - `src/stores/auth.js` 전면 확장:
    - 상태 추가: `user` (Supabase user object), `profile` (profiles 테이블 row), `role`, `session`, `loading` (boolean), `error`
    - `initialize()` 함수: `supabase.auth.getSession()` 호출하여 기존 세션 복구. 세션 있으면 `fetchProfile()` 호출
    - `supabase.auth.onAuthStateChange((event, session) => { ... })` 리스너 등록: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED 이벤트 처리
    - `fetchProfile()` 함수: `supabase.from('profiles').select('*').eq('id', user.id).single()` → profile/role 설정
    - `signOut()` 함수: `supabase.auth.signOut()` + role/user/profile/session 전부 null로 초기화
    - `loading` ref를 expose하여 router guard가 초기화 완료를 기다릴 수 있도록 함
  - `src/App.vue` 또는 `src/main.js` 수정: 앱 마운트 시 `auth.initialize()` 호출
  - 기존 `setRole()`/`clearRole()` 함수는 호환성을 위해 유지하되, 내부적으로 profile에서 role을 가져오도록 변경

  **Must NOT do**:
  - localStorage에 수동으로 세션 저장 금지 (Supabase SDK의 persistSession에 의존)
  - TypeScript 사용 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 전역 상태 관리 + 비동기 인증 흐름 + 이벤트 리스너 조합이 복잡
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 2 시작)
  - **Blocks**: Tasks 5, 6, 7-19
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/stores/auth.js:1-17` — 현재 전체 auth 스토어 코드 (role ref만 존재, defineStore Composition API 패턴)
  - `src/main.js:1-13` — 앱 부트스트랩 (createApp → Pinia → Router → mount)
  - `src/App.vue:1-19` — auth 스토어 사용 패턴 (useAuthStore, auth.role 참조)

  **External References**:
  - Supabase Vue 3 공식 예제: `onMounted(() => { supabase.auth.getSession().then(...); supabase.auth.onAuthStateChange(...) })`
  - Supabase `getSession()` — 기존 세션 복구
  - Supabase `onAuthStateChange()` — 실시간 인증 이벤트 리스너

  **WHY Each Reference Matters**:
  - `auth.js` — 기존 스토어의 `setRole`/`clearRole`을 호환 유지하면서 확장
  - `main.js`/`App.vue` — initialize() 호출 위치 결정 (mount 전 vs mount 후)

  **Acceptance Criteria**:
  - [ ] auth 스토어에 user, profile, role, session, loading, error 상태 존재
  - [ ] `initialize()` 함수가 앱 시작 시 호출됨
  - [ ] `onAuthStateChange` 리스너가 등록됨
  - [ ] 페이지 새로고침 후에도 인증 상태 유지
  - [ ] `signOut()` 호출 시 모든 상태 초기화
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 세션 영속성 확인
    Tool: Playwright (playwright skill)
    Preconditions: Supabase에 테스트 사용자 존재, dev server 실행 중
    Steps:
      1. 로그인 수행 (카카오 OAuth 또는 localStorage에 테스트 세션 주입)
      2. page.reload() 실행
      3. page.waitForTimeout(2000) — auth 초기화 대기
      4. 홈 화면이 표시되는지 확인 (로그인 페이지로 돌아가지 않음)
    Expected Result: 새로고침 후에도 인증 상태 유지, 홈 화면 표시
    Failure Indicators: /login으로 리다이렉트, auth.user가 null
    Evidence: .sisyphus/evidence/task-4-session-persistence.png

  Scenario: signOut 후 상태 초기화 확인
    Tool: Playwright (playwright skill)
    Preconditions: 인증된 상태
    Steps:
      1. 설정 페이지에서 로그아웃 실행 (또는 콘솔에서 auth.signOut() 호출)
      2. 현재 URL이 /login인지 확인
      3. page.reload() 후에도 /login 유지 확인
    Expected Result: 로그아웃 후 /login 이동, 새로고침해도 /login 유지
    Failure Indicators: 로그아웃 후에도 홈 화면 접근 가능
    Evidence: .sisyphus/evidence/task-4-signout.png
  ```

  **Commit**: YES
  - Message: `feat(auth): expand auth store with Supabase session management`
  - Files: `src/stores/auth.js`, `src/main.js` 또는 `src/App.vue`
  - Pre-commit: `npm run build`

- [x] 5. 카카오 OAuth 로그인 플로우

  **What to do**:
  - `src/views/login/LoginView.vue` 수정:
    - `handleKakao()` 변경: `router.push('/onboarding/role')` → `supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: window.location.origin + '/auth/callback' } })`
    - `import { supabase } from '@/lib/supabase'` 추가
    - 로딩 상태 ref 추가: OAuth 리다이렉트 중 버튼 비활성화
    - `handleEmail()` 은 `alert('준비 중입니다')` 그대로 유지
  - **중요**: signInWithOAuth 호출 시 브라우저가 카카오 인증 페이지로 리다이렉트됨. 인증 완료 후 `/auth/callback`으로 돌아옴 (Task 3에서 처리)

  **Must NOT do**:
  - 이메일 로그인 구현 금지 (기존 alert 유지)
  - LoginView.css 수정 금지
  - 카카오 REST API 직접 호출 금지 (Supabase OAuth 사용)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: OAuth 플로우 연동 + 에러 처리 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 4 이후)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/views/login/LoginView.vue:49-54` — 현재 스크립트: `handleKakao() { router.push('/onboarding/role') }`, `handleEmail() { alert('준비 중입니다') }`
  - `src/views/login/LoginView.vue:20-25` — 카카오 버튼 템플릿 (`@click="handleKakao"`)

  **External References**:
  - Supabase signInWithOAuth: `supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: '...' } })`
  - Supabase 카카오 OAuth 네이티브 지원 문서

  **WHY Each Reference Matters**:
  - `LoginView.vue:49-54` — 정확히 어떤 함수를 교체해야 하는지, 어떤 import가 필요한지 확인
  - `LoginView.vue:20-25` — 버튼 구조를 변경하지 않고 핸들러만 교체

  **Acceptance Criteria**:
  - [ ] 카카오 버튼 클릭 시 카카오 인증 페이지로 리다이렉트
  - [ ] redirectTo가 `/auth/callback` 경로를 포함
  - [ ] 이메일 버튼은 여전히 '준비 중입니다' alert 표시
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 카카오 OAuth 리다이렉트 시작
    Tool: Playwright (playwright skill)
    Preconditions: dev server 실행 중
    Steps:
      1. page.goto('http://localhost:5173/login')
      2. page.click('.login-view__btn--kakao')
      3. page.waitForURL('**/kauth.kakao.com/**', { timeout: 10000 }) 또는 URL 변경 확인
    Expected Result: URL이 kakao.com 인증 페이지로 변경됨
    Failure Indicators: 페이지가 변하지 않음, 콘솔 에러
    Evidence: .sisyphus/evidence/task-5-kakao-redirect.png

  Scenario: 이메일 로그인 버튼이 기존 동작 유지
    Tool: Playwright (playwright skill)
    Preconditions: dev server 실행 중
    Steps:
      1. page.goto('http://localhost:5173/login')
      2. page.on('dialog', dialog => dialog.accept())
      3. page.click('.login-view__btn--email')
      4. dialog 메시지가 '준비 중입니다'인지 확인
    Expected Result: alert('준비 중입니다') 표시
    Failure Indicators: 다른 페이지로 이동, 에러 발생
    Evidence: .sisyphus/evidence/task-5-email-alert.png
  ```

  **Commit**: YES
  - Message: `feat(auth): implement Kakao OAuth login flow`
  - Files: `src/views/login/LoginView.vue`
  - Pre-commit: `npm run build`

- [x] 6. 온보딩 플로우 (역할 선택 + 프로필 저장)

  **What to do**:
  - `src/views/onboarding/RoleSelectView.vue` 수정:
    - `handleNext()`: 기존 `auth.setRole()` + `router.push()` 유지하되, 추가로 profiles 테이블에 role INSERT/UPDATE 수행
    - auth.user.id를 profiles.id로 사용
    - "초대 코드를 받으셨나요?" 링크는 기존 동작 유지
  - `src/views/onboarding/MemberProfileView.vue` 수정:
    - 폼 제출 시 `profiles` 테이블 UPDATE (name, phone, photo_url) + `member_profiles` INSERT (age, height, weight, goals, notes)
    - 성공 시 `router.push('/home')`
    - 에러 시 인라인 에러 메시지 표시
  - `src/views/trainer/TrainerProfileView.vue` 수정:
    - 폼 제출 시 `profiles` 테이블 UPDATE (name, phone, photo_url) + `trainer_profiles` INSERT (specialties, bio)
    - 성공 시 `router.push('/trainer/home')`
  - 모든 뷰에서 `import { supabase } from '@/lib/supabase'` 사용

  **Must NOT do**:
  - CSS 파일 수정 금지
  - 기존 UI 구조/레이아웃 변경 금지
  - 프로필 수정 기능 추가 금지 (생성만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 여러 뷰 파일 수정 + 다중 테이블 INSERT + 에러 처리
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 5 이후)
  - **Blocks**: Tasks 7-19
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - `src/views/onboarding/RoleSelectView.vue:62-79` — 현재 handleNext(): setRole + router.push
  - `src/views/onboarding/MemberProfileView.vue` — 회원 프로필 폼 구조
  - `src/views/trainer/TrainerProfileView.vue` — 트레이너 프로필 폼 구조

  **External References**:
  - Supabase insert: `supabase.from('profiles').insert({ id: user.id, role, name }).select()`
  - Supabase update: `supabase.from('profiles').update({ name }).eq('id', user.id)`

  **WHY Each Reference Matters**:
  - `RoleSelectView.vue:62-79` — setRole 호출 패턴을 유지하면서 DB INSERT 추가
  - 프로필 뷰들 — 폼 필드 구조를 확인하여 DB 컬럼과 매핑

  **Acceptance Criteria**:
  - [ ] 역할 선택 후 profiles 테이블에 role이 저장됨
  - [ ] 트레이너 프로필 저장 시 profiles + trainer_profiles에 데이터 존재
  - [ ] 회원 프로필 저장 시 profiles + member_profiles에 데이터 존재
  - [ ] 온보딩 완료 후 올바른 홈으로 이동 (trainer→/trainer/home, member→/home)
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 전체 온보딩 플로우 (트레이너)
    Tool: Playwright (playwright skill)
    Preconditions: 인증된 신규 사용자 상태, dev server 실행 중
    Steps:
      1. /onboarding/role 페이지에서 '트레이너' 카드 클릭
      2. '다음' 버튼 클릭
      3. 트레이너 프로필 폼에 이름, 전문분야 입력
      4. '완료' 또는 '다음' 버튼 클릭
      5. URL이 /trainer/home으로 변경됨 확인
    Expected Result: /trainer/home 도착, DB에 profiles + trainer_profiles 레코드 생성
    Failure Indicators: 에러 메시지, 다른 페이지로 이동, DB에 데이터 없음
    Evidence: .sisyphus/evidence/task-6-onboarding-trainer.png

  Scenario: 프로필 저장 실패 시 에러 처리
    Tool: Playwright (playwright skill)
    Preconditions: Supabase가 에러를 반환하는 상태 (네트워크 차단 또는 잘못된 데이터)
    Steps:
      1. 프로필 폼에 필수 필드 비운 채 제출
      2. 인라인 에러 메시지 표시 확인
      3. 페이지 이동 없음 확인
    Expected Result: 에러 메시지 표시, 페이지 유지
    Failure Indicators: 무반응, 빈 화면으로 이동
    Evidence: .sisyphus/evidence/task-6-onboarding-error.png
  ```

  **Commit**: YES
  - Message: `feat(onboarding): connect role selection and profile creation to Supabase`
  - Files: `src/views/onboarding/RoleSelectView.vue`, `src/views/onboarding/MemberProfileView.vue`, `src/views/trainer/TrainerProfileView.vue`
  - Pre-commit: `npm run build`

### Wave 3 — Core Data (max parallel, all depend on Task 6)

- [x] 7. useMembers 컴포저블 + TrainerMemberView 연동

  **What to do**:
  - `src/composables/useMembers.js` 생성:
    - `fetchMembers()` — trainer_members + profiles + member_profiles + reservations 집계 쿼리 (auth.uid() as trainer_id)
    - 데이터를 기존 목 데이터 형태로 변환: `{id, name, photo, sub, dotStatus, done, total, barColor, group}`
      - `done`/`total`: 해당 회원의 completed/total 예약 수
      - `barColor`: done/total 비율 기반 (높으면 green, 낮으면 red)
      - `dotStatus`: 최근 예약 상태 기반
      - `group`: member_profiles.goals 또는 기본값
    - Return `{ members, loading, error, fetchMembers }`
  - `src/views/trainer/TrainerMemberView.vue` 수정:
    - 하드코딩된 members 배열 (lines 173-239) 제거, `useMembers()` 사용
    - `onMounted(() => fetchMembers())` 추가
    - `v-if="loading"` 로딩 가드 추가
    - 나머지 템플릿/CSS 변경 없음

  **Must NOT do**:
  - CSS 파일 수정 금지
  - 뷰에서 supabase 직접 호출 금지 (컴포저블만)
  - 그룹 필터링 로직 변경 금지 (기존 UI 유지)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 복잡한 JOIN 쿼리 + 데이터 변환 + 집계 로직
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 10, 11)
  - **Blocks**: Tasks 12, 16
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberView.vue:173-239` — 회원 목 데이터: `{id, name, photo, sub, dotStatus, done, total, barColor, group}` (5명의 목 회원)

  **External References**:
  - Supabase select with joins: `supabase.from('trainer_members').select('*, profiles(*), member_profiles(*)')`

  **WHY Each Reference Matters**:
  - 목 데이터 구조를 정확히 매칭해야 템플릿 변경 없이 연동 가능

  **Acceptance Criteria**:
  - [ ] `src/composables/useMembers.js` 존재
  - [ ] TrainerMemberView에서 하드코딩된 배열 제거됨
  - [ ] 실제 DB 데이터가 회원 목록으로 표시됨
  - [ ] 로딩 상태 처리 존재
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 트레이너 회원 목록 실제 데이터 표시
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 계정 로그인, 연결된 회원 1명 이상 존재
    Steps:
      1. page.goto('http://localhost:5173/trainer/members')
      2. page.waitForSelector('.member-card', { timeout: 10000 })
      3. 회원 카드에 실제 이름이 표시되는지 확인 (하드코딩된 '김지영'이 아닌 DB 데이터)
    Expected Result: DB에 등록된 회원의 이름이 카드에 표시
    Failure Indicators: 하드코딩된 이름 표시, 빈 목록, 에러
    Evidence: .sisyphus/evidence/task-7-member-list.png

  Scenario: 회원 없을 때 로딩 후 빈 상태
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 계정 로그인, 연결된 회원 0명
    Steps:
      1. page.goto('http://localhost:5173/trainer/members')
      2. 로딩 표시 확인
      3. 로딩 후 빈 상태 또는 빈 목록 확인
    Expected Result: 에러 없이 빈 목록 표시
    Failure Indicators: 무한 로딩, 에러 표시
    Evidence: .sisyphus/evidence/task-7-member-empty.png
  ```

  **Commit**: YES
  - Message: `feat(members): add useMembers composable and connect TrainerMemberView`
  - Files: `src/composables/useMembers.js`, `src/views/trainer/TrainerMemberView.vue`
  - Pre-commit: `npm run build`

- [x] 8. useInvite 컴포저블 + InviteManageView/InviteEnterView 연동

  **What to do**:
  - `src/composables/useInvite.js` 생성:
    - `fetchInviteCode()` — 트레이너의 활성 초대 코드 조회 (invite_codes WHERE trainer_id = auth.uid() AND is_active = true)
    - `generateInviteCode()` — 6자리 영숫자 코드 생성 + invite_codes INSERT
    - `redeemInviteCode(code)` — `connect_via_invite` RPC 호출하여 트레이너-회원 연결
    - `fetchRecentMembers()` — 최근 이 트레이너에게 연결된 회원 목록
    - Return `{ inviteCode, recentMembers, loading, error, generateInviteCode, redeemInviteCode }`
  - `src/views/invite/InviteManageView.vue` 수정:
    - 하드코딩된 초대 코드 "PT24K9" + recentMembers 제거, 컴포저블 사용
  - `src/views/invite/InviteEnterView.vue` 수정:
    - 코드 입력 → `redeemInviteCode()` 호출
    - 성공 시 연결 완료 메시지 + 홈으로 이동
    - 실패 시 (잘못된 코드) 인라인 에러 메시지

  **Must NOT do**:
  - CSS 파일 수정 금지
  - 초대 코드 형식 하드코딩 금지 (DB에서 관리)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: RPC 호출 + 에러 처리 + 2개 뷰 수정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9, 10, 11)
  - **Blocks**: —
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/views/invite/InviteManageView.vue:68-72` — 하드코딩된 초대 코드 + 최근 회원 목 데이터
  - `src/views/invite/InviteEnterView.vue` — 코드 입력 폼 구조

  **External References**:
  - Supabase RPC 호출: `supabase.rpc('connect_via_invite', { p_code: code })`

  **WHY Each Reference Matters**:
  - InviteManageView 목 데이터 구조를 정확히 매칭해야 템플릿 변경 최소화

  **Acceptance Criteria**:
  - [ ] `src/composables/useInvite.js` 존재
  - [ ] 트레이너 화면에서 실제 초대 코드 표시 (하드코딩 "PT24K9" 아님)
  - [ ] 회원이 올바른 코드 입력 시 트레이너와 연결됨
  - [ ] 잘못된 코드 입력 시 에러 메시지 표시
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 초대 코드 생성 및 표시
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 계정 로그인
    Steps:
      1. page.goto('http://localhost:5173/invite/manage')
      2. 초대 코드가 "PT24K9"이 아닌 실제 DB 코드로 표시됨 확인
      3. 코드 복사 버튼 동작 확인
    Expected Result: DB에서 조회된 실제 초대 코드 표시
    Failure Indicators: 하드코딩된 코드, 빈 영역
    Evidence: .sisyphus/evidence/task-8-invite-code.png

  Scenario: 잘못된 초대 코드 입력 시 에러
    Tool: Playwright (playwright skill)
    Preconditions: 회원 계정 로그인
    Steps:
      1. page.goto('http://localhost:5173/invite/enter')
      2. 코드 입력 필드에 'WRONGCODE' 입력
      3. 확인 버튼 클릭
      4. 에러 메시지 표시 확인
    Expected Result: "유효하지 않은 코드" 등의 에러 메시지 표시
    Failure Indicators: 무반응, 성공 처리
    Evidence: .sisyphus/evidence/task-8-invite-error.png
  ```

  **Commit**: YES
  - Message: `feat(invite): add useInvite composable and connect invite views`
  - Files: `src/composables/useInvite.js`, `src/views/invite/InviteManageView.vue`, `src/views/invite/InviteEnterView.vue`
  - Pre-commit: `npm run build`

- [x] 9. useWorkHours 컴포저블 + WorkTimeSettingView 연동

  **What to do**:
  - `src/composables/useWorkHours.js` 생성:
    - `fetchWorkHours()` — work_schedules WHERE trainer_id = auth.uid(). 데이터를 기존 형태로 변환: `{id, label, enabled, start, end}`
    - `saveWorkHours(schedules)` — 각 요일별 work_schedules UPSERT (ON CONFLICT trainer_id, day_of_week)
    - Return `{ days, unitOptions, loading, error, fetchWorkHours, saveWorkHours }`
  - `src/views/trainer/WorkTimeSettingView.vue` 수정:
    - 하드코딩된 days 배열 (lines 128-145) 제거, 컴포저블 사용
    - onMounted에서 fetchWorkHours() 호출
    - 저장 버튼 클릭 시 saveWorkHours() 호출
    - 저장 성공/실패 피드백

  **Must NOT do**:
  - CSS 파일 수정 금지
  - unitOptions (슬롯 시간 단위) 로직 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: UPSERT 패턴 + 데이터 변환
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 10, 11)
  - **Blocks**: Tasks 13, 15
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/views/trainer/WorkTimeSettingView.vue:128-145` — 근무시간 목 데이터: `{id, label, enabled, start, end}` (7일)

  **WHY Each Reference Matters**:
  - 기존 days 배열 구조를 정확히 매칭해야 토글/시간 선택 UI 변경 없이 연동

  **Acceptance Criteria**:
  - [ ] `src/composables/useWorkHours.js` 존재
  - [ ] 근무시간 설정 저장 후 DB에 데이터 존재
  - [ ] 페이지 새로고침 시 저장된 근무시간 로드
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 근무시간 저장 및 영속성
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 계정 로그인
    Steps:
      1. page.goto('http://localhost:5173/trainer/settings/work-time')
      2. 월요일 토글 ON, 시작시간 09:00, 종료시간 18:00 설정
      3. 저장 버튼 클릭
      4. page.reload()
      5. 월요일이 09:00-18:00으로 표시되는지 확인
    Expected Result: 새로고침 후에도 설정값 유지
    Failure Indicators: 저장 전 값으로 리셋, 에러
    Evidence: .sisyphus/evidence/task-9-workhours-persist.png
  ```

  **Commit**: YES
  - Message: `feat(work-hours): add useWorkHours composable and connect settings`
  - Files: `src/composables/useWorkHours.js`, `src/views/trainer/WorkTimeSettingView.vue`
  - Pre-commit: `npm run build`

- [x] 10. useTrainerSearch 컴포저블 + TrainerSearchView 연동

  **What to do**:
  - `src/composables/useTrainerSearch.js` 생성:
    - `searchTrainers(query)` — profiles WHERE role='trainer' + trainer_profiles, 이름/전문분야로 검색 (ILIKE)
    - `requestConnection(trainerId)` — trainer_members INSERT (status='active', 즉시 연결) 또는 별도 승인 플로우
    - Return `{ trainers, loading, error, searchTrainers, requestConnection }`
  - `src/views/trainer/TrainerSearchView.vue` 수정:
    - 하드코딩된 트레이너 목록 제거, 컴포저블 사용
    - 검색 입력 시 debounce로 `searchTrainers()` 호출
    - 연결 버튼에 `requestConnection()` 연동

  **Must NOT do**:
  - CSS 파일 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 검색 쿼리 + 연결 요청 로직
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9, 11)
  - **Blocks**: —
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerSearchView.vue` — 검색 화면 구조 및 목 데이터

  **External References**:
  - Supabase text search: `supabase.from('profiles').select('*, trainer_profiles(*)').eq('role', 'trainer').ilike('name', '%query%')`

  **Acceptance Criteria**:
  - [ ] `src/composables/useTrainerSearch.js` 존재
  - [ ] 이름으로 트레이너 검색 가능
  - [ ] 연결 요청 시 trainer_members 테이블에 데이터 생성
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 트레이너 이름 검색
    Tool: Playwright (playwright skill)
    Preconditions: 회원 계정 로그인, DB에 트레이너 프로필 존재
    Steps:
      1. page.goto('http://localhost:5173/search')
      2. 검색 입력 필드에 트레이너 이름 일부 입력
      3. 검색 결과 목록에 해당 트레이너 표시 확인
    Expected Result: 검색어에 매칭되는 트레이너 카드 표시
    Failure Indicators: 빈 결과, 에러
    Evidence: .sisyphus/evidence/task-10-trainer-search.png
  ```

  **Commit**: YES
  - Message: `feat(search): add useTrainerSearch composable and connect search view`
  - Files: `src/composables/useTrainerSearch.js`, `src/views/trainer/TrainerSearchView.vue`
  - Pre-commit: `npm run build`

- [x] 11. useProfile 컴포저블 + 프로필 이미지 업로드

  **What to do**:
  - `src/composables/useProfile.js` 생성:
    - `uploadAvatar(file)` — Supabase Storage `avatars` 버킷에 업로드. 파일명: `{userId}/{timestamp}.{ext}`. 공개 URL 반환
    - `updateProfilePhoto(url)` — profiles.photo_url UPDATE
    - `getAvatarUrl(path)` — Storage에서 공개 URL 조회
    - Return `{ uploading, error, uploadAvatar, getAvatarUrl }`
  - 온보딩 뷰에 연동:
    - `MemberProfileView.vue`: 프로필 사진 선택 시 `uploadAvatar()` 호출, URL을 폼 데이터에 포함
    - `TrainerProfileView.vue`: 동일 패턴

  **Must NOT do**:
  - CSS 파일 수정 금지
  - 프로필 수정 화면 추가 금지 (온보딩 시 생성만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Storage 업로드 + 파일 처리 + 뷰 연동
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9, 10)
  - **Blocks**: —
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/views/onboarding/MemberProfileView.vue` — 프로필 사진 영역 구조
  - `src/views/trainer/TrainerProfileView.vue` — 프로필 사진 영역 구조

  **External References**:
  - Supabase Storage upload: `supabase.storage.from('avatars').upload(filePath, file)`
  - Supabase Storage public URL: `supabase.storage.from('avatars').getPublicUrl(filePath)`

  **Acceptance Criteria**:
  - [ ] `src/composables/useProfile.js` 존재
  - [ ] 이미지 선택 시 Storage에 업로드 성공
  - [ ] 업로드된 이미지 URL이 profiles.photo_url에 저장
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 프로필 이미지 업로드
    Tool: Playwright (playwright skill)
    Preconditions: 인증된 사용자, 온보딩 프로필 폼 표시
    Steps:
      1. 프로필 사진 영역 클릭 또는 파일 input에 테스트 이미지 설정
      2. 업로드 완료 대기
      3. 프로필 저장 후 DB의 photo_url 필드에 값 존재 확인
    Expected Result: Storage에 파일 업로드, profiles.photo_url에 URL 저장
    Failure Indicators: 업로드 실패 에러, photo_url이 null
    Evidence: .sisyphus/evidence/task-11-avatar-upload.png
  ```

  **Commit**: YES
  - Message: `feat(profile): add useProfile composable with image upload`
  - Files: `src/composables/useProfile.js`, `src/views/onboarding/MemberProfileView.vue`, `src/views/trainer/TrainerProfileView.vue`
  - Pre-commit: `npm run build`

- [x] 12. useMemos 컴포저블 + TrainerMemberDetailView 연동

  **What to do**:
  - `src/composables/useMemos.js` 생성:
    - `fetchMemberDetail(memberId)` — profiles + member_profiles + trainer_members JOIN으로 회원 상세 정보 조회
    - `fetchMemos(memberId)` — memos WHERE trainer_id = auth.uid() AND member_id = memberId, ORDER BY created_at DESC
    - 데이터를 기존 목 데이터 형태로 변환: `{id, name, summary, lastVisit, nextSession, memos: [{id, content, tags, date}]}`
    - Return `{ member, memos, loading, error, fetchMemberDetail, fetchMemos }`
  - `src/views/trainer/TrainerMemberDetailView.vue` 수정:
    - 하드코딩된 member + memos 데이터 (lines 132-164) 제거, 컴포저블 사용
    - route params에서 memberId 추출: `const route = useRoute(); const memberId = route.params.id`
    - onMounted에서 fetchMemberDetail + fetchMemos 호출
    - MemoWriteView 연동은 하지 않음 (목 데이터 유지)

  **Must NOT do**:
  - CSS 파일 수정 금지
  - MemoWriteView 연동 금지 (읽기만)
  - 뷰에서 supabase 직접 호출 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 복잡한 JOIN 쿼리 + 데이터 변환
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 7 완료 후)
  - **Parallel Group**: Wave 3 (Task 7 이후)
  - **Blocks**: —
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerMemberDetailView.vue:132-164` — 회원 상세 + 메모 목 데이터 구조

  **WHY Each Reference Matters**:
  - 목 데이터 구조를 정확히 매칭해야 상세 페이지 템플릿 변경 없이 연동

  **Acceptance Criteria**:
  - [ ] `src/composables/useMemos.js` 존재
  - [ ] 회원 상세 페이지에서 실제 회원 정보 표시
  - [ ] 메모 목록이 DB에서 조회되어 표시
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 회원 상세 페이지 실제 데이터
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 로그인, 연결된 회원 존재, 메모 1건 이상
    Steps:
      1. page.goto('http://localhost:5173/trainer/members/{memberId}')
      2. 회원 이름이 DB 데이터와 일치하는지 확인
      3. 메모 목록에 실제 내용 표시 확인
    Expected Result: DB의 회원 정보 + 메모 표시
    Failure Indicators: 하드코딩된 데이터, 빈 화면
    Evidence: .sisyphus/evidence/task-12-member-detail.png
  ```

  **Commit**: YES
  - Message: `feat(memos): add useMemos composable and connect member detail view`
  - Files: `src/composables/useMemos.js`, `src/views/trainer/TrainerMemberDetailView.vue`
  - Pre-commit: `npm run build`

### Wave 4 — Reservation + Dashboard (depends on Wave 3)

- [x] 13. useReservations 컴포저블 + MemberReservationView 연동

  **What to do**:
  - `src/composables/useReservations.js` 생성:
    - `fetchAvailableSlots(trainerId, date)` — work_schedules에서 해당 요일 근무시간 조회 → slot_duration으로 분할 → 기존 예약 제외 → 가용 슬롯 반환
    - `createReservation(trainerId, date, startTime, endTime, sessionType)` — `create_reservation` RPC 호출 또는 직접 INSERT + UNIQUE constraint로 충돌 방지
    - `fetchMyReservations(role)` — 현재 사용자의 예약 목록 (role에 따라 trainer_id 또는 member_id 기준)
    - `updateReservationStatus(id, status)` — 예약 상태 UPDATE (approve/reject/cancel/complete)
    - 슬롯 데이터를 기존 형태로 변환: `{label: '09:00', val: '09:00', status: 'available'|'booked'|'disabled'}`
    - Return `{ slots, reservations, loading, error, fetchAvailableSlots, createReservation, fetchMyReservations, updateReservationStatus }`
  - `src/views/member/MemberReservationView.vue` 수정:
    - 하드코딩된 amTimes/pmTimes/eveningTimes (lines 167-182) 제거
    - 날짜 선택 시 `fetchAvailableSlots(trainerId, selectedDate)` 호출
    - 시간 선택 + 예약 버튼 → `createReservation()` 호출
    - 예약 성공/실패 피드백

  **Must NOT do**:
  - CSS 파일 수정 금지
  - 시간 표시 형식 변경 금지 (기존 "09:00" 형태 유지)
  - 중복 예약 방지를 프론트엔드에만 의존 금지 (DB constraint 활용)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 근무시간 → 슬롯 계산 → 기존 예약 제외 복잡 로직
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 4 시작)
  - **Blocks**: Tasks 14, 15
  - **Blocked By**: Task 9

  **References**:

  **Pattern References**:
  - `src/views/member/MemberReservationView.vue:167-182` — 시간대 슬롯 목 데이터: amTimes/pmTimes/eveningTimes `{label, val, status}[]`
  - `src/views/trainer/WorkTimeSettingView.vue:128-145` — 근무시간 구조 (슬롯 계산 기준)

  **External References**:
  - Supabase RPC: `supabase.rpc('create_reservation', { ... })`

  **WHY Each Reference Matters**:
  - MemberReservationView의 슬롯 구조를 정확히 매칭해야 시간 선택 UI 변경 없이 연동
  - WorkTimeSettingView의 근무시간 구조를 기반으로 가용 슬롯 계산

  **Acceptance Criteria**:
  - [ ] `src/composables/useReservations.js` 존재
  - [ ] 날짜 선택 시 근무시간 기반 가용 슬롯 표시
  - [ ] 예약 생성 시 DB에 'pending' 상태로 저장
  - [ ] 이미 예약된 슬롯은 'booked'으로 표시
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 예약 가능 시간 표시
    Tool: Playwright (playwright skill)
    Preconditions: 회원 로그인, 트레이너와 연결됨, 트레이너 근무시간 설정됨
    Steps:
      1. page.goto('http://localhost:5173/member/reservation')
      2. 캘린더에서 평일 날짜 선택
      3. 시간대 슬롯이 트레이너 근무시간에 맞게 표시되는지 확인
      4. 이미 예약된 시간은 'booked' 상태로 비활성화
    Expected Result: 근무시간 내 시간만 선택 가능, 예약 있는 시간은 비활성화
    Failure Indicators: 하드코딩된 시간 표시, 모든 시간 활성화
    Evidence: .sisyphus/evidence/task-13-available-slots.png

  Scenario: 예약 생성 성공
    Tool: Playwright (playwright skill)
    Preconditions: 가용 슬롯이 있는 상태
    Steps:
      1. 시간 슬롯 클릭
      2. 예약 확인 버튼 클릭
      3. 성공 메시지 또는 화면 전환 확인
    Expected Result: DB에 'pending' 예약 생성, 성공 피드백
    Failure Indicators: 에러, 예약 미생성
    Evidence: .sisyphus/evidence/task-13-reservation-created.png
  ```

  **Commit**: YES
  - Message: `feat(reservation): add useReservations composable and connect MemberReservationView`
  - Files: `src/composables/useReservations.js`, `src/views/member/MemberReservationView.vue`
  - Pre-commit: `npm run build`

- [x] 14. ReservationManageView 연동 (예약 승인/거절)

  **What to do**:
  - `src/views/trainer/ReservationManageView.vue` 수정:
    - 하드코딩된 reservations 배열 (lines 215-266) 제거
    - `useReservations()` 컴포저블에서 `fetchMyReservations('trainer')` 사용
    - 승인 버튼 → `updateReservationStatus(id, 'approved')`
    - 거절 버튼 → `updateReservationStatus(id, 'rejected')`
    - 상태 변경 후 목록 자동 새로고침
    - 회원 이름은 reservations + profiles JOIN으로 표시

  **Must NOT do**:
  - CSS 파일 수정 금지
  - 기존 UI 구조 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 기존 컴포저블 활용 + 상태 업데이트
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 13 이후)
  - **Blocks**: Task 15
  - **Blocked By**: Task 13

  **References**:

  **Pattern References**:
  - `src/views/trainer/ReservationManageView.vue:215-266` — 예약 목 데이터: `{id, name, sessionType, date, time, remaining, status, elapsed}`

  **Acceptance Criteria**:
  - [ ] 하드코딩된 예약 데이터 제거됨
  - [ ] 실제 pending 예약 목록 표시
  - [ ] 승인 시 status가 'approved'로 변경
  - [ ] 거절 시 status가 'rejected'로 변경
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 예약 승인 플로우
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 로그인, pending 예약 1건 이상
    Steps:
      1. page.goto('http://localhost:5173/trainer/reservations')
      2. pending 예약 카드의 승인 버튼 클릭
      3. 해당 예약이 approved 상태로 변경되거나 목록에서 이동됨
    Expected Result: 예약 상태가 'approved'로 변경
    Failure Indicators: 상태 미변경, 에러
    Evidence: .sisyphus/evidence/task-14-approve.png
  ```

  **Commit**: YES
  - Message: `feat(reservation): connect ReservationManageView with approve/reject`
  - Files: `src/views/trainer/ReservationManageView.vue`
  - Pre-commit: `npm run build`

- [x] 15. 캘린더 뷰 연동 (TrainerScheduleView + MemberScheduleView)

  **What to do**:
  - `src/views/trainer/TrainerScheduleView.vue` 수정:
    - 하드코딩된 dotData + sessions + weeklySessionData (lines 327-491) 제거
    - `useReservations()` 컴포저블에서 월별 예약 데이터 조회
    - 캘린더 dots 계산: pending→'pending'(yellow), approved→'approved'(blue), completed→'done'(green), cancelled→'cancelled'(red) — AppCalendar의 dots prop 형태: `{ [day]: ['status', ...] }`
    - 선택한 날짜의 세션 카드 목록 표시
  - `src/views/member/MemberScheduleView.vue` 수정:
    - 동일한 패턴으로 하드코딩된 dotData + sessionData (lines 170-269) 제거
    - 회원 관점의 예약 데이터로 캘린더 + 세션 목록 표시

  **Must NOT do**:
  - CSS 파일 수정 금지
  - AppCalendar 컴포넌트의 props 인터페이스 변경 금지
  - dots 형식 변경 금지 (기존 `{ day: ['status'] }` 유지)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 2개 뷰 수정 + 예약 데이터 → 캘린더 dots 변환 로직
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Tasks 13, 14 이후)
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 9, 13, 14

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerScheduleView.vue:327-491` — dotData + sessions 목 데이터
  - `src/views/member/MemberScheduleView.vue:170-269` — 회원 측 캘린더 목 데이터
  - `src/components/AppCalendar.vue` — dots prop 형식: `{ [day]: ['pending'|'approved'|'done'|'cancelled'] }`

  **WHY Each Reference Matters**:
  - AppCalendar의 dots prop 형식을 정확히 맞춰야 캘린더에 올바른 색상 점 표시

  **Acceptance Criteria**:
  - [ ] 하드코딩된 캘린더 데이터 제거됨
  - [ ] 실제 예약에 따른 캘린더 dots 표시
  - [ ] 날짜 선택 시 해당 날짜 세션 카드 표시
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 트레이너 캘린더에 예약 dots 표시
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 로그인, approved 예약 1건 이상
    Steps:
      1. page.goto('http://localhost:5173/trainer/schedule')
      2. 예약이 있는 날짜에 컬러 dot 표시 확인
      3. 해당 날짜 클릭 시 세션 카드 표시 확인
    Expected Result: 예약 상태에 따른 색상 dots + 세션 카드
    Failure Indicators: dots 없음, 하드코딩 데이터 표시
    Evidence: .sisyphus/evidence/task-15-calendar-dots.png
  ```

  **Commit**: YES
  - Message: `feat(calendar): connect schedule views with real reservation data`
  - Files: `src/views/trainer/TrainerScheduleView.vue`, `src/views/member/MemberScheduleView.vue`
  - Pre-commit: `npm run build`

- [x] 16. 대시보드 연동 (TrainerHomeView + MemberHomeView)

  **What to do**:
  - `src/views/trainer/TrainerHomeView.vue` 수정:
    - 하드코딩된 reservationCount (line 170) → pending 예약 수 집계 쿼리
    - 트레이너 이름: auth 스토어의 profile.name
    - 오늘 수업 목록: reservations WHERE date = today AND status = 'approved'
  - `src/views/home/MemberHomeView.vue` 수정:
    - 하드코딩된 userName, nextSession, ptCount, todayWorkouts, weekGoal (lines 165-187) 제거
    - userName: auth 스토어의 profile.name
    - nextSession: 다음 approved 예약 조회
    - ptCount: completed 예약 수/총 예약 수

  **Must NOT do**:
  - CSS 파일 수정 금지
  - 대시보드 레이아웃 구조 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 집계 쿼리 + 2개 뷰 연동
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 15 이후)
  - **Blocks**: —
  - **Blocked By**: Tasks 7, 15

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerHomeView.vue:170` — reservationCount 하드코딩
  - `src/views/home/MemberHomeView.vue:165-187` — 대시보드 목 데이터

  **Acceptance Criteria**:
  - [ ] 트레이너 홈에 실제 pending 예약 수 표시
  - [ ] 회원 홈에 실제 사용자 이름 + 다음 수업 정보 표시
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 트레이너 홈 실제 데이터
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 로그인, pending 예약 존재
    Steps:
      1. page.goto('http://localhost:5173/trainer/home')
      2. 예약 요청 수가 0이 아닌 실제 값 표시 확인
      3. 트레이너 이름이 DB 프로필과 일치 확인
    Expected Result: 실제 DB 데이터 기반 대시보드
    Failure Indicators: 하드코딩된 숫자/이름
    Evidence: .sisyphus/evidence/task-16-trainer-home.png
  ```

  **Commit**: YES
  - Message: `feat(dashboard): connect home views with aggregated data`
  - Files: `src/views/trainer/TrainerHomeView.vue`, `src/views/home/MemberHomeView.vue`
  - Pre-commit: `npm run build`

- [x] 17. SettingsView + MemberSettingsView 연동 + 로그아웃

  **What to do**:
  - `src/views/trainer/SettingsView.vue` 수정:
    - 하드코딩된 user 객체 (lines 160-163) → auth 스토어의 profile 데이터
    - 로그아웃 버튼 → `auth.signOut()` 호출 + `router.push('/login')`
  - `src/views/member/MemberSettingsView.vue` 수정:
    - 동일 패턴: auth 스토어에서 사용자 정보 표시
    - 로그아웃 연동

  **Must NOT do**:
  - CSS 파일 수정 금지
  - 계정 삭제 기능 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 간단한 스토어 데이터 바인딩 + signOut 연동
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (독립적, Task 4에만 의존)
  - **Blocks**: —
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `src/views/trainer/SettingsView.vue:160-163` — 하드코딩된 user: `{ name, email }`
  - `src/views/member/MemberSettingsView.vue` — 회원 설정 뷰

  **Acceptance Criteria**:
  - [ ] 설정 화면에 실제 사용자 이름 표시
  - [ ] 로그아웃 시 세션 종료 + /login 이동
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 로그아웃 플로우
    Tool: Playwright (playwright skill)
    Preconditions: 인증된 상태
    Steps:
      1. page.goto('http://localhost:5173/trainer/settings')
      2. 로그아웃 버튼 클릭
      3. URL이 /login으로 변경됨 확인
      4. page.reload() → /login 유지 확인
    Expected Result: 로그아웃 후 /login, 새로고침해도 /login
    Failure Indicators: 홈으로 돌아감, 세션 유지됨
    Evidence: .sisyphus/evidence/task-17-logout.png
  ```

  **Commit**: YES
  - Message: `feat(settings): connect settings views and implement logout`
  - Files: `src/views/trainer/SettingsView.vue`, `src/views/member/MemberSettingsView.vue`
  - Pre-commit: `npm run build`

### Wave 5 — Integration + Polish (depends on Waves 3-4)

- [x] 18. 미연결 회원 상태 처리 + 빈 상태 UI

  **What to do**:
  - `src/views/home/MemberHomeView.vue` 수정:
    - 트레이너 연결 여부 확인: `trainer_members WHERE member_id = auth.uid() AND status = 'active'`
    - 미연결 시: "아직 담당 트레이너가 없습니다" 메시지 + "트레이너 찾기" 버튼 (`router.push('/search')`)
    - 연결 시: 기존 대시보드 표시 (Task 16에서 구현)
  - 빈 상태 추가:
    - `TrainerMemberView`: 회원 0명 → "아직 등록된 회원이 없습니다. 초대 코드를 공유해보세요!" + 초대관리 링크
    - `ReservationManageView`: 예약 0건 → "예약 요청이 없습니다"
    - `TrainerScheduleView`: 선택 날짜 세션 0건 → "오늘 예정된 수업이 없습니다"
    - `MemberScheduleView`: 세션 0건 → "예약된 수업이 없습니다"

  **Must NOT do**:
  - CSS 파일 수정 금지 (빈 상태 텍스트는 기존 CSS 클래스 활용 또는 인라인 scoped style)
  - 빈 상태용 별도 컴포넌트 생성 금지 (간단한 `v-if` + 텍스트로 충분)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 여러 뷰에 걸친 조건부 렌더링 + 빈 상태 처리
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 5)
  - **Blocks**: —
  - **Blocked By**: Tasks 7, 16

  **References**:

  **Pattern References**:
  - `src/views/home/MemberHomeView.vue` — 현재 대시보드 구조
  - `src/views/trainer/TrainerMemberView.vue` — 회원 목록 구조
  - PRD §7 — "미연결 회원용 홈" 설명: "아직 담당 트레이너가 없습니다" + "트레이너 찾기" 버튼

  **WHY Each Reference Matters**:
  - PRD 요구사항을 충족하는 미연결 상태 UI 구현

  **Acceptance Criteria**:
  - [ ] 트레이너 없는 회원 홈에 "트레이너 찾기" 안내 표시
  - [ ] 회원 0명인 트레이너의 회원 목록에 빈 상태 메시지
  - [ ] 예약 0건인 예약관리에 빈 상태 메시지
  - [ ] `npm run build` → 0 errors

  **QA Scenarios:**

  ```
  Scenario: 미연결 회원 홈 화면
    Tool: Playwright (playwright skill)
    Preconditions: 회원 로그인, 트레이너 미연결 상태
    Steps:
      1. page.goto('http://localhost:5173/home')
      2. "트레이너가 없습니다" 또는 유사 메시지 확인
      3. "트레이너 찾기" 버튼 존재 확인
      4. 버튼 클릭 시 /search로 이동 확인
    Expected Result: 미연결 안내 UI + 트레이너 찾기 버튼
    Failure Indicators: 빈 대시보드, 에러 표시
    Evidence: .sisyphus/evidence/task-18-unconnected-member.png

  Scenario: 빈 회원 목록
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 로그인, 연결된 회원 0명
    Steps:
      1. page.goto('http://localhost:5173/trainer/members')
      2. "등록된 회원이 없습니다" 메시지 확인
    Expected Result: 빈 상태 메시지 표시
    Failure Indicators: 빈 화면, 에러
    Evidence: .sisyphus/evidence/task-18-empty-members.png
  ```

  **Commit**: YES
  - Message: `feat(ux): add unconnected member state and empty state handling`
  - Files: `src/views/home/MemberHomeView.vue`, `src/views/trainer/TrainerMemberView.vue`, `src/views/trainer/ReservationManageView.vue`, `src/views/trainer/TrainerScheduleView.vue`, `src/views/member/MemberScheduleView.vue`
  - Pre-commit: `npm run build`

- [x] 19. 전체 통합 빌드 검증 + 에러 처리

  **What to do**:
  - `npm run build` 실행 및 모든 에러 수정
  - 모든 컴포저블에 일관된 에러 처리 추가:
    - `try/catch` around Supabase 호출
    - `error.value` ref 설정하여 뷰에서 인라인 표시
    - 치명적 실패 (예약 생성 실패 등) 시 `alert()` 사용
  - 연동되지 않은 뷰가 여전히 정상 동작하는지 확인:
    - TrainerChatView, MemberChatView — 목 데이터 유지
    - TrainerManualView, ManualRegisterView, ManualDetailView, MemberManualView — 목 데이터 유지
    - TodayWorkoutView — 목 데이터 유지
    - MemberPaymentView, PaymentWriteView — 목 데이터 유지
    - MemoWriteView — 목 데이터 유지
  - 코드 품질 확인:
    - CSS 파일 미변경 확인
    - TypeScript 미사용 확인
    - 모든 import가 `@/` 별칭 사용 확인
    - 뷰에서 supabase 직접 호출 없음 확인 (컴포저블만)
    - `.env.local`이 .gitignore에 포함 확인

  **Must NOT do**:
  - TypeScript 도입 금지
  - CSS 파일 수정 금지
  - 연동 대상이 아닌 뷰의 목 데이터 제거 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 전체 시스템 통합 검증 + 크로스 모듈 에러 수정
  - **Skills**: [`playwright`]
    - `playwright`: 전체 앱 E2E 검증에 필요

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (모든 이전 작업 완료 후)
  - **Blocks**: Final Wave
  - **Blocked By**: ALL previous tasks (1-18)

  **References**:

  **Pattern References**:
  - 모든 수정된 파일
  - `AGENTS.md` — 코딩 컨벤션 및 제약사항

  **WHY Each Reference Matters**:
  - AGENTS.md 컨벤션을 모든 새 코드가 준수하는지 최종 확인

  **Acceptance Criteria**:
  - [ ] `npm run build` → 0 errors
  - [ ] 모든 컴포저블에 try/catch 에러 처리 존재
  - [ ] 연동되지 않은 뷰 (채팅, 매뉴얼, 운동, 수납, 메모작성)가 목 데이터로 정상 렌더링
  - [ ] CSS 파일 변경 없음 (git diff *.css → 변경 0건)
  - [ ] TypeScript 파일 없음 (find src -name "*.ts" → 0건)
  - [ ] 뷰 파일에서 supabase 직접 import 없음 (컴포저블만)

  **QA Scenarios:**

  ```
  Scenario: 전체 빌드 성공
    Tool: Bash
    Preconditions: 모든 이전 작업 완료
    Steps:
      1. npm run build
      2. exit code 확인 → 0
      3. dist/ 디렉토리 존재 확인
    Expected Result: 빌드 성공, dist/ 생성
    Failure Indicators: 빌드 에러, dist/ 미생성
    Evidence: .sisyphus/evidence/task-19-build-success.txt

  Scenario: 미연동 뷰가 정상 동작
    Tool: Playwright (playwright skill)
    Preconditions: 인증된 트레이너, dev server 실행 중
    Steps:
      1. page.goto('http://localhost:5173/trainer/chat') → 목 데이터로 렌더링 확인
      2. page.goto('http://localhost:5173/trainer/settings/manual') → 목 데이터로 렌더링 확인
      3. page.goto('http://localhost:5173/trainer/schedule/workout') → 목 데이터로 렌더링 확인
      4. 각 페이지에서 JS 콘솔 에러 0건 확인
    Expected Result: 모든 미연동 뷰가 에러 없이 렌더링
    Failure Indicators: JS 에러, 빈 화면
    Evidence: .sisyphus/evidence/task-19-unconnected-views.png

  Scenario: 코드 품질 검증
    Tool: Bash (grep)
    Steps:
      1. git diff --name-only -- '*.css' → 변경 0건
      2. find src -name '*.ts' -o -name '*.tsx' → 0건
      3. grep -r 'from.*supabase' src/views/ --include='*.vue' → lib/supabase import만 (composables 경유가 아닌 직접 호출 0건)
    Expected Result: CSS 미변경, TS 없음, 뷰에서 supabase 직접 호출 없음
    Failure Indicators: CSS 변경 감지, TS 파일 존재, 뷰에서 직접 supabase 호출
    Evidence: .sisyphus/evidence/task-19-code-quality.txt
  ```

  **Commit**: YES
  - Message: `fix(integration): resolve cross-module errors and edge cases`
  - Files: various
  - Pre-commit: `npm run build`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` (no tsc — plain JS). Review all changed files for: `as any`/`@ts-ignore` (should be none), empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify all Supabase queries go through composables (no direct `supabase.from()` in views). Verify `.env.local` is in `.gitignore`. Verify no Supabase keys hardcoded in source.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | Composable Pattern [PASS/FAIL] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: login → onboarding → invite code → member view → reservation create → reservation approve → calendar update → dashboard reflect. Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance: no CSS changes, no TypeScript, no chat/manual/workout/payment connections. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Scope [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

| Wave | Message | Files | Pre-commit |
|------|---------|-------|------------|
| 1 | `feat(supabase): add client setup and env config` | lib/supabase.js, .env.local, .env.example | npm run build |
| 1 | `feat(db): add Phase 1 database schema SQL` | supabase/schema.sql | — |
| 1 | `feat(router): add auth guards and callback route` | router/index.js, views/auth/AuthCallbackView.vue | npm run build |
| 2 | `feat(auth): expand auth store with Supabase session management` | stores/auth.js, main.js, App.vue | npm run build |
| 2 | `feat(auth): implement Kakao OAuth login flow` | views/login/LoginView.vue | npm run build |
| 2 | `feat(onboarding): connect role selection and profile creation to Supabase` | views/onboarding/*.vue | npm run build |
| 3 | `feat(members): add useMembers composable and connect TrainerMemberView` | composables/useMembers.js, views/trainer/TrainerMemberView.vue | npm run build |
| 3 | `feat(invite): add useInvite composable and connect invite views` | composables/useInvite.js, views/invite/*.vue | npm run build |
| 3 | `feat(work-hours): add useWorkHours composable and connect settings` | composables/useWorkHours.js, views/trainer/WorkTimeSettingView.vue | npm run build |
| 3 | `feat(search): add useTrainerSearch composable and connect search view` | composables/useTrainerSearch.js, views/trainer/TrainerSearchView.vue | npm run build |
| 3 | `feat(profile): add useProfile composable with image upload` | composables/useProfile.js, views/onboarding/*.vue | npm run build |
| 3 | `feat(memos): add useMemos composable and connect member detail view` | composables/useMemos.js, views/trainer/TrainerMemberDetailView.vue | npm run build |
| 4 | `feat(reservation): add useReservations composable and connect reservation views` | composables/useReservations.js, views/member/MemberReservationView.vue, views/trainer/ReservationManageView.vue | npm run build |
| 4 | `feat(calendar): connect schedule views with real reservation data` | views/trainer/TrainerScheduleView.vue, views/member/MemberScheduleView.vue | npm run build |
| 4 | `feat(dashboard): connect home views with aggregated data` | views/trainer/TrainerHomeView.vue, views/home/MemberHomeView.vue | npm run build |
| 4 | `feat(settings): connect settings views and implement logout` | views/trainer/SettingsView.vue, views/member/MemberSettingsView.vue | npm run build |
| 5 | `feat(ux): add unconnected member state and empty state handling` | views/home/MemberHomeView.vue, views/member/*.vue | npm run build |
| 5 | `fix(integration): resolve cross-module errors and edge cases` | various | npm run build |

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: 0 errors, dist/ generated
```

### Final Checklist
- [ ] 카카오 OAuth 로그인 → 역할 선택 → 프로필 생성 → 홈 전체 플로우 동작
- [ ] 페이지 새로고침 후 세션 유지
- [ ] 미인증 사용자 보호된 라우트 접근 시 `/login` 리다이렉트
- [ ] 역할 불일치 라우트 접근 시 올바른 홈으로 리다이렉트
- [ ] 초대 코드 생성 → 입력 → 트레이너-회원 연결 동작
- [ ] 트레이너 검색 → 연결 요청 → 승인 동작
- [ ] 예약 생성 → 승인/거절 → 완료/취소 라이프사이클 동작
- [ ] 근무시간 설정 저장 → 새로고침 → 유지
- [ ] RLS: 트레이너 A가 트레이너 B의 회원 데이터 접근 불가
- [ ] 프로필 이미지 업로드 및 표시
- [ ] 미연결 회원 홈: "트레이너 찾기" 안내 UI 표시
- [ ] 빈 상태(회원 0명, 예약 0건) 적절히 처리
- [ ] 채팅/매뉴얼/운동/수납 뷰는 목 데이터 그대로 유지 (연동 안 됨)
- [ ] `npm run build` → 0 에러
