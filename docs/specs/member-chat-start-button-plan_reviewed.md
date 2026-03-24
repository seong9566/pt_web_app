# MemberChatView 채팅 시작 버튼 구현 계획 - 리뷰 완료

> 리뷰 일시: 2026-03-24
> 리뷰 모델: GPT (codex exec, gpt-5.4)
> 원본 파일: docs/specs/member-chat-start-button-plan.md
> 참조한 소스 파일: useConnection.js, useChat.js, useReservations.js, MemberChatView.vue, MemberChatView.css, TrainerChatView.vue, schema.sql, members.js, global.css
> 리뷰 라운드: 2회 (최종 판정: SUCCESS)

---

## 리뷰 이력

| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | FK 구문 ambiguous 위험, checkTrainerConnection 중복 쿼리, 빈 상태 fallback 부재, computed import 누락 |
| 2 | SUCCESS | - |

---

## 최종 계획 내용

> 작성일: 2026-03-24
> UX 리뷰 반영: 2026-03-24 (C1~C3, M1~M5, A1 피드백 적용)
> GPT 리뷰 반영: 2026-03-24 (FK 명시, 중복 쿼리 통합, fallback 보강, computed import)

### 1. 문제 분석

**현재 상태**: `MemberChatView.vue`에서 멤버가 트레이너와의 기존 대화가 없을 때 "대화 내역이 없습니다"만 표시되고, 새 채팅을 시작할 수 있는 진입점이 없음.

**비교 대상**: `TrainerChatView.vue`는 `onMounted`에서 `route.query.partnerId`를 읽어 특정 회원과의 채팅방을 바로 여는 구조를 갖춤.

**핵심 차이점**:
1. 멤버 채팅 뷰에 `route.query.partnerId`를 읽어 자동으로 채팅방을 여는 로직 없음
2. 대화 목록 빈 상태에서 "채팅 시작" 버튼 없음

---

### 2. 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/composables/useConnection.js` | `getConnectedTrainerProfile()` 함수 추가 |
| `src/views/member/MemberChatView.vue` | 채팅 시작 버튼 + 로직 추가, `checkTrainerConnection` 제거 |
| `src/views/member/MemberChatView.css` | 새 버튼 스타일 추가 |

---

### 3. 구현 상세

#### 3-1. useConnection.js — 트레이너 프로필 조회 함수 추가

뷰에서 Supabase를 직접 호출하지 않는 컨벤션 준수를 위해, `useConnection.js`에 연결된 트레이너 프로필 정보를 가져오는 함수를 추가.

**[R1 반영] FK 구문을 명시적 FK명으로 수정** — `profiles!trainer_id` → `profiles!trainer_members_trainer_id_fkey` (기존 `trainer_members_member_id_fkey` 패턴과 일치):

```js
// [A1 반영] .limit(1)로 다중 연결 방어
// [R1 반영] 명시적 FK명 사용
export async function getConnectedTrainerProfile(memberId) {
  if (!memberId) return null
  const { data } = await supabase
    .from('trainer_members')
    .select('trainer:profiles!trainer_members_trainer_id_fkey(id, name, photo_url)')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  return data?.trainer || null
}
```

한 번의 쿼리로 `trainer_members` JOIN `profiles`를 통해 트레이너 프로필까지 조회.
`.limit(1)`을 추가하여 데이터 이상으로 다중 연결이 존재하더라도 에러 없이 첫 번째 결과를 반환.

#### 3-2. MemberChatView.vue — script 수정

**[R1 반영] `computed` import 추가**:
```js
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { getConnectedTrainerProfile } from '@/composables/useConnection'
// checkTrainerConnection import 제거 — getConnectedTrainerProfile로 통합
```

**새로운 reactive 상태**:
```js
const connectedTrainer = ref(null)  // { id, name, photo_url }
// [C2 반영] 채팅 시작 중 로딩 상태
const startingChat = ref(false)

const hasConversationWithTrainer = computed(() => {
  if (!connectedTrainer.value) return false
  return conversations.value.some(c => c.partnerId === connectedTrainer.value.id)
})
```

**[R1 반영] onMounted 수정 — `checkTrainerConnection` 제거, `getConnectedTrainerProfile` 하나로 통합**:
```js
// [M1 반영] fetchConversations와 트레이너 프로필 조회를 병렬 실행
// [R1 반영] checkTrainerConnection 제거 — 연결 여부는 !!profile로 파생
onMounted(async () => {
  const [_, trainerProfile] = await Promise.all([
    fetchConversations(),
    getConnectedTrainerProfile(auth.user?.id).catch(() => null),
  ])
  connectedTrainer.value = trainerProfile
  hasActiveConnection.value = !!trainerProfile

  if (!trainerProfile) return  // 미연결 시 조기 종료

  subscribeToConversations()
  addMessageScrollListener()
})
```

**startNewChat 함수**:
```js
// [C2 반영] 로딩 상태 추가 + [M4 반영] 구독 정리 주의
async function startNewChat() {
  if (!connectedTrainer.value || startingChat.value) return

  const existing = conversations.value.find(
    c => c.partnerId === connectedTrainer.value.id
  )

  if (existing) {
    await openChat(existing)
    return
  }

  // 새 채팅방 열기
  startingChat.value = true
  try {
    partnerName.value = connectedTrainer.value.name ?? '트레이너'
    selectedPartnerId.value = connectedTrainer.value.id
    await fetchMessages(connectedTrainer.value.id)
    subscribeToMessages(connectedTrainer.value.id)
    subscribeToReadReceipts(connectedTrainer.value.id)
    scrollToBottom()
  } finally {
    startingChat.value = false
  }
}
```

#### 3-3. MemberChatView.vue — template 수정

**A. 빈 상태 영역** — [M3 반영] 행동 유도형 카피 + [C2 반영] 로딩/disabled 처리 + [R1 반영] connectedTrainer null fallback:
```html
<div v-else-if="conversations.length === 0" class="member-chat__empty">
  <svg ...><!-- 기존 채팅 아이콘 --></svg>
  <p class="member-chat__empty-title">아직 대화가 없어요</p>
  <p v-if="connectedTrainer" class="member-chat__empty-desc">
    {{ connectedTrainer.name }} 트레이너에게 첫 메시지를 보내보세요
  </p>
  <button
    v-if="connectedTrainer"
    class="member-chat__start-btn press-effect"
    :disabled="startingChat"
    @click="startNewChat"
  >
    <template v-if="startingChat">연결 중...</template>
    <template v-else>메시지 보내기</template>
  </button>
</div>
```

`connectedTrainer`가 null이면 "아직 대화가 없어요" 텍스트만 표시 (graceful fallback).

**B. 헤더 우측에 새 채팅 버튼** — [C1 반영] 44px + [M2 반영] aria-label:
```html
<div class="member-chat__header">
  <h1 class="member-chat__title">채팅</h1>
  <button
    v-if="connectedTrainer && !hasConversationWithTrainer"
    class="member-chat__new-chat-btn press-effect"
    :disabled="startingChat"
    aria-label="새 채팅 시작"
    @click="startNewChat"
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    </svg>
  </button>
</div>
```

#### 3-4. MemberChatView.css — 스타일 추가

```css
/* 빈 상태 카피 */
.member-chat__empty-title {
  margin: 0;
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-bold);
  color: var(--color-gray-900);
}

.member-chat__empty-desc {
  margin: 0;
  font-size: var(--fs-body2);
  color: var(--color-gray-600);
}

/* [M5 반영] 새 채팅 시작 버튼 (빈 상태) — 디자인 시스템 btn-height 준수 */
.member-chat__start-btn {
  margin-top: 16px;
  height: var(--btn-height);
  padding: 0 24px;
  background-color: var(--color-blue-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-medium);
  font-size: var(--fs-body2);
  font-weight: var(--fw-body1-bold);
  cursor: pointer;
  transition: opacity var(--animation-duration-fast) var(--animation-easing-default);
}

.member-chat__start-btn:active {
  opacity: 0.8;
}

/* [C3 반영] disabled 상태 스타일 */
.member-chat__start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* [N1 반영] 헤더 레이아웃 */
.member-chat__header {
  justify-content: space-between;
  gap: 12px;
}

/* [C1 반영] 헤더 새 채팅 버튼 — 44px 터치 타겟 */
.member-chat__new-chat-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-blue-primary);
  background: none;
  border: none;
  cursor: pointer;
}

.member-chat__new-chat-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 포커스 접근성 */
.member-chat__start-btn:focus-visible,
.member-chat__new-chat-btn:focus-visible {
  outline: 2px solid var(--color-blue-primary);
  outline-offset: -2px;
}
```

---

### 4. 구현 순서

1. `useConnection.js` — `getConnectedTrainerProfile()` 함수 추가 (명시적 FK명 + `.limit(1)` 방어)
2. `MemberChatView.vue` script — import 수정(`computed` 추가, `checkTrainerConnection` 제거), reactive 상태, computed, onMounted 통합, startNewChat 함수
3. `MemberChatView.vue` template — 빈 상태 버튼 (행동 유도 카피 + fallback) + 헤더 버튼 (44px, aria-label)
4. `MemberChatView.css` — 새 스타일 (btn-height, disabled, focus-visible)

---

### 5. 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| 트레이너 미연결 | `hasActiveConnection = !!trainerProfile`로 파생. `connectedTrainer` null이면 버튼 미표시, "아직 대화가 없어요"만 표시 |
| 이미 대화 존재 | `startNewChat`에서 conversations 검색 → 기존 대화방으로 이동 |
| 프로필 조회 실패 | `Promise.all`의 `.catch(() => null)`로 graceful degradation — 버튼 미표시 |
| 대화 목록이 있지만 트레이너 대화가 없는 경우 | `hasConversationWithTrainer` computed로 헤더 버튼 조건부 표시 |
| 다중 트레이너 연결 (데이터 이상) | `.limit(1).maybeSingle()`로 에러 방지, 첫 번째 결과 사용 |
| 채팅 시작 중 중복 탭 | `startingChat` ref로 guard + 버튼 disabled 처리 |
| 구독 정리 | `subscribeToMessages` 내부에서 기존 구독 해제. `closeChat` 시 `subscribeToConversations` 재호출로 복구 |

---

### 6. 참고 파일

- `src/views/trainer/TrainerChatView.vue:567-588` — onMounted에서 query.partnerId로 채팅방 자동 열기 패턴
- `src/composables/useChat.js` — fetchMessages, sendMessage, subscribeToMessages 등 API
- `src/composables/useConnection.js` — 기존 연결 관련 유틸 함수

---

### 7. UX 리뷰 반영 이력

| 피드백 | 반영 내용 |
|--------|-----------|
| C1: 터치 타겟 36px 미달 | 헤더 버튼 44x44px으로 변경 |
| C2: 로딩 피드백 없음 | `startingChat` ref + 버튼 disabled + "연결 중..." 텍스트 |
| C3: disabled 스타일 누락 | `.member-chat__start-btn:disabled`, `.member-chat__new-chat-btn:disabled` 추가 |
| M1: 프로필 조회 병렬화 | `Promise.all([fetchConversations(), getConnectedTrainerProfile()])` |
| M2: aria-label 없음 | 헤더 버튼에 `aria-label="새 채팅 시작"` 추가 |
| M3: 빈 상태 카피 | "대화 내역이 없습니다" → "아직 대화가 없어요" + 트레이너 이름 안내 + "메시지 보내기" CTA |
| M4: 구독 정리 | `startNewChat`에서 기존 `openChat` 재사용 패턴 + 주의사항 문서화 |
| M5: 버튼 높이 불일치 | `height: var(--btn-height)` + `padding: 0 24px` |
| N1: 헤더 gap 미지정 | `gap: 12px` 추가 |
| A1: maybeSingle 다중 연결 | `.limit(1).maybeSingle()`로 방어 |

---

### 8. GPT 리뷰 반영 이력

| 라운드 | 피드백 | 반영 내용 |
|--------|--------|-----------|
| R1-1 | FK 구문 ambiguous 위험 | `profiles!trainer_id` → `profiles!trainer_members_trainer_id_fkey`로 명시적 FK명 사용 |
| R1-2 | checkTrainerConnection 중복 쿼리 | `getConnectedTrainerProfile` 하나로 통합, 연결 여부 `!!profile`로 파생 |
| R1-3 | 빈 상태 fallback 부재 | connectedTrainer null일 때도 "아직 대화가 없어요" 텍스트 유지 |
| R1-4 | computed import 누락 | `import { ref, computed, watch, ... }` 수정 |
