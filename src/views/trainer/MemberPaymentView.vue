<!-- [미구현] 수납 기록 페이지. 회원별 결제 이력 목록 (목 데이터) -->
<template>
  <div class="payment-view">

    <!-- ── Header ── -->
    <div class="payment-view__header">
      <button class="payment-view__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="payment-view__title">수납 기록</h1>
      <button class="payment-view__menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="1.5" fill="#111111"/>
          <circle cx="12" cy="12" r="1.5" fill="#111111"/>
          <circle cx="12" cy="19" r="1.5" fill="#111111"/>
        </svg>
      </button>
    </div>

    <!-- ── Body ── -->
    <div class="payment-view__body">

      <!-- Profile Section -->
      <div class="payment-view__profile">
        <div class="payment-view__avatar">
          <img src="@/assets/icons/person.svg" :alt="member.name" width="36" height="36" />
        </div>
        <h2 class="payment-view__name">{{ member.name }} 회원님</h2>
        <span class="payment-view__badge">PT {{ member.totalSessions }}회 진행 중</span>
      </div>

      <!-- Summary Stat Cards -->
      <div class="payment-stats">
        <div class="payment-stat payment-stat--primary">
          <div class="payment-stat__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/>
              <path d="M2 10H22" stroke="currentColor" stroke-width="1.8"/>
              <path d="M6 15H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="payment-stat__label">총 결제 금액</span>
          <span class="payment-stat__value">₩{{ formatAmount(member.totalAmount) }}</span>
        </div>
        <div class="payment-stat payment-stat--secondary">
          <div class="payment-stat__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 4L10 8H2L6 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="M18 20L14 16H22L18 20Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="M7 8H17M7 16H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="payment-stat__label">총 PT 횟수</span>
          <span class="payment-stat__value">{{ member.totalSessions }}회</span>
        </div>
      </div>

      <!-- 최근 결제 내역 -->
      <section class="payment-section">
        <div class="payment-section__header">
          <h3 class="payment-section__title">최근 결제 내역</h3>
          <button class="payment-section__link">전체보기</button>
        </div>
        <div class="payment-list">
          <div
            v-for="payment in member.payments"
            :key="payment.id"
            class="payment-card"
          >
            <div class="payment-card__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 4L10 8H2L6 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M18 20L14 16H22L18 20Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M7 8H17M7 16H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="payment-card__info">
              <span class="payment-card__title">{{ payment.title }}</span>
              <span class="payment-card__sub">{{ payment.date }} · {{ payment.method }}</span>
            </div>
            <span class="payment-card__amount">₩{{ formatAmount(payment.amount) }}</span>
          </div>
        </div>
      </section>

    </div>

    <!-- FAB -->
    <button class="payment-view__fab" @click="handleAdd">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </button>

    <div style="height: calc(var(--nav-height) + 32px);" />

  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 실제 구현 시 useRoute().params.id로 API fetch
// 현재는 mock 데이터 사용
const member = {
  id: route.params.id || 1,
  name: '김지수',
  totalSessions: 30,
  totalAmount: 1400000,
  payments: [
    {
      id: 1,
      title: 'PT 10회 등록',
      date: '2023. 10. 24',
      method: '카드 결제',
      amount: 500000,
    },
    {
      id: 2,
      title: 'PT 20회 재등록',
      date: '2023. 06. 10',
      method: '카드 결제',
      amount: 900000,
    },
  ],
}

function formatAmount(amount) {
  return amount.toLocaleString()
}

function handleAdd() {
  router.push({ name: 'trainer-payment-write', params: { id: route.params.id || member.id } })
}
</script>

<style src="./MemberPaymentView.css" scoped></style>
