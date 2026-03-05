<!-- 회원 수납 기록 페이지 — 수납 목록 조회 + 삭제 + 등록 FAB -->
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

    <!-- ── Body ── -->
    <div class="payment-view__body">

      <!-- 로딩 -->
      <div v-if="loading" class="payment-view__loading">로딩 중...</div>

      <template v-else>

        <!-- ── 요약 카드 ── -->
        <div class="payment-stats">
          <div class="payment-stat payment-stat--primary">
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

          <div class="payment-stat payment-stat--secondary">
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

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePayments } from '@/composables/usePayments'

const router = useRouter()
const route = useRoute()
const memberId = route.params.id

const { payments, totalAmount, loading, fetchPayments, deletePayment } = usePayments()

onMounted(() => {
  fetchPayments(memberId)
})

/** 금액 포맷: 1000 → "1,000원" */
function formatAmount(amount) {
  return amount.toLocaleString('ko-KR') + '원'
}

/** 날짜 포맷: "2024-01-05" → "2024년 1월 5일" */
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

/** 삭제 확인 후 처리 */
async function handleDelete(id) {
  if (!confirm('이 수납 기록을 삭제하시겠습니까?')) return
  await deletePayment(id)
}

/** 수납 등록 화면으로 이동 */
function goToWrite() {
  router.push({ name: 'trainer-payment-write', params: { id: memberId } })
}
</script>

<style src="./MemberPaymentView.css" scoped></style>
