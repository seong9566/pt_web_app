<!-- 예약 관리 페이지. 예약 목록 조회, 승인/거절/완료/취소 상태 변경 -->
<template>
  <div class="reservation">

    <!-- ── Header ── -->
    <div class="reservation__header">
      <button class="reservation__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="reservation__title">예약 관리</h1>
      <button class="reservation__filter" @click="handleFilter">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 6H20M7 12H17M10 18H14" stroke="#111111" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="reservation__error">{{ error }}</div>

    <!-- ── Filter Chips ── -->
    <div class="reservation__chips-wrap">
      <div class="reservation__chips">
        <button
          v-for="chip in filterChips"
          :key="chip.id"
          class="reservation__chip"
          :class="{ 'reservation__chip--active': activeFilter === chip.id }"
          @click="activeFilter = chip.id"
        >
          <svg v-if="chip.icon === 'grid'" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
          </svg>
          <svg v-else-if="chip.icon === 'clock'" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M12 7V12L15 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="chip.icon === 'check'" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="chip.icon === 'history'" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M12 7V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M15 15L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>{{ chip.label }}</span>
        </button>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="reservation__body">

      <!-- 다가오는 요청 (대기중) -->
      <section v-if="pendingList.length" class="reservation__section">
        <div class="reservation__section-header">
          <h2 class="reservation__section-title">다가오는 요청</h2>
          <span class="reservation__badge reservation__badge--pending">대기중 {{ pendingList.length }}건</span>
        </div>

        <div class="reservation__list">
          <div
            v-for="item in pendingList"
            :key="item.id"
            class="res-card"
          >
            <div class="res-card__top">
              <div class="res-card__profile">
                <div class="res-card__avatar">
                  <img src="@/assets/icons/person.svg" :alt="item.partner_name" width="28" height="28" />
                </div>
                <div class="res-card__info">
                  <span class="res-card__name">{{ item.partner_name }}</span>
                  <span class="res-card__session">{{ item.session_type }}</span>
                </div>
              </div>
              <span class="res-card__status res-card__status--pending">대기중</span>
            </div>

            <div class="res-card__meta">
              <span class="res-card__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M3 10H21" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M8 3V7M16 3V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                {{ item.date }}
              </span>
              <span class="res-card__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M12 7V12L15 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ item.start_time }}
              </span>
            </div>

            <div class="res-card__divider" />

            <div class="res-card__actions">
              <button class="res-card__btn res-card__btn--reject" @click="handleReject(item)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
                거절
              </button>
              <button class="res-card__btn res-card__btn--approve" @click="handleApprove(item)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                승인
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 최근 승인됨 -->
      <section v-if="approvedList.length" class="reservation__section">
        <h2 class="reservation__section-title">최근 승인됨</h2>

        <div class="reservation__list">
          <div
            v-for="item in approvedList"
            :key="item.id"
            class="res-card res-card--approved"
          >
            <div class="res-card__top">
              <div class="res-card__profile">
                <div class="res-card__avatar">
                  <img src="@/assets/icons/person.svg" :alt="item.partner_name" width="28" height="28" />
                </div>
                <div class="res-card__info">
                  <span class="res-card__name">{{ item.partner_name }}</span>
                  <span class="res-card__session">{{ item.session_type }}</span>
                </div>
              </div>
              <span class="res-card__status res-card__status--approved">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                승인됨
              </span>
            </div>

            <div class="res-card__meta">
              <span class="res-card__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M3 10H21" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M8 3V7M16 3V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                {{ item.date }}
              </span>
              <span class="res-card__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M12 7V12L15 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ item.start_time }}
              </span>
            </div>

            <div class="res-card__divider" />

            <div class="res-card__footer">
              <button class="res-card__detail" @click="handleComplete(item)">
                완료
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 비어있을 때 -->
      <div v-if="!filteredPending.length && !filteredApproved.length && !filteredCompleted.length" class="reservation__empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>
          <path d="M3 9H21" stroke="currentColor" stroke-width="1.8"/>
          <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <p class="reservation__empty-text">예약 요청이 없습니다</p>
      </div>

      <div style="height: calc(var(--nav-height) + 16px);" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReservations } from '@/composables/useReservations'
import { useReservationsStore } from '@/stores/reservations'
import { usePtSessionsStore } from '@/stores/ptSessions'

const router = useRouter()
const { reservations, loading, error, fetchMyReservations, updateReservationStatus } = useReservations()
const reservationsStore = useReservationsStore()
const ptSessionsStore = usePtSessionsStore()

// ── Filter ──
const filterChips = [
  { id: 'all',      label: '전체',   icon: 'grid' },
  { id: 'pending',  label: '대기중', icon: 'clock' },
  { id: 'approved', label: '승인됨', icon: 'check' },
  { id: 'completed', label: '완료', icon: 'history' },
]
const activeFilter = ref('pending')

// ── Initialize ──
onMounted(async () => {
  await fetchMyReservations('trainer')
})

// ── Computed lists ──
const filteredPending = computed(() =>
  reservations.value.filter(r => r.status === 'pending')
)
const filteredApproved = computed(() =>
  reservations.value.filter(r => r.status === 'approved')
)
const filteredCompleted = computed(() =>
  reservations.value.filter(r => r.status === 'completed')
)

const pendingList = computed(() => {
  if (activeFilter.value === 'approved' || activeFilter.value === 'completed') return []
  return filteredPending.value
})

const approvedList = computed(() => {
  if (activeFilter.value === 'pending' || activeFilter.value === 'completed') return []
  return filteredApproved.value
})

const completedList = computed(() => {
  if (activeFilter.value !== 'completed' && activeFilter.value !== 'all') return []
  return filteredCompleted.value
})

// ── Actions ──
function handleFilter() {
}

async function handleReject(item) {
  if (confirm(`${item.partner_name}님의 예약을 거절하시겠습니까?`)) {
    const success = await updateReservationStatus(item.id, 'rejected')
    if (success) {
      reservationsStore.invalidate()
      await fetchMyReservations('trainer')
    }
  }
}

async function handleApprove(item) {
  const success = await updateReservationStatus(item.id, 'approved')
  if (success) {
    reservationsStore.invalidate()
    await fetchMyReservations('trainer')
  }
}

async function handleComplete(item) {
  const success = await updateReservationStatus(item.id, 'completed')
  if (success) {
    reservationsStore.invalidate()
    ptSessionsStore.invalidate()
    await fetchMyReservations('trainer')
  }
}

function handleDetail(item) {
}
</script>

<style src="./ReservationManageView.css" scoped></style>
