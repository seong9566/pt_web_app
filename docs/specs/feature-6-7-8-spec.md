# PT 웹앱 예약 관리 중기/장기 개선 기능 기획서 (기능 6, 7, 8)

> 작성일: 2026-03-20
> 대상 브랜치: `dev`
> 관련 도메인: 트레이너 예약 관리, 실시간 알림

---

## 목차

1. [기능 6: 하단 네비게이션 알림 점 (TrainerBottomNav)](#기능-6-하단-네비게이션-알림-점)
2. [기능 7: 승인 후 Undo 토스트](#기능-7-승인-후-undo-토스트)
3. [기능 8: Supabase Realtime 구독](#기능-8-supabase-realtime-구독)
4. [기능 간 의존성 및 구현 순서](#기능-간-의존성-및-구현-순서)
5. [종합 위험 요소](#종합-위험-요소)

---

## 기능 6: 하단 네비게이션 알림 점

### 기능 요약

트레이너 하단 네비게이션의 "일정" 탭 아이콘에 `change_requested` 상태의 예약이 1건 이상 존재할 때 빨간 점(dot)을 표시하여, 트레이너가 어느 화면에 있든 미처리 변경 요청이 있음을 즉시 인지할 수 있게 한다.

### 수용 기준 (Acceptance Criteria)

- [ ] `change_requested` 상태의 예약이 1건 이상 존재하면, "일정" 탭 아이콘 우측 상단에 빨간 점(직경 8px, `--color-red`)이 표시된다
- [ ] `change_requested` 상태의 예약이 0건이면 빨간 점이 표시되지 않는다
- [ ] 빨간 점은 숫자 없이 dot 형태로만 표시한다 (채팅 배지의 숫자 카운트와 시각적으로 구분)
- [ ] 앱 최초 로딩 시 `reservations` 스토어에서 `change_requested` 카운트를 계산하여 즉시 반영한다
- [ ] 예약 상태가 변경(승인/거절/재배정)되어 `change_requested`가 0건이 되면 dot이 즉시 사라진다
- [ ] 다른 탭(홈, 회원, 채팅, 설정)에서도 dot 상태가 정확히 반영된다
- [ ] 기존 채팅 배지(`chatUnreadCount`)와 시각적으로 충돌하지 않는다

### 기술 명세

#### 변경 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/stores/reservations.js` | `changeRequestCount` computed 속성 추가 |
| `src/components/TrainerBottomNav.vue` | reservations 스토어 구독 + dot 렌더링 |

#### 주요 구현 포인트

**1. Pinia 스토어 변경 (`src/stores/reservations.js`)**

- `changeRequestCount` computed를 추가한다
- `reservations` 배열에서 `status === 'change_requested'`인 항목의 개수를 반환한다
- 기존 `return` 문에 `changeRequestCount`를 포함시킨다

**2. TrainerBottomNav 컴포넌트 변경**

- `useReservationsStore()`를 import하고, `storeToRefs`로 `changeRequestCount`를 구독한다
- 현재 패턴: 컴포넌트가 `chatBadgeStore`와 `notificationBadgeStore`를 구독하는 방식과 동일하게 처리한다
- `onMounted`에서 `reservationsStore.loadReservations('trainer')`를 호출하여 초기 데이터를 보장한다
- `schedule` navItem에 대해 `changeRequestCount > 0`일 때 dot 요소를 조건부 렌더링한다

**3. 스타일링**

- 새로운 CSS 클래스 `trainer-nav__dot`를 추가한다
- 채팅 배지(`trainer-nav__badge`)와는 다른 형태: 숫자 없이 원형 dot만 표시
- 위치: 아이콘 우측 상단 (기존 배지와 유사한 위치지만 크기가 작음)
- 크기: 8x8px, `border-radius: 50%`, `background-color: var(--color-red)`

#### 데이터 흐름

```
TrainerBottomNav mount
  → reservationsStore.loadReservations('trainer')
  → reservations 배열 캐시 로드 (TTL 5분 이내면 스킵)
  → changeRequestCount computed 자동 계산
  → template에서 dot 조건부 렌더링
```

### 주의사항

- `reservationsStore`는 이미 5분 TTL 캐시를 사용하므로, BottomNav mount 시 불필요한 네트워크 요청이 발생하지 않는다. 단, 최초 로딩 전(lastFetchedAt === null)에는 반드시 fetch가 실행되어야 한다.
- 현재 `TrainerScheduleView`에서 이미 `changeRequestCount`를 로컬 computed로 계산하고 있다 (주간 필터 기준). 스토어의 `changeRequestCount`는 **전체 예약 기준**이므로 의미가 다르다. 이 차이를 인지하고 혼동하지 않도록 한다.
- `visibilitychange` 이벤트 핸들러에서 `reservationsStore.loadReservations`도 호출하여, 앱 복귀 시 최신 상태를 반영할 수 있다.

---

## 기능 7: 승인 후 Undo 토스트

### 기능 요약

트레이너가 변경 요청을 승인한 직후, 5초간 "실행 취소" 버튼이 포함된 토스트를 표시한다. Undo를 누르면 승인을 되돌려 `change_requested` 상태로 복원한다. 이를 통해 실수로 승인한 경우 즉시 복구할 수 있는 안전장치를 제공한다.

### 수용 기준 (Acceptance Criteria)

- [ ] 변경 요청 승인 성공 시, "변경 요청을 승인했습니다" 메시지와 함께 "실행 취소" 버튼이 있는 토스트가 표시된다
- [ ] 토스트는 5초 후 자동으로 사라진다
- [ ] 5초 이내에 "실행 취소" 버튼을 탭하면 해당 예약이 `change_requested` 상태로 복원된다
- [ ] Undo 성공 시 "승인이 취소되었습니다" 성공 토스트가 표시된다
- [ ] Undo 실패 시 (네트워크 오류, 이미 다른 상태로 변경된 경우) 에러 토스트가 표시된다
- [ ] 토스트 영역에서 "실행 취소" 버튼은 탭 가능해야 한다 (`pointer-events: auto`)
- [ ] 토스트가 표시되는 동안 다른 액션을 수행해도 앱이 정상 작동한다
- [ ] 연속으로 여러 건을 승인할 경우, 각각의 Undo가 독립적으로 동작한다 (마지막 토스트만 표시하되, 이전 Undo 핸들러는 무효화)
- [ ] `ReservationManageView`와 `TrainerScheduleView` 모두에서 동일하게 동작한다

### 기술 명세

#### 변경 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/stores/toast.js` | `action` 상태 (label, handler) 추가 |
| `src/composables/useToast.js` | `showSuccess`에 options 파라미터 추가 |
| `src/components/AppToast.vue` | action 버튼 렌더링 + 스타일 |
| `src/views/trainer/TrainerScheduleView.vue` | `handleApproveChange` 함수에 Undo 로직 추가 |
| `src/views/trainer/ReservationManageView.vue` | `handleApprove` 함수에 Undo 로직 추가 |
| `src/composables/useReservations.js` | Undo용 `revertApproval` 함수 추가 |

#### 주요 구현 포인트

**1. Toast 스토어 확장 (`src/stores/toast.js`)**

- `action` ref 추가: `{ label: string, handler: Function } | null`
- `showToast` 함수 시그니처 확장: `showToast(msg, toastType, duration, actionOption)`
- `hideToast` 시 `action.value = null`로 초기화
- action이 있을 때 duration을 5000ms로 기본 설정

**2. useToast composable 확장 (`src/composables/useToast.js`)**

- `showSuccess` 시그니처 변경: `showSuccess(msg, options?)` where `options = { action: { label, handler } }`
- options가 전달되면 toast 스토어에 action을 함께 전달
- 하위 호환성: options가 없으면 기존과 동일하게 동작

**3. AppToast 컴포넌트 확장 (`src/components/AppToast.vue`)**

- `toastStore.action`이 존재하면 메시지 옆(또는 아래)에 action 버튼을 렌더링
- 버튼 클릭 시 `toastStore.action.handler()` 호출 후 `hideToast()`
- **핵심**: 현재 `.app-toast`에 `pointer-events: none`이 적용되어 있음. action이 있을 때는 `pointer-events: auto`로 변경해야 함
- 레이아웃: 토스트 내부를 flexbox로 변경하여 메시지(좌)와 action 버튼(우)을 가로 배치

**4. Undo 복원 함수 (`src/composables/useReservations.js`)**

- `revertApproval(reservationId, originalData)` 함수 추가
- Supabase에 직접 update 호출하여 상태를 `change_requested`로 복원
- 복원 시 기존 변경 요청 데이터(`requested_date`, `requested_start_time`, `requested_end_time`, `change_reason`)도 함께 복원해야 함
- **중요**: `approve_change_request` RPC가 승인 시 requested_* 필드를 클리어할 수 있으므로, 승인 호출 전에 원본 데이터를 캡처해둬야 한다
- 복원 후 `refreshReservationsStore()` 호출

**5. 호출부 변경 (TrainerScheduleView, ReservationManageView)**

- 승인 성공 후 `showSuccess` 호출 시 action 옵션을 전달:
  ```
  showSuccess('변경 요청을 승인했습니다.', {
    action: {
      label: '실행 취소',
      handler: async () => { /* revertApproval 호출 */ }
    }
  })
  ```
- 승인 호출 전에 해당 예약의 원본 데이터(date, start_time, end_time, requested_*, change_reason)를 로컬 변수에 캡처
- handler 내에서 캡처한 데이터로 `revertApproval` 호출

#### 데이터 흐름 (승인 → Undo 시나리오)

```
1. 트레이너가 "승인" 탭
2. 원본 예약 데이터를 로컬 변수에 캡처 (reservationId, requested_*, change_reason 등)
3. approveChangeRequest(reservationId) 호출 → DB 상태: scheduled (or 새 날짜/시간으로 이동)
4. 성공 시 showSuccess('변경 요청을 승인했습니다.', { action: { label: '실행 취소', handler } })
5. 토스트 5초간 표시

[Undo 경로]
6a. 사용자가 "실행 취소" 탭
7a. revertApproval(reservationId, capturedOriginalData) 호출
8a. DB 상태: change_requested + 원본 requested_* 필드 복원
9a. 성공 → showSuccess('승인이 취소되었습니다.') / 실패 → showError(...)

[타임아웃 경로]
6b. 5초 경과 → 토스트 자동 닫힘 → 승인 확정
```

### 주의사항

- **Race condition**: Undo 버튼을 누르는 사이에 회원이 다른 액션을 취한 경우 (예: 예약 취소), revert가 실패할 수 있다. 이 경우 에러 토스트로 사용자에게 알려야 한다.
- **approve_change_request RPC의 동작 파악 필요**: 이 RPC가 예약의 날짜/시간을 요청된 값으로 변경하고 requested_* 필드를 null로 클리어하는지 확인해야 한다. 클리어한다면 Undo 시 이 필드들도 복원해야 한다.
- **알림 되돌리기**: 승인 시 알림이 회원에게 전송될 수 있다. Undo 시 이미 전송된 알림은 되돌릴 수 없다. 이는 허용 가능한 한계로 본다. (Undo 성공 시 "변경 요청이 재검토 중입니다" 같은 후속 알림을 전송하는 것은 후순위 개선 사항)
- **연속 승인 시 동작**: toast 스토어가 단일 인스턴스이므로, 새 승인이 이전 토스트를 덮어씌운다. 이전 Undo handler는 클로저가 유지되지만 토스트가 사라지므로 사실상 무효화된다. 이 동작은 현재 설계상 허용한다.

---

## 기능 8: Supabase Realtime 구독

### 기능 요약

`reservations` 테이블의 INSERT/UPDATE 이벤트를 Supabase Realtime으로 구독하여, 트레이너가 앱을 보고 있는 동안 회원의 변경 요청이 즉시 반영되도록 한다. 새로운 변경 요청 수신 시 인앱 배너로 알림을 표시한다.

### 수용 기준 (Acceptance Criteria)

- [ ] 트레이너 화면이 활성화된 상태에서 회원이 변경 요청을 보내면, 예약 목록이 자동으로 갱신된다
- [ ] 새로운 `change_requested` 이벤트 수신 시, 화면 상단에 "새로운 변경 요청이 있습니다" 배너가 표시된다
- [ ] 배너에 "확인" 버튼이 있으며, 탭 시 배너가 닫히고 일정 관리 화면으로 이동한다 (이미 일정 화면이면 단순히 닫힘)
- [ ] 구독은 `TrainerBottomNav` 마운트 시 시작되고, 언마운트 시 해제된다
- [ ] 중복 구독이 발생하지 않는다 (기존 chatBadge/notificationBadge 패턴과 동일)
- [ ] 앱이 백그라운드로 갔다가 돌아올 때(`visibilitychange`) 최신 데이터를 다시 로드한다
- [ ] INSERT 이벤트 (새 예약 생성)도 감지하여 스토어를 갱신한다
- [ ] UPDATE 이벤트에서 `status`가 `change_requested`로 변경된 경우에만 배너를 표시한다
- [ ] 배너는 동시에 최대 1개만 표시된다 (연속 이벤트 시 중복 배너 방지)
- [ ] Realtime 연결 실패 시 사일런트 처리하고, 기존 TTL 기반 캐시 갱신은 그대로 동작한다

### 기술 명세

#### 변경 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/stores/reservations.js` | Realtime 구독/해제 함수 추가 (`subscribe`, `unsubscribe`) |
| `src/components/TrainerBottomNav.vue` | reservations 스토어의 구독 생명주기 관리 |
| `src/components/RealtimeBanner.vue` | **신규 파일** - 인앱 알림 배너 컴포넌트 |
| `src/stores/realtimeBanner.js` | **신규 파일** - 배너 상태 관리 스토어 |
| `src/App.vue` | RealtimeBanner 컴포넌트 전역 마운트 |

#### 주요 구현 포인트

**1. Reservations 스토어 Realtime 확장 (`src/stores/reservations.js`)**

- 기존 `chatBadgeStore`의 구독 패턴을 따른다 (검증된 패턴)
- `_channel` 내부 변수, `subscribe()`, `unsubscribe()` 함수 추가
- 구독 대상: `reservations` 테이블, `trainer_id=eq.{userId}` 필터

- **INSERT 이벤트 처리**:
  - `invalidate()` 호출 → 다음 화면 진입 시 자동 재조회
  - 또는 즉시 `loadReservations('trainer', true)` 호출 (추천: 즉시 갱신)

- **UPDATE 이벤트 처리**:
  - payload의 `new.status`를 확인
  - `change_requested`인 경우: 스토어 즉시 갱신 + 배너 표시
  - 그 외 상태 변경: 스토어 즉시 갱신만 (배너 없음)

- **채널 설정 예시 구조**:
  ```
  supabase.channel(`reservations-trainer-${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations', filter: `trainer_id=eq.${userId}` }, handler)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservations', filter: `trainer_id=eq.${userId}` }, handler)
    .subscribe()
  ```

**2. Realtime 배너 스토어 (`src/stores/realtimeBanner.js`)**

- 상태: `visible` (boolean), `message` (string), `targetRoute` (string | null)
- 액션: `showBanner(message, targetRoute)`, `hideBanner()`
- 단일 배너만 표시 (새 이벤트 시 기존 배너 교체)

**3. RealtimeBanner 컴포넌트 (`src/components/RealtimeBanner.vue`)**

- `App.vue`에서 전역으로 마운트 (router-view 위에 배치)
- 화면 상단 고정 배너: 메시지 텍스트 + "확인" 버튼
- "확인" 탭 시: `hideBanner()` + targetRoute가 있으면 `router.push(targetRoute)`
- Transition 애니메이션: 위에서 아래로 슬라이드
- 디자인: `background-color: var(--color-blue-primary)`, `color: white`, `padding: 12px var(--side-margin)`

**4. TrainerBottomNav 구독 생명주기 관리**

- `onMounted`에서 `reservationsStore.loadReservations('trainer')` + `reservationsStore.subscribe()` 호출
- `onUnmounted`에서 `reservationsStore.unsubscribe()` 호출
- `visibilitychange`에서 포그라운드 복귀 시 `loadReservations('trainer', true)` 강제 갱신

**5. Supabase RLS 고려사항**

- Realtime은 RLS(Row Level Security) 정책을 따른다
- 현재 `reservations` 테이블에 trainer_id 기반 SELECT 정책이 있어야 Realtime이 동작한다
- `supabase/schema.sql`에서 해당 정책 존재 여부를 확인해야 한다
- Realtime이 동작하려면 Supabase 대시보드에서 `reservations` 테이블의 Realtime 기능이 활성화되어 있어야 한다

#### 데이터 흐름

```
[초기 구독]
TrainerBottomNav mount
  → reservationsStore.subscribe()
  → supabase.channel('reservations-trainer-{id}').subscribe()

[이벤트 수신]
회원이 변경 요청 →
  Supabase가 UPDATE 이벤트 전송 →
  handler에서 payload.new.status 확인 →
    'change_requested'인 경우:
      1. reservationsStore.loadReservations('trainer', true) → 캐시 즉시 갱신
      2. realtimeBannerStore.showBanner('새로운 변경 요청이 있습니다', '/trainer/reservations')
    그 외:
      1. reservationsStore.invalidate() → 다음 화면 진입 시 재조회

[구독 해제]
TrainerBottomNav unmount
  → reservationsStore.unsubscribe()
  → supabase.removeChannel(channel)
```

### 주의사항

- **Supabase Realtime 테이블 활성화**: Supabase 대시보드 > Database > Replication 에서 `reservations` 테이블의 Realtime이 활성화되어 있어야 한다. 이 설정이 누락되면 구독은 성공하지만 이벤트가 수신되지 않는다.
- **RLS 정책 호환성**: Realtime은 RLS를 적용하므로, `anon` 키 기반 클라이언트가 trainer_id로 필터된 데이터를 수신할 수 있는지 확인해야 한다.
- **이벤트 폭풍 방지**: 짧은 시간에 여러 이벤트가 수신될 수 있다. `loadReservations`를 매번 호출하면 과도한 쿼리가 발생할 수 있으므로, debounce(300ms) 적용을 권장한다.
- **오프라인 복구**: Realtime 연결이 끊어진 후 복구되면, 누락된 이벤트를 보상하기 위해 `loadReservations(force: true)`를 호출해야 한다. 이는 `visibilitychange` 핸들러에서 이미 처리된다.
- **배너 vs 토스트 구분**: 배너는 사용자의 명시적 액션("확인" 탭)이 있어야 사라지고, 토스트는 자동으로 사라진다. 이 구분은 의도적이다 -- 변경 요청은 반드시 인지해야 하는 정보이므로 자동 소멸되면 안 된다.

---

## 기능 간 의존성 및 구현 순서

### 의존성 관계

```
기능 8 (Realtime 구독)
  ↓ 데이터 갱신 → 기능 6 (Nav dot)에 자동 반영
  ↓ 이벤트 수신 → 기능 7 (Undo 토스트)에서 Undo 시 재갱신 필요

기능 6 (Nav dot)
  ← 기능 8에서 Realtime 갱신 시 자동으로 dot 업데이트됨
  ← 기능 7에서 Undo 시 change_requested 복원되면 dot 재표시

기능 7 (Undo 토스트)
  → 독립적으로 구현 가능 (toast 스토어/컴포넌트 확장)
  → 단, Undo 실행 시 reservationsStore.invalidate() 호출 필요
```

### 권장 구현 순서

| 순서 | 기능 | 이유 | 예상 난이도 |
|------|------|------|------------|
| **1단계** | **기능 6: Nav dot** | 가장 독립적이고 단순함. 스토어에 computed 1개 + 컴포넌트에 dot 1개 추가. 기존 패턴(chatBadge) 재사용. | 낮음 |
| **2단계** | **기능 7: Undo 토스트** | Toast 시스템 확장이 필요하지만 범위가 명확함. approve_change_request RPC의 동작을 파악한 후 Undo 복원 로직을 설계해야 함. | 중간 |
| **3단계** | **기능 8: Realtime 구독** | 가장 넓은 범위. 새 파일 2개 생성 + 기존 파일 3개 수정. Supabase 인프라 설정(Realtime 활성화) 확인 필요. 기능 6의 dot과 자연스럽게 연동됨. | 중간~높음 |

### 단계별 검증 포인트

- **1단계 완료 후**: 트레이너 로그인 → 변경 요청 있는 상태에서 Nav dot 표시 확인 → 승인/거절 후 dot 소멸 확인
- **2단계 완료 후**: 변경 요청 승인 → Undo 토스트 표시 → "실행 취소" 탭 → change_requested 복원 확인 → Nav dot 재표시 확인
- **3단계 완료 후**: 트레이너 앱 열어둔 상태에서 회원이 변경 요청 → 배너 표시 확인 → Nav dot 즉시 갱신 확인 → "확인" 탭 → 일정 관리 이동 확인

---

## 종합 위험 요소

### 높은 위험

| 위험 | 영향 | 완화 방안 |
|------|------|-----------|
| `approve_change_request` RPC가 원본 데이터를 클리어하여 Undo 복원 불가능 | 기능 7 전체 | RPC 동작을 사전에 확인하고, 승인 전 원본 데이터를 반드시 로컬에 캡처. 필요 시 DB 함수에 `returning` 추가 검토 |
| Supabase Realtime이 `reservations` 테이블에 대해 비활성화 상태 | 기능 8 전체 | 개발 착수 전 Supabase 대시보드에서 Replication 설정 확인. 비활성화 시 활성화 필요 (DBA/인프라 조율) |

### 중간 위험

| 위험 | 영향 | 완화 방안 |
|------|------|-----------|
| Undo 클릭 시점에 해당 예약이 이미 다른 상태로 변경됨 (race condition) | 기능 7 | revertApproval에서 현재 상태를 먼저 확인하고, 예상 상태가 아니면 에러 메시지 표시 |
| Realtime 이벤트 폭풍으로 과도한 쿼리 발생 | 기능 8 | `loadReservations` 호출에 300ms debounce 적용 |
| 토스트 `pointer-events` 변경으로 기존 터치 동작에 영향 | 기능 7 | action이 있을 때만 `pointer-events: auto` 적용. action이 없으면 기존 `none` 유지 |

### 낮은 위험

| 위험 | 영향 | 완화 방안 |
|------|------|-----------|
| Nav dot과 채팅 배지가 시각적으로 혼동됨 | 기능 6 | dot(숫자 없음, 8px)과 배지(숫자 있음, 16px+)로 명확히 구분 |
| 배너가 다른 UI 요소와 겹침 | 기능 8 | z-index를 토스트(9999)보다 낮게 설정(9000). fixed position + 상단 배치로 다른 컨텐츠와 겹침 최소화 |

---

## 부록: 현재 코드베이스 현황 참고

### 기존 Realtime 구독 패턴 (참고용)

`chatBadgeStore`와 `notificationBadgeStore`가 이미 동일한 패턴을 사용 중:

- 내부 `_channel` 변수로 중복 구독 방지
- `subscribe()`: `supabase.channel().on('postgres_changes', ...).subscribe()`
- `unsubscribe()`: `supabase.removeChannel(_channel)`
- `TrainerBottomNav.vue`의 `onMounted/onUnmounted`에서 생명주기 관리

### 현재 Toast 시스템 구조

- `src/stores/toast.js`: message, type, visible 상태 관리
- `src/composables/useToast.js`: showToast, showSuccess, showError 래퍼
- `src/components/AppToast.vue`: Teleport to body, Transition 애니메이션
- **제약**: 현재 `pointer-events: none`으로 터치 불가 → 기능 7에서 수정 필요

### 현재 reservations 스토어 노출 API

```
return { reservations, lastFetchedAt, isStale, loadReservations, invalidate, $reset }
```

기능 6에서 `changeRequestCount` 추가, 기능 8에서 `subscribe/unsubscribe` 추가 예정.
