# 초대 코드 기반 회원 온보딩 플로우 재설계

## TL;DR

> **Quick Summary**: 미인증/미가입 사용자도 초대 코드 딥링크로 진입하여 회원가입 → 프로필 입력 → 트레이너 자동 연동까지 원스톱으로 완료할 수 있도록 `/invite/enter` 플로우를 재설계한다. localStorage 기반 코드 전달 메커니즘을 사용하여 로그인/가입 → 프로필 입력 → RPC 호출 전 과정에서 코드가 유지된다.
>
> **Deliverables**:
> - InviteEnterView 미인증 접근 허용 + 인증 상태별 UI 분기
> - 딥링크 `?code=` 쿼리 파라미터 자동 채우기
> - localStorage `pending_invite_code` 기반 코드 전달 메커니즘
> - AuthCallbackView, EmailLoginView에서 초대 코드 감지 시 자동 member 역할 설정
> - MemberProfileView에서 프로필 저장 후 자동 트레이너 연동 + `/member/home` 이동
> - 기존 버그 수정: MemberProfileView의 `/home` → `/member/home`
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3/4(parallel) → Task 5 → Task 6 → F1-F4

---

## Context

### Original Request
사용자가 초대 코드 플로우를 두 가지 시나리오로 정의:
1. 미가입 사용자 + 초대코드 → 회원가입 → 프로필 입력 → 자동 트레이너 연동 → `/member/home`
2. 가입된 사용자(미로그인) + 초대코드 → "로그인 필요" 안내 → 로그인 → 자동 트레이너 연동

### Interview Summary
**Key Discussions**:
- 진입점: 딥링크 + 앱 내 수동 입력 모두 지원
- 회원가입 방식: 카카오 OAuth + 이메일 모두 선택 가능 (기존 로그인 페이지 활용)
- 역할 선택: 초대 코드 있으면 RoleSelectView 스킵 + 자동 member 역할 설정
- 프로필 입력: 건너뛰지 않음 — MemberProfileView 거쳐서 프로필 완성 후 연동
- 가입 여부 판별: 로그인 시도로 판별 (별도 API 없음)

**Research Findings**:
- `/invite/enter`는 현재 보호 경로 → 미인증 시 `/login`으로 리다이렉트
- `invite_codes` 테이블 RLS: `to authenticated` → 미인증 조회 불가
- `connect_via_invite` RPC: `auth.uid()` + `role='member'` 필수
- InviteManageView에서 이미 `?code=` 쿼리 파라미터 딥링크 생성 중이나 InviteEnterView에서 읽는 로직 없음
- MemberProfileView에 기존 버그: `fromInvite=true`일 때 `/home`으로 이동 (라우터에 없는 경로)

### Metis Review
**Identified Gaps** (addressed):
- 미인증 상태 코드 유효성 검증: 형식 검증만 프론트에서 수행, 실제 검증은 RPC 시점에 위임 (RLS 제약)
- MemberProfileView `/home` 버그: 이번 작업에서 `/member/home`으로 수정
- `?code=` 쿼리 파라미터 자동 채우기 로직 누락: Task 2에서 구현
- localStorage 정리 정책: 사용 후 즉시 removeItem, 실패 시 유지
- 이미 로그인된 사용자 + 딥링크: 기존 연결 확정 플로우 그대로 유지

---

## Work Objectives

### Core Objective
미인증/미가입 사용자가 초대 코드 딥링크(`/invite/enter?code=XXXX`)로 진입하여 회원가입 → 프로필 입력 → 트레이너 자동 연동까지 끊김 없이 완료할 수 있는 플로우를 구현한다.

### Concrete Deliverables
- 수정 파일 7개: `router/index.js`, `InviteEnterView.vue`, `useInvite.js`, `AuthCallbackView.vue`, `EmailLoginView.vue`, `MemberProfileView.vue`, `RoleSelectView.vue`
- 신규 파일 0개

### Definition of Done
- [ ] 미인증 사용자가 `/invite/enter?code=XXXX` 접근 시 코드 자동 채워진 UI 표시
- [ ] 이메일 가입 후 자동 member 역할 설정 → 프로필 입력 → 트레이너 연동 → `/member/home` 도착
- [ ] 카카오 OAuth 가입 후 동일 플로우 동작
- [ ] 가입된 사용자 로그인 후 자동 트레이너 연동 → `/member/home` 도착
- [ ] 이미 로그인된 사용자는 기존 "연결 확정" 플로우 그대로 동작
- [ ] `npm run build` 성공

### Must Have
- localStorage `pending_invite_code` 기반 코드 전달 메커니즘
- 딥링크 `?code=` 쿼리 파라미터 자동 채우기
- 인증 상태별 InviteEnterView UI 분기
- RoleSelectView 스킵 + 자동 member 역할 설정
- MemberProfileView 프로필 저장 후 자동 `connect_via_invite` RPC 호출
- 기존 버그 수정: `/home` → `/member/home`

### Must NOT Have (Guardrails)
- `connect_via_invite` RPC 스키마 수정 — DB 스키마 변경 금지
- `invite_codes` RLS 정책 변경 — anon 접근 허용은 보안 위험
- 새로운 뷰/페이지/composable 생성 — 기존 파일 수정으로 해결
- LoginView.vue의 카카오 OAuth 로직 변경 — redirectTo URL 등
- 트레이너 관련 뷰 수정 — InviteManageView 등
- 새로운 에러 토스트/모달 시스템 — 기존 인라인 에러 메시지 패턴 유지
- QR 코드, 카카오톡 공유 API, 초대 코드 만료, 다중 트레이너 연결 기능
- 과도한 주석/JSDoc — 코드 자체가 명확하면 주석 불필요

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: Tests-after (통합 시나리오 QA 중심)
- **Framework**: Vitest (기존)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Build**: Use Bash — `npm run build` 성공 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: 라우터 + localStorage 유틸 + InviteEnterView 미인증 접근 [quick]
├── Task 2: InviteEnterView ?code= 쿼리 파라미터 자동 채우기 + 인증 분기 UI [visual-engineering]

Wave 2 (After Wave 1 — 각 로그인 경로에서 초대 코드 감지 + 자동 역할 설정):
├── Task 3: AuthCallbackView — 초대 코드 감지 + 자동 member 역할 + MemberProfileView 이동 [unspecified-high]
├── Task 4: EmailLoginView — 초대 코드 감지 + 자동 member 역할 + MemberProfileView 이동 [unspecified-high]

Wave 3 (After Wave 2 — 프로필 저장 후 자동 연동):
├── Task 5: MemberProfileView — 프로필 저장 후 자동 connect_via_invite + /member/home [unspecified-high]
├── Task 6: RoleSelectView — 초대 코드 존재 시 자동 member 설정 + MemberProfileView 직행 [quick]

Wave FINAL (After ALL — 검증):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA — 전체 플로우 Playwright 검증 (unspecified-high)
├── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 3/4 → Task 5 → Task 6 → F1-F4
Parallel Speedup: ~40% faster than sequential
Max Concurrent: 2 (Waves 1, 2)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1    | —         | 2, 3, 4 |
| 2    | 1         | 3, 4, 5 |
| 3    | 1, 2      | 5, F1-F4 |
| 4    | 1, 2      | 5, F1-F4 |
| 5    | 3, 4      | 6, F1-F4 |
| 6    | 1         | F1-F4 |
| F1-F4| ALL       | — |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks — T1 → `quick`, T2 → `visual-engineering`
- **Wave 2**: 2 tasks — T3 → `unspecified-high`, T4 → `unspecified-high`
- **Wave 3**: 2 tasks — T5 → `unspecified-high`, T6 → `quick`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

- [x] 1. 라우터 PUBLIC_ROUTES 추가 + InviteEnterView 미인증 접근 허용

  **What to do**:
  - `src/router/index.js`의 `PUBLIC_ROUTES` 배열에 `"/invite/enter"` 추가
  - 이로써 미인증 사용자도 `/invite/enter` 페이지에 접근 가능
  - 라우터 가드의 역할 체크(`/invite/*`는 trainer/member 경로가 아님)는 이미 통과하므로 추가 수정 불필요

  **Must NOT do**:
  - 다른 invite 경로(`/invite/manage`)를 PUBLIC에 추가하지 말 것 — 트레이너 전용
  - 라우터 가드 로직 자체를 변경하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, 배열에 문자열 1개 추가
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/router/index.js:12` — `PUBLIC_ROUTES` 배열 정의. 여기에 `"/invite/enter"` 추가

  **Acceptance Criteria**:

  ```
  Scenario: 미인증 사용자가 /invite/enter 접근 시 로그인 리다이렉트 없이 페이지 표시
    Tool: Playwright
    Preconditions: 로그인하지 않은 상태 (세션 없음)
    Steps:
      1. page.goto('http://localhost:5173/invite/enter')
      2. page.waitForSelector('.invite-enter')
      3. Assert: page.url() contains '/invite/enter' (NOT '/login')
      4. Assert: '.invite-enter__title' text is '초대 코드 입력'
    Expected Result: 페이지가 정상 표시되고 /login으로 리다이렉트되지 않음
    Evidence: .sisyphus/evidence/task-1-unauthenticated-access.png

  Scenario: 미인증 사용자가 /invite/manage 접근 시 여전히 /login으로 리다이렉트
    Tool: Playwright
    Preconditions: 로그인하지 않은 상태
    Steps:
      1. page.goto('http://localhost:5173/invite/manage')
      2. page.waitForURL('**/login')
      3. Assert: page.url() contains '/login'
    Expected Result: /invite/manage는 여전히 보호됨
    Evidence: .sisyphus/evidence/task-1-manage-still-protected.png
  ```

  **Commit**: YES (groups with 2)
  - Message: `feat(invite): allow unauthenticated access to invite enter page with deep link support`
  - Files: `src/router/index.js`

- [x] 2. InviteEnterView — ?code= 쿼리 파라미터 자동 채우기 + 인증 상태별 UI 분기

  **What to do**:
  - `onMounted`에서 `route.query.code` 읽어서 `codeDigits` 배열에 자동 채우기 (최대 6자)
  - `useAuthStore`의 `user` 상태로 인증 여부 판단
  - **미인증 상태** UI:
    - "연결 확정" 버튼 대신 "로그인 / 회원가입" 버튼 표시
    - 버튼 클릭 시: 코드를 `localStorage.setItem('pending_invite_code', code)` 저장 → `router.push('/login')` 이동
  - **인증 상태** UI:
    - 기존 "연결 확정" 버튼 그대로 유지 (기존 `handleConfirm` 로직)
  - 코드 자동 채우기 시 각 input 필드에 값 반영

  **Must NOT do**:
  - 미인증 상태에서 `invite_codes` 테이블 조회하지 말 것 (RLS 차단됨)
  - 미인증 상태에서 `redeemInviteCode` RPC 호출하지 말 것
  - 기존 코드 입력 UI (6자리 박스) 디자인 변경하지 말 것
  - InviteEnterView.css 수정하지 말 것 (새 버튼은 기존 `.invite-enter__confirm-btn` 스타일 재사용)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 분기 로직 + 조건부 버튼 렌더링
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4, 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/views/invite/InviteEnterView.vue` — 전체 파일. 현재 `handleConfirm()` 함수가 RPC 호출 + 라우팅 처리
  - `src/views/invite/InviteEnterView.vue:46-49` — 현재 footer 영역의 "연결 확정" 버튼
  - `src/views/invite/InviteEnterView.vue:62` — `codeDigits` ref 배열 구조
  - `src/views/invite/InviteEnterView.vue:52-60` — script setup의 import 및 상태 선언

  **API/Type References**:
  - `src/stores/auth.js:14-20` — `user` ref: 인증 여부 판단에 사용 (`!!auth.user`)
  - `vue-router` — `useRoute().query.code`: 쿼리 파라미터 접근

  **Acceptance Criteria**:

  ```
  Scenario: 딥링크 ?code=CF4VO2로 접근 시 코드 자동 채우기
    Tool: Playwright
    Preconditions: 미인증 상태
    Steps:
      1. page.goto('http://localhost:5173/invite/enter?code=CF4VO2')
      2. page.waitForSelector('.invite-enter__code-box')
      3. const values = await page.$$eval('.invite-enter__code-box', els => els.map(e => e.value))
      4. Assert: values === ['C', 'F', '4', 'V', 'O', '2']
    Expected Result: 6개 입력 필드에 코드가 한 글자씩 채워짐
    Evidence: .sisyphus/evidence/task-2-auto-fill-code.png

  Scenario: 미인증 상태에서 "로그인 / 회원가입" 버튼 표시 + 클릭 시 localStorage 저장 후 /login 이동
    Tool: Playwright
    Preconditions: 미인증 상태
    Steps:
      1. page.goto('http://localhost:5173/invite/enter?code=CF4VO2')
      2. page.waitForSelector('.invite-enter__confirm-btn')
      3. const btnText = await page.$eval('.invite-enter__confirm-btn', el => el.textContent.trim())
      4. Assert: btnText includes '로그인' or '회원가입'
      5. await page.click('.invite-enter__confirm-btn')
      6. await page.waitForURL('**/login')
      7. const stored = await page.evaluate(() => localStorage.getItem('pending_invite_code'))
      8. Assert: stored === 'CF4VO2'
    Expected Result: 버튼에 로그인/가입 텍스트, 클릭 시 코드 저장 후 로그인 이동
    Evidence: .sisyphus/evidence/task-2-unauthenticated-btn.png

  Scenario: 인증 상태에서 기존 "연결 확정" 버튼 표시
    Tool: Playwright
    Preconditions: member 역할로 로그인된 상태
    Steps:
      1. page.goto('http://localhost:5173/invite/enter?code=CF4VO2')
      2. page.waitForSelector('.invite-enter__confirm-btn')
      3. const btnText = await page.$eval('.invite-enter__confirm-btn', el => el.textContent.trim())
      4. Assert: btnText includes '연결 확정'
    Expected Result: 로그인 상태에서는 기존 "연결 확정" 버튼 유지
    Evidence: .sisyphus/evidence/task-2-authenticated-btn.png
  ```

  **Commit**: YES (groups with 1)
  - Message: `feat(invite): allow unauthenticated access to invite enter page with deep link support`
  - Files: `src/views/invite/InviteEnterView.vue`

- [x] 3. AuthCallbackView — 초대 코드 감지 + 자동 member 역할 설정 + MemberProfileView 이동

  **What to do**:
  - `handleRedirect(session)` 함수 내에서 `auth.role`이 없을 때(신규 가입) 기존 로직:
    ```
    if (!auth.role) → router.replace('/onboarding/role')
    ```
    이 부분을 수정:
    1. `localStorage.getItem('pending_invite_code')` 확인
    2. 초대 코드 있으면 → `saveRole(auth.user.id, 'member')` 호출 → `auth.setRole('member')` → `router.replace('/onboarding/member-profile')` 이동
    3. 초대 코드 없으면 → 기존대로 `/onboarding/role` 이동
  - `auth.role === 'member'`일 때(기존 가입 사용자 로그인) 기존 로직:
    ```
    router.replace('/member/home')
    ```
    이 부분을 수정:
    1. `localStorage.getItem('pending_invite_code')` 확인
    2. 초대 코드 있으면 → `redeemInviteCode(code)` 호출 → 성공 시 `localStorage.removeItem('pending_invite_code')` → `/member/home` 이동
    3. 초대 코드 없으면 → 기존대로 `/member/home` 이동
  - import 추가: `useProfile`의 `saveRole`, `useInvite`의 `redeemInviteCode`

  **Must NOT do**:
  - OAuth 콜백 처리 로직(onMounted, authListener) 변경하지 말 것
  - trainer 역할 처리 로직 변경하지 말 것
  - 에러 시 localStorage 코드를 삭제하지 말 것 (재시도 가능하게 유지)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 비동기 로직 + 조건 분기 + 여러 composable 조합
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 5, F1-F4
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/views/auth/AuthCallbackView.vue:34-57` — `handleRedirect()` 함수 전체. role 분기 로직이 여기에 있음
  - `src/views/auth/AuthCallbackView.vue:50-56` — 현재 role 기반 리다이렉트 (수정 대상)

  **API/Type References**:
  - `src/composables/useProfile.js` — `saveRole(userId, role)` 함수: profiles 테이블에 역할 저장
  - `src/composables/useInvite.js:83-100` — `redeemInviteCode(code)` 함수: connect_via_invite RPC 호출
  - `src/stores/auth.js:47-64` — `setRole(newRole)` 함수: 로컬 상태에 역할 반영

  **Acceptance Criteria**:

  ```
  Scenario: OAuth 신규 가입 + pending_invite_code → 자동 member 역할 + MemberProfileView 이동
    Tool: Playwright
    Preconditions: localStorage에 pending_invite_code='TEST01' 저장, 신규 가입 사용자 (role 없음)
    Steps:
      1. OAuth 가입 완료 후 /auth/callback으로 리다이렉트
      2. handleRedirect 실행
      3. Assert: profiles 테이블에 role='member' 저장됨
      4. Assert: page.url() contains '/onboarding/member-profile'
      5. Assert: localStorage에 pending_invite_code 여전히 존재 (MemberProfileView에서 사용)
    Expected Result: RoleSelectView 스킵, 자동 member 설정, 프로필 입력 페이지로 이동
    Evidence: .sisyphus/evidence/task-3-oauth-new-user-invite.png

  Scenario: OAuth 기존 member 로그인 + pending_invite_code → 자동 트레이너 연동
    Tool: Playwright
    Preconditions: localStorage에 pending_invite_code 저장, 기존 member 사용자
    Steps:
      1. 로그인 완료 후 /auth/callback
      2. Assert: connect_via_invite RPC 호출됨
      3. Assert: localStorage.getItem('pending_invite_code') === null (사용 후 삭제)
      4. Assert: page.url() contains '/member/home'
    Expected Result: 로그인 후 자동 연동 + /member/home 도착
    Evidence: .sisyphus/evidence/task-3-oauth-existing-member-invite.png

  Scenario: OAuth 가입 + 초대 코드 없음 → 기존 플로우 유지
    Tool: Playwright
    Preconditions: localStorage에 pending_invite_code 없음
    Steps:
      1. 신규 가입 후 /auth/callback
      2. Assert: page.url() contains '/onboarding/role'
    Expected Result: 기존대로 역할 선택 페이지로 이동
    Evidence: .sisyphus/evidence/task-3-oauth-no-invite.png
  ```

  **Commit**: YES (groups with 4)
  - Message: `feat(auth): auto-detect pending invite code on login and set member role`
  - Files: `src/views/auth/AuthCallbackView.vue`

- [x] 4. EmailLoginView — 초대 코드 감지 + 자동 member 역할 설정 + MemberProfileView 이동

  **What to do**:
  - `handleSubmit()` 함수 내 **로그인 성공** 분기(line 158-164)에서:
    1. `localStorage.getItem('pending_invite_code')` 확인
    2. 초대 코드 있고 `auth.role === 'member'` → `redeemInviteCode(code)` 호출 → 성공 시 `localStorage.removeItem` → `/member/home` 이동
    3. 초대 코드 있고 `!auth.role` → 이미 역할 없으므로 `/onboarding/role`로 이동 (RoleSelectView의 Task 6에서 자동 처리)
    4. 초대 코드 없으면 → 기존 로직 유지
  - `handleSubmit()` 함수 내 **회원가입 성공** 분기(line 176-179)에서:
    1. `data?.session` 있으면 `auth.initialize()` 후
    2. `localStorage.getItem('pending_invite_code')` 확인
    3. 초대 코드 있으면 → `saveRole(auth.user.id, 'member')` → `auth.setRole('member')` → `router.replace('/onboarding/member-profile')` (RoleSelect 스킵)
    4. 초대 코드 없으면 → 기존대로 `/onboarding/role`
  - import 추가: `useProfile`의 `saveRole`, `useInvite`의 `redeemInviteCode`

  **Must NOT do**:
  - 이메일 validation 로직 변경하지 말 것
  - `parseAuthError` 함수 변경하지 말 것
  - 탭 전환 UI 변경하지 말 것
  - 에러 시 localStorage 코드 삭제하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 비동기 로직 + 조건 분기 + 여러 composable 조합 (Task 3과 유사)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 5, F1-F4
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/views/login/EmailLoginView.vue:136-190` — `handleSubmit()` 함수 전체
  - `src/views/login/EmailLoginView.vue:145-164` — 로그인 성공 분기 (수정 대상)
  - `src/views/login/EmailLoginView.vue:165-184` — 회원가입 성공 분기 (수정 대상)

  **API/Type References**:
  - `src/composables/useProfile.js` — `saveRole(userId, role)` 함수
  - `src/composables/useInvite.js:83-100` — `redeemInviteCode(code)` 함수
  - `src/stores/auth.js:47-64` — `setRole(newRole)` 함수

  **Acceptance Criteria**:

  ```
  Scenario: 이메일 회원가입 + pending_invite_code → 자동 member + MemberProfileView 이동
    Tool: Playwright
    Preconditions: localStorage에 pending_invite_code 저장
    Steps:
      1. page.goto('/email-login')
      2. 회원가입 탭 클릭
      3. 이메일/비밀번호 입력 → 가입 실행
      4. Assert: profiles 테이블에 role='member' 저장됨
      5. Assert: page.url() contains '/onboarding/member-profile'
    Expected Result: RoleSelectView 스킵, 자동 member 설정
    Evidence: .sisyphus/evidence/task-4-email-signup-invite.png

  Scenario: 이메일 로그인(기존 member) + pending_invite_code → 자동 연동
    Tool: Playwright
    Preconditions: localStorage에 pending_invite_code 저장, 기존 member 사용자
    Steps:
      1. page.goto('/email-login')
      2. 이메일/비밀번호 입력 → 로그인
      3. Assert: connect_via_invite RPC 호출
      4. Assert: localStorage pending_invite_code 삭제됨
      5. Assert: page.url() contains '/member/home'
    Expected Result: 로그인 후 자동 연동 + /member/home
    Evidence: .sisyphus/evidence/task-4-email-login-invite.png

  Scenario: 이메일 로그인 + 초대 코드 없음 → 기존 플로우 유지
    Tool: Playwright
    Preconditions: localStorage에 pending_invite_code 없음
    Steps:
      1. 기존 member 로그인
      2. Assert: page.url() contains '/member/home' (기존 동작)
    Expected Result: 기존 라우팅 그대로
    Evidence: .sisyphus/evidence/task-4-email-login-no-invite.png
  ```

  **Commit**: YES (groups with 3)
  - Message: `feat(auth): auto-detect pending invite code on login and set member role`
  - Files: `src/views/login/EmailLoginView.vue`

- [x] 5. MemberProfileView — 프로필 저장 후 자동 connect_via_invite + /member/home 이동

  **What to do**:
  - `handleComplete()` 함수의 마지막 부분(line 220-228) 수정:
    1. 프로필 저장 완료 후 `localStorage.getItem('pending_invite_code')` 확인
    2. 초대 코드 있으면:
       - `redeemInviteCode(code)` RPC 호출
       - 성공 시 `localStorage.removeItem('pending_invite_code')` 삭제
       - `router.push('/member/home')` 이동
       - 실패 시 에러 메시지 표시하되 프로필은 이미 저장됨. `router.push('/member/home')` 이동 (연동 실패해도 프로필은 유지)
    3. 초대 코드 없으면:
       - 기존 `fromInvite` 쿼리 로직은 제거 (더 이상 사용하지 않음)
       - `router.push('/search')` (기존 기본 동작)
  - **기존 버그 수정**: line 224의 `router.push('/home')` → `router.push('/member/home')`
  - import 추가: `useInvite`의 `redeemInviteCode`

  **Must NOT do**:
  - 프로필 저장 로직(profiles, member_profiles upsert) 변경하지 말 것
  - 사진 업로드 로직 변경하지 말 것
  - 폼 필드/유효성 검사 변경하지 말 것
  - `connect_via_invite` 실패 시 프로필 저장 롤백하지 말 것 (프로필은 독립적으로 유효)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 비동기 순차 로직 (프로필 저장 → RPC 호출 → 라우팅)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/views/onboarding/MemberProfileView.vue:182-228` — `handleComplete()` 함수 전체 (수정 대상)
  - `src/views/onboarding/MemberProfileView.vue:220-228` — 현재 라우팅 분기 (fromInvite 처리 + 기존 버그)

  **API/Type References**:
  - `src/composables/useInvite.js:83-100` — `redeemInviteCode(code)` 함수
  - `src/composables/useInvite.js:84-100` — 에러 처리 패턴 (error.value에 메시지 저장, null 반환)

  **Acceptance Criteria**:

  ```
  Scenario: 프로필 저장 + pending_invite_code → 자동 트레이너 연동 → /member/home
    Tool: Playwright
    Preconditions: member 역할 설정 완료, localStorage에 pending_invite_code 저장, 유효한 초대 코드
    Steps:
      1. MemberProfileView에서 이름 입력
      2. "작성 완료" 버튼 클릭
      3. Assert: profiles + member_profiles 저장 성공
      4. Assert: connect_via_invite RPC 호출 성공
      5. Assert: localStorage.getItem('pending_invite_code') === null
      6. Assert: page.url() contains '/member/home'
    Expected Result: 프로필 저장 → 자동 연동 → 홈 이동
    Evidence: .sisyphus/evidence/task-5-profile-complete-invite.png

  Scenario: 프로필 저장 + pending_invite_code + RPC 실패 → 에러 표시 + /member/home 이동
    Tool: Playwright
    Preconditions: localStorage에 잘못된 pending_invite_code 저장
    Steps:
      1. MemberProfileView에서 이름 입력
      2. "작성 완료" 클릭
      3. Assert: 프로필 저장 성공
      4. Assert: connect_via_invite RPC 실패 (잘못된 코드)
      5. Assert: 에러 메시지 표시 또는 /member/home 이동
    Expected Result: 프로필은 저장됨, 연동 실패 시에도 앱 사용 가능
    Evidence: .sisyphus/evidence/task-5-profile-invite-rpc-fail.png

  Scenario: 프로필 저장 + 초대 코드 없음 → 기존 /search 이동
    Tool: Playwright
    Preconditions: localStorage에 pending_invite_code 없음
    Steps:
      1. MemberProfileView에서 프로필 입력 + "작성 완료"
      2. Assert: page.url() contains '/search'
    Expected Result: 기존 동작 유지
    Evidence: .sisyphus/evidence/task-5-profile-no-invite.png

  Scenario: 기존 버그 수정 확인 — /home → /member/home
    Tool: Bash (grep)
    Steps:
      1. grep -n "'/home'" src/views/onboarding/MemberProfileView.vue
      2. Assert: 결과 없음 (모두 '/member/home'으로 변경됨)
    Expected Result: '/home' 참조 완전 제거
    Evidence: .sisyphus/evidence/task-5-home-bug-fix.txt
  ```

  **Commit**: YES (groups with 6)
  - Message: `feat(onboarding): auto-connect trainer via invite code after profile completion`
  - Files: `src/views/onboarding/MemberProfileView.vue`

- [x] 6. RoleSelectView — 초대 코드 존재 시 자동 member 설정 + MemberProfileView 직행

  **What to do**:
  - `onMounted`에서 `localStorage.getItem('pending_invite_code')` 확인
  - 초대 코드 있으면:
    1. 자동으로 `saveRole(auth.user.id, 'member')` 호출
    2. `auth.setRole('member')` 호출
    3. `router.replace('/onboarding/member-profile')` 이동
    4. 사용자는 RoleSelectView를 보지 못하고 바로 프로필 입력으로 진행
  - 초대 코드 없으면: 기존 역할 선택 UI 그대로 표시
  - 이 처리는 AuthCallbackView/EmailLoginView에서 역할 자동 설정 실패 시의 fallback 역할도 함

  **Must NOT do**:
  - 기존 역할 카드 UI 변경하지 말 것
  - "초대 코드를 받으셨나요?" 버튼 제거하지 말 것
  - 트레이너 프로필 라우팅 변경하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: onMounted에 간단한 조건 분기 추가
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/views/onboarding/RoleSelectView.vue:62-99` — script setup 전체
  - `src/views/onboarding/RoleSelectView.vue:78-98` — `handleNext()` 함수: `saveRole` + `setRole` + 라우팅 패턴 참고
  - `src/views/onboarding/RoleSelectView.vue:50-54` — 기존 "초대 코드를 받으셨나요?" 버튼

  **API/Type References**:
  - `src/composables/useProfile.js` — `saveRole(userId, role)` 함수
  - `src/stores/auth.js:47-64` — `setRole(newRole)` 함수

  **Acceptance Criteria**:

  ```
  Scenario: RoleSelectView 진입 + pending_invite_code → 자동 member + MemberProfileView 이동
    Tool: Playwright
    Preconditions: 로그인 상태, role 없음, localStorage에 pending_invite_code 저장
    Steps:
      1. page.goto('/onboarding/role')
      2. page.waitForURL('**/onboarding/member-profile')
      3. Assert: page.url() contains '/onboarding/member-profile'
      4. Assert: RoleSelectView가 사용자에게 보이지 않음 (즉시 리다이렉트)
    Expected Result: RoleSelectView 스킵, 바로 프로필 입력으로 이동
    Evidence: .sisyphus/evidence/task-6-role-auto-skip.png

  Scenario: RoleSelectView 진입 + 초대 코드 없음 → 기존 역할 선택 UI 표시
    Tool: Playwright
    Preconditions: 로그인 상태, role 없음, localStorage에 pending_invite_code 없음
    Steps:
      1. page.goto('/onboarding/role')
      2. page.waitForSelector('.role-select__title')
      3. Assert: '.role-select__title' text contains '어떤 역할로'
      4. Assert: 트레이너/회원 카드 2개 표시
    Expected Result: 기존 역할 선택 UI 정상 표시
    Evidence: .sisyphus/evidence/task-6-role-select-normal.png
  ```

  **Commit**: YES (groups with 5)
  - Message: `feat(onboarding): auto-connect trainer via invite code after profile completion`
  - Files: `src/views/onboarding/RoleSelectView.vue`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test the 4 main flows end-to-end:
  1. 미인증 + 딥링크 → 이메일 가입 → 프로필 → 연동 → /member/home
  2. 미인증 + 딥링크 → 카카오 가입 → 프로필 → 연동 → /member/home
  3. 가입된 사용자(미로그인) + 딥링크 → 로그인 → 연동 → /member/home
  4. 이미 로그인 + 딥링크 → 연결 확정 → /member/home
  Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(invite): allow unauthenticated access to invite enter page with deep link support` — router/index.js, InviteEnterView.vue, useInvite.js
- **Wave 2**: `feat(auth): auto-detect pending invite code on login and set member role` — AuthCallbackView.vue, EmailLoginView.vue
- **Wave 3**: `feat(onboarding): auto-connect trainer via invite code after profile completion` — MemberProfileView.vue, RoleSelectView.vue

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: Build successful, no errors
```

### Final Checklist
- [ ] 미인증 사용자가 `/invite/enter?code=XXXX` 접근 가능
- [ ] 코드 자동 채우기 동작
- [ ] localStorage에 `pending_invite_code` 저장/사용/삭제 정상
- [ ] 이메일 가입 플로우: 가입 → 자동 member → 프로필 → 연동 → /member/home
- [ ] OAuth 가입 플로우: 가입 → 자동 member → 프로필 → 연동 → /member/home
- [ ] 로그인 플로우: 로그인 → 연동 → /member/home
- [ ] 이미 로그인 상태: 기존 연결 확정 플로우 유지
- [ ] `npm run build` 성공
- [ ] "Must NOT Have" 항목 전부 미구현 확인
