<!-- 회원 상세 페이지. 회원 프로필 정보 + 메모 목록 표시 -->
<template>
  <div class="mem-detail">

    <!-- ── Header ── -->
    <div class="mem-detail__header">
      <button class="mem-detail__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="mem-detail__title">{{ member.name }}님 운동 메모</h1>
      <button class="mem-detail__edit">편집</button>
    </div>

    <div class="mem-detail__body">

      <!-- ── 회원 요약 ── -->
      <section class="summary-section">
        <h2 class="section-title">회원 요약</h2>

        <!-- Info notice box -->
        <div class="summary-notice">
          <div class="summary-notice__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#007AFF" stroke-width="1.8"/>
              <path d="M12 8v1M12 12v4" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="summary-notice__text">{{ member.summary }}</p>
        </div>

        <!-- Stat mini cards -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#007AFF" stroke-width="1.8"/>
                <path d="M12 12L8 12" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M12 7v5" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M12 12 C12 12 7 8 5 12" stroke="#007AFF" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.3"/>
              </svg>
            </div>
            <span class="summary-card__label">최근 방문</span>
            <span class="summary-card__value">{{ member.lastVisit }}</span>
          </div>
          <div class="summary-card">
            <div class="summary-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="#007AFF" stroke-width="1.8"/>
                <path d="M3 10H21" stroke="#007AFF" stroke-width="1.8"/>
                <path d="M8 3V7M16 3V7" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M7.5 14.5L10 17L16.5 13" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="summary-card__label">다음 예약</span>
            <span class="summary-card__value">{{ member.nextSession }}</span>
          </div>
        </div>
      </section>

      <!-- ── 바로가기 ── -->
      <section class="quick-actions">
        <button class="quick-action" @click="goPayment">
          <div class="quick-action__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/>
              <path d="M2 10H22" stroke="currentColor" stroke-width="1.8"/>
              <path d="M6 15H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="quick-action__label">수납 기록</span>
          <svg class="quick-action__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </section>

      <!-- ── 메모 기록 ── -->
      <section class="memo-section">
        <div class="memo-section__header">
          <h2 class="section-title">메모 기록</h2>
          <button class="memo-section__all">전체보기</button>
        </div>

        <div class="memo-list">
          <div
            v-for="memo in memos"
            :key="memo.id"
            class="memo-card"
          >
            <!-- Date row -->
            <div class="memo-card__top">
              <div class="memo-card__date-wrap">
                <span class="memo-card__dot" :class="`memo-card__dot--${memo.dotColor}`" />
                <span class="memo-card__date">{{ memo.date }}</span>
              </div>
              <span class="memo-card__time">{{ memo.time }}</span>
            </div>

            <!-- Tags -->
            <div v-if="memo.tags && memo.tags.length" class="memo-card__tags">
              <span v-for="tag in memo.tags" :key="tag" class="memo-tag">{{ tag }}</span>
            </div>

            <!-- Content -->
            <p class="memo-card__text">{{ memo.content }}</p>
          </div>
        </div>
      </section>

    </div>

    <!-- FAB -->
    <button class="mem-detail__fab" @click="handleAddMemo">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </button>

    <div style="height: calc(var(--nav-height) + 32px);" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMemos } from '@/composables/useMemos'

const router = useRouter()
const route = useRoute()
const { member, memos, loading, error, fetchMemberDetail, fetchMemos } = useMemos()

// 회원 ID를 route params에서 추출하여 데이터 로드
onMounted(async () => {
  const memberId = route.params.id
  if (memberId) {
    await fetchMemberDetail(memberId)
    await fetchMemos(memberId)
  }
})

function handleAddMemo() {
  router.push({ name: 'trainer-memo-write', params: { id: route.params.id } })
}

function goPayment() {
  router.push({ name: 'trainer-member-payment', params: { id: route.params.id } })
}
</script>

<style src="./TrainerMemberDetailView.css" scoped></style>
