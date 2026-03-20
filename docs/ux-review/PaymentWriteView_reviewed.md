# PaymentWriteView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/PaymentWriteView.md
> 참조한 소스 파일: src/views/trainer/PaymentWriteView.vue, src/views/trainer/PaymentWriteView.css, src/composables/usePayments.js, src/composables/useConnection.js, src/utils/navigation.js, src/router/index.js, src/assets/css/global.css, supabase/schema.sql
> 리뷰 라운드: 2회 (최종 판정: 라운드 2 피드백 반영 완료)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | form-error-text 미정의는 오분석(글로벌 CSS에 정의됨), 800ms 딜레이 분석에서 "중복 제출"보다 "타이머 미정리/이중 내비게이션"이 핵심, safeBack fallback 경로 불일치 누락, 정수 금액 검증 부재 누락, 접근성 속성 부재 누락, 100vh 모바일 viewport 리스크 누락, 디자인 토큰 "준수"는 "부분 준수"로 수정 필요 |
| 2 | NEEDS_IMPROVEMENT | Critical 1 서술 강화 필요(성공 후 800ms 구간에서 실제 중복 저장 가능), Major 3 비교 근거 수정(MemoWriteView만 텍스트 로딩, 나머지는 스켈레톤), Major 4 표현 다듬기(데이터 무결성보다 서버 에러 귀결), Major 5 심각도 하향(비즈니스 룰 확인 필요 수준), 잘된 점의 "실시간 검증"과 "중복 제출 방지" 표현 수정, 연결 확인 실패를 미연결로 오인 표시하는 문제 누락, 뒤로가기 버튼 40x40 터치 타겟 미지적 |

---

## 최종 리뷰 내용

## 개요
- **파일**: `src/views/trainer/PaymentWriteView.vue` + `PaymentWriteView.css`
- **역할**: 트레이너가 특정 회원에 대한 새 수납(결제) 기록을 등록하는 폼 화면

## 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 3 | 보통 - 연결 확인 로딩이 텍스트만 표시, 스켈레톤 없음 |
| 터치 타겟 | 3 | 보통 - input 48px 적절하나 뒤로가기 버튼 40px로 44px 미달 |
| 스크롤/인터랙션 | 4 | 양호 - 키보드 대응, 고정 footer 구조 |
| 시각적 일관성 | 3 | 보통 - 디자인 토큰 부분 준수, 인라인 스타일과 raw px 일부 사용 |
| 접근성 | 3 | 보통 - label for 연결 완비되나 뒤로가기 aria-label 없음, aria-invalid 미사용 |
| 정보 밀도 | 5 | 우수 - 3개 필드만으로 간결한 구성 |
| 전체 사용성 | 3.5 | 양호 - 폼 화면으로서 기본 완성도 높으나 내비게이션/검증 개선 필요 |

---

## 🔴 Critical (즉시 수정 필요)

### 1. 저장 성공 후 `setTimeout(800ms)` 딜레이로 중복 저장 가능 + 타이머 미정리
- **위치**: `PaymentWriteView.vue:189-191`
- **현재**: `showSuccess('저장되었습니다')` 후 `setTimeout(() => safeBack(route.path), 800)`
- **문제**:
  - `createPayment()`의 `finally`에서 `loading`이 즉시 `false`로 돌아오므로, 800ms 대기 구간 동안 저장 버튼이 다시 활성화됨. 실제 중복 저장이 가능.
  - 타이머가 컴포넌트 언마운트 시 정리되지 않아, 사용자가 타이머 실행 전 뒤로가기를 누르면 이중 내비게이션이 발생할 수 있음.
- **개선안**: 성공 후 즉시 이전 화면으로 이동하거나, 별도 `saved` 상태로 폼 전체를 비활성화하고 타이머 id를 보관해 `onUnmounted`에서 정리.
```js
if (success) {
  showSuccess('저장되었습니다')
  safeBack(route.path)
}
```

### 2. `safeBack` fallback 경로 불일치 — 내비게이션 오동작 가능
- **위치**: `PaymentWriteView.vue:7,191`, `src/utils/navigation.js`, `src/router/index.js`
- **현재**: `safeBack(route.path)`로 호출하나, 실제 라우트 경로는 `/trainer/members/:id/payment/write`이고 `navigation.js`의 fallback 맵에는 이 동적 패턴이 등록되어 있지 않음.
- **문제**: 히스토리 없이 직접 URL로 진입하면 뒤로가기나 저장 후 이동이 회원 수납 목록이 아니라 `/login` 등 예기치 않은 경로로 이동할 수 있음.
- **개선안**: 명시적 fallback 경로를 전달하거나, `route.name` 기반 매핑으로 변경.

---

## 🟠 Major (높은 우선순위)

### 3. 연결 확인 로딩 시 스켈레톤 대신 텍스트 표시
- **위치**: `PaymentWriteView.vue:29-31`
- **현재**: `<p>불러오는 중...</p>` 텍스트만 표시
- **문제**: MemberPaymentView와 TrainerChatView는 스켈레톤 UI를 사용하는 반면, PaymentWriteView와 MemoWriteView만 텍스트 로딩 사용. 시각적 일관성 부족.
- **개선안**: 폼 구조를 반영한 스켈레톤으로 교체.

### 4. 금액 필드 정수 검증 부재
- **위치**: `PaymentWriteView.vue:48-54`, `150-157` (validateAmount)
- **현재**: `type="number"`와 `min="1"`만 설정. 소수점, `e` 표기 등 비정상 입력이 프런트에서 통과할 수 있음. DB 스키마는 `int` 타입이므로 서버 에러로 귀결될 가능성이 높음.
- **개선안**: `step="1"`, `inputmode="numeric"` 추가. 검증 로직에 `Number.isInteger()` 체크 포함.
```js
function validateAmount() {
  const parsedAmount = Number(amount.value)
  if (!amount.value || parsedAmount <= 0 || !Number.isInteger(parsedAmount)) {
    amountError.value = '금액을 올바르게 입력해 주세요 (정수만 가능)'
  } else {
    amountError.value = ''
  }
}
```

### 5. 연결 확인 실패를 "연결되지 않은 회원"으로 오인 표시
- **위치**: `PaymentWriteView.vue:16-27`, `src/composables/useConnection.js:14-22`
- **현재**: `isActiveConnection()`은 Supabase 쿼리 오류를 별도 처리하지 않고 `!!data`만 반환. 네트워크/권한 오류 시에도 `false`가 반환되어 "연결되지 않은 회원입니다" 화면이 표시됨.
- **문제**: 네트워크 오류와 실제 미연결 상태를 구분할 수 없어 사용자가 혼란을 겪을 수 있음.
- **개선안**: `isActiveConnection`에서 에러를 별도로 반환하거나, `null`(로딩)/`false`(미연결)/`true`(연결)/`'error'`(에러) 등으로 상태를 세분화.

### 6. 뒤로가기 버튼 터치 타겟 및 접근성 이름 부재
- **위치**: `PaymentWriteView.vue:7`, `PaymentWriteView.css:25-37`
- **현재**: 뒤로가기 버튼 `40x40`으로 모바일 권장치 44px 미달. `aria-label`도 없음.
- **개선안**: `44x44`로 확대, `aria-label="뒤로가기"` 추가.

---

## 🟡 Minor (개선 권장)

### 7. 금액 최대값 제한 없음 (비즈니스 룰 확인 필요)
- **위치**: `PaymentWriteView.vue:49`
- **현재**: 최대값 제한 없음. DB `int` 타입의 최대값(약 21억)이 사실상 상한.
- **문제**: 비정상적으로 큰 금액 입력 방지가 프런트에서 되지 않음. 다만 비즈니스 정책이 정해져 있지 않으므로 정책 확인 후 결정 필요.
- **개선안**: PT 수납 컨텍스트에서 합리적인 상한을 정한 후 input `max` + 유효성 검증 + DB 체크 제약을 함께 적용.

### 8. 미래 날짜 제한 없음 (비즈니스 룰 확인 필요)
- **위치**: `PaymentWriteView.vue:69`
- **현재**: `type="date"` input에 `max` 속성 없음. 선수금/예정일 등 미래 날짜가 유효한 케이스도 있을 수 있음.
- **개선안**: 정책상 미래 날짜를 금지한다면 `max` 속성에 오늘 날짜 바인딩.

### 9. 저장 버튼에 입력 상태 기반 활성화 없음
- **위치**: `PaymentWriteView.vue:98-104`
- **현재**: `:disabled="loading"` — 로딩 중에만 비활성화. 날짜는 기본값이 오늘로 채워져 있으나, 금액이 비어 있어도 버튼이 활성 상태.
- **개선안**: `:disabled="loading || !amount"` 조건 추가.

### 10. 뒤로가기 시 작성 중인 내용 유실 경고 없음
- **위치**: `PaymentWriteView.vue:7`
- **현재**: 금액이나 메모를 입력한 상태에서 뒤로가기를 누르면 확인 없이 즉시 이전 화면으로 이동.
- **개선안**: 앱에 이미 `useConfirm`과 `AppConfirmDialog`가 있으므로, 공통 다이얼로그로 이탈 방지 구현.

### 11. input 높이 48px vs 다른 화면 52px 불일치
- **위치**: `PaymentWriteView.css:142`
- **현재**: input wrap 높이 `48px`, MemberPaymentView 수정 바텀시트는 `52px`.
- **개선안**: `--input-height` 토큰 정의 후 통일.

### 12. 모바일 viewport 대응 취약 — `100vh` 사용
- **위치**: `PaymentWriteView.css:7`
- **현재**: `.pay-write { height: 100vh; }`
- **문제**: iOS 모바일 브라우저에서 키보드와 주소창 변화로 가시 영역과 불일치.
- **개선안**: `100dvh` fallback 적용.
```css
.pay-write {
  height: 100vh;
  height: 100dvh;
}
```

---

## 잘된 점

- **label-input 연결 완비**: `for="pay-amount"`, `for="pay-date"`, `for="pay-memo"` 모두 정확하게 연결되어 접근성 양호.
- **blur 기반 유효성 검증 + 에러 즉시 해제**: `@blur` 이벤트에서 필드 유효성 검증 실행. 금액 필드는 입력 중 에러를 즉시 해제(`@input="amountError = ''"`)하여 자연스러운 흐름.
- **에러 input 시각적 피드백**: `pay-write__input-wrap--error` 클래스로 border 색상이 빨간색으로 변하여 문제 필드 명확히 표시.
- **footer 고정 패턴**: `flex-shrink: 0` + `border-top`으로 저장 버튼이 항상 화면 하단에 고정. `safe-area-inset-bottom` 대응 포함.
- **number input 스피너 숨김**: CSS에서 스피너를 제거하여 깔끔한 금액 입력 UI 제공.
- **loading 중 중복 제출 방지**: `handleSave` 시작부에 `if (loading.value) return` 가드가 있고 버튼도 `:disabled="loading"`으로 이중 방어. (단, 성공 후 800ms 구간에서는 방어가 풀리는 점은 Critical 1에서 지적.)

---

## 토스 앱 참고 개선안

### 금액 입력 UX
토스의 송금 화면처럼 커스텀 넘패드 또는 `inputmode="numeric"`으로 숫자 키보드 우선 표시. 실시간 천단위 콤마 포맷팅으로 큰 금액의 가독성 향상.

### 저장 완료 피드백
체크마크 애니메이션 + 간단한 요약(금액, 날짜)을 0.8~1초간 표시한 후 자동 이동하면 안도감 제공.

### 폼 진행 상태 표시
필수 필드 완료 시 저장 버튼 색상/상태가 변하는 프로그레시브 디스클로저 패턴 적용.

---

## 구조 개선 제안 (참고용)

### AppFormField 공통 컴포넌트
label + input-wrap + error 메시지 패턴이 PaymentWriteView와 MemberPaymentView에서 반복됨. `AppFormField` 컴포넌트로 추출하면 일관성 보장 + `aria-invalid`/`aria-describedby` 자동 처리 가능.

### 미사용 CSS 클래스 정리
`PaymentWriteView.css:316-320`의 `.pay-write__field-error`가 현재 미사용(dead style). 에러 메시지는 글로벌 `.form-error-text` 클래스를 사용 중. 미사용 클래스 정리 또는 BEM 클래스로 통일 필요.
