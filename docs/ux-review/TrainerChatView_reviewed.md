# TrainerChatView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/TrainerChatView.md
> 참조한 소스 파일: src/views/trainer/TrainerChatView.vue, src/views/trainer/TrainerChatView.css, src/composables/useChat.js, src/composables/useConnection.js, src/assets/css/global.css, src/components/AppImageViewer.vue, src/components/AppVideoViewer.vue
> 리뷰 라운드: 2회 (최종 판정: 라운드 1 피드백 반영 + 라운드 2 rate limit으로 최종 수정본 기준)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 뒤로가기 버튼 스타일 리셋은 global.css에서 이미 적용(오탐), 검색 기능 dead code는 Critical이 아닌 Minor로 하향, messages deep watch는 Minor보다 상향(실제 UX 버그), 채팅방 패널 480px 셸 깨짐 누락, 100vh/키보드/safe-area 문제 누락, 딥링크 진입 시 상대 이름 미표시 누락, 아이콘 버튼 aria-label 부재 누락 |
| 2 | (rate limit) | 라운드 1 피드백 기반으로 최종 수정본 작성 |

---

## 최종 리뷰 내용

## 개요
- **파일**: `src/views/trainer/TrainerChatView.vue` + `TrainerChatView.css`
- **역할**: 트레이너 채팅 화면 - 대화 목록 패널과 채팅방 패널을 단일 뷰 내에서 전환. Supabase Realtime을 통한 실시간 메시지 송수신, 파일/이미지/영상 첨부, 읽음 표시, 과거 메시지 스크롤 로드 지원.

## 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 4 | 양호 - 스켈레톤, 빈 상태, 에러 토스트 구현 |
| 터치 타겟 | 3 | 보통 - 뒤로가기 버튼 터치 타겟 44px 미만, 파일 제거 버튼 22px |
| 스크롤/인터랙션 | 3 | 보통 - 과거 메시지 로드 잘 구현되었으나 deep watch 부작용 |
| 시각적 일관성 | 4 | 양호 - 디자인 토큰 준수, 말풍선/배지 디자인 우수 |
| 접근성 | 2 | 미흡 - 아이콘 버튼에 aria-label 전반 부족 |
| 정보 밀도 | 4 | 양호 - 대화 목록 카드 구성 적절 |
| 전체 사용성 | 3.5 | 양호 - 핵심 채팅 플로우 완성되었으나 세부 인터랙션 개선 필요 |

---

## 🔴 Critical (즉시 수정 필요)

### 1. 뒤로가기 버튼 터치 타겟 44px 미만
- **위치**: `TrainerChatView.css:202-209` (`.trainer-chat__back-btn`)
- **현재**: `padding: 4px`만 있어 실제 터치 영역이 약 `32px x 32px` 수준. (참고: `background`, `border` 리셋은 global.css의 `button` 기본 리셋에서 이미 적용됨.)
- **문제**: 터치 타겟 44px 미만으로 모바일에서 탭하기 어려움.
- **개선안**:
```css
.trainer-chat__back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-900);
  border-radius: 50%;
  transition: background-color 0.15s;
}
.trainer-chat__back-btn:active {
  background-color: var(--color-gray-100);
}
```

### 2. 파일 전송 중 로딩 피드백 없음 + 실패 시 draft 유실
- **위치**: `TrainerChatView.vue:474-489` (`handleSend`)
- **현재**: 텍스트/파일 전송 시 `sendMessage`를 순차 호출하지만, 전송 중임을 알려주는 UI가 없음. 입력 텍스트와 pending 파일이 즉시 초기화(479-480행)되어 전송 전에 draft가 사라짐. `useChat.js`의 `loading`은 UI에 직접 노출되지 않음. 업로드 실패 시 원본 draft가 이미 사라져 복구 불가.
- **개선안**:
  1. 전송 중 상태(`sending`)를 추가하여 send 버튼에 스피너 표시 및 입력 영역 비활성화.
  2. 낙관적 업데이트: 전송 전에 임시 메시지를 messages 배열에 추가, 실패 시 "전송 실패" 표시와 재시도 버튼 제공.
  3. draft 초기화를 전송 성공 후로 이동하거나, 실패 시 복원.

### 3. `messages` watcher `deep: true`로 인한 원치 않는 자동 스크롤 (UX 버그)
- **위치**: `TrainerChatView.vue:549-551`
- **현재**: `watch(messages, ..., { deep: true })` — 배열 내부 객체의 어떤 속성이 변해도 `scrollToBottom` 트리거.
- **문제**: `is_read` 속성 변경(읽음 처리)만으로도 `scrollToBottom`이 실행되어, 사용자가 과거 메시지를 읽고 있는 중에 갑자기 맨 아래로 스크롤됨. 이것은 사용자 읽기 흐름을 깨뜨리는 실제 UX 버그.
- **개선안**: `messages.length`만 감시하거나, 마지막 메시지 id 변화만 추적. 사용자가 이미 하단 근처일 때만 자동 스크롤.
```js
watch(() => messages.value.length, (newLen, oldLen) => {
  if (newLen > oldLen && selectedPartnerId.value && !skipAutoScroll.value) {
    scrollToBottom()
  }
})
```

---

## 🟠 Major (높은 우선순위)

### 4. 채팅방 패널이 앱의 480px 셸을 깨고 전체 폭을 덮음
- **위치**: `TrainerChatView.css:180-189` (`.trainer-chat__room-panel`)
- **현재**: `position: fixed; left: 0; right: 0;`으로 브라우저 전체 폭을 차지. 앱 컨테이너는 `max-width: 480px`(global.css)인데 이 제약을 무시함.
- **문제**: 데스크톱/태블릿 미리보기에서 채팅방이 전체 화면 폭으로 늘어나 UX가 깨짐.
- **개선안**: `max-width: var(--app-max-width)` + 센터 정렬 적용.
```css
.trainer-chat__room-panel {
  max-width: var(--app-max-width);
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
}
```

### 5. 모바일 키보드/viewport 대응 취약
- **위치**: `TrainerChatView.css:183` (`height: 100vh`), `405-413` (input-area)
- **현재**: 채팅방이 `100vh`를 사용하고, 입력 영역에 `safe-area-inset-bottom` 처리가 없음.
- **문제**: iOS 모바일 브라우저에서 키보드가 올라오면 `100vh`가 실제 가시 영역과 달라 입력 영역이 가려짐. iPhone X 이상에서 홈 인디케이터와 겹칠 수 있음.
- **개선안**: `100dvh` fallback, safe-area padding 추가.
```css
.trainer-chat__room-panel {
  height: 100vh;
  height: 100dvh;
}
.trainer-chat__input-area {
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}
```

### 6. 파일 미리보기 제거 버튼 22px — 터치하기 매우 어려움
- **위치**: `TrainerChatView.css:560-574` (`.trainer-chat__file-preview-remove`)
- **현재**: `width: 22px; height: 22px`
- **문제**: 44px 최소 기준의 절반. 이미지 미리보기 썸네일(56px) 우상단에 위치하여 정확히 탭하기 매우 어려움.
- **개선안**: 버튼 자체를 `44x44`로 만들고 내부 아이콘만 22px로 유지.
```css
.trainer-chat__file-preview-remove {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: -11px;
  right: -11px;
}
```

### 7. 텍스트 input에서 Enter 키로 전송 시 한글 조합 중 중복 전송
- **위치**: `TrainerChatView.vue:249` (`@keyup.enter="handleSend"`)
- **현재**: `@keyup.enter`는 한글 IME 조합 중 Enter를 누르면 조합 완료와 동시에 `handleSend`가 호출됨.
- **문제**: 한글 입력 중 Enter를 누르면 의도하지 않은 전송이 발생할 수 있음. 한국어 사용자에게 빈번한 문제.
- **개선안**: `@keydown.enter.prevent` + `event.isComposing` 체크, `enterkeyhint="send"` 추가.
```html
<input
  @keydown.enter.prevent="onEnterKey"
  enterkeyhint="send"
/>
```
```js
function onEnterKey(e) {
  if (e.isComposing) return
  handleSend()
}
```

### 8. 파일 메뉴 패널이 외부 클릭으로 닫히지 않음
- **위치**: `TrainerChatView.vue:239,262-281`
- **현재**: "+" 버튼 클릭으로만 토글. 파일 메뉴 외부 영역을 탭해도 닫히지 않음.
- **개선안**: 메시지 영역 클릭 시 `showFileMenu = false` 처리, 또는 backdrop 오버레이 추가.

### 9. 딥링크 진입 시 상대 이름이 "채팅"으로 고정됨
- **위치**: `TrainerChatView.vue:579-588`
- **현재**: 기존 대화 목록에 없는 상대와의 채팅방 진입 시 `partnerName.value = '채팅'`만 설정. 프로필 조회 없음.
- **문제**: 헤더 타이틀이 실제 상대 이름이 아닌 "채팅"으로 표시되어 맥락 파악이 어려움.
- **개선안**: `partnerId`로 프로필 조회 후 실제 이름을 채우는 로직 추가.

### 10. 아이콘 버튼에 접근성 이름 부재
- **위치**: `TrainerChatView.vue:87` (뒤로가기), `239` (+파일), `251` (전송)
- **현재**: 모든 아이콘-only 버튼에 `aria-label`이 없음.
- **개선안**: 각 버튼에 `aria-label` 추가.
```html
<button class="trainer-chat__back-btn" aria-label="대화 목록으로 돌아가기" @click="closeChat">
<button class="trainer-chat__file-btn" aria-label="파일 첨부" @click="showFileMenu = !showFileMenu">
<button class="trainer-chat__send-btn" aria-label="메시지 전송" ...>
```

---

## 🟡 Minor (개선 권장)

### 11. 채팅방 패널 전환 시 애니메이션 없음
- **위치**: `TrainerChatView.vue:25,83`
- **현재**: `v-if/v-else`로 즉시 교체. 슬라이드 등 트랜지션 없음.
- **개선안**: Vue `<Transition>` 컴포넌트로 슬라이드 애니메이션 적용. `prefers-reduced-motion` 대응 포함.

### 12. 대화 목록에서 수동 재동기화 수단 부재
- **위치**: `TrainerChatView.vue:49-76`
- **현재**: `subscribeToConversations()`에 의존하며 수동 갱신 수단 없음.
- **문제**: Realtime 연결이 끊겼다가 재연결된 경우 누락된 업데이트를 수동으로 가져올 방법 없음.
- **개선안**: 풀투리프레시 또는 헤더 새로고침 버튼 추가.

### 13. 메시지 버블에서 텍스트 + 파일이 동시에 있는 경우 간격 부재
- **위치**: `TrainerChatView.vue:176-205`, `TrainerChatView.css:319-325`
- **현재**: 이미지와 텍스트가 동시에 있으면 이미지 아래에 텍스트가 바로 붙어 간격 없음.
- **개선안**: 파일과 텍스트 사이에 `margin-top: 8px` 간격 추가.

### 14. 검색 기능 dead code 정리 필요
- **위치**: `TrainerChatView.vue:93-99` (검색 버튼 주석), `102-157` (검색 관련 코드 활성)
- **현재**: 검색 진입점(버튼)은 주석 처리되었지만, `isSearchMode`, `searchQuery` 등 관련 코드가 모두 활성 상태. 현재는 사용자가 검색 모드에 진입할 경로가 사실상 없으므로 UX 결함보다는 코드 정리 이슈.
- **개선안**: 검색 기능을 완성하여 활성화하거나, 관련 코드 전체를 제거.

### 15. 파일 전송 시 순차 업로드로 인한 대기 시간
- **위치**: `TrainerChatView.vue:485-487`
- **현재**: `for (const pf of files) { await sendMessage(...) }` — 이미지 5장 선택 시 순차 업로드.
- **개선안**: 채팅 첨부는 순서가 중요할 수 있으므로, 2~3개 제한 병렬 업로드 + 순서 유지 방식이 안전. 또는 순차 유지 시 진행 상태/실패 재시도 UI 제공.

---

## 잘된 점

- **대화 목록 카드 디자인**: 아바타 + 이름 + 시간 + 미리보기 + 읽지 않음 배지 구성이 카카오톡/토스 채팅과 유사하게 잘 설계됨. `text-overflow: ellipsis` 처리도 적절.
- **과거 메시지 무한 스크롤**: `scrollTop < 50`일 때 이전 메시지를 로드하고 `scrollHeight` 차이만큼 보정하여 스크롤 위치 유지하는 패턴이 잘 구현됨.
- **채팅방 패널 fixed 처리**: `position: fixed; z-index: 200`으로 바텀 네비게이션 위에 전체 화면으로 표시되어 몰입감 있는 채팅 경험 제공.
- **파일 미리보기 관리**: `URL.createObjectURL` 생성/해제, 이미지 5장 제한, 비이미지 파일 단일 선택 등 엣지 케이스가 잘 처리됨.
- **읽음 표시(1)**: 카카오톡 스타일의 읽지 않음 숫자 표시가 자연스럽게 구현됨.
- **Realtime 구독 정리**: `onUnmounted`에서 `unsubscribe()`, `removeMessageScrollListener()`, 디바운스 타이머 정리 등 클린업이 철저함.

---

## 토스 앱 참고 개선안

### 채팅방 진입 트랜지션
토스 채팅에서는 목록 -> 채팅방 진입 시 오른쪽에서 슬라이드-인, 뒤로가기 시 왼쪽으로 슬라이드-아웃 애니메이션이 적용됨. `<Transition>` + `translateX(100%)` 조합으로 구현 가능. `prefers-reduced-motion` 미디어 쿼리 대응 포함.

### 메시지 전송 낙관적 업데이트
토스/카카오톡에서는 전송 버튼을 누르면 즉시 말풍선이 나타나고(전송 중 표시), 서버 응답 후 완료 상태로 변경. 실패 시 "전송 실패" 표시와 재시도 옵션 제공.

### 날짜 구분선
메시지 목록에서 날짜가 바뀌는 지점에 "2026년 3월 20일" 같은 구분선을 표시하면 시간 맥락 파악이 용이.

---

## 구조 개선 제안 (참고용)

### 메시지 버블 컴포넌트 분리
메시지 렌더링 로직(파일/이미지/영상/텍스트 분기)이 검색 결과와 일반 메시지에서 완전히 중복됨(121-157행 vs 170-208행). `ChatMessageBubble.vue` 컴포넌트로 추출하면 유지보수성 향상.

### 대화 목록/채팅방 상태 관리
`selectedPartnerId`, `partnerName`, `inputText` 등 채팅방 상태가 모두 로컬 ref로 관리됨. 채팅 전용 Pinia store 도입으로 알림 탭 -> 채팅방 직접 진입 등 복잡한 플로우에 대응 가능.
