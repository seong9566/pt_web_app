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
        <button
          v-if="pendingMembers.length > 0"
          class="availability-status__pending-banner press-effect"
          type="button"
          @click="showPendingSheet = true"
        >
          <span>🔴 미등록 {{ pendingMembers.length }}명</span>
          <span class="availability-status__pending-banner-arrow">확인하기 ›</span>
        </button>

        <div class="availability-status__heatmap-wrapper">
          <div class="availability-status__heatmap">
            <div class="availability-status__heatmap-corner"></div>
            <div
              v-for="day in DAY_ORDER"
              :key="day"
              class="availability-status__heatmap-header"
            >{{ DAY_LABELS[day] }}</div>

            <template v-for="time in TIME_SLOTS" :key="time">
              <div class="availability-status__heatmap-time">{{ time }}</div>
              <button
                v-for="day in DAY_ORDER"
                :key="day + time"
                class="availability-status__heatmap-cell"
                :class="`availability-status__heatmap-cell--heat-${heatLevel(heatmapData[day]?.[time]?.count ?? 0)}`"
                type="button"
                @click="handleCellClick(day, time)"
              >
                <span v-if="(heatmapData[day]?.[time]?.count ?? 0) > 0">
                  {{ heatmapData[day]?.[time]?.count }}
                </span>
              </button>
            </template>
          </div>
        </div>
      </template>
    </main>

    <AppBottomSheet v-model="showCellSheet" :title="selectedCellLabel">
      <div class="availability-status__cell-sheet">
        <p v-if="selectedCellMembers.length === 0" class="availability-status__cell-empty">
          가능한 회원이 없습니다
        </p>
        <div
          v-for="member in selectedCellMembers"
          :key="member.memberId"
          class="availability-status__cell-member"
        >
          <div class="availability-status__cell-avatar">
            <img v-if="member.displayPhoto" :src="member.displayPhoto" :alt="member.displayName" />
            <span v-else>{{ member.displayName[0] }}</span>
          </div>
          <span class="availability-status__cell-name">{{ member.displayName }}</span>
        </div>
      </div>
    </AppBottomSheet>

    <AppBottomSheet v-model="showPendingSheet" title="미등록 회원">
      <div class="availability-status__pending-list">
        <div
          v-for="member in pendingMembers"
          :key="member.memberId"
          class="availability-status__pending-item"
        >
          <div class="availability-status__cell-avatar">
            <img v-if="member.displayPhoto" :src="member.displayPhoto" :alt="member.displayName" />
            <span v-else>{{ member.displayName[0] }}</span>
          </div>
          <span class="availability-status__cell-name">{{ member.displayName }}</span>
          <button
            class="availability-status__reminder-btn press-effect"
            type="button"
            :disabled="Boolean(reminderLoadingId)"
            @click="sendReminder(member.memberId)"
          >
            {{ reminderLoadingId === member.memberId ? '전송 중...' : '리마인더' }}
          </button>
        </div>
      </div>
    </AppBottomSheet>

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
import AppBottomSheet from '@/components/AppBottomSheet.vue'

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
const DAY_FULL_LABELS = {
  mon: '월요일',
  tue: '화요일',
  wed: '수요일',
  thu: '목요일',
  fri: '금요일',
  sat: '토요일',
  sun: '일요일',
}
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
]
const TIME_SLOT_PATTERN = /^\d{2}:\d{2}$/

function heatLevel(count) {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  return 3
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
const showCellSheet = ref(false)
const showPendingSheet = ref(false)
const selectedCell = ref(null)

const selectedWeekStart = computed(() => getWeekStart(weekOffset.value))
const weekRangeText = computed(() => formatWeekRange(selectedWeekStart.value))
const weekLabel = computed(() => (weekOffset.value === 0 ? '이번 주' : '다음 주'))

const membersWithAvailability = computed(() => {
  const availMap = new Map(availabilities.value.map((availability) => [availability.member_id, availability]))

  return members.value
    .map((member) => {
      const memberId = member.id ?? member.member_id
      const availability = availMap.get(memberId) ?? null
      const hasSubmitted = availability !== null
        && availability.available_slots !== null
        && availability.available_slots !== undefined

      return {
        ...member,
        memberId,
        displayName: member.name ?? '이름 없음',
        displayPhoto: member.photo ?? member.photo_url ?? null,
        availability,
        hasSubmitted,
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

const heatmapData = computed(() => {
  const data = {}
  for (const day of DAY_ORDER) {
    data[day] = {}
    for (const time of TIME_SLOTS) {
      data[day][time] = { count: 0, members: [] }
    }
  }
  for (const member of submittedMembers.value) {
    const slots = member.availability?.available_slots
    if (!slots || typeof slots !== 'object') continue
    for (const day of DAY_ORDER) {
      const daySlots = Array.isArray(slots[day]) ? slots[day] : []
      for (const timeStr of daySlots) {
        if (!TIME_SLOT_PATTERN.test(timeStr)) continue
        if (data[day][timeStr]) {
          data[day][timeStr].count++
          data[day][timeStr].members.push({
            memberId: member.memberId,
            displayName: member.displayName,
            displayPhoto: member.displayPhoto,
          })
        }
      }
    }
  }
  return data
})

const selectedCellMembers = computed(() => {
  if (!selectedCell.value) return []
  const { day, time } = selectedCell.value
  return heatmapData.value[day]?.[time]?.members ?? []
})

const selectedCellLabel = computed(() => {
  if (!selectedCell.value) return ''
  const { day, time } = selectedCell.value
  const hour = parseInt(time.slice(0, 2))
  const nextTime = `${String(hour + 1).padStart(2, '0')}:00`
  const count = heatmapData.value[day]?.[time]?.count ?? 0
  return `${DAY_FULL_LABELS[day]} ${time} ~ ${nextTime} (${count}명)`
})

function handleCellClick(day, time) {
  selectedCell.value = { day, time }
  showCellSheet.value = true
}

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
