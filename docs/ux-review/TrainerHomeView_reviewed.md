# TrainerHomeView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/TrainerHomeView.md
> 참조한 소스 파일: src/views/trainer/TrainerHomeView.vue, src/views/trainer/TrainerHomeView.css, src/router/index.js, src/views/trainer/TrainerChatView.vue, src/assets/css/global.css, src/stores/notificationBadge.js, src/components/TrainerBottomNav.vue
> 리뷰 라운드: 3회 (최종 판정: 최대 반복 도달)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | pendingReservationCount 미정의 변수 누락, 채팅 라우트 제안 코드 오류, prefers-reduced-motion 오판, 디자인 토큰 평가 과장, 날짜 탭 전환 시 섹션 제목 미반영, onActivated 데이터 신선도 불균일, 클릭 가능한 div의 접근성 문제 누락 |
| 2 | NEEDS_IMPROVEMENT | Critical #1 표현 강도 조정 필요(런타임 오류 → 논리 버그), 에러 중복 해결안을 단정적이지 않게 수정, 스케줄 카드 affordance 톤 하향, 전체보기 시맨틱 문제 추가, 날짜 탭 운동 요약 race condition 누락, 상단 액션 카드 레이아웃 점프 누락, 날짜 탭 접근성 semantics 누락 |
| 3 | - | 2라운드 피드백 전체 반영 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/TrainerHomeView.vue` + `TrainerHomeView.css`
- **역할**: 트레이너 메인 홈 화면. 오늘 일정 요약, 연결 회원 수, 대기 중 요청 알림, 최근 메시지를 한눈에 보여주는 대시보드
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 4 | 양호 - 스켈레톤 및 빈 상태 메시지 구현됨 |
| 터치 타겟 | 4 | 양호 - 알림 벨 44px, 날짜 탭은 약간 작음 |
| 스크롤/인터랙션 | 4 | 양호 - 풀투리프레시, press-effect, stagger 애니메이션 |
| 시각적 일관성 | 3.5 | 양호 - 디자인 토큰 사용은 전반적이나 일부 하드코딩 존재 |
| 접근성 | 2.5 | 미흡 - 클릭 가능한 div, aria 속성 누락 다수 |
| 정보 밀도 | 3.5 | 보통~양호 - 시간 정보 중복, 섹션 제목 고정 문제 |
| 전체 사용성 | 3.5 | 보통~양호 |

### Critical (즉시 수정 필요)

#### 1. `pendingReservationCount` 변수가 정의되지 않음 (논리 버그)
- **위치**: `TrainerHomeView.vue:42`
- **문제**: "변경 요청 일정" 액션 카드의 `v-if="pendingReservationCount > 0"` 조건에서 `pendingReservationCount`는 `<script setup>` 어디에도 정의되어 있지 않음. 실제로 존재하는 것은 `changeRequestCount` (line 299). Vue 템플릿에서 미정의 참조는 경고를 발생시키고 조건식이 거짓 처리되어, 변경 요청이 있어도 이 액션 카드가 절대 표시되지 않는 논리 버그.
- **개선안**: `pendingReservationCount`를 `changeRequestCount`로 교체하거나, 별도 computed를 명시적으로 정의.
```html
<div v-if="changeRequestCount > 0" class="trainer-home__action-card ...">
```

### Major (높은 우선순위)

#### 2. 알림 벨 아이콘에 항상 빨간 점(dot)이 표시됨
- **위치**: `TrainerHomeView.vue:21`
- **문제**: `trainer-home__bell-dot`이 조건 없이 항상 렌더링됨. 읽지 않은 알림이 없어도 빨간 점이 보여서 사용자가 "알림이 있나?" 하고 반복 확인하게 됨.
- **개선안**: `useNotificationBadgeStore()`의 `unreadCount`와 연동하여 조건부 렌더링. `pendingConnectionCount` 같은 대체 지표는 알림의 의미와 다르므로 적합하지 않음.
```html
<span v-if="notificationBadge.unreadCount > 0" class="trainer-home__bell-dot"></span>
```

#### 3. 메시지 카드 클릭 시 항상 채팅 목록으로 이동 (개별 대화방 아님)
- **위치**: `TrainerHomeView.vue:167`
- **문제**: `@click="router.push('/trainer/chat')"` - 특정 회원과의 대화를 탭했는데 개별 대화방이 아닌 채팅 목록으로 이동함.
- **개선안**: 현재 앱에는 `/trainer/chat/:id` 라우트가 없고, `TrainerChatView`는 내부적으로 `selectedPartnerId`를 사용함. query 파라미터를 활용하여 직접 대화방 열기를 지원.
```js
@click="router.push({ name: 'trainer-chat', query: { partnerId: conv.partnerId } })"
```

#### 4. 에러 메시지가 인라인과 토스트로 중복 표시됨
- **위치**: `TrainerHomeView.vue:25-27` (인라인 에러), `TrainerHomeView.vue:352-354` (watch 토스트)
- **문제**: `reservError`, `membersError` 발생 시 인라인 에러 박스와 토스트가 동시에 표시됨. `chatError`도 line 159에서 인라인 표시 + line 354에서 토스트 표시로 동일하게 중복됨.
- **개선안**: 핵심은 토스트와 인라인 중 하나로 일관화하는 것. 대시보드의 로드 실패처럼 지속적 표시가 필요한 경우 인라인이 더 적합할 수 있고, 일시적 알림은 토스트가 적합. 동일한 에러를 두 채널로 동시에 보여주는 현재 상태만 해소하면 됨.

#### 5. 날짜 탭을 바꿔도 섹션 제목이 "오늘의 일정"으로 고정됨
- **위치**: `TrainerHomeView.vue:78`
- **문제**: 날짜 탭에서 "내일"이나 다른 요일을 선택해도 섹션 제목이 항상 "오늘의 일정"으로 표시됨. 정보 라벨과 실제 보여지는 데이터의 불일치로 사용자에게 혼란 유발.
- **개선안**: 선택된 날짜에 따라 동적 제목 표시.
```html
<h2 class="trainer-home__section-title">{{ selectedDateTitle }}</h2>
<!-- computed: selectedDate === today ? '오늘의 일정' : `${dateTabs.find(...)?.label}의 일정` -->
```

#### 6. handleRefresh와 onActivated에서 채팅/연결요청 데이터 미갱신
- **위치**: `TrainerHomeView.vue:340-348` (handleRefresh), `TrainerHomeView.vue:357-370` (onActivated)
- **문제**: 풀투리프레시 시 예약과 회원만 새로 불러옴. 채팅 데이터(`fetchConversations`)와 연결 요청(`fetchPendingRequests`)는 갱신하지 않음. `onActivated`에서도 채팅은 재조회하지 않고, pending connection도 store stale 조건일 때만 갱신. 대시보드 데이터 신선도가 일관되지 않아 오래된 정보가 표시될 수 있음.
- **개선안**: `handleRefresh`와 `onActivated` 모두에서 `fetchConversations()`와 `fetchPendingRequests()`를 함께 갱신.

### Minor (개선 권장)

#### 7. 날짜 탭 버튼의 터치 타겟이 다소 작음
- **위치**: `TrainerHomeView.css:242-253`
- **문제**: `padding: 8px 14px`로 높이가 약 32~34px 수준. Apple HIG 기준 최소 44px 권장.
- **개선안**: `min-height: 44px`를 추가하여 터치 타겟 확보.

#### 8. 스케줄 카드의 인터랙션 부재
- **위치**: `TrainerHomeView.vue:110-146`
- **문제**: 액션 카드와 메시지 카드에는 `press-effect` 클래스와 `@click`이 있지만, 스케줄 카드에는 둘 다 없음. 현재 스케줄 카드는 비인터랙티브이므로 affordance 혼란은 크지 않으나, 향후 클릭 기능(일정 상세 보기 등)을 붙일 계획이 있다면 affordance도 함께 보강해야 함.
- **개선안**: 비인터랙티브 카드로 유지하되 `cursor: default`를 명시하거나, 탭 액션을 추가할 때 `press-effect`와 함께 구현.

#### 9. "전체보기" 링크의 터치 영역과 시맨틱 문제
- **위치**: `TrainerHomeView.vue:153`
- **문제**: `<a href="#" @click.prevent>` 패턴으로 된 "전체보기" 링크가 `fs-caption` (12px) 크기로 터치 영역이 매우 작음. 또한 `href="#"` + `preventDefault`는 시맨틱적으로 적절하지 않음.
- **개선안**: `button` 또는 `router-link`로 변경하고, 패딩을 추가하여 최소 44x44px 터치 영역을 확보.
```html
<router-link :to="{ name: 'trainer-chat' }" class="trainer-home__section-link">전체보기</router-link>
```

#### 10. 클릭 가능한 div 요소의 접근성 문제
- **위치**: `TrainerHomeView.vue:31, 42, 162`
- **문제**: 액션 카드와 메시지 카드가 `div`에 `@click`을 붙여 사용됨. 모바일 웹에서도 시맨틱스, 포커스, 접근성 측면에서 적절한 요소가 아님. 알림 벨 버튼(line 16)에도 `aria-label`이 없음.
- **개선안**: 클릭 가능한 `div`들은 `button` 또는 `router-link`로 변경. 알림 벨 버튼에 `aria-label="알림"` 추가.

#### 11. 스케줄 카드에 시간 정보가 중복 표시됨
- **위치**: `TrainerHomeView.vue:123, 131`
- **문제**: `start_time`이 시간 컬럼(123줄)과 서브 텍스트 "XX:XX 수업 시작"(131줄) 두 곳에 동일하게 표시됨. 제한된 모바일 공간에서 불필요한 반복. 다만 스캔성을 높이는 의도적 설계로도 볼 수 있어 Major보다 낮은 우선순위.
- **개선안**: 서브 텍스트를 종료 시간이나 수업 유형 등 차별화된 정보로 교체.

#### 12. 빈 상태 문구가 선택 날짜 문맥을 반영하지 않음
- **위치**: `TrainerHomeView.vue:106`
- **문제**: 미래 탭을 선택했을 때에도 "예약이 없습니다."로만 표시됨. 어떤 날짜의 예약이 없는 것인지 맥락이 불명확.
- **개선안**: 선택 날짜 라벨을 포함한 문구로 변경. 예: "3월 22일 예약이 없습니다."

#### 13. 날짜 탭 전환 시 운동 요약 데이터 race condition
- **위치**: `TrainerHomeView.vue:351`
- **문제**: 날짜 탭 변경마다 `fetchDayWorkoutPlans(date)`를 비동기 호출하는데, 빠르게 탭을 전환하면 이전 요청의 응답이 늦게 도착하여 잘못된 날짜의 운동 요약이 표시될 수 있음.
- **개선안**: 요청 시 날짜를 캡처하고, 응답 수신 시 현재 선택된 날짜와 비교하여 불일치하면 무시.

#### 14. 상단 액션 카드 영역의 레이아웃 점프
- **위치**: `TrainerHomeView.vue:223, 327`
- **문제**: `pendingConnectionCount`가 초기값 0에서 시작하고, API 응답 후 값이 설정되면 액션 카드가 뒤늦게 삽입되며 아래 콘텐츠가 밀림. 초기 로딩 시 레이아웃 점프가 발생.
- **개선안**: 액션 카드 영역에도 스켈레톤 또는 placeholder로 높이를 안정화.

#### 15. 날짜 탭에 접근성 semantics 없음
- **위치**: `TrainerHomeView.vue:82-88`
- **문제**: 날짜 탭은 시각적 active 상태만 있고, `aria-pressed`, `aria-current`, `role="tablist"` 같은 보조 정보가 없음.
- **개선안**: 탭 컨테이너에 `role="tablist"`, 각 버튼에 `role="tab"` + `aria-selected` 추가.

### Good (잘된 점)

- **스켈레톤 UI가 섹션별로 적절히 구현됨**: 예약 로딩 시 `AppSkeleton type="rect"`, 채팅 로딩 시 `type="line"` 등 콘텐츠 형태에 맞는 스켈레톤 적용.
- **풀투리프레시 지원**: `AppPullToRefresh`로 모바일에서 자연스러운 새로고침 경험 제공.
- **빈 상태의 맥락별 분기 처리**: 회원이 0명일 때와 단순히 예약이 없을 때를 구분하여 다른 메시지와 CTA("초대 코드 생성") 제공. 토스 앱 수준의 세심한 처리.
- **stagger 애니메이션**: 카드가 순차적으로 나타나는 애니메이션이 자연스러운 로딩 경험을 제공.
- **onActivated 활용**: `<keep-alive>` 환경에서 탭 전환 시 데이터 신선도를 유지하는 패턴이 잘 구현됨.
- **prefers-reduced-motion 대응**: 전역 CSS(`global.css:172`)에서 `stagger-fade-in` 포함 모든 애니메이션에 대해 적절히 비활성화 처리됨. 로컬 CSS에서도 추가 대응 있음.
- **디자인 토큰 활용**: 전반적으로 CSS 변수를 사용하고 있으나, `linear-gradient` 색상(line 26, 107), `box-shadow` rgba(line 33), 일부 raw px 값(line 188) 등 하드코딩된 값이 존재함.

### 토스 앱 참고 개선안

1. **숫자 카운터 애니메이션**: "오늘 일정" 숫자(todaySessionCount)가 로딩 후 표시될 때 카운팅 애니메이션(0 -> N) 추가.
2. **스케줄 카드 스와이프 액션**: 일정 카드를 좌측으로 스와이프하면 "취소", "변경" 등 빠른 액션을 노출하는 패턴.
3. **그리팅 메시지 시간대별 변경**: "환영합니다" 대신 "좋은 아침이에요" / "오후 수업 화이팅!" 등 시간대별 인사 변경.

### 구조 개선 제안 (참고용)

1. **인라인 SVG 추출**: 벨 아이콘, 사람 아이콘 등 반복되는 SVG를 `AppIcon` 컴포넌트나 SVG 스프라이트로 분리하면 템플릿 가독성 향상.
2. **`formatMessageTime` 유틸리티 추출**: `useChat` composable이나 별도 유틸 파일에 있는 것이 재사용에 적합.
