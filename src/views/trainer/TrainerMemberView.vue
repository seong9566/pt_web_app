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

    <!-- ── Tab Bar ── -->
    <div class="member-mgmt__tabs">
      <button
        class="member-mgmt__tab"
        :class="{ 'member-mgmt__tab--active': activeTab === 'members' }"
        @click="activeTab = 'members'"
      >
        회원
      </button>
      <button
        class="member-mgmt__tab"
        :class="{ 'member-mgmt__tab--active': activeTab === 'pending' }"
        @click="switchToPending"
      >
        대기 중
        <span v-if="pendingRequests.length > 0" class="member-mgmt__tab-badge">
          {{ pendingRequests.length }}
        </span>
      </button>
    </div>

    <!-- ══════════════════════════════════════ -->
    <!-- ── 회원 탭 ── -->
    <!-- ══════════════════════════════════════ -->
    <template v-if="activeTab === 'members'">

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

    </template>

    <!-- ══════════════════════════════════════ -->
    <!-- ── 대기 중 탭 ── -->
    <!-- ══════════════════════════════════════ -->
    <template v-else-if="activeTab === 'pending'">

      <div class="pending-section">

        <div v-if="loadingPending" class="loading-state">
          대기 중인 요청을 불러오는 중...
        </div>

        <div v-else-if="pendingRequests.length === 0" class="pending-list__empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>대기 중인 연결 요청이 없습니다</p>
        </div>

        <div v-else class="pending-list">
          <div
            v-for="req in pendingRequests"
            :key="req.id"
            class="pending-item"
          >
            <div class="pending-item__avatar">
              <img
                v-if="req.member?.photo_url"
                :src="req.member.photo_url"
                :alt="req.member?.name"
              />
              <span v-else class="pending-item__avatar-initial">
                {{ (req.member?.name || '?')[0] }}
              </span>
            </div>
            <div class="pending-item__info">
              <span class="pending-item__name">{{ req.member?.name || '알 수 없음' }}</span>
              <span class="pending-item__time">{{ formatRelativeTime(req.connected_at) }}</span>
            </div>
            <div class="pending-item__actions">
              <button
                class="pending-item__btn pending-item__btn--approve"
                :disabled="processingId === req.id"
                @click="handleApprove(req.id)"
              >
                승인
              </button>
              <button
                class="pending-item__btn pending-item__btn--reject"
                :disabled="processingId === req.id"
                @click="handleReject(req.id)"
              >
                거절
              </button>
            </div>
          </div>
        </div>

      </div>

    </template>

    <div style="height: calc(var(--nav-height) + 32px);" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMembers } from '@/composables/useMembers'
import { useTrainerSearch } from '@/composables/useTrainerSearch'

const router = useRouter()
const { members, loading, error, fetchMembers } = useMembers()
const { fetchPendingRequests, approveConnection, rejectConnection } = useTrainerSearch()

// ── Tabs ──
const activeTab = ref('members')

// ── Search ──
const searchQuery = ref('')

// ── Stat cards ──
const activeStatCard = ref('all')

const STAT_ICONS = {
  all: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/>
    <path d="M2 20C2 17.2386 5.13401 15 9 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="17" cy="15" r="3" stroke="currentColor" stroke-width="1.8"/>
    <path d="M14 21C14 19.3431 15.3431 18 17 18C18.6569 18 20 19.3431 20 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  active: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 4l3 4H4l3-4zM18 20l-3-4h5l-3 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M7 8h10M7 16h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  ended: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
}

const statCards = computed(() => {
  const all = members.value.length
  const active = members.value.filter(m => m.dotStatus === 'active').length
  const ended = members.value.filter(m => m.dotStatus === 'inactive').length
  return [
    { id: 'all', label: '전체 회원', count: all, icon: STAT_ICONS.all },
    { id: 'active', label: '진행 중', count: active, icon: STAT_ICONS.active },
    { id: 'ended', label: '종료', count: ended, icon: STAT_ICONS.ended },
  ]
})

// ── Pending state ──
const pendingRequests = ref([])
const loadingPending = ref(false)
const processingId = ref(null)

async function loadPendingRequests() {
  loadingPending.value = true
  try {
    pendingRequests.value = await fetchPendingRequests()
  } finally {
    loadingPending.value = false
  }
}

async function switchToPending() {
  activeTab.value = 'pending'
  if (pendingRequests.value.length === 0 && !loadingPending.value) {
    await loadPendingRequests()
  }
}

async function handleApprove(connectionId) {
  processingId.value = connectionId
  try {
    const success = await approveConnection(connectionId)
    if (success) {
      pendingRequests.value = pendingRequests.value.filter(r => r.id !== connectionId)
      await fetchMembers()
    }
  } finally {
    processingId.value = null
  }
}

async function handleReject(connectionId) {
  processingId.value = connectionId
  try {
    const success = await rejectConnection(connectionId)
    if (success) {
      pendingRequests.value = pendingRequests.value.filter(r => r.id !== connectionId)
    }
  } finally {
    processingId.value = null
  }
}

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}시간 전`
  return `${Math.floor(diffHours / 24)}일 전`
}

// ── Fetch members on mount ──
onMounted(async () => {
  await fetchMembers()
  loadPendingRequests()
})

const filteredMembers = computed(() => {
  let list = members.value
  if (activeStatCard.value === 'active') {
    list = list.filter(m => m.group === 'active')
  } else if (activeStatCard.value === 'ended') {
    list = list.filter(m => m.group === 'ended')
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(m => m.name.toLowerCase().includes(q))
  }
  return list
})
</script>

<style src="./TrainerMemberView.css" scoped></style>
