# TrainerSearchView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec, gpt-5.4)
> 원본 파일: docs/ux-review/TrainerSearchView.md
> 참조한 소스 파일: src/views/trainer/TrainerSearchView.vue, TrainerSearchView.css, src/composables/useTrainerSearch.js, src/utils/navigation.js, src/router/index.js
> 리뷰 라운드: 1회 (최종 판정: NEEDS_IMPROVEMENT → 피드백 반영 후 최종본)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 뒤로가기 fallback 오류(/search vs /trainer/search) 누락, 검색 race condition 누락, 에러 피드백 중복(토스트+인라인) 미분석, raw 에러 메시지 사용자 노출 누락, Major 3의 심각도 과소평가 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/TrainerSearchView.vue` + `TrainerSearchView.css`
- **역할**: 회원이 트레이너를 검색하고 연결 요청을 보내는 화면. 트레이너 목록 조회, 이름 검색(debounce), 연결 요청/상태 표시
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 3 | 스켈레톤 구현됨, 하지만 에러 피드백 중복 + raw 메시지 노출 |
| 터치 타겟 | 4 | 버튼 44px, 헤더 아이콘 40px — 양호 |
| 스크롤/인터랙션 | 3 | debounce 검색 구현, 무한 스크롤/풀투리프레시 없음 |
| 시각적 일관성 | 3 | 에러 메시지 스타일이 다른 화면과 불일치 |
| 접근성 | 2 | 아이콘 버튼 aria-label 없음, 검색 input에 label 없음 |
| 정보 밀도 | 3 | 트레이너 카드에 프로필 사진 미표시 |
| 전체 사용성 | 3 | 핵심 검색/연결 요청 플로우 구현되었으나 안정성/안전장치 부족 |

---

### Critical (즉시 수정 필요)

(해당 없음)

---

### Major (높은 우선순위)

#### 1. 뒤로가기 fallback 경로 불일치
- **위치**: `src/router/index.js:93-96` (라우트 경로 `/search`), `src/utils/navigation.js:16` (fallback 매핑 `/trainer/search`)
- **문제**: 실제 라우트 경로는 `/search`인데, `safeBack`의 fallback 매핑에는 `/trainer/search`로 등록되어 있음. 내부 네비게이션 이력이 없는 상태에서 뒤로가기 시 적절한 fallback 경로로 이동하지 못할 수 있음
- **사용자 영향**: 뒤로가기 시 `/login`으로 떨어지는 등 예상치 못한 내비게이션 발생 가능
- **개선안**: `FALLBACK_ROUTES`에 `/search`를 추가하고 회원 컨텍스트에 맞는 복귀 경로(예: `/member/home`) 지정

#### 2. 연결 요청 시 loading이 전체 목록을 스켈레톤으로 전환
- **위치**: `useTrainerSearch.js:99` (`loading.value = true` in `requestConnection`)
- **문제**: 연결 요청 시 `loading.value = true`가 설정되어 뷰의 `v-if="loading"` 분기로 전체 트레이너 목록이 스켈레톤으로 전환됨. `requestingId`로 개별 버튼 상태를 관리하고 있지만, global loading이 이를 덮어버림
- **사용자 영향**: 특정 트레이너에게 연결 요청을 보내면 전체 목록이 사라졌다가 다시 나타남. 컨텍스트 상실
- **개선안**: `searchLoading`과 `requestLoading`을 분리. 연결 요청 시에는 목록을 유지하고 해당 카드만 상태 전환

#### 3. 트레이너 카드에 실제 프로필 사진 미표시
- **위치**: `TrainerSearchView.vue:28-29`, `useTrainerSearch.js:37`, `useTrainerSearch.js:80-86`
- **문제**: `photo_url`을 조회하지만 `trainers.value` 매핑에서 포함시키지 않음. 모든 트레이너 카드에 `person.svg` 기본 아이콘만 표시
- **사용자 영향**: 모든 트레이너가 동일한 아이콘으로 표시되어 시각적 구별 불가. 동명이인 가능성이 있는 PT 앱에서 특히 치명적
- **개선안**: `useTrainerSearch.js:80-86`에서 `photo_url: d.photo_url`을 반환값에 추가하고, 카드 이미지에 `<img :src="trainer.photo_url || personIcon" ...>` 바인딩

#### 4. 필터 버튼 기능 미구현
- **위치**: `TrainerSearchView.vue:9-11`
- **문제**: 헤더 우측에 필터 아이콘 버튼이 있지만 `@click` 핸들러가 없음
- **사용자 영향**: UI에 보이는 기능이 동작하지 않으면 앱 완성도에 대한 신뢰 하락
- **개선안**: (A) 필터 기능 구현 예정이면 `@click` 핸들러에 "준비 중" 토스트 표시, (B) 미구현 상태면 임시로 버튼 제거

#### 5. 검색 race condition
- **위치**: `TrainerSearchView.vue:79-84` (debounce), `useTrainerSearch.js:28-93` (searchTrainers)
- **문제**: debounce는 있지만 이전 검색 요청 취소나 최신 요청 보장 로직이 없음. 느린 응답이 나중에 도착하면 오래된 검색 결과가 최신 검색어의 결과를 덮을 수 있음
- **사용자 영향**: 빠르게 검색어를 변경할 때 잘못된 결과가 표시될 수 있음
- **개선안**: AbortController로 이전 요청 취소하거나, 요청 ID/타임스탬프로 최신 응답만 반영

#### 6. 에러 피드백 중복 + raw 메시지 노출
- **위치**: `TrainerSearchView.vue:55-57` (인라인 에러), `TrainerSearchView.vue:106` (`watch(error, ...)` 토스트)
- **문제**:
  - 동일한 에러가 인라인 박스와 토스트에 동시 표시됨
  - 인라인 에러 스타일(빨간 배경 + 흰색 텍스트)이 다른 화면의 에러 스타일(연한 빨간 배경 + 빨간 텍스트 + 좌측 보더)과 불일치
  - `e.message`와 Supabase 에러가 그대로 사용자에게 노출되어 사용자 친화적이지 않음
- **개선안**: 에러 노출 채널을 하나로 통일. raw backend message를 한국어 사용자 문구로 매핑하는 에러 핸들링 레이어 추가

---

### Minor (개선 권장)

#### 7. 검색 결과 "검색 결과가 없습니다"가 초기 상태와 구분 안됨
- **위치**: `TrainerSearchView.vue:23-24`
- **문제**: 초기 로드 시 트레이너가 0명인 경우와 검색 후 결과가 없는 경우가 동일한 메시지로 표시됨
- **개선안**: `searchQuery`가 비어있으면 "등록된 트레이너가 없습니다", 검색어가 있으면 "'XXX' 검색 결과가 없습니다"

#### 8. 검색 input 클리어 버튼 없음
- **위치**: `TrainerSearchView.vue:16`
- **문제**: 검색어를 입력한 후 빠르게 전체 목록으로 돌아갈 방법이 없음
- **개선안**: 검색어가 있을 때 input 우측에 X 아이콘 버튼 표시. 클릭 시 `searchQuery = ''` + `searchTrainers()`

#### 9. 연결 요청 성공 시 전체 목록 재조회
- **위치**: `TrainerSearchView.vue:94` (`await searchTrainers(searchQuery.value)`)
- **문제**: 연결 요청 성공 시 전체 목록을 새로고침하여 카드 목록이 깜빡이며 재렌더링됨
- **개선안**: 목록 재조회 대신, 해당 트레이너의 `pending` 상태를 로컬에서 낙관적 갱신. Vue의 `<TransitionGroup>`으로 상태 변경 애니메이션 추가

#### 10. 아이콘 버튼 접근성 부족
- **위치**: `TrainerSearchView.vue:5` (뒤로가기), `TrainerSearchView.vue:9` (필터)
- **문제**: 뒤로가기/필터 버튼에 `aria-label`이 없고, `alt` 문구가 영어("filter", "search")
- **개선안**: `aria-label="뒤로가기"`, `aria-label="필터"` 추가, alt 문구 한국어화

#### 11. 검색 시 로딩 전략 개선
- **위치**: `TrainerSearchView.vue:20-22`
- **문제**: 검색 시마다 전체 스켈레톤으로 전환되어 기존 목록 컨텍스트가 사라짐. debounce 중에도 아무 피드백이 없음
- **개선안**: 검색 중에는 기존 목록 위에 반투명 오버레이 또는 검색창 내부 작은 스피너로 로딩 표시. 전체 스켈레톤은 최초 로딩에만 사용

---

### Good (잘된 점)

- **스켈레톤 UI 활용**: `AppSkeleton`을 사용하여 로딩 중 카드 형태의 스켈레톤을 표시. 3개 카드를 보여주어 목록임을 직관적으로 인지 가능
- **연결 상태 3분기 처리**: "승인 대기"(pending), "연결됨"(connected), "연결 요청"(미연결) 세 가지 상태가 명확하게 시각적으로 구분됨
- **검색 debounce**: 300ms debounce로 불필요한 API 호출 방지
- **연결 요청 버튼 로딩 상태**: `requestingId`로 특정 트레이너의 버튼만 로딩 표시하는 세밀한 처리
- **pill 형태 검색 바**: 둥근 모서리의 검색 입력 필드가 모바일 친화적
- **헤더 active 피드백**: `.trainer-search__back:active`, `.trainer-search__filter:active` 스타일이 잘 적용됨

---

### 토스 앱 참고 개선안

1. **검색 결과 즉시 하이라이트**: 검색어와 일치하는 트레이너 이름 부분을 파란색으로 하이라이트
2. **카드 진입 애니메이션**: 검색 결과 카드가 `stagger-fade-in`으로 순차 등장
3. **연결 요청 확인 바텀시트**: "XXX 트레이너에게 연결을 요청하시겠습니까?" 확인. 실수 방지
4. **트레이너 카드 상세 보기**: 카드 터치 시 트레이너 상세 프로필을 볼 수 있는 상세 화면 또는 바텀시트
5. **pull-to-refresh**: 목록 최상단에서 아래로 당기면 새로고침

---

### 구조 개선 제안 (참고용)

1. **useTrainerSearch composable 내 loading 분리**: `searchLoading`과 `requestLoading`을 별도 ref로 분리하여 상태 충돌 방지
2. **트레이너 카드 컴포넌트 추출**: `trainer-card` 영역이 20줄 이상이므로 `TrainerCard.vue` 컴포넌트로 추출
3. **검색 input 컴포넌트화**: 검색 아이콘 + input + 클리어 버튼을 `AppSearchInput.vue`로 추출
4. **에러 메시지 한국어화 레이어**: composable 수준에서 Supabase 에러를 사용자 친화적 한국어 메시지로 변환하는 유틸 추가
