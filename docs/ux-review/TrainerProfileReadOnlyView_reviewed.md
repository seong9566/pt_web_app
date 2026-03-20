# TrainerProfileReadOnlyView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec, gpt-5.4)
> 원본 파일: docs/ux-review/TrainerProfileReadOnlyView.md
> 참조한 소스 파일: src/views/trainer/TrainerProfileReadOnlyView.vue, TrainerProfileReadOnlyView.css, src/composables/useMembers.js, src/stores/members.js, src/router/index.js, src/App.vue
> 리뷰 라운드: 1회 (최종 판정: NEEDS_IMPROVEMENT → 피드백 반영 후 최종본)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | Major 3 "스타일 불일치"는 UX 결함이 아닌 구현 이슈로 완화, 회원 수 로딩 분석 보강(store가 에러를 삼킴), 헤더 버튼 터치 영역 40px < 44px 지적 누락, specialtyOptions 중앙화 범위 주의 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/TrainerProfileReadOnlyView.vue` + `TrainerProfileReadOnlyView.css`
- **역할**: 트레이너가 자신의 프로필(이름, 사진, 전문 분야, 소개글, 연결 회원 수)을 조회하는 읽기 전용 화면
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 2 | 회원 수 로딩/에러/실제 0명이 구분되지 않음 |
| 터치 타겟 | 3 | 편집/뒤로가기 버튼 40px — 44px 권장 기준 미달 |
| 스크롤/인터랙션 | 3 | 정적 화면으로 특별한 인터랙션 불필요, 풀투리프레시 없음 |
| 시각적 일관성 | 4 | 디자인 토큰 준수, 빈 상태 메시지 존재 |
| 접근성 | 3 | 편집/뒤로가기 버튼 모두 aria-label 없음 |
| 정보 밀도 | 5 | 깔끔한 정보 배치 |
| 전체 사용성 | 3 | 읽기 전용 화면으로 큰 문제는 없으나 로딩/에러 처리가 약함 |

---

### Critical (즉시 수정 필요)

(해당 없음 — 읽기 전용 화면으로 데이터 손실이나 핵심 기능 차단 이슈 없음)

---

### Major (높은 우선순위)

#### 1. 회원 목록 로딩/에러 상태 미처리
- **위치**: `TrainerProfileReadOnlyView.vue:99-101` (`onMounted`), `TrainerProfileReadOnlyView.vue:36`
- **문제**:
  - `fetchMembers()`를 호출하지만 `loading`과 `error`를 디스트럭처링하지 않고 템플릿에서 사용하지 않음
  - 회원 수가 로딩 중 `0`으로 표시되다가 데이터 도착 후 변경됨 (레이아웃 시프트)
  - 더 심각한 문제: `useMembersStore.loadMembers()`가 내부에서 에러를 삼키는 경우가 있어, composable의 `error` ref 자체가 잘 채워지지 않음
- **사용자 영향**: "연결 회원 0명"이 순간적으로 표시된 후 실제 숫자로 변경. 조회 실패 시에도 "0명"으로 표시되어 실제 0명과 구분 불가
- **개선안**:
  - `loading` 상태에서 회원 수를 스켈레톤("--명")으로 표시
  - `error` 발생 시 "회원 정보를 불러올 수 없습니다" 안내
  - store의 에러 전파 경로도 함께 점검

#### 2. 아이콘 버튼 접근성 부족
- **위치**: `TrainerProfileReadOnlyView.vue:7` (뒤로가기), `TrainerProfileReadOnlyView.vue:13-18` (편집)
- **문제**: 뒤로가기 버튼과 편집 버튼 모두 SVG 아이콘만으로 구성되어 있고, `aria-label`이 없음. 스크린 리더 사용자가 버튼의 용도를 알 수 없음
- **개선안**: `<button ... aria-label="뒤로가기">`, `<button ... aria-label="프로필 수정">` 추가

#### 3. 헤더 버튼 터치 영역 40px
- **위치**: `TrainerProfileReadOnlyView.css:17-28` (`.trainer-profile-ro__back` 40x40), `TrainerProfileReadOnlyView.css:36-47` (`.trainer-profile-ro__edit-btn` 40x40)
- **문제**: 모바일 권장 터치 타겟 44px보다 4px 작음. 토스 수준 UX 기준에서는 active 피드백 부재보다 터치 영역이 더 먼저 개선해야 할 항목
- **개선안**: `min-width: 44px; min-height: 44px`로 확장. 또는 padding 확대

---

### Minor (개선 권장)

#### 4. 뒤로가기/편집 버튼에 active 피드백 없음
- **위치**: `TrainerProfileReadOnlyView.css:17-28`, `TrainerProfileReadOnlyView.css:36-47`
- **문제**: 다른 화면(TrainerProfileView, TrainerSearchView)의 뒤로가기 버튼에는 `:active` 시 `background-color: var(--color-gray-100)` 피드백이 있지만, 이 화면에서는 없음
- **개선안**: `.trainer-profile-ro__back:active, .trainer-profile-ro__edit-btn:active { background-color: var(--color-gray-100); border-radius: 50%; }` 추가

#### 5. 빈 소개글/전문 분야에서 편집 유도 CTA 부재
- **위치**: `TrainerProfileReadOnlyView.vue:52`, `TrainerProfileReadOnlyView.vue:59`
- **문제**: "전문 분야를 아직 설정하지 않았습니다" 텍스트만 표시. 바로 편집할 수 있는 링크/버튼이 없음. 상단 편집 버튼은 있지만, 빈 상태 영역에서 직접 행동을 유도하면 전환율이 높아짐
- **개선안**: 빈 상태 텍스트 옆에 "설정하기" / "작성하기" 링크 추가

#### 6. 프로필 사진 인라인 스타일
- **위치**: `TrainerProfileReadOnlyView.vue:27-31`
- **문제**: 사진 유무에 따른 스타일이 삼항연산자 인라인 스타일로 구현됨. CSS 클래스로 관리하는 것이 유지보수에 유리 (구현 일관성 이슈)
- **개선안**: `.trainer-profile-ro__photo--has-image`와 `.trainer-profile-ro__photo--placeholder` CSS 클래스로 분리

#### 7. 하단 여백이 고정 값
- **위치**: `TrainerProfileReadOnlyView.vue:62` (`<div style="height: 40px" />`)
- **문제**: 인라인 스타일로 40px 하드코딩. 이 화면은 `hideNav: true`라서 바텀 내비가 없으므로 기능적으로는 문제없으나, 디자인 토큰 사용이 일관적
- **개선안**: CSS 클래스 또는 `style="height: var(--spacing-section);"` 사용

---

### Good (잘된 점)

- **빈 상태 처리**: 전문 분야와 소개글 각각에 빈 상태 메시지가 구현되어 있음
- **프로필 카드 디자인**: 사진 + 이름 + 회원 수를 하나의 카드로 묶어 시각적 위계가 명확
- **편집 진입점 명확**: 헤더 우측에 편집 아이콘이 자연스럽게 배치됨
- **white-space: pre-wrap**: 소개글에서 줄바꿈이 보존되어 작성 의도대로 표시됨

---

### 토스 앱 참고 개선안

1. **프로필 완성도 안내**: "프로필 완성도 80%" 같은 진행률 바를 표시하여 빈 항목 작성을 유도
2. **빈 상태 일러스트**: 단순 텍스트 대신 작은 일러스트와 함께 CTA 버튼 표시
3. **풀투리프레시**: 프로필 데이터를 최신 상태로 갱신할 수 있는 풀투리프레시 지원
4. **스크롤 시 헤더 축소 애니메이션**: 콘텐츠가 많아질 경우를 대비해 compact header 패턴

---

### 구조 개선 제안 (참고용)

1. **인라인 스타일 제거**: 사진 `<img>` 태그의 삼항연산자 인라인 스타일을 CSS 클래스로 전환. `TrainerProfileEditView.vue`에도 동일 패턴이 있으므로 공통 처리 가능
2. **specialtyOptions 중앙화**: 수정 화면과 읽기 화면은 동일 배열(6개)이므로 공유 가치가 높음. 단, 온보딩 화면은 옵션 수/라벨이 달라 단순 병합이 아닌 정책 정리가 선행되어야 함
