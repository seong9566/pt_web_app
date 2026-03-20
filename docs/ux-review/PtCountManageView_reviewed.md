# PtCountManageView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec, gpt-5.4)
> 원본 파일: docs/ux-review/PtCountManageView.md
> 참조한 소스 파일: src/views/trainer/PtCountManageView.vue, PtCountManageView.css, src/composables/usePtSessions.js, src/composables/usePayments.js, src/stores/ptSessions.js, src/stores/members.js, src/components/AppBottomSheet.vue, src/utils/navigation.js, src/router/index.js, supabase/schema.sql
> 리뷰 라운드: 1회 (1차 판정: NEEDS_IMPROVEMENT -> 피드백 반영 완료, 2차 검증: codex 사용량 한도 도달로 미실행)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | pt_sessions 테이블에 update/delete RLS 정책 없어 이력 수정 실패 가능, edit 경로 캐시 무효화 누락, 횟수 추가+수납 부분 성공 시 중복 저장 위험, safeBack fallback 경로 미등록, 초기 0회 플래시, 조회 실패 무음 처리, #10(바텀 내비 spacer) 부정확 |

---

## 최종 리뷰 내용

## 개요
- **파일**: `src/views/trainer/PtCountManageView.vue` + `PtCountManageView.css`
- **역할**: 특정 회원의 PT 잔여 횟수를 조회하고, 횟수 추가/차감/이력 수정을 바텀시트를 통해 관리하는 화면
- **리뷰 일자**: 2026-03-20

## 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 3 | 보통 - 이력 스켈레톤/빈 이력 처리됨, 그러나 잔여 횟수 초기 0회 플래시, 조회 실패 무음 처리 |
| 터치 타겟 | 4 | 양호 - stepper 버튼 56px, 액션 버튼 52px |
| 스크롤/인터랙션 | 3 | 보통 - 바텀시트 활용 양호, 키보드 가림 리스크, 이력 수정의 백엔드 안정성 미보장 |
| 시각적 일관성 | 4 | 양호 - 디자인 토큰 활용 높음, 카드 스타일 일관적 |
| 접근성 | 3 | 보통 - stepper 접근성 부족, 이력 아이템에 role 없음 |
| 정보 밀도 | 5 | 우수 - 잔여 횟수 강조 + 액션 + 이력이 간결하게 구성됨 |
| 전체 사용성 | 3.5 | 양호 (단, 백엔드 안정성 이슈 해결 필요) |

## Critical (즉시 수정 필요)

### 1. 잔여 횟수 0회일 때 차감 시트를 열 수 있고, stepper가 이상하게 동작
- **위치**: `PtCountManageView.vue:55-63`, `349-354`, `395-398`
- **문제**: 잔여 횟수가 0인 상태에서도 "횟수 차감" 버튼을 누를 수 있고 바텀시트가 열린다. 기본값이 1이고 잔여가 0이므로 "저장"을 누르면 에러가 표시된다. 사용자가 불필요한 단계를 거치게 되는 나쁜 경험이다.
- **개선안**: 잔여 횟수가 0일 때 차감 버튼을 `disabled`로 처리한다.
```html
<button
  class="pt-count-manage__action-btn pt-count-manage__action-btn--deduct"
  :disabled="remainingCount <= 0"
  @click="openDeductSheet"
>
```

### 2. 이력 수정이 DB 정책(RLS) 부재로 실패할 수 있음 (추가 - Critical)
- **위치**: `src/composables/usePtSessions.js:updatePtSession()`, `supabase/schema.sql:808-825`
- **문제**: UI에서 이력 수정 기능을 제공하지만, **`pt_sessions` 테이블에는 `select`과 `insert` RLS 정책만 있고 `update`/`delete` 정책이 없다**. 현재 구조라면 수정 저장 시 Supabase에서 권한 오류가 발생할 가능성이 높다.
- **개선안**: (1) `pt_sessions`에 `update` 정책을 추가하거나, (2) 이력 직접 수정 대신 "정정 entry" 모델(원래 값을 역으로 차감하고 새 값을 추가)을 도입한다. 감사 추적 관점에서 후자가 더 안전하다.

### 3. 횟수 추가 + 수납 저장의 부분 성공 시 중복 저장 위험 (추가 - Critical)
- **위치**: `PtCountManageView.vue:356-386`
- **문제**: `handleAdd()`에서 PT 횟수를 먼저 저장한 뒤(`addSessions`) 수납을 저장한다(`createPayment`). **수납만 실패하면 시트는 열린 채로 남고, 사용자가 다시 "저장"을 누르면 PT 횟수가 중복 추가된다**.
- **개선안**: (1) 서버 트랜잭션/RPC로 묶거나, (2) PT 추가 성공 후 수납만 실패한 경우 "PT 횟수는 저장되었습니다. 수납 기록은 수납 관리 화면에서 별도로 추가해주세요" 메시지를 표시하고 시트를 닫는다.

### 4. 이력 수정 후 캐시 무효화 누락 (추가 - Critical)
- **위치**: `PtCountManageView.vue:412-430`
- **문제**: `handleEdit()` 성공 시 `fetchPtHistory()`만 호출하지만, store 캐시(`ptSessionsStore`)를 무효화하지 않는다. 또한 `membersStore.invalidate()`도 호출하지 않아 회원 목록의 잔여 횟수가 stale 상태로 남을 수 있다. add/deduct 경로에서는 두 store를 모두 무효화하는데 edit 경로만 빠져 있다.
- **개선안**: `handleEdit()` 성공 시 `ptSessionsStore.invalidate()`와 `membersStore.invalidate()`를 추가한다.

## Major (높은 우선순위)

### 5. 이력 수정 시 부호 변경(추가<->차감) 불가
- **위치**: `PtCountManageView.vue:159-203`, `341`
- **문제**: 이력 수정 바텀시트에서 `editIsPositive`가 원본의 부호를 따르며, 사용자가 이를 변경할 UI가 없다. 삭제 기능도 없다.
- **개선안**: 수정 시트에 추가/차감 토글을 추가하거나, 이력 삭제 기능을 제공한다.

### 6. 바텀시트 열린 상태에서 키보드가 콘텐츠를 가릴 수 있음
- **위치**: `PtCountManageView.vue:119-155`, `AppBottomSheet.vue:77,109`
- **문제**: 추가 바텀시트에 3개의 input이 있다. 모바일에서 하단 input을 탭하면 키보드가 올라오면서 저장 버튼이 키보드 뒤로 숨을 수 있다. AppBottomSheet에 viewport 대응 로직이 없다.
- **개선안**: input 포커스 시 `scrollIntoView`를 호출하거나, iOS에서 `visualViewport` API를 활용한다.

### 7. 결제 금액 입력에 천단위 구분자 없음
- **위치**: `PtCountManageView.vue:139-145`
- **문제**: `type="number"` input은 "500000" 같은 금액을 입력할 때 천단위 구분자가 없어 읽기 어렵다.
- **개선안**: `type="text"` + `inputmode="numeric"`으로 변경하고, `@input` 핸들러에서 숫자만 추출 + 천단위 쉼표 포맷을 적용한다.

### 8. 초기 로딩 시 잔여 횟수 0회 플래시 (추가)
- **위치**: `PtCountManageView.vue:33-42`, `src/composables/usePtSessions.js:23`
- **문제**: `remainingCount`는 `ptHistory` 배열 기반 computed이다. 초기 `ptHistory`가 빈 배열이므로 데이터 로딩 전에 **잔여 횟수가 `0회`로 표시**되고, 이력도 "변동 이력이 없습니다"로 보인다. 조회 실패도 사실상 무음 처리된다.
- **개선안**: 페이지 단위 `initialLoading` 상태를 두고, 로딩 중에는 잔여 횟수 카드도 스켈레톤으로 표시한다.

### 9. 직접 진입/새로고침 시 뒤로가기가 예상과 다르게 동작 (추가)
- **위치**: `PtCountManageView.vue:6`, `src/utils/navigation.js:11`
- **문제**: `safeBack(route.path)`를 사용하는데, fallback map에 동적 경로 `/trainer/members/:id/pt-count`가 등록되어 있지 않다. 직접 URL 진입 시 뒤로가기가 `/login`으로 이동할 수 있다.
- **개선안**: `route.name` 기반 fallback이나 `trainer-member-detail`로 명시 이동한다.

## Minor (개선 권장)

### 10. 변동 이력에 날짜 그룹핑 없음
- **위치**: `PtCountManageView.vue:73-94`
- **문제**: 모든 이력이 flat list로 표시된다. 이력이 많아지면 특정 날짜의 변동을 찾기 어렵다.
- **개선안**: 날짜별 섹션 헤더를 추가하여 그룹핑하면 가독성이 향상된다.

### 11. stepper에 접근성 속성 부재
- **위치**: `PtCountManageView.vue:104-117`
- **문제**: stepper의 `-`/`+` 버튼에 `aria-label`이 없고, 이력 row도 `li@click`이라 포커스/역할이 없다.
- **개선안**: `-` 버튼에 `aria-label="횟수 감소"`, `+` 버튼에 `aria-label="횟수 증가"`, 값 표시에 `aria-live="polite"`를 추가한다.

### 12. 이력 수정 시트에 결제 금액 필드 없음
- **위치**: `PtCountManageView.vue:158-204`
- **문제**: 추가 시트에는 결제 금액 필드가 있지만 수정 시트에는 없다.
- **개선안**: 수정 시트에도 결제 금액 필드를 추가하거나, 추가 시트에서 "결제 금액은 수납 기록에서 별도 수정 가능"이라는 안내 문구를 추가한다.

### 13. 차감 시트에 날짜 선택 필드 없음
- **위치**: `PtCountManageView.vue:207-243`
- **문제**: 추가 시트에는 날짜 선택이 있지만 차감 시트에는 없다. `deductSessions()` composable 함수도 날짜 인자를 지원하지 않는다.
- **개선안**: composable부터 날짜 파라미터를 지원하도록 수정한 뒤 차감 시트에도 날짜 필드를 추가한다.

### 14. 에러 메시지 위치가 저장 버튼 바로 위 - 스크롤 시 보이지 않을 수 있음
- **위치**: `PtCountManageView.vue:149`
- **문제**: 에러 발생 시 저장 버튼 바로 위에 표시된다. 폼이 스크롤된 상태에서는 에러 메시지가 뷰포트 밖에 있을 수 있다.
- **개선안**: 에러 발생 시 에러 메시지 요소로 `scrollIntoView`하거나, 저장 버튼 내부에 인라인으로 에러 상태를 표시한다. (3번 키보드 가림의 파생 이슈에 가까우므로 우선순위를 Minor로 조정)

## Good (잘된 점)
- **잔여 횟수 시각적 강조**: 큰 숫자 + 파란색으로 잔여 횟수가 화면 최상단에 눈에 띄게 표시된다 (단, 초기 0회 플래시 해결 필요).
- **stepper UI**: 숫자를 직접 입력하는 대신 +/- 버튼을 제공하여 모바일에서 오입력을 줄인다. 버튼 크기(56px)도 적절하다.
- **이력 아이템 탭으로 수정**: 이력을 탭하면 바텀시트로 수정할 수 있어 직관적인 인터랙션이 가능하다 (단, DB RLS 정책 추가 필요).
- **추가/차감 색상 구분**: 이력의 `+`는 초록색, `-`는 빨간색으로 시각적 구분이 명확하다.
- **연결 상태 검증**: 3단계 연결 확인을 수행하여 미연결 회원에 대한 잘못된 조작을 방지한다.
- **스토어 무효화 연쇄**: add/deduct 경로에서 `ptSessionsStore.invalidate()`와 `membersStore.invalidate()`를 모두 호출한다 (단, edit 경로에서도 동일하게 적용 필요).
- **폼 초기화**: 바텀시트를 열 때마다 폼값을 초기화하여 이전 입력이 남지 않는다.
- **hideNav: true 설정**: 라우트 메타에 `hideNav: true`가 설정되어 있어 바텀 내비게이션이 표시되지 않으므로 spacer가 불필요하다.

## 토스 앱 참고 개선안

### 금액 입력 UX
- 토스 앱의 송금 화면처럼, 금액 입력 시 실시간으로 천단위 쉼표가 적용되고 큰 폰트로 금액이 표시된다.

### 이력 삭제 기능
- 토스 앱은 리스트 아이템을 길게 누르거나 스와이프하여 삭제할 수 있다. 현재는 수정만 가능하고 삭제가 불가하여 잘못 기록된 이력을 제거할 방법이 없다.

### 변경 내역 시각적 타임라인
- 토스의 거래 내역처럼, 날짜별 그룹핑 + 잔여 횟수 누적 표시를 하면 횟수 변동 흐름을 한눈에 파악할 수 있다.

### 잔여 횟수 경고
- 잔여 횟수가 특정 임계값(예: 3회 이하) 이하일 때 색상을 주황/빨강으로 변경하고 안내를 추가하면 트레이너가 회원에게 재등록을 안내하는 타이밍을 놓치지 않을 수 있다.

### 감사 추적 모델
- 토스 수준이면 과거 이력을 직접 수정/삭제하기보다 "정정 entry" 모델(역방향 기록 추가)이 더 적절하다. 원본 데이터의 불변성을 보장하면서 오류를 수정할 수 있다.

## 구조 개선 제안 (참고용)

### 바텀시트 폼 컴포넌트화
- 추가/차감/수정 3개의 바텀시트가 유사한 구조(stepper + input + submit)를 가진다. 공통 폼 컴포넌트로 추출하면 중복을 줄이고 일관성을 보장할 수 있다.

### stepper 공통 컴포넌트
- stepper UI가 3번 반복된다. `AppStepper.vue` 컴포넌트로 추출하면 재사용성과 접근성을 한 번에 개선할 수 있다.

### PT 추가 + 수납의 원자성 보장
- 서버 사이드 RPC (Supabase function)로 PT 횟수 추가와 수납 기록 생성을 하나의 트랜잭션으로 묶으면 부분 성공 문제를 근본적으로 해결할 수 있다.
