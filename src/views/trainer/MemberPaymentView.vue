<!-- 회원 수납 기록 페이지 — 수납 목록 조회 + 수정 + 삭제 + 등록 FAB -->
<template>
  <div class="payment-view">

    <!-- ── Header ── -->
    <div class="payment-view__header">
      <button class="payment-view__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="payment-view__title">수납 기록</h1>
      <div class="payment-view__header-spacer"></div>
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

    <div v-else-if="hasActiveConnection === null" style="display:flex;flex-direction:column;gap:var(--spacing-item);padding:60px var(--side-margin);">
      <AppSkeleton type="circle" width="64px" height="64px" />
      <AppSkeleton type="line" :count="3" />
    </div>

    <div v-else class="payment-view__body">

      <!-- 로딩 -->
      <div
        v-if="loading && !showEditSheet"
        class="payment-view__loading"
        style="flex-direction:column;align-items:stretch;justify-content:flex-start;gap:var(--spacing-item);padding:24px 0;"
      >
        <AppSkeleton type="rect" height="88px" :count="1" />
        <AppSkeleton type="line" :count="4" />
      </div>

      <template v-else>

        <!-- ── 요약 카드 ── -->
        <div class="payment-stats">
          <div class="payment-stat">
            <div class="payment-stat__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" stroke-width="2"/>
                <path d="M2 10H22" stroke="currentColor" stroke-width="2"/>
                <path d="M6 15H10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="payment-stat__text">
              <p class="payment-stat__label">총 수납액</p>
              <p class="payment-stat__value">{{ formatAmount(totalAmount) }}</p>
            </div>
          </div>

          <div class="payment-stat">
            <div class="payment-stat__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="payment-stat__text">
              <p class="payment-stat__label">수납 횟수</p>
              <p class="payment-stat__value">{{ payments.length }}건</p>
            </div>
          </div>
        </div>

        <!-- ── 수납 내역 ── -->
        <div class="payment-section">
          <div class="payment-section__header">
            <h2 class="payment-section__title">수납 내역</h2>
          </div>

          <!-- 빈 상태 -->
          <div v-if="payments.length === 0" class="payment-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.5"/>
              <path d="M2 10H22" stroke="currentColor" stroke-width="1.5"/>
              <path d="M6 15H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p>수납 기록이 없습니다</p>
          </div>

          <!-- 목록 -->
          <div v-else class="payment-list">
            <div
              v-for="payment in payments"
              :key="payment.id"
              class="payment-card"
            >
              <div class="payment-card__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M2 10H22" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M6 15H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>

              <div class="payment-card__info">
                <p class="payment-card__title">{{ formatDate(payment.payment_date) }}</p>
                <p v-if="payment.memo" class="payment-card__sub">{{ payment.memo }}</p>
              </div>

              <span class="payment-card__amount">{{ formatAmount(payment.amount) }}</span>

              <button
                class="payment-card__edit"
                title="수정"
                @click="openEditSheet(payment)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M16.5 3.5L20.5 7.5L7 21H3V17L16.5 3.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 6L18 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </button>

              <button
                class="payment-card__delete"
                title="삭제"
                @click="handleDelete(payment.id)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M8 6V4H16V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="5" y="6" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M10 11V16M14 11V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </template>

      <!-- 하단 여백 (FAB + 네비 높이) -->
      <div style="height: calc(var(--nav-height) + 80px);" />

    </div>

    <!-- ── FAB ── -->
    <button class="payment-view__fab" @click="goToWrite">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </button>

    <!-- ── 수정 바텀 시트 ── -->
    <AppBottomSheet v-model="showEditSheet" title="수납 수정">
      <div class="payment-edit-form">
        <div class="payment-edit-form__field">
          <label class="payment-edit-form__label">
            금액 <span class="payment-edit-form__required">*</span>
          </label>
          <div class="payment-edit-form__input-wrap">
            <input
              class="payment-edit-form__input"
              type="number"
              v-model.number="editAmount"
              min="1"
              placeholder="금액을 입력하세요"
              @input="editError = ''"
            />
            <span class="payment-edit-form__unit">원</span>
          </div>
        </div>
        <div class="payment-edit-form__field">
          <label class="payment-edit-form__label">
            날짜 <span class="payment-edit-form__required">*</span>
          </label>
          <input
            class="payment-edit-form__input"
            type="date"
            v-model="editDate"
          />
        </div>
        <div class="payment-edit-form__field">
          <label class="payment-edit-form__label">메모 (선택)</label>
          <input
            class="payment-edit-form__input"
            type="text"
            v-model="editMemo"
            placeholder="메모를 입력하세요"
          />
        </div>
        <p v-if="editError" class="payment-edit-form__error">{{ editError }}</p>
        <button
          class="payment-edit-form__submit"
          :disabled="loading"
          @click="handleEdit"
        >{{ loading ? '저장 중...' : '저장' }}</button>
      </div>
    </AppBottomSheet>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import { isActiveConnection } from '@/composables/useConnection'
import { usePayments } from '@/composables/usePayments'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const memberId = route.params.id
const hasActiveConnection = ref(null)

const { payments, totalAmount, loading, error, fetchPayments, updatePayment, deletePayment } = usePayments()
const { showToast } = useToast()

// ── 수정 폼 ──
const showEditSheet = ref(false)
const editingPayment = ref(null)
const editAmount = ref('')
const editDate = ref('')
const editMemo = ref('')
const editError = ref('')

onMounted(async () => {
  if (!memberId || !auth.user?.id) {
    hasActiveConnection.value = false
    return
  }
  hasActiveConnection.value = await isActiveConnection(auth.user.id, memberId)
  if (!hasActiveConnection.value) return
  await fetchPayments(memberId)
})

function formatAmount(amount) {
  return amount.toLocaleString('ko-KR') + '원'
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

function openEditSheet(payment) {
  editingPayment.value = payment
  editAmount.value = payment.amount
  editDate.value = payment.payment_date
  editMemo.value = payment.memo || ''
  editError.value = ''
  showEditSheet.value = true
}

async function handleEdit() {
  if (hasActiveConnection.value !== true) return
  editError.value = ''
  const parsedAmount = Number(editAmount.value)
  if (!editAmount.value || parsedAmount <= 0) {
    editError.value = '금액을 올바르게 입력해 주세요'
    return
  }
  if (!editDate.value) {
    editError.value = '날짜를 선택해 주세요'
    return
  }
  const success = await updatePayment(
    editingPayment.value.id,
    parsedAmount,
    editDate.value,
    editMemo.value.trim() || null
  )
  if (success) {
    await fetchPayments(memberId)
    showEditSheet.value = false
  } else {
    editError.value = error.value || '수정에 실패했습니다'
  }
}

async function handleDelete(id) {
  if (hasActiveConnection.value !== true) return
  if (!confirm('이 수납 기록을 삭제하시겠습니까?')) return
  await deletePayment(id)
}

function goToWrite() {
  if (hasActiveConnection.value !== true) return
  router.push({ name: 'trainer-payment-write', params: { id: memberId } })
}

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./MemberPaymentView.css" scoped></style>
