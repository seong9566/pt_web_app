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

    <div v-if="hasActiveConnection === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 16px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="var(--color-gray-600)" stroke-width="1.6"/>
        <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M16 4L20 8M20 4L16 8" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">연결되지 않은 회원입니다</p>
      <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">회원 목록에서 연결된 회원을 선택해주세요</p>
      <div style="margin-top: 8px;">
        <AppButton variant="primary" @click="router.back()">뒤로가기</AppButton>
      </div>
    </div>

    <div v-else-if="hasActiveConnection === null" class="pt-count-manage__connection-loading">
      <AppSkeleton type="circle" width="64px" height="64px" />
      <AppSkeleton type="line" :count="3" />
    </div>

    <div v-else class="pt-count-manage__body">

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
        <div v-if="loading" class="pt-count-manage__history-state pt-count-manage__history-state--skeleton">
          <AppSkeleton type="line" :count="4" />
        </div>
        <p v-else-if="ptHistory.length === 0" class="pt-count-manage__history-state">변동 이력이 없습니다</p>
        <ul v-else class="pt-count-manage__history-list">
          <li
            v-for="item in ptHistory"
            :key="item.id"
            class="pt-count-manage__history-item pt-count-manage__history-item--editable"
            @click="openEditSheet(item)"
          >
            <div class="pt-count-manage__history-left">
              <span class="pt-count-manage__history-date">{{ formatDate(item.created_at) }}</span>
              <span v-if="item.reason" class="pt-count-manage__history-reason">{{ item.reason }}</span>
            </div>
            <div class="pt-count-manage__history-right">
              <span
                class="pt-count-manage__history-amount"
                :class="item.change_amount > 0 ? 'pt-count-manage__history-amount--positive' : 'pt-count-manage__history-amount--negative'"
              >{{ item.change_amount > 0 ? '+' : '' }}{{ item.change_amount }}회</span>
              <svg class="pt-count-manage__history-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </li>
        </ul>
      </section>

    </div>

    <!-- ── 횟수 추가 바텀 시트 ── -->
    <AppBottomSheet v-model="showAddSheet" title="횟수 추가">
      <div class="pt-count-manage__sheet-form">
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">추가할 횟수</label>
          <div class="pt-count-manage__stepper">
            <button
              class="pt-count-manage__stepper-btn"
              type="button"
              @click="addAmount > 1 && (addAmount--, addError = '')"
              :disabled="addAmount <= 1"
            >−</button>
            <span class="pt-count-manage__stepper-value">{{ addAmount }}</span>
            <button
              class="pt-count-manage__stepper-btn"
              type="button"
              @click="addAmount < 99 && (addAmount++, addError = '')"
            >+</button>
          </div>
        </div>
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">날짜</label>
          <input
            class="pt-count-manage__sheet-input"
            type="date"
            v-model="addDate"
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
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">결제 금액 (선택)</label>
          <div class="pt-count-manage__sheet-input-wrap">
            <input
              class="pt-count-manage__sheet-input pt-count-manage__sheet-input--amount"
              type="number"
              v-model.number="addPaymentAmount"
              min="0"
              placeholder="금액을 입력하면 수납 기록에 자동 반영"
            />
            <span v-if="addPaymentAmount" class="pt-count-manage__sheet-unit">원</span>
          </div>
        </div>
        <p v-if="addError" class="pt-count-manage__sheet-error">{{ addError }}</p>
        <button
          class="pt-count-manage__sheet-submit"
          :disabled="loading || paymentLoading"
          @click="handleAdd"
        >{{ (loading || paymentLoading) ? '저장 중...' : '저장' }}</button>
      </div>
    </AppBottomSheet>

    <!-- ── 이력 수정 바텀 시트 ── -->
    <AppBottomSheet v-model="showEditSheet" title="이력 수정">
      <div class="pt-count-manage__sheet-form">
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">
            {{ editIsPositive ? '추가 횟수' : '차감 횟수' }}
          </label>
          <div class="pt-count-manage__stepper">
            <button
              class="pt-count-manage__stepper-btn"
              type="button"
              @click="editAmount > 1 && (editAmount--, editError = '')"
              :disabled="editAmount <= 1"
            >−</button>
            <span class="pt-count-manage__stepper-value">{{ editAmount }}</span>
            <button
              class="pt-count-manage__stepper-btn"
              type="button"
              @click="editAmount < 99 && (editAmount++, editError = '')"
            >+</button>
          </div>
        </div>
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">날짜</label>
          <input
            class="pt-count-manage__sheet-input"
            type="date"
            v-model="editDate"
          />
        </div>
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">메모 (선택)</label>
          <input
            class="pt-count-manage__sheet-input"
            type="text"
            v-model="editMemo"
            placeholder="메모를 입력하세요"
          />
        </div>
        <p v-if="editError" class="pt-count-manage__sheet-error">{{ editError }}</p>
        <button
          class="pt-count-manage__sheet-submit"
          :disabled="loading"
          @click="handleEdit"
        >{{ loading ? '저장 중...' : '저장' }}</button>
      </div>
    </AppBottomSheet>

    <!-- ── 횟수 차감 바텀 시트 ── -->
    <AppBottomSheet v-model="showDeductSheet" title="횟수 차감">
      <div class="pt-count-manage__sheet-form">
        <div class="pt-count-manage__sheet-field">
          <label class="pt-count-manage__sheet-label">차감할 횟수</label>
          <div class="pt-count-manage__stepper">
            <button
              class="pt-count-manage__stepper-btn"
              type="button"
              @click="deductAmount > 1 && (deductAmount--, deductError = '')"
              :disabled="deductAmount <= 1"
            >−</button>
            <span class="pt-count-manage__stepper-value">{{ deductAmount }}</span>
            <button
              class="pt-count-manage__stepper-btn"
              type="button"
              @click="deductAmount < remainingCount && (deductAmount++, deductError = '')"
              :disabled="deductAmount >= remainingCount"
            >+</button>
          </div>
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
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import { isActiveConnection } from '@/composables/useConnection'
import { usePtSessions } from '@/composables/usePtSessions'
import { usePayments } from '@/composables/usePayments'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { usePtSessionsStore } from '@/stores/ptSessions'
import { useMembersStore } from '@/stores/members'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const memberId = route.params.id
const ptSessionsStore = usePtSessionsStore()
const membersStore = useMembersStore()
const hasActiveConnection = ref(null)

const {
  ptHistory,
  remainingCount,
  loading,
  error,
  fetchPtHistory,
  getRemainingCount,
  addSessions,
  deductSessions,
  updatePtSession,
} = usePtSessions()

const { createPayment, loading: paymentLoading, error: paymentError } = usePayments()
const { showToast } = useToast()

// ── 바텀 시트 상태 ──
const showAddSheet = ref(false)
const showDeductSheet = ref(false)

// ── 추가 폼 ──
const addAmount = ref(1)
const addDate = ref(todayStr())
const addMemo = ref('')
const addPaymentAmount = ref(null)
const addError = ref('')

// ── 차감 폼 ──
const deductAmount = ref(1)
const deductMemo = ref('')
const deductError = ref('')

// ── 수정 폼 ──
const showEditSheet = ref(false)
const editingItem = ref(null)
const editAmount = ref(1)
const editDate = ref('')
const editMemo = ref('')
const editError = ref('')
const editIsPositive = ref(true)

onMounted(async () => {
  if (!memberId || !auth.user?.id) {
    hasActiveConnection.value = false
    return
  }
  hasActiveConnection.value = await isActiveConnection(auth.user.id, memberId)
  if (!hasActiveConnection.value) return
  await getRemainingCount(memberId)
  await fetchPtHistory(memberId)
})

function todayStr() {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function openAddSheet() {
  addAmount.value = 1
  addDate.value = todayStr()
  addMemo.value = ''
  addPaymentAmount.value = null
  addError.value = ''
  showAddSheet.value = true
}

function openEditSheet(item) {
  editingItem.value = item
  editIsPositive.value = item.change_amount > 0
  editAmount.value = Math.abs(item.change_amount)
  editDate.value = new Date(item.created_at).toISOString().slice(0, 10)
  editMemo.value = item.reason || ''
  editError.value = ''
  showEditSheet.value = true
}

function openDeductSheet() {
  deductAmount.value = 1
  deductMemo.value = ''
  deductError.value = ''
  showDeductSheet.value = true
}

async function handleAdd() {
  if (hasActiveConnection.value !== true) return
  addError.value = ''
  if (!addAmount.value || addAmount.value <= 0) {
    addError.value = '추가 횟수는 1 이상이어야 합니다'
    return
  }
  const reason = addMemo.value.trim() || '횟수 추가'
  const success = await addSessions(memberId, addAmount.value, reason, addDate.value || null)
  if (!success) {
    addError.value = error.value || 'PT 횟수 추가에 실패했습니다'
    return
  }

  ptSessionsStore.invalidate()
  membersStore.invalidate()
  await fetchPtHistory(memberId)

  if (addPaymentAmount.value && addPaymentAmount.value > 0) {
    const payDate = addDate.value || todayStr()
    const paymentMemo = reason === '횟수 추가' ? `PT ${addAmount.value}회 추가` : reason
    const payOk = await createPayment(memberId, addPaymentAmount.value, payDate, paymentMemo)
    if (!payOk) {
      addError.value = paymentError.value || '수납 기록 저장에 실패했습니다'
      return
    }
  }

  showAddSheet.value = false
}

async function handleDeduct() {
  if (hasActiveConnection.value !== true) return
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
    ptSessionsStore.invalidate()
    membersStore.invalidate()
    await fetchPtHistory(memberId)
    showDeductSheet.value = false
  } else {
    deductError.value = error.value || '남은 횟수보다 많이 차감할 수 없습니다'
  }
}

async function handleEdit() {
  if (hasActiveConnection.value !== true) return
  editError.value = ''
  if (!editAmount.value || editAmount.value <= 0) {
    editError.value = '횟수는 1 이상이어야 합니다'
    return
  }
  const finalAmount = editIsPositive.value ? editAmount.value : -editAmount.value
  const reason = editMemo.value.trim() || (editIsPositive.value ? '횟수 추가' : '횟수 차감')
  const success = await updatePtSession(editingItem.value.id, finalAmount, reason, editDate.value || null)
  if (success) {
    await fetchPtHistory(memberId)
    await getRemainingCount(memberId)
    showEditSheet.value = false
  } else {
    editError.value = error.value || '수정에 실패했습니다'
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

watch(error, (e) => { if (e) showToast(e, 'error') })
watch(paymentError, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./PtCountManageView.css" scoped></style>
