# MemoWriteView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/MemoWriteView.md
> 참조한 소스 파일: src/views/trainer/MemoWriteView.vue, src/views/trainer/MemoWriteView.css, src/composables/useMemos.js
> 리뷰 라운드: 1회 (최종 판정: NEEDS_IMPROVEMENT 반영 후 최종본)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 날짜/시간/사진 UI가 실제 저장되지 않는 치명적 이슈 누락, 사진 삭제 버튼 크기 22px 미기재, 미저장 이탈 방지 없음 미기재, 저장 후 800ms 자동 이동 패턴이 앱 전체 공통 이슈임을 명시 필요 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/MemoWriteView.vue` + `MemoWriteView.css`
- **역할**: 트레이너가 회원별 메모를 작성/수정하는 폼 화면. 날짜/시간 선택, 태그, 본문 입력, 사진 첨부 기능 제공
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 2 | 로딩 상태가 텍스트만으로 표현됨, 수정모드 로딩 처리 부족 |
| 터치 타겟 | 3 | 뒤로가기 버튼 40px, 태그 높이 34px, 사진 삭제 22px로 기준 미달 |
| 스크롤/인터랙션 | 3 | 바텀시트 활용 양호하나, 미저장 이탈 방지 없음 |
| 시각적 일관성 | 3 | 대부분 디자인 토큰 사용, 인라인 스타일 과다 |
| 접근성 | 3 | textarea에 id/label 연결 없음, 사진 삭제 버튼 라벨 없음 |
| 정보 밀도 | 4 | 적절한 섹션 분리 |
| 전체 사용성 | 2.5 | 기본 플로우 양호하나, UI-데이터 모델 불일치라는 근본적 결함 존재 |

---

### Critical (즉시 수정 필요)

#### 1. [신규] 날짜/시간/사진 UI가 실제로 저장되지 않음 — UI가 약속한 기능이 존재하지 않음
- **위치**: `MemoWriteView.vue` (날짜: 36-49행, 시간: 51-64행, 사진: 92-122행) / `useMemos.js:215,233`
- **문제**: 화면에는 날짜 선택, 시간 선택, 사진 첨부 UI가 모두 갖춰져 있으나, `createMemo(memberId, content, tags)`와 `updateMemo(memoId, content, tags)` 함수는 `content`와 `tags`만 저장한다. 날짜, 시간, 사진 데이터는 DB 스키마에도 해당 필드가 없다. 사용자는 날짜와 시간을 열심히 설정하고 사진을 첨부하지만, 저장 후 해당 정보가 모두 유실된다.
- **개선안**: 두 가지 방향 중 선택 필요:
  - (A) 메모 스키마 확장: `memo_date`, `memo_time` 컬럼 추가 + Storage 기반 사진 첨부 구현 + 수정 모드 hydrate 로직 추가
  - (B) UI 제거: 구현되지 않은 날짜/시간/사진 UI를 제거하고, 현재 동작하는 content + tags 폼만 유지

#### 2. 수정 모드 진입 시 로딩 상태 부재 — 사용자가 빈 폼을 기존 데이터로 착각할 수 있음
- **위치**: `MemoWriteView.vue:252-266` (`onMounted`)
- **문제**: `isEditMode`일 때 `fetchMemoById`를 호출하지만, 그 동안 사용자에게 빈 textarea가 보임. 데이터가 로드되기 전에 사용자가 내용을 입력하면 덮어써질 수 있음
- **개선안**: `loading` ref를 활용하여 수정 모드 진입 시 스켈레톤 또는 로딩 오버레이 표시

#### 3. [신규] 미저장 이탈 방지(route leave guard)가 없음
- **위치**: `MemoWriteView.vue` 전체
- **문제**: `TodayWorkoutView`에는 `onBeforeRouteLeave` + `isDirty` computed가 잘 구현되어 있지만, MemoWriteView에는 없음. 사용자가 메모를 작성하다 실수로 뒤로가기를 누르면 데이터가 전부 유실됨
- **개선안**: TodayWorkoutView의 패턴 적용. 이미 프로젝트에 `useConfirm.js` + `AppConfirmDialog.vue`가 있으므로, `window.confirm` 대신 기존 확인 시스템 활용

#### 4. 날짜/시간 값이 수정 모드에서 복원되지 않음
- **위치**: `MemoWriteView.vue:180-208`
- **문제**: `fetchMemoById` 후 `content`와 `tags`는 복원하지만, `selectedDate`와 `selectedTime`은 항상 현재 시각으로 초기화됨 (단, Critical #1이 해결되지 않으면 이 이슈도 의미 없음)
- **개선안**: Critical #1의 스키마 확장 방향 선택 시, 수정 모드에서 날짜/시간도 함께 복원

---

### Major (높은 우선순위)

#### 5. 뒤로가기 버튼 터치 타겟 40px — 모바일 최소 기준(44px) 미달
- **위치**: `MemoWriteView.css:26-27` (`.memo-write__back`)
- **사용자 영향**: 뒤로가기를 정확히 누르기 어려움, 특히 이동 중 사용 시
- **개선안**: `width: 44px; height: 44px;`로 변경

#### 6. 태그 버튼 높이 34px — 터치 타겟 부족
- **위치**: `MemoWriteView.css:138` (`.memo-write__tag { height: 34px }`)
- **사용자 영향**: 태그 선택 시 오탭 가능성
- **개선안**: `height: 40px` 이상으로 변경, `padding: 0 16px`

#### 7. 사진 삭제 버튼 22px — 심각한 터치 타겟 미달
- **위치**: `MemoWriteView.css:218-232` (`.memo-write__photo-remove { width: 22px; height: 22px }`)
- **사용자 영향**: 80px 썸네일 우상단의 22px 버튼을 정확히 누르기 매우 어려움
- **개선안**: `width: 28px; height: 28px`로 확대 + padding으로 터치 영역 추가 확장

#### 8. 사진 첨부 개수 제한 없음
- **위치**: `MemoWriteView.vue:234-242` (`handleFiles`)
- **문제**: 사용자가 제한 없이 사진을 추가할 수 있음. 메모리 이슈 및 업로드 실패 가능성
- **개선안**: 최대 개수(예: 10장) 제한 추가, 초과 시 토스트 메시지 표시

#### 9. 저장 후 800ms 딜레이 — 이중 클릭 가능 및 사용자 통제권 상실
- **위치**: `MemoWriteView.vue:274-284` (`handleSave`)
- **문제**: `showSuccess` 후 800ms 대기하고 `safeBack` 호출. 이 패턴이 `PaymentWriteView`, `ManualRegisterView`, `TrainerProfileEditView`, `WorkTimeSettingView` 등 앱 전체에 반복되는 안티패턴임. 사용자가 저장 결과를 확인할 기회 없이 강제 이동됨
- **개선안**: 저장 성공 시 즉시 버튼 비활성화 + 토스트 표시. 자동 이동 대신 사용자가 직접 뒤로가기하도록 하거나, 저장 버튼 내부 체크마크 애니메이션 후 자연스럽게 이동

#### 10. 미연결 회원 상태의 인라인 스타일 과다
- **위치**: `MemoWriteView.vue:15-26`
- **문제**: `hasActiveConnection === false` 블록 전체가 인라인 스타일. 같은 패턴이 `TodayWorkoutView`, `PaymentWriteView` 등에도 반복됨
- **개선안**: BEM 클래스로 CSS 파일에 분리 (예: `.memo-write__disconnected`). 공통 empty/disconnected shell 컴포넌트로 통합 고려

---

### Minor (개선 권장)

#### 11. 사진 삭제 버튼에 접근성 라벨 없음
- **위치**: `MemoWriteView.vue:98-103`
- **개선안**: `aria-label="사진 삭제"` 추가

#### 12. textarea placeholder 텍스트가 길어서 모바일에서 잘림 가능
- **위치**: `MemoWriteView.vue:88`
- **현재**: `"운동 내용, 회원 컨디션, 식단 피드백 등을 기록하세요..."`
- **개선안**: 480px에서 표시될 수 있는 길이로 축약. 예: `"메모 내용을 입력하세요"`

#### 13. 로딩 중 상태가 "불러오는 중..." 텍스트만 표시
- **위치**: `MemoWriteView.vue:28-30`
- **개선안**: TodayWorkoutView처럼 `AppSkeleton` 컴포넌트 사용

#### 14. 저장 버튼의 disabled 조건이 content만 체크
- **위치**: `MemoWriteView.vue:250` (`canSave`)
- **문제**: 태그 미선택 시에도 저장 가능. 비즈니스 요건에 따라 태그 필수 여부 확인 필요

---

### Good (잘된 점)
- 바텀시트를 활용한 날짜/시간 선택이 모바일에 적합
- `safeBack` 유틸리티를 통한 안전한 뒤로가기 처리
- 사진 미리보기와 삭제 기능의 기본 구조가 잘 갖춰져 있음
- `env(safe-area-inset-bottom)` 적용으로 노치 디바이스 대응
- CSS 변수를 대부분 활용하고 있어 디자인 시스템 일관성 유지

---

### 토스 앱 참고 개선안
1. **저장 진행 상태**: 토스처럼 저장 버튼 내부에 로딩 스피너를 표시하고, 성공 시 체크마크 애니메이션 후 자동 이동
2. **폼 유효성 실시간 피드백**: 필수 필드(내용) 미입력 시 섹션 하단에 인라인 안내 메시지 표시
3. **사진 업로드 프로그레스**: 사진 추가 시 업로드 진행률 표시 (현재는 ObjectURL만 생성하므로 실제 업로드 시 필요)
4. **미저장 이탈 경고**: `onBeforeRouteLeave` 가드 + 기존 `useConfirm.js` / `AppConfirmDialog.vue` 활용 (window.confirm 사용 금지)

---

### 구조 개선 제안 (참고용)
1. **UI-데이터 모델 일치**: 날짜/시간/사진 UI가 저장되지 않는 근본 문제 해결이 최우선
2. **인라인 스타일 공통 컴포넌트화**: 미연결 회원 상태/로딩 상태의 인라인 스타일을 공통 shell 컴포넌트로 통합
3. **AppSkeleton 도입**: 로딩 상태에 일관된 스켈레톤 UI 적용
4. **폼 상태 관리 통합**: `selectedDate`, `selectedTime`, `content`, `selectedTags`, `photos`를 하나의 `reactive` 객체로 묶어 관리하면 수정 모드 복원 및 dirty check가 용이
5. **저장 후 자동 이동 패턴 통일**: 앱 전체의 `setTimeout(() => safeBack(), 800)` 패턴을 공통 유틸리티로 추출하거나 폐기
