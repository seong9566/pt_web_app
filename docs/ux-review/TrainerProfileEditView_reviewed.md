# TrainerProfileEditView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec, gpt-5.4)
> 원본 파일: docs/ux-review/TrainerProfileEditView.md
> 참조한 소스 파일: src/views/trainer/TrainerProfileEditView.vue, TrainerProfileEditView.css, src/composables/useProfile.js, src/utils/validators.js, src/views/trainer/TrainerProfileView.vue, src/views/trainer/TrainerProfileReadOnlyView.vue, src/composables/useTrainerSearch.js
> 리뷰 라운드: 1회 (최종 판정: NEEDS_IMPROVEMENT → 피드백 반영 후 최종본)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | Critical 1번 "피드백 전무"는 과장(저장 버튼에 uploading 바인딩 있음), Major 6번 터치 타겟은 사진 래퍼에 click 있어 부정확, 사진 즉시 저장 vs 폼 저장 혼합 모델/전역 프로필 미동기화/전문 분야 필수 정책 불일치/이미지 검증 부재 누락 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/TrainerProfileEditView.vue` + `TrainerProfileEditView.css`
- **역할**: 트레이너가 자신의 프로필(이름, 전화번호, 전문 분야, 소개글, 사진)을 수정하는 화면
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 2 | 사진 영역 로딩 표시 없음, 업로드/저장 상태 혼재 |
| 터치 타겟 | 4 | 사진 래퍼 전체에 click 있어 실질적 터치 영역 충분, 시각적 affordance는 작음 |
| 스크롤/인터랙션 | 3 | 기본 동작은 되나 저장 후 800ms 지연이 어색 |
| 시각적 일관성 | 4 | 디자인 토큰 잘 활용, 섹션 구분 명확 |
| 접근성 | 3 | textarea에 라벨 연결 없음, 전문 분야 칩에 aria 부재 |
| 정보 밀도 | 5 | 섹션별로 잘 분리되어 있어 적절 |
| 전체 사용성 | 3 | 핵심 편집 기능은 동작하나 저장 모델 혼합과 안전장치 부족 |

---

### Critical (즉시 수정 필요)

#### 1. 사진 업로드 실패 시 미리보기가 남아있는 문제
- **위치**: `TrainerProfileEditView.vue:147-155` (`handleFileSelect`)
- **문제**: `avatarPreview.value = URL.createObjectURL(file)` 후 `uploadAvatar`가 실패하면 서버에 반영되지 않았지만 화면에는 미리보기 이미지가 그대로 표시됨. `updateProfilePhoto()` 실패 시에도 동일
- **사용자 영향**: 사진이 저장된 것으로 착각. 다른 화면으로 이동 후 돌아오면 이전 사진이 다시 표시되어 혼란
- **개선안**: 이전 이미지 URL을 보존하고, 업로드+DB 반영 둘 다 성공했을 때만 미리보기를 확정. 실패 시 롤백 + 토스트 표시

#### 2. 사진 즉시 저장 vs 폼 저장 혼합 모델
- **위치**: `TrainerProfileEditView.vue:147-155` (사진 즉시 업로드) vs `TrainerProfileEditView.vue:179-196` (저장 버튼으로 나머지 필드 반영)
- **문제**: 사진은 선택 즉시 서버에 반영되고, 이름/전화/소개/전문 분야는 저장 버튼으로 반영됨. 사용자는 "저장 버튼을 눌러야 반영된다"고 기대하지만, 사진만 이미 저장된 상태
- **사용자 영향**: 저장 없이 뒤로가기 하면 사진만 바뀌고 나머지는 안 바뀌는 비직관적 결과
- **개선안**: (A) 전부 명시적 저장으로 통일 — 사진도 임시 미리보기만 보여주다 저장 시 일괄 업로드, 또는 (B) 전부 자동 저장으로 통일

---

### Major (높은 우선순위)

#### 3. 사진 영역 업로드 중 피드백 부족
- **위치**: `TrainerProfileEditView.vue:147-155`, `useProfile.js:21-48`
- **문제**: `uploading` ref가 존재하고 저장 버튼에 바인딩되어 "저장 중..."으로 표시되지만, 사진 영역 자체에는 로딩 표시가 없음. 업로드와 저장이 같은 `uploading` 상태를 공유하여 의미가 혼재됨
- **개선안**: `isAvatarUploading`과 `isSaving`를 분리. 사진 영역 위에 `v-if="isAvatarUploading"` 반투명 오버레이 + 스피너 표시. 업로드 중 재터치 방지

#### 4. 저장 후 뒤로가기의 어색한 지연
- **위치**: `TrainerProfileEditView.vue:195` (`setTimeout(() => safeBack(route.path), 800)`)
- **문제**: 저장 성공 시 "저장되었습니다" 토스트를 보여준 후 800ms 뒤 자동으로 뒤로 이동. 이 800ms 동안 사용자가 추가 수정 시도 가능. AppToast는 Teleport 기반이라 라우트 이동 후에도 표시됨
- **개선안**: 저장 성공 시 즉시 `safeBack()` 호출. 토스트는 이전 화면에서 자연스럽게 표시됨

#### 5. 변경 사항 없이 나갈 때 경고 없음
- **위치**: `TrainerProfileEditView.vue:5` (`@click="safeBack(route.path)"`)
- **문제**: 이름이나 소개글을 수정한 후 뒤로가기를 누르면 확인 없이 변경 사항이 소실됨. 다른 화면(TodayWorkoutView)에는 `isDirty` + `onBeforeRouteLeave` 패턴이 이미 구현되어 있음
- **개선안**: 초기 스냅샷 대비 변경 감지 + 확인 다이얼로그. 단, 사진 저장 모델 정리가 선행되어야 함

#### 6. 전문 분야 목록 및 필수 정책 불일치
- **위치**: `TrainerProfileEditView.vue:120-127` (6개, 짧은 라벨) vs `TrainerProfileView.vue:90-111` (4개, 긴 라벨)
- **문제**:
  - 옵션 수와 라벨이 화면마다 다름 (온보딩 4개 vs 수정/읽기 6개)
  - 온보딩은 최소 1개 선택 강제, 수정 화면은 0개도 허용
  - `useTrainerSearch.js`의 `SPECIALTY_LABELS`에는 4개만 있어 `core`, `flexibility`는 raw ID로 표시
- **개선안**: `src/constants/specialties.js`로 통합. 비즈니스 정책(최소 선택 수)도 하나로 통일

#### 7. 사진 업로드 성공 후 전역 프로필 미동기화
- **위치**: `useProfile.js:52-63` (`updateProfilePhoto`)
- **문제**: `updateProfilePhoto()`는 DB만 업데이트하고 `auth.fetchProfile()`을 호출하지 않음. 홈/설정 화면은 `auth.profile.photo_url`을 사용하므로 수정 전 사진이 계속 표시됨
- **개선안**: 사진 저장 성공 시 `auth.profile.photo_url`을 즉시 갱신하거나 `fetchProfile()` 호출

---

### Minor (개선 권장)

#### 8. textarea에 글자 수 카운터 없음
- **위치**: `TrainerProfileEditView.vue:76-81`
- **문제**: 소개글 textarea에 최대 글자 수 제한이 없고 카운터도 없음
- **개선안**: `maxlength` 속성 추가 및 우측 하단에 "0/300" 카운터 표시

#### 9. 전화번호 포맷팅 시 커서 점프 가능성
- **위치**: `TrainerProfileEditView.vue:49` (`@input="form.phone = formatPhone(form.phone)"`)
- **문제**: 매 입력마다 `formatPhone`을 호출하여 값을 재작성. 커서가 항상 끝으로 이동할 수 있어 중간 수정이 어려움
- **개선안**: 포맷팅은 blur 시점에만 적용하거나, 중간 단계도 자연스럽게 포맷하는 로직 구현

#### 10. ObjectURL 메모리 해제 누락
- **위치**: `TrainerProfileEditView.vue:150` (`URL.createObjectURL(file)`)
- **문제**: 생성된 Object URL이 `URL.revokeObjectURL()`로 해제되지 않음
- **개선안**: 새 파일 선택 시 이전 `avatarPreview`를 revoke하고, `onUnmounted`에서도 정리

#### 11. 키보드 올라올 때 하단 고정 버튼 문제
- **위치**: `TrainerProfileEditView.css:187-197` (`.trainer-profile-edit__footer` — `position: fixed; bottom: 0`)
- **문제**: safe-area/keyboard 대응이 없음. 다른 컴포넌트(AppToast)는 `env(safe-area-inset-bottom)`을 이미 사용 중
- **개선안**: safe-area padding 추가, content bottom padding 확보

#### 12. 이미지 파일 검증 부재
- **위치**: `TrainerProfileEditView.vue:32` (`accept="image/*"`)
- **문제**: 파일 크기, 확장자, 비율, 크롭 UX가 없음. 대용량 사진 업로드 시 느린 네트워크에서 문제 발생 가능
- **개선안**: 최소한 용량 제한(5MB 등) + 정사각 크롭 UI 추가

---

### Good (잘된 점)

- **섹션 구분이 명확**: "기본 정보", "전문 분야", "소개글"로 논리적 그룹핑이 잘 되어 있음
- **전화번호 실시간 포맷팅**: `formatPhone` + `inputmode="numeric"`으로 모바일 숫자 키패드 호출 및 자동 하이픈 삽입
- **사진 미리보기 즉시 반영**: `URL.createObjectURL`로 업로드 전에도 선택한 이미지를 바로 보여줌
- **헤더 균형 레이아웃**: 뒤로가기(40px) + 타이틀 + 빈 공간(40px)으로 타이틀 중앙 정렬이 잘 구현됨
- **사진 래퍼 전체 터치 영역**: 사진 영역 전체에 `@click="triggerFileInput"`이 바인딩되어 실질적 터치 타겟이 충분함

---

### 토스 앱 참고 개선안

1. **저장 버튼 활성화 조건**: 초기값과 현재값을 비교하여 `isDirty` computed로 변경이 있을 때만 저장 버튼 활성화
2. **사진 업로드 프로그레스**: 원형 프로그레스 바를 사진 위에 오버레이
3. **칩 선택 햅틱 피드백**: `navigator.vibrate(10)` — 안드로이드에서 칩 선택 시 짧은 진동
4. **섹션별 fade-in 애니메이션**: `stagger-fade-in` 클래스 활용 (global.css에 이미 정의됨)

---

### 구조 개선 제안 (참고용)

1. **폼 상태 관리 composable 추출**: `form`, `nameError`, `phoneError`, `validateName`, `validatePhone` 등을 `useTrainerProfileForm()` composable로 추출
2. **사진 업로드 컴포넌트화**: 사진 + 카메라 버튼 + file input + 미리보기 + 업로드 로직을 `AppAvatarUploader.vue`로 추출하여 회원 프로필 편집에서도 재사용 (동일 패턴이 MemberProfileEditView에도 복제되어 있음)
3. **저장 모델 통일**: 사진과 폼 필드의 저장 타이밍을 통일하여 일관된 사용자 경험 제공
