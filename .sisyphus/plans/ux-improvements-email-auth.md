# UX 개선 + 이메일/비밀번호 인증 구현

## TL;DR

> **Quick Summary**: FitLink PT 매니저 앱의 14개 UX 개선사항(설정 프로필 버튼, 매뉴얼 뷰, 스케줄 뷰, 초대 사진)과 이메일/비밀번호 인증 전체 구현(회원가입, 로그인, 비밀번호 재설정, 계정관리 화면)을 수행한다.
>
> **Deliverables**:
> - 트레이너 설정에서 "내 프로필 수정" 버튼 제거, 프로필 보기 뷰에 수정 버튼 추가
> - 트레이너/회원 설정 "계정 관리" → 새 AccountManageView로 라우팅
> - InviteManageView 회원 아바타 DB photo_url 연결
> - TrainerManualView 수정/삭제 버튼 제거
> - 매뉴얼 리스트에 YouTube 썸네일 표시 (trainer + member)
> - ManualDetailView 트레이너 DB 사진 표시 + UI 개선 + AppBar 원형 배경
> - MemberScheduleView 운동 아이콘 교체 + 완료 아이템 스타일링
> - 이메일 로그인/회원가입 뷰 (DevLoginView 리팩터링)
> - 비밀번호 재설정 뷰
> - AccountManageView (이메일/비밀번호 변경, OAuth 사용자 구분)
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 (YouTube utility) → Task 6 (Manual thumbnails) → Task 7 (Manual detail) | Task 10 (EmailLogin) → Task 12 (AccountManage) → Task 13 (Settings routing)

---

## Context

### Original Request
사용자가 13개의 UI/UX 변경 요청과 이메일/비밀번호 인증 전체 구현을 요청. 주요 카테고리: 설정 뷰 프로필 버튼 정리, 매뉴얼 뷰 개선, 스케줄 뷰 개선, 초대 회원 사진 연결, 이메일 인증 추가.

### Interview Summary
**Key Discussions**:
- 계정관리 의도: 단순 Kakao 안내가 아닌 **이메일/비밀번호 인증 전체 구현** (signUp, signIn, resetPassword, 계정관리 화면)
- AppBar 가시성 해결: 뒤로가기 버튼에 **원형 배경 + 그림자** 추가
- DevLoginView.vue가 이미 작동하는 signUp + signInWithPassword 로직 보유 → 프로덕션용으로 리팩터링
- Supabase 이메일 인증이 이미 활성화되어 있으며 auto-confirm ON (이메일 확인 불필요)
- 기존 테스트 사용자 (trainer@test.com, member@test.com 등) 존재 확인

**Research Findings**:
- `scard--done` CSS 버그 발견: 템플릿은 `scard--${session.status}`로 `scard--completed` 생성하지만 CSS는 `.scard--done`만 정의 — 수정 필요
- useManuals.js가 이미 `trainer:profiles!trainer_id(name, photo_url)` select — ManualDetailView에서 photo_url 표시만 하면 됨
- `getThumbUrl()` 함수가 TrainerManualView와 MemberManualView에 동일하게 중복 존재 — YouTube 썸네일 로직 추가 시 공유 유틸리티로 추출
- YouTube 비디오 ID 추출 로직이 ManualDetailView에 이미 존재 (lines 171-178)

### Metis Review
**Identified Gaps** (addressed):
- 비밀번호 재설정에 2개 뷰 필요 (요청 폼 + 새 비밀번호 설정 폼) → PasswordResetView + auth/callback에서 recovery 토큰 처리
- OAuth 사용자(Kakao)는 AccountManageView에서 비밀번호 변경 불가 → auth provider 감지하여 다른 옵션 표시
- `scard--done` vs `scard--completed` CSS 불일치 버그 → Task 5에서 수정
- YouTube 비디오 ID 추출 로직 3곳 중복 → 공유 유틸리티 추출
- `/dev-login` 라우트 하위 호환성 → redirect 설정

---

## Work Objectives

### Core Objective
트레이너/회원 설정 UX 정리, 매뉴얼 뷰 개선, 스케줄 뷰 개선, 이메일/비밀번호 인증 전체 구현을 통해 앱 사용성과 인증 다양성을 향상한다.

### Concrete Deliverables
- 수정된 파일 13개 + 신규 파일 6개 (뷰 3개 + CSS 3개)
- 새 라우트 4개 (email-login, password-reset, password-update, account-manage)
- YouTube 썸네일 유틸리티 1개 (src/utils/youtube.js)

### Definition of Done
- [ ] `npm run build` 성공 (zero errors)
- [ ] `npm test` 기존 85/85 테스트 통과
- [ ] 모든 새 라우트가 router/index.js에 등록
- [ ] 모든 새 라우트가 PUBLIC_ROUTES에 적절히 포함/제외

### Must Have
- 이메일 회원가입 + 로그인 + 비밀번호 재설정 전체 작동
- 기존 Kakao OAuth 로그인 플로우 완전 유지
- AccountManageView에서 auth provider 감지 (Kakao vs Email 다른 옵션 표시)
- 매뉴얼 리스트에 YouTube 썸네일 표시
- ManualDetailView AppBar 뒤로가기 원형 배경
- MemberScheduleView 완료 아이템 시각적 구분

### Must NOT Have (Guardrails)
- 계정 삭제 기능 — 별도 feature
- 이메일 템플릿 커스터마이징 — Supabase Dashboard에서 처리
- 새 npm 패키지 설치
- TypeScript 파일 추가
- 코드 주석 (// comment 금지)
- 기존 테스트 파일 수정
- Kakao OAuth 플로우 변경
- AuthCallbackView 수정 (OAuth 전용 유지)
- 폼 유효성 검사 라이브러리 (인라인 검증만)
- auth provider 연결/해제 (Kakao ↔ Email linking)
- 프로필 사진 업로드를 AccountManageView에 추가
- 매뉴얼 카드 레이아웃 전체 재설계 (썸네일 추가만)
- 스케줄 카드 전체 재설계 (완료 스타일 추가만)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: None for this batch — composable-only test policy, and the changes are mostly view/template level
- **Framework**: Vitest (existing, do not modify)
- **Existing tests**: 85/85 must remain passing — `npm test`

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Build**: Use Bash — `npm run build`, `npm test`
- **Code verification**: Use Bash (grep) — verify patterns exist/removed

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — utility extraction + independent UI fixes):
├── Task 1: YouTube utility extraction (src/utils/youtube.js) [quick]
├── Task 2: SettingsView "내 프로필 수정" 제거 + TrainerProfileReadOnlyView 수정 버튼 [quick]
├── Task 3: InviteManageView 회원 사진 DB 연결 [quick]
├── Task 4: TrainerManualView 수정/삭제 버튼 제거 [quick]
└── Task 5: MemberScheduleView 아이콘 교체 + 완료 스타일링 + CSS 버그 수정 [quick]

Wave 2 (After Task 1 — manual view enhancements):
├── Task 6: 매뉴얼 리스트 YouTube 썸네일 (trainer + member) [quick]
├── Task 7: ManualDetailView 트레이너 사진 + UI 개선 + AppBar 원형 배경 [visual-engineering]

Wave 3 (Start Immediately — auth views, parallel with Wave 1+2):
├── Task 8: EmailLoginView (DevLoginView 리팩터링) [unspecified-high]
├── Task 9: PasswordResetView (비밀번호 재설정 요청 + 새 비밀번호 설정) [unspecified-high]
└── Task 10: AccountManageView (이메일/비밀번호 변경 + OAuth 감지) [unspecified-high]

Wave 4 (After ALL — routing + integration + final):
├── Task 11: Router 업데이트 + LoginView 버튼 수정 + Settings 라우트 변경 [quick]
└── Task 12: 빌드 검증 + 전체 테스트 [deep]

Wave FINAL (After ALL tasks — independent review):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1 → Task 6 | Task 8 → Task 11 → Task 12 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 5 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 (YouTube util) | — | 6 |
| 2 (Settings buttons) | — | 11 |
| 3 (Invite photos) | — | — |
| 4 (Manual buttons) | — | — |
| 5 (Schedule styling) | — | — |
| 6 (Manual thumbnails) | 1 | — |
| 7 (Manual detail) | — | — |
| 8 (EmailLogin) | — | 11 |
| 9 (PasswordReset) | — | 11 |
| 10 (AccountManage) | — | 11 |
| 11 (Router + wiring) | 2, 8, 9, 10 | 12 |
| 12 (Build + test) | ALL | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: **5** — T1 → `quick`, T2 → `quick`, T3 → `quick`, T4 → `quick`, T5 → `quick`
- **Wave 2**: **2** — T6 → `quick`, T7 → `visual-engineering`
- **Wave 3**: **3** — T8 → `unspecified-high`, T9 → `unspecified-high`, T10 → `unspecified-high`
- **Wave 4**: **2** — T11 → `quick`, T12 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. YouTube 썸네일 유틸리티 추출

  **What to do**:
  - `src/utils/youtube.js` 파일 생성
  - ManualDetailView.vue lines 171-178의 YouTube 비디오 ID 추출 로직을 `extractYoutubeVideoId(url)` 함수로 추출
  - `getYoutubeThumbnailUrl(url)` 함수 추가 — URL에서 비디오 ID 추출 후 `https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg` 반환. 비디오 ID 없으면 null 반환
  - ManualDetailView.vue에서 기존 `youtubeVideoId` computed를 `extractYoutubeVideoId` import로 교체
  - 패턴: `url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)` (ManualDetailView에서 사용 중인 패턴 참조하되, youtu.be 단축 URL도 지원)

  **Must NOT do**:
  - `getThumbUrl()` 함수를 이 태스크에서 수정하지 않음 (Task 6에서 처리)
  - 새 npm 패키지 설치하지 않음
  - 코드 주석 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단순 유틸리티 함수 추출 + 한 파일 import 교체
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: UI 변경 없음

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Task 6 (매뉴얼 리스트 YouTube 썸네일)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/member/ManualDetailView.vue:171-178` — 기존 YouTube 비디오 ID 추출 computed. 이 로직을 유틸리티로 이동
  - `src/views/member/ManualDetailView.vue:114,118` — youtubeVideoId가 사용되는 템플릿 위치. import 교체 후에도 동일하게 동작해야 함

  **API/Type References**:
  - 없음 (순수 JS 유틸리티)

  **External References**:
  - YouTube URL 패턴: `youtube.com/watch?v=VIDEO_ID`, `youtu.be/VIDEO_ID`
  - 썸네일 URL: `https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: YouTube 유틸리티 함수 정상 동작 확인
    Tool: Bash
    Steps:
      1. grep -c "export function extractYoutubeVideoId" src/utils/youtube.js
         → Assert: 1
      2. grep -c "export function getYoutubeThumbnailUrl" src/utils/youtube.js
         → Assert: 1
      3. grep -c "import.*youtube" src/views/member/ManualDetailView.vue
         → Assert: >= 1
      4. grep -c "youtubeVideoId" src/views/member/ManualDetailView.vue
         → Assert: >= 1 (computed still used in template)
      5. npm run build
         → Assert: exit code 0
    Expected Result: 유틸리티 파일 생성, ManualDetailView에서 import 사용, 빌드 성공
    Evidence: .sisyphus/evidence/task-1-youtube-util.txt

  Scenario: ManualDetailView YouTube 영상 여전히 재생 확인
    Tool: Playwright (playwright skill)
    Preconditions: 로그인된 상태, YouTube URL이 있는 매뉴얼이 존재
    Steps:
      1. Navigate to a manual detail page with YouTube URL
      2. Assert: iframe with src containing "youtube.com/embed/" exists
    Expected Result: YouTube 임베드가 정상 렌더링
    Evidence: .sisyphus/evidence/task-1-youtube-embed.png
  ```

  **Commit**: YES (groups with Tasks 4, 6)
  - Message: `feat(manual): extract YouTube thumbnail utility and add thumbnails to manual lists`
  - Files: `src/utils/youtube.js`, `src/views/member/ManualDetailView.vue`

- [ ] 2. SettingsView "내 프로필 수정" 버튼 제거 + TrainerProfileReadOnlyView 수정 버튼 추가

  **What to do**:
  - `src/views/trainer/SettingsView.vue`: lines 32-43의 "내 프로필 수정" 버튼 블록 전체 제거
  - `src/views/trainer/SettingsView.css`: 해당 버튼 관련 CSS 있으면 제거 (공통 스타일이라 남길 수도 있음)
  - `src/views/trainer/TrainerProfileReadOnlyView.vue`: 헤더 영역에 우측 수정 아이콘 버튼 추가
    - 현재 헤더: `<div style="width: 40px" />` 스페이서 → 이 위치에 수정 아이콘 버튼 배치
    - 클릭 시 `router.push({ name: 'trainer-profile-edit' })` 실행
    - 수정 아이콘: 연필 SVG 아이콘 (인라인, stroke="currentColor")

  **Must NOT do**:
  - `trainer-profile-edit` 라우트를 삭제하지 않음 (수정 버튼이 여전히 사용)
  - "계정 관리" 버튼은 이 태스크에서 변경하지 않음 (Task 11에서 처리)
  - 코드 주석 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단순 템플릿 요소 제거 + 추가
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Task 11 (Router wiring)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/SettingsView.vue:32-43` — 제거할 "내 프로필 수정" 버튼 블록
  - `src/views/trainer/SettingsView.vue:59-72` — "계정 관리" 버튼 (Task 11에서 처리, 여기선 건드리지 않음)
  - `src/views/trainer/TrainerProfileReadOnlyView.vue:6-14` — 헤더 영역 구조 (뒤로가기 + 타이틀 + 스페이서)
  - `src/views/trainer/TrainerProfileReadOnlyView.vue:6` — `<div style="width: 40px" />` 스페이서 → 수정 버튼으로 교체

  **API/Type References**:
  - 라우트 이름: `trainer-profile-edit` (src/router/index.js:225-229)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: SettingsView에서 "내 프로필 수정" 버튼 제거 확인
    Tool: Bash
    Steps:
      1. grep -c "내 프로필 수정" src/views/trainer/SettingsView.vue
         → Assert: 0
      2. npm run build
         → Assert: exit code 0
    Expected Result: 버튼 텍스트가 SettingsView에서 완전히 제거됨
    Evidence: .sisyphus/evidence/task-2-settings-no-profile-edit.txt

  Scenario: TrainerProfileReadOnlyView에 수정 버튼 존재 확인
    Tool: Bash
    Steps:
      1. grep -c "trainer-profile-edit" src/views/trainer/TrainerProfileReadOnlyView.vue
         → Assert: >= 1
    Expected Result: 프로필 보기 화면에서 수정 페이지로 이동 가능
    Evidence: .sisyphus/evidence/task-2-readonly-edit-btn.txt

  Scenario: 프로필 보기에서 수정 버튼 클릭 동작 확인
    Tool: Playwright (playwright skill)
    Preconditions: 트레이너 계정으로 로그인
    Steps:
      1. Navigate to /trainer/settings
      2. Assert: 페이지에 "내 프로필 수정" 텍스트 없음
      3. Click "내 프로필 보기" → /trainer/profile-view로 이동
      4. Assert: 우측 상단에 수정 아이콘 버튼 존재
      5. Click 수정 버튼 → /trainer/profile-edit로 이동 확인
    Expected Result: 설정 → 프로필 보기 → 수정 버튼 → 프로필 편집 플로우 정상 동작
    Evidence: .sisyphus/evidence/task-2-profile-edit-flow.png
  ```

  **Commit**: YES (groups with Tasks 3, 5, 7)
  - Message: `fix(ui): improve settings buttons, invite photos, schedule styling, manual detail`
  - Files: `src/views/trainer/SettingsView.vue`, `src/views/trainer/TrainerProfileReadOnlyView.vue`

- [ ] 3. InviteManageView 회원 사진 DB 연결

  **What to do**:
  - `src/composables/useInvite.js` line 110: `.select('member_id, connected_at, profiles!trainer_members_member_id_fkey(name)')` → `photo_url` 추가: `.select('member_id, connected_at, profiles!trainer_members_member_id_fkey(name, photo_url)')`
  - `src/views/invite/InviteManageView.vue` line 54: `person.svg` 하드코딩된 `<img>` → 조건부 렌더링:
    - `member.profiles?.photo_url` 존재 시: `<img :src="member.profiles.photo_url" />`
    - 없을 시: 기존 `person.svg` 폴백 유지
  - 아바타 이미지에 `object-fit: cover; border-radius: 50%` 스타일 보장

  **Must NOT do**:
  - person.svg 폴백 제거하지 않음
  - 아바타 크기 변경하지 않음
  - 코드 주석 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: composable select 한 줄 + 템플릿 조건부 렌더링
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/composables/useInvite.js:108-114` — fetchConnectedMembers 함수. line 110의 `.select()` 수정 위치
  - `src/views/invite/InviteManageView.vue:50-60` — 회원 아바타 렌더링 영역. line 54의 person.svg 위치

  **API/Type References**:
  - `supabase/schema.sql` profiles 테이블: `photo_url text` 컬럼

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: useInvite.js에서 photo_url 조회 확인
    Tool: Bash
    Steps:
      1. grep "photo_url" src/composables/useInvite.js
         → Assert: photo_url이 select 절에 포함
    Expected Result: photo_url이 DB 조회에 포함됨
    Evidence: .sisyphus/evidence/task-3-invite-select.txt

  Scenario: InviteManageView 회원 사진 렌더링 확인
    Tool: Bash
    Steps:
      1. grep "photo_url" src/views/invite/InviteManageView.vue
         → Assert: >= 1
      2. grep "person.svg" src/views/invite/InviteManageView.vue
         → Assert: >= 1 (폴백 유지)
      3. npm run build
         → Assert: exit code 0
    Expected Result: photo_url 조건부 렌더링 + person.svg 폴백 유지
    Evidence: .sisyphus/evidence/task-3-invite-photo.txt
  ```

  **Commit**: YES (groups with Tasks 2, 5, 7)
  - Message: `fix(ui): improve settings buttons, invite photos, schedule styling, manual detail`
  - Files: `src/composables/useInvite.js`, `src/views/invite/InviteManageView.vue`

- [ ] 4. TrainerManualView 수정/삭제 버튼 제거

  **What to do**:
  - `src/views/trainer/TrainerManualView.vue`: lines 112-125의 카드별 수정/삭제 버튼 블록 제거
    - "수정" 버튼 (ManualRegisterView로 이동)과 "삭제" 버튼 (삭제 다이얼로그 표시) 제거
    - 버튼 관련 로직(showDeleteDialog, deleteTarget, confirmDelete 등)이 ManualDetailView에도 존재하는지 확인 → 존재하면 안전하게 제거 가능
  - `src/views/trainer/TrainerManualView.css`: 수정/삭제 버튼 관련 CSS 클래스 제거 (`.manual-list__card-actions` 등)
  - 삭제 확인 다이얼로그 (AppBottomSheet)도 이 뷰에서 제거 (ManualDetailView에 이미 있음)

  **Must NOT do**:
  - ManualDetailView의 수정/삭제 기능을 건드리지 않음
  - 카드 클릭 → 상세보기 이동 기능을 제거하지 않음
  - 코드 주석 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 템플릿 블록 + CSS + 관련 로직 제거
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerManualView.vue:112-125` — 제거할 수정/삭제 버튼 블록
  - `src/views/trainer/TrainerManualView.vue:168-169` — showDeleteDialog, deleteTarget refs (버튼 제거 시 같이 제거)
  - `src/views/member/ManualDetailView.vue` — 매뉴얼 상세 뷰에 수정/삭제가 이미 존재하는지 확인 필요

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: TrainerManualView에서 수정/삭제 버튼 완전 제거 확인
    Tool: Bash
    Steps:
      1. grep -c "manual-list__card-actions\|삭제\|수정.*router" src/views/trainer/TrainerManualView.vue
         → Assert: 0 (or minimal — "수정" may appear in unrelated contexts)
      2. grep -c "showDeleteDialog\|deleteTarget\|confirmDelete" src/views/trainer/TrainerManualView.vue
         → Assert: 0
      3. npm run build
         → Assert: exit code 0
    Expected Result: 매뉴얼 리스트 카드에 수정/삭제 버튼 없음
    Evidence: .sisyphus/evidence/task-4-manual-no-buttons.txt

  Scenario: ManualDetailView 수정/삭제 기능 여전히 존재 확인
    Tool: Bash
    Steps:
      1. grep -c "삭제\|수정" src/views/member/ManualDetailView.vue
         → Assert: >= 1
    Expected Result: 상세 보기에서는 수정/삭제 여전히 가능
    Evidence: .sisyphus/evidence/task-4-detail-has-buttons.txt
  ```

  **Commit**: YES (groups with Tasks 1, 6)
  - Message: `feat(manual): extract YouTube thumbnail utility and add thumbnails to manual lists`
  - Files: `src/views/trainer/TrainerManualView.vue`, `src/views/trainer/TrainerManualView.css`

- [ ] 5. MemberScheduleView 운동 아이콘 교체 + 완료 아이템 스타일링 + CSS 버그 수정

  **What to do**:
  - **아이콘 교체**: `src/views/member/MemberScheduleView.vue` lines 202-204의 바벨 SVG 아이콘을 체크마크 원형 아이콘으로 교체:
    ```html
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="rgba(0,122,255,0.08)" stroke="var(--color-blue-primary)" stroke-width="1.4"/>
      <path d="M8 12L11 15L16 9" stroke="var(--color-blue-primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    ```
  - **CSS 버그 수정**: `src/views/member/MemberScheduleView.css` line 275의 `.scard--done`을 `.scard--completed`로 변경. 템플릿이 `scard--${session.status}`를 사용하고 DB status가 `completed`이므로 CSS 클래스도 `scard--completed`로 맞춰야 함.
  - **완료 스타일 강화**: `.scard--completed`에 다음 스타일 추가:
    - 카드 전체 opacity: 0.6
    - 텍스트에 취소선 또는 연한 색상
    - 좌측 border color를 회색 계열로
    - 체크마크 아이콘의 circle fill을 완료 색상으로 변경 (선택적)

  **Must NOT do**:
  - 다른 status (approved, pending, cancelled)의 스타일을 변경하지 않음
  - 스케줄 카드 전체 레이아웃 재설계하지 않음
  - 코드 주석 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: SVG 교체 + CSS 수정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/member/MemberScheduleView.vue:202-204` — 현재 바벨 SVG 아이콘 위치
  - `src/views/member/MemberScheduleView.vue:120-124` — `scard--${session.status}` 동적 클래스 바인딩
  - `src/views/member/MemberScheduleView.css:275-277` — `.scard--done` (버그: 이 클래스는 절대 적용되지 않음)
  - `src/views/member/MemberScheduleView.css:278-280` — `.scard--approved` 스타일 (참고 패턴)
  - `src/views/member/MemberScheduleView.css:281-283` — `.scard--pending` 스타일 (참고 패턴)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 바벨 아이콘 제거 + 체크마크 아이콘 추가 확인
    Tool: Bash
    Steps:
      1. grep -c "M6 4v16M18 4v16" src/views/member/MemberScheduleView.vue
         → Assert: 0 (바벨 아이콘 SVG path 제거됨)
      2. grep -c "M8 12L11 15L16 9" src/views/member/MemberScheduleView.vue
         → Assert: >= 1 (체크마크 아이콘 SVG path 추가됨)
    Expected Result: 바벨 → 체크마크 아이콘 교체 완료
    Evidence: .sisyphus/evidence/task-5-icon-swap.txt

  Scenario: CSS 버그 수정 — scard--completed 클래스 존재
    Tool: Bash
    Steps:
      1. grep -c "scard--done" src/views/member/MemberScheduleView.css
         → Assert: 0 (버그 클래스 제거됨)
      2. grep -c "scard--completed" src/views/member/MemberScheduleView.css
         → Assert: >= 1 (올바른 클래스 사용)
    Expected Result: 완료 상태 CSS가 올바른 클래스명 사용
    Evidence: .sisyphus/evidence/task-5-css-fix.txt

  Scenario: 완료 아이템 시각적 차이 확인
    Tool: Playwright (playwright skill)
    Preconditions: 회원 계정으로 로그인, completed 예약이 있는 날짜 존재
    Steps:
      1. Navigate to /member/schedule
      2. Select a date with completed reservations
      3. Assert: completed 카드가 opacity 적용됨 (시각적으로 구분)
      4. Screenshot 캡처
    Expected Result: 완료된 예약이 미완료 예약과 시각적으로 명확히 구분됨
    Evidence: .sisyphus/evidence/task-5-completed-style.png
  ```

  **Commit**: YES (groups with Tasks 2, 3, 7)
  - Message: `fix(ui): improve settings buttons, invite photos, schedule styling, manual detail`
  - Files: `src/views/member/MemberScheduleView.vue`, `src/views/member/MemberScheduleView.css`

- [ ] 6. 매뉴얼 리스트 YouTube 썸네일 추가 (trainer + member)

  **What to do**:
  - `src/views/trainer/TrainerManualView.vue`: `getThumbUrl()` 함수 (line 171-175) 수정
    - Task 1에서 만든 `getYoutubeThumbnailUrl`을 import
    - 기존 로직: 이미지 미디어 있으면 URL 반환, 없으면 null
    - 변경: 이미지 미디어 없으면 YouTube 썸네일 시도 (`getYoutubeThumbnailUrl(manual.youtube_url)`), 둘 다 없으면 null
  - `src/views/member/MemberManualView.vue`: 동일하게 `getThumbUrl()` 함수 (line 133-137) 수정
    - 같은 패턴으로 YouTube 썸네일 폴백 추가
  - 기존 이미지 미디어가 있으면 그것을 우선 사용 (YouTube 썸네일은 폴백)

  **Must NOT do**:
  - 이미지 미디어가 있는 매뉴얼의 썸네일을 YouTube로 교체하지 않음
  - 카드 레이아웃 전체를 재설계하지 않음
  - 코드 주석 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 함수에 YouTube 폴백 로직 2줄 추가
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 7)
  - **Blocks**: None
  - **Blocked By**: Task 1 (YouTube utility)

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerManualView.vue:171-175` — 현재 getThumbUrl 함수 (이미지만 검색)
  - `src/views/member/MemberManualView.vue:133-137` — 동일한 getThumbUrl 함수
  - `src/views/trainer/TrainerManualView.vue:88-89` — getThumbUrl 사용 위치 (v-if + :src)
  - `src/views/member/MemberManualView.vue:66-67` — 동일한 사용 위치
  - `src/utils/youtube.js` — Task 1에서 생성한 유틸리티 (getYoutubeThumbnailUrl)

  **API/Type References**:
  - manuals 테이블: `youtube_url text` 컬럼 (supabase/schema.sql)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: YouTube 썸네일 로직 추가 확인
    Tool: Bash
    Steps:
      1. grep -c "getYoutubeThumbnailUrl\|youtube" src/views/trainer/TrainerManualView.vue
         → Assert: >= 1
      2. grep -c "getYoutubeThumbnailUrl\|youtube" src/views/member/MemberManualView.vue
         → Assert: >= 1
      3. npm run build
         → Assert: exit code 0
    Expected Result: 양쪽 뷰에 YouTube 썸네일 폴백 추가됨
    Evidence: .sisyphus/evidence/task-6-youtube-thumbs.txt

  Scenario: YouTube URL 매뉴얼에 썸네일 표시 확인
    Tool: Playwright (playwright skill)
    Preconditions: 로그인 상태, YouTube URL이 있고 이미지 미디어는 없는 매뉴얼 존재
    Steps:
      1. Navigate to /trainer/settings/manual (트레이너) 또는 /member/manual (회원)
      2. Assert: YouTube URL이 있는 매뉴얼 카드에 img.youtube.com 썸네일 이미지 표시
      3. Screenshot 캡처
    Expected Result: YouTube 썸네일이 리스트 아이템에 표시됨
    Evidence: .sisyphus/evidence/task-6-youtube-thumb-visible.png
  ```

  **Commit**: YES (groups with Tasks 1, 4)
  - Message: `feat(manual): extract YouTube thumbnail utility and add thumbnails to manual lists`
  - Files: `src/views/trainer/TrainerManualView.vue`, `src/views/member/MemberManualView.vue`

- [ ] 7. ManualDetailView 트레이너 사진 + UI 개선 + AppBar 원형 배경

  **What to do**:
  - **트레이너 DB 사진 표시**: `src/views/member/ManualDetailView.vue`에서 `manual.trainer?.photo_url`을 아바타로 표시
    - 현재 `manual.trainer?.name`만 표시 중 — photo_url은 이미 useManuals.js에서 fetch됨 (line 44, 64, 83)
    - 트레이너 사진 + 이름을 함께 표시하는 컴팩트 영역으로 변경
  - **트레이너 영역 축소**: 트레이너 정보 섹션을 축소하고, 영상 + 설명이 더 강조되도록 UI/UX 개선
    - 트레이너 프로필 영역: 작은 아바타 (32px) + 이름 인라인 → 한 줄로 축소
    - 영상 섹션: 더 큰 비율로 표시
    - 설명 섹션: 폰트 크기/간격 유지하되 영역이 더 위로 올라옴
  - **AppBar 뒤로가기 원형 배경**: `src/views/member/ManualDetailView.css`에 뒤로가기 버튼 스타일 추가:
    - 원형 배경: `background-color: rgba(255,255,255,0.85); backdrop-filter: blur(8px); border-radius: 50%`
    - 그림자: `box-shadow: 0 2px 8px rgba(0,0,0,0.15)`
    - 크기: 36px × 36px, 중앙 정렬
    - 아이콘 색상: `stroke: var(--color-gray-900)` (어두운 색으로 고정)

  **Must NOT do**:
  - 매뉴얼 데이터 fetch 로직 변경하지 않음 (useManuals.js 이미 photo_url 포함)
  - 수정/삭제 버튼 위치 변경하지 않음
  - 코드 주석 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI/UX 디자인 판단 필요 (트레이너 영역 축소, 영상 강조, AppBar 스타일)
  - **Skills**: [`playwright`]
    - `playwright`: UI 변경 시각적 검증

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 6)
  - **Blocks**: None
  - **Blocked By**: None (useManuals.js 수정 불필요)

  **References**:

  **Pattern References**:
  - `src/views/member/ManualDetailView.vue:75-90` — 현재 트레이너 정보 섹션 (수정 대상)
  - `src/views/member/ManualDetailView.vue:20-30` — 현재 AppBar/뒤로가기 버튼 영역
  - `src/views/member/ManualDetailView.css` — 전체 CSS (companion file)
  - `src/composables/useManuals.js:44` — select에 `trainer:profiles!trainer_id(name, photo_url)` 이미 포함

  **External References**:
  - iOS-style floating back button 패턴: `backdrop-filter: blur()` + 반투명 배경 + 그림자

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 트레이너 사진 DB 연결 확인
    Tool: Bash
    Steps:
      1. grep "photo_url" src/views/member/ManualDetailView.vue
         → Assert: >= 1 (trainer photo_url 참조)
      2. npm run build
         → Assert: exit code 0
    Expected Result: ManualDetailView가 trainer photo_url을 렌더링
    Evidence: .sisyphus/evidence/task-7-trainer-photo.txt

  Scenario: AppBar 뒤로가기 버튼 원형 배경 스타일 확인
    Tool: Bash
    Steps:
      1. grep -c "border-radius.*50%\|backdrop-filter\|blur" src/views/member/ManualDetailView.css
         → Assert: >= 1
      2. grep -c "box-shadow" src/views/member/ManualDetailView.css
         → Assert: >= 1
    Expected Result: 뒤로가기 버튼에 원형 배경 + 블러 + 그림자 스타일 적용
    Evidence: .sisyphus/evidence/task-7-appbar-style.txt

  Scenario: ManualDetailView UI 변경 시각적 확인
    Tool: Playwright (playwright skill)
    Preconditions: 로그인, YouTube URL + 트레이너 사진이 있는 매뉴얼 존재
    Steps:
      1. Navigate to manual detail page
      2. Assert: 트레이너 아바타 이미지 존재 (img[src*="supabase"] 또는 person.svg 폴백)
      3. Assert: 뒤로가기 버튼에 원형 배경 visible
      4. Assert: 영상 영역이 트레이너 영역보다 크게 표시
      5. Screenshot 캡처
    Expected Result: 트레이너 사진 표시, 원형 뒤로가기 버튼, 영상 강조 UI
    Evidence: .sisyphus/evidence/task-7-manual-detail-ui.png
  ```

  **Commit**: YES (groups with Tasks 2, 3, 5)
  - Message: `fix(ui): improve settings buttons, invite photos, schedule styling, manual detail`
  - Files: `src/views/member/ManualDetailView.vue`, `src/views/member/ManualDetailView.css`

- [ ] 8. EmailLoginView (DevLoginView 리팩터링)

  **What to do**:
  - `src/views/login/DevLoginView.vue` → `src/views/login/EmailLoginView.vue`로 **리네이밍** (또는 내용 리팩터링)
    - "개발/테스트 전용" 서브타이틀 제거
    - 앱 이름/로고 표시 (LoginView.vue의 로고 영역 참고)
    - 회원가입/로그인 탭 또는 토글 유지 (기존 DevLoginView 패턴 유지 가능)
    - 비밀번호 재설정 링크 추가: "비밀번호를 잊으셨나요?" → `/password-reset`로 이동
  - `src/views/login/EmailLoginView.css` 생성 (기존 DevLoginView.css 기반으로 프로덕션 스타일)
  - **기존 signUp + signInWithPassword 로직 유지** — DevLoginView lines 83-157에 이미 구현됨
  - 이메일 유효성 검사: 기본적인 @ 포함 체크
  - 비밀번호 유효성 검사: 최소 6자 (Supabase 기본 요구사항)
  - 에러 메시지: 한국어로 표시 (잘못된 이메일/비밀번호, 이미 존재하는 계정 등)
  - 로딩 상태 표시 (버튼 disabled + 스피너)
  - 성공 시: `auth.initialize()` 호출 → 역할에 따라 리다이렉트 (기존 로직 유지)

  **Must NOT do**:
  - Kakao OAuth 관련 코드 추가하지 않음
  - AuthCallbackView 수정하지 않음
  - 새 npm 패키지 설치하지 않음 (폼 유효성 라이브러리 등)
  - 코드 주석 추가하지 않음
  - 이메일 확인(verification) UI 추가하지 않음 (auto-confirm ON)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 기존 뷰 리팩터링 + 프로덕션 품질 UX, auth 로직 유지
  - **Skills**: [`playwright`]
    - `playwright`: 로그인/회원가입 폼 동작 검증

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: Task 11 (Router wiring)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/login/DevLoginView.vue` — 전체 파일. 리팩터링 베이스. lines 83-157의 auth 로직 유지
  - `src/views/login/DevLoginView.css` — 기존 CSS. 프로덕션 스타일로 개선
  - `src/views/login/LoginView.vue` — 앱 로고/타이틀 영역 참고 (일관된 브랜딩)
  - `src/stores/auth.js:initialize()` — 로그인 성공 후 호출하는 메서드

  **API/Type References**:
  - `supabase.auth.signInWithPassword({ email, password })` — 로그인
  - `supabase.auth.signUp({ email, password })` — 회원가입
  - Supabase Auth error codes: `invalid_credentials`, `user_already_registered`, `weak_password`

  **External References**:
  - Supabase Auth JS docs: `https://supabase.com/docs/reference/javascript/auth-signinwithpassword`
  - Supabase Auth JS docs: `https://supabase.com/docs/reference/javascript/auth-signup`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: EmailLoginView 파일 존재 + 빌드 성공
    Tool: Bash
    Steps:
      1. ls src/views/login/EmailLoginView.vue
         → Assert: file exists
      2. grep -c "개발\|테스트 전용\|dev" src/views/login/EmailLoginView.vue
         → Assert: 0 (dev 관련 텍스트 제거됨)
      3. grep -c "signInWithPassword\|signUp" src/views/login/EmailLoginView.vue
         → Assert: >= 2 (양쪽 auth 함수 존재)
      4. grep -c "비밀번호를 잊으셨나요\|password-reset" src/views/login/EmailLoginView.vue
         → Assert: >= 1 (비밀번호 재설정 링크)
      5. npm run build
         → Assert: exit code 0
    Expected Result: EmailLoginView가 프로덕션 품질로 생성됨
    Evidence: .sisyphus/evidence/task-8-email-login.txt

  Scenario: 이메일 로그인 동작 확인
    Tool: Playwright (playwright skill)
    Preconditions: trainer@test.com / 테스트 비밀번호 계정 존재
    Steps:
      1. Navigate to /email-login (또는 라우트 결정 후)
      2. Fill email: "trainer@test.com"
      3. Fill password: 테스트 비밀번호
      4. Click 로그인 버튼
      5. Wait for navigation
      6. Assert: /trainer/home 또는 역할 기반 홈으로 이동
    Expected Result: 이메일 로그인 성공 → 홈 화면 도달
    Evidence: .sisyphus/evidence/task-8-email-login-success.png

  Scenario: 잘못된 비밀번호 에러 처리
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to /email-login
      2. Fill email: "trainer@test.com"
      3. Fill password: "wrongpassword"
      4. Click 로그인 버튼
      5. Assert: 에러 메시지 표시 (한국어)
      6. Assert: 페이지 이동하지 않음 (여전히 로그인 페이지)
    Expected Result: 에러 메시지 표시, 로그인 실패
    Evidence: .sisyphus/evidence/task-8-login-error.png
  ```

  **Commit**: YES (groups with Tasks 9, 10)
  - Message: `feat(auth): implement email login, password reset, and account management`
  - Files: `src/views/login/EmailLoginView.vue`, `src/views/login/EmailLoginView.css`

- [ ] 9. PasswordResetView (비밀번호 재설정 요청 + 새 비밀번호 설정)

  **What to do**:
  - **비밀번호 재설정 요청 뷰**: `src/views/login/PasswordResetView.vue` + `PasswordResetView.css` 생성
    - 이메일 입력 폼
    - `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth/callback' })` 호출
    - 성공 시: "비밀번호 재설정 이메일을 발송했습니다" 메시지 표시
    - "로그인으로 돌아가기" 링크 → `/email-login`
  - **비밀번호 업데이트 처리**: Supabase의 비밀번호 재설정 이메일 링크를 클릭하면 앱으로 리다이렉트됨
    - `AuthCallbackView.vue`를 수정하지 않는 방식으로 처리
    - Supabase는 recovery 링크 클릭 시 `onAuthStateChange`에서 `PASSWORD_RECOVERY` 이벤트를 발생시킴
    - `src/views/login/PasswordUpdateView.vue` + `PasswordUpdateView.css` 생성
      - 새 비밀번호 + 비밀번호 확인 입력 폼
      - `supabase.auth.updateUser({ password: newPassword })` 호출
      - 성공 시: "비밀번호가 변경되었습니다" 메시지 + 로그인 페이지로 이동
    - auth store에서 `PASSWORD_RECOVERY` 이벤트 감지 시 → `/password-update` 라우트로 이동하는 로직 추가
      - `src/stores/auth.js`의 `onAuthStateChange` 콜백에 `PASSWORD_RECOVERY` 케이스 추가

  **Must NOT do**:
  - AuthCallbackView.vue 수정하지 않음 (OAuth 전용 유지)
  - 이메일 템플릿 커스터마이징하지 않음
  - 코드 주석 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 2개 새 뷰 생성 + auth store 이벤트 처리 + Supabase API 연동
  - **Skills**: [`playwright`]
    - `playwright`: 비밀번호 재설정 요청 폼 동작 검증

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10)
  - **Blocks**: Task 11 (Router wiring)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/login/DevLoginView.vue` — 폼 구조 + CSS 패턴 참고
  - `src/stores/auth.js:64-85` — `onAuthStateChange` 콜백. `PASSWORD_RECOVERY` 케이스 추가 위치
  - `src/views/auth/AuthCallbackView.vue` — OAuth 콜백 (수정하지 않음, 참고만)

  **API/Type References**:
  - `supabase.auth.resetPasswordForEmail(email, { redirectTo })` — 재설정 이메일 발송
  - `supabase.auth.updateUser({ password })` — 비밀번호 변경
  - `onAuthStateChange` event: `PASSWORD_RECOVERY` — recovery 토큰으로 자동 로그인 시 발생

  **External References**:
  - Supabase Auth 비밀번호 재설정: `https://supabase.com/docs/guides/auth/passwords#resetting-a-password`
  - `redirectTo` 파라미터: Supabase 대시보드 Redirect URLs에 등록 필요 (수동 설정, 코드 외)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: PasswordResetView 파일 존재 + 빌드 성공
    Tool: Bash
    Steps:
      1. ls src/views/login/PasswordResetView.vue src/views/login/PasswordResetView.css
         → Assert: both files exist
      2. ls src/views/login/PasswordUpdateView.vue src/views/login/PasswordUpdateView.css
         → Assert: both files exist
      3. grep -c "resetPasswordForEmail" src/views/login/PasswordResetView.vue
         → Assert: >= 1
      4. grep -c "updateUser" src/views/login/PasswordUpdateView.vue
         → Assert: >= 1
      5. grep -c "PASSWORD_RECOVERY" src/stores/auth.js
         → Assert: >= 1
      6. npm run build
         → Assert: exit code 0
    Expected Result: 비밀번호 재설정 관련 파일 생성, auth store 업데이트, 빌드 성공
    Evidence: .sisyphus/evidence/task-9-password-reset.txt

  Scenario: 비밀번호 재설정 요청 폼 동작
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to /password-reset
      2. Assert: 이메일 입력 필드 존재
      3. Assert: "비밀번호 재설정" 또는 유사 버튼 존재
      4. Fill email: "trainer@test.com"
      5. Click submit
      6. Assert: 성공 메시지 표시 ("이메일을 발송했습니다" 등)
    Expected Result: 재설정 이메일 요청 성공 메시지 표시
    Evidence: .sisyphus/evidence/task-9-reset-request.png

  Scenario: 이메일 미입력 시 에러
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to /password-reset
      2. Click submit without entering email
      3. Assert: 에러 메시지 또는 필드 유효성 검사 표시
    Expected Result: 빈 이메일로 요청 불가
    Evidence: .sisyphus/evidence/task-9-reset-empty-error.png
  ```

  **Commit**: YES (groups with Tasks 8, 10)
  - Message: `feat(auth): implement email login, password reset, and account management`
  - Files: `src/views/login/PasswordResetView.vue`, `src/views/login/PasswordResetView.css`, `src/views/login/PasswordUpdateView.vue`, `src/views/login/PasswordUpdateView.css`, `src/stores/auth.js`

- [ ] 10. AccountManageView (이메일/비밀번호 변경 + OAuth 감지)

  **What to do**:
  - `src/views/common/AccountManageView.vue` + `AccountManageView.css` 생성
  - **Auth provider 감지**: `auth.user.app_metadata.provider`로 Kakao vs Email 구분
    - `provider === 'email'`: 이메일 변경 + 비밀번호 변경 옵션 표시
    - `provider === 'kakao'`: "카카오 계정으로 로그인 중" 안내 + 이메일/비밀번호 변경 불가 설명
  - **이메일 변경** (Email 사용자만):
    - 현재 이메일 표시
    - 새 이메일 입력 → `supabase.auth.updateUser({ email: newEmail })` 호출
    - 성공 메시지: "확인 이메일을 발송했습니다"
  - **비밀번호 변경** (Email 사용자만):
    - 새 비밀번호 + 확인 입력
    - `supabase.auth.updateUser({ password: newPassword })` 호출
    - 성공 시: "비밀번호가 변경되었습니다"
  - **UI 구조**:
    - 헤더: 뒤로가기 + "계정 관리" 타이틀
    - 현재 로그인 방식 표시 (카카오 / 이메일)
    - 이메일 변경 섹션 (Email 사용자만)
    - 비밀번호 변경 섹션 (Email 사용자만)
  - **에러/성공 인라인 메시지**: 각 섹션별 표시

  **Must NOT do**:
  - 계정 삭제 기능 추가하지 않음
  - 프로필 사진 업로드 추가하지 않음
  - auth provider 연결/해제 (linking) 추가하지 않음
  - 코드 주석 추가하지 않음
  - 새 npm 패키지 설치하지 않음

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 새 뷰 생성 + auth provider 분기 + Supabase updateUser API + UX 디자인
  - **Skills**: [`playwright`]
    - `playwright`: 계정 관리 화면 UI 검증

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: Task 11 (Router wiring)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/SettingsView.vue` — 설정 화면 UI 패턴 (헤더 + 리스트 항목)
  - `src/views/trainer/TrainerProfileEditView.vue` — 폼 입력 + 저장 버튼 패턴 참고
  - `src/views/login/DevLoginView.vue` — 에러/성공 메시지 처리 패턴
  - `src/stores/auth.js` — `auth.user`, `auth.profile` 접근 패턴

  **API/Type References**:
  - `supabase.auth.updateUser({ email })` — 이메일 변경 (확인 이메일 발송)
  - `supabase.auth.updateUser({ password })` — 비밀번호 변경
  - `auth.user.app_metadata.provider` — 'kakao' | 'email' (auth provider 감지)
  - `auth.user.email` — 현재 이메일

  **External References**:
  - Supabase Auth updateUser: `https://supabase.com/docs/reference/javascript/auth-updateuser`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AccountManageView 파일 존재 + 빌드 성공
    Tool: Bash
    Steps:
      1. ls src/views/common/AccountManageView.vue src/views/common/AccountManageView.css
         → Assert: both files exist
      2. grep -c "app_metadata\|provider" src/views/common/AccountManageView.vue
         → Assert: >= 1 (auth provider 감지)
      3. grep -c "updateUser" src/views/common/AccountManageView.vue
         → Assert: >= 1
      4. npm run build
         → Assert: exit code 0
    Expected Result: 계정 관리 뷰 생성, provider 감지 + updateUser 호출 구현
    Evidence: .sisyphus/evidence/task-10-account-manage.txt

  Scenario: Email 사용자 — 비밀번호 변경 옵션 표시
    Tool: Playwright (playwright skill)
    Preconditions: Email 사용자(trainer@test.com)로 로그인
    Steps:
      1. Navigate to /account-manage
      2. Assert: "비밀번호 변경" 섹션 visible
      3. Assert: "이메일 변경" 섹션 visible
      4. Screenshot 캡처
    Expected Result: Email 사용자에게 이메일/비밀번호 변경 옵션 표시
    Evidence: .sisyphus/evidence/task-10-email-user.png

  Scenario: Kakao 사용자 — 비밀번호 변경 불가 안내
    Tool: Playwright (playwright skill)
    Preconditions: Kakao OAuth 사용자로 로그인
    Steps:
      1. Navigate to /account-manage
      2. Assert: "카카오 계정으로 로그인 중" 또는 유사 안내 표시
      3. Assert: 비밀번호 변경 폼 없음 또는 비활성화
      4. Screenshot 캡처
    Expected Result: Kakao 사용자에게 적절한 안내 표시
    Evidence: .sisyphus/evidence/task-10-kakao-user.png
  ```

  **Commit**: YES (groups with Tasks 8, 9)
  - Message: `feat(auth): implement email login, password reset, and account management`
  - Files: `src/views/common/AccountManageView.vue`, `src/views/common/AccountManageView.css`

- [ ] 11. Router 업데이트 + LoginView 버튼 수정 + Settings 라우트 변경

  **What to do**:
  - **Router** (`src/router/index.js`):
    - 새 라우트 추가:
      - `/email-login` → `EmailLoginView.vue` (meta: { hideNav: true })
      - `/password-reset` → `PasswordResetView.vue` (meta: { hideNav: true })
      - `/password-update` → `PasswordUpdateView.vue` (meta: { hideNav: true })
      - `/account-manage` → `AccountManageView.vue` (meta: { hideNav: true })
    - `/dev-login` 라우트를 `/email-login`으로 redirect 설정 (하위 호환성)
    - `PUBLIC_ROUTES` 배열에 추가: `/email-login`, `/password-reset`, `/password-update`
    - `/account-manage`는 PUBLIC_ROUTES에 추가하지 않음 (인증 필요)
  - **LoginView** (`src/views/login/LoginView.vue`):
    - "이메일로 로그인" 버튼의 라우트를 `/dev-login` → `/email-login`으로 변경
  - **SettingsView** (`src/views/trainer/SettingsView.vue`):
    - "계정 관리" 버튼의 라우트를 `trainer-profile-edit` → `account-manage`로 변경
  - **MemberSettingsView** (`src/views/member/MemberSettingsView.vue`):
    - "계정 관리" 버튼의 라우트를 `member-profile-edit` → `account-manage`로 변경

  **Must NOT do**:
  - 기존 Kakao OAuth 라우트 (`/auth/callback`) 수정하지 않음
  - `trainer-profile-edit` 라우트 삭제하지 않음
  - 코드 주석 추가하지 않음

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 라우트 등록 + 버튼 라우트 변경 = 설정 변경
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential, after Waves 1-3)
  - **Blocks**: Task 12 (Build + test)
  - **Blocked By**: Tasks 2, 8, 9, 10 (라우트 대상 뷰들이 먼저 생성되어야 함)

  **References**:

  **Pattern References**:
  - `src/router/index.js:1-30` — 기존 라우트 정의 패턴 (lazy import, meta)
  - `src/router/index.js:240-250` — PUBLIC_ROUTES 배열 위치
  - `src/views/login/LoginView.vue:33` — "이메일로 로그인" 버튼 (현재 /dev-login)
  - `src/views/trainer/SettingsView.vue:59-72` — "계정 관리" 버튼 (현재 trainer-profile-edit)
  - `src/views/member/MemberSettingsView.vue:83-96` — "계정 관리" 버튼 (현재 member-profile-edit)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 모든 새 라우트 등록 확인
    Tool: Bash
    Steps:
      1. grep -c "email-login" src/router/index.js
         → Assert: >= 2 (라우트 정의 + PUBLIC_ROUTES)
      2. grep -c "password-reset" src/router/index.js
         → Assert: >= 2
      3. grep -c "password-update" src/router/index.js
         → Assert: >= 2
      4. grep -c "account-manage" src/router/index.js
         → Assert: >= 1 (라우트 정의, PUBLIC_ROUTES에는 미포함)
    Expected Result: 4개 새 라우트 모두 등록
    Evidence: .sisyphus/evidence/task-11-routes.txt

  Scenario: LoginView 이메일 버튼 라우트 변경 확인
    Tool: Bash
    Steps:
      1. grep "email-login" src/views/login/LoginView.vue
         → Assert: >= 1
      2. grep -c "dev-login" src/views/login/LoginView.vue
         → Assert: 0 (더 이상 dev-login 참조 없음)
    Expected Result: LoginView가 /email-login으로 라우팅
    Evidence: .sisyphus/evidence/task-11-login-button.txt

  Scenario: Settings 계정 관리 라우트 변경 확인
    Tool: Bash
    Steps:
      1. grep "account-manage" src/views/trainer/SettingsView.vue
         → Assert: >= 1
      2. grep "account-manage" src/views/member/MemberSettingsView.vue
         → Assert: >= 1
    Expected Result: 양쪽 설정 뷰에서 account-manage로 라우팅
    Evidence: .sisyphus/evidence/task-11-settings-route.txt

  Scenario: /dev-login → /email-login 리다이렉트 확인
    Tool: Bash
    Steps:
      1. grep "dev-login" src/router/index.js
         → Assert: redirect 설정 존재
    Expected Result: /dev-login 접속 시 /email-login으로 리다이렉트
    Evidence: .sisyphus/evidence/task-11-redirect.txt

  Scenario: 전체 빌드 성공
    Tool: Bash
    Steps:
      1. npm run build
         → Assert: exit code 0
      2. npm test
         → Assert: 85/85 pass (또는 기존 테스트 수 유지)
    Expected Result: 빌드 + 테스트 모두 성공
    Evidence: .sisyphus/evidence/task-11-build.txt
  ```

  **Commit**: YES
  - Message: `feat(router): wire new auth views and update settings navigation`
  - Files: `src/router/index.js`, `src/views/login/LoginView.vue`, `src/views/trainer/SettingsView.vue`, `src/views/member/MemberSettingsView.vue`

- [ ] 12. 빌드 검증 + 전체 테스트

  **What to do**:
  - `npm run build` 실행 — zero errors 확인
  - `npm test` 실행 — 기존 85/85 테스트 모두 통과 확인
  - 빌드 아티팩트 (dist/) 생성 확인
  - 모든 새 파일이 빌드에 포함되는지 확인
  - console.log 또는 debugger 문이 남아있지 않은지 확인 (grep)
  - 코드 주석 (// comment)이 추가되지 않았는지 확인

  **Must NOT do**:
  - 기존 테스트 파일 수정하지 않음
  - 새 테스트 파일 생성하지 않음 (이 태스크에서는)
  - 코드 수정하지 않음 (검증만)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 전체 프로젝트 검증 + 에러 분석 + 수정 필요 시 이전 태스크 참조
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential, after Task 11)
  - **Blocks**: F1-F4
  - **Blocked By**: ALL previous tasks (1-11)

  **References**:

  **Pattern References**:
  - `package.json` — npm scripts (build, test)
  - `vite.config.js` — 빌드 설정

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 빌드 + 테스트 전체 통과
    Tool: Bash
    Steps:
      1. npm run build
         → Assert: exit code 0, "dist" directory created
      2. npm test
         → Assert: all tests pass, 0 failures
      3. grep -rn "console\.log\|debugger" src/views/login/EmailLoginView.vue src/views/login/PasswordResetView.vue src/views/login/PasswordUpdateView.vue src/views/common/AccountManageView.vue src/utils/youtube.js
         → Assert: 0 matches (no debug statements)
      4. grep -rn "^[[:space:]]*//" src/utils/youtube.js src/views/login/EmailLoginView.vue src/views/login/PasswordResetView.vue src/views/login/PasswordUpdateView.vue src/views/common/AccountManageView.vue
         → Assert: 0 matches (no code comments)
    Expected Result: 프로덕션 빌드 성공, 모든 테스트 통과, 디버그/주석 없음
    Evidence: .sisyphus/evidence/task-12-final-build.txt
  ```

  **Commit**: NO (이전 커밋들이 모든 파일 포함)

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, code comments (// forbidden), unused imports. Check AI slop: excessive abstraction, generic names. Verify CSS uses custom properties, BEM naming.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Navigate to each modified view. Verify: SettingsView no "내 프로필 수정", TrainerProfileReadOnlyView has edit button, InviteManageView shows DB photos, TrainerManualView no edit/delete buttons, YouTube thumbnails visible, ManualDetailView trainer photo + UI improved + AppBar visible, MemberScheduleView checkmark icon + completed styling, EmailLogin works, PasswordReset works, AccountManageView shows correct options.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Commit 1**: `feat(manual): extract YouTube thumbnail utility and add thumbnails to manual lists` — Tasks 1, 4, 6
- **Commit 2**: `fix(ui): improve settings buttons, invite photos, schedule styling, manual detail` — Tasks 2, 3, 5, 7
- **Commit 3**: `feat(auth): implement email login, password reset, and account management` — Tasks 8, 9, 10
- **Commit 4**: `feat(router): wire new auth views and update settings navigation` — Task 11

---

## Success Criteria

### Verification Commands
```bash
npm run build        # Expected: zero errors, dist/ created
npm test             # Expected: 85/85 tests pass (or more if new composable tests added)
```

### Final Checklist
- [ ] 이메일 회원가입 → 역할 선택 → 홈 화면 도달 가능
- [ ] 이메일 로그인 → 기존 계정으로 홈 도달 가능
- [ ] 비밀번호 재설정 요청 화면 작동
- [ ] Kakao 로그인 여전히 정상 작동
- [ ] AccountManageView: Email 사용자 — 이메일/비밀번호 변경 가능
- [ ] AccountManageView: Kakao 사용자 — 비밀번호 변경 불가 안내
- [ ] SettingsView에서 "내 프로필 수정" 버튼 없음
- [ ] TrainerProfileReadOnlyView 우측 상단 수정 버튼 있음
- [ ] InviteManageView 회원 사진 DB에서 로드
- [ ] TrainerManualView에서 수정/삭제 버튼 없음
- [ ] 매뉴얼 리스트에 YouTube 썸네일 표시
- [ ] ManualDetailView 트레이너 사진 DB에서 로드
- [ ] ManualDetailView AppBar 뒤로가기 원형 배경
- [ ] MemberScheduleView 체크마크 아이콘 + 완료 스타일링
- [ ] 모든 "Must NOT Have" 항목 부재 확인
