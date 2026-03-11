# Task 3: MemberSettingsView 수정 완료

## 수정 사항

### 1. Imports 추가 (라인 200-202, 205)
```js
import { useReservationsStore } from '@/stores/reservations'
import { useChatBadgeStore } from '@/stores/chatBadge'
import { useToast } from '@/composables/useToast'
import AppToast from '@/components/AppToast.vue'
```

### 2. Store 인스턴스 선언 (라인 214-216)
```js
const reservationsStore = useReservationsStore()
const chatBadgeStore = useChatBadgeStore()
const { showToast, toastMessage, toastType, showSuccess } = useToast()
```

### 3. onActivated 조건 수정 (라인 245)
**Before:**
```js
onActivated(() => { if (loaded.value && ptSessionsStore._dirty) loadData() })
```

**After:**
```js
onActivated(() => { if (loaded.value && (ptSessionsStore._dirty || reservationsStore.isStale())) loadData() })
```

### 4. handleDisconnect() 함수 수정 (라인 269-277)
**Before:**
```js
async function handleDisconnect() {
  const ok = await disconnectTrainer()
  if (ok) {
    showDisconnectSheet.value = false
    await loadData()
  }
}
```

**After:**
```js
async function handleDisconnect() {
  const ok = await disconnectTrainer()
  if (ok) {
    showDisconnectSheet.value = false
    reservationsStore.$reset()
    ptSessionsStore.$reset()
    chatBadgeStore.$reset()
    showSuccess('트레이너 연결이 해제되었습니다')
    await loadData()
  }
}
```

### 5. 템플릿에 AppToast 추가 (라인 187)
```html
<AppToast v-model="showToast" :message="toastMessage" :type="toastType" />
```

## 검증 결과

✅ **Build 성공**: `npm run build` 완료 (1.28s)
✅ **Grep 증거**: 모든 수정 사항 확인됨
✅ **Git 커밋**: `fix(member): reset stores and show toast after trainer disconnection`

## 변경 파일
- `src/views/member/MemberSettingsView.vue` (14 insertions, 1 deletion)

## 커밋 해시
- `a431163`
