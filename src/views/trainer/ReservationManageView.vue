<!-- 예약 관리 페이지. 예약 목록 조회, 승인/거절/완료/취소 상태 변경 -->
<template>
  <div class="reservation">

    <!-- ── 거절 확인 Dialog ── -->
    <AppBottomSheet v-model="showRejectDialog" title="예약 거절">
      <div class="reject-dialog">
        <p class="reject-dialog__text">
          <strong>{{ rejectTarget?.partner_name }}</strong> 님의 예약을 거절하시겠습니까?
        </p>
        <textarea
          v-model="rejectReason"
          class="reject-dialog__textarea"
          placeholder="거절 사유를 입력해주세요 (선택)"
          rows="3"
          maxlength="200"
        />
        <div class="reject-dialog__actions">
          <button class="reject-dialog__btn reject-dialog__btn--cancel" @click="showRejectDialog = false">취소</button>
          <button class="reject-dialog__btn reject-dialog__btn--confirm" @click="confirmReject">거절</button>
        </div>
      </div>
    </AppBottomSheet>

    <!-- ── 취소 확인 Dialog ── -->
    <AppBottomSheet v-model="showCancelDialog" title="예약 취소">
      <div class="cancel-dialog">
        <p class="cancel-dialog__text">
          <strong>{{ cancelTarget?.partner_name }}</strong> 님의 예약을 취소하시겠습니까?
        </p>
        <textarea
          v-model="cancelReason"
          class="cancel-dialog__textarea"
          placeholder="취소 사유를 입력해주세요 (선택)"
          rows="3"
          maxlength="200"
        />
        <div class="cancel-dialog__actions">
          <button class="cancel-dialog__btn cancel-dialog__btn--cancel" @click="showCancelDialog = false">닫기</button>
          <button class="cancel-dialog__btn cancel-dialog__btn--confirm" @click="confirmCancel">취소 확인</button>
        </div>
      </div>
    </AppBottomSheet>

    <!-- ── ··· 액션 바텀시트 ── -->
    <AppBottomSheet v-model="showMenuSheet" title="예약 관리">
      <div style="padding: 0 0 8px;">
        <button class="res-menu-popup__item res-menu-popup__item--cancel" @click="handleCancelFromMenu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          예약 취소
        </button>
      </div>
    </AppBottomSheet>

    <!-- ── Header ── -->
    <div class="reservation__header">
      <button class="reservation__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-900)">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="reservation__title">예약 관리</h1>
      <button class="reservation__filter" @click="handleFilter">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-900)">
          <path d="M4 6H20M7 12H17M10 18H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
      <div v-if="loading" style="padding-top: 24px;">
        <AppSkeleton type="line" :count="4" />
      </div>

      <template v-else>

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
                  <img v-if="item.partner_photo" :src="item.partner_photo" :alt="item.partner_name" class="res-card__avatar-img" />
                  <img v-else src="@/assets/icons/person.svg" :alt="item.partner_name" width="28" height="28" />
                </div>
                <span class="res-card__name">{{ item.partner_name }}</span>
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
                {{ item.start_time }} ~ {{ item.end_time }}
              </span>
            </div>

            <div class="res-card__divider" />

            <div class="res-card__actions">
              <button class="res-card__btn res-card__btn--reject" :disabled="processingId === item.id" @click="handleReject(item)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
                {{ processingId === item.id ? '처리 중...' : '거절' }}
              </button>
              <button class="res-card__btn res-card__btn--approve" :disabled="processingId === item.id" @click="handleApprove(item)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ processingId === item.id ? '처리 중...' : '승인' }}
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
                  <img v-if="item.partner_photo" :src="item.partner_photo" :alt="item.partner_name" class="res-card__avatar-img" />
                  <img v-else src="@/assets/icons/person.svg" :alt="item.partner_name" width="28" height="28" />
                </div>
                <span class="res-card__name">{{ item.partner_name }}</span>
              </div>
              <div class="res-card__top-right">
                <span class="res-card__status res-card__status--approved">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  승인됨
                </span>
                <!-- ··· 점 메뉴 버튼 -->
                <button
                  class="res-card__menu-btn"
                  :disabled="processingId === item.id"
                  @click.stop="toggleMenu(item)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                  </svg>
                </button>
              </div>
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
                {{ item.start_time }} ~ {{ item.end_time }}
              </span>
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

      </template>

      <div style="height: calc(var(--nav-height) + 16px);" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReservations } from '@/composables/useReservations'
import { useReservationsStore } from '@/stores/reservations'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { reservations, loading, error, fetchMyReservations, updateReservationStatus, rejectReservation } = useReservations()
const reservationsStore = useReservationsStore()
const { createNotification } = useNotifications()
const { showToast } = useToast()

// ── Filter ──
const filterChips = [
  { id: 'all',      label: '전체',   icon: 'grid' },
  { id: 'pending',  label: '대기중', icon: 'clock' },
  { id: 'approved', label: '승인됨', icon: 'check' },
  { id: 'completed', label: '완료', icon: 'history' },
]
const activeFilter = ref('all')
const processingId = ref(null)

// ── ··· 바텀시트 메뉴 ──
const showMenuSheet = ref(false)
const menuTargetItem = ref(null)

function toggleMenu(item) {
  menuTargetItem.value = item
  showMenuSheet.value = true
}

function handleCancelFromMenu() {
  showMenuSheet.value = false
  if (!menuTargetItem.value) return
  const item = menuTargetItem.value
  menuTargetItem.value = null
  handleCancel(item)
}

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

const showRejectDialog = ref(false)
const rejectTarget = ref(null)
const rejectReason = ref('')

function handleReject(item) {
  rejectTarget.value = item
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function confirmReject() {
  if (!rejectTarget.value) return
  const item = rejectTarget.value
  const reason = rejectReason.value.trim()
  processingId.value = item.id
  try {
    const success = await rejectReservation(item.id, reason)
    showRejectDialog.value = false
    rejectTarget.value = null
    rejectReason.value = ''
    if (success) {
      await createNotification(
        item.member_id,
        'reservation_rejected',
        '예약이 거절되었습니다',
        `${item.date} ${item.start_time} 예약이 거절되었습니다.${reason ? ' 사유: ' + reason : ''}`,
        item.id,
        'reservation'
      )
      reservationsStore.invalidate()
      await fetchMyReservations('trainer')
    }
  } finally {
    processingId.value = null
  }
}

const showCancelDialog = ref(false)
const cancelTarget = ref(null)
const cancelReason = ref('')

function handleCancel(item) {
  cancelTarget.value = item
  cancelReason.value = ''
  showCancelDialog.value = true
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  processingId.value = cancelTarget.value.id
  try {
    const success = await updateReservationStatus(cancelTarget.value.id, 'cancelled')
    showCancelDialog.value = false
    cancelTarget.value = null
    cancelReason.value = ''
    if (success) {
      reservationsStore.invalidate()
      await fetchMyReservations('trainer')
    }
  } finally {
    processingId.value = null
  }
}

async function handleApprove(item) {
  processingId.value = item.id
  try {
    const success = await updateReservationStatus(item.id, 'approved')
    if (success) {
      await createNotification(
        item.member_id,
        'reservation_approved',
        '예약이 승인되었습니다',
        `${item.date} ${item.start_time} 예약이 승인되었습니다.`,
        item.id,
        'reservation'
      )
      reservationsStore.invalidate()
      await fetchMyReservations('trainer')
    }
  } finally {
    processingId.value = null
  }
}

function handleDetail(item) {
}

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./ReservationManageView.css" scoped></style>
