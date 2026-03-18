<!-- 일정 관리 페이지. 배정됨/변경요청/확정됨/완료/취소됨 상태별 조회, 재배정/취소 처리 -->
<template>
  <div class="reservation">

    <!-- ── 취소 확인 Dialog ── -->
    <AppBottomSheet v-model="showCancelDialog" title="일정 취소">
      <div class="cancel-dialog">
        <p class="cancel-dialog__text">
          <strong>{{ cancelTarget?.partner_name }}</strong> 님의 일정을 취소하시겠습니까?
        </p>
        <div class="cancel-dialog__actions">
          <button class="cancel-dialog__btn cancel-dialog__btn--cancel press-effect" @click="showCancelDialog = false">닫기</button>
          <button class="cancel-dialog__btn cancel-dialog__btn--confirm press-effect" :disabled="processingId === cancelTarget?.id" @click="confirmCancel">
            {{ processingId === cancelTarget?.id ? '처리 중...' : '취소 확인' }}
          </button>
        </div>
      </div>
    </AppBottomSheet>

    <!-- ── 재배정 바텀시트 ── -->
    <AppBottomSheet v-model="showReassignSheet" title="일정 재배정">
      <div class="reassign-sheet">
        <p class="reassign-sheet__name">{{ selectedReservation?.partner_name }}님 일정 재배정</p>
        <p v-if="selectedReservation?.change_reason" class="reassign-sheet__reason">
          변경 사유: {{ selectedReservation.change_reason }}
        </p>

        <div class="reassign-sheet__calendar">
          <AppCalendar v-model="reassignDate" :disabledDates="[]" @update:modelValue="onReassignDateChange" />
        </div>

        <div v-if="reassignDate" class="reassign-sheet__slots">
          <p class="reassign-sheet__slots-label">시간 선택</p>
          <div v-if="slotLoading" class="reassign-sheet__slots-loading">슬롯 로딩 중...</div>
          <div v-else-if="availableSlots.length === 0" class="reassign-sheet__slots-empty">
            해당 날짜에 가능한 시간이 없습니다
          </div>
          <div v-else class="reassign-sheet__slots-grid">
            <button
              v-for="slot in availableSlots"
              :key="slot.val"
              class="reassign-sheet__slot press-effect"
              :class="{ 'reassign-sheet__slot--selected': reassignTime === slot.val }"
              @click="reassignTime = slot.val"
            >
              {{ slot.val }}
            </button>
          </div>
        </div>

        <div v-if="reassignError" class="reassign-sheet__error">{{ reassignError }}</div>

        <div class="reassign-sheet__footer">
          <AppButton :disabled="!reassignDate || !reassignTime || processingId === selectedReservation?.id" @click="handleReassign">
            {{ processingId === selectedReservation?.id ? '처리 중...' : '재배정 확정' }}
          </AppButton>
        </div>
      </div>
    </AppBottomSheet>

    <!-- ── 거절 사유 바텀시트 ── -->
    <AppBottomSheet v-model="showRejectSheet" title="변경 요청 거절">
      <div class="reject-sheet">
        <p class="reject-sheet__hint">거절 사유를 입력하면 회원에게 전달됩니다.</p>
        <textarea v-model="rejectReason" class="reject-sheet__textarea" placeholder="거절 사유를 입력해주세요 (선택)" maxlength="120" />
        <AppButton :disabled="loading" @click="handleRejectConfirm">거절 확인</AppButton>
      </div>
    </AppBottomSheet>

    <!-- ── Header ── -->
    <div class="reservation__header">
      <button class="reservation__back press-effect" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-900)">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="reservation__title">일정 관리</h1>
      <div style="width: 40px;" />
    </div>

    <div v-if="error" class="reservation__error">{{ error }}</div>

    <!-- ── Filter Chips ── -->
    <div class="reservation__chips-wrap">
      <div class="reservation__chips">
        <button
          v-for="chip in filterChips"
          :key="chip.id"
          class="reservation__chip press-effect"
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
          <svg v-else-if="chip.icon === 'alert'" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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

        <!-- 변경요청 섹션 -->
        <section v-if="changeRequestedList.length" class="reservation__section">
          <div class="reservation__section-header">
            <h2 class="reservation__section-title">변경 요청</h2>
            <span class="reservation__badge reservation__badge--change-requested">{{ changeRequestedList.length }}건</span>
          </div>
          <div class="reservation__list">
            <div
              v-for="(item, idx) in changeRequestedList"
              :key="item.id"
              class="res-card stagger-fade-in"
              :style="{ '--stagger-index': idx }"
            >
              <div class="res-card__top">
                <div class="res-card__profile">
                  <div class="res-card__avatar">
                    <img v-if="item.partner_photo" :src="item.partner_photo" :alt="item.partner_name" class="res-card__avatar-img" />
                    <img v-else src="@/assets/icons/person.svg" :alt="item.partner_name" width="28" height="28" />
                  </div>
                  <span class="res-card__name">{{ item.partner_name }}</span>
                </div>
                <span class="res-card__status res-card__status--change-requested">변경요청</span>
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
              <div class="res-card__change-info">
                <div class="res-card__change-row">
                  <span class="res-card__change-label">현재</span>
                  <span class="res-card__change-value">{{ item.date }} {{ item.start_time?.slice(0,5) }}-{{ item.end_time?.slice(0,5) }}</span>
                </div>
                <div v-if="item.requested_date" class="res-card__change-row res-card__change-row--requested">
                  <span class="res-card__change-label">요청</span>
                  <span class="res-card__change-value">{{ item.requested_date }} {{ item.requested_start_time?.slice(0,5) }}-{{ item.requested_end_time?.slice(0,5) }}</span>
                </div>
                <div v-if="item.change_reason" class="res-card__change-row">
                  <span class="res-card__change-label">사유</span>
                  <span class="res-card__change-value">{{ item.change_reason }}</span>
                </div>
              </div>
              <div class="res-card__divider" />
              <div class="res-card__change-actions">
                <button v-if="item.requested_date" class="res-card__btn res-card__btn--approve" :disabled="loading" @click="handleApprove(item)">승인</button>
                <button class="res-card__btn res-card__btn--reject" :disabled="loading" @click="handleRejectOpen(item)">거절</button>
                <button class="res-card__btn res-card__btn--reassign" :disabled="loading" @click="handleReassignOpen(item)">다른 시간</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 배정됨 섹션 -->
        <section v-if="scheduledList.length" class="reservation__section">
          <div class="reservation__section-header">
            <h2 class="reservation__section-title">배정됨</h2>
            <span class="reservation__badge reservation__badge--scheduled">{{ scheduledList.length }}건</span>
          </div>
          <div class="reservation__list">
            <div
              v-for="(item, idx) in scheduledList"
              :key="item.id"
              class="res-card stagger-fade-in"
              :style="{ '--stagger-index': idx }"
            >
              <div class="res-card__top">
                <div class="res-card__profile">
                  <div class="res-card__avatar">
                    <img v-if="item.partner_photo" :src="item.partner_photo" :alt="item.partner_name" class="res-card__avatar-img" />
                    <img v-else src="@/assets/icons/person.svg" :alt="item.partner_name" width="28" height="28" />
                  </div>
                  <span class="res-card__name">{{ item.partner_name }}</span>
                </div>
                <span class="res-card__status res-card__status--scheduled">배정됨</span>
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
                <button
                  class="res-card__btn res-card__btn--cancel press-effect"
                  :disabled="processingId === item.id"
                  @click="handleCancelOpen(item)"
                >
                  {{ processingId === item.id ? '처리 중...' : '취소' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 완료 섹션 -->
        <section v-if="completedList.length" class="reservation__section">
          <h2 class="reservation__section-title">완료</h2>
          <div class="reservation__list">
            <div
              v-for="(item, idx) in completedList"
              :key="item.id"
              class="res-card res-card--muted stagger-fade-in"
              :style="{ '--stagger-index': idx }"
            >
              <div class="res-card__top">
                <div class="res-card__profile">
                  <div class="res-card__avatar">
                    <img v-if="item.partner_photo" :src="item.partner_photo" :alt="item.partner_name" class="res-card__avatar-img" />
                    <img v-else src="@/assets/icons/person.svg" :alt="item.partner_name" width="28" height="28" />
                  </div>
                  <span class="res-card__name">{{ item.partner_name }}</span>
                </div>
                <span class="res-card__status res-card__status--completed">완료</span>
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

        <!-- 취소됨 섹션 -->
        <section v-if="cancelledList.length" class="reservation__section">
          <h2 class="reservation__section-title">취소됨</h2>
          <div class="reservation__list">
            <div
              v-for="(item, idx) in cancelledList"
              :key="item.id"
              class="res-card res-card--muted stagger-fade-in"
              :style="{ '--stagger-index': idx }"
            >
              <div class="res-card__top">
                <div class="res-card__profile">
                  <div class="res-card__avatar">
                    <img v-if="item.partner_photo" :src="item.partner_photo" :alt="item.partner_name" class="res-card__avatar-img" />
                    <img v-else src="@/assets/icons/person.svg" :alt="item.partner_name" width="28" height="28" />
                  </div>
                  <span class="res-card__name">{{ item.partner_name }}</span>
                </div>
                <span class="res-card__status res-card__status--cancelled">취소됨</span>
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

        <!-- 빈 상태 -->
        <div v-if="isEmpty" class="reservation__empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>
            <path d="M3 9H21" stroke="currentColor" stroke-width="1.8"/>
            <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <p class="reservation__empty-text">일정이 없습니다</p>
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
import AppCalendar from '@/components/AppCalendar.vue'
import AppButton from '@/components/AppButton.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const {
  reservations, loading, error, slots, slotDuration,
  fetchMyReservations, fetchAvailableSlots, reassignSchedule, cancelSchedule,
  approveChangeRequest, rejectChangeRequest,
} = useReservations()
const reservationsStore = useReservationsStore()
const { showToast } = useToast()

const filterChips = [
  { id: 'all',              label: '전체',    icon: 'grid' },
  { id: 'scheduled',        label: '배정됨',  icon: 'clock' },
  { id: 'change_requested', label: '변경요청', icon: 'alert' },
  { id: 'completed',        label: '완료',    icon: 'history' },
]
const activeFilter = ref('all')
const processingId = ref(null)
const showRejectSheet = ref(false)
const rejectTarget = ref(null)
const rejectReason = ref('')

onMounted(async () => {
  await fetchMyReservations('trainer')
})

function filteredByStatus(status) {
  if (activeFilter.value !== 'all' && activeFilter.value !== status) return []
  return reservations.value
    .filter((r) => r.status === status)
    .sort((a, b) => {
      const da = new Date(`${a.date}T${a.start_time}`)
      const db = new Date(`${b.date}T${b.start_time}`)
      return da - db
    })
}

const changeRequestedList = computed(() => filteredByStatus('change_requested'))
const scheduledList = computed(() => filteredByStatus('scheduled'))
const completedList = computed(() => filteredByStatus('completed'))
const cancelledList = computed(() => filteredByStatus('cancelled'))

const isEmpty = computed(() =>
  changeRequestedList.value.length === 0 &&
  scheduledList.value.length === 0 &&
  completedList.value.length === 0 &&
  cancelledList.value.length === 0
)

const showCancelDialog = ref(false)
const cancelTarget = ref(null)

function handleCancelOpen(item) {
  cancelTarget.value = item
  showCancelDialog.value = true
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  processingId.value = cancelTarget.value.id
  try {
    const success = await cancelSchedule(cancelTarget.value.id)
    showCancelDialog.value = false
    cancelTarget.value = null
    if (success) {
      reservationsStore.invalidate()
      await fetchMyReservations('trainer')
    }
  } finally {
    processingId.value = null
  }
}

async function handleApprove(item) {
  const approved = await approveChangeRequest(item.id)
  if (!approved) {
    alert(error.value || '승인에 실패했습니다.')
    return
  }
  alert('변경 요청이 승인되었습니다.')
  reservationsStore.invalidate()
  await fetchMyReservations('trainer')
}

function handleRejectOpen(item) {
  rejectTarget.value = item
  rejectReason.value = ''
  showRejectSheet.value = true
}

async function handleRejectConfirm() {
  if (!rejectTarget.value) return
  const rejected = await rejectChangeRequest(rejectTarget.value.id, rejectReason.value.trim() || null)
  if (!rejected) {
    alert(error.value || '거절에 실패했습니다.')
    return
  }
  showRejectSheet.value = false
  rejectTarget.value = null
  rejectReason.value = ''
  alert('변경 요청이 거절되었습니다.')
  reservationsStore.invalidate()
  await fetchMyReservations('trainer')
}

const showReassignSheet = ref(false)
const selectedReservation = ref(null)
const reassignDate = ref('')
const reassignTime = ref('')
const reassignError = ref('')
const slotLoading = ref(false)

const availableSlots = computed(() => {
  const s = slots.value
  return [...(s.am || []), ...(s.pm || []), ...(s.evening || [])].filter(
    (slot) => slot.status === '가능'
  )
})

function handleReassignOpen(item) {
  selectedReservation.value = item
  reassignDate.value = ''
  reassignTime.value = ''
  reassignError.value = ''
  showReassignSheet.value = true
}

async function onReassignDateChange(date) {
  reassignTime.value = ''
  reassignError.value = ''
  if (!date || !selectedReservation.value) return
  slotLoading.value = true
  try {
    await fetchAvailableSlots(selectedReservation.value.trainer_id, date)
  } finally {
    slotLoading.value = false
  }
}

async function handleReassign() {
  if (!reassignDate.value || !reassignTime.value) {
    reassignError.value = '날짜와 시간을 선택해주세요'
    return
  }
  processingId.value = selectedReservation.value.id
  reassignError.value = ''
  try {
    const result = await reassignSchedule(
      selectedReservation.value.id,
      reassignDate.value,
      reassignTime.value
    )
    if (result) {
      showReassignSheet.value = false
      reservationsStore.invalidate()
      await fetchMyReservations('trainer')
    } else {
      reassignError.value = error.value || '재배정에 실패했습니다'
    }
  } finally {
    processingId.value = null
  }
}

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./ReservationManageView.css" scoped></style>
