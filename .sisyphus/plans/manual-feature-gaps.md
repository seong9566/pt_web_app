# 매뉴얼 기능 PRD 갭 해소 + 품질 개선

## TL;DR

> **Quick Summary**: 운동 매뉴얼 기능에서 PRD 대비 미구현된 핵심 기능(수정 UI, 카테고리 정합성, 썸네일, Storage 정리)을 해결하고, 삭제 확인 UI 및 미디어 관리 품질을 개선합니다.
> 
> **Deliverables**:
> - DB enum 확장 마이그레이션 (4→6 카테고리)
> - ManualRegisterView에 edit 모드 추가 (기존 뷰 재사용)
> - 매뉴얼 목록 썸네일 표시 (fetchManuals media JOIN)
> - Storage 파일 정리 로직 (deleteManual + deleteManualMedia)
> - ManualDetailView에 트레이너용 수정/삭제 버튼 추가
> - 삭제 확인 AppBottomSheet 전환
> - 카테고리 단일 선택 전환 + 전체 뷰 카테고리 정합성
> - useManuals composable 변경사항 단위 테스트
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (DB) → Task 2 (Composable) → Tasks 3-7 (Views) → Task 8 (Tests)

---

## Context

### Original Request
PRD 섹션 14 (운동 매뉴얼) 대비 미구현된 기능 확인 및 개발 계획 수립

### Interview Summary
**Key Discussions**:
- 작업 범위: 핵심 갭 + 품질 개선 (페이지네이션/북마크/댓글 등 제외)
- 카테고리 전략: DB enum 확장 (스포츠퍼포먼스→스포츠 리네임 + 코어/유연성 추가)
- 수정 UI: ManualRegisterView 재사용 (edit mode via route param)
- 테스트: Vitest 단위 테스트 포함

**Research Findings**:
- DB `manual_category` enum: 4개 (재활/근력/다이어트/스포츠퍼포먼스)
- UI 카테고리: 7개 (전체 포함) — DB와 불일치
- `ManualRegisterView`가 multi-category를 comma-join으로 저장 → DB enum 위반으로 실제 저장 실패
- `updateManual()` composable 존재하나 호출하는 UI 없음
- 트레이너 상세 라우트가 회원용 읽기 전용 뷰를 공유
- `deleteManual()`이 Storage 파일을 삭제하지 않음 (orphan 발생)
- `fetchManuals()`에 `manual_media` JOIN 없음 → 썸네일 불가

### Metis Review
**Identified Gaps** (addressed):
- `스포츠퍼포먼스` → `스포츠` 리네임은 PostgreSQL enum 재생성 패턴 필요
- `searchManuals()`도 media JOIN 필요 (fetchManuals만 수정하면 불충분)
- Storage 삭제 시 URL→path 변환 헬퍼 필요
- Storage 삭제 실패가 manual 삭제를 블로킹하면 안 됨 (try/catch)
- 기존 `스포츠퍼포먼스` 데이터 마이그레이션 필요
- Route 배치: `/trainer/settings/manual/:id/edit`가 `register`와 충돌하지 않도록

---

## Work Objectives

### Core Objective
PRD 섹션 14에 명시된 매뉴얼 수정 기능을 구현하고, 카테고리 데이터 정합성·썸네일·Storage 관리 등 핵심 갭을 해소합니다.

### Concrete Deliverables
- DB 마이그레이션: `manual_category` enum 확장 (스포츠, 코어, 유연성 추가; 스포츠퍼포먼스→스포츠 리네임)
- `useManuals.js`: media JOIN, Storage 정리 함수, URL-path 헬퍼, 개별 미디어 삭제 함수
- `ManualRegisterView.vue`: edit 모드 (기존 데이터 로드, 미디어 관리, 카테고리 단일 선택)
- `ManualDetailView.vue`: 트레이너용 수정/삭제 버튼
- `TrainerManualView.vue`: AppBottomSheet 삭제 확인, 썸네일 표시
- `MemberManualView.vue`: 카테고리 정합성, 썸네일 표시
- `src/router/index.js`: edit 라우트 추가
- Vitest 단위 테스트 추가

### Definition of Done
- [ ] `npm run build` → 0 errors
- [ ] `npx vitest run` → all tests pass (기존 + 신규)
- [ ] DB enum에 6개 카테고리 존재: 재활, 근력, 다이어트, 스포츠, 코어, 유연성
- [ ] 트레이너가 매뉴얼 수정 가능 (기존 데이터 로드 + 저장)
- [ ] 매뉴얼 목록에 첫 번째 사진 썸네일 표시
- [ ] 매뉴얼 삭제 시 Storage 파일도 정리됨

### Must Have
- 매뉴얼 수정 UI (PRD 명시)
- 카테고리 DB-UI 정합성
- 매뉴얼 목록 썸네일
- Storage orphan 방지

### Must NOT Have (Guardrails)
- 페이지네이션/무한 스크롤 추가 금지
- 미디어 드래그 리오더 금지
- 업로드 진행률 표시 금지
- 이미지 크롭/압축 기능 금지
- `fetchManuals()`에 트레이너 필터 추가 금지 (회원 가시 범위 변경 금지)
- 공유 상수 파일 생성 금지 (하드코딩 배열 정합성만 확보)
- 매뉴얼 외 다른 뷰의 `confirm()` 수정 금지
- `ManualEditView.vue` 같은 새 뷰 파일 생성 금지

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest, 68 tests in 14 files)
- **Automated tests**: YES (tests-after)
- **Framework**: Vitest
- **If tests-after**: Composable 변경 후 단위 테스트 추가

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (Supabase SQL) — Execute queries, assert results
- **Library/Module**: Use Bash (vitest) — Run tests, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — DB + Composable foundation):
├── Task 1: DB enum 마이그레이션 [quick]
└── Task 2: useManuals.js composable 확장 [deep] (depends: 1)

Wave 2 (After Wave 1 — Views, MAX PARALLEL):
├── Task 3: ManualRegisterView edit 모드 + 단일 카테고리 (depends: 2) [unspecified-high]
├── Task 4: ManualDetailView 트레이너 수정/삭제 버튼 (depends: 2) [quick]
├── Task 5: TrainerManualView 썸네일 + AppBottomSheet 삭제 (depends: 2) [unspecified-high]
├── Task 6: MemberManualView 카테고리 정합성 + 썸네일 (depends: 2) [quick]
└── Task 7: Router edit 라우트 추가 (depends: 2) [quick]

Wave 3 (After Wave 2 — Tests + Final):
└── Task 8: useManuals composable 단위 테스트 (depends: 2,3) [unspecified-high]

Wave FINAL (After ALL tasks — verification):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 3 → Task 8 → F1-F4
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 5 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2 | 1 |
| 2 | 1 | 3,4,5,6,7,8 | 1 |
| 3 | 2 | 8 | 2 |
| 4 | 2 | — | 2 |
| 5 | 2 | — | 2 |
| 6 | 2 | — | 2 |
| 7 | 2 | — | 2 |
| 8 | 2,3 | — | 3 |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks — T1 → `quick`, T2 → `deep`
- **Wave 2**: 5 tasks — T3 → `unspecified-high`, T4 → `quick`, T5 → `unspecified-high`, T6 → `quick`, T7 → `quick`
- **Wave 3**: 1 task — T8 → `unspecified-high`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

- [x] 1. DB `manual_category` enum 확장 마이그레이션

  **What to do**:
  - PostgreSQL enum은 값 리네임/삭제가 불가하므로, 새 enum 생성 → 데이터 마이그레이션 → 교체 패턴 사용
  - 기존 `manual_category`: `('재활', '근력', '다이어트', '스포츠퍼포먼스')`
  - 목표: `('재활', '근력', '다이어트', '스포츠', '코어', '유연성')`
  - 마이그레이션 SQL: (1) 새 enum 타입 생성 → (2) 기존 데이터의 `스포츠퍼포먼스`를 `스포츠`로 변환 → (3) 컬럼 타입을 새 enum으로 전환 → (4) 기존 enum 삭제 → (5) 새 enum 리네임
  - Supabase MCP `apply_migration`으로 적용

  **Must NOT do**:
  - ALTER TYPE ... ADD VALUE만으로 해결하려 하지 말 것 (리네임 불가)
  - 기존 데이터 없이 진행해도 되지만, 안전하게 `UPDATE manuals SET category = '스포츠' WHERE category = '스포츠퍼포먼스'` 포함
  - `schema.sql` 수동 편집 금지 — 마이그레이션만 사용

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 SQL 마이그레이션 적용, 복잡한 로직 없음
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: DB 작업이므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: NO (must be first)
  - **Parallel Group**: Wave 1 (sequential start)
  - **Blocks**: Task 2, 3, 4, 5, 6, 7, 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `supabase/schema.sql:670-691` — 기존 `manual_category` enum 정의 및 manuals 테이블 구조. 마이그레이션이 이 구조를 변경함

  **API/Type References**:
  - `supabase/schema.sql:672` — `create type public.manual_category as enum ('재활', '근력', '다이어트', '스포츠퍼포먼스')` — 현재 4개 enum 값

  **External References**:
  - PostgreSQL 공식 문서: enum type ALTER 제약사항. ADD VALUE는 가능하나 RENAME/DELETE VALUE는 불가하여 enum 재생성 필요

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: enum 확장 검증
    Tool: Bash (Supabase SQL)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. supabase execute_sql: "SELECT unnest(enum_range(NULL::manual_category));"
      2. 결과에 6개 값 존재 확인
    Expected Result: 재활, 근력, 다이어트, 스포츠, 코어, 유연성 (스포츠퍼포먼스 없음)
    Failure Indicators: 스포츠퍼포먼스가 여전히 존재하거나, 코어/유연성이 없음
    Evidence: .sisyphus/evidence/task-1-enum-verification.txt

  Scenario: 기존 데이터 정합성
    Tool: Bash (Supabase SQL)
    Preconditions: 마이그레이션 적용 완료
    Steps:
      1. supabase execute_sql: "SELECT id, category FROM manuals WHERE category NOT IN ('재활', '근력', '다이어트', '스포츠', '코어', '유연성');"
      2. 결과가 0행이어야 함
    Expected Result: 0 rows returned (모든 기존 데이터가 새 enum 값으로 변환됨)
    Failure Indicators: 스포츠퍼포먼스 값이 남아있는 행 존재
    Evidence: .sisyphus/evidence/task-1-data-integrity.txt
  ```

  **Commit**: YES
  - Message: `feat(db): expand manual_category enum with 스포츠, 코어, 유연성`
  - Files: Supabase migration only
  - Pre-commit: QA scenario 통과 확인

- [x] 2. useManuals.js composable 확장 (media JOIN + Storage 정리 + deleteManualMedia)

  **What to do**:
  - `fetchManuals()`: `.select('*, trainer:profiles!trainer_id(name, photo_url)')` → `.select('*, trainer:profiles!trainer_id(name, photo_url), media:manual_media(file_url, file_type, sort_order)')` 변경하여 썸네일 데이터 포함
  - `searchManuals()`: 동일하게 media JOIN 추가
  - `extractStoragePath(publicUrl)` 헬퍼 함수 추가: 공개 URL에서 Storage 경로 추출 (예: `https://xxx.supabase.co/storage/v1/object/public/manual-media/uid/file.jpg` → `uid/file.jpg`)
  - `deleteManual()` 수정: DB 삭제 전에 해당 매뉴얼의 모든 미디어 파일을 Storage에서 삭제. Storage 삭제 실패 시 try/catch로 감싸서 DB 삭제는 계속 진행
  - `deleteManualMedia(mediaId, fileUrl)` 신규 함수: 개별 미디어 파일 삭제 (manual_media 레코드 + Storage 파일). edit 모드에서 사용
  - `addManualMedia(manualId, files)` 신규 함수: 기존 매뉴얼에 미디어 추가 (edit 모드). 내부적으로 uploadManualMedia + manual_media INSERT
  - return 객체에 `deleteManualMedia`, `addManualMedia`, `extractStoragePath` 추가

  **Must NOT do**:
  - `fetchManuals()`에 트레이너 필터 추가 금지
  - 업로드 진행률 추가 금지
  - 미디어 순서 변경 함수 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 여러 함수를 수정/추가하고, Storage API 연동, URL 파싱 등 로직적 복잡도가 있음
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: composable 로직만 수정하므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: NO (Task 1 완료 후 실행)
  - **Parallel Group**: Wave 1 (Task 1 뒤 sequential)
  - **Blocks**: Tasks 3, 4, 5, 6, 7, 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/composables/useManuals.js:25-42` — `fetchManuals()` 현재 select 쿼리. media JOIN 추가 위치
  - `src/composables/useManuals.js:64-80` — `searchManuals()` 동일한 패턴으로 media JOIN 추가
  - `src/composables/useManuals.js:166-184` — `deleteManual()` 현재 구현. Storage 삭제 로직 추가 위치
  - `src/composables/useManuals.js:191-205` — `uploadManualMedia()` Storage 업로드 패턴. 경로 구조 참조 (`{uid}/{timestamp}.{ext}`)
  - `src/composables/useManuals.js:44-61` — `fetchManual()` 상세 조회의 media JOIN 패턴 참조 (`media:manual_media(*)`)

  **API/Type References**:
  - Supabase Storage API: `supabase.storage.from('manual-media').remove([paths])` — path 배열로 다중 파일 삭제

  **Acceptance Criteria**:
  - [ ] `fetchManuals()` 반환값에 `media` 배열 포함
  - [ ] `searchManuals()` 반환값에 `media` 배열 포함
  - [ ] `deleteManual()` 호출 시 Storage 파일도 삭제 시도
  - [ ] `deleteManualMedia(id, url)` 함수가 DB + Storage 모두 삭제
  - [ ] `addManualMedia(manualId, files)` 함수가 파일 업로드 + DB INSERT
  - [ ] `npm run build` 성공
  - [ ] `npx vitest run` 기존 68개 테스트 통과

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: fetchManuals media JOIN 확인
    Tool: Bash (node/vitest)
    Preconditions: useManuals.js 수정 완료
    Steps:
      1. npm run build
      2. useManuals.js에서 fetchManuals의 select 문에 'media:manual_media' 포함 확인
      3. searchManuals의 select 문에도 동일하게 포함 확인
    Expected Result: 빌드 성공, 두 함수 모두 media JOIN 포함
    Failure Indicators: 빌드 실패 또는 media JOIN 누락
    Evidence: .sisyphus/evidence/task-2-build.txt

  Scenario: extractStoragePath 정확성
    Tool: Bash (grep으로 함수 존재 확인)
    Preconditions: 함수 추가 완료
    Steps:
      1. useManuals.js에 extractStoragePath 함수 존재 확인
      2. 함수가 'manual-media' 버킷 prefix를 올바르게 추출하는지 로직 확인
    Expected Result: URL에서 버킷 이후 경로를 정확히 추출
    Failure Indicators: 함수 미존재 또는 잘못된 파싱 로직
    Evidence: .sisyphus/evidence/task-2-path-extraction.txt

  Scenario: 기존 테스트 회귀 없음
    Tool: Bash (npx vitest run)
    Preconditions: 모든 composable 변경 완료
    Steps:
      1. npx vitest run
      2. 68개 테스트 모두 통과 확인
    Expected Result: 68 passed (0 failed)
    Failure Indicators: 기존 테스트 실패
    Evidence: .sisyphus/evidence/task-2-regression.txt
  ```

  **Commit**: YES
  - Message: `feat(composables): add media JOIN, Storage cleanup, deleteManualMedia to useManuals`
  - Files: `src/composables/useManuals.js`
  - Pre-commit: `npx vitest run`

- [x] 3. ManualRegisterView edit 모드 + 카테고리 단일 선택 전환

  **What to do**:
  - **카테고리 단일 선택**: `form.categories` (배열) → `form.category` (문자열)로 변경. `toggleCategory(cat)` → `selectCategory(cat)` (단순 할당). UI에서 하나만 활성화
  - **카테고리 목록 정렬**: `['재활', '근력', '다이어트', '스포츠', '코어', '유연성']` (6개, DB enum과 일치)
  - **edit 모드 감지**: `route.params.id` 존재 시 edit 모드. `onMounted`에서 `fetchManual(id)` 호출하여 기존 데이터 로드
  - **기존 데이터 채우기**: `form.title`, `form.category`, `form.description`, `form.youtubeUrl`에 기존 값 바인딩. 기존 미디어는 별도 `existingMedia` ref로 관리
  - **미디어 관리 (edit 모드)**: 기존 미디어를 표시하되 X 버튼으로 삭제 가능. 새 미디어 추가도 가능. 저장 시: (1) 삭제 예정 미디어에 대해 `deleteManualMedia()` 호출, (2) 새 미디어에 대해 `addManualMedia()` 호출, (3) `updateManual()` 호출
  - **헤더/버튼 텍스트**: edit 모드일 때 "매뉴얼 수정" / "수정하기", create 모드일 때 "매뉴얼 등록" / "저장하기"
  - **handleSave 분기**: edit 모드면 `updateManual()` + 미디어 변경, create 모드면 기존 `createManual()` 로직
  - **`createManual()` 호출부 수정**: `category` 파라미터를 `form.category` (문자열)로 전달 (기존 `form.categories.join(',')` 제거)

  **Must NOT do**:
  - `ManualEditView.vue` 새 파일 생성 금지
  - 미디어 드래그 리오더 UI 금지
  - 미저장 변경사항 경고 (unsaved changes guard) 금지
  - 자동 저장 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 기존 뷰의 로직 대폭 변경 — edit/create 모드 분기, 미디어 상태 관리, 폼 데이터 로드
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 구현 단계이므로 불필요 (QA는 F3에서)
    - `frontend-ui-ux`: 기존 UI 레이아웃 재사용, 새 디자인 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/views/trainer/ManualRegisterView.vue:150-223` — 현재 전체 script. edit 모드 분기 추가 위치
  - `src/views/trainer/ManualRegisterView.vue:160-165` — `form` reactive 객체. `categories` → `category` 변경
  - `src/views/trainer/ManualRegisterView.vue:167-174` — `toggleCategory()`. `selectCategory()`로 교체
  - `src/views/trainer/ManualRegisterView.vue:208-223` — `handleSave()`. edit 모드 분기 추가
  - `src/views/trainer/ManualRegisterView.vue:12` — 헤더 타이틀. edit 모드에서 "매뉴얼 수정"으로 변경

  **API/Type References**:
  - `src/composables/useManuals.js` — `fetchManual(id)`, `updateManual(id, updates)`, `deleteManualMedia(id, url)`, `addManualMedia(manualId, files)`

  **Acceptance Criteria**:
  - [ ] 카테고리가 단일 선택 (하나만 활성)
  - [ ] 카테고리 목록이 DB enum과 일치 (6개)
  - [ ] edit 모드에서 기존 데이터가 폼에 채워짐
  - [ ] edit 모드에서 기존 미디어가 표시됨 (X 버튼으로 삭제 가능)
  - [ ] edit 모드에서 새 미디어 추가 가능
  - [ ] 헤더가 "매뉴얼 수정", 버튼이 "수정하기"로 표시
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 카테고리 단일 선택
    Tool: Playwright
    Preconditions: 개발 서버 실행 중, 트레이너 로그인
    Steps:
      1. /trainer/settings/manual/register로 이동
      2. '근력' 칩 클릭 → 활성화 확인
      3. '코어' 칩 클릭 → '코어' 활성, '근력' 비활성 확인
      4. 동시에 2개 이상 활성화된 칩이 없는지 확인
    Expected Result: 항상 하나의 칩만 active 상태
    Failure Indicators: 2개 이상 동시 활성 또는 아무것도 선택 안 됨
    Evidence: .sisyphus/evidence/task-3-single-select.png

  Scenario: edit 모드 기존 데이터 로드
    Tool: Playwright
    Preconditions: 매뉴얼이 하나 이상 존재
    Steps:
      1. /trainer/settings/manual/:id/edit으로 이동 (기존 매뉴얼 ID)
      2. 헤더가 "매뉴얼 수정"인지 확인
      3. 제목 input에 기존 제목이 채워져 있는지 확인
      4. 카테고리 칩 중 기존 카테고리가 활성인지 확인
      5. 설명 textarea에 기존 설명이 채워져 있는지 확인
    Expected Result: 모든 필드에 기존 데이터가 채워짐
    Failure Indicators: 빈 폼이 표시되거나 로딩 오류
    Evidence: .sisyphus/evidence/task-3-edit-mode-load.png
  ```

  **Commit**: YES
  - Message: `feat(trainer): add manual edit mode to ManualRegisterView`
  - Files: `src/views/trainer/ManualRegisterView.vue`, `src/views/trainer/ManualRegisterView.css`
  - Pre-commit: `npm run build`

- [x] 4. ManualDetailView 트레이너용 수정/삭제 버튼 추가

  **What to do**:
  - `ManualDetailView.vue`에 `useAuthStore` import 추가 (현재 없음)
  - 본문 하단에 트레이너용 액션 버튼 영역 추가: `v-if="auth.user?.id === manual.trainer_id"`
  - [수정] 버튼: `router.push({ name: 'trainer-manual-register', params: { id: manual.id } })` → edit 라우트로 이동 (Task 7에서 추가되는 라우트)
  - [삭제] 버튼: AppBottomSheet 삭제 확인 → `deleteManual()` 호출 → 목록으로 이동
  - AppBottomSheet import 및 삭제 다이얼로그 템플릿 추가
  - CSS: 액션 버튼 영역 스타일 추가 (수정=outline, 삭제=red)

  **Must NOT do**:
  - 회원에게 수정/삭제 버튼 노출 금지
  - 별도의 트레이너용 상세 뷰 생성 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 조건부 버튼 2개 + AppBottomSheet 추가. 기존 패턴 따름
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5, 6, 7)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/views/member/ManualDetailView.vue:119-148` — 현재 전체 script. auth store import 추가 위치
  - `src/views/trainer/ReservationManageView.vue:5-16` — AppBottomSheet 삭제 확인 다이얼로그 패턴 참조
  - `src/views/member/ManualDetailView.css` — 기존 스타일. 액션 버튼 섹션 추가 위치

  **API/Type References**:
  - `src/composables/useManuals.js` — `deleteManual(id)` 함수
  - `src/components/AppBottomSheet.vue` — `v-model` + `title` props

  **Acceptance Criteria**:
  - [ ] 트레이너 본인의 매뉴얼 상세 화면에 수정/삭제 버튼 표시
  - [ ] 회원이 볼 때는 버튼이 숨겨져 있음
  - [ ] 삭제 버튼 클릭 시 AppBottomSheet 확인 다이얼로그 표시
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 트레이너용 수정/삭제 버튼 표시
    Tool: Playwright
    Preconditions: 트레이너 로그인, 본인 매뉴얼 존재
    Steps:
      1. /trainer/settings/manual/:id로 이동 (본인 매뉴얼)
      2. 페이지 하단에 "수정" 버튼 존재 확인
      3. 페이지 하단에 "삭제" 버튼 존재 확인
    Expected Result: 두 버튼 모두 표시됨
    Failure Indicators: 버튼이 없거나 다른 트레이너의 매뉴얼에서도 표시
    Evidence: .sisyphus/evidence/task-4-trainer-buttons.png

  Scenario: 삭제 확인 AppBottomSheet
    Tool: Playwright
    Preconditions: 트레이너 로그인, 본인 매뉴얼 상세 화면
    Steps:
      1. "삭제" 버튼 클릭
      2. AppBottomSheet가 나타나는지 확인
      3. "취소" 클릭 → 시트 닫히고 매뉴얼 유지
    Expected Result: AppBottomSheet 표시, 취소 시 닫힘 (브라우저 confirm 아님)
    Failure Indicators: 브라우저 기본 confirm 다이얼로그 표시
    Evidence: .sisyphus/evidence/task-4-delete-sheet.png
  ```

  **Commit**: YES
  - Message: `feat(manual): add edit/delete buttons for trainer in ManualDetailView`
  - Files: `src/views/member/ManualDetailView.vue`, `src/views/member/ManualDetailView.css`
  - Pre-commit: `npm run build`

- [x] 5. TrainerManualView 썸네일 표시 + AppBottomSheet 삭제 확인

  **What to do**:
  - **썸네일 표시**: `fetchManuals()`가 이제 media를 포함하므로, 카드의 placeholder를 실제 이미지로 교체. `manual.media`에서 첫 번째 이미지(`file_type`이 `image/`로 시작)의 `file_url`을 썸네일로 표시. media가 없으면 기존 placeholder SVG 유지
  - **AppBottomSheet 삭제 확인**: `handleDelete(manual)`에서 `confirm()` → `showDeleteDialog = true` + `deleteTarget = manual`로 변경. AppBottomSheet 템플릿 추가 (제목: "매뉴얼 삭제", 내용: `'${manual.title}' 매뉴얼을 삭제하시겠습니까?`, 버튼: 취소/삭제)
  - **카테고리 정합성**: `CATEGORIES`를 `['전체', '재활', '근력', '다이어트', '스포츠', '코어', '유연성']`으로 정리. 필터 로직에서 `includes()` 대신 exact match 사용 (기존 `스포츠퍼포먼스` 매칭 로직 제거)
  - **"수정" 버튼 목적지 변경**: 카드의 "수정" 버튼이 `goToDetail()`이 아닌 edit 라우트로 이동: `router.push({ name: 'trainer-manual-edit', params: { id: manual.id } })`
  - AppBottomSheet import 추가

  **Must NOT do**:
  - 이미지 lazy loading 또는 placeholder shimmer 추가 금지
  - 미디어 없는 경우 빈 공간 표시 금지 (기존 placeholder SVG 유지)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 썸네일 로직 + AppBottomSheet 추가 + 카테고리 정리 + 수정 버튼 라우트 변경 등 복합 수정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 6, 7)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerManualView.vue:60-101` — 매뉴얼 카드 템플릿. 썸네일 교체 위치 (line 66-73)
  - `src/views/trainer/TrainerManualView.vue:168-171` — `handleDelete()`. AppBottomSheet로 교체
  - `src/views/trainer/TrainerManualView.vue:133` — `CATEGORIES` 상수. 정리 필요
  - `src/views/trainer/TrainerManualView.vue:139-156` — `filteredManuals` computed. 카테고리 필터 로직 단순화
  - `src/views/trainer/ReservationManageView.vue:5-16` — AppBottomSheet 삭제 확인 패턴 참조

  **API/Type References**:
  - `src/components/AppBottomSheet.vue` — `v-model`, `title` props
  - `src/composables/useManuals.js` — `deleteManual(id)` (이제 Storage도 정리)

  **Acceptance Criteria**:
  - [ ] 미디어 있는 매뉴얼 카드에 첫 번째 이미지 썸네일 표시
  - [ ] 미디어 없는 매뉴얼 카드에 기존 placeholder SVG 표시
  - [ ] 삭제 시 AppBottomSheet 다이얼로그 표시 (browser confirm 아님)
  - [ ] 카테고리 목록이 `['전체', '재활', '근력', '다이어트', '스포츠', '코어', '유연성']`
  - [ ] "수정" 버튼이 edit 라우트로 이동
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 썸네일 표시
    Tool: Playwright
    Preconditions: 미디어가 있는 매뉴얼 1개 이상 존재
    Steps:
      1. /trainer/settings/manual로 이동
      2. 미디어 있는 카드에서 <img> 태그 존재 확인 (.manual-list__card-thumb img)
      3. placeholder SVG가 아닌 실제 이미지가 표시되는지 확인
    Expected Result: 이미지 src가 supabase storage URL
    Failure Indicators: placeholder SVG만 표시되거나 이미지 로드 실패
    Evidence: .sisyphus/evidence/task-5-thumbnail.png

  Scenario: AppBottomSheet 삭제 확인
    Tool: Playwright
    Preconditions: 본인 매뉴얼 존재
    Steps:
      1. "삭제" 버튼 클릭
      2. AppBottomSheet 오버레이가 나타나는지 확인
      3. 시트에 매뉴얼 제목이 포함되어 있는지 확인
      4. "취소" 클릭 → 시트 닫힘
    Expected Result: browser confirm 대신 AppBottomSheet 표시
    Failure Indicators: browser confirm() 다이얼로그 표시
    Evidence: .sisyphus/evidence/task-5-delete-sheet.png
  ```

  **Commit**: YES
  - Message: `feat(trainer): add thumbnail display and AppBottomSheet delete to TrainerManualView`
  - Files: `src/views/trainer/TrainerManualView.vue`, `src/views/trainer/TrainerManualView.css`
  - Pre-commit: `npm run build`

- [x] 6. MemberManualView 카테고리 정합성 + 썸네일 표시

  **What to do**:
  - **카테고리 정합성**: `categories` 배열의 value를 DB enum과 일치시킴. 특히 `{ label: '스포츠', value: '스포츠퍼포먼스' }` → `{ label: '스포츠', value: '스포츠' }`로 변경. `코어`, `유연성`의 value도 확인
  - **썸네일 표시**: `fetchManuals()`가 media를 포함하므로, 카드의 placeholder를 실제 이미지로 교체. 패턴은 Task 5와 동일: `manual.media`에서 첫 번째 이미지를 찾아 표시, 없으면 placeholder SVG 유지

  **Must NOT do**:
  - 회원 뷰에 수정/삭제 버튼 추가 금지
  - FAB 버튼 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2가지 간단한 수정 — 카테고리 value 교정 + 썸네일 조건부 표시
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 7)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/views/member/MemberManualView.vue:112-120` — `categories` 배열. value 수정 위치
  - `src/views/member/MemberManualView.vue:64-72` — 카드 썸네일 영역. 이미지 조건부 표시 추가
  - `src/views/trainer/TrainerManualView.vue:66-73` — Task 5에서 구현한 썸네일 패턴 참조

  **Acceptance Criteria**:
  - [ ] 카테고리 value가 DB enum과 일치 (스포츠퍼포먼스 → 스포츠)
  - [ ] 미디어 있는 카드에 썸네일 표시
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 카테고리 필터 정합성
    Tool: Playwright
    Preconditions: '스포츠' 카테고리 매뉴얼 존재
    Steps:
      1. /member/manual로 이동
      2. '스포츠' 탭 클릭
      3. 스포츠 카테고리 매뉴얼이 필터링되어 표시되는지 확인
    Expected Result: 스포츠 매뉴얼이 올바르게 필터링됨
    Failure Indicators: 아무 매뉴얼도 표시되지 않음 (value 불일치)
    Evidence: .sisyphus/evidence/task-6-category-filter.png

  Scenario: 회원 뷰 수정/삭제 버튼 미노출
    Tool: Playwright
    Preconditions: 회원 로그인
    Steps:
      1. /member/manual로 이동
      2. 카드에 수정/삭제 버튼이 없는지 확인
    Expected Result: CRUD 버튼 없음 (읽기 전용)
    Failure Indicators: 수정/삭제 버튼이 표시됨
    Evidence: .sisyphus/evidence/task-6-readonly.png
  ```

  **Commit**: YES
  - Message: `fix(member): align MemberManualView categories and add thumbnails`
  - Files: `src/views/member/MemberManualView.vue`
  - Pre-commit: `npm run build`

- [x] 7. Router에 manual edit 라우트 추가

  **What to do**:
  - `src/router/index.js`에 edit 라우트 추가:
    ```
    {
      path: '/trainer/settings/manual/:id/edit',
      name: 'trainer-manual-edit',
      component: () => import('@/views/trainer/ManualRegisterView.vue'),
      meta: { hideNav: true },
    }
    ```
  - 위치: `/trainer/settings/manual/register` 뒤, `/trainer/settings/manual/:id` 앞에 배치 (Vue Router는 정적 세그먼트를 동적보다 우선하므로 `register` → `:id/edit` → `:id` 순서)
  - 기존 `trainer-manual-detail` 라우트 유지 (상세 뷰용)

  **Must NOT do**:
  - 기존 라우트 삭제나 이름 변경 금지
  - member 라우트 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 라우트 추가, 3줄 변경
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 6)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/router/index.js` — 기존 매뉴얼 라우트 배치 순서 확인. `/trainer/settings/manual` (list) → `/trainer/settings/manual/register` (create) → `/trainer/settings/manual/:id` (detail)

  **Acceptance Criteria**:
  - [ ] `/trainer/settings/manual/:id/edit` 라우트가 `ManualRegisterView`로 이동
  - [ ] 기존 라우트 (`trainer-manual`, `trainer-manual-register`, `trainer-manual-detail`) 정상 작동
  - [ ] `npm run build` 성공

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: edit 라우트 정상 로딩
    Tool: Playwright
    Preconditions: 매뉴얼 ID가 존재
    Steps:
      1. /trainer/settings/manual/:id/edit으로 직접 이동
      2. ManualRegisterView가 로드되는지 확인 (헤더 "매뉴얼 수정")
    Expected Result: ManualRegisterView가 edit 모드로 표시
    Failure Indicators: 404 또는 다른 뷰가 로드
    Evidence: .sisyphus/evidence/task-7-edit-route.png

  Scenario: 기존 라우트 회귀 없음
    Tool: Playwright
    Preconditions: 트레이너 로그인
    Steps:
      1. /trainer/settings/manual로 이동 → 목록 표시 확인
      2. /trainer/settings/manual/register로 이동 → 등록 폼 표시 확인
      3. /trainer/settings/manual/:id로 이동 → 상세 뷰 표시 확인
    Expected Result: 3개 기존 라우트 모두 정상
    Failure Indicators: 라우트 충돌로 잘못된 뷰 표시
    Evidence: .sisyphus/evidence/task-7-route-regression.png
  ```

  **Commit**: YES (groups with T3)
  - Message: `feat(router): add manual edit route`
  - Files: `src/router/index.js`
  - Pre-commit: `npm run build`

- [x] 8. useManuals composable 단위 테스트 추가

  **What to do**:
  - 기존 `src/composables/__tests__/useManuals.test.js` (8개 테스트)에 새 테스트 추가:
    1. `fetchManuals`가 media JOIN을 포함하는 select 쿼리를 사용하는지 확인
    2. `searchManuals`가 media JOIN을 포함하는 select 쿼리를 사용하는지 확인
    3. `deleteManual`이 Storage `remove()`를 호출하는지 확인
    4. `deleteManual`에서 Storage 삭제 실패 시에도 DB 삭제가 진행되는지 확인
    5. `deleteManualMedia`가 DB + Storage 모두 삭제하는지 확인
    6. `addManualMedia`가 파일 업로드 + DB INSERT하는지 확인
    7. `extractStoragePath`가 URL에서 올바른 경로를 추출하는지 확인
  - 기존 테스트 파일의 `vi.hoisted()` + `createBuilder()` 패턴을 따를 것

  **Must NOT do**:
  - 컴포넌트 테스트 추가 금지
  - E2E 테스트 추가 금지
  - 기존 8개 테스트 수정 금지 (새 테스트만 추가)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 7개 테스트 케이스 작성, 모킹 패턴 이해 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2 완료 후)
  - **Parallel Group**: Wave 3 (standalone)
  - **Blocks**: None
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `src/composables/__tests__/useManuals.test.js` — 기존 8개 테스트. Supabase 모킹 패턴 (`vi.hoisted()`, `createBuilder()` 등)
  - `src/composables/__tests__/useReservations.test.js` — 유사한 모킹 패턴 참조
  - `src/composables/useManuals.js` — 테스트 대상 함수들의 구현

  **Acceptance Criteria**:
  - [ ] 새 테스트 7개 이상 추가
  - [ ] 기존 8개 테스트 변경 없이 통과
  - [ ] `npx vitest run` → 전체 통과 (75+ tests)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 전체 테스트 통과
    Tool: Bash (npx vitest run)
    Preconditions: 모든 composable 및 view 변경 완료
    Steps:
      1. npx vitest run
      2. 전체 테스트 통과 확인
    Expected Result: 75+ tests passed (68 기존 + 7+ 신규)
    Failure Indicators: 테스트 실패 존재
    Evidence: .sisyphus/evidence/task-8-test-results.txt

  Scenario: Storage 삭제 실패 시 DB 삭제 진행 테스트
    Tool: Bash (npx vitest run src/composables/__tests__/useManuals.test.js)
    Preconditions: 해당 테스트 작성 완료
    Steps:
      1. Storage.remove가 에러를 throw하도록 모킹
      2. deleteManual 호출
      3. DB delete가 여전히 실행되었는지 확인
    Expected Result: Storage 에러에도 불구하고 DB 삭제 성공
    Failure Indicators: Storage 에러로 인해 DB 삭제가 스킵됨
    Evidence: .sisyphus/evidence/task-8-storage-failure.txt
  ```

  **Commit**: YES
  - Message: `test(composables): add useManuals composable unit tests`
  - Files: `src/composables/__tests__/useManuals.test.js`
  - Pre-commit: `npx vitest run`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify CSS uses only design tokens (no hardcoded hex/px for colors/spacing).
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (create manual → view thumbnail → edit → delete). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **T1**: `feat(db): expand manual_category enum with 스포츠, 코어, 유연성` — migration only
- **T2**: `feat(composables): add media JOIN, Storage cleanup, deleteManualMedia to useManuals` — useManuals.js
- **T3**: `feat(trainer): add manual edit mode to ManualRegisterView` — ManualRegisterView.vue, ManualRegisterView.css
- **T4**: `feat(manual): add edit/delete buttons for trainer in ManualDetailView` — ManualDetailView.vue, ManualDetailView.css
- **T5**: `feat(trainer): add thumbnail display and AppBottomSheet delete to TrainerManualView` — TrainerManualView.vue, TrainerManualView.css
- **T6**: `fix(member): align MemberManualView categories and add thumbnails` — MemberManualView.vue
- **T7**: `feat(router): add manual edit route` — src/router/index.js
- **T8**: `test(composables): add useManuals composable unit tests` — src/composables/__tests__/useManuals.test.js

---

## Success Criteria

### Verification Commands
```bash
npm run build     # Expected: ✓ 202+ modules transformed, 0 errors
npx vitest run    # Expected: all tests pass (68 existing + new)
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] DB enum has 6 categories (재활, 근력, 다이어트, 스포츠, 코어, 유연성)
- [ ] 매뉴얼 목록에 썸네일 표시됨
- [ ] 트레이너가 매뉴얼 수정/삭제 가능
- [ ] 삭제 시 Storage 파일도 정리됨
- [ ] 카테고리가 모든 뷰에서 일관됨
