# WorkTimeSettingView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/WorkTimeSettingView.md
> 참조한 소스 파일: src/views/trainer/WorkTimeSettingView.vue, src/views/trainer/WorkTimeSettingView.css, src/components/AppBottomSheet.vue, src/composables/useWorkHours.js, src/composables/useScheduleOverrides.js, src/components/AppCalendar.vue, supabase/schema.sql
> 리뷰 라운드: 3회 (최종 판정: 리뷰 문서 확정 - 소스 코드 수정은 별도 작업)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 에러 배너 분석 오류, 바텀시트 중복 헤더 오분석, 누락 이슈 5건 |
| 2 | NEEDS_IMPROVEMENT | 근무/휴무 토글 접근성(aria-pressed) 누락, 예약 단위 항목 근거 보강 필요 |
| 3 | 문서 확정 | GPT가 리뷰 문서의 모든 지적 사항이 소스 코드에서 실제로 존재함을 확인. 리뷰 문서 정확성 검증 완료. |

---

## 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 4 | 스켈레톤 UI 잘 구현 |
| 터치 타겟 | 2 | 요일 칩, 뒤로가기, 시트 닫기 버튼 크기 부족 |
| 스크롤/인터랙션 | 3 | 바텀시트, 타임피커 적절하나 실패 시 UX 미흡 |
| 시각적 일관성 | 4 | 디자인 토큰 준수, 로컬 변수 체계적 |
| 접근성 | 3 | 일부 요소 aria 레이블 부족 |
| 정보 밀도 | 3 | 한 화면에 많은 설정 항목 |
| 전체 사용성 | 3 | 복잡한 기능을 잘 구조화하나 에러/실패 대응 미흡 |

---

## 최종 리뷰 내용

### Critical (즉시 수정 필요)

#### 1. 오버라이드 저장 실패 시에도 바텀시트가 닫힘
- **위치**: `WorkTimeSettingView.vue:337-353`, `WorkTimeSettingView.vue:355-364`
- **문제**: `confirmOverride`와 `restoreDefault` 함수 모두 성공 여부와 무관하게 `showDateSheet.value = false`를 실행한다. 실패 시 사용자는 에러 원인을 보기도 전에 작업 맥락을 잃는다.
- **개선안**: 실패 시 `if (!ok) return`으로 시트를 유지하고, 액션 영역 아래에 인라인 에러 메시지를 노출한다.

#### 2. 저장 후 자동 뒤로가기가 사용자 의도와 충돌 가능
- **위치**: `WorkTimeSettingView.vue:398-401`
- **문제**: `handleSave` 성공 시 `setTimeout(() => safeBack(route.path), 800)`으로 자동 이전 화면 전환. 사용자가 결과 확인이나 추가 수정을 원할 때 강제 전환된다.
- **개선안**: 자동 `safeBack`을 제거하고 토스트 메시지만 보여준다. 사용자가 직접 뒤로가기를 결정하도록 한다.

#### 3. 시간 범위 클라이언트 검증 부재
- **위치**: `WorkTimeSettingView.vue:60-68`, `WorkTimeSettingView.vue:158-178`, `WorkTimeSettingView.vue:388-402`
- **문제**: 기본 근무시간과 오버라이드 시간 모두 `시작 >= 종료`를 클라이언트에서 검증하지 않는다. DB에 CHECK 제약이 있지만(schema.sql), 토스 수준 UX라면 서버 에러 전에 즉시 막아야 한다.
- **개선안**: `isDefaultTimeValid`, `isOverrideTimeValid`를 computed로 정의하고, 유효하지 않을 때 저장/확인 버튼을 비활성화하며 인라인 오류 문구를 표시한다.

### Major (높은 우선순위)

#### 4. 날짜 오버라이드 확인 시 로딩 상태 없음
- **위치**: `WorkTimeSettingView.vue:337-353`
- **문제**: `setOverride`가 서버 통신 중인 동안 "확인" 버튼에 로딩 상태가 없다. 중복 탭으로 중복 요청이 발생할 수 있다.
- **개선안**: `useScheduleOverrides()`의 `loading` 상태를 alias로 사용하여 버튼에 `:disabled` 및 로딩 텍스트를 추가한다.

#### 5. 반복 휴무 요일 칩 및 기타 버튼 터치 타겟 부족
- **위치**: `WorkTimeSettingView.css:208-236` (칩 40px), `WorkTimeSettingView.css:39-44` (뒤로가기 40px), `WorkTimeSettingView.css:359-371` (시트 닫기 32px)
- **문제**: 요일 칩 40px, 뒤로가기 버튼 40px, 바텀시트 닫기 버튼 32px로 모두 최소 권장 44px에 미달한다.
- **개선안**: 모든 인터랙티브 요소를 최소 44px hit area로 조정한다. 시각적 크기를 유지하려면 투명 padding/hitbox를 사용한다.

#### 6. 날짜 선택 시 바텀시트가 자동으로 열리는 UX 문제
- **위치**: `WorkTimeSettingView.vue:326-329`
- **문제**: `selectedDate` watch에서 날짜가 변경되면 즉시 `openDateSheet(date)`를 호출하여 바텀시트가 자동으로 열린다. 사용자가 날짜 상태만 확인하고 싶을 때도 매번 바텀시트가 뜬다.
- **개선안**: watch에서 자동 열기를 제거하고, 날짜 선택 후 명시적 "상세 조정" 버튼이나 재탭 시에만 시트를 여는 방식으로 변경한다.

#### 7. 날짜 탭 후 바텀시트 오픈 전 지연
- **위치**: `WorkTimeSettingView.vue:299-314`
- **문제**: `openDateSheet`가 `getReservationCountForDate`의 서버 응답을 기다린 뒤에 시트를 연다. 네트워크가 느리면 탭이 작동하지 않는 것처럼 느껴진다.
- **개선안**: 시트를 먼저 열고 예약 건수 영역만 skeleton/loading 처리한다.

#### 8. "기본값으로 복원" 기능 UI 미연결 (dead code)
- **위치**: `WorkTimeSettingView.vue:355-364`, `WorkTimeSettingView.css:560-574`
- **문제**: `restoreDefault` 함수와 `.wt-sheet-action-restore` CSS 클래스가 정의되어 있지만, 템플릿에서 호출하는 버튼이 없다.
- **개선안**: 기존 오버라이드가 있는 날짜의 바텀시트에 "기본값 복원" 버튼을 추가한다.

#### 9. 월 변경 시 이전 달 데이터 잔존
- **위치**: `WorkTimeSettingView.vue:254-265`, `WorkTimeSettingView.vue:282-287`, `WorkTimeSettingView.vue:331-335`
- **문제**: 월을 변경하면 이전 달 `overrides` 데이터가 fetch 완료 전까지 남아 있어, 새 달에 잘못된 dot가 잠깐 보일 수 있다. `selectedDateHint`도 이전 달 선택 상태를 계속 설명한다.
- **개선안**: 월 변경 시 `selectedDate`를 비우고, dot 데이터는 로딩 중 초기화하거나 캘린더 자체에 로딩 상태를 적용한다.

#### 10. 에러 배너와 토스트 중복 노출
- **위치**: `WorkTimeSettingView.vue:14`, `WorkTimeSettingView.vue:432-438`
- **문제**: 에러 발생 시 인라인 배너(`wt-setting__error`)와 토스트(`watch(error, ...)`)가 동시에 표시된다. 동일한 에러 메시지가 두 곳에서 중복으로 보인다.
- **개선안**: 인라인 배너를 제거하고 토스트로 통일하거나, 토스트 watch를 제거하고 인라인 배너만 사용한다.

### Minor (개선 권장)

#### 11. 예약 단위 변경에 대한 영향 안내 부재 (정책 확인 필요)
- **위치**: `WorkTimeSettingView.vue:41-53`
- **문제**: 예약 단위 변경 시 기존 예약에 미치는 영향에 대한 안내가 없다. 사용자가 변경의 영향 범위를 알 수 없다.
- **개선안**: 백엔드의 예약 단위 변경 정책을 확인한 후, 정확한 영향 범위를 안내하는 텍스트를 섹션 하단에 추가한다. 정책 미확정 시 "운영 규칙 확인 후 안내 문구 검토" 상태로 유지한다.

#### 12. 시간 선택기 접근성
- **위치**: `WorkTimeSettingView.vue:158-176`
- **문제**: 오버라이드 바텀시트의 시간 버튼에 `aria-label`이 없다.
- **개선안**: `aria-label="시작 시간 변경"`, `aria-label="종료 시간 변경"`을 각각 추가한다.

#### 13. 근무/휴무 토글 접근성 부재
- **위치**: `WorkTimeSettingView.vue:138-152`
- **문제**: 근무/휴무 토글 버튼이 시각적으로만 활성 상태가 바뀌고, `aria-pressed` 같은 상태 표현이 없다. 스크린 리더 사용자가 현재 선택 상태를 파악할 수 없다.
- **개선안**: `:aria-pressed="overrideIsWorking"` / `:aria-pressed="!overrideIsWorking"`을 각 버튼에 추가한다.

### Good (잘된 점)

- **스켈레톤 UI**: 초기 로딩 시 각 섹션별로 적절한 형태의 스켈레톤 UI가 구현되어 있어 레이아웃 시프트가 없다.
- **로컬 CSS 변수 체계**: `--wt-` 접두사로 컴포넌트 범위의 CSS 변수를 정의하여 일관성과 유지보수성이 우수하다.
- **시간 선택기 분리**: 시간 선택을 별도 바텀시트(`AppTimePicker`)로 분리하여 재사용 가능하다.
- **캘린더 도트 시스템**: 오버라이드된 날짜를 캘린더에 색상 도트로 표시하여 한눈에 파악 가능하다.
- **safe-area 대응**: 하단 고정 버튼에 `env(safe-area-inset-bottom)` 처리가 되어 있다.
- **토글 UI의 세그먼트 컨트롤 스타일**: 근무/휴무 토글이 깔끔하게 구현되어 있다.
- **커스텀 바텀시트 헤더**: `AppBottomSheet`에 title prop을 전달하지 않고 커스텀 헤더를 슬롯으로 구현했는데, `AppBottomSheet`는 title이 없을 때 기본 헤더를 렌더링하지 않으므로 중복 없이 깔끔하게 동작한다.

### 토스 앱 참고 개선안

1. **설정 변경 감지 & 미저장 경고**: `beforeRouteLeave` 가드를 추가하여 변경사항이 있을 때 확인을 제공한다.
2. **섹션별 저장**: 장기적으로 섹션별 자동 저장을 검토할 수 있다.
3. **휴무일 경고 강화**: 예약이 있는 날에 휴무로 변경할 때 영향받는 예약 목록을 보여주고 최종 확인을 받는다.

### 구조 개선 제안 (참고용)

1. **상태 관리 정리**: 오버라이드 관련 상태를 하나의 reactive 객체로 묶으면 관리가 쉬워진다.
2. **`restoreDefault` 연결 또는 제거**: 사용되지 않는 함수를 템플릿에 연결하거나 제거하여 코드를 정리한다.
