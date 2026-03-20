# TrainerProfileView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec, gpt-5.4)
> 원본 파일: docs/ux-review/TrainerProfileView.md
> 참조한 소스 파일: src/views/trainer/TrainerProfileView.vue, TrainerProfileView.css, src/composables/useProfile.js, src/utils/navigation.js, src/views/trainer/TrainerProfileEditView.vue
> 리뷰 라운드: 1회 (최종 판정: NEEDS_IMPROVEMENT → 피드백 반영 후 최종본)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 온보딩 완료 조건 불일치/부분 저장 우회 누락, 전문 분야 옵션 불일치를 구조 이슈가 아닌 UX 결함으로 승격, 근거 약한 항목(최대 선택 수, 이모지) 제거/완화 필요 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/TrainerProfileView.vue` + `TrainerProfileView.css`
- **역할**: 트레이너 온보딩 2단계 — 이름, 프로필 사진, 전문 분야를 입력하여 트레이너 프로필을 최초 생성하는 화면
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 2 | 에러 메시지 중복(인라인+토스트), 에러 해제 지연 |
| 터치 타겟 | 2 | 사진 편집 버튼 28px로 최소 기준 미달 |
| 스크롤/인터랙션 | 3 | 기본적 인터랙션은 동작하나 전환 애니메이션 부재 (polish 수준) |
| 시각적 일관성 | 3 | BEM 네이밍 준수, 다만 하드코딩 px 값이 다수 존재 |
| 접근성 | 2 | 아이콘 버튼 aria-label 부재, 칩 토글 aria-pressed 부재 |
| 정보 밀도 | 5 | 온보딩 화면에 적절한 정보량 |
| 전체 사용성 | 2 | 사진 업로드 미구현 + 온보딩 완료 조건 불일치가 치명적 |

---

### Critical (즉시 수정 필요)

#### 1. 사진 업로드 기능 미연결
- **위치**: `TrainerProfileView.vue:21-29`
- **문제**: 프로필 사진 영역과 편집 버튼이 UI에 렌더링되지만, `@click` 이벤트 핸들러가 없음. `<input type="file">`도 존재하지 않음. 사용자가 "사진 등록"을 보고 터치해도 아무 반응이 없음
- **사용자 영향**: 온보딩 화면에서 사진 등록이 안내되지만 실제 업로드 불가. 사용자가 기능 오류로 인식
- **개선안**: `TrainerProfileEditView.vue`에 이미 구현된 `triggerFileInput` + `handleFileSelect` 패턴을 동일하게 적용. 사진 영역 전체를 터치 타겟으로 사용하고, 미리보기와 업로드 실패 롤백을 함께 구현

#### 2. 온보딩 완료 조건 불일치
- **위치**: `src/utils/navigation.js` (resolvePostAuthRedirect), `src/stores/auth.js` (fetchProfile)
- **문제**: 온보딩 완료 판단이 `!auth.profile?.name`만 검사함. 전문 분야나 사진 없이도 완료로 간주될 수 있음. 또한 UI 문구(`TrainerProfileView.vue:17-19`)는 사진 입력을 요구하지만 저장 로직은 사진을 전혀 검증하지 않음
- **사용자 영향**: 불완전한 프로필로 온보딩이 완료되어, 회원에게 정보가 부족한 트레이너 프로필이 노출됨
- **개선안**: 역할별 `isProfileComplete()` 함수를 공통화하여 `name`, `specialties` 요구사항을 함께 검사. 사진이 선택사항이면 UI 문구를 수정하고, 필수면 검증 로직에 추가

#### 3. 부분 저장 후 온보딩 우회 가능성
- **위치**: `useProfile.js:66-100` (`saveTrainerProfile`)
- **문제**: 저장이 두 단계(`profiles.name` → `trainer_profiles.specialties`)로 진행됨. 첫 번째만 성공해도 `name`이 저장되어 다음 진입 시 온보딩이 건너뛰어질 수 있음
- **개선안**: Supabase RPC/트랜잭션으로 원자화하거나, 최소한 완료 판정을 `trainer_profiles`까지 보도록 변경

---

### Major (높은 우선순위)

#### 4. 사진 편집 버튼 터치 타겟 28px
- **위치**: `TrainerProfileView.css:92-106` (`.trainer-profile__photo-edit`)
- **문제**: 편집 버튼 크기가 `width: 28px; height: 28px`로 모바일 최소 터치 타겟(44px)에 크게 미달
- **개선안**: 사진 영역 전체에 `@click` 이벤트를 바인딩하여 (EditView 패턴처럼) 실질적 터치 타겟을 확보. 편집 아이콘 버튼에는 `padding`으로 터치 영역 확장

#### 5. 에러 메시지 중복 표시
- **위치**: `TrainerProfileView.vue:51-53` (인라인 에러) + `TrainerProfileView.vue:166` (토스트 watch)
- **문제**: `profileError` 변경 시 `showToast(e, 'error')`로 토스트를 띄우는 동시에, `errorMsg.value = profileError.value`로 인라인 에러도 표시. 동일한 에러가 두 곳에 동시 노출
- **개선안**: 저장 실패 에러는 토스트만으로 처리. 인라인 에러는 폼 필드별 검증(이름 미입력, 전문 분야 미선택)에만 사용

#### 6. 전문 분야 옵션 화면 간 불일치
- **위치**: `TrainerProfileView.vue:90-111` (4개: 재활/교정, 근력 증가, 다이어트/식단, 스포츠 퍼포먼스) vs `TrainerProfileEditView.vue:120-127` (6개: 재활, 근력, 다이어트, 스포츠, 코어, 유연성)
- **문제**: 온보딩에서 선택한 전문 분야가 수정 화면에서 다른 라벨로 표시됨. 또한 `useTrainerSearch.js`의 `SPECIALTY_LABELS`에는 4개만 있어 `core`, `flexibility`는 raw ID로 표시될 수 있음
- **개선안**: `src/constants/specialties.js`로 단일 소스 추출. 온보딩/수정/읽기/검색 화면 모두 동일 목록 사용

#### 7. 실시간 에러 해제 부재
- **위치**: `TrainerProfileView.vue:115-122` (`toggleSpecialty`), `TrainerProfileView.vue:124-130` (`validateName`)
- **문제**: 전문 분야를 선택해도 `specialtyError`가 즉시 사라지지 않음 (다음 저장 시도 때만 재검증). 이름 필드도 blur/save 때만 재검증
- **개선안**: `toggleSpecialty()` 내에서 선택 시 `specialtyError = ''` 즉시 해제. 이름 입력 시 `@input`에서도 에러가 있으면 즉시 해제

#### 8. 접근성 개선 필요
- **위치**: `TrainerProfileView.vue:5` (뒤로가기 버튼), `TrainerProfileView.vue:26` (편집 버튼), `TrainerProfileView.vue:38-47` (전문 분야 칩)
- **문제**: 아이콘 전용 버튼에 `aria-label` 없음. 전문 분야 칩에 `aria-pressed` 없어 스크린 리더에서 선택 상태 인지 불가
- **개선안**: 뒤로가기 버튼에 `aria-label="뒤로가기"`, 사진 편집 버튼에 `aria-label="프로필 사진 등록"`, 칩 버튼에 `:aria-pressed="selectedSpecialties.includes(spec.id)"` 추가

---

### Minor (개선 권장)

#### 9. 뒤로가기 시 입력 데이터 유실 경고 없음
- **위치**: `TrainerProfileView.vue:5` (`@click="safeBack(route.path)"`)
- **문제**: 이름이나 전문 분야를 입력한 상태에서 뒤로가기를 누르면 확인 없이 바로 이동
- **개선안**: `isDirty` computed + `onBeforeRouteLeave` 가드 + 뒤로가기 버튼 클릭 시 확인 다이얼로그

#### 10. 키보드 올라올 때 하단 고정 버튼 가림 가능성
- **위치**: `TrainerProfileView.css:178-188` (`.trainer-profile__footer` — `position: fixed; bottom: 0`)
- **문제**: 모바일에서 이름 입력 필드에 포커스하면 가상 키보드가 올라오는데, fixed footer가 가려지거나 콘텐츠를 가릴 수 있음. 현상 확인이 필요한 항목
- **개선안**: `env(safe-area-inset-bottom)` padding 추가, 또는 `visualViewport` API 활용

#### 11. 하드코딩된 px 값
- **위치**: `TrainerProfileView.css` 전반 (예: `:12`, `:69`, `:96`)
- **문제**: 디자인 토큰이 존재하는 값에도 raw px 하드코딩이 다수 존재
- **개선안**: `--spacing-*`, `--side-margin` 등 기존 디자인 토큰으로 대체

---

### Good (잘된 점)

- **BEM 네이밍**: `.trainer-profile__photo-edit` 등 BEM 컨벤션을 충실히 따르고 있어 CSS 구조가 명확
- **폼 검증 구조**: `validateName()`, `validateSpecialties()` 분리와 에러 메시지의 `form-error-text` 클래스 재사용이 잘 됨
- **ProgressBar 활용**: 온보딩 진행률을 명확히 보여줌
- **뒤로가기 버튼 active 피드백**: `.trainer-profile__back:active` 스타일이 잘 적용됨

---

### 토스 앱 참고 개선안

1. **입력 필드 포커스 애니메이션**: 토스의 floating label 패턴 적용 고려
2. **전문 분야 선택 마이크로인터랙션**: `.spec-chip:active { transform: scale(0.96) }` 추가
3. **완료 버튼 진행 상태**: "저장 중..." 텍스트 대신 로딩 스피너 아이콘으로 대체
4. **온보딩 완료 후 축하 화면**: `router.replace('/trainer/home')` 전에 짧은 완료 애니메이션 삽입

---

### 구조 개선 제안 (참고용)

1. **전문 분야 데이터 중앙화**: `src/constants/specialties.js`로 추출하여 온보딩/수정/읽기/검색 모든 화면에서 단일 소스 관리
2. **사진 업로드 로직 재사용**: EditView에 구현된 사진 업로드 패턴을 composable(`useAvatarUpload`)로 추출
3. **온보딩 완료 조건 중앙화**: `isProfileComplete()` 유틸을 만들어 라우터 가드와 저장 로직에서 동일 기준 사용
