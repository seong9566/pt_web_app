<!-- 회원 본인의 수납 내역 (읽기 전용) -->
<template>
  <div class="member-payment-history">

    <!-- ── Header ── -->
    <div class="member-payment-history__header">
      <button class="member-payment-history__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="member-payment-history__title">내 수납 내역</h1>
      <div style="width: 40px;" />
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="member-payment-history__error">{{ error }}</div>

    <div class="member-payment-history__body">

      <!-- 로딩 상태 -->
      <div v-if="loading" class="member-payment-history__loading">
        로딩 중...
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="payments.length === 0" class="payment-list__empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M7 15h4M15 15h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>수납 내역이 없습니다</p>
      </div>

      <!-- 수납 목록 -->
      <div v-else class="payment-list">
        <div
          v-for="payment in payments"
          :key="payment.id"
          class="payment-card"
        >
          <!-- 날짜 + 금액 행 -->
          <div class="payment-card__top">
            <span class="payment-card__date">{{ payment.payment_date }}</span>
            <span class="payment-card__amount">{{ payment.amount.toLocaleString('ko-KR') }}원</span>
          </div>

          <!-- 메모 -->
          <p v-if="payment.memo" class="payment-card__memo">{{ payment.memo }}</p>
        </div>
      </div>

    </div>

    <div style="height: calc(var(--nav-height) + 16px);" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePayments } from '@/composables/usePayments'

const router = useRouter()
const { payments, loading, error, fetchMemberOwnPayments } = usePayments()

onMounted(async () => {
  await fetchMemberOwnPayments()
})
</script>

<style src="./MemberPaymentHistoryView.css" scoped></style>
