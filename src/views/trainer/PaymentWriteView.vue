<!-- 수납 등록 페이지 — 금액/날짜/메모 입력 후 저장 -->
<template>
  <div class="pay-write">

    <!-- ── Header ── -->
    <div class="pay-write__header">
      <button class="pay-write__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="pay-write__title">수납 등록</h1>
      <div style="width: 40px;"></div>
    </div>

    <div v-if="hasActiveConnection === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 16px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="var(--color-gray-600)" stroke-width="1.6"/>
        <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M16 4L20 8M20 4L16 8" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">연결되지 않은 회원입니다</p>
      <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">회원 목록에서 연결된 회원을 선택해주세요</p>
      <button style="margin-top: 8px; padding: 14px 32px; background: var(--color-blue-primary); color: white; border: none; border-radius: var(--radius-medium); font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); cursor: pointer;" @click="router.back()">뒤로가기</button>
    </div>

    <div v-else-if="hasActiveConnection === null" style="display:flex;align-items:center;justify-content:center;padding:60px 20px;">
      <p style="color:var(--color-gray-600);font-size:var(--fs-body2);">불러오는 중...</p>
    </div>

    <template v-else>
    <div class="pay-write__body">

      <!-- 금액 -->
      <section class="pay-write__section">
        <label class="pay-write__label" for="pay-amount">
          금액 <span class="pay-write__label-required">*</span>
        </label>
        <div
          class="pay-write__input-wrap"
          :class="{ 'pay-write__input-wrap--error': amountError }"
        >
          <input
            id="pay-amount"
            class="pay-write__input"
            type="number"
            v-model="amount"
            placeholder="금액을 입력하세요"
            min="1"
            @input="amountError = ''"
          />
          <span class="pay-write__input-suffix">원</span>
        </div>
        <p v-if="amountError" class="pay-write__field-error">{{ amountError }}</p>
      </section>

      <!-- 날짜 -->
      <section class="pay-write__section">
        <label class="pay-write__label" for="pay-date">
          날짜 <span class="pay-write__label-required">*</span>
        </label>
        <div class="pay-write__input-wrap">
          <input
            id="pay-date"
            class="pay-write__input"
            type="date"
            v-model="paymentDate"
          />
        </div>
      </section>

      <!-- 메모 -->
      <section class="pay-write__section">
        <label class="pay-write__label" for="pay-memo">
          메모 <span class="pay-write__label-hint">(선택)</span>
        </label>
        <div class="pay-write__input-wrap">
          <input
            id="pay-memo"
            class="pay-write__input"
            type="text"
            v-model="memo"
            placeholder="메모를 입력하세요"
          />
        </div>
      </section>

    </div>

    <!-- ── Footer ── -->
    <div class="pay-write__footer">
      <p v-if="error" class="pay-write__error">{{ error }}</p>
      <button
        class="pay-write__submit"
        :disabled="loading"
        @click="handleSave"
      >
        {{ loading ? '저장 중...' : '저장' }}
      </button>
    </div>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isActiveConnection } from '@/composables/useConnection'
import { usePayments } from '@/composables/usePayments'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const memberId = route.params.id || route.query.memberId
const hasActiveConnection = ref(null)

const { createPayment, loading, error } = usePayments()

const amount = ref('')
const amountError = ref('')

const pad = (n) => String(n).padStart(2, '0')
const today = new Date()
const paymentDate = ref(
  `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
)

const memo = ref('')

onMounted(async () => {
  if (!memberId || !auth.user?.id) {
    hasActiveConnection.value = false
    return
  }
  hasActiveConnection.value = await isActiveConnection(auth.user.id, memberId)
})

async function handleSave() {
  if (hasActiveConnection.value !== true) return
  if (loading.value) return

  const parsedAmount = Number(amount.value)
  if (!amount.value || parsedAmount <= 0) {
    amountError.value = '금액을 올바르게 입력해 주세요'
    return
  }

  const success = await createPayment(
    memberId,
    parsedAmount,
    paymentDate.value,
    memo.value.trim() || null
  )

  if (success) {
    router.back()
  }
}
</script>

<style src="./PaymentWriteView.css" scoped></style>
