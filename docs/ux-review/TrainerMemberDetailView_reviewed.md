# TrainerMemberDetailView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec, gpt-5.4)
> 원본 파일: docs/ux-review/TrainerMemberDetailView.md
> 참조한 소스 파일: src/views/trainer/TrainerMemberDetailView.vue, TrainerMemberDetailView.css, src/composables/useMemos.js, src/composables/useProfile.js, src/composables/usePtSessions.js, src/composables/useConnection.js, src/stores/members.js, src/views/trainer/MemoWriteView.vue, src/App.vue, src/router/index.js
> 리뷰 라운드: 1회 (1차 판정: NEEDS_IMPROVEMENT -> 피드백 반영 완료, 2차 검증: codex 사용량 한도 도달로 미실행)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 연결 해제 후 목록 stale, 메모 저장 후 상세 stale(keep-alive), 단일 loading 상태로 삭제 시 전체 스켈레톤, Promise.all 제안이 loading/error 공유로 위험, 긴 메모 full-read 부재, 아이콘 버튼 전체 aria-label 부재, 에러 중복 노출, PT 잔여 로딩/에러 미분리, #10 gap 수치 오류 |

---

## 최종 리뷰 내용

## 개요
- **파일**: `src/views/trainer/TrainerMemberDetailView.vue` + `TrainerMemberDetailView.css`
- **역할**: 특정 회원의 상세 정보(신체정보, 운동 목표, PT 잔여 횟수)와 메모 기록을 조회하고, 바로가기(수납/채팅/PT 횟수/연결 해제) 액션을 제공하는 회원 상세 화면
- **리뷰 일자**: 2026-03-20

## 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 3 | 보통 - 연결 확인/로딩/에러/빈 상태 커버되나, 단일 loading으로 액션 시 전체 스켈레톤, 에러 중복 노출, PT 잔여 로딩/에러 미분리 |
| 터치 타겟 | 3 | 보통 - 메모 편집/삭제 버튼이 32px로 작음, 4px 간격 |
| 스크롤/인터랙션 | 3 | 보통 - FAB 위치 양호, 하지만 메모 목록 페이지네이션 없음, 긴 메모 full-read 부재 |
| 시각적 일관성 | 4 | 양호 - 디자인 토큰 준수율 높음, 카드 스타일 일관적 |
| 접근성 | 2 | 미흡 - FAB/뒤로가기/편집/삭제 버튼 모두 aria-label 없음 |
| 정보 밀도 | 3 | 보통 - 섹션 구성은 적절하나 메모 3줄 클램프 후 읽기 동선 없음 |
| 전체 사용성 | 3 | 보통 |

## Critical (즉시 수정 필요)

### 1. 연결 해제 확인창의 "확인" 버튼이 파란색 (위험 동작인데 primary 색상)
- **위치**: `TrainerMemberDetailView.vue:257`, `TrainerMemberDetailView.css:546`
- **문제**: "연결 해제"는 되돌릴 수 없는 파괴적 동작이다. 그런데 확인 버튼이 `--color-blue-primary` (파란색)으로 표시되어 사용자가 안전한 동작으로 오인할 수 있다.
- **개선안**: 연결 해제 바텀 시트의 확인 버튼을 빨간색 계열로 변경하고, 텍스트도 "확인" 대신 "연결 해제"로 명시한다.
```css
.mem-detail__sheet-btn--danger {
  background-color: var(--color-red);
  color: var(--color-white);
}
```

### 2. "전체보기" 버튼이 동작하지 않음
- **위치**: `TrainerMemberDetailView.vue:194`
- **문제**: 메모 섹션의 "전체보기" 버튼에 `@click` 핸들러가 없다. 사용자가 탭해도 아무 일도 일어나지 않는다.
- **개선안**: 전체보기 페이지로 라우팅하거나, 구현 전이면 버튼을 제거하거나 비활성화해야 한다.

### 3. 메모 저장/수정 후 복귀 시 메모 목록이 갱신되지 않음 (추가 - Critical)
- **위치**: `TrainerMemberDetailView.vue:339-345`, `App.vue:4`, `MemoWriteView.vue:272`
- **문제**: 상세 뷰는 `keep-alive` 대상이고, 메모 저장 후 `safeBack()`으로 뒤로 돌아온다. 그러나 상세 뷰의 `onActivated()`는 **PT 횟수만** 다시 불러온다. 메모를 작성/수정해도 상세 화면에 반영되지 않아 사용자가 저장이 안 됐다고 오해할 수 있다.
- **개선안**: `onActivated`에서 `fetchMemos(memberId)`도 재조회해야 한다.
```js
onActivated(async () => {
  if (!initialLoaded.value || hasActiveConnection.value !== true) return
  const memberId = route.params.id
  if (memberId) {
    await Promise.all([
      fetchPtHistory(memberId),
      fetchMemos(memberId),
    ])
  }
})
```

### 4. 연결 해제 후 목록 화면이 갱신되지 않을 수 있음 (추가 - Critical)
- **위치**: `TrainerMemberDetailView.vue:368-374`, `TrainerMemberView.vue:385`
- **문제**: `handleDisconnect` 성공 시 바로 목록으로 `router.push`하지만, `membersStore.invalidate()`를 호출하지 않는다. 목록 화면은 캐시가 stale일 때만 재조회하므로, 해제된 회원이 목록에 남아 있을 수 있다.
- **개선안**: 해제 성공 시 `membersStore.invalidate()`를 호출하고, 성공 토스트를 표시한 뒤 이동한다.
```js
async function handleDisconnect() {
  const ok = await disconnectMember(route.params.id)
  if (ok) {
    membersStore.invalidate()
    showToast('연결이 해제되었습니다', 'success')
    showDisconnectSheet.value = false
    router.push({ name: 'trainer-members' })
  }
}
```

## Major (높은 우선순위)

### 5. 단일 loading 상태로 인한 UX 문제 (추가)
- **위치**: `TrainerMemberDetailView.vue:37`, `src/composables/useMemos.js:28,252`
- **문제**: `useMemos`의 `loading` ref가 조회/삭제/수정 모두에서 사용된다. 메모를 삭제할 때도 `loading.value = true`가 되어 **화면 본문 전체가 스켈레톤으로 바뀔 수 있다**. 작은 액션에 전체 화면이 깜빡이는 것은 나쁜 경험이다.
- **개선안**: 목록 조회 로딩과 삭제/수정 로딩을 분리한다. 삭제 중에는 카드/시트 버튼만 비활성화한다.

### 6. 메모 편집/삭제 버튼 터치 타겟 부족 (32px)
- **위치**: `TrainerMemberDetailView.css:416-429` - `.memo-card__edit-btn, .memo-card__delete-btn { width: 32px; height: 32px; }`
- **문제**: 편집과 삭제 아이콘 버튼이 32px x 32px이고, 4px 간격으로 바로 붙어 있다. 특히 삭제는 파괴적 동작이므로 오탭 위험이 높다.
- **개선안**: 최소 40px x 40px로 확대하고, 간격을 8px 이상으로 넓힌다.

### 7. 순차 로딩으로 인한 긴 초기 대기 시간 (수정)
- **위치**: `TrainerMemberDetailView.vue:323-335`
- **문제**: `onMounted`에서 5개의 비동기 호출이 순차적 await로 실행된다. **다만 단순 `Promise.all`로 병렬화하면 `fetchMemberDetail()`과 `fetchMemos()`가 같은 `loading`/`error` ref를 공유하기 때문에 경합 조건이 발생한다** (`useMemos.js:28,75,166`).
- **개선안**: (1) `loading`/`error` 상태를 조회별로 분리(`memberLoading`, `memoLoading`, `ptLoading`)한 뒤 병렬화하거나, (2) composable 내부에서 `Promise.allSettled`로 관리하거나, (3) 현재 주석 처리된 색상 기능 외에는 쓰이지 않는 `membersStore.loadMembers()`를 제거하여 호출 수를 줄인다.

### 8. 헤더 레이아웃 비대칭 - 우측 spacer 없음
- **위치**: `TrainerMemberDetailView.vue:25-32`, `TrainerMemberDetailView.css:26-31`
- **문제**: 헤더가 `justify-content: space-between`인데 좌측에 뒤로가기(40px), 중앙에 제목이 있지만 우측에 대응하는 빈 공간이 없다. 제목이 완전한 중앙 정렬이 되지 않고 우측으로 밀린다.
- **개선안**: PtCountManageView처럼 우측에 `<div style="width: 40px;" />`를 추가한다.

### 9. 긴 메모의 전체 내용을 읽을 방법이 없음 (추가)
- **위치**: `TrainerMemberDetailView.vue:238`, `TrainerMemberDetailView.css:460-470`
- **문제**: 메모 본문은 `-webkit-line-clamp: 3`으로 3줄까지만 표시되는데, 카드 탭 확장이나 상세 보기 동선이 없다. "전체보기" 버튼도 미구현이므로 사용자가 긴 메모의 나머지 내용을 확인할 방법이 없다.
- **개선안**: 카드 탭 시 클램프 해제(토글), 상세 바텀시트, 또는 전체보기 페이지를 구현한다.

## Minor (개선 권장)

### 10. 아이콘 버튼 전체에 접근성 레이블 없음 (범위 확대)
- **위치**: `TrainerMemberDetailView.vue:26` (뒤로가기), `218` (메모 편집), `223` (메모 삭제), `246-249` (FAB)
- **문제**: 뒤로가기, 메모 편집, 메모 삭제, FAB 버튼 **모두** `aria-label`이 없어 스크린 리더 사용자가 버튼 용도를 알 수 없다.
- **개선안**: 각 버튼에 `aria-label`을 추가한다. 뒤로가기: `aria-label="뒤로가기"`, 편집: `aria-label="메모 편집"`, 삭제: `aria-label="메모 삭제"`, FAB: `aria-label="메모 작성"`.

### 11. 메모 삭제 바텀시트의 확인 버튼도 파란색
- **위치**: `TrainerMemberDetailView.vue:265`
- **문제**: 메모 삭제도 파괴적 동작인데 확인 버튼이 파란색이다. 1번 이슈와 동일한 패턴이다.
- **개선안**: 삭제 확인 버튼은 빨간색으로 변경한다.

### 12. 신체정보 4열 그리드 - 작은 화면에서 가독성 저하 가능 (수치 수정)
- **위치**: `TrainerMemberDetailView.css:112-114` - `grid-template-columns: repeat(4, 1fr)`, `gap: 10px`
- **문제**: 480px 화면에서 side-margin 40px을 빼면 440px, **gap 30px(3개)이 아니라 실제 gap은 10px(3개 = 30px)**을 빼면 각 약 102px이다. 공간이 부족한 것은 아니지만 `repeat(4, 1fr)` 고정 4열은 데이터 개수에 따라 불균형하거나 밀도가 높아질 수 있다.
- **개선안**: `grid-template-columns: repeat(auto-fill, minmax(90px, 1fr))` 또는 2x2 그리드를 고려한다.

### 13. 에러 중복 노출 (배너 + 토스트) (추가)
- **위치**: `TrainerMemberDetailView.vue:35` (인라인 에러), `TrainerMemberDetailView.vue:393` (watch 토스트)
- **문제**: 에러 발생 시 인라인 배너와 토스트가 동시에 표시된다.
- **개선안**: blocking 오류는 인라인, action 오류는 toast로 역할을 분리한다.

### 14. PT 잔여 횟수 로딩/에러 상태 미분리 (추가)
- **위치**: `TrainerMemberDetailView.vue:122`
- **문제**: PT 잔여 횟수가 로딩 중이든 에러든 모두 `-`로 표시되어 상태를 구분할 수 없다.
- **개선안**: 로딩 시 스켈레톤, 에러 시 재시도 아이콘으로 분리한다.

### 15. 인라인 스타일 과다 사용
- **위치**: `TrainerMemberDetailView.vue:4`, `42` 등
- **문제**: 연결 안 된 회원 안내, 데이터 없음 안내 등에서 인라인 `style` 속성이 많이 사용되고 있다.
- **개선안**: CSS 클래스로 분리한다. 예: `.mem-detail__disconnected`, `.mem-detail__no-data`

### 16. 메모 목록에 페이지네이션/무한스크롤 없음
- **위치**: `TrainerMemberDetailView.vue:205-239`
- **문제**: 메모가 많은 회원의 경우 모든 메모가 한 번에 렌더링된다.
- **개선안**: 최근 5건만 표시하고 "더보기"로 확장하거나, 전체보기 페이지를 구현한다.

## Good (잘된 점)
- **연결 상태 3단계 분기**: `hasActiveConnection`이 `null`(확인 중) / `false`(미연결) / `true`(연결됨)로 분기되어, 각 상태에 맞는 UI를 정확히 보여준다.
- **FAB 위치 및 반응형 처리**: FAB이 `bottom: calc(var(--nav-height) + 20px)`으로 바텀 내비게이션 위에 정확히 위치하고, `@media (min-width: 480px)`에서 최대 너비 기준 우측 정렬을 처리한다.
- **바텀 시트 활용**: 파괴적/선택 동작에 바텀 시트를 사용하여 모달보다 모바일 친화적인 패턴을 따른다.
- **keep-alive 복귀 시 경량 재조회**: `onActivated`에서 PT 횟수를 재조회하는 패턴은 좋으나, 메모 재조회도 추가 필요.
- **메모 카드 3줄 클램프**: `-webkit-line-clamp: 3`으로 긴 메모도 깔끔하게 처리된다 (단, full-read 동선 필요).
- **에러 토스트 자동화**: `watch(error, ...)` 패턴으로 에러 발생 시 자동으로 토스트를 표시한다 (단, 인라인 에러와 중복 제거 필요).

## 토스 앱 참고 개선안

### 위험 동작의 이중 확인 패턴
- 토스 앱은 계좌 해지 등 위험 동작 시 빨간색 확인 버튼 + 명시적 동작명("해지하기")을 사용한다.
- 연결 해제 시 "연결을 해제하면 해당 회원의 예약/메모 데이터에 접근할 수 없습니다" 같은 구체적 경고 메시지를 바텀시트에 추가하면 실수를 방지할 수 있다.

### 회원 요약 섹션의 프로필 이미지
- 현재 회원 상세에 프로필 이미지가 표시되지 않는다. 회원 목록에서는 아바타를 보여주면서 상세에서 누락된 것은 시각적 연속성이 떨어진다.

### 바로가기 섹션 아이콘 색상 통일
- 토스 앱은 카테고리별로 아이콘 색상을 다르게 사용한다. 채팅은 초록, 수납은 다른 색으로 차별화하면 정보 인지 속도가 빨라진다.

## 구조 개선 제안 (참고용)

### 섹션별 컴포넌트 분리
- 회원 요약, 바로가기, 메모 기록을 각각 별도 컴포넌트로 분리하면 파일이 훨씬 가벼워진다.

### 메모 CRUD 로직 composable 활용 극대화
- 삭제 확인 UI 상태(`showDeleteMemoSheet`, `deleteMemoTarget`)와 핸들러를 `useMemoActions` 같은 composable로 묶으면 뷰 로직이 간결해진다.

### loading/error 상태 분리
- `useMemos`의 단일 `loading`을 `fetchLoading`, `mutationLoading`으로 분리하여 조회와 액션의 UI 피드백을 독립적으로 관리한다.
