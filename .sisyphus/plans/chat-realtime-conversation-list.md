# 대화 목록 실시간 업데이트

## TL;DR

> **Quick Summary**: 대화 목록 화면에서 새 메시지를 실시간으로 수신하도록 Realtime 구독 추가
> 
> **Deliverables**:
> - `useChat.js`에 `subscribeToConversations()` 함수 추가
> - 양쪽 ChatView에서 대화 목록 화면 진입 시 구독 시작
> - 채팅방에서 목록으로 복귀 시 재구독
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO — 단일 태스크
> **Critical Path**: Task 1 → Commit

---

## Context

### Original Request
앱을 실행 중이지만 채팅방에 들어가지 않은 상태(대화 목록 화면)에서 상대방이 메시지를 보내면, 대화 목록이 실시간으로 업데이트되지 않음.

### 근본 원인
`useChat.js`에는 **특정 채팅방** 용 Realtime 구독(`subscribeToMessages(partnerId)`)만 있고, **대화 목록** 용 Realtime 구독이 없음.

---

## Work Objectives

### Core Objective
대화 목록 화면에서 새 메시지를 Realtime으로 감지하여 미리보기, 시간, 안읽은 수를 즉시 업데이트

### Must Have
- 대화 목록 화면에서 새 메시지 실시간 수신
- 대화 목록의 미리보기 텍스트, 시간, unread count 업데이트
- chatBadge 스토어의 unreadCount 실시간 증가
- 채팅방에서 목록 복귀 시 재구독

### Must NOT Have
- 기존 `subscribeToMessages()` 함수 변경 금지
- 새 npm 의존성 추가 금지
- `.sisyphus/plans/` 파일 수정 금지

---

## Verification Strategy

### Test Decision
- **Automated tests**: None (Realtime 구독은 Supabase 의존으로 unit test 어려움)

### QA Policy
- `npm run build` 성공 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (단일 태스크):
└── Task 1: subscribeToConversations 구현 + View 연동 [quick]

Wave FINAL:
└── 빌드 검증 + 커밋
```

---

## TODOs

- [x] 1. subscribeToConversations() 구현 + View 연동

  **What to do**:

  ### File 1: `src/composables/useChat.js`

  #### Edit A: conversationChannel 변수 추가 (라인 28-29)

  Find:
  ```
  let channel = null
  let readReceiptChannel = null
  ```

  Replace with:
  ```
  let channel = null
  let readReceiptChannel = null
  let conversationChannel = null
  ```

  #### Edit B: subscribeToConversations() 함수 추가

  `subscribeToReadReceipts()` 함수의 닫는 `.subscribe()` 와 `}` 뒤, `파일 업로드` 주석 블록 전에 삽입.

  Find:
  ```
      .subscribe()
  }

  /**
   * 파일 업로드 — chat-files 버킷
  ```

  Replace with:
  ```
      .subscribe()
  }

  /**
   * 대화 목록용 Realtime 구독 — 나에게 오는 모든 새 메시지 감지
   * 대화 목록 화면에서 호출하여 실시간으로 미리보기/뱃지 업데이트
   */
  function subscribeToConversations() {
    const me = auth.user?.id
    if (!me) return

    if (conversationChannel) {
      supabase.removeChannel(conversationChannel)
      conversationChannel = null
    }

    conversationChannel = supabase
      .channel(`conversations-${me}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${me}`,
        },
        (payload) => {
          const newMsg = payload.new
          const partnerId = newMsg.sender_id

          const idx = conversations.value.findIndex(c => c.partnerId === partnerId)

          if (idx !== -1) {
            const conv = conversations.value[idx]
            conv.lastMessage = newMsg.file_url && !newMsg.content ? '파일을 보냈습니다' : (newMsg.content ?? '')
            conv.lastMessageTime = newMsg.created_at
            conv.unreadCount += 1
            conversations.value.splice(idx, 1)
            conversations.value.unshift(conv)
          } else {
            conversations.value.unshift({
              partnerId,
              partnerName: '새 대화',
              partnerPhoto: null,
              lastMessage: newMsg.file_url && !newMsg.content ? '파일을 보냈습니다' : (newMsg.content ?? ''),
              lastMessageTime: newMsg.created_at,
              unreadCount: 1,
            })
          }

          try {
            const chatBadgeStore = useChatBadgeStore()
            chatBadgeStore.unreadCount += 1
          } catch {
            // 무시
          }
        }
      )
      .subscribe()
  }

  /**
   * 파일 업로드 — chat-files 버킷
  ```

  #### Edit C: unsubscribe() 함수에 conversationChannel 해제 추가

  Find:
  ```
    if (readReceiptChannel) {
      supabase.removeChannel(readReceiptChannel)
      readReceiptChannel = null
    }
  }
  ```

  Replace with:
  ```
    if (readReceiptChannel) {
      supabase.removeChannel(readReceiptChannel)
      readReceiptChannel = null
    }
    if (conversationChannel) {
      supabase.removeChannel(conversationChannel)
      conversationChannel = null
    }
  }
  ```

  #### Edit D: return 문에 subscribeToConversations 추가

  Find:
  ```
    subscribeToReadReceipts,
    unsubscribe,
  ```

  Replace with:
  ```
    subscribeToReadReceipts,
    subscribeToConversations,
    unsubscribe,
  ```

  ---

  ### File 2: `src/views/trainer/TrainerChatView.vue`

  #### Edit A: destructure에 subscribeToConversations 추가

  Find:
  ```
  subscribeToMessages,
  ```

  Replace with (in the useChat destructure block):
  ```
  subscribeToMessages,
  subscribeToConversations,
  ```

  #### Edit B: onMounted에서 구독 시작

  Find:
  ```
  onMounted(async () => {
    await fetchConversations()
    const partnerId = route.query.partnerId
  ```

  Replace with:
  ```
  onMounted(async () => {
    await fetchConversations()
    subscribeToConversations()
    const partnerId = route.query.partnerId
  ```

  #### Edit C: closeChat에서 대화 목록 복귀 시 재구독

  Find the closeChat function. After the last line (which is `inputText.value = ''`), add two lines: `fetchConversations()` and `subscribeToConversations()`.

  ---

  ### File 3: `src/views/member/MemberChatView.vue`

  #### Edit A: destructure에 subscribeToConversations 추가

  Same as TrainerChatView — find `subscribeToMessages,` in useChat destructure, add `subscribeToConversations,` after it.

  #### Edit B: onMounted에서 구독 시작

  Find:
  ```
    fetchConversations()
    addMessageScrollListener()
  })
  ```

  Replace with:
  ```
    fetchConversations()
    subscribeToConversations()
    addMessageScrollListener()
  })
  ```

  #### Edit C: closeChat에서 재구독

  Find:
  ```
  function closeChat() {
    unsubscribe()
    closeSearchMode()
    selectedPartnerId.value = null
    partnerName.value = ''
    inputText.value = ''
  }
  ```

  Replace with:
  ```
  function closeChat() {
    unsubscribe()
    closeSearchMode()
    selectedPartnerId.value = null
    partnerName.value = ''
    inputText.value = ''
    fetchConversations()
    subscribeToConversations()
  }
  ```

  **Must NOT do**:
  - 기존 subscribeToMessages() 수정 금지
  - .sisyphus/ 파일 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Commit
  - **Blocked By**: None

  **References**:
  - `src/composables/useChat.js:28-29` — channel 변수 선언 위치
  - `src/composables/useChat.js:312-337` — subscribeToMessages() 패턴 참조 (동일 Realtime 패턴 사용)
  - `src/composables/useChat.js:357-386` — subscribeToReadReceipts() 바로 뒤에 삽입
  - `src/composables/useChat.js:342-351` — unsubscribe() 함수
  - `src/composables/useChat.js:434` — return 문
  - `src/views/trainer/TrainerChatView.vue:248` — useChat destructure
  - `src/views/trainer/TrainerChatView.vue:424-447` — onMounted
  - `src/views/trainer/TrainerChatView.vue:376` — closeChat function (검색해서 찾을 것)
  - `src/views/member/MemberChatView.vue:240` — useChat destructure
  - `src/views/member/MemberChatView.vue:399-405` — onMounted
  - `src/views/member/MemberChatView.vue:356-362` — closeChat function
  - `src/stores/chatBadge.js` — chatBadge 스토어 (unreadCount 직접 증가)

  **Acceptance Criteria**:
  - [x] `npm run build` 성공
  - [x] `subscribeToConversations` 함수가 useChat.js에 존재
  - [x] 양쪽 ChatView onMounted에서 `subscribeToConversations()` 호출
  - [x] 양쪽 ChatView closeChat에서 `fetchConversations()` + `subscribeToConversations()` 호출
  - [x] unsubscribe()에서 conversationChannel 해제

  **Commit**: YES
  - Message: `feat(chat): 대화 목록 실시간 업데이트 구독 추가`
  - Files: `src/composables/useChat.js`, `src/views/trainer/TrainerChatView.vue`, `src/views/member/MemberChatView.vue`
  - Pre-commit: `npm run build`

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: 성공
```

### Final Checklist
- [x] subscribeToConversations() 구현 완료
- [x] 양쪽 View에서 onMounted + closeChat에서 호출
- [x] unsubscribe()에서 해제
- [x] 빌드 성공
- [x] 커밋 완료 (79f39b1)
