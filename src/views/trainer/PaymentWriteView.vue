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

    <!-- ── Body ── -->
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

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePayments } from '@/composables/usePayments'

const router = useRouter()
const route = useRoute()
const memberId = route.params.id

const { createPayment, loading, error } = usePayments()

const amount = ref('')
const amountError = ref('')

const pad = (n) => String(n).padStart(2, '0')
const today = new Date()
const paymentDate = ref(
  `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
)

const memo = ref('')

async function handleSave() {
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
