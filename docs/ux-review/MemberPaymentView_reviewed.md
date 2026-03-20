# MemberPaymentView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/MemberPaymentView.md
> 참조한 소스 파일: src/views/trainer/MemberPaymentView.vue, src/views/trainer/MemberPaymentView.css, src/composables/usePayments.js, src/composables/useConnection.js, src/components/AppBottomSheet.vue, src/assets/css/global.css
> 리뷰 라운드: 2회 (최종 판정: 라운드 2 피드백 반영 완료)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 정렬 기준 오판(composable에서 이미 정렬), 삭제 후 화면 반영 설명 오류(배열 즉시 필터링됨), 에러-빈 상태 위장 문제 누락, 삭제 시 전체 스켈레톤 전환 누락, 아이콘 버튼 접근성 이름 부재 누락, 로딩/에러 점수 과대평가 |
| 2 | NEEDS_IMPROVEMENT | 삭제 실패 피드백은 error watcher로 이미 존재(표현 수정 필요), 뒤로가기 버튼 40x40 터치 타겟 미지적, 수정 성공 후 재조회 실패 시 stale UI 문제 누락 |

---

## 최종 리뷰 내용

## 개요
- **파일**: `src/views/trainer/MemberPaymentView.vue` + `MemberPaymentView.css`
- **역할**: 트레이너가 특정 회원의 수납(결제) 기록을 조회, 수정, 삭제하고 새 수납을 등록(FAB)하는 화면

## 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 2 | 미흡 - 에러와 빈 상태가 구분되지 않음, 삭제 시 전체 스켈레톤 전환 |
| 터치 타겟 | 2 | 미흡 - 수정/삭제 버튼 36px, 뒤로가기 버튼 40px로 모바일 최소 기준(44px) 미달 |
| 스크롤/인터랙션 | 3 | 보통 - 풀투리프레시 없음, 바텀시트 전환은 양호 |
| 시각적 일관성 | 4 | 양호 - 디자인 토큰 활용 우수, BEM 네이밍 일관적 |
| 접근성 | 2 | 미흡 - label 연결 누락, 아이콘 버튼에 aria-label 전반 부족 |
| 정보 밀도 | 4 | 양호 - 요약 카드 + 목록 구조 적절 |
| 전체 사용성 | 3 | 보통 - 핵심 플로우 완성도 높으나 에러 처리, 터치 타겟, 삭제 UX 개선 필요 |

---

## 🔴 Critical (즉시 수정 필요)

### 1. 수정/삭제 버튼 터치 타겟 36px + 뒤로가기 버튼 40px — 모바일 최소 기준(44px) 미달
- **위치**: `MemberPaymentView.css:344-381` (`.payment-card__edit`, `.payment-card__delete`), `MemberPaymentView.css:23-35` (`.payment-view__back`)
- **현재**: 수정/삭제 버튼 `width: 36px; height: 36px`, 뒤로가기 버튼 `width: 40px; height: 40px`
- **문제**: 480px 모바일 화면에서 36px 버튼 두 개가 나란히 배치되어 오탭(mis-tap) 발생 가능성 높음. 삭제 버튼은 오작동 시 데이터 손실 위험. 뒤로가기 버튼도 44px 미달.
- **개선안**: 모든 아이콘 버튼을 최소 `44px x 44px`로 확대. 수정/삭제 버튼 간 간격도 최소 8px 확보.
```css
.payment-card__edit,
.payment-card__delete {
  width: 44px;
  height: 44px;
}
.payment-view__back {
  width: 44px;
  height: 44px;
}
```

### 2. 삭제 성공 피드백 부재
- **위치**: `MemberPaymentView.vue:291-295` (`handleDelete`)
- **현재**: `confirm()` 후 `deletePayment(id)`만 호출. 삭제 성공 시 `usePayments.js`에서 `payments` 배열을 즉시 필터링하여 화면에서 카드가 제거되지만, 사용자에게 명시적인 성공 토스트가 없음. (참고: 삭제 실패 시에는 `error` watcher를 통해 에러 토스트가 이미 표시됨.)
- **문제**: 카드가 사라지지만 "삭제되었습니다" 같은 명시적 피드백이 없어 사용자가 삭제 완료를 확신하기 어려움.
- **개선안**: 삭제 성공 시 성공 토스트 추가.
```js
async function handleDelete(id) {
  if (hasActiveConnection.value !== true) return
  if (!await confirm('이 수납 기록을 삭제하시겠습니까?')) return
  const success = await deletePayment(id)
  if (success) {
    showToast('삭제되었습니다', 'success')
  }
}
```

### 3. 에러 상태가 빈 상태로 위장되는 문제
- **위치**: `MemberPaymentView.vue:37-44` (로딩), `83-91` (빈 상태), `302` (에러 watcher)
- **현재**: 초기 `fetchPayments()` 실패 시 toast만 표시되고, 본문은 `payments.length === 0` 분기로 "수납 기록이 없습니다"를 보여줌.
- **문제**: 네트워크 오류로 데이터를 못 가져온 건지, 실제로 수납 기록이 없는 건지 구분 불가. 토스 앱 수준의 UX에서는 fetch 실패를 toast만으로 처리하면 안 됨.
- **개선안**: `loading === false && error && payments.length === 0` 전용 에러 화면과 "다시 시도" 버튼 추가.
```html
<div v-else-if="error && payments.length === 0" class="payment-error">
  <p>데이터를 불러오지 못했습니다</p>
  <AppButton variant="secondary" @click="fetchPayments(memberId)">다시 시도</AppButton>
</div>
```

### 4. 삭제 시 전체 화면이 스켈레톤으로 전환됨
- **위치**: `MemberPaymentView.vue:37-44`, `usePayments.js`
- **현재**: `deletePayment`도 같은 `loading` ref를 사용하며, `loading && !showEditSheet`이면 전체 스켈레톤으로 전환.
- **문제**: 삭제 한 건에 전체 목록이 스켈레톤으로 바뀌면 사용자 맥락이 깨짐.
- **개선안**: `isFetching`, `isSaving`, `deletingId` 등으로 로딩 상태를 분리. 초기 로딩만 스켈레톤 처리하고, 삭제는 해당 카드만 비활성화/로딩 표시.

---

## 🟠 Major (높은 우선순위)

### 5. 수정 바텀시트 전체 필드에 label `for` 연결 없음
- **위치**: `MemberPaymentView.vue:160-193`
- **현재**: 금액, 날짜, 메모 세 필드 모두 `<label>`에 `for` 속성이 없고, `<input>`에 `id`도 없음.
- **문제**: 모바일에서 레이블을 탭해도 input이 포커스되지 않아 사용성 저하. 스크린리더 사용자에게도 연결 정보 없음.
- **개선안**: 세 필드 모두 `id` 부여, label에 `for` 연결.
```html
<label class="payment-edit-form__label" for="edit-amount">금액</label>
<input id="edit-amount" class="payment-edit-form__input" ... />
<label class="payment-edit-form__label" for="edit-date">날짜</label>
<input id="edit-date" class="payment-edit-form__input" ... />
<label class="payment-edit-form__label" for="edit-memo">메모 (선택)</label>
<input id="edit-memo" class="payment-edit-form__input" ... />
```

### 6. FAB 버튼이 연결되지 않은/로딩 중 상태에서도 렌더링됨
- **위치**: `MemberPaymentView.vue:150-154`
- **현재**: FAB는 `v-if` 없이 항상 렌더링됨.
- **문제**: 연결되지 않은 회원 화면이나 로딩 중(`hasActiveConnection === null`)에도 "+" FAB가 보이면 사용자는 등록 가능하다고 오인.
- **개선안**: `v-if="hasActiveConnection === true"` 조건 추가.

### 7. 아이콘 버튼에 접근성 이름 부재
- **위치**: `MemberPaymentView.vue:7` (뒤로가기), `115-137` (수정/삭제), `150` (FAB)
- **현재**: 뒤로가기와 FAB 버튼에는 `aria-label`이 없고, 수정/삭제는 `title`만 있음.
- **문제**: 스크린리더 사용자에게 버튼 기능이 전달되지 않음.
- **개선안**: 각 버튼에 `aria-label` 추가.
```html
<button class="payment-view__back" aria-label="뒤로가기" @click="safeBack(route.path)">
<button class="payment-card__edit" aria-label="수납 수정" @click="openEditSheet(payment)">
<button class="payment-card__delete" aria-label="수납 삭제" @click="handleDelete(payment.id)">
<button class="payment-view__fab" aria-label="수납 등록" @click="goToWrite">
```

### 8. 수정 성공 후 재조회 실패 시 stale UI
- **위치**: `MemberPaymentView.vue:277-289` (`handleEdit`)
- **현재**: `updatePayment()` 성공 후 `fetchPayments(memberId)`를 호출하지만, 재조회 성공 여부는 확인하지 않음. 재조회가 실패하면 바텀시트는 닫히지만 목록은 이전 데이터로 남음.
- **개선안**: `fetchPayments` 결과를 확인하고, 실패 시 사용자에게 알림 또는 재시도 유도.

---

## 🟡 Minor (개선 권장)

### 9. 수정 바텀시트에서 금액 input의 number 스피너 미숨김
- **위치**: `MemberPaymentView.css` (해당 스타일 없음)
- **현재**: `type="number"` input이지만 스피너 숨김 CSS가 없음. PaymentWriteView.css에는 스피너 숨김이 있음(180-189행).
- **개선안**: 동일한 스피너 숨김 CSS 적용.

### 10. 수정 바텀시트에서 저장 중 중복 클릭 방지 가드 보강
- **위치**: `MemberPaymentView.vue:196-199`
- **현재**: `:disabled="loading"`으로 제어하나, `handleEdit` 함수에 `if (loading.value) return` 가드가 없음. composable에서 즉시 `loading = true`로 바꾸기 때문에 실제 위험은 낮으나 방어적 코딩 권장.
- **개선안**: `handleEdit` 시작부에 `if (loading.value) return` 추가.

### 11. 수정 성공 후 토스트 피드백 없음
- **위치**: `MemberPaymentView.vue:283-289`
- **현재**: 수정 성공 시 바텀시트만 닫힘. 사용자에게 "저장 완료" 같은 피드백 없음.
- **개선안**: `showToast('수정되었습니다', 'success')` 추가.

### 12. 연결 상태 확인 중 스켈레톤과 데이터 로딩 스켈레톤 간 시각적 차이
- **위치**: `MemberPaymentView.vue:29-32` vs `37-44`
- **현재**: 연결 확인 중에는 circle + line 스켈레톤, 데이터 로딩 중에는 rect + line 스켈레톤.
- **개선안**: 최종 화면 구조와 유사한 형태의 스켈레톤으로 통일. 우선순위는 낮음.

---

## 잘된 점

- **3단 상태 처리**: `hasActiveConnection`이 `null`(로딩) / `false`(미연결) / `true`(연결) 3단계로 명확히 구분되어 상태별 UI 분기가 깔끔함.
- **바텀시트 활용**: 수정 폼을 별도 페이지 대신 바텀시트로 처리하여 맥락 전환 없이 빠르게 수정 가능. AppBottomSheet 컴포넌트의 Transition 트랜지션, `@touchmove.stop` 스크롤 잠금, `safe-area-inset-bottom` 대응 우수.
- **FAB 버튼 디자인**: 56px 크기, 그림자, active 스케일 피드백, 480px 이상에서의 위치 보정(`@media`)까지 잘 구현됨.
- **디자인 토큰 일관성**: CSS 변수를 적극 활용하여 색상, 폰트, 간격, 라운딩 등이 디자인 시스템과 일치.
- **정렬 보장**: `usePayments.js`에서 `payment_date` 내림차순 정렬이 composable 레벨에서 보장됨.

---

## 토스 앱 참고 개선안

### 금액 입력 UX 개선
토스 앱의 송금 화면처럼 금액 입력 시 실시간 천단위 콤마 포맷팅을 적용하면 가독성이 크게 향상됨. `type="text"` + `inputmode="numeric"` + JavaScript 포맷팅 조합 사용.

### 삭제 인터랙션
토스 앱 스타일의 "스와이프 투 딜리트" 또는 카드 롱프레스 후 액션 시트 표시 방식을 고려. 수정/삭제 아이콘이 항상 노출되는 현재 방식의 정보 밀도 문제 해결 가능.

### 요약 카드 애니메이션
금액이 변경될 때(삭제, 수정 후) 숫자가 카운트업/다운 애니메이션으로 변하면 "무언가 바뀌었다"는 피드백을 시각적으로 전달 가능.

---

## 구조 개선 제안 (참고용)

### 인라인 SVG 컴포넌트화
동일한 카드(결제) 아이콘 SVG가 요약 카드, 빈 상태, 개별 카드에서 3번 반복됨. `AppIcon` 또는 전용 SVG 컴포넌트로 추출하면 유지보수성 향상.

### 연결 상태 확인 로직 공통화
`hasActiveConnection` 패턴이 MemberPaymentView, PaymentWriteView, TrainerChatView 3개 화면에서 동일하게 반복됨. `useActiveConnectionGuard` 같은 composable로 추출하면 중복 제거 가능.

### 로딩 상태 세분화
`usePayments`의 단일 `loading` ref가 조회, 수정, 삭제 모든 작업에 사용되어 UI 부작용이 발생함. `isFetching`, `isSaving`, `isDeleting` 등으로 분리 권장.
