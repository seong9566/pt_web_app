# TrainerScheduleView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/TrainerScheduleView.md
> 참조한 소스 파일: src/views/trainer/TrainerScheduleView.vue, src/views/trainer/TrainerScheduleView.css, src/components/AppBottomSheet.vue, src/components/AppWeeklyCalendar.vue, src/components/AppConfirmDialog.vue, src/composables/useConfirm.js, src/stores/reservations.js
> 리뷰 라운드: 3회 (최종 판정: 최대 반복 도달)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | changeRequestCount 범위 오류, 배지 탭 목적지 미설정, 월간→주간 가용성 stale, 재배정 모드 힌트 모순, 추가 터치 타겟 미달, 접근성, 비동기 중복 탭 방지 부족, 탭 전환 애니메이션 표현 부정확 |
| 2 | NEEDS_IMPROVEMENT | #2 개선안에 ReservationManageView query parsing 필요 명시, #9 중복 탭 위험 범위 정확화(취소만 API 호출), #6 재현 조건을 keep-alive 복귀로 정확화, 상세 로딩 중 탭 무시 문제 누락, 회원 배정 시트 선닫기 문제 누락, startReassignMode stale 데이터 누락 |
| 3 | - | 2라운드 피드백 전체 반영 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/TrainerScheduleView.vue` + `TrainerScheduleView.css`
- **역할**: 트레이너 일정 관리 핵심 화면. 주간/월간 뷰 전환, 빈 슬롯 탭으로 회원 배정, 일정 상세/취소/재배정, 변경 요청 승인/거절 처리
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 4 | 양호 - 주간/월간 각각 로딩 처리, 빈 상태 구현 |
| 터치 타겟 | 2.5 | 미흡 - 앱바 뱃지 32px, 탭 38px, 상세 시트 42px 등 다수 미달 |
| 스크롤/인터랙션 | 4 | 양호 - 드래그앤드롭, 바텀시트, 풀투리프레시 |
| 시각적 일관성 | 4 | 양호 - 상태별 색상 체계 일관적 |
| 접근성 | 2.5 | 미흡 - 바텀시트 dialog 시맨틱 없음, article 클릭 요소 |
| 정보 밀도 | 3 | 보통 - 바텀시트가 4개로 많음 |
| 전체 사용성 | 3 | 보통 |

### Critical (즉시 수정 필요)

#### 1. 일정 취소 시 확인 다이얼로그 없음
- **위치**: `TrainerScheduleView.vue:1056-1069` (`handleCancelSchedule`)
- **문제**: 상세 바텀시트에서 "일정 취소" 버튼을 누르면 별도 확인 없이 즉시 `cancelSchedule` API를 호출함. 실수로 탭하면 복구 불가능한 데이터 손실이 발생. `ReservationManageView`에서는 취소 확인 다이얼로그(`showCancelDialog`)가 구현되어 있어 일관성도 깨짐.
- **개선안**: 앱에 이미 존재하는 전역 확인 다이얼로그(`AppConfirmDialog` + `useConfirm`)를 재사용.
```js
const { confirm } = useConfirm()
async function handleCancelSchedule() {
  if (!selectedSchedule.value) return
  const ok = await confirm('이 일정을 취소하시겠습니까?')
  if (!ok) return
  const cancelled = await cancelSchedule(selectedSchedule.value.id)
  // ...
}
```

### Major (높은 우선순위)

#### 2. 앱바 "변경 요청 N건" 뱃지의 카운트 범위와 이동 목적지 오류
- **위치**: `TrainerScheduleView.vue:6-11`
- **문제**: (1) `changeRequestCount`가 `weeklySchedules` 기반이라 현재 보고 있는 주간의 변경 요청만 표시함. 다른 주에 요청이 있어도 0건으로 보여 사용자가 놓칠 수 있음. 전역 store(`reservations.js:40`)에는 전체 기준 카운트가 이미 존재. (2) 0건일 때도 "변경 요청 0건" 뱃지가 항상 노출됨. (3) 배지를 눌러도 변경 요청 필터가 적용된 화면이 아닌 일반 일정 관리(`trainer-reservations`)로 이동.
- **개선안**: 전역 store의 전체 `changeRequestCount`를 사용하고, `v-if="count > 0"`으로 조건부 렌더링. 탭 시 `trainer-reservations?filter=change_requested`로 이동. 단, `ReservationManageView` 쪽에서 `route.query.filter`를 읽어 `activeFilter`를 초기화하는 query parsing 로직 추가가 함께 필요함.

#### 3. 바텀시트 간 전환 시 race condition 가능성
- **위치**: `TrainerScheduleView.vue:1009-1016` (`openRejectSheet`)
- **문제**: `showChangeRequestSheet`를 `false`로 설정한 직후 `nextTick`에서 `showRejectSheet`를 `true`로 설정. 바텀시트의 leave 트랜지션이 완료되기 전에 새 바텀시트가 열릴 수 있어 시각적 겹침 발생 가능. 코드 주석은 "트랜지션 후"라고 쓰여 있지만 `nextTick`은 이를 보장하지 않음.
- **개선안**: `setTimeout`보다 `Transition @after-leave` emit 추가 또는 단일 sheet 상태머신이 안전.

#### 4. 상세 바텀시트 로딩 중 사용자 피드백 없음
- **위치**: `TrainerScheduleView.vue:957-1007` (`openScheduleDetail`)
- **문제**: `detailLoading` 상태가 `true`인 동안 시각적 피드백 없이 비동기 데이터를 로드함. `detailLoading` 플래그가 존재하지만 UI에 반영되지 않음.
- **개선안**: 바텀시트를 먼저 열고 내부에 로딩 스켈레톤을 보여주는 방식으로 변경.

#### 5. 터치 타겟 미달 다수
- **위치**: `TrainerScheduleView.css:37-52` (앱바 배지 32px), `css:68` (뷰 탭 38px), `css:358` (운동 배정 CTA 36px), `css:577` (상세 시트 액션 42px), `css:106` (재배정 취소 버튼)
- **문제**: Apple HIG 최소 기준 44px에 미달하는 요소가 다수 존재. 특히 앱바 뱃지(32px)와 CTA 버튼(36px)은 자주 탭하는 요소.
- **개선안**: 핵심 인터랙션 요소를 전부 `min-height: 44px`로 통일.

#### 6. 재배정 모드가 keep-alive 재활성화 후에도 유지됨
- **위치**: `TrainerScheduleView.vue:1071-1083` (`startReassignMode`), `TrainerScheduleView.vue:1173` (`onActivated`)
- **문제**: 재배정 모드에 진입하면 "취소" 버튼으로만 해제 가능. 이 뷰는 `keep-alive` 대상(App.vue:34)이라, 하단 탭으로 다른 화면에 갔다가 돌아오면 `onActivated`가 호출되지만 재배정 모드를 초기화하지 않아 상태가 그대로 남음.
- **개선안**: `onActivated`에서 `clearReassignMode()` 호출.

#### 7. 월간에서 날짜를 바꾼 뒤 주간으로 돌아오면 가용성 데이터가 stale
- **위치**: `TrainerScheduleView.vue:877` (handleMonthDateSelect), `TrainerScheduleView.vue:836` (switchView)
- **문제**: `fetchMemberAvailabilities(currentWeekStart)`는 주간 변경 시(`handleWeekChange`)에만 호출됨. 월간에서 날짜를 선택해 `currentWeekStart`가 바뀌어도, 이후 주간 뷰로 전환할 때 가용성 데이터를 다시 로드하지 않음.
- **개선안**: `handleMonthDateSelect()`와 `switchView('weekly')`에서 주간 가용성도 다시 로드.

#### 8. 재배정 모드에서 힌트 문구가 잘못된 안내를 함
- **위치**: `TrainerScheduleView.vue:67`
- **문제**: "빈 슬롯을 탭하면 회원을 바로 배정할 수 있습니다." 힌트가 재배정 모드에서도 그대로 표시됨. 실제 탭 동작은 회원 배정이 아니라 재배정인데 힌트가 잘못된 안내를 제공.
- **개선안**: `reassignTarget`일 때 힌트를 "재배정할 시간을 선택하세요"로 변경하거나 숨김.

#### 9. 상세 시트의 "일정 취소" 버튼에 중복 탭 방지 없음
- **위치**: `TrainerScheduleView.vue:248-269`
- **문제**: 상세 바텀시트의 3개 버튼 중, "일정 취소"(line 252)는 직접 API를 호출하지만 `loading` disable 처리가 없어 빠른 연속 탭으로 중복 호출 가능. "일정 변경"은 재배정 모드 진입이고 "운동 배정하기"는 라우팅이므로 API 중복 위험은 낮으나, 중복 네비게이션 가드 관점에서 disable 처리가 있으면 더 안전함.
- **개선안**: 최소한 "일정 취소" 버튼에 pending 상태와 disable 처리 추가. 라우팅 버튼에도 중복 네비게이션 방지 고려.

#### 10. 상세 로딩 중 다른 일정 탭이 무시되어 피드백 없음
- **위치**: `TrainerScheduleView.vue:957-959`
- **문제**: `detailLoading`이 `true`이면 `openScheduleDetail`이 즉시 return하고, 동시에 로딩 UI도 없음. 사용자는 "탭이 안 먹었다"고 느끼기 쉬움.
- **개선안**: 로딩 중임을 알리는 시각적 피드백(카드 로딩 인디케이터 등)을 제공하거나, 이전 요청을 취소하고 새 요청을 수행.

#### 11. 회원 배정 시트가 API 결과 전에 선닫기됨
- **위치**: `TrainerScheduleView.vue:1042-1054` (`assignToMember`)
- **문제**: `showMemberSheet.value = false`가 API 호출 전에 먼저 실행됨. 배정 실패 시 토스트만 뜨고 시트가 닫힌 상태라서, 사용자는 슬롯을 다시 열고 회원을 다시 고르는 흐름을 반복해야 함. 모바일 UX 관점에서 컨텍스트 손실이 큼.
- **개선안**: 시트를 API 성공 후에 닫거나, 실패 시 시트를 다시 열어 맥락 유지.

#### 12. startReassignMode에서도 가용성 데이터가 stale
- **위치**: `TrainerScheduleView.vue:1071-1083`
- **문제**: `startReassignMode()`가 `currentWeekStart`를 바꾸고 주간 화면으로 전환하지만, 가용성/주간 보조 데이터를 다시 가져오지 않음. 월간→주간 전환과 동일한 stale 문제가 재배정 모드 진입 시에도 발생.
- **개선안**: `startReassignMode()` 내에서 `fetchMemberAvailabilities(currentWeekStart.value)` 호출 추가.

### Minor (개선 권장)

#### 13. 주간/월간 컨텐츠 전환 시 애니메이션 없음
- **위치**: `TrainerScheduleView.vue:16-31`
- **문제**: 탭 자체에는 `background-color`/`color` transition이 있으나, 컨텐츠 영역의 뷰 전환이 즉시 발생하여 갑자기 바뀜. 슬라이드나 페이드 전환이 있으면 맥락 유지에 도움.
- **개선안**: `<Transition>` 컴포넌트로 `v-if/v-else` 구간을 감싸서 페이드 전환 추가.

#### 15. 변경 요청 상세 바텀시트의 충돌 경고에 이모지 사용
- **위치**: `TrainerScheduleView.vue:278, 285`
- **문제**: "경고" 이모지가 하드코딩됨. 일부 기기에서 이모지 렌더링이 다르며, 디자인 시스템의 SVG 아이콘 패턴과 불일치. 주간 캘린더 충돌 라벨에도 동일한 이모지가 사용됨.
- **개선안**: SVG 경고 아이콘으로 교체하여 일관성 유지.

#### 16. 변경 요청 바텀시트 title이 빈 문자열
- **위치**: `TrainerScheduleView.vue:274`
- **문제**: `<AppBottomSheet v-model="showChangeRequestSheet" title="">`에서 title이 빈 문자열. 접근성 관점에서 바텀시트 자체에 의미 있는 title이 필요.
- **개선안**: `title="변경 요청 상세"`로 변경하고 내부 중복 헤더 제거, 또는 `aria-label` 추가.

#### 17. 접근성 전반 미흡
- **위치**: `TrainerScheduleView.vue:129` (월간 일정 article), `AppBottomSheet.vue:4`
- **문제**: 월간 일정 카드는 클릭 가능한 `article`이라 스크린리더/키보드 의미가 약함. `AppBottomSheet`에는 `role="dialog"`, `aria-modal`, 포커스 이동/복귀가 없음.
- **개선안**: 클릭 카드는 `button` 또는 `role="button" tabindex="0"`, 바텀시트는 dialog semantics와 focus trap 추가.

### Good (잘된 점)

- **주간/월간 각각에 맞는 로딩 UI**: 월간 뷰는 캘린더 그리드 형태의 스켈레톤, 주간 뷰는 `calendarLoading` 상태를 `AppWeeklyCalendar`에 전달하여 로딩 오버레이로 처리. 콘텐츠 형태에 맞는 로딩 경험.
- **드래그앤드롭 일정 재배정**: 주간 뷰에서 `draggable=true` + `@schedule-drop` 이벤트로 직관적인 일정 이동 지원.
- **충돌 감지 시스템**: `detectConflicts` 유틸리티를 활용하여 변경 요청 승인 시 기존 일정과의 시간 충돌을 자동 감지하고 경고.
- **변경 요청 상세 바텀시트의 시간 비교 UI**: "기존 vs 변경 요청" 시간을 나란히 비교하는 디자인이 직관적. 날짜가 같으면 "같은 날"로 표시하는 세심함.
- **race condition 방지**: `openScheduleDetail`에서 `capturedId`를 캡처하여 비동기 작업 중 다른 일정 선택 시 이전 결과를 무시하는 방어 코드.
- **회원 선택 시 가용성 정보 표시**: 빈 슬롯 탭 후 회원 선택 바텀시트에서 각 회원의 해당 시간 가용 상태(가능/불가/미입력)를 표시하고, 가용 회원 우선 정렬.

### 토스 앱 참고 개선안

1. **세그먼트 컨트롤 애니메이션**: 주간/월간 탭 전환 시 인디케이터가 좌우로 슬라이드하면 전환 맥락이 명확해짐.
2. **바텀시트 제스처 닫기**: `AppBottomSheet`에서 드래그 다운으로 닫기 기능. 핸들 바가 시각적으로 있으나 드래그 기능은 미구현.
3. **승인/거절 후 햅틱 피드백**: `navigator.vibrate`를 활용한 성공/실패 시 햅틱.
4. **일정 블록 미리보기**: 주간 캘린더의 블록을 long-press하면 상세 미리보기 팝오버.

### 구조 개선 제안 (참고용)

1. **바텀시트 4개를 컴포넌트로 분리**: `ScheduleDetailSheet.vue`, `ChangeRequestSheet.vue`, `MemberSelectSheet.vue`, `RejectSheet.vue`로 분리하면 현재 1200줄의 파일을 대폭 줄일 수 있음.
2. **`loadData` / `handleRefresh` 중복 로직 통합**: 두 함수의 로직이 매우 유사. 공통 함수로 추출.
3. **상수 정의 통합**: `STATUS_LABELS`, `STATUS_TO_DOT`, `ACTIVE_STATUSES` 등을 `@/utils/reservation.js`로 추출.
