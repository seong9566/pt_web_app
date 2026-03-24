# MemberChatView 채팅 시작 버튼 -- UX 리뷰

## 개요
- **대상**: 구현 계획서 (`docs/specs/member-chat-start-button-plan.md`)
- **리뷰 일자**: 2026-03-24
- **리뷰어**: Claude UX Review Agent
- **비교 대상**: `TrainerChatView.vue` (트레이너 채팅 화면)

---

## 계획 UX 평가

| 항목 | 평가 | 비고 |
|------|------|------|
| 문제 정의 | 적절 | 빈 상태에서 행동 유도가 없는 현재 문제를 정확히 파악 |
| 해결 방향 | 적절 | 빈 상태 CTA + 헤더 버튼 이중 진입점은 발견성 측면에서 올바름 |
| 데이터 흐름 | 적절 | composable을 통한 Supabase 호출 컨벤션 준수 |
| 엣지 케이스 처리 | 부분적 | 주요 케이스는 다루나 누락 사항 있음 (아래 상세) |
| 터치 타겟 | 미흡 | 헤더 새 채팅 버튼 36x36px으로 44px 미달 |
| 접근성 | 미흡 | aria-label 미제공, 포커스 관리 없음 |
| 트레이너 뷰 일관성 | 부분적 | 트레이너 뷰는 query param으로 채팅 시작하는 구조와 상이 |
| 로딩/전환 상태 | 미흡 | startNewChat 실행 중 로딩 피드백 없음 |

---

## Critical (수정 필요)

### C1. 헤더 새 채팅 버튼 터치 타겟 44px 미달

**위치**: 계획서 3-4절 `.member-chat__new-chat-btn` (width: 36px, height: 36px)

**문제**: 모바일 터치 타겟 최소 기준 44x44px을 충족하지 못함. 480px 모바일 전용 앱에서 헤더 우측 아이콘 버튼이 36px이면 오탭 확률이 높음.

**사용자 영향**: 채팅 시작 의도가 있는 사용자가 버튼을 정확히 누르기 어려움. 특히 이동 중 한 손 조작 시 심각.

**추천안**: width/height를 44px로 변경.

```css
.member-chat__new-chat-btn {
  width: 44px;
  height: 44px;
  /* 나머지 동일 */
}
```

---

### C2. startNewChat 실행 중 로딩 피드백 없음

**위치**: 계획서 3-2절 `startNewChat` 함수

**문제**: `startNewChat`은 `fetchMessages`, `subscribeToMessages`, `subscribeToReadReceipts` 등 여러 비동기 작업을 수행하지만, 실행 중 사용자에게 어떤 피드백도 없음. 네트워크가 느린 환경에서 버튼을 누른 후 아무 반응이 없으면 중복 탭이 발생함.

**사용자 영향**: 버튼을 눌렀는데 반응이 없어 보여서 여러 번 탭 -> 중복 구독/비동기 호출 가능성.

**추천안**: startNewChat 진행 중 버튼 disabled 처리 + 로딩 상태 추가.

```js
const startingChat = ref(false)

async function startNewChat() {
  if (!connectedTrainer.value || startingChat.value) return
  startingChat.value = true
  try {
    // ... 기존 로직
  } finally {
    startingChat.value = false
  }
}
```

```html
<button
  v-if="connectedTrainer"
  class="member-chat__start-btn"
  :disabled="startingChat"
  @click="startNewChat"
>
  <template v-if="startingChat">연결 중...</template>
  <template v-else>{{ connectedTrainer.name }} 트레이너에게 메시지 보내기</template>
</button>
```

---

### C3. 빈 상태 버튼의 :active 피드백만으로는 불충분 -- disabled 상태 스타일 누락

**위치**: 계획서 3-4절 `.member-chat__start-btn`

**문제**: 계획된 CSS에 `:active` 피드백(opacity 0.8)만 있고, `:disabled` 상태 스타일이 없음. C2의 로딩 상태를 추가하면 disabled 상태가 시각적으로 구분되지 않아 사용자가 버튼이 동작하지 않는다고 오해할 수 있음.

**추천안**:

```css
.member-chat__start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Major (개선 권장)

### M1. connectedTrainer 프로필 조회와 fetchConversations 병렬 실행 미적용

**위치**: 계획서 3-2절 onMounted

**문제**: 현재 계획에서 `getConnectedTrainerProfile`은 `fetchConversations` 이후 순차 실행됨. 두 호출은 독립적이므로 `Promise.all`로 병렬 실행하면 초기 로딩 시간을 단축할 수 있음.

**사용자 영향**: 빈 상태 화면에서 "메시지 보내기" 버튼이 나타나기까지 불필요하게 긴 대기.

**추천안**:

```js
onMounted(async () => {
  const connected = await checkTrainerConnection()
  hasActiveConnection.value = connected
  if (!connected) return

  // 병렬 실행
  const [_, trainerProfile] = await Promise.all([
    fetchConversations(),
    getConnectedTrainerProfile(auth.user.id).catch(() => null)
  ])
  connectedTrainer.value = trainerProfile

  subscribeToConversations()
  addMessageScrollListener()
})
```

---

### M2. 헤더 새 채팅 버튼에 툴팁/aria-label 없음

**위치**: 계획서 3-3절 B. 헤더 버튼

**문제**: "+" 아이콘만 있는 버튼에 텍스트 레이블이나 aria-label이 없음. 스크린 리더 사용자는 버튼의 용도를 알 수 없고, 일반 사용자도 "+" 아이콘이 "새 채팅 시작"을 의미하는지 직관적으로 파악하기 어려울 수 있음.

**사용자 영향**: 접근성 위반 + 아이콘만으로는 의미 전달 불충분.

**추천안**:

```html
<button
  v-if="connectedTrainer && !hasConversationWithTrainer"
  class="member-chat__new-chat-btn"
  aria-label="새 채팅 시작"
  @click="startNewChat"
>
  <!-- SVG -->
</button>
```

---

### M3. 빈 상태에서 "대화 내역이 없습니다" 문구가 행동을 유도하지 않음

**위치**: 계획서 3-3절 A. 빈 상태 영역, MemberChatView.vue:37

**문제**: 현재 "대화 내역이 없습니다"는 현상 설명에 그침. 아래에 버튼이 추가되더라도 설명 카피가 행동을 유도하지 않음. 토스 앱의 빈 상태는 "아직 대화가 없어요"처럼 친근한 톤 + "시작하기" 같은 행동 유도 문구를 함께 사용.

**사용자 영향**: 빈 상태에서 다음 행동이 무엇인지 직관적으로 파악하기 어려움.

**추천안**: 빈 상태 카피를 행동 유도형으로 변경.

```html
<div v-else-if="conversations.length === 0" class="member-chat__empty">
  <svg ...><!-- 기존 채팅 아이콘 --></svg>
  <p style="font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">
    아직 대화가 없어요
  </p>
  <p v-if="connectedTrainer" style="color: var(--color-gray-600);">
    {{ connectedTrainer.name }} 트레이너에게 첫 메시지를 보내보세요
  </p>
  <button
    v-if="connectedTrainer"
    class="member-chat__start-btn"
    @click="startNewChat"
  >
    메시지 보내기
  </button>
</div>
```

---

### M4. startNewChat에서 채팅방 전환 시 구독 정리 누락 가능성

**위치**: 계획서 3-2절 startNewChat 함수

**문제**: 계획된 `startNewChat` 함수에서 새 채팅방을 열 때 `subscribeToMessages`와 `subscribeToReadReceipts`를 호출하지만, 기존 구독 해제(`unsubscribe`)를 먼저 호출하지 않음. `subscribeToMessages` 내부에서 `unsubscribe()`를 호출하긴 하지만, `subscribeToReadReceipts`는 자체적으로 이전 채널만 정리함. `conversationChannel`도 함께 정리되는 부수 효과가 발생하여 대화 목록 실시간 업데이트가 중단될 수 있음.

**사용자 영향**: 채팅방 진입 후 대화 목록으로 돌아왔을 때 실시간 업데이트가 작동하지 않을 수 있음.

**추천안**: startNewChat에서 기존 `openChat` 함수를 최대한 재사용하거나, 구독 정리를 명시적으로 처리.

```js
async function startNewChat() {
  if (!connectedTrainer.value || startingChat.value) return

  const existing = conversations.value.find(
    c => c.partnerId === connectedTrainer.value.id
  )

  if (existing) {
    await openChat(existing)
    return
  }

  // 새 채팅방 -- openChat과 동일한 구독 패턴 적용
  startingChat.value = true
  try {
    partnerName.value = connectedTrainer.value.name ?? '트레이너'
    selectedPartnerId.value = connectedTrainer.value.id
    await fetchMessages(connectedTrainer.value.id)
    // conversationChannel은 유지하면서 message/readReceipt만 구독
    subscribeToMessages(connectedTrainer.value.id)
    subscribeToReadReceipts(connectedTrainer.value.id)
    scrollToBottom()
  } finally {
    startingChat.value = false
  }
}
```

주의: `subscribeToMessages` 내부에서 `unsubscribe()`를 호출하면 `conversationChannel`까지 해제됨. `closeChat`에서 `subscribeToConversations()`를 다시 호출하므로 복구되지만, 이 동작을 문서화하거나 구독 해제 로직을 채널별로 분리하는 것이 더 안전함.

---

### M5. 빈 상태 CTA 버튼 높이가 --btn-height(52px)과 불일치

**위치**: 계획서 3-4절 `.member-chat__start-btn` (padding: 12px 24px)

**문제**: 디자인 시스템에서 기본 버튼 높이는 `--btn-height: 52px`인데, 계획된 버튼은 `padding: 12px 24px`으로 대략 40~42px 정도가 됨. 앱 전체의 주요 CTA 버튼 크기와 불일치하면 시각적으로 덜 중요한 버튼처럼 보임.

**사용자 영향**: 빈 상태에서 가장 중요한 행동 유도 버튼이 시각적으로 약하게 보임.

**추천안**: 명시적 높이 지정으로 디자인 시스템과 일치시킴.

```css
.member-chat__start-btn {
  margin-top: 16px;
  height: var(--btn-height);
  padding: 0 24px;
  /* 나머지 동일 */
}
```

---

## Minor (참고)

### N1. 헤더 `justify-content: space-between` 추가 시 기존 스타일과의 충돌 가능성

**위치**: 계획서 3-4절 `.member-chat__header`

**문제**: 현재 `.member-chat__header`에는 `justify-content`가 미지정(기본값 flex-start). 계획서에서 `justify-content: space-between`을 추가하면 기존에 제목만 있을 때도 레이아웃에 영향을 줌. 버튼이 없는 상태에서는 제목이 좌측에 유지되므로 실질적 영향은 없지만, 명시적으로 기존 스타일을 덮어쓰는 것이므로 주의 필요.

**추천안**: 문제없음. 다만 헤더에 `gap` 속성도 함께 추가하면 제목과 버튼 간 최소 간격을 보장할 수 있음.

```css
.member-chat__header {
  justify-content: space-between;
  gap: 12px;
}
```

---

### N2. 트레이너 채팅 뷰와의 비대칭 -- 멤버 뷰에 연결 해제 시 "뒤로가기" 버튼 없음

**위치**: MemberChatView.vue:5-8 vs TrainerChatView.vue:4-15

**문제**: 트레이너 채팅 뷰는 비연결 상태에서 SVG 아이콘 + 설명 문구 + "뒤로가기" AppButton을 표시하지만, 멤버 채팅 뷰는 텍스트만 표시하고 탈출 방법이 하단 네비게이션뿐임. 이 문제는 계획 범위 밖이지만 기존 코드의 일관성 이슈로 기록함.

**추천안**: 향후 개선 시 멤버 비연결 상태에도 "트레이너 찾기" 같은 행동 유도 버튼 추가 고려.

---

### N3. 빈 상태 영역의 하단 네비 스페이서가 불필요하게 중복될 수 있음

**위치**: MemberChatView.vue:71

**문제**: 현재 하단 네비 스페이서는 대화 목록 패널(`member-chat__list-panel`) 내부 맨 아래에 있음. 빈 상태에서는 `flex: 1`로 중앙 정렬되므로 스페이서가 필요하지 않지만, 대화 목록이 길어지면 스페이서가 활성화됨. 이 구조 자체는 문제없으나, 빈 상태에서 스페이서가 빈 공간을 차지하면서 CTA 버튼이 정확한 중앙보다 약간 위에 위치할 수 있음.

**추천안**: 현재 구조로도 시각적으로 큰 문제는 없으므로 참고만.

---

## Good (잘된 점)

### G1. Graceful degradation 설계
`getConnectedTrainerProfile` 실패 시 try/catch로 감싸고 `connectedTrainer`를 null로 유지하여 버튼을 숨기는 방식은 올바른 설계. 프로필 조회 실패가 전체 채팅 기능을 차단하지 않음.

### G2. 이중 진입점 (빈 상태 CTA + 헤더 버튼)
빈 상태에서의 주요 CTA와 대화 목록이 있지만 트레이너 대화가 없는 경우의 헤더 버튼 -- 두 가지 시나리오를 모두 커버하는 것은 발견성 측면에서 우수함.

### G3. 기존 openChat 함수 재사용
이미 대화가 존재하는 경우 `openChat`을 호출하여 기존 로직을 재사용하는 설계는 코드 일관성과 유지보수 측면에서 좋음.

### G4. hasConversationWithTrainer computed 활용
헤더 버튼의 표시 조건을 computed로 관리하여 반응적으로 업데이트되는 것은 적절한 Vue 패턴 활용.

---

## 토스 앱 참고 개선안

### T1. 빈 상태 일러스트레이션 강화
토스 채팅의 빈 상태는 단순 아이콘보다 더 풍부한 일러스트를 사용하여 감성적 연결을 만듦. 현재 48x48 SVG 아이콘은 빈 화면에서 시각적 무게감이 부족함. 64x64 이상의 크기이거나 색상이 있는 일러스트를 고려할 것.

### T2. 버튼 카피 간결화
토스 스타일의 CTA는 짧고 행동 중심적. "{{ name }} 트레이너에게 메시지 보내기"는 다소 길어서 480px 화면에서 2줄로 넘어갈 수 있음. 특히 트레이너 이름이 긴 경우(예: "홍길동 트레이너에게 메시지 보내기") 가독성이 떨어짐.

**추천안**: 버튼은 "메시지 보내기"로 짧게, 트레이너 이름은 버튼 위 설명 텍스트에 배치.

```html
<p>{{ connectedTrainer.name }} 트레이너</p>
<button class="member-chat__start-btn" @click="startNewChat">
  메시지 보내기
</button>
```

### T3. 채팅방 진입 전환 애니메이션
토스는 채팅방 진입 시 오른쪽에서 슬라이드 인 되는 전환 효과를 사용함. 현재 구현은 `selectedPartnerId` 토글로 즉시 전환되어 맥락 단절감이 있음. 이 부분은 계획 범위를 넘지만, 향후 `<Transition>` 컴포넌트를 활용한 슬라이드 전환을 고려할 것.

---

## 추가 UX 고려사항

### A1. 멤버가 여러 트레이너와 연결된 경우
현재 `getConnectedTrainerProfile`은 `.maybeSingle()`을 사용하는데, 만약 한 멤버가 2명 이상의 트레이너와 활성 연결이 있으면 Supabase에서 에러가 발생함(maybeSingle은 0~1개만 허용). 비즈니스 로직상 1:1만 허용하더라도, 데이터 이상 시 에러 대신 첫 번째 결과를 사용하는 방어 코드가 필요함.

**추천안**: `.maybeSingle()` 대신 `.limit(1).maybeSingle()` 또는 `.limit(1)` + 배열 첫 번째 요소 사용.

### A2. 실시간 구독 중 connectedTrainer가 null인 타이밍
`subscribeToConversations`에서 새 메시지가 도착하여 conversations가 업데이트되면, `hasConversationWithTrainer` computed가 재평가됨. 하지만 `connectedTrainer` 프로필 조회가 아직 완료되지 않은 시점에서는 항상 false를 반환하여 헤더 버튼이 깜빡일 수 있음.

**추천안**: M1에서 제안한 병렬 로딩을 적용하면 이 타이밍 이슈가 자연스럽게 해소됨.

### A3. 뒤로 가기(브라우저 백 버튼) 처리 미고려
채팅방(selectedPartnerId가 설정된 상태)에서 브라우저 뒤로 가기를 누르면 대화 목록으로 돌아가야 하지만, 현재 구현은 `closeChat` 함수를 버튼 클릭으로만 호출함. PWA에서 뒤로 가기 제스처는 매우 빈번한 인터랙션이므로, `popstate` 이벤트 또는 router 가드를 통한 처리가 필요함. 이 문제는 기존 코드에도 동일하게 존재하며 계획 범위 밖이지만, 신규 진입점(startNewChat)을 추가하면서 함께 고려하면 좋음.

---

## 요약 테이블

| # | 문제 | 위치 | 사용자 영향 | 우선순위 |
|---|------|------|------------|----------|
| C1 | 헤더 새 채팅 버튼 터치 타겟 36px (44px 미달) | 계획서 3-4절 `.member-chat__new-chat-btn` | 오탭, 한 손 조작 시 치명적 | 높음 |
| C2 | startNewChat 실행 중 로딩 피드백 없음 | 계획서 3-2절 `startNewChat` | 중복 탭, 무반응으로 인한 혼란 | 높음 |
| C3 | CTA 버튼 disabled 상태 스타일 누락 | 계획서 3-4절 `.member-chat__start-btn` | 로딩 중 버튼 상태 구분 불가 | 높음 |
| M1 | 트레이너 프로필 조회 병렬화 미적용 | 계획서 3-2절 onMounted | 초기 로딩 지연 | 중간 |
| M2 | 헤더 아이콘 버튼에 aria-label 없음 | 계획서 3-3절 B | 접근성 위반 | 중간 |
| M3 | 빈 상태 카피가 행동 유도적이지 않음 | 계획서 3-3절 A | 다음 행동 파악 어려움 | 중간 |
| M4 | startNewChat 구독 정리 순서 문제 | 계획서 3-2절 startNewChat | 실시간 업데이트 중단 가능 | 중간 |
| M5 | CTA 버튼 높이가 디자인 시스템과 불일치 | 계획서 3-4절 `.member-chat__start-btn` | 시각적 중요도 낮아 보임 | 중간 |
| N1 | 헤더 justify-content 변경 시 gap 미지정 | 계획서 3-4절 `.member-chat__header` | 미미 | 낮음 |
| N2 | 비연결 상태에서 뒤로가기 버튼 없음 (기존 이슈) | MemberChatView.vue:5-8 | 탈출 방법 제한적 | 낮음 |
| A1 | 다중 트레이너 연결 시 maybeSingle 에러 | 계획서 3-1절 getConnectedTrainerProfile | 데이터 이상 시 버튼 미표시 | 중간 |
