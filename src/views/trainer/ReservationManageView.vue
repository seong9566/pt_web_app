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
                  <img src="@/assets/icons/person.svg" :alt="item.name" width="28" height="28" />
                </div>
                <div class="res-card__info">
                  <span class="res-card__name">{{ item.name }}</span>
                  <span class="res-card__session">{{ item.sessionType }}</span>
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
                {{ item.time }}
              </span>
            </div>

            <p class="res-card__remaining">잔여 횟수: {{ item.remaining }}회</p>

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
                  <img src="@/assets/icons/person.svg" :alt="item.name" width="28" height="28" />
                </div>
                <div class="res-card__info">
                  <span class="res-card__name">{{ item.name }}</span>
                  <span class="res-card__session">{{ item.sessionType }}</span>
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
                {{ item.time }}
              </span>
            </div>

            <div class="res-card__divider" />

            <div class="res-card__footer">
              <span class="res-card__elapsed">{{ item.elapsed }}</span>
              <button class="res-card__detail" @click="handleDetail(item)">
                상세 보기
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 비어있을 때 -->
      <div v-if="!filteredPending.length && !filteredApproved.length" class="reservation__empty">
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── Filter ──
const filterChips = [
  { id: 'all',      label: '전체',   icon: 'grid' },
  { id: 'pending',  label: '대기중', icon: 'clock' },
  { id: 'approved', label: '승인됨', icon: 'check' },
  { id: 'past',     label: '지난 예약', icon: 'history' },
]
const activeFilter = ref('pending')

// ── Mock data ──
const reservations = ref([
  {
    id: 1,
    name: '박민수',
    sessionType: '근력 운동',
    date: '10월 25일 (수)',
    time: '02:30PM',
    remaining: 12,
    status: 'pending',
    elapsed: '',
  },
  {
    id: 2,
    name: '김서연',
    sessionType: 'PT 세션',
    date: '10월 26일 (목)',
    time: '10:00AM',
    remaining: 8,
    status: 'pending',
    elapsed: '',
  },
  {
    id: 3,
    name: '최동현',
    sessionType: '유산소 운동',
    date: '10월 27일 (금)',
    time: '04:00PM',
    remaining: 5,
    status: 'pending',
    elapsed: '',
  },
  {
    id: 4,
    name: '이수진',
    sessionType: '요가 세션',
    date: '10월 23일 (월)',
    time: '09:00 AM',
    remaining: 15,
    status: 'approved',
    elapsed: '2시간 전 승인됨',
  },
  {
    id: 5,
    name: '정하늘',
    sessionType: '필라테스',
    date: '10월 22일 (일)',
    time: '11:00 AM',
    remaining: 20,
    status: 'approved',
    elapsed: '어제 승인됨',
  },
])

// ── Computed lists ──
const filteredPending = computed(() =>
  reservations.value.filter(r => r.status === 'pending')
)
const filteredApproved = computed(() =>
  reservations.value.filter(r => r.status === 'approved')
)

const pendingList = computed(() => {
  if (activeFilter.value === 'approved' || activeFilter.value === 'past') return []
  return filteredPending.value
})

const approvedList = computed(() => {
  if (activeFilter.value === 'pending') return []
  return filteredApproved.value
})

// ── Actions ──
function handleFilter() {
  alert('준비 중입니다')
}

function handleReject(item) {
  if (confirm(`${item.name}님의 예약을 거절하시겠습니까?`)) {
    reservations.value = reservations.value.filter(r => r.id !== item.id)
  }
}

function handleApprove(item) {
  const target = reservations.value.find(r => r.id === item.id)
  if (target) {
    target.status = 'approved'
    target.elapsed = '방금 승인됨'
  }
}

function handleDetail(item) {
  alert('준비 중입니다')
}
</script>

<style src="./ReservationManageView.css" scoped></style>
