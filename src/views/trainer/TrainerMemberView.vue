<!-- 트레이너 회원 목록 페이지. 연결된 회원 리스트 + 예약 통계 표시 -->
<template>
  <div class="member-mgmt">

    <!-- ── Header ── -->
    <div class="member-mgmt__header">
      <button class="member-mgmt__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="member-mgmt__title">회원 관리</h1>
      <button class="member-mgmt__invite" @click="router.push('/invite/manage')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        초대하기
      </button>
    </div>

    <!-- ── Search Bar ── -->
    <div class="member-mgmt__search-wrap">
      <div class="member-mgmt__search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#9CA3AF" stroke-width="1.8"/>
          <path d="M16.5 16.5L21 21" stroke="#9CA3AF" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchQuery"
          class="member-mgmt__search-input"
          type="text"
          placeholder="이름 또는 연락처 검색"
        />
      </div>
    </div>

    <!-- ── Stat Cards ── -->
    <div class="stat-cards">
      <button
        v-for="card in statCards"
        :key="card.id"
        class="stat-card"
        :class="{ 'stat-card--active': activeStatCard === card.id }"
        @click="activeStatCard = card.id"
      >
        <div class="stat-card__top">
          <span class="stat-card__icon" v-html="card.icon" />
          <span class="stat-card__label">{{ card.label }}</span>
        </div>
        <div class="stat-card__bottom">
          <span class="stat-card__count">{{ card.count }}</span>
          <span class="stat-card__unit">명</span>
        </div>
      </button>
    </div>

    <!-- ── Error Message ── -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- ── Loading State ── -->
    <div v-if="loading" class="loading-state">
      회원 목록을 불러오는 중...
    </div>

    <!-- ── Member List ── -->
    <div v-if="!loading" class="member-list-section">
      <div class="member-list-section__header">
        <h2 class="member-list-section__title">
          회원 목록 <span class="member-list-section__count">{{ filteredMembers.length }}</span>
        </h2>
        <button class="member-list-section__sort">
          최신순
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="member-list">
        <div v-if="filteredMembers.length === 0 && !loading" class="member-list__empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M2 20C2 17.2386 5.13401 15 9 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="17" cy="15" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 21C14 19.3431 15.3431 18 17 18C18.6569 18 20 19.3431 20 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p>연결된 회원이 없습니다.</p>
          <button class="member-list__empty-btn" @click="router.push('/invite/manage')">초대 코드 생성하기</button>
        </div>
        <div
          v-for="member in filteredMembers"
          :key="member.id"
          class="member-item"
          @click="router.push(`/trainer/members/${member.id}`)"
        >
          <!-- Avatar -->
          <div class="member-item__avatar-wrap">
            <div class="member-item__avatar">
              <img
                v-if="member.photo"
                :src="member.photo"
                :alt="member.name"
              />
              <span v-else class="member-item__avatar-initial">{{ member.name[0] }}</span>
            </div>
            <span
              class="member-item__status-dot"
              :class="`member-item__status-dot--${member.dotStatus}`"
            />
          </div>

          <!-- Info -->
          <div class="member-item__info">
            <span class="member-item__name">{{ member.name }}</span>
            <span
              class="member-item__sub"
              :class="{ 'member-item__sub--today': member.isToday, 'member-item__sub--new': member.isNew }"
            >{{ member.sub }}</span>
          </div>

          <!-- Progress -->
          <div class="member-item__progress-wrap">
            <div class="member-item__bar-track">
              <div
                class="member-item__bar-fill"
                :class="`member-item__bar-fill--${member.barColor}`"
                :style="{ width: `${(member.done / member.total) * 100}%` }"
              />
            </div>
            <div class="member-item__sessions">
              <span class="member-item__sessions-done" :class="`member-item__sessions-done--${member.barColor}`">{{ member.done }}</span>
              <span class="member-item__sessions-total">/{{ member.total }}회</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="height: calc(var(--nav-height) + 32px);" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMembers } from '@/composables/useMembers'

const router = useRouter()
const { members, loading, error, fetchMembers } = useMembers()

// ── Search ──
const searchQuery = ref('')

// ── Stat cards ──
const activeStatCard = ref('all')

const statCards = [
  {
    id: 'all',
    label: '전체 회원',
    count: 24,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/>
      <path d="M2 20C2 17.2386 5.13401 15 9 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="17" cy="15" r="3" stroke="currentColor" stroke-width="1.8"/>
      <path d="M14 21C14 19.3431 15.3431 18 17 18C18.6569 18 20 19.3431 20 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'active',
    label: '진행 중',
    count: 18,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 4l3 4H4l3-4zM18 20l-3-4h5l-3 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M7 8h10M7 16h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'ended',
    label: '종료',
    count: 4,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
      <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
]

// ── Fetch members on mount ──
onMounted(() => {
  fetchMembers()
})

const filteredMembers = computed(() => {
  let list = members.value
  // Filter by stat card tab
  if (activeStatCard.value === 'active') {
    list = list.filter(m => m.group === 'active')
  } else if (activeStatCard.value === 'ended') {
    list = list.filter(m => m.group === 'ended')
  }
  // Filter by search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(m => m.name.toLowerCase().includes(q))
  }
  return list
})
</script>

<style src="./TrainerMemberView.css" scoped></style>
