# FitLink MVP 완성 로드맵

## TL;DR

> **목표**: 기존 데이터 레이어(7개 composable, 23개 함수, 8개 DB 테이블)를 뷰에 연결하여 MVP를 완성한다.
> 현재 composable 함수의 52%가 구현되어 있지만 어떤 뷰에서도 호출되지 않는 상태.
> 
> **핵심 경로**: 트레이너 온보딩 → 초대 코드 생성 → 회원 연결 → 회원 예약 → 트레이너 승인 → 캘린더 확인
> 
> **산출물**:
> - 트레이너 프로필 저장 로직 (P0 블로커 해결)
> - 11개 뷰를 기존 composable에 연결 (mock → real data)
> - createMemo() 함수 추가 (useMemos composable)
> - 빈 상태/미구현 UI 정리
> - E2E 크리티컬 패스 검증
> 
> **예상 소요**: Medium (7-10일)
> **병렬 실행**: YES — 3 waves
> **크리티컬 패스**: Task 1 → Task 2 → Task 3 → Task 7 → Task 17

---

## Context

### Original Request
카카오 로그인 연동 완료 후, 전체 로드맵을 한번에 잡아달라는 요청. 빠른 MVP 출시 목표.

### Interview Summary
**핵심 결정사항**:
- 전체 로드맵을 단일 플랜으로 (Phase 나누지 않음)
- MVP 우선 — 빠르게 핵심 기능 완성
- 카카오 로그인 + 역할 선택만 Supabase 연동 완료 상태 (사용자 인식)

**탐색 결과**:
- 7개 composable이 실제 Supabase 호출을 포함 (useReservations, useMembers, useWorkHours, useInvite, useProfile, useTrainerSearch, useMemos)
- 23개 composable 함수 중 12개(52%)가 어떤 뷰에서도 호출되지 않음
- TrainerProfileView에 저장 로직 없음 (P0 블로커)
- TrainerHomeView 100% 하드코딩 (composable import 0개)
- MemberReservationView에서 createReservation() 미호출
- DB 스키마 완성 (8 테이블 + RLS + 2 RPC)
- chat/manual/workout/payment 관련 DB 테이블 없음

### Metis Review
**식별된 갭** (해결됨):
- TrainerProfileView 저장 부재 → Task 1로 최우선 배치
- useMemos에 createMemo() 함수 없음 → Task 11에서 추가
- MemberSettingsView에 auth.logout() 오타 가능성 → Task 12에서 검증/수정
- MemberSettingsView 하드코딩 프로필 데이터 → Task 12에서 수정
- `src/views/trainer/AGENTS.md` 내용 부정확 (Live라고 표기되었으나 실제 mock) → Task 18에서 업데이트

---

## Work Objectives

### Core Objective
기존 composable을 뷰에 연결하고, 누락된 저장 로직을 추가하여, 트레이너-회원 핵심 루프가 실제 데이터로 작동하는 MVP를 완성한다.

### Concrete Deliverables
- TrainerProfileView → Supabase에 프로필 저장
- 11개 뷰를 해당 composable에 연결 (mock 데이터 제거)
- useMemos.createMemo() 함수 신규 추가
- 모든 뷰에 빈 상태 UI 추가
- 미구현 탭(채팅, 매뉴얼 등) "준비 중" 처리
- E2E 크리티컬 패스 동작 검증

### Definition of Done
- [ ] `npm run build` → 에러 없이 완료
- [ ] 트레이너 온보딩→초대코드→회원연결→예약→승인 전체 플로우 동작
- [ ] 모든 뷰에서 하드코딩 데이터 제거 (mock 데이터 0개)
- [ ] 빈 상태/미구현 기능에 적절한 피드백 UI 존재

### Must Have
- 트레이너 프로필 저장 (profiles + trainer_profiles 테이블)
- 모든 기존 composable의 뷰 연결
- 예약 생성/승인/거절 전체 플로우
- 빈 상태 UI (회원 없음, 예약 없음, 슬롯 없음)
- 에러 발생 시 인라인 한국어 메시지

### Must NOT Have (Guardrails)
- ❌ 새 DB 테이블 생성 금지 (messages, payments, workout_plans, manuals)
- ❌ 실시간 Supabase 구독 금지 — 수동 새로고침만
- ❌ 알림 시스템 구축 금지 (벨 아이콘은 장식용 유지)
- ❌ 테스트 인프라 추가 금지 (Vitest, Playwright 설정 등)
- ❌ 새 공유 컴포넌트 생성 금지 (AppToast, AppSpinner 등) — 3개 이상 뷰에서 필요한 경우만 예외
- ❌ i18n 추가 금지 — 모든 문자열 한국어 하드코딩
- ❌ 채팅, 매뉴얼, 운동 배정, 수납 기능 구현 금지
- ❌ composable에 새 기능 추가 금지 (뷰 연결 시) — 파생 데이터는 뷰의 computed()에서 처리
- ❌ `src/views/trainer/AGENTS.md`의 "Live" 상태 신뢰 금지 — 코드 레벨 확인 필수

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — 모든 검증은 에이전트가 실행. 예외 없음.

### Test Decision
- **인프라 존재**: NO
- **자동 테스트**: None (MVP 속도 우선)
- **프레임워크**: none

### QA Policy
모든 태스크에 에이전트 실행 QA 시나리오 포함 (아래 TODO 템플릿 참조).
증거 저장: `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`

- **Frontend/UI**: Playwright — 네비게이트, 인터랙션, DOM 확인, 스크린샷
- **Backend/DB**: Bash (curl/Supabase SQL) — 데이터 검증
- **빌드**: `npm run build` — exit code 0 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (즉시 시작 — 블로커 해제 + 핵심 뷰):
├── Task 1:  TrainerProfileView 저장 로직 [P0 블로커] [quick]
├── Task 2:  TrainerHomeView 실제 데이터 연결 [quick]
├── Task 3:  MemberReservationView 연결 [quick]
├── Task 4:  MemberScheduleView 연결 [quick]
├── Task 5:  WorkTimeSettingView 연결 [quick]
└── Task 6:  TrainerSearchView 연결 [quick]

Wave 2 (Wave 1 이후 — 트레이너-회원 루프 완성):
├── Task 7:  TrainerMemberView 연결 (depends: 1) [quick]
├── Task 8:  TrainerMemberDetailView 연결 (depends: 7) [quick]
├── Task 9:  ReservationManageView 연결 (depends: 2) [quick]
├── Task 10: TrainerScheduleView 연결 (depends: 2) [quick]
├── Task 11: useMemos.createMemo() 추가 + MemoWriteView 연결 (depends: 8) [unspecified-low]
└── Task 12: MemberSettingsView 실제 데이터 + signOut 수정 [quick]

Wave 3 (Wave 2 이후 — 폴리시 + 검증):
├── Task 13: 빈 상태 UI 전체 추가 [visual-engineering]
├── Task 14: 미구현 탭/섹션 "준비 중" 처리 [quick]
├── Task 15: RoleSelectView composable 분리 (기술 부채) [quick]
├── Task 16: 에러 핸들링 인라인 메시지 전체 적용 [unspecified-low]
├── Task 17: E2E 크리티컬 패스 검증 (depends: ALL) [deep]
└── Task 18: AGENTS.md 업데이트 [writing]

Wave FINAL (ALL 완료 후 — 독립 리뷰, 4 병렬):
├── Task F1: 플랜 준수 감사 (oracle)
├── Task F2: 코드 품질 리뷰 (unspecified-high)
├── Task F3: 실제 QA 검증 (unspecified-high)
└── Task F4: 스코프 충실도 점검 (deep)

크리티컬 패스: Task 1 → Task 7 → Task 8 → Task 11 → Task 17 → F1-F4
병렬 속도 향상: ~60% 순차 대비 빠름
최대 동시: 6 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 2, 7 |
| 2 | 1 | 9, 10 |
| 3 | — | 17 |
| 4 | — | 17 |
| 5 | — | 3 (간접) |
| 6 | — | 17 |
| 7 | 1 | 8 |
| 8 | 7 | 11 |
| 9 | 2 | 17 |
| 10 | 2 | 17 |
| 11 | 8 | 17 |
| 12 | — | 17 |
| 13 | 1-12 | 17 |
| 14 | — | 17 |
| 15 | — | — |
| 16 | 1-12 | 17 |
| 17 | ALL | F1-F4 |
| 18 | ALL | — |

### Agent Dispatch Summary

- **Wave 1**: 6개 — T1-T6 → `quick`
- **Wave 2**: 6개 — T7-T10,T12 → `quick`, T11 → `unspecified-low`
- **Wave 3**: 6개 — T13 → `visual-engineering`, T14-T15 → `quick`, T16 → `unspecified-low`, T17 → `deep`, T18 → `writing`
- **FINAL**: 4개 — F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. TrainerProfileView 저장 로직 추가 (P0 블로커)

  **What to do**:
  - `src/composables/useProfile.js`에 `saveTrainerProfile(userId, name, specialties)` 함수 추가
    - `profiles` 테이블에 `name` 업데이트 (upsert)
    - `trainer_profiles` 테이블에 `specialties` 저장 (upsert)
    - 기존 composable 패턴 준수 (loading/error/try-catch-finally)
  - `src/views/trainer/TrainerProfileView.vue`에서:
    - `useProfile` composable import
    - "완료" 버튼 클릭 시 `saveTrainerProfile()` 호출 후 `router.push('/trainer/home')`
    - 저장 중 로딩 상태, 실패 시 인라인 에러 메시지 표시
  - `auth.profile`에 저장된 name 반영 (`auth.fetchProfile()` 재호출)

  **Must NOT do**:
  - 사진 업로드 로직 추가하지 않기 (별도 태스크 아님, MVP에서는 선택사항)
  - 새 공유 컴포넌트 만들지 않기

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-6)
  - **Blocks**: Tasks 2, 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/onboarding/MemberProfileView.vue:172-198` — 회원 프로필 저장 패턴 (profiles + member_profiles 이중 upsert). 이 패턴을 그대로 따라서 profiles + trainer_profiles 저장 구현
  - `src/composables/useProfile.js` — 기존 uploadAvatar/updateProfilePhoto 함수. 여기에 saveTrainerProfile 추가
  - `src/composables/useReservations.js:55-80` — composable 함수 패턴 (loading/error/try-catch-finally). 새 함수도 이 패턴 준수

  **API/Type References**:
  - `supabase/schema.sql` — `profiles` 테이블 (id, role, name, phone, photo_url) + `trainer_profiles` 테이블 (id, specialties, bio) 스키마 확인

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] useProfile.js에 saveTrainerProfile 함수 export 존재

  **QA Scenarios**:
  ```
  Scenario: 트레이너 프로필 저장 성공
    Tool: Playwright
    Preconditions: 트레이너 역할로 로그인 완료, /trainer/profile 페이지
    Steps:
      1. goto /trainer/profile
      2. fill input[placeholder*="이름"] with "테스트코치"
      3. click 전문 분야 칩 "재활/교정"
      4. click 전문 분야 칩 "근력 증가"
      5. click button "완료" (또는 체크 아이콘 버튼)
      6. wait for navigation to /trainer/home (timeout: 5s)
    Expected Result: URL이 /trainer/home으로 변경됨
    Failure Indicators: alert 팝업 발생, URL 변경 안됨, 에러 메시지 표시
    Evidence: .sisyphus/evidence/task-1-trainer-profile-save.png

  Scenario: 저장 후 DB 데이터 검증
    Tool: Bash (Supabase SQL)
    Steps:
      1. SELECT p.name, tp.specialties FROM profiles p LEFT JOIN trainer_profiles tp ON p.id = tp.id WHERE p.role = 'trainer' ORDER BY p.updated_at DESC LIMIT 1;
    Expected Result: name = '테스트코치', specialties 배열에 선택한 항목 포함
    Evidence: .sisyphus/evidence/task-1-db-verify.txt
  ```

  **Commit**: YES
  - Message: `feat(trainer): 트레이너 프로필 온보딩 저장 로직 추가`
  - Files: `src/composables/useProfile.js`, `src/views/trainer/TrainerProfileView.vue`
  - Pre-commit: `npm run build`

- [ ] 2. TrainerHomeView 실제 데이터 연결

  **What to do**:
  - `src/views/trainer/TrainerHomeView.vue`에서:
    - `useReservations` import → `fetchMyReservations('trainer')` 호출하여 오늘 예약 표시
    - `useMembers` import → `fetchMembers()` 호출하여 회원 수 표시
    - `useAuthStore` → `auth.profile.name` 사용하여 트레이너 이름 표시
    - 하드코딩 데이터 전부 제거: `reservationCount = ref(2)`, 가짜 스케줄 카드, 가짜 메시지
    - "오늘 예약" 카드: 실제 예약 데이터에서 오늘 날짜 필터링 (computed)
    - "예약 요청" 배지: status='pending'인 예약 수 (computed)
    - "최근 메시지" 섹션: DB 테이블 없으므로 "준비 중입니다" 플레이스홀더로 교체
  - CSS 변경 없음, 기존 레이아웃 유지

  **Must NOT do**:
  - useReservations에 새 함수 추가하지 않기 (파생 데이터는 computed()로)
  - "최근 메시지"용 가짜 composable 만들지 않기
  - 실시간 구독 추가하지 않기

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 1과 동일 Wave지만, Task 1의 프로필 이름이 필요하므로 Task 1 이후 실행 권장)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: Task 1 (트레이너 이름이 DB에 있어야 표시 가능)

  **References**:

  **Pattern References**:
  - `src/views/home/MemberHomeView.vue:186-205` — 뷰 wiring 캐노니컬 패턴 (composable import → destructure → onMounted → bind). 이 패턴을 그대로 따라서 TrainerHomeView에 적용
  - `src/composables/useReservations.js:192-253` — fetchMyReservations(role) 함수. 'trainer' 파라미터로 호출하면 트레이너의 전체 예약 반환
  - `src/composables/useMembers.js:19-96` — fetchMembers() 함수. 연결된 회원 목록 + 예약 통계 반환

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] TrainerHomeView.vue에서 `ref(2)` 등 하드코딩 값 0개

  **QA Scenarios**:
  ```
  Scenario: 트레이너 홈에 실제 데이터 표시
    Tool: Playwright
    Preconditions: 트레이너 로그인 + 프로필 저장 완료 + 1명 이상 회원 연결
    Steps:
      1. goto /trainer/home
      2. assert header에 실제 트레이너 이름 표시 (하드코딩 "마커스 코치님" 아님)
      3. assert 예약 요청 카운트가 DB의 pending 예약 수와 일치
      4. assert "최근 메시지" 영역에 "준비 중" 텍스트 존재
    Expected Result: 모든 데이터가 실제 DB 값과 일치
    Evidence: .sisyphus/evidence/task-2-trainer-home.png

  Scenario: 회원 없는 트레이너 빈 상태
    Tool: Playwright
    Preconditions: 트레이너 로그인, 연결된 회원 0명
    Steps:
      1. goto /trainer/home
      2. assert 스케줄 카드 영역에 빈 상태 메시지 또는 0건 표시
    Expected Result: 에러 없이 빈 상태 표시
    Evidence: .sisyphus/evidence/task-2-trainer-home-empty.png
  ```

  **Commit**: YES (groups with T3-T6)
  - Message: `feat(views): Wave 1 뷰 composable 연결`
  - Files: `src/views/trainer/TrainerHomeView.vue`

- [ ] 3. MemberReservationView composable 연결

  **What to do**:
  - `src/views/member/MemberReservationView.vue`에서:
    - `useReservations` import
    - `getConnectedTrainerId()` 호출하여 연결된 트레이너 ID 확인
    - 날짜 선택 시 `fetchAvailableSlots(trainerId, date)` 호출
    - "예약 요청" 버튼 클릭 시 `createReservation(trainerId, date, startTime, endTime)` 호출 (현재 `alert()` + `router.back()` 제거)
    - 성공 시 이전 화면으로 이동 + 성공 피드백
    - 실패 시 인라인 에러 메시지 ("해당 시간은 이미 예약되었습니다" 등)
  - 과거 날짜 선택 방지 (AppCalendar에서 또는 뷰에서 검증)

  **Must NOT do**:
  - AppCalendar 컴포넌트 수정하지 않기 (뷰 레벨에서 과거 날짜 필터링)
  - useReservations에 새 함수 추가하지 않기

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5, 6)
  - **Blocks**: Task 17
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/composables/useReservations.js:65-163` — fetchAvailableSlots(trainerId, date) 함수. 근무시간 조회 → 기존 예약 조회 → 가용 슬롯 계산 로직
  - `src/composables/useReservations.js:166-190` — createReservation() 함수. RPC `create_reservation` 호출
  - `src/composables/useReservations.js:35-63` — getConnectedTrainerId(memberId) 함수. trainer_members 테이블에서 연결된 트레이너 ID 반환
  - `src/views/home/MemberHomeView.vue:186-205` — composable 호출 패턴 (onMounted + async)

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] MemberReservationView.vue에서 `alert()` 호출 0개

  **QA Scenarios**:
  ```
  Scenario: 예약 생성 성공
    Tool: Playwright
    Preconditions: 회원 로그인, 트레이너 연결됨, 트레이너 근무시간 설정됨
    Steps:
      1. goto /member/reservation
      2. click 캘린더에서 미래 날짜 선택
      3. assert 시간 슬롯 목록이 로드됨 (1개 이상)
      4. click 가용한 시간 슬롯
      5. click "예약 요청" 버튼
      6. assert 성공 피드백 표시 또는 이전 화면으로 이동
    Expected Result: 예약이 DB에 pending 상태로 생성됨
    Evidence: .sisyphus/evidence/task-3-reservation-create.png

  Scenario: 이미 예약된 슬롯 선택 불가
    Tool: Playwright
    Steps:
      1. 이미 예약된 시간 슬롯 확인
      2. assert 해당 슬롯이 비활성화(disabled) 또는 "마감" 표시
    Expected Result: 예약된 슬롯 클릭 불가
    Evidence: .sisyphus/evidence/task-3-slot-disabled.png
  ```

  **Commit**: YES (groups with T2, T4-T6)
  - Files: `src/views/member/MemberReservationView.vue`

- [ ] 4. MemberScheduleView composable 연결

  **What to do**:
  - `src/views/member/MemberScheduleView.vue`에서:
    - `useReservations` import → `fetchMyReservations('member')` 호출
    - AppCalendar에 실제 예약 날짜별 상태 dots 전달
    - 날짜 선택 시 해당 날의 예약 목록 하단에 표시
    - 하드코딩 데이터 제거

  **Must NOT do**:
  - AppCalendar 컴포넌트 수정하지 않기

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 17
  - **Blocked By**: None

  **References**:
  - `src/composables/useReservations.js:192-253` — fetchMyReservations(role) 함수
  - `src/components/AppCalendar.vue` — dots prop 형식: `{ day: ['pending'|'approved'|'done'|'cancelled'] }`
  - `src/views/trainer/TrainerScheduleView.vue` — 캘린더 + 예약 목록 패턴 (현재 mock이지만 UI 구조 참고)

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 캘린더에 실제 예약 날짜에 dot 표시

  **QA Scenarios**:
  ```
  Scenario: 회원 스케줄 캘린더에 예약 표시
    Tool: Playwright
    Preconditions: 회원 로그인, 1건 이상 예약 존재
    Steps:
      1. goto /member/schedule
      2. assert 캘린더에 dot이 1개 이상 존재
      3. click dot이 있는 날짜
      4. assert 하단에 예약 카드 표시 (시간, 상태)
    Expected Result: 실제 예약 데이터가 캘린더에 반영
    Evidence: .sisyphus/evidence/task-4-member-schedule.png
  ```

  **Commit**: YES (groups with T2, T3, T5, T6)
  - Files: `src/views/member/MemberScheduleView.vue`

- [ ] 5. WorkTimeSettingView composable 연결

  **What to do**:
  - `src/views/trainer/WorkTimeSettingView.vue`에서:
    - `useWorkHours` import → `fetchWorkHours()` 호출하여 기존 설정 로드
    - "저장" 버튼 클릭 시 `saveWorkHours(schedules)` 호출
    - 하드코딩 데이터 제거, 로딩/에러 상태 처리

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 3 (간접 — 근무시간이 있어야 슬롯 계산 가능)
  - **Blocked By**: None

  **References**:
  - `src/composables/useWorkHours.js:53-146` — fetchWorkHours() + saveWorkHours() 함수. UPSERT 패턴
  - `src/views/invite/InviteManageView.vue` — composable 호출 + loading/error 바인딩 패턴 참고

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 저장 후 DB에 work_schedules 데이터 존재

  **QA Scenarios**:
  ```
  Scenario: 근무시간 설정 저장
    Tool: Playwright
    Preconditions: 트레이너 로그인
    Steps:
      1. goto /trainer/settings/work-time
      2. toggle 월요일 활성화
      3. 시작 시간 09:00, 종료 시간 18:00 설정
      4. PT 단위 "1시간" 선택
      5. click "저장" 버튼
      6. assert 성공 피드백
    Expected Result: work_schedules 테이블에 데이터 저장됨
    Evidence: .sisyphus/evidence/task-5-worktime-save.png
  ```

  **Commit**: YES (groups with T2-T4, T6)
  - Files: `src/views/trainer/WorkTimeSettingView.vue`

- [ ] 6. TrainerSearchView composable 연결

  **What to do**:
  - `src/views/trainer/TrainerSearchView.vue`에서:
    - `useTrainerSearch` import → `searchTrainers()` 호출
    - 하드코딩 트레이너 목록 (4명) 제거
    - 검색 input에 debounce 적용하여 `searchTrainers(query)` 호출
    - "연결 요청" 버튼 클릭 시 `requestConnection(trainerId)` 호출
    - 이미 연결된 트레이너인 경우 기존 연결 안내 메시지 ("이미 연결된 트레이너가 있습니다")

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 17
  - **Blocked By**: None

  **References**:
  - `src/composables/useTrainerSearch.js` — searchTrainers() + requestConnection() 함수
  - `src/views/invite/InviteEnterView.vue` — 코드 입력 + 확인 + 연결 패턴 참고

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 하드코딩 트레이너 배열 제거됨

  **QA Scenarios**:
  ```
  Scenario: 트레이너 검색 및 연결
    Tool: Playwright
    Preconditions: 회원 로그인, 트레이너 미연결 상태
    Steps:
      1. goto /search
      2. assert 트레이너 목록이 DB에서 로드됨
      3. 검색창에 트레이너 이름 일부 입력
      4. assert 필터링된 결과 표시
      5. click "연결 요청" 버튼
      6. assert 성공 피드백
    Expected Result: trainer_members 테이블에 연결 레코드 생성
    Evidence: .sisyphus/evidence/task-6-trainer-search.png
  ```

  **Commit**: YES (groups with T2-T5)
  - Files: `src/views/trainer/TrainerSearchView.vue`

- [ ] 7. TrainerMemberView composable 연결

  **What to do**:
  - `src/views/trainer/TrainerMemberView.vue`에서:
    - `useMembers` import → `fetchMembers()` 호출
    - 하드코딩 회원 목록 제거, 실제 데이터 바인딩
    - 회원 카드 클릭 시 `/trainer/members/:id`로 라우팅 (실제 member ID)
    - 로딩/에러 상태 처리

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:
  - `src/composables/useMembers.js:19-96` — fetchMembers() 함수. 반환값: members 배열 (profile + member_profile + 예약 통계)
  - `src/views/home/MemberHomeView.vue:186-205` — composable wiring 패턴

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 하드코딩 회원 배열 제거됨

  **QA Scenarios**:
  ```
  Scenario: 회원 목록 실제 데이터 표시
    Tool: Playwright
    Preconditions: 트레이너 로그인, 1명 이상 회원 연결
    Steps:
      1. goto /trainer/members
      2. assert 회원 카드 1개 이상 표시
      3. assert 카드에 실제 회원 이름 표시 (하드코딩 아님)
      4. click 회원 카드
      5. assert URL이 /trainer/members/:id 형식으로 변경
    Expected Result: 실제 연결된 회원 데이터 표시
    Evidence: .sisyphus/evidence/task-7-member-list.png
  ```

  **Commit**: YES (groups with T8-T12)

- [ ] 8. TrainerMemberDetailView composable 연결

  **What to do**:
  - `src/views/trainer/TrainerMemberDetailView.vue`에서:
    - `useMemos` import → `fetchMemberDetail(memberId)` + `fetchMemos(memberId)` 호출
    - route params에서 memberId 추출
    - 하드코딩 회원 정보/메모 제거, 실제 데이터 바인딩
    - "메모 작성" 버튼 → `/trainer/members/:id/memo/write` 라우팅

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 7

  **References**:
  - `src/composables/useMemos.js` — fetchMemberDetail() + fetchMemos() 함수
  - `src/views/trainer/TrainerMemberView.vue` — 회원 목록 → 상세 네비게이션 패턴

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 회원 상세에서 실제 프로필 + 메모 데이터 표시

  **QA Scenarios**:
  ```
  Scenario: 회원 상세 + 메모 목록 표시
    Tool: Playwright
    Preconditions: 트레이너 로그인, 특정 회원과 연결됨
    Steps:
      1. goto /trainer/members/:memberId
      2. assert 회원 이름, 프로필 정보 표시
      3. assert 메모 목록 섹션 존재 (0건이면 빈 상태)
    Expected Result: 실제 DB 데이터 표시
    Evidence: .sisyphus/evidence/task-8-member-detail.png
  ```

  **Commit**: YES (groups with T7, T9-T12)

- [ ] 9. ReservationManageView composable 연결

  **What to do**:
  - `src/views/trainer/ReservationManageView.vue`에서:
    - `useReservations` import → `fetchMyReservations('trainer')` 호출
    - 필터 탭 (전체/대기중/승인됨/완료) → computed로 필터링
    - "승인" 버튼 → `updateReservationStatus(id, 'approved')` 호출
    - "거절" 버튼 → `updateReservationStatus(id, 'rejected')` 호출
    - "완료" 버튼 → `updateReservationStatus(id, 'completed')` 호출
    - 하드코딩 예약 데이터 제거

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 17
  - **Blocked By**: Task 2

  **References**:
  - `src/composables/useReservations.js:192-273` — fetchMyReservations + updateReservationStatus 함수
  - `src/views/trainer/TrainerHomeView.vue` — 예약 카드 UI 구조 참고 (wiring 후)

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 승인/거절 버튼 클릭 시 DB status 변경됨

  **QA Scenarios**:
  ```
  Scenario: 예약 승인 플로우
    Tool: Playwright
    Preconditions: 트레이너 로그인, pending 예약 1건 이상
    Steps:
      1. goto /trainer/reservations
      2. assert pending 예약 카드 표시
      3. click "승인" 버튼
      4. assert 카드 상태가 "승인됨"으로 변경
    Expected Result: reservations.status = 'approved' in DB
    Evidence: .sisyphus/evidence/task-9-approve-reservation.png
  ```

  **Commit**: YES (groups with T7-T8, T10-T12)

- [ ] 10. TrainerScheduleView composable 연결

  **What to do**:
  - `src/views/trainer/TrainerScheduleView.vue`에서:
    - `useReservations` import → `fetchMyReservations('trainer')` 호출
    - AppCalendar에 예약 상태별 dots 바인딩
    - 날짜 선택 시 해당 날 예약 목록 표시
    - 하드코딩 데이터 제거

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 17
  - **Blocked By**: Task 2

  **References**:
  - Task 4 (MemberScheduleView)와 동일한 패턴 — 역할만 'trainer'로 변경
  - `src/components/AppCalendar.vue` — dots prop 형식

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0

  **QA Scenarios**:
  ```
  Scenario: 트레이너 캘린더에 전체 예약 표시
    Tool: Playwright
    Preconditions: 트레이너 로그인, 예약 존재
    Steps:
      1. goto /trainer/schedule
      2. assert 캘린더 dot 표시
      3. click 예약 있는 날짜
      4. assert 하단에 예약 카드(회원 이름, 시간, 상태) 표시
    Expected Result: 모든 연결된 회원의 예약이 통합 표시
    Evidence: .sisyphus/evidence/task-10-trainer-schedule.png
  ```

  **Commit**: YES (groups with T7-T9, T11-T12)

- [ ] 11. useMemos.createMemo() 추가 + MemoWriteView 연결

  **What to do**:
  - `src/composables/useMemos.js`에 `createMemo(memberId, content, tags)` 함수 추가
    - `memos` 테이블에 INSERT
    - 기존 composable 패턴 준수 (loading/error/try-catch-finally)
  - `src/views/trainer/MemoWriteView.vue`에서:
    - `useMemos` import → createMemo() 사용
    - "메모 저장" 버튼 클릭 시 `createMemo()` 호출 (현재 `console.log` + `alert` 제거)
    - 성공 시 이전 화면(회원 상세)으로 이동
    - 실패 시 인라인 에러 메시지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 17
  - **Blocked By**: Task 8

  **References**:
  - `src/composables/useMemos.js` — 기존 fetchMemos/deleteMemo 패턴. createMemo도 동일 패턴으로 추가
  - `supabase/schema.sql` — memos 테이블 스키마 (id, trainer_id, member_id, content, tags, created_at)
  - `src/composables/useReservations.js:166-190` — createReservation() 패턴 참고

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] useMemos.js에 createMemo 함수 export 존재
  - [ ] MemoWriteView.vue에서 console.log/alert 호출 0개

  **QA Scenarios**:
  ```
  Scenario: 메모 작성 저장
    Tool: Playwright
    Preconditions: 트레이너 로그인, 회원 상세에서 "메모 작성" 진입
    Steps:
      1. goto /trainer/members/:id/memo/write
      2. fill 메모 내용 "오늘 스쿼트 자세 교정 완료"
      3. click 태그 선택 (있는 경우)
      4. click "메모 저장하기" 버튼
      5. assert 이전 화면(회원 상세)으로 이동
    Expected Result: memos 테이블에 새 레코드 생성
    Evidence: .sisyphus/evidence/task-11-memo-write.png
  ```

  **Commit**: YES (groups with T7-T10, T12)
  - Files: `src/composables/useMemos.js`, `src/views/trainer/MemoWriteView.vue`

- [ ] 12. MemberSettingsView 실제 데이터 + signOut 수정

  **What to do**:
  - `src/views/member/MemberSettingsView.vue`에서:
    - 하드코딩 `{ name: '김회원', email: 'member@ptapp.com' }` 제거
    - `useAuthStore`에서 `auth.profile` 사용하여 실제 이름, 정보 표시
    - `auth.logout()` → `auth.signOut()`으로 수정 (메서드명 불일치 수정)
  - `src/views/trainer/SettingsView.vue`도 동일하게 확인/수정

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 17
  - **Blocked By**: None

  **References**:
  - `src/stores/auth.js` — signOut() 함수 (line 237). export 확인
  - `src/views/member/MemberSettingsView.vue:108-111` — 하드코딩 위치
  - `src/views/member/MemberSettingsView.vue:137` — auth.logout() 호출 위치

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit code 0
  - [ ] 하드코딩 프로필 데이터 0개
  - [ ] `auth.logout` 호출 0개 (grep 검증)

  **QA Scenarios**:
  ```
  Scenario: 설정 페이지 실제 프로필 + 로그아웃
    Tool: Playwright
    Preconditions: 회원 로그인
    Steps:
      1. goto /member/settings
      2. assert 실제 회원 이름 표시 ("김회원" 아님)
      3. click "로그아웃" 버튼
      4. assert /login 페이지로 이동
    Expected Result: 실제 프로필 데이터 표시 + 로그아웃 정상 동작
    Evidence: .sisyphus/evidence/task-12-settings.png
  ```

  **Commit**: YES (groups with T7-T11)

- [ ] 13. 빈 상태 UI 전체 추가

  **What to do**:
  - 모든 wired 뷰에 데이터가 없을 때 빈 상태 메시지 추가:
    - TrainerHomeView: "아직 연결된 회원이 없습니다. 초대 코드를 생성하여 회원을 초대하세요." + 초대 코드 관리 링크
    - TrainerMemberView: "연결된 회원이 없습니다." + 초대 코드 링크
    - TrainerScheduleView: 날짜 선택 시 "등록된 예약이 없습니다."
    - MemberScheduleView: "예약 내역이 없습니다."
    - MemberReservationView: 슬롯 없을 때 "트레이너가 아직 근무시간을 설정하지 않았습니다."
    - ReservationManageView: "예약 요청이 없습니다."
    - TrainerSearchView: 결과 없을 때 "검색 결과가 없습니다."
    - TrainerMemberDetailView: 메모 없을 때 "작성된 메모가 없습니다."

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 1-12

  **References**:
  - `src/views/home/MemberHomeView.vue` — 기존 빈 상태 패턴 ("아직 담당 트레이너가 없습니다" + 버튼)
  - `src/assets/css/global.css` — 디자인 토큰 (색상, 타이포그래피)

  **Acceptance Criteria**:
  - [ ] 모든 wired 뷰에서 데이터 0건일 때 한국어 안내 메시지 표시
  - [ ] 에러 없이 렌더링

  **QA Scenarios**:
  ```
  Scenario: 빈 상태 UI 전체 확인
    Tool: Playwright
    Steps:
      1. 회원 0명인 트레이너로 /trainer/home 접속 → 빈 상태 메시지 확인
      2. /trainer/members 접속 → 빈 상태 메시지 확인
      3. /trainer/schedule → 날짜 클릭 → "예약 없음" 메시지 확인
      4. 트레이너 미연결 회원으로 /member/reservation → "근무시간 미설정" 메시지 확인
    Expected Result: 모든 빈 상태에서 적절한 한국어 안내
    Evidence: .sisyphus/evidence/task-13-empty-states.png
  ```

  **Commit**: YES (groups with T14-T16)

- [ ] 14. 미구현 탭/섹션 "준비 중" 처리

  **What to do**:
  - 채팅 탭 (TrainerChatView, MemberChatView): "채팅 기능을 준비 중입니다" 메시지 + 아이콘
  - 매뉴얼 탭 (MemberManualView, TrainerManualView): "운동 매뉴얼 기능을 준비 중입니다"
  - 수납 기록 (MemberPaymentView, PaymentWriteView): "수납 기록 기능을 준비 중입니다"
  - 오늘의 운동 (TodayWorkoutView): "오늘의 운동 기능을 준비 중입니다"
  - MemberHomeView의 "오늘의 운동" 섹션: 하드코딩 제거 → "준비 중" 표시
  - TrainerHomeView의 "최근 메시지" 섹션: (Task 2에서 이미 처리했으면 확인만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 17
  - **Blocked By**: None (독립적)

  **References**:
  - `src/views/member/MemberChatView.vue` — 기존 "준비 중" 패턴 참고
  - 기존 mock 뷰 목록: TrainerChatView, MemberChatView, MemberManualView, ManualDetailView, TrainerManualView, ManualRegisterView, TodayWorkoutView, MemberPaymentView, PaymentWriteView

  **Acceptance Criteria**:
  - [ ] 모든 미구현 뷰에서 "준비 중" 메시지 표시
  - [ ] 하드코딩 mock 데이터 제거 (가짜 채팅, 가짜 매뉴얼 등)

  **QA Scenarios**:
  ```
  Scenario: 미구현 기능 "준비 중" 확인
    Tool: Playwright
    Steps:
      1. 트레이너 로그인 → /trainer/chat → assert "준비 중" 텍스트
      2. 회원 로그인 → /member/chat → assert "준비 중" 텍스트
      3. /member/manual → assert "준비 중" 텍스트
    Expected Result: 모든 미구현 페이지에서 일관된 플레이스홀더
    Evidence: .sisyphus/evidence/task-14-coming-soon.png
  ```

  **Commit**: YES (groups with T13, T15-T16)

- [ ] 15. RoleSelectView composable 분리 (기술 부채)

  **What to do**:
  - `src/views/onboarding/RoleSelectView.vue`의 직접 Supabase 호출 (line 81-89)을 composable로 이동
  - 기존 `useProfile.js`에 `saveRole(userId, role)` 함수 추가하거나 별도 composable 생성
  - RoleSelectView에서 composable 함수 호출로 교체
  - MemberProfileView의 직접 Supabase 호출도 동일하게 확인/분리

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/views/onboarding/RoleSelectView.vue:81-89` — 직접 supabase.from() 호출 위치
  - `src/composables/useProfile.js` — 기존 프로필 관련 composable

  **Acceptance Criteria**:
  - [ ] RoleSelectView.vue에서 `supabase.from()` 직접 호출 0개
  - [ ] `npm run build` → exit code 0

  **Commit**: YES (groups with T13-T14, T16)

- [ ] 16. 에러 핸들링 인라인 메시지 전체 적용

  **What to do**:
  - 모든 wired 뷰에서 composable의 `error` ref를 바인딩하여 인라인 에러 메시지 표시
  - 에러 메시지 한국어: "데이터를 불러오는데 실패했습니다", "저장에 실패했습니다" 등
  - `alert()` 사용 중인 곳을 인라인 메시지로 교체 (ast_grep로 alert 패턴 검색)
  - 예약 충돌 에러: "해당 시간은 이미 예약되었습니다. 다른 시간을 선택해주세요."
  - 연결 중복 에러: "이미 연결된 트레이너가 있습니다."

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 1-12

  **References**:
  - `ast_grep_search` pattern `alert($MSG)` lang=javascript — 모든 alert 위치 검색
  - `src/composables/useReservations.js` — error ref 패턴 참고

  **Acceptance Criteria**:
  - [ ] 뷰 파일에서 `alert()` 호출 최소화 (미구현 기능의 "준비 중" alert은 예외)
  - [ ] composable error ref가 UI에 바인딩된 뷰 11개

  **Commit**: YES (groups with T13-T15)

- [ ] 17. E2E 크리티컬 패스 검증

  **What to do**:
  - 전체 플로우 테스트:
    1. 트레이너 가입 → 역할 선택 "트레이너" → 프로필 입력 → /trainer/home 도착
    2. 트레이너 근무시간 설정 (월-금 09:00-18:00, 60분 단위)
    3. 트레이너 초대 코드 생성 → 코드 복사
    4. 회원 가입 → 역할 선택 "회원" → 프로필 입력 → /home 도착
    5. 회원 초대 코드 입력 → 트레이너 연결
    6. 회원 예약 생성 (날짜 + 시간 슬롯 선택)
    7. 트레이너 홈에서 pending 예약 확인
    8. 트레이너 예약 승인
    9. 회원 스케줄에서 승인된 예약 확인
  - 각 단계에서 스크린샷 캡처

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Parallel Group**: Wave 3 (마지막)
  - **Blocks**: F1-F4
  - **Blocked By**: ALL (Tasks 1-16)

  **Acceptance Criteria**:
  - [ ] 9단계 전체 완주, 에러 0건
  - [ ] 각 단계 스크린샷 존재

  **QA Scenarios**:
  ```
  Scenario: 풀 E2E 크리티컬 패스
    Tool: Playwright
    Steps: 위 9단계 순서대로 실행
    Expected Result: 트레이너 온보딩→초대→연결→예약→승인 전체 성공
    Evidence: .sisyphus/evidence/task-17-e2e-step-{1-9}.png
  ```

  **Commit**: NO (검증만)

- [ ] 18. AGENTS.md 업데이트

  **What to do**:
  - `src/views/trainer/AGENTS.md` 업데이트: 각 뷰의 실제 상태 반영 (Mock → Live)
  - 프로젝트 루트 `AGENTS.md` 업데이트: composable 연결 상태 반영
  - 미구현 기능 목록 업데이트

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: ALL

  **Acceptance Criteria**:
  - [ ] AGENTS.md의 "Live/Mock" 상태가 실제 코드와 일치

  **Commit**: YES
  - Message: `docs: AGENTS.md 구현 상태 업데이트`

---

## Final Verification Wave (MANDATORY — ALL 구현 태스크 완료 후)

> 4개 리뷰 에이전트가 병렬 실행. 모두 APPROVE 필요. 거부 시 수정 → 재실행.

- [ ] F1. **플랜 준수 감사** — `oracle`
  플랜 전체를 읽고, 각 "Must Have"에 대해 구현 존재 확인 (파일 읽기, curl, 명령 실행). 각 "Must NOT Have"에 대해 코드베이스에서 금지 패턴 검색 — 발견 시 file:line과 함께 거부. `.sisyphus/evidence/` 파일 존재 확인. 산출물과 플랜 비교.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **코드 품질 리뷰** — `unspecified-high`
  `npm run build` 실행. 변경된 모든 파일에서: `as any`/`@ts-ignore`, 빈 catch, console.log (프로덕션), 주석 처리된 코드, 미사용 import 검사. AI 슬롭 패턴: 과도한 주석, 과도한 추상화, 일반적 변수명 (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **실제 QA 검증** — `unspecified-high` (+ `playwright` skill)
  클린 상태에서 시작. 모든 태스크의 QA 시나리오를 순서대로 실행 — 정확한 단계 따름, 증거 캡처. 크로스 태스크 통합 테스트 (기능 간 연동). 엣지 케이스: 빈 상태, 잘못된 입력, 빠른 연속 동작. `.sisyphus/evidence/final-qa/`에 저장.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **스코프 충실도 점검** — `deep`
  각 태스크별: "What to do" 읽기, 실제 diff 확인 (git log/diff). 1:1 검증 — 스펙에 있는 것 모두 구현됨 (누락 없음), 스펙 밖의 것 구현되지 않음 (스코프 크립 없음). "Must NOT do" 준수 확인. 크로스 태스크 오염 감지: Task N이 Task M의 파일 수정. 미설명 변경 플래그.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit | Message | Files |
|------|--------|---------|-------|
| 1 | T1 | `feat(trainer): 트레이너 프로필 온보딩 저장 로직 추가` | composable + view |
| 1 | T2-T6 | `feat(views): Wave 1 뷰 composable 연결 (home, reservation, schedule, search)` | views |
| 2 | T7-T12 | `feat(views): Wave 2 뷰 composable 연결 (members, memos, settings)` | composable + views |
| 3 | T13-T16 | `feat(ux): 빈 상태 UI + 미구현 처리 + 에러 핸들링` | views |
| 3 | T17-T18 | `chore: E2E 검증 + AGENTS.md 업데이트` | docs |

---

## Success Criteria

### Verification Commands
```bash
npm run build     # Expected: exit code 0, no errors
npm run dev       # Expected: dev server starts on :5173
```

### Final Checklist
- [ ] 모든 "Must Have" 구현 완료
- [ ] 모든 "Must NOT Have" 미존재 확인
- [ ] `npm run build` 성공
- [ ] E2E 크리티컬 패스 완전 동작 (트레이너 온보딩→초대→연결→예약→승인)
- [ ] 하드코딩 mock 데이터 0개 (채팅/매뉴얼/운동/수납 제외 — 이들은 "준비 중" 처리)
- [ ] 모든 빈 상태에 적절한 한국어 안내 메시지
