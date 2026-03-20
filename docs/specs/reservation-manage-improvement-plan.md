# ReservationManageView 개선 계획

> 기반: UX 리뷰 + Codex 코드 리뷰 (2026-03-20)

---

## Phase 1 — 버그 수정 (즉시)

### 1-1. UTC 날짜 버그 수정
- **파일**: `src/views/trainer/ReservationManageView.vue`
- **문제**: `today = new Date().toISOString().slice(0, 10)` → UTC 기준이라 KST 자정~09시 사이에 날짜 하루 밀림
- **수정**: `isSessionPast()`에서 사용하는 로컬 기준 헬퍼와 동일하게 변경
```js
// before
const today = new Date().toISOString().slice(0, 10)

// after
function getLocalToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const today = getLocalToday()
```

### 1-2. TrainerHomeView 완료 표시 상태 제한
- **파일**: `src/views/trainer/TrainerHomeView.vue`
- **문제**: `isSessionPast(reservation)`가 `change_requested` 상태도 "완료"로 보여줌
- **수정**: `scheduled` 상태일 때만 완료 표시
```html
<!-- :class -->
'trainer-home__schedule-card--past': reservation.status === 'scheduled' && isSessionPast(reservation)

<!-- v-if 배지 -->
v-if="reservation.status === 'scheduled' && isSessionPast(reservation)"
```

### 1-3. 변경 요청 승인 버튼 조건 복원
- **파일**: `src/views/trainer/ReservationManageView.vue`
- **문제**: `change_requested` 카드에서 `requested_date` 없어도 승인 버튼 노출 → 백엔드 오류
- **수정**: todayList/otherList 양쪽에서 승인 버튼에 조건 추가
```html
<!-- before -->
<button class="res-card__btn res-card__btn--approve" ... @click="handleApprove(item)">승인</button>

<!-- after -->
<button v-if="item.requested_date" class="res-card__btn res-card__btn--approve" ... @click="handleApprove(item)">승인</button>
```
- `requested_date` 없는 변경 요청에는 "재배정" 버튼만 노출

---

## Phase 2 — UX 회귀 복원 + 핵심 개선 (1~2일)

### 2-1. 변경 요청 카드에 요청 날짜/시간 정보 복원
- **파일**: `src/views/trainer/ReservationManageView.vue`
- **위치**: todayList/otherList 양쪽 `change_requested` 영역
- **추가 내용**: 기존의 "현재 → 요청" 비교 블록을 간소화하여 meta-box 내에 표시
```html
<div v-if="item.status === 'change_requested' && item.requested_date" class="res-card__change-summary">
  <span class="res-card__change-arrow">
    {{ item.start_time?.slice(0,5) }} → {{ item.requested_start_time?.slice(0,5) }}
  </span>
  <span class="res-card__change-date">
    {{ item.date === item.requested_date ? '' : formatDateKorean(item.requested_date) }}
  </span>
</div>
```

### 2-2. Pull-to-Refresh 추가
- **파일**: `src/views/trainer/ReservationManageView.vue`
- **내용**: `AppPullToRefresh` 컴포넌트로 body 래핑 + refreshAfterAction 재활용
```html
<AppPullToRefresh @refresh="handleRefresh">
  <!-- 기존 body -->
</AppPullToRefresh>
```
```js
async function handleRefresh() {
  reservationsStore.invalidate()
  await fetchMyReservations('trainer')
}
```

### 2-3. onActivated 훅 추가
- **파일**: `src/views/trainer/ReservationManageView.vue`
- **내용**: 다른 탭에서 돌아올 때 데이터 갱신
```js
import { onActivated } from 'vue'
onActivated(() => {
  if (reservationsStore.isStale()) fetchMyReservations('trainer')
})
```

---

## Phase 3 — 디자인 토큰 정리 (1일)

### 3-1. 하드코딩 색상 → CSS 변수 치환
- **파일**: `src/assets/css/global.css` + `src/views/trainer/ReservationManageView.css`
- **추가 토큰**:
```css
/* global.css */
--color-orange-light: #FFF3E0;
--color-orange-dark: #E65100;
```
- **치환 대상** (ReservationManageView.css):
  - `#FFF3E0` → `var(--color-orange-light)` (line 232, 303, 351, 561)
  - `#E65100` → `var(--color-orange-dark)` (line 354, 361, 560)
  - `#1B8A3A` → `var(--color-green-dark)` (line 319, 438)
  - `rgba(52, 199, 89, 0.12)` → `var(--color-green-light)` (line 318)

### 3-2. 하드코딩 타이포 → CSS 변수 치환
- **파일**: `src/views/trainer/ReservationManageView.css`
- **대상**: `.res-card__status` (line 291-293)
```css
/* before */
font-size: 11px;
font-weight: 700;
letter-spacing: 0.5px;

/* after */
font-size: var(--fs-caption);
font-weight: var(--fw-body1-bold);
letter-spacing: 0.5px;  /* 토큰 없으므로 유지 */
```

---

## Phase 4 — 구조 개선 (검토 후)

### 4-1. ReservationCard 컴포넌트 분리
- **신규 파일**: `src/components/ReservationCard.vue`
- **props**: `item`, `showDate`, `processingId`, `loading`
- **emits**: `reassign`, `cancel`, `approve`, `reject`
- **효과**: todayList/otherList 마크업 중복 100% 제거, 드리프트 방지

### 4-2. 필터 칩에 건수 표시
- **파일**: `src/views/trainer/ReservationManageView.vue`
```js
const filterChips = computed(() => [
  { id: 'all', label: '전체', count: reservations.value.filter(r => r.status !== 'cancelled').length },
  { id: 'scheduled', label: '배정됨', count: reservations.value.filter(r => r.status === 'scheduled').length },
  // ...
])
```
```html
{{ chip.label }}{{ chip.count > 0 ? ` (${chip.count})` : '' }}
```

### 4-3. "다른 날짜" 섹션 날짜별 그룹핑
- 날짜별 서브헤더로 시각적 구분 강화
```js
const groupedOtherList = computed(() => {
  const groups = {}
  for (const item of otherList.value) {
    if (!groups[item.date]) groups[item.date] = []
    groups[item.date].push(item)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
})
```

### 4-4. 오늘 섹션 헤더에 실제 날짜 병기
```html
<h2 class="reservation__section-title">오늘</h2>
<span class="reservation__section-date">{{ formatDateKorean(today) }}</span>
```

---

## 변경 파일 목록 (전체)

| Phase | 파일 | 작업 |
|-------|------|------|
| 1 | `ReservationManageView.vue` | UTC→로컬 날짜, 승인 버튼 조건 |
| 1 | `TrainerHomeView.vue` | 완료 표시 scheduled 제한 |
| 2 | `ReservationManageView.vue` | 변경요청 정보 복원, PTR, onActivated |
| 2 | `ReservationManageView.css` | 변경요청 요약 스타일 |
| 3 | `global.css` | 오렌지 토큰 추가 |
| 3 | `ReservationManageView.css` | 하드코딩 색상/타이포 치환 |
| 4 | `components/ReservationCard.vue` (신규) | 카드 컴포넌트 분리 |
| 4 | `ReservationManageView.vue` | 칩 건수, 날짜 그룹핑 |

---

## 우선순위 요약

| 우선순위 | 항목 | 근거 |
|:--------:|------|------|
| P0 | UTC 날짜 버그 | 오전 시간대 오늘 분류 오류 |
| P0 | 완료 표시 상태 제한 | change_requested도 완료로 보임 |
| P0 | 승인 버튼 조건 복원 | 백엔드 오류 발생 가능 |
| P1 | 변경 요청 정보 복원 | UX 회귀, 트레이너 판단 불가 |
| P1 | Pull-to-Refresh | 데이터 최신성 확보 불가 |
| P2 | 디자인 토큰 정리 | 컨벤션 위반, 일관성 |
| P3 | 카드 컴포넌트 분리 | 유지보수성, 중복 제거 |
| P3 | 칩 건수 + 날짜 그룹핑 | 사용성 개선 |
