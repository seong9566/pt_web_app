# TodayWorkoutView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/TodayWorkoutView.md
> 참조한 소스 파일: src/views/trainer/TodayWorkoutView.vue, src/views/trainer/TodayWorkoutView.css, src/composables/useConfirm.js, src/components/AppConfirmDialog.vue
> 리뷰 라운드: 1회 (최종 판정: NEEDS_IMPROVEMENT 반영 후 최종본)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | window.confirm 대체 시 이미 존재하는 useConfirm.js/AppConfirmDialog.vue 활용 권장, formatChipDate 데드코드 진단 정확성 확인 필요(formatChipLabel이 실제 사용됨), 예약 없음 시 데드엔드 이슈의 severity 재조정, 저장 후 800ms 자동 이동이 앱 공통 패턴임을 명시 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/TodayWorkoutView.vue` + `TodayWorkoutView.css`
- **역할**: 트레이너가 회원의 운동을 배정하는 핵심 작업 화면. 예약 선택, 운동 항목 입력(세트/횟수 스테퍼), 이전 배정 이력 복사, 덮어쓰기 확인 등 복합적 기능 제공
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 4 | AppSkeleton 활용 양호, 에러는 토스트로 처리 |
| 터치 타겟 | 3 | 뒤로가기 40px, 운동 삭제 28px, 이력 토글 28px 미달 |
| 스크롤/인터랙션 | 4 | sticky 저장 버튼, 바텀시트 확인, 이탈 방지 가드 우수 |
| 시각적 일관성 | 4 | 디자인 토큰 대부분 준수, BEM 일관성 양호 |
| 접근성 | 3 | 스테퍼 버튼에 aria-label 없음, 삭제 버튼에 텍스트 문자(특수문자) 사용 |
| 정보 밀도 | 3 | 한 화면에 프로필 + 예약칩 + 편집폼 + 이력이 모두 존재하여 스크롤 많음 |
| 전체 사용성 | 4 | 복잡한 기능 대비 잘 구조화됨, 세부 터치 인터랙션 개선 필요 |

---

### Critical (즉시 수정 필요)

#### 1. `window.confirm` 사용 — 모바일 PWA에서 부적절한 네이티브 다이얼로그
- **위치**: `TodayWorkoutView.vue:408` (예약 전환 시), `:490` (이력 복사 시), `:568` (이탈 방지 가드)
- **문제**: `window.confirm()`은 모바일 브라우저에서 UX가 매우 열악함. 스타일링 불가, 브라우저마다 다른 모양, PWA에서 앱 느낌을 깨뜨림
- **개선안**: 이미 프로젝트에 `useConfirm.js` + `AppConfirmDialog.vue` (App.vue에 마운트됨)가 존재하며, `MemberPaymentView`, `SettingsView` 등에서 사용 중. `window.confirm` 3곳을 모두 기존 `useConfirm` 시스템으로 교체해야 함. 덮어쓰기 확인에는 이미 `AppBottomSheet`를 사용하고 있으므로, 동일한 바텀시트 패턴 또는 `useConfirm`을 일관되게 적용

#### 2. 예약이 없을 때 운동 배정 불가능한 데드엔드 상태
- **위치**: `TodayWorkoutView.vue:57` (예약 날짜 섹션)
- **문제**: `reservationDates.length === 0`이면 "예약된 PT" 섹션 자체가 렌더되지 않음. 하지만 운동 내용 폼은 여전히 보이고, `selectedReservationId`가 null인 상태에서 저장을 시도하면 실패할 가능성이 높음
- **개선안**: 예약이 없을 때 빈 상태 메시지와 예약 화면으로의 이동 버튼 제공. 또는 운동 폼 자체를 숨기고 안내 메시지 표시

---

### Major (높은 우선순위)

#### 3. 운동 삭제 버튼(28px) 및 이력 토글 버튼(28px) — 터치 타겟 크게 미달
- **위치**: `TodayWorkoutView.css:343-344` (`.today-workout__exercise-remove { width: 28px; height: 28px }`)
- **위치**: `TodayWorkoutView.css:601-602` (`.today-workout__history-toggle { width: 28px; height: 28px }`)
- **사용자 영향**: 운동 삭제와 이력 펼치기 버튼을 정확히 누르기 매우 어려움
- **개선안**: 최소 `36px x 36px`로 확대. 삭제 버튼은 특히 실수로 눌리면 안 되므로 적절한 크기가 중요

#### 4. 뒤로가기 버튼 터치 타겟 40px
- **위치**: `TodayWorkoutView.css:31` (`.today-workout__back { width: 40px; height: 40px }`)
- **개선안**: `44px`로 변경

#### 5. 이력에서 "전체 복사" 시 시각적 피드백 없음
- **위치**: `TodayWorkoutView.vue:487-501` (`copyFromHistory`)
- **문제**: `window.confirm` 사용 문제(Critical #1과 동일)에 더해, 복사 성공에 대한 시각적 피드백이 없음. 사용자가 복사가 되었는지 스크롤을 올려서 확인해야 함
- **개선안**: 복사 후 폼 영역으로 `scrollIntoView` + 토스트 메시지 "이전 배정이 복사되었습니다"

#### 6. 스테퍼 버튼에 접근성 라벨 없음
- **위치**: `TodayWorkoutView.vue:141-152`, `:157-169`
- **문제**: +/- 버튼에 `aria-label`이 없어 스크린 리더 사용자가 기능을 파악할 수 없음
- **개선안**: `aria-label="세트 수 감소"`, `aria-label="세트 수 증가"` 등 추가

#### 7. 운동 삭제 버튼이 텍스트 특수문자(곱하기 기호) 사용
- **위치**: `TodayWorkoutView.vue:126` (`✕` 문자)
- **문제**: 디바이스/폰트에 따라 다르게 렌더링될 수 있음
- **개선안**: SVG 아이콘으로 교체하여 일관된 렌더링 보장 + `aria-label="운동 삭제"` 추가

#### 8. 이력에서 개별 운동 추가 버튼(32px) 크기 부족
- **위치**: `TodayWorkoutView.css:664` (`.today-workout__history-exercise-add { width: 32px; height: 32px }`)
- **개선안**: `36px` 이상으로 확대

#### 9. [신규] 저장 후 800ms 자동 뒤로가기 — 앱 전체 공통 안티패턴
- **위치**: `TodayWorkoutView.vue:472-477` (`executeSave` 내부)
- **문제**: 저장 성공 후 800ms 뒤 자동 뒤로가기하는 패턴이 `MemoWriteView`, `ManualRegisterView`, `PaymentWriteView`, `TrainerProfileEditView`, `WorkTimeSettingView` 등 앱 전체에 반복됨. 사용자가 저장 결과를 확인할 통제권을 잃음. 다만 이 화면의 경우 `justSaved` 플래그로 이탈 가드를 우회하는 처리가 있어 이중 확인 문제는 없음
- **개선안**: 앱 전체 정책으로 저장 후 자동 이동 방식을 통일. 토스 앱처럼 저장 버튼 내부 체크마크 애니메이션 후 이동하거나, 사용자가 직접 뒤로가기하도록 변경

---

### Minor (개선 권장)

#### 10. 카테고리 칩 높이 36px — 최소 기준에 근접하지만 약간 부족
- **위치**: `TodayWorkoutView.css:293` (`.today-workout__category-chip { height: 36px }`)
- **개선안**: `40px`으로 변경하면 더 편안한 터치 경험

#### 11. 날짜 칩 높이 40px는 양호하지만, 칩 간 간격 8px가 좁음
- **위치**: `TodayWorkoutView.css:148-149`
- **문제**: 칩이 많을 때 의도하지 않은 인접 칩 탭 가능
- **개선안**: `gap: 10px`로 약간 확대

#### 12. 화면 내 정보 밀도가 높아 스크롤이 과도함
- **문제**: 프로필 카드 + 예약 칩 + 기존 배정 카드 + 운동 편집 폼 + 이력 목록이 모두 한 화면
- **개선안**: sticky 저장 버튼이 이미 적용되어 있어 기본적으로는 양호. 이력 섹션을 접힌 상태를 기본값으로 하거나 별도 탭으로 분리 고려

#### 13. `hover` 스타일이 모바일에서 불필요
- **위치**: `TodayWorkoutView.css:358-360` (`.today-workout__exercise-remove:hover`), `:478-480`
- **문제**: 모바일 전용 PWA이므로 hover 상태가 의미 없음. 터치 후 "sticky hover" 문제 발생 가능
- **개선안**: `@media (hover: hover)` 미디어 쿼리로 감싸거나 제거

#### 14. `formatChipDate` 함수가 사용되지 않음
- **위치**: `TodayWorkoutView.vue:544-550`
- **문제**: 정의되어 있지만 템플릿에서 호출되지 않는 데드코드. 실제로 사용되는 것은 `formatChipLabel` 함수(552행)
- **개선안**: `formatChipDate` 제거

---

### Good (잘된 점)
- `onBeforeRouteLeave` + `isDirty` computed를 활용한 미저장 이탈 방지가 매우 잘 구현됨
- `justSaved` 플래그로 저장 직후 이탈 가드를 우회하는 세심한 처리
- View-first 패턴 (기존 배정이 있으면 읽기 모드로 먼저 표시)이 불필요한 편집 실수를 방지
- 스테퍼 UI가 모바일에 적합 — 키보드 대신 +/- 버튼으로 값 조절
- 덮어쓰기 시 `AppBottomSheet`를 활용한 확인 다이얼로그가 토스 수준의 UX
- `AppSkeleton`을 활용한 로딩 상태 처리가 일관적
- sticky 저장 버튼 + box-shadow로 하단 고정 CTA가 잘 구현됨
- 배정 이력에서 전체 복사 / 개별 운동 추가 기능이 실용적

---

### 토스 앱 참고 개선안
1. **기존 확인 시스템 활용**: `window.confirm` 3곳을 기존 `useConfirm.js` / `AppConfirmDialog.vue`로 교체. 또는 `AppBottomSheet` 기반 확인 UI로 통일
2. **운동 항목 드래그 정렬**: 운동 순서를 드래그로 변경할 수 있으면 편의성 향상 (장기 개선)
3. **이력 복사 후 하이라이트**: 이력에서 복사 시 복사된 항목에 잠깐 하이라이트 애니메이션 적용
4. **저장 성공 모션**: 저장 버튼 클릭 -> 버튼 내부 체크마크 애니메이션 -> 자동 뒤로가기

---

### 구조 개선 제안 (참고용)
1. **확인 UX 표준화**: 3곳의 `window.confirm`을 기존 `useConfirm` 시스템으로 교체 (새 컴포넌트 생성 불필요)
2. **운동 편집 폼을 서브 컴포넌트로 분리**: 현재 템플릿이 300행으로 복잡. 운동 항목 편집 부분을 `WorkoutExerciseForm.vue` 등으로 분리하면 가독성 향상
3. **이력 섹션을 별도 컴포넌트로 분리**: `WorkoutHistoryList.vue`로 분리하면 재사용 가능
4. **loading 상태 분리**: 현재 composable에서 조회/저장이 같은 `loading`을 공유. `loading`(조회)과 `isSaving`(저장)을 분리한 것은 이 화면에서 잘 한 점이나, composable 레벨에서 통일이 필요
