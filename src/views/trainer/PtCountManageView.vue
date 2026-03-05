<template>
  <div class="pt-count-manage">

    <!-- ── Header ── -->
    <div class="pt-count-manage__header">
      <button class="pt-count-manage__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="pt-count-manage__title">PT 횟수 관리</h1>
      <div style="width: 40px;" />
    </div>

    <!-- ── Body (scrollable) ── -->
    <div class="pt-count-manage__body">

      <!-- 잔여 횟수 요약 카드 -->
      <div class="pt-count-manage__summary-card">
        <span class="pt-count-manage__summary-label">잔여 횟수</span>
        <div class="pt-count-manage__summary-count">
          <span class="pt-count-manage__summary-number">{{ remainingCount }}</span>
          <span class="pt-count-manage__summary-unit">회</span>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="pt-count-manage__actions">
        <button
          class="pt-count-manage__action-btn pt-count-manage__action-btn--add"
          @click="openAddSheet"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          횟수 추가
        </button>
        <button
          class="pt-count-manage__action-btn pt-count-manage__action-btn--deduct"
          @click="openDeductSheet"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          횟수 차감
        </button>
      </div>

      <!-- 변동 이력 -->
      <section class="pt-count-manage__history">
        <h2 class="pt-count-manage__history-title">변동 이력</h2>
        <p v-if="loading" class="pt-count-manage__history-state">로딩 중...</p>
        <p v-else-if="ptHistory.length === 0" class="pt-count-manage__history-state">변동 이력이 없습니다</p>
        <ul v-else class="pt-count-manage__history-list">
          <li
            v-for="item in ptHistory"
            :key="item.id"
            class="pt-count-manage__history-item"
          >
            <div class="pt-count-manage__history-left">
              <span class="pt-count-manage__history-date">{{ formatDate(item.created_at) }}</span>
              <span v-if="item.reason" class="pt-count-manage__history-reason">{{ item.reason }}</span>
            </div>
            <span
              class="pt-count-manage__history-amount"
              :class="item.change_amount > 0 ? 'pt-count-manage__history-amount--positive' : 'pt-count-manage__history-amount--negative'"
            >{{ item.change_amount > 0 ? '+' : '' }}{{ item.change_amount }}회</span>
          </li>
        </ul>
      </section>

    </div>

    <!-- ── 횟수 추가 바텀 시트 ── -->
    <AppBottomSheet v-model="showAddSheet" title="횟수 추가">
      <div class="pt-count-manage__sheet-form">
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">추가할 횟수</label>
          <input
            class="pt-count-manage__sheet-input"
            type="number"
            v-model.number="addAmount"
            min="1"
            placeholder="횟수를 입력하세요"
            @input="addError = ''"
          />
        </div>
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">메모 (선택)</label>
          <input
            class="pt-count-manage__sheet-input"
            type="text"
            v-model="addMemo"
            placeholder="메모를 입력하세요"
          />
        </div>
        <p v-if="addError" class="pt-count-manage__sheet-error">{{ addError }}</p>
        <button
          class="pt-count-manage__sheet-submit"
          :disabled="loading"
          @click="handleAdd"
        >{{ loading ? '저장 중...' : '저장' }}</button>
      </div>
    </AppBottomSheet>

    <!-- ── 횟수 차감 바텀 시트 ── -->
    <AppBottomSheet v-model="showDeductSheet" title="횟수 차감">
      <div class="pt-count-manage__sheet-form">
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">차감할 횟수</label>
          <input
            class="pt-count-manage__sheet-input"
            type="number"
            v-model.number="deductAmount"
            min="1"
            placeholder="횟수를 입력하세요"
            @input="deductError = ''"
          />
        </div>
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">메모 (선택)</label>
          <input
            class="pt-count-manage__sheet-input"
            type="text"
            v-model="deductMemo"
            placeholder="메모를 입력하세요"
          />
        </div>
        <p v-if="deductError" class="pt-count-manage__sheet-error">{{ deductError }}</p>
        <button
          class="pt-count-manage__sheet-submit"
          :disabled="loading"
          @click="handleDeduct"
        >{{ loading ? '저장 중...' : '저장' }}</button>
      </div>
    </AppBottomSheet>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import { usePtSessions } from '@/composables/usePtSessions'

const route = useRoute()
const router = useRouter()
const memberId = route.params.id

const {
  ptHistory,
  remainingCount,
  loading,
  error,
  fetchPtHistory,
  getRemainingCount,
  addSessions,
  deductSessions,
} = usePtSessions()

// ── 바텀 시트 상태 ──
const showAddSheet = ref(false)
const showDeductSheet = ref(false)

// ── 추가 폼 ──
const addAmount = ref(1)
const addMemo = ref('')
const addError = ref('')

// ── 차감 폼 ──
const deductAmount = ref(1)
const deductMemo = ref('')
const deductError = ref('')

onMounted(async () => {
  await getRemainingCount(memberId)
  await fetchPtHistory(memberId)
})

function openAddSheet() {
  addAmount.value = 1
  addMemo.value = ''
  addError.value = ''
  showAddSheet.value = true
}

function openDeductSheet() {
  deductAmount.value = 1
  deductMemo.value = ''
  deductError.value = ''
  showDeductSheet.value = true
}

async function handleAdd() {
  addError.value = ''
  if (!addAmount.value || addAmount.value <= 0) {
    addError.value = '추가 횟수는 1 이상이어야 합니다'
    return
  }
  const reason = addMemo.value.trim() || '횟수 추가'
  const success = await addSessions(memberId, addAmount.value, reason)
  if (success) {
    showAddSheet.value = false
  } else {
    addError.value = error.value || 'PT 횟수 추가에 실패했습니다'
  }
}

async function handleDeduct() {
  deductError.value = ''
  if (!deductAmount.value || deductAmount.value <= 0) {
    deductError.value = '차감 횟수는 1 이상이어야 합니다'
    return
  }
  if (remainingCount.value < deductAmount.value) {
    deductError.value = '남은 횟수보다 많이 차감할 수 없습니다'
    return
  }
  const reason = deductMemo.value.trim() || '횟수 차감'
  const success = await deductSessions(memberId, deductAmount.value, reason)
  if (success) {
    showDeductSheet.value = false
  } else {
    deductError.value = error.value || '남은 횟수보다 많이 차감할 수 없습니다'
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}
</script>

<style src="./PtCountManageView.css" scoped></style>
