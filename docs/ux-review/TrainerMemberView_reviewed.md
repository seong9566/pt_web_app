# TrainerMemberView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec, gpt-5.4)
> 원본 파일: docs/ux-review/TrainerMemberView.md
> 참조한 소스 파일: src/views/trainer/TrainerMemberView.vue, TrainerMemberView.css, src/composables/useMembers.js, src/composables/useTrainerSearch.js, src/stores/members.js, src/components/AppPullToRefresh.vue, src/App.vue, src/assets/css/global.css, supabase/schema.sql
> 리뷰 라운드: 1회 (1차 판정: NEEDS_IMPROVEMENT -> 피드백 반영 완료, 2차 검증: codex 사용량 한도 도달로 미실행)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 종합평가 점수 과대, #2 실패 피드백 누락, #3 에러 전달 구조 미분석, #8 store 동기화 문제 누락, 검색 결과/빈 상태 미분리, 회원 목록 로드 실패 무음 처리, PT 횟수 표기 혼동, 접근성 부재 범위 과소 |

---

## 최종 리뷰 내용

## 개요
- **파일**: `src/views/trainer/TrainerMemberView.vue` + `TrainerMemberView.css`
- **역할**: 트레이너가 연결된 회원 목록을 조회하고, 대기 중인 연결 요청을 승인/거절하는 메인 회원관리 화면
- **리뷰 일자**: 2026-03-20

## 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 3 | 보통 - 스켈레톤/빈 상태는 구현되었으나, 대기 탭 에러 미처리, 회원 목록 로드 실패 무음 처리, 검색 결과 없음과 빈 상태 미분리 |
| 터치 타겟 | 3 | 보통 - 승인/거절(34px), 초대하기(36px), 정렬 버튼 등 여러 버튼이 44px 미달 |
| 스크롤/인터랙션 | 3 | 보통 - Pull-to-refresh는 있으나 store/로컬 상태 동기화 불완전, 탭별 갱신 미분기 |
| 시각적 일관성 | 4 | 양호 - 디자인 토큰 대부분 준수, 일부 하드코딩 존재 |
| 접근성 | 2 | 미흡 - aria 속성 부재, 클릭 가능한 div 카드, 검색 input label 없음, 정렬 버튼 미구현 |
| 정보 밀도 | 4 | 양호 - 통계 카드 + 목록이 적절히 구성됨 (단, PT 횟수 표기 혼동 가능) |
| 전체 사용성 | 3 | 보통 |

## Critical (즉시 수정 필요)

### 1. 정렬 버튼("최신순")이 동작하지 않음
- **위치**: `TrainerMemberView.vue:96-101`
- **문제**: "최신순" 정렬 버튼에 `@click` 핸들러가 없다. 사용자가 정렬 기능을 기대하고 탭하지만 아무 반응이 없어 혼란을 야기한다. 또한 버튼 크기(`padding: 6px 10px`)도 모바일 터치 타겟으로 부족하다.
- **개선안**: 정렬 로직을 구현하거나, 구현 전이면 버튼을 숨기거나 `disabled` 상태로 표시해야 한다.

### 2. 승인/거절 성공 및 실패 시 사용자 피드백 부재
- **위치**: `TrainerMemberView.vue:314-358`
- **문제**: `handleApprove`와 `handleReject` 함수에서 **성공 시 토스트 메시지가 없고, 실패 시에도 피드백이 없다**. `approveConnection`/`rejectConnection`이 `false`를 반환해도 화면은 조용히 끝난다. 승인/거절 후 리스트에서 아이템이 사라지지만 사용자는 작업 결과를 확신할 수 없다.
- **개선안**: 성공/실패 모두 토스트로 피드백을 제공해야 한다.
```js
async function handleApprove(connectionId) {
  processingId.value = connectionId
  try {
    const success = await approveConnection(connectionId)
    if (success) {
      showToast('연결이 승인되었습니다', 'success')
      // ... 기존 로직
    } else {
      showToast('승인에 실패했습니다. 다시 시도해주세요.', 'error')
    }
  } finally {
    processingId.value = null
  }
}
```

### 3. 회원 목록 로드 실패가 사실상 무음 처리됨 (추가)
- **위치**: `src/stores/members.js:loadMembers()`, `src/composables/useMembers.js:fetchMembers()`
- **문제**: `membersStore.loadMembers()`가 내부에서 에러를 콘솔에만 남기고 빈 배열을 반환한다. 네트워크 실패 시 사용자는 "회원이 없다"고 오인하거나, stale 데이터를 보게 된다. 이는 가장 크게 빠진 UX 문제이다.
- **개선안**: store/composable에서 에러를 명시적으로 반환 또는 throw하고, 화면은 인라인 에러 또는 토스트 중 하나로 통일해야 한다.

## Major (높은 우선순위)

### 4. 대기 중 탭에서 에러 상태 미처리 (에러 전달 구조 문제)
- **위치**: `TrainerMemberView.vue:298-305`, `src/composables/useTrainerSearch.js:133`
- **문제**: `loadPendingRequests()` 함수에 `catch` 블록이 없다. 그러나 **더 근본적인 문제는 `fetchPendingRequests()`가 내부에서 에러를 삼키고 빈 배열 `[]`을 반환하므로**, 뷰에서 catch를 추가해도 예외를 잡을 수 없다는 점이다.
- **개선안**: composable이 에러를 throw하거나 `error` ref를 뷰에서 구독하게 구조를 변경해야 한다. 단순히 뷰에 catch를 추가하는 것만으로는 부족하다.

### 5. 대기 중 탭의 승인/거절 버튼 터치 타겟 부족
- **위치**: `TrainerMemberView.css:534` - `.pending-item__btn { height: 34px; }`
- **문제**: 승인/거절 버튼의 높이가 34px로, 모바일 최소 터치 타겟 기준 44px에 미달한다. 특히 두 버튼이 6px 간격으로 바로 붙어 있어 오탭 위험이 높다.
- **개선안**: 버튼 높이를 최소 40px으로 늘리고, 간격을 8px 이상으로 확보한다.

### 6. 초대하기 버튼 터치 타겟 부족
- **위치**: `TrainerMemberView.css:31` - `.member-mgmt__invite { height: 36px; }`
- **문제**: 헤더 우측의 "초대하기" 버튼 높이가 36px으로 44px 미달이다.
- **개선안**: 높이를 40px 이상으로 늘리거나, 상하 패딩을 추가하여 터치 영역을 확보해야 한다.

### 7. 검색이 이름만 지원 - placeholder와 불일치
- **위치**: `TrainerMemberView.vue:55` (placeholder: "이름 또는 연락처 검색") vs `TrainerMemberView.vue:400` (실제 필터는 `m.name`만 비교)
- **문제**: placeholder에 "연락처 검색"이라고 표시하지만 실제로 연락처 검색은 구현되어 있지 않다. **연락처 검색을 구현하려면 회원 쿼리(`src/stores/members.js`)에서 `phone` 필드를 함께 가져오도록 데이터 계약까지 변경해야 한다** (DB 스키마 `supabase/schema.sql:25`에 `phone text` 컬럼은 존재함).
- **개선안**: 연락처 검색을 구현하거나, placeholder를 "이름으로 검색"으로 수정해야 한다.

### 8. 검색 결과 없음과 빈 상태가 구분되지 않음 (추가)
- **위치**: `TrainerMemberView.vue:105`, `TrainerMemberView.vue:391-401`
- **문제**: 검색 결과가 0건이어도 "연결된 회원이 없습니다"와 "초대 코드 생성하기" CTA가 나온다. 토스 앱 수준 UX라면 "검색 결과 없음"과 "아직 회원 없음"을 분리해야 한다.
- **개선안**: `filteredMembers.length === 0`일 때 `searchQuery` 또는 `activeStatCard` 필터가 활성화되어 있는지 확인하여 메시지를 분기한다.
```html
<div v-if="filteredMembers.length === 0 && !loading" class="member-list__empty">
  <template v-if="searchQuery.trim() || activeStatCard !== 'all'">
    <!-- 필터/검색 결과 없음 -->
    <p>검색 결과가 없습니다.</p>
  </template>
  <template v-else>
    <!-- 실제 빈 상태 -->
    <p>연결된 회원이 없습니다.</p>
    <button @click="router.push('/invite/manage')">초대 코드 생성하기</button>
  </template>
</div>
```

### 9. Pull-to-refresh가 store와 로컬 상태 동기화 불완전
- **위치**: `TrainerMemberView.vue:380-382`, `TrainerMemberView.vue:251`
- **문제**: `handleRefresh()`가 `membersStore.loadMembers(true)`만 호출하여 (1) 대기 중 탭을 보면서 pull-to-refresh를 해도 대기 목록은 갱신되지 않고, (2) **더 큰 문제로 뷰가 사용하는 `members` ref는 composable의 로컬 상태이므로** store를 갱신해도 화면에 반영되지 않을 수 있다.
- **개선안**: 현재 탭에 따라 갱신 대상을 분기하고, `fetchMembers()`를 직접 호출하거나 `storeToRefs`/`computed`로 store를 직접 구독해야 한다.
```js
async function handleRefresh() {
  if (activeTab.value === 'pending') {
    await loadPendingRequests()
  } else {
    await fetchMembers() // membersStore.loadMembers(true) 대신 composable 경유
  }
}
```

## Minor (개선 권장)

### 10. 하드코딩된 색상값
- **위치**: `TrainerMemberView.vue:12` - SVG `stroke="white"`, `TrainerMemberView.css:129` - `color: #FF9500`, `TrainerMemberView.css:356-357` - `#FF9500`
- **문제**: 디자인 시스템에 `--color-orange: #FF9500`이 정의되어 있지만 CSS에서 직접 hex값을 사용하고 있다.
- **개선안**: `#FF9500` -> `var(--color-orange)`, `stroke="white"` -> `stroke="currentColor"`.

### 11. stat-card__count 폰트 사이즈 하드코딩
- **위치**: `TrainerMemberView.css:150` - `font-size: 28px; font-weight: 700;`
- **문제**: 디자인 토큰 변수가 아닌 raw px값이 사용되고 있다.
- **개선안**: `font-size: var(--fs-display)` (24px) 또는 적절한 토큰 사용. 28px이 의도적이라면 커스텀 변수로 분리해야 한다.

### 12. PT 잔여 횟수 표기 혼동 가능 (추가)
- **위치**: `src/stores/members.js:106-117`, `TrainerMemberView.vue:157`
- **문제**: 회원 카드의 `done/total` 표시에서 `done`이라는 이름으로 실제로는 `remaining`(잔여 횟수)을 보여준다. PT 이력이 0이면 `safeTotal = 1` 때문에 `0/1회`로 표시되어 혼동을 줄 수 있다.
- **개선안**: `remaining/total`로 명시하거나, 잔여 0회인 경우 `미등록` 등으로 문구를 분리한다.

### 13. 접근성 미흡 - 클릭 가능한 div 카드 및 검색 label 부재 (추가)
- **위치**: `TrainerMemberView.vue:115` (회원 카드 div), `TrainerMemberView.vue:51` (검색 input)
- **문제**: 회원 카드가 클릭 가능한 `div`이고 `role="button"` 등이 없다. 검색 input에도 명시적 `<label>`이나 `aria-label`이 없어 스크린 리더 사용자가 용도를 파악하기 어렵다.
- **개선안**: 카드는 `<button>` 또는 `role="link"` + `tabindex="0"`을 추가하고, 검색 input에 `aria-label="회원 검색"`을 추가한다.

### 14. 에러 메시지와 목록 동시 표시 가능
- **위치**: `TrainerMemberView.vue:81-92`
- **문제**: `v-if="error"`와 `v-if="!loading"`이 독립적이므로, 에러가 발생한 후 기존 캐시된 목록이 함께 표시될 수 있다. 다만 현재 더 현실적인 문제는 "에러가 거의 surface되지 않는다"는 점이다.
- **개선안**: 에러는 토스트로 통일하고, 인라인 에러 메시지를 제거하거나 토스트 와치를 제거하고 인라인으로 통일한다.

## Good (잘된 점)
- **Pull-to-refresh**: 앱 수준의 인터랙션으로 모바일 사용성이 높다 (단, store 동기화 개선 필요).
- **스태거 애니메이션**: 회원 목록 진입 시 순차적 fade-in 애니메이션이 세련된 인터랙션을 제공한다.
- **필터 카드 UI**: 전체/진행 중/종료 stat card를 선택하면 목록이 즉시 필터링되는 패턴이 직관적이다.
- **빈 상태 처리**: 빈 회원 목록과 빈 대기 목록 모두 아이콘 + 메시지로 구성되어 있다 (단, 검색 결과 없음과 분리 필요).
- **스켈레톤 로딩**: 두 탭 모두 스켈레톤 UI를 사용하여 레이아웃 안정감이 있다.
- **keep-alive 최적화**: `onActivated` + `isStale()` 패턴으로 불필요한 재로딩을 방지하면서 데이터 신선도를 유지한다.

## 토스 앱 참고 개선안

### 탭 전환 시 컨텐츠 트랜지션
- 토스 앱은 탭 전환 시 부드러운 슬라이드 또는 페이드 트랜지션을 적용한다. 현재는 `v-if` 교체로 즉시 전환되어 약간 딱딱하다.
- `<Transition>` 컴포넌트로 탭 컨텐츠에 crossfade 효과를 추가하면 체감 품질이 올라간다.

### 검색 바 포커스 시 인터랙션
- 토스 앱의 검색바는 포커스 시 배경색 변화 또는 미세한 그림자 효과가 있다.
- 현재 검색 input에 `:focus` 스타일이 없으므로 추가하면 좋다.

### 승인/거절 슬라이드 제스처
- 토스 앱은 카드 스와이프로 승인/거절 같은 액션을 처리한다. 현재 버튼 방식도 적절하지만, 장기적으로 스와이프 액션 추가를 고려할 수 있다.

## 구조 개선 제안 (참고용)

### 인라인 SVG 아이콘 컴포넌트화
- `TrainerMemberView.vue`에 6개 이상의 인라인 SVG가 있고, `STAT_ICONS` 객체에 SVG 문자열이 `v-html`로 렌더링된다. `v-html`은 XSS 위험이 있고 SVG가 코드 가독성을 크게 떨어뜨린다.
- `AppIcon.vue` 같은 공통 아이콘 컴포넌트를 만들거나, SVG 파일을 분리하여 import하는 방식을 권장한다.

### 대기 중 탭 로직 분리
- 대기 중 탭의 상태(`pendingRequests`, `loadingPending`, `processingId`)와 핸들러(`handleApprove`, `handleReject`)를 `usePendingRequests` 같은 composable로 분리하면 뷰가 더 깔끔해진다.
