# ReservationManageView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/ReservationManageView.md
> 참조한 소스 파일: src/views/trainer/ReservationManageView.vue, src/views/trainer/ReservationManageView.css, src/composables/useReservations.js, src/composables/useToast.js, src/components/AppToast.vue, src/components/AppCalendar.vue, src/stores/toast.js
> 리뷰 라운드: 3회 (최종 판정: 최대 반복 도달)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 날짜 정렬 설명 부정확, Undo 지속시간 수치 부정확(실제 5000ms), 필터 의미 충돌, 과거 날짜 재배정 가능, 전역 loading/error 설계 문제, 오늘 없을 때 other 헤더 부재, 에러 중복 노출 |
| 2 | NEEDS_IMPROVEMENT | 에러+빈 상태 동시 노출 누락, 필터별 empty state 문구 부적합 누락, #8 위치 표기 수정, #3 AppCalendar 클릭 미차단 근거 보강, 터치 타겟 점수 과대(칩/슬롯/프리셋도 44px 미달), #10 spacer 동기화 필요, #5 양쪽 카드 블록 위치 확대 |
| 3 | - | 2라운드 피드백 전체 반영 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/ReservationManageView.vue` + `ReservationManageView.css`
- **역할**: 예약 관리 목록 화면. 상태별 필터링(전체/배정됨/대기중/완료됨/취소됨), 변경 요청 승인/거절(Undo 지원), 재배정, 취소 처리
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 3.5 | 보통~양호 - 스켈레톤 있으나 전역 loading 공유 문제 |
| 터치 타겟 | 3.5 | 보통~양호 - 카드 버튼 44px이나, 뒤로가기 40px, 필터 칩 36px, 슬롯 40px, 프리셋 36px 등 다수 미달 |
| 스크롤/인터랙션 | 4 | 양호 - 풀투리프레시, press-effect 일관 적용 |
| 시각적 일관성 | 4 | 양호 - 상태별 색상 바, 디자인 토큰 준수 |
| 접근성 | 2.5 | 미흡 - 필터 칩 aria 없음, 슬롯 선택 상태 미표시 |
| 정보 밀도 | 3 | 보통 - 카드 내용이 많아 스크롤 길어짐 |
| 전체 사용성 | 3.5 | 보통~양호 |

### Critical (즉시 수정 필요)

#### 1. 같은 예약이 "배정됨"과 "완료됨" 두 필터에 동시에 노출됨
- **위치**: `ReservationManageView.vue:462-476` (`filteredList`), `ReservationManageView.vue:419-422` (상태 매핑)
- **문제**: `scheduled` 상태의 과거 세션은 `isVisuallyCompleted()`로 시각적 완료 처리되지만, DB 상태는 여전히 `scheduled`임. "배정됨" 필터를 선택하면 이 항목이 보이고, "완료됨" 필터에서도 `isVisuallyCompleted()`를 포함하므로 동일 항목이 양쪽에 노출됨. 사용자는 같은 항목이 왜 두 탭에 다 보이는지 이해하기 어려움.
- **개선안**: 표시용 상태(`displayStatus`)를 별도로 계산하여 필터 기준을 일원화. 과거 `scheduled`는 `scheduled` 탭에서 제외하거나, `completed` 탭에만 포함.

### Major (높은 우선순위)

#### 2. "전체" 필터에서 취소됨 일정이 숨겨지지만 필터 칩에는 "취소됨"이 있어 혼란
- **위치**: `ReservationManageView.vue:462-476` (`filteredList`)
- **문제**: "전체" 탭 선택 시 `cancelled` 상태를 필터링하여 숨김. 그런데 "취소됨" 필터 칩은 별도로 존재. 사용자는 "전체"가 모든 항목을 보여줄 것으로 기대.
- **개선안**: (A) "전체" 탭에서도 취소됨을 포함하되 시각적으로 구분 (opacity, 구분선 등) 또는 (B) 필터 칩을 4개로 줄이고, 취소됨은 별도 토글로 분리.

#### 3. 재배정 바텀시트에서 과거 날짜 선택이 가능함
- **위치**: `ReservationManageView.vue:29`, `AppCalendar.vue:36, 149, 154`
- **문제**: `disabledDates=[]`를 넘기고 있고, `AppCalendar` 자체도 과거 날짜를 시각적으로만 구분(opacity 처리)할 뿐 클릭 자체는 막지 않음. 과거 날짜로 재배정을 시도하면 API에서만 실패. 토스 수준 UX라면 과거 재배정 후보는 UI에서 막아야 함.
- **개선안**: `AppCalendar`에서 `isPast()` 판정 시 클릭도 차단하도록 수정하거나, `minDate` prop을 추가.

#### 4. 전역 `loading` 하나로 모든 비동기 작업을 처리
- **위치**: `ReservationManageView.vue:112`, `useReservations.js:62`
- **문제**: 초기 로딩, 슬롯 조회, 승인/거절/재배정/취소 모두 `useReservations`의 단일 `loading` ref를 공유함. 단일 카드 액션(승인 등) 중에도 본문 전체가 스켈레톤으로 바뀔 수 있어 맥락 손실이 큼.
- **개선안**: `pageLoading`, `slotLoading`, `actionLoadingId`로 분리하여 카드 단위 진행 상태 표시.

#### 5. 카드 내 중복 정보 영역으로 세로 공간 과다 사용
- **위치**: `ReservationManageView.vue:126-225` (todayList 카드), `ReservationManageView.vue:235-343` (otherList 카드)
- **문제**: 하나의 `res-card`에 프로필 + 상태뱃지 + 메타박스 + 변경요약 + 변경사유 + 액션버튼 + 풋터상태까지 최대 7개 섹션. `change_requested` 상태의 카드는 매우 길어져 한 화면에 1~2개만 보임.
- **개선안**: 변경 요약과 사유를 접힌 상태로 기본 제공하고 "상세 보기" 탭으로 펼침. 또는 카드 탭하면 바텀시트에서 상세 정보를 보여주는 패턴으로 전환.

#### 6. 승인 실행 취소(Undo) 토스트의 노출 시간 제한
- **위치**: `ReservationManageView.vue:508-541` (`handleApprove`), `useToast.js:23`
- **문제**: 승인 후 토스트에 "실행 취소" 버튼이 포함되지만, 액션이 있는 성공 토스트의 표시 시간은 고정 `5000ms`(5초)임. 이미 DB에 반영된 변경을 되돌리는 중요한 액션인데, 5초 후 자동으로 사라지면 사용자가 놓칠 수 있음.
- **개선안**: Undo 토스트의 표시 시간을 8~10초로 설정, 또는 화면 상단에 "되돌리기" 배너를 일정 시간 고정 표시.

#### 7. 에러가 인라인 배너와 토스트로 중복 노출됨
- **위치**: `ReservationManageView.vue:92` (인라인 배너), `ReservationManageView.vue:622` (watch 토스트), `ReservationManageView.vue:522-523` (handleApprove에서 showError 호출)
- **문제**: `error` ref 변경 시 상단 배너와 `watch` 토스트가 동시에 표시됨. 일부 실패는 핸들러에서 `showError()`를 추가 호출해 토스트가 2번 뜰 수도 있음.
- **개선안**: 초기 목록 실패만 인라인 배너, 액션 실패는 해당 시트/카드 인라인 메시지 또는 단일 토스트로 역할 분리.

#### 8. "다른 날짜" 섹션에서 날짜 그룹 헤더가 없어 스캔성 저하
- **위치**: `ReservationManageView.vue:230-231` (다른 날짜 헤더 조건부 렌더링), `ReservationManageView.vue:479-480` (today/other 분리)
- **문제**: `otherList`는 `date + start_time` 기준으로 정렬되어 날짜 순서는 정확하지만, 날짜별 소제목(헤더)이 없어 긴 목록에서 "이 일정이 며칠인지" 매번 메타박스의 날짜를 확인해야 함. 또한 오늘 일정이 없고 otherList만 있을 때 "다른 날짜" 헤더가 아예 사라져 목록의 맥락을 알 수 없음.
- **개선안**: 날짜별로 그룹핑하여 소제목(날짜 헤더)을 추가. otherList 섹션 헤더는 항상 노출.

#### 9. 필터 칩에 건수 표시가 없어 유용성 감소
- **위치**: `ReservationManageView.vue:97-106`
- **문제**: 필터 칩이 텍스트만 표시. 각 상태의 건수가 없어서 해당 탭을 눌러봐야 함.
- **개선안**: 칩에 건수 뱃지 추가.

#### 10. 에러 상태와 빈 상태가 동시에 노출됨
- **위치**: `ReservationManageView.vue:92` (에러 배너), `ReservationManageView.vue:347-359` (빈 상태), `ReservationManageView.vue:482` (isEmpty)
- **문제**: `error` 배너가 표시되어도 `isEmpty` computed는 그대로 계산되어 "일정이 없습니다" + "스케줄 바로가기" CTA가 함께 렌더링됨. 이는 "데이터가 없음"이 아니라 "불러오지 못함"인데, 사용자에게 잘못된 행동(스케줄 이동)을 유도.
- **개선안**: `error` 상태일 때 빈 상태 CTA를 숨기고, "재시도" 버튼을 대신 노출.

#### 11. 필터별 empty state 문구가 맥락에 맞지 않음
- **위치**: `ReservationManageView.vue:347-359`
- **문제**: "완료됨"이나 "취소됨" 필터에서도 빈 상태 문구가 항상 "스케줄 화면에서 빈 슬롯을 탭하여 배정하세요"로 고정됨. 필터 맥락과 무관한 CTA가 표시됨.
- **개선안**: 필터 맥락별 문구 분기 또는 "필터 초기화" CTA 제공. 예: 완료됨 필터 → "완료된 일정이 없습니다", 취소됨 → "취소된 일정이 없습니다".

### Minor (개선 권장)

#### 12. 뒤로가기 버튼 및 기타 요소 터치 타겟이 44px 미달
- **위치**: `ReservationManageView.css:32-33`, `ReservationManageView.vue:89` (오른쪽 spacer)
- **문제**: `.reservation__back`이 `width: 40px; height: 40px`으로 Apple HIG 최소 기준(44px)보다 4px 작음.
- **개선안**: `width: 44px; height: 44px`으로 변경. 동시에 오른쪽 placeholder spacer(`style="width: 40px;"`)도 44px로 동기화하여 제목 정렬 유지.

#### 13. 재배정 바텀시트에서 슬롯 로딩 중 텍스트만 표시
- **위치**: `ReservationManageView.vue:34`
- **문제**: "슬롯 로딩 중..." 단순 텍스트만 표시. 다른 로딩 상태에서는 `AppSkeleton`을 사용하는데 여기서만 일관성 떨어짐.
- **개선안**: `<AppSkeleton type="rect" height="40px" :count="3" />`으로 교체.

#### 14. 재배정 시 시간 슬롯 버튼에 접근성 정보 없음
- **위치**: `ReservationManageView.vue:39-47`
- **문제**: 슬롯 버튼에 `aria-pressed` 등 선택 상태를 나타내는 속성이 없음.
- **개선안**: `aria-pressed` 속성 추가.

#### 15. 거절 프리셋 선택 시 textarea와 동기화 UX
- **위치**: `ReservationManageView.vue:66-75`
- **문제**: 프리셋 버튼 클릭 시 `rejectReason`이 프리셋 텍스트로 대체됨(동일 프리셋 재클릭 시 비움). 사용자가 직접 입력 후 프리셋을 탭하면 입력 내용이 사라지지만 시각적 안내가 없음.
- **개선안**: textarea가 비어있을 때만 프리셋 삽입, 또는 프리셋을 선택형 태그로 변경.

#### 16. `today` 변수의 반응성 문제
- **위치**: `ReservationManageView.vue:455-459`
- **문제**: `const today = getLocalToday()`가 `onMounted` 외부에서 한 번만 계산됨. 자정을 넘기면 "오늘" 판정이 틀려질 수 있음.
- **개선안**: `computed`로 변경하거나 `onActivated`에서 갱신.

### Good (잘된 점)

- **승인 Undo 패턴**: `handleApprove`에서 `revertApproval`을 활용한 실행 취소가 구현됨. 원본 데이터를 미리 캡처하는 세심함.
- **상태별 시각적 분화가 훌륭**: 좌측 컬러 바(파랑/주황/초록/회색), 아바타 배경색, 상태 뱃지가 일관된 색상 체계를 따름.
- **시각적 완료 처리**: `isVisuallyCompleted` 함수로 시간이 지난 `scheduled` 항목을 DB 변경 없이 시각적으로 완료 처리. 현실적인 트레이드오프.
- **빈 상태에서 명확한 CTA**: "일정이 없습니다" + "스케줄 화면에서 빈 슬롯을 탭하여 배정하세요" + "스케줄 바로가기" 버튼.
- **풀투리프레시 + 캐시 무효화**: `handleRefresh`에서 `reservationsStore.invalidate()` 후 재조회.
- **거절 프리셋 버튼**: 자주 사용하는 거절 사유를 원탭으로 선택할 수 있는 프리셋 UI. 글자수 카운터도 포함.
- **press-effect 일관 적용**: 모든 인터랙티브 요소에 `press-effect` 클래스가 적용되어 터치 피드백이 균일.
- **취소 확인 다이얼로그**: `TrainerScheduleView`와 달리 취소 전 확인 바텀시트(`showCancelDialog`)가 구현되어 있어 실수 방지.

### 토스 앱 참고 개선안

1. **스와이프 액션**: 카드를 좌측으로 스와이프하면 "취소" / "재배정" 빠른 액션 노출. 기본 카드 높이를 줄일 수 있음.
2. **필터 칩 스티키 고정**: `position: sticky; top: 0`으로 고정하면 긴 목록에서도 필터 전환이 용이.
3. **승인/거절 시 마이크로 애니메이션**: 카드가 사라지는 애니메이션(fade-out + collapse).
4. **날짜별 타임라인 뷰**: "다른 날짜" 섹션을 타임라인 형식으로 표시하면 시간 흐름을 직관적으로 파악 가능.

### 구조 개선 제안 (참고용)

1. **카드 컴포넌트 분리 (높은 추천)**: `todayList`와 `otherList`에 동일한 카드 구조가 복사되어 있음(약 200줄 중복). `ReservationCard.vue` 컴포넌트로 분리하면 유지보수성 대폭 향상.
2. **상태 매핑 상수 공유**: `STATUS_CARD_CLASS`, `STATUS_LABEL` 등이 `TrainerScheduleView`의 `STATUS_LABELS`와 유사. `@/utils/reservation.js`로 통합.
