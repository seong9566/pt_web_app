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
            v-for="memo in member.memos"
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
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 실제 구현 시 useRoute().params.id로 API fetch
// 현재는 mock 데이터 사용
const member = {
  id: 1,
  name: '김지영',
  summary: '최근 무릎 통증 호소. 스쿼트 중량 조절 필요. 스트레칭 루틴 강화 요망.',
  lastVisit: '2023.10.24',
  nextSession: '2023.10.27 19:00',
  memos: [
    {
      id: 1,
      date: '2023년 10월 20일',
      time: '오후 7:30',
      dotColor: 'blue',
      tags: ['상체', 'PT 12회차'],
      content: '벤치프레스 중량 5kg 증량. 어깨 통증 없음 확인. 식단 사진 잘 보내주고 계심. 물 섭취량 늘리도록 지도.',
    },
    {
      id: 2,
      date: '2023년 10월 15일',
      time: '오후 6:00',
      dotColor: 'gray',
      tags: ['유산소', '상담'],
      content: '인바디 측정 결과 체지방률 2% 감소. 매우 고무적인 성과. 주말 식단 조절이 관건이라고 말씀하심.',
    },
    {
      id: 3,
      date: '2023년 10월 10일',
      time: '오후 8:00',
      dotColor: 'gray',
      tags: [],
      content: '개인 사정으로 수업 취소. 다음주 보강 잡음.',
    },
  ],
}

function handleAddMemo() {
  router.push({ name: 'trainer-memo-write', params: { id: route.params.id } })
}

function goPayment() {
  router.push({ name: 'trainer-member-payment', params: { id: route.params.id } })
}
</script>

<style src="./TrainerMemberDetailView.css" scoped></style>
