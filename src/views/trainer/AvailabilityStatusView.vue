<template>
  <div class="availability-status">
    <header class="availability-status__header">
      <button class="availability-status__back" type="button" @click="router.back()" aria-label="뒤로가기">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="availability-status__title">회원 가능 시간 현황</h1>
      <div class="availability-status__header-spacer" />
    </header>

    <main class="availability-status__content">
      <section class="availability-status__week-panel">
        <span class="availability-status__week-chip">{{ weekLabel }}</span>
        <div class="availability-status__week-nav">
          <button
            class="availability-status__week-arrow press-effect"
            :disabled="weekOffset === 0"
            type="button"
            aria-label="이전 주"
            @click="moveToPreviousWeek"
          >
            ◀
          </button>
          <p class="availability-status__week-range">{{ weekRangeText }}</p>
          <button
            class="availability-status__week-arrow press-effect"
            :disabled="weekOffset === 1"
            type="button"
            aria-label="다음 주"
            @click="moveToNextWeek"
          >
            ▶
          </button>
        </div>
      </section>

      <div v-if="isLoading" class="availability-status__state">
        <p class="availability-status__state-title">회원 등록 현황을 불러오는 중입니다</p>
      </div>

      <div v-else-if="isEmpty" class="availability-status__state">
        <p class="availability-status__state-title">연결된 회원이 없습니다</p>
        <p class="availability-status__state-desc">
          회원이 연결되면 주간 가능 시간 등록 여부를 여기에서 확인할 수 있습니다.
        </p>
      </div>

      <template v-else>
        <section class="availability-status__section">
          <h2 class="availability-status__section-title availability-status__section-title--pending">
            🔴 미등록 ({{ pendingMembers.length }}명)
          </h2>

          <p v-if="pendingMembers.length === 0" class="availability-status__section-empty">
            모든 회원이 가능 시간을 등록했습니다.
          </p>

          <article
            v-for="(member, memberIndex) in pendingMembers"
            :key="member.memberId"
            class="availability-status__member-card availability-status__member-card--pending stagger-fade-in"
            :style="{ '--stagger-index': memberIndex }"
          >
            <div class="availability-status__member-row">
              <div class="availability-status__profile">
                <div class="availability-status__avatar">
                  <img v-if="member.displayPhoto" :src="member.displayPhoto" :alt="member.displayName" />
                  <span v-else class="availability-status__avatar-initial">{{ member.displayName[0] }}</span>
                </div>
                <div class="availability-status__profile-meta">
                  <p class="availability-status__name">{{ member.displayName }}</p>
                  <span class="availability-status__badge availability-status__badge--pending">미등록</span>
                </div>
              </div>

              <button
                class="availability-status__reminder-btn press-effect"
                type="button"
                :disabled="Boolean(reminderLoadingId)"
                @click="sendReminder(member.memberId)"
              >
                {{ reminderLoadingId === member.memberId ? '전송 중...' : '리마인더 전송' }}
              </button>
            </div>
          </article>
        </section>

        <section class="availability-status__section">
          <h2 class="availability-status__section-title availability-status__section-title--submitted">
            ✅ 등록 완료 ({{ submittedMembers.length }}명)
          </h2>

          <p v-if="submittedMembers.length === 0" class="availability-status__section-empty">
            아직 가능 시간을 등록한 회원이 없습니다.
          </p>

          <article
            v-for="(member, memberIndex) in submittedMembers"
            :key="member.memberId"
            class="availability-status__member-card availability-status__member-card--submitted stagger-fade-in"
            :style="{ '--stagger-index': pendingMembers.length + memberIndex }"
          >
            <div class="availability-status__member-row">
              <div class="availability-status__profile">
                <div class="availability-status__avatar">
                  <img v-if="member.displayPhoto" :src="member.displayPhoto" :alt="member.displayName" />
                  <span v-else class="availability-status__avatar-initial">{{ member.displayName[0] }}</span>
                </div>
                <div class="availability-status__profile-meta">
                  <p class="availability-status__name">{{ member.displayName }}</p>
                  <span class="availability-status__badge availability-status__badge--submitted">등록 완료</span>
                </div>
              </div>
            </div>

            <p class="availability-status__summary">
              {{ formatAvailability(member.availability?.available_slots) }}
            </p>
            <p v-if="getMemoText(member.availability?.memo)" class="availability-status__memo">
              💬 "{{ getMemoText(member.availability?.memo) }}"
            </p>
          </article>
        </section>
      </template>
    </main>

    <div style="height: calc(var(--nav-height) + 24px);" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMembers } from '@/composables/useMembers'
import { useAvailability } from '@/composables/useAvailability'
import { useNotifications } from '@/composables/useNotifications'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

defineOptions({ name: 'AvailabilityStatusView' })

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
}
const PERIOD_ORDER = ['morning', 'afternoon', 'evening']
const PERIOD_LABELS = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
}

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIsoDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getWeekStart(offsetWeeks = 0) {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff + offsetWeeks * 7)
  monday.setHours(0, 0, 0, 0)
  return toIsoDate(monday)
}

function formatWeekRange(weekStart) {
  const monday = parseIsoDate(weekStart)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${monday.getMonth() + 1}/${monday.getDate()} ~ ${sunday.getMonth() + 1}/${sunday.getDate()}`
}

function formatAvailability(slots) {
  if (!slots || typeof slots !== 'object') {
    return '등록된 시간 없음'
  }

  const summary = DAY_ORDER
    .map((day) => {
      const periods = Array.isArray(slots[day]) ? slots[day] : []
      if (periods.length === 0) return null

      const labels = PERIOD_ORDER
        .filter((period) => periods.includes(period))
        .map((period) => PERIOD_LABELS[period])
        .filter(Boolean)

      if (labels.length === 0) return null

      return `${DAY_LABELS[day]} ${labels.join('/')}`
    })
    .filter(Boolean)
    .join(', ')

  return summary || '등록된 시간 없음'
}

function getMemoText(memo) {
  if (typeof memo !== 'string') return ''
  return memo.trim()
}

const router = useRouter()
const auth = useAuthStore()
const { showToast, showSuccess } = useToast()

const { members, fetchMembers, loading: membersLoading, error: membersError } = useMembers()
const {
  fetchMemberAvailabilities,
  loading: availabilityLoading,
  error: availabilityError,
} = useAvailability()
const { createNotification } = useNotifications()

const weekOffset = ref(0)
const availabilities = ref([])
const reminderLoadingId = ref(null)
const hasLoaded = ref(false)

const selectedWeekStart = computed(() => getWeekStart(weekOffset.value))
const weekRangeText = computed(() => formatWeekRange(selectedWeekStart.value))
const weekLabel = computed(() => (weekOffset.value === 0 ? '이번 주' : '다음 주'))

const membersWithAvailability = computed(() => {
  const availMap = new Map(availabilities.value.map((availability) => [availability.member_id, availability]))

  return members.value
    .map((member) => {
      const memberId = member.id ?? member.member_id
      const availability = availMap.get(memberId) ?? null

      return {
        ...member,
        memberId,
        displayName: member.name ?? '이름 없음',
        displayPhoto: member.photo ?? member.photo_url ?? null,
        availability,
        hasSubmitted: availMap.has(memberId),
      }
    })
    .sort((a, b) => {
      if (!a.hasSubmitted && b.hasSubmitted) return -1
      if (a.hasSubmitted && !b.hasSubmitted) return 1
      return a.displayName.localeCompare(b.displayName, 'ko')
    })
})

const pendingMembers = computed(() => membersWithAvailability.value.filter((member) => !member.hasSubmitted))
const submittedMembers = computed(() => membersWithAvailability.value.filter((member) => member.hasSubmitted))
const isLoading = computed(() => membersLoading.value || availabilityLoading.value || !hasLoaded.value)
const isEmpty = computed(() => !isLoading.value && membersWithAvailability.value.length === 0)

let loadToken = 0

async function loadAvailabilityStatus({ includeMembers = false } = {}) {
  const token = ++loadToken

  if (includeMembers || members.value.length === 0) {
    await fetchMembers()
  }

  const data = await fetchMemberAvailabilities(selectedWeekStart.value)
  if (token !== loadToken) return

  availabilities.value = Array.isArray(data) ? data : []
  hasLoaded.value = true
}

function moveToPreviousWeek() {
  if (weekOffset.value === 0) return
  weekOffset.value -= 1
}

function moveToNextWeek() {
  if (weekOffset.value === 1) return
  weekOffset.value += 1
}

async function sendReminder(memberId) {
  if (reminderLoadingId.value) {
    return
  }

  if (!auth.user?.id) {
    showToast('사용자 정보를 확인할 수 없습니다.', 'error')
    return
  }

  reminderLoadingId.value = memberId
  const isCreated = await createNotification(
    memberId,
    'availability_reminder',
    '가능 시간 등록 요청',
    '이번 주 PT 가능 시간을 등록해주세요',
    auth.user.id,
    'trainer',
  )
  reminderLoadingId.value = null

  if (!isCreated) {
    showToast('리마인더 전송에 실패했습니다.', 'error')
    return
  }

  showSuccess('리마인더를 전송했습니다.')
}

onMounted(async () => {
  await loadAvailabilityStatus({ includeMembers: true })
})

watch(selectedWeekStart, async (newWeekStart, oldWeekStart) => {
  if (newWeekStart === oldWeekStart) return
  await loadAvailabilityStatus()
})

watch(membersError, (message) => {
  if (message) {
    showToast(message, 'error')
  }
})

watch(availabilityError, (message) => {
  if (message) {
    showToast(message, 'error')
  }
})
</script>

<style src="./AvailabilityStatusView.css" scoped></style>
