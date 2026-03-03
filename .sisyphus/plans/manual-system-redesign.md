# 매뉴얼 시스템 재설계 — 등록폼 ↔ 상세보기 동기화

## TL;DR

> **요약**: 매뉴얼 등록폼(ManualRegisterView)과 상세보기(ManualDetailView) 간 데이터 불일치를 해결합니다. 등록폼에는 없는 필드(steps, muscles, equipment 등)를 상세보기에서 제거하고, 등록폼의 미디어/YouTube 필드를 상세보기에 반영합니다. 등록폼에 선택적 필드(소요시간, 난이도)를 추가하고, 목록 카드와 목 데이터를 통합 스키마로 업데이트합니다.
>
> **산출물**:
> - 통합 데이터 스키마 정의 및 전 파일 적용
> - ManualRegisterView.vue/.css — 소요시간, 난이도 필드 추가
> - ManualDetailView.vue/.css — 완전 재작성 (미디어 갤러리, YouTube 썸네일, 설명 섹션)
> - MemberManualView.vue — 목 데이터 + 카드 템플릿 + 필터 로직 업데이트
> - TrainerManualView.vue — 목 데이터 + 카드 템플릿 + 필터 로직 업데이트
>
> **예상 규모**: Medium
> **병렬 실행**: YES — 3 waves
> **크리티컬 패스**: Task 1 (스키마) → Task 2, 3 (등록폼, 상세보기) → Task 4 (통합 검증)

---

## Context

### 원래 요청
"매뉴얼을 추가에는 제목, 설명, 사진, 영상이 있는데 현재 상세보기와 싱크가 맞지 않음. 이를 최대한 간단하고 추가하기 쉽고 상세보기도 UI/UX적으로 간단하게 다시 만들계획을 수립 해줘"

### 인터뷰 요약
**핵심 논의사항**:
- 등록폼에만 맞추는 것이 아니라 상세보기와 등록폼을 **적절하게 섞어야** 함
- 목록 카드(MemberManualView, TrainerManualView) + 목 데이터도 **함께** 변경
- 미디어는 **플레이스홀더 이미지** (더미 그라디언트/빈 박스, 외부 URL 금지)
- YouTube는 **썸네일 + 링크** 방식 (iframe 임베드 아님)
- 모든 응답/코멘트는 한글

**리서치 결과**:
- ManualRegisterView 폼: `title, description, categories[], youtubeUrl, media[]`
- ManualDetailView 표시: `title, category(단수), duration, unit, difficulty, sets, gradient, description, muscles[], equipment[], steps[], tips[]`
- 목록 카드 스키마: `{id, title, category(단수), duration, unit, difficulty, gradient}`
- 두 뷰의 라우트가 모두 **같은** `src/views/member/ManualDetailView.vue`를 참조

### Metis 리뷰
**발견된 갭** (반영 완료):
- ManualDetailView가 `src/views/member/`에 위치 (trainer 아님) — 두 라우트가 같은 컴포넌트 공유
- `category`(단수) → `categories`(배열) 전환 시 필터 로직 변경 필요 (`.includes()`)
- 목 데이터 8개 항목 유지 필수
- `steps`, `muscles`, `equipment` 관련 템플릿 표현식 제거 시 누락 주의
- YouTube 썸네일 외부 URL 사용 여부 명확화 필요 (플레이스홀더 박스 + 재생 아이콘으로 결정)
- Hero 그라디언트는 유지하되, 사진은 별도 미디어 갤러리 섹션으로 표시

---

## 통합 데이터 스키마 (모든 작업의 기준)

> **이 스키마가 모든 파일의 단일 진실 공급원(Single Source of Truth)입니다.**
> 모든 목 데이터, 템플릿, 폼 필드는 이 스키마를 따라야 합니다.

### 상세보기 + 목록 목 데이터 스키마

```js
{
  id: Number,                    // 고유 ID
  title: String,                 // 매뉴얼 제목 (필수)
  description: String,           // 상세 설명 (필수)
  categories: String[],          // 카테고리 배열 (복수 선택) — 예: ['재활', '코어']
  gradient: String,              // Hero 및 카드 썸네일 배경 그라디언트
  duration: Number | null,       // 소요시간 숫자 (선택) — null이면 미표시
  unit: String,                  // 시간 단위 — '분' (기본값)
  difficulty: String | null,     // 난이도 (선택) — null이면 미표시 ('초급'|'중급'|'고급')
  youtubeUrl: String,            // YouTube URL (빈 문자열이면 미표시)
  media: Array<{                 // 사진/영상 배열 (최대 5개, 빈 배열이면 미표시)
    type: 'image' | 'video',     // 미디어 타입
    placeholder: String,         // 플레이스홀더 그라디언트 또는 라벨
  }>,
}
```

### 목록 카드 목 데이터 스키마 (상세보기 스키마의 부분집합)

```js
{
  id: Number,
  title: String,
  categories: String[],          // category(단수) → categories(배열)로 변경
  gradient: String,
  duration: Number | null,
  unit: String,
  difficulty: String | null,
}
```

### 등록폼 상태 (ManualRegisterView `form` reactive)

```js
form = reactive({
  title: '',                     // 기존 유지
  description: '',               // 기존 유지
  categories: [],                // 기존 유지 (배열)
  youtubeUrl: '',                // 기존 유지
  duration: null,                // 새로 추가 (선택)
  difficulty: '',                // 새로 추가 (선택)
})
mediaFiles = ref([])             // 기존 유지 (최대 5개)
```

### 제거되는 필드 (상세보기에서 삭제)
- `sets` — 등록폼에 없음, 세트 수는 설명에 포함 가능
- `muscles[]` — 등록폼에 없음, 카테고리로 충분
- `equipment[]` — 등록폼에 없음
- `steps[]` — 등록폼에 없음, description에 통합
- `tips[]` — 등록폼에 없음, description에 통합

---

## Work Objectives

### Core Objective
매뉴얼 등록폼에서 입력 가능한 데이터와 상세보기에서 표시하는 데이터를 완전히 동기화하여, 등록 → 목록 → 상세보기 흐름이 일관되게 만듭니다.

### Concrete Deliverables
- `src/views/trainer/ManualRegisterView.vue` — 소요시간(분), 난이도 입력 필드 추가
- `src/views/trainer/ManualRegisterView.css` — 새 필드 스타일 추가
- `src/views/member/ManualDetailView.vue` — 완전 재작성 (새 스키마 기반)
- `src/views/member/ManualDetailView.css` — 완전 재작성
- `src/views/member/MemberManualView.vue` — 목 데이터 + 카드 + 필터 업데이트
- `src/views/trainer/TrainerManualView.vue` — 목 데이터 + 카드 + 필터 업데이트

### Definition of Done
- [ ] `npm run build` 성공 (exit code 0)
- [ ] 모든 목 데이터 객체가 통합 스키마를 따름
- [ ] ManualDetailView에서 제거된 필드 관련 템플릿 표현식 없음
- [ ] 카테고리 필터가 배열 기반으로 동작 (`.includes()`)
- [ ] 외부 이미지 URL 없음 (그라디언트/플레이스홀더만 사용)
- [ ] iframe 없음 (YouTube = 플레이스홀더 박스 + 재생 아이콘 + URL 텍스트)

### Must Have
- 등록폼 ↔ 상세보기 필드 완전 일치
- 카테고리가 배열(복수)로 통일
- 미디어 갤러리 섹션 (플레이스홀더 이미지)
- YouTube 섹션 (썸네일 플레이스홀더 + 링크)
- 소요시간/난이도가 등록폼에서 입력 가능 (선택적)
- 목록 카드가 배열 카테고리의 첫 번째 항목 표시
- 8개 목 데이터 유지

### Must NOT Have (가드레일)
- ❌ 외부 이미지 URL (unsplash, placeholder.com 등)
- ❌ YouTube iframe 임베드
- ❌ YouTube URL 파싱 로직 (비디오 ID 추출 등)
- ❌ 라우터 변경 (이미 완료됨)
- ❌ 파일 위치 이동 (ManualDetailView는 `src/views/member/`에 유지)
- ❌ 새 공유 컴포넌트 추출 (AppManualCard 등)
- ❌ CSS 파일 통합 (Member/Trainer CSS 각각 유지)
- ❌ 폼 유효성 검사 추가 (기존 `!form.title.trim()` 외)
- ❌ 편집 모드 추가 (상세보기에 수정 기능 없음)
- ❌ Vue `<Transition>` 또는 애니메이션 추가
- ❌ TypeScript, Options API, 상대 경로 import
- ❌ 하드코딩된 색상/사이즈 (CSS 변수만 사용)

---

## Verification Strategy

> **모든 검증은 에이전트가 자동 실행합니다. 수동 테스트 없음.**

### Test Decision
- **테스트 인프라 존재**: NO
- **자동화 테스트**: None
- **프레임워크**: 없음
- **TDD**: N/A

### QA Policy
모든 태스크에 에이전트 실행 QA 시나리오 포함 (필수).
증거는 `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`에 저장.

- **Frontend/UI**: Playwright (playwright skill) — 네비게이션, 상호작용, DOM 검증, 스크린샷
- **빌드 검증**: Bash (`npm run build`) — exit code 0 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (즉시 시작 — 스키마 기반 작업, 5 병렬):
├── Task 1: 등록폼 업데이트 (소요시간 + 난이도 필드 추가) [quick]
├── Task 2: MemberManualView 목 데이터 + 카드 + 필터 업데이트 [quick]
├── Task 3: TrainerManualView 목 데이터 + 카드 + 필터 업데이트 [quick]

Wave 2 (Wave 1 이후 — 상세보기 재작성):
├── Task 4: ManualDetailView.vue 완전 재작성 [visual-engineering]
├── Task 5: ManualDetailView.css 완전 재작성 [visual-engineering]

Wave 3 (Wave 2 이후 — 통합 검증):
├── Task 6: 빌드 + 네비게이션 통합 검증 [unspecified-high]

Wave FINAL (모든 태스크 완료 후 — 독립 검증, 4 병렬):
├── Task F1: 플랜 준수 감사 (oracle)
├── Task F2: 코드 품질 리뷰 (unspecified-high)
├── Task F3: 실제 QA (unspecified-high + playwright)
├── Task F4: 스코프 충실도 점검 (deep)

Critical Path: Task 1-3 → Task 4-5 → Task 6 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 3 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4, 5 | 1 |
| 2 | — | 4, 6 | 1 |
| 3 | — | 4, 6 | 1 |
| 4 | 1, 2, 3 | 6 | 2 |
| 5 | 1, 2, 3 | 6 | 2 |
| 6 | 4, 5 | F1-F4 | 3 |
| F1-F4 | 6 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `quick`, T2 → `quick`, T3 → `quick`
- **Wave 2**: **2** — T4 → `visual-engineering`, T5 → `visual-engineering`
- **Wave 3**: **1** — T6 → `unspecified-high` + `playwright`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

- [x] 1. ManualRegisterView - 소요시간 + 난이도 필드 추가

  **What to do**:
  - `src/views/trainer/ManualRegisterView.vue`의 `form` reactive에 `duration: null`과 `difficulty: ''` 필드 추가
  - YouTube URL 섹션 위에 새 `<section>` 2개 추가:
    - **소요시간**: number input (placeholder: '소요시간 (분)'), `v-model.number="form.duration"`, `min="1"`, `max="999"`
    - **난이도**: 3개 칩 버튼 ('초급', '중급', '고급'), 하나만 선택 가능 (토글 패턴 - 같은 것 다시 클릭하면 해제)
  - `src/views/trainer/ManualRegisterView.css`에 새 필드 스타일 추가 (기존 `.manual-reg__chip` 패턴 재사용)
  - 난이도 칩은 카테고리 칩과 동일한 BEM 클래스 패턴 사용
  - 소요시간 input은 기존 `.manual-reg__input` 클래스 재사용

  **Must NOT do**:
  - 폼 유효성 검사 추가 금지 (기존 `!form.title.trim()` 외)
  - 기존 필드(title, description, categories, youtubeUrl, media) 변경 금지
  - `handleSave()` 로직 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 패턴(칩, 인풋)을 복사하여 2개 섹션 추가하는 단순 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: None (즉시 시작 가능)

  **References**:

  **Pattern References**:
  - `src/views/trainer/ManualRegisterView.vue:19-32` - 카테고리 칩 섹션 패턴 (토글 버튼 구현 예시)
  - `src/views/trainer/ManualRegisterView.vue:34-44` - 텍스트 input 섹션 패턴 (label + input 구조)
  - `src/views/trainer/ManualRegisterView.vue:160-165` - `form` reactive 객체 (여기에 필드 추가)
  - `src/views/trainer/ManualRegisterView.vue:167-174` - `toggleCategory()` 함수 (난이도 토글 참고, 단 단일 선택)

  **API/Type References**:
  - 통합 스키마 (이 플랜의 '통합 데이터 스키마' 섹션) - `duration: Number | null`, `difficulty: String | null`

  **WHY Each Reference Matters**:
  - 카테고리 칩 패턴: 난이도 칩을 동일한 방식으로 구현하되, 단일 선택만 허용 (배열이 아닌 단일 문자열)
  - input 패턴: 소요시간 input을 동일한 label + input 구조로 추가
  - form reactive: 새 필드를 기존 패턴과 일관되게 추가

  **Acceptance Criteria**:
  - [ ] `npm run build` 성공 (exit code 0)
  - [ ] `form` reactive에 `duration`과 `difficulty` 필드 존재
  - [ ] 소요시간 input 렌더링 확인
  - [ ] 난이도 칩 3개 렌더링 확인 ('초급', '중급', '고급')

  **QA Scenarios (필수):**

  ```
  Scenario: 등록폼 새 필드 렌더링 확인
    Tool: Playwright
    Preconditions: 개발 서버 실행 (http://localhost:5173)
    Steps:
      1. /trainer/settings/manual/register 로 이동
      2. '.manual-reg__body' 내에서 '소요시간' 라벨 텍스트 존재 확인
      3. input[type="number"] 요소 존재 확인
      4. '난이도' 라벨 텍스트 존재 확인
      5. '초급', '중급', '고급' 텍스트를 가진 버튼 3개 존재 확인
      6. '중급' 버튼 클릭
      7. 클릭된 버튼에 active 클래스 존재 확인
      8. 스크린샷 캡처
    Expected Result: 소요시간 input과 난이도 칩 3개가 정상 렌더링
    Failure Indicators: 요소 미발견, active 클래스 미적용
    Evidence: .sisyphus/evidence/task-1-register-new-fields.png

  Scenario: 난이도 단일 선택 토글 동작
    Tool: Playwright
    Preconditions: 등록폼 페이지 로드 완료
    Steps:
      1. '초급' 버튼 클릭 -> active 확인
      2. '고급' 버튼 클릭 -> '고급'만 active, '초급'은 비활성 확인
      3. '고급' 버튼 다시 클릭 -> 모두 비활성 확인 (해제)
    Expected Result: 한 번에 하나만 선택, 재클릭 시 해제
    Failure Indicators: 복수 선택 가능, 해제 불가
    Evidence: .sisyphus/evidence/task-1-difficulty-toggle.png
  ```

  **Commit**: YES (단독 커밋)
  - Message: `feat(manual): 등록폼에 소요시간, 난이도 필드 추가`
  - Files: `src/views/trainer/ManualRegisterView.vue`, `src/views/trainer/ManualRegisterView.css`
  - Pre-commit: `npm run build`

---

- [x] 2. MemberManualView - 목 데이터 + 카드 + 필터 업데이트

  **What to do**:
  - `src/views/member/MemberManualView.vue`의 `manuals` 목 데이터:
    - `category`(단수 문자열) -> `categories`(배열)로 변경. 예: `category: '재활'` -> `categories: ['재활']`
    - 일부 항목에 복수 카테고리 부여 (예: id:1 `['재활', '코어']`, id:6 `['코어', '근력']`)
    - 8개 항목 유지, 기존 gradient/duration/unit/difficulty 유지
  - 카드 템플릿 수정:
    - `{{ item.category }}` -> `{{ item.categories[0] }}` (배지에 첫 번째 카테고리 표시)
  - `filteredItems` computed 필터 로직 수정:
    - `item.category === selectedCategory.value` -> `item.categories.includes(selectedCategory.value)`

  **Must NOT do**:
  - CSS 파일 수정 금지 (카드 구조 변경 없음)
  - 검색 로직 변경 금지
  - handleCardClick/handleMore 변경 금지
  - FAB 버튼이 없는 것이 MemberManualView의 특징 - FAB 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 목 데이터 필드명 변경 + 템플릿/필터 1줄씩 수정하는 단순 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/member/MemberManualView.vue:111-184` - 현재 목 데이터 (8개 항목, `category` 단수)
  - `src/views/member/MemberManualView.vue:64` - 배지 템플릿 `{{ item.category }}`
  - `src/views/member/MemberManualView.vue:187-194` - `filteredItems` computed (필터 로직)

  **API/Type References**:
  - 통합 스키마 (이 플랜) - 목록 카드 목 데이터 스키마 섹션

  **WHY Each Reference Matters**:
  - 목 데이터: `category` -> `categories` 변환 대상
  - 배지: 단수 표시를 배열의 첫 번째 요소로 변경
  - 필터: `.includes()` 기반으로 변경하여 복수 카테고리 지원

  **Acceptance Criteria**:
  - [ ] `npm run build` 성공
  - [ ] 모든 8개 목 데이터 객체에 `categories` 배열 필드 존재
  - [ ] `category` 단수 필드 없음
  - [ ] 필터 로직에 `.includes()` 사용

  **QA Scenarios (필수):**

  ```
  Scenario: 회원 매뉴얼 목록 카드 렌더링 + 필터
    Tool: Playwright
    Preconditions: 개발 서버 실행
    Steps:
      1. http://localhost:5173/member/manual 로 이동
      2. '.manual-list__card' 요소 8개 존재 확인
      3. 첫 번째 카드의 '.manual-list__card-badge' 텍스트가 비어있지 않은지 확인
      4. 텍스트에 'undefined'가 포함되지 않았는지 확인
      5. '재활' 카테고리 칩 클릭
      6. 표시되는 카드 수가 8 미만인지 확인 (필터 작동)
      7. 스크린샷 캡처
    Expected Result: 8개 카드 정상 렌더링, 카테고리 필터 동작, 'undefined' 텍스트 없음
    Failure Indicators: 카드 수 불일치, 'undefined' 표시, 필터 미작동
    Evidence: .sisyphus/evidence/task-2-member-list-filter.png
  ```

  **Commit**: NO (Task 3과 함께 커밋)

- [x] 3. TrainerManualView - 목 데이터 + 카드 + 필터 업데이트

  **What to do**:
  - `src/views/trainer/TrainerManualView.vue`의 `manuals` 목 데이터:
    - Task 2와 **동일한** `categories` 배열 변경 적용 (같은 8개 항목, 같은 카테고리 배열)
    - MemberManualView와 정확히 같은 목 데이터 스키마 유지
  - 카드 템플릿 수정: `{{ item.category }}` -> `{{ item.categories[0] }}`
  - `filteredItems` computed: `item.category ===` -> `item.categories.includes()`

  **Must NOT do**:
  - CSS 파일 수정 금지
  - FAB 버튼, handleAdd, handleMore 변경 금지
  - 검색 로직 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Task 2와 동일한 패턴의 단순 수정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/views/trainer/TrainerManualView.vue:118-191` - 현재 목 데이터
  - `src/views/trainer/TrainerManualView.vue:64` - 배지 템플릿
  - `src/views/trainer/TrainerManualView.vue:194-202` - `filteredItems` computed
  - Task 2의 MemberManualView 변경 결과 - 동일 스키마 보장을 위한 크로스 참조

  **WHY Each Reference Matters**:
  - 목 데이터: MemberManualView와 동일한 변경 적용
  - 필터: 동일한 `.includes()` 패턴 적용

  **Acceptance Criteria**:
  - [ ] `npm run build` 성공
  - [ ] TrainerManualView 목 데이터가 MemberManualView와 동일한 스키마
  - [ ] `category` 단수 필드 없음
  - [ ] 필터 로직에 `.includes()` 사용
  - [ ] FAB 버튼 동작 정상 유지

  **QA Scenarios (필수):**

  ```
  Scenario: 트레이너 매뉴얼 목록 카드 렌더링 + 필터 + FAB
    Tool: Playwright
    Preconditions: 개발 서버 실행
    Steps:
      1. http://localhost:5173/trainer/settings/manual 로 이동
      2. '.manual-list__card' 요소 8개 존재 확인
      3. 첫 번째 카드의 '.manual-list__card-badge' 텍스트에 'undefined' 없음 확인
      4. '근력' 카테고리 칩 클릭
      5. 필터링된 카드만 표시되는지 확인
      6. '.manual-list__fab' 버튼 존재 확인
      7. 스크린샷 캡처
    Expected Result: 8개 카드, 필터 동작, FAB 존재, 'undefined' 없음
    Failure Indicators: 카드 수 불일치, FAB 미발견
    Evidence: .sisyphus/evidence/task-3-trainer-list-filter.png
  ```

  **Commit**: YES (Task 2와 함께)
  - Message: `refactor(manual): 목록 뷰 목 데이터를 통합 스키마로 업데이트`
  - Files: `src/views/member/MemberManualView.vue`, `src/views/trainer/TrainerManualView.vue`
  - Pre-commit: `npm run build`
---

- [x] 4. ManualDetailView.vue - 완전 재작성

  **What to do**:
  - `src/views/member/ManualDetailView.vue`를 새 통합 스키마 기반으로 **완전 재작성**:
    - Hero 섹션: `manual.categories` (첫 번째 카테고리 배지), `manual.title`, `manual.gradient` 배경 유지
    - Meta 바: `manual.duration` + `manual.unit`, `manual.difficulty` 표시 (null/undefined이면 숨김)
    - 설명 섹션: `manual.description` 표시
    - 미디어 갤러리 섹션: `manual.media` 배열 반복, 플레이스홀더 그라디언트 박스 렌더링 (type='image'/'video' 라벨)
    - YouTube 섹션: `manual.youtubeUrl`이 있으면 플레이스홀더 박스 + 재생 아이콘 + URL 텍스트 링크
  - 기존 `steps[]`, `muscles[]`, `equipment[]`, `tips[]`, `sets` 관련 코드는 **전체 제거**
  - 목 데이터 8개 항목을 새 스키마로 업데이트:
    ```js
    {
      id: 1,
      title: '허리 재활 운동',
      description: '허리 통증 완화와 코어 안정화를 위한 재활 프로그램입니다.',
      categories: ['재활'],
      gradient: 'linear-gradient(145deg, #c9a97a 0%, #a07850 45%, #7a5c38 100%)',
      duration: 15,
      unit: '분',
      difficulty: '초급',
      youtubeUrl: '',
      media: [
        { type: 'image', placeholder: '그라디언트1' },
        { type: 'image', placeholder: '그라디언트2' }
      ]
    }
    ```

  **Must NOT do**:
  - 외부 이미지 URL 사용 금지 (플레이스홀더 그라디언트만)
  - YouTube iframe 임베드 금지
  - steps/muscles/equipment/tips/sets 관련 코드 유지 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Vue 템플릿 완전 재작성, 새 스키마 기반 구조 설계
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 5)
  - **Parallel Group**: Wave 2 (with Task 5)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 2, 3 (Wave 1 완료 후)

  **References**:
  - `src/views/member/ManualDetailView.vue` - 현재 상세보기 (삭제 후 재작성)
  - 통합 스키마 섹션

  **Acceptance Criteria**:
  - [ ] `npm run build` 성공
  - [ ] Hero/메타/설명/미디어/YouTube 섹션만 존재
  - [ ] steps/muscles/equipment/tips/sets 코드 없음
  - [ ] 8개 목 데이터가 새 스키마 따름

  **QA Scenarios (필수):**

  ```
  Scenario: 상세보기 주요 섹션 렌더링
    Tool: Playwright
    Preconditions: 개발 서버 실행
    Steps:
      1. /member/manual/1 로 이동
      2. Hero 섹션 '.manual-detail__hero' 존재 확인
      3. 제목 '.manual-detail__title' 텍스트 확인
      4. 메타바 '.manual-detail__meta' 존재 확인
      5. 설명 섹션 '.manual-detail__section' 존재 확인
      6. 'undefined' 텍스트 없음 확인
      7. 스크린샷 캡처
    Expected Result: 모든 섹션 정상 렌더링
    Failure Indicators: 섹션 누락, 'undefined' 텍스트
    Evidence: .sisyphus/evidence/task-4-detail-sections.png
  ```

  **Commit**: NO (Task 5와 함께)

- [x] 5. ManualDetailView.css - 완전 재작성

  **What to do**:
  - `src/views/member/ManualDetailView.css`를 새 섹션 기반으로 **완전 재작성**:
    - Hero 스타일 유지 (그라디언트 배경)
    - Meta 바 스타일 유지
    - 새 미디어 갤러리 섹션 스타일 추가 (그리드, 플레이스홀더 박스)
    - 새 YouTube 섹션 스타일 추가 (플레이스홀더 박스 + 재생 아이콘)
  - 기존 steps/muscles/equipment/tips 관련 스타일 **전체 제거**

  **Must NOT do**:
  - 하드코딩된 색상/사이즈 사용 금지 (CSS 변수만)
  - BEM 블록명 변경 금지 (`manual-detail__` 유지)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 4)
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 2, 3

  **Acceptance Criteria**:
  - [ ] CSS 빌드 오류 없음
  - [ ] 새 미디어/YouTube 섹션 스타일 존재
  - [ ] steps/muscles/equipment/tips 스타일 없음

  **Commit**: YES (Task 4와 함께)
  - Message: `feat(manual): 상세보기를 통합 스키마 기반으로 완전 재작성`
  - Files: `src/views/member/ManualDetailView.vue`, `src/views/member/ManualDetailView.css`
  - Pre-commit: `npm run build`

- [x] 6. 빌드 + 네비게이션 통합 검증

  **What to do**:
  - 전체 통합 흐름 검증:
    1. `npm run build` 실행, exit code 0 확인
    2. 등록폼 (/trainer/settings/manual/register) 새 필드 렌더링 확인
    3. 트레이너 목록 (/trainer/settings/manual) 카드 8개, 필터 동작 확인
    4. 회원 목록 (/member/manual) 카드 8개, 필터 동작 확인
    5. 상세보기 (/member/manual/1) 새 섹션 정상 렌더링 확인
    6. 카드 클릭 -> 상세보기 이동 확인

  **Must NOT do**:
  - 개별 파일 수정 없음 (검증만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: ["playwright"]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 4, 5

  **Acceptance Criteria**:
  - [ ] `npm run build` 성공
  - [ ] 등록폼/목록/상세보기 전 페이지 렌더링 확인
  - [ ] JS 에러 없음

  **QA Scenarios (필수):**

  ```
  Scenario: 전체 통합 흐름
    Tool: Playwright
    Preconditions: 개발 서버 실행
    Steps:
      1. npm run build 실행 -> exit code 0 확인
      2. /trainer/settings/manual/register 새 필드 확인
      3. /trainer/settings/manual 카드 8개 확인
      4. /member/manual 카드 8개 확인
      5. /member/manual/1 상세보기 정상 로드
      6. 카드 클릭 -> 상세보기 이동
      7. 모든 페이지 JS 에러 없음 확인
    Expected Result: 전 섹션 정상 작동
    Failure Indicators: 빌드 실패, 페이지 로드 실패, JS 에러
    Evidence: .sisyphus/evidence/task-6-integration.png
  ```

  **Commit**: NO (검증만)

---
## Final Verification Wave (필수 — 모든 구현 태스크 완료 후)

> 4개 리뷰 에이전트가 병렬 실행. 모두 APPROVE 필요. 거부 시 수정 → 재실행.

- [ ] F1. **플랜 준수 감사** — `oracle`
  플랜 전체를 읽고, 각 "Must Have"에 대해 구현 존재 여부 확인 (파일 읽기, 빌드 실행). 각 "Must NOT Have"에 대해 코드베이스에서 금지 패턴 검색 — 발견 시 파일:라인과 함께 거부. `.sisyphus/evidence/` 증거 파일 존재 확인. 산출물과 플랜 비교.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **코드 품질 리뷰** — `unspecified-high`
  `npm run build` 실행. 모든 변경 파일 검토: `as any`, `@ts-ignore`, 빈 catch, console.log, 주석 처리된 코드, 사용하지 않는 import. AI 슬롭 확인: 과도한 주석, 과잉 추상화, 제네릭 이름(data/result/item/temp), 하드코딩된 색상/사이즈. Options API 사용 여부, 상대 경로 import 확인.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **실제 QA** — `unspecified-high` + `playwright` skill
  클린 상태에서 시작. 모든 태스크의 QA 시나리오를 직접 실행 — 정확한 단계를 따르고 증거 캡처. 크로스 태스크 통합 테스트 (등록폼 → 목록 → 상세보기 흐름). 엣지 케이스: 빈 상태, 카테고리 필터, 모든 카드 클릭. `.sisyphus/evidence/final-qa/`에 저장.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **스코프 충실도 점검** — `deep`
  각 태스크: "What to do" 읽기, 실제 diff 확인 (git log/diff). 1:1 일치 검증 — 스펙의 모든 것이 구현됨 (누락 없음), 스펙 외 구현 없음 (크립 없음). "Must NOT do" 준수 확인. 크로스 태스크 오염 감지: 태스크 N이 태스크 M의 파일 수정. 미등록 변경 플래그.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| 순서 | 커밋 메시지 | 파일 | 검증 |
|------|-----------|------|------|
| 1 | `feat(manual): 등록폼에 소요시간, 난이도 필드 추가` | ManualRegisterView.vue, ManualRegisterView.css | npm run build |
| 2 | `refactor(manual): 목록 뷰 목 데이터를 통합 스키마로 업데이트` | MemberManualView.vue, TrainerManualView.vue | npm run build |
| 3 | `feat(manual): 상세보기를 통합 스키마 기반으로 완전 재작성` | ManualDetailView.vue, ManualDetailView.css | npm run build |

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: exit code 0, no errors
```

### Final Checklist
- [ ] 모든 "Must Have" 충족
- [ ] 모든 "Must NOT Have" 부재
- [ ] 8개 목 데이터 전 파일 동일 스키마
- [ ] 카테고리 필터 배열 기반 동작
- [ ] 외부 URL 없음
- [ ] iframe 없음
- [ ] 빌드 성공
