<template>
  <div class="trainer-home">
    <AppPullToRefresh @refresh="handleRefresh">

    <header class="trainer-home__header">
      <div class="trainer-home__header-left">
        <div class="trainer-home__avatar">
          <img v-if="auth.profile?.photo_url" :src="auth.profile.photo_url" alt="avatar" class="trainer-home__avatar-img" />
          <span v-else class="trainer-home__avatar-initial">{{ (auth.profile?.name || '트')[0] }}</span>
        </div>
        <div class="trainer-home__greeting">
          <span class="trainer-home__greeting-sub">환영합니다</span>
          <h1 class="trainer-home__greeting-name">{{ auth.profile?.name }} 트레이너님</h1>
        </div>
      </div>
      <button class="trainer-home__bell press-effect" @click="router.push({ name: 'notifications' })">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <span class="trainer-home__bell-dot"></span>
      </button>
    </header>

    <div v-if="reservError || membersError" class="trainer-home__error">
      {{ reservError || membersError }}
    </div>

    <div class="trainer-home__content">

      <div v-if="pendingConnectionCount > 0" class="trainer-home__action-card stagger-fade-in press-effect" :style="{ '--stagger-index': 0 }" @click="router.push({ name: 'trainer-members' })">
        <div class="trainer-home__action-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M2 20C2 17.2386 5.13401 15 9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 11V17M14 14H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div class="trainer-home__action-body">
          <span class="trainer-home__action-title">새로운 연결 요청</span>
          <span class="trainer-home__action-desc">대기 중 {{ pendingConnectionCount }}건</span>
        </div>
        <svg class="trainer-home__action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>

      <div v-if="pendingReservationCount > 0" class="trainer-home__action-card stagger-fade-in press-effect" :style="{ '--stagger-index': 1 }" @click="router.push({ name: 'trainer-reservations' })">
        <div class="trainer-home__action-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="trainer-home__action-body">
          <span class="trainer-home__action-title">변경 요청 일정</span>
          <span class="trainer-home__action-desc">변경 요청 {{ changeRequestCount }}건</span>
        </div>
        <svg class="trainer-home__action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>

      <section class="trainer-home__stats" :style="{ '--stagger-index': 2 }">
        <div class="trainer-home__stat-card">
          <div class="trainer-home__stat-icon trainer-home__stat-icon--session">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M3 9H21" stroke="currentColor" stroke-width="1.8"/><path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </div>
          <div class="trainer-home__stat-num">
            <span v-if="reservLoading">-</span>
            <span v-else>{{ todaySessionCount }}</span>
          </div>
          <span class="trainer-home__stat-label">오늘 일정</span>
        </div>
        <div class="trainer-home__stat-card">
          <div class="trainer-home__stat-icon trainer-home__stat-icon--member">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M2 20C2 17.2386 5.13401 15 9 15C12.866 15 16 17.2386 16 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="19" cy="7" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M18 20C18 18.5 19 17 21 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </div>
          <div class="trainer-home__stat-num">
            <span v-if="membersLoading">-</span>
            <span v-else>{{ memberCount }}</span>
          </div>
          <span class="trainer-home__stat-label">연결 회원</span>
        </div>
      </section>

      <section class="trainer-home__schedule" :style="{ '--stagger-index': 3 }">
        <div class="trainer-home__section-header">
          <h2 class="trainer-home__section-title">오늘의 일정</h2>
        </div>

        <div class="trainer-home__date-tabs">
          <button
            v-for="tab in dateTabs"
            :key="tab.date"
            class="trainer-home__date-tab press-effect"
            :class="{ 'trainer-home__date-tab--active': selectedDate === tab.date }"
            @click="selectedDate = tab.date"
          >{{ tab.label }}</button>
        </div>

        <div v-if="reservLoading" class="trainer-home__empty trainer-home__empty--loading">
          <AppSkeleton type="rect" height="92px" :count="2" />
        </div>
        <div v-else-if="filteredReservations.length === 0" class="trainer-home__empty">
          <template v-if="memberCount === 0">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
              <path d="M2 20C2 17.2386 5.13401 15 9 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M17 11V17M14 14H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p>아직 연결된 회원이 없습니다.</p>
            <p class="trainer-home__empty-hint">초대 코드를 생성하여 회원을 초대하세요.</p>
            <button class="trainer-home__invite-btn press-effect" @click="router.push('/invite/manage')">초대 코드 생성</button>
          </template>
          <template v-else>
            <p>예약이 없습니다.</p>
          </template>
        </div>
        <div v-else class="trainer-home__schedule-list">
          <div
            v-for="(reservation, ri) in filteredReservations"
            :key="reservation.id"
            class="trainer-home__schedule-card stagger-fade-in"
            :class="{
              'trainer-home__schedule-card--workout': workoutMap[reservation.id],
              'trainer-home__schedule-card--past': reservation.status === 'scheduled' && isSessionPast(reservation),
              'trainer-home__schedule-card--next': reservation.id === nextUpcomingId,
            }"
            :style="{ '--stagger-index': ri }"
          >
            <div class="trainer-home__schedule-main">
              <div class="trainer-home__schedule-time-col">
                <span class="trainer-home__schedule-time-text">{{ reservation.start_time }}</span>
              </div>
              <div class="trainer-home__schedule-avatar">
                <img v-if="reservation.partner_photo" :src="reservation.partner_photo" alt="" />
                <span v-else class="trainer-home__schedule-avatar-initial">{{ (reservation.partner_name || '회')[0] }}</span>
              </div>
              <div class="trainer-home__schedule-info">
                <h3 class="trainer-home__schedule-name">{{ reservation.partner_name }}</h3>
                <p class="trainer-home__schedule-sub">{{ reservation.start_time }} 수업 시작</p>
              </div>
              <span v-if="reservation.status === 'scheduled' && isSessionPast(reservation)" class="trainer-home__schedule-done">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                완료
              </span>
            </div>
            <template v-if="formatWorkoutSummary(workoutMap[reservation.id])">
              <div class="trainer-home__schedule-divider" />
              <p class="trainer-home__schedule-workout-label">오늘의 운동 요약</p>
              <p class="trainer-home__schedule-workout-text">{{ formatWorkoutSummary(workoutMap[reservation.id]) }}</p>
            </template>
          </div>
        </div>
      </section>

      <section class="trainer-home__messages" :style="{ '--stagger-index': 4 }">
        <div class="trainer-home__section-header">
          <h2 class="trainer-home__section-title">최근 메시지</h2>
          <a href="#" class="trainer-home__section-link" @click.prevent="router.push('/trainer/chat')">전체보기</a>
        </div>

        <div v-if="chatLoading" class="trainer-home__empty trainer-home__empty--loading">
          <AppSkeleton type="line" :count="3" />
        </div>
        <div v-else-if="chatError" class="trainer-home__error">{{ chatError }}</div>
        <div v-else-if="recentConversations.length === 0" class="trainer-home__empty">메시지가 없습니다.</div>
        <div v-else class="trainer-home__message-list">
          <div
            v-for="(conv, ci) in recentConversations"
            :key="conv.partnerId"
            class="trainer-home__message-card stagger-fade-in press-effect"
            :style="{ '--stagger-index': ci }"
            @click="router.push('/trainer/chat')"
          >
            <div class="trainer-home__message-avatar">
              <img v-if="conv.partnerPhoto" :src="conv.partnerPhoto" :alt="conv.partnerName" />
              <span v-else class="trainer-home__message-avatar-initial">{{ (conv.partnerName || '회')[0] }}</span>
              <span v-if="conv.unreadCount > 0" class="trainer-home__message-badge">
                {{ conv.unreadCount > 9 ? '9+' : conv.unreadCount }}
              </span>
            </div>
            <div class="trainer-home__message-body">
              <div class="trainer-home__message-top">
                <span class="trainer-home__message-name">{{ conv.partnerName }}</span>
                <span class="trainer-home__message-time">{{ formatMessageTime(conv.lastMessageTime) }}</span>
              </div>
              <p class="trainer-home__message-preview">{{ conv.lastMessage }}</p>
            </div>
          </div>
        </div>
      </section>

      <div style="height: calc(var(--nav-height) + 24px);" />
    </div>

    </AppPullToRefresh>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onActivated } from 'vue'

defineOptions({ name: 'TrainerHomeView' })
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'
import { useMembersStore } from '@/stores/members'
import { useReservations } from '@/composables/useReservations'
import { useMembers } from '@/composables/useMembers'
import { useChat } from '@/composables/useChat'
import { useTrainerSearch } from '@/composables/useTrainerSearch'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { useToast } from '@/composables/useToast'
import AppPullToRefresh from '@/components/AppPullToRefresh.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import { isSessionPast } from '@/utils/reservation'

const router = useRouter()
const auth = useAuthStore()
const reservationsStore = useReservationsStore()
const membersStore = useMembersStore()
const { reservations, loading: reservLoading, error: reservError, fetchMyReservations } = useReservations()
const { members, loading: membersLoading, error: membersError, fetchMembers } = useMembers()
const { conversations, loading: chatLoading, error: chatError, fetchConversations } = useChat()
const { fetchPendingRequests } = useTrainerSearch()
const { dayWorkoutPlans, fetchDayWorkoutPlans } = useWorkoutPlans()
const { showToast } = useToast()

const pendingConnectionCount = ref(0)

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 로컬 타임존 기준 Date 객체를 YYYY-MM-DD 문자열로 변환 */
function formatLocalDate(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** 오늘 날짜를 로컬 타임존 기준 YYYY-MM-DD 문자열로 반환 */
function getTodayDate() {
  return formatLocalDate(new Date())
}

const selectedDate = ref(getTodayDate())

/** 오늘부터 3일 후까지의 날짜 탭 목록 생성 (오늘/내일/요일 표시) */
const dateTabs = computed(() => {
  const tabs = []
  for (let i = 0; i < 4; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateStr = formatLocalDate(d)
    const label = i === 0
      ? '오늘'
      : i === 1
        ? '내일'
        : `${WEEK_DAYS[d.getDay()]}, ${d.getMonth() + 1}/${d.getDate()}`
    tabs.push({ date: dateStr, label })
  }
  return tabs
})

/** 선택된 날짜의 예약 목록 필터링 (취소/거절 제외) */
const filteredReservations = computed(() => {
  return reservations.value.filter(r => r.date === selectedDate.value && r.status !== 'cancelled' && r.status !== 'rejected')
})

/** 다음 예정된 수업 ID (완료되지 않은 scheduled 중 가장 빠른 것) */
const nextUpcomingId = computed(() => {
  const upcoming = filteredReservations.value.find(
    r => r.status === 'scheduled' && !isSessionPast(r)
  )
  return upcoming?.id ?? null
})

/** 예약별 운동 계획 맵 생성 (reservation_id → exercises 배열) */
const workoutMap = computed(() => {
  const map = {}
  for (const plan of dayWorkoutPlans.value) {
    if (plan.reservation_id) {
      map[plan.reservation_id] = plan.exercises
    }
  }
  return map
})

/** 운동 계획 배열을 요약 문자열로 변환 (예: "벤치프레스 3x10, 스쿼트 4x8") */
function formatWorkoutSummary(exercises) {
  if (!exercises || exercises.length === 0) return null
  return exercises
    .filter(e => e.name)
    .map(e => `${e.name} ${e.sets}x${e.reps}`)
    .join(', ')
}

/** 오늘 예정된 세션 수 (취소/거절 제외) */
const todaySessionCount = computed(() => {
  const today = getTodayDate()
  return reservations.value.filter(r => r.date === today && r.status !== 'cancelled' && r.status !== 'rejected').length
})

/** 변경 요청 중인 일정 수 */
const changeRequestCount = computed(() => {
  return reservations.value.filter(r => r.status === 'change_requested').length
})

/** 연결된 회원 수 */
const memberCount = computed(() => members.value.length)

/** 최근 대화 목록 (최대 3건) */
const recentConversations = computed(() => conversations.value.slice(0, 3))

/** 메시지 시간을 상대적 표현으로 변환 (방금, N분 전, N시간 전, N일 전) */
function formatMessageTime(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const msgDate = new Date(dateStr)
  const diffMs = now - msgDate
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return '방금'
  if (diffMins < 60) return `${diffMins}분 전`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}시간 전`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}일 전`
}

const loaded = ref(false)

/** 홈 화면 초기 데이터 로드 (예약, 회원, 채팅, 연결 요청, 운동 계획) */
async function loadData() {
  const [, , , pending] = await Promise.all([
    fetchMyReservations('trainer'),
    fetchMembers(),
    fetchConversations(),
    fetchPendingRequests(),
  ])
  pendingConnectionCount.value = (pending || []).length
  await fetchDayWorkoutPlans(selectedDate.value)
  loaded.value = true
}

/** 풀-투-리프레시 시 예약 및 회원 데이터 강제 재로드 */
async function handleRefresh() {
  await Promise.all([
    reservationsStore.loadReservations('trainer', true),
    membersStore.loadMembers(true),
  ])
  await Promise.all([
    fetchMyReservations('trainer'),
    fetchMembers(),
  ])
}

watch(selectedDate, (date) => { if (loaded.value) fetchDayWorkoutPlans(date) })
watch(reservError, (e) => { if (e) showToast(e, 'error') })
watch(membersError, (e) => { if (e) showToast(e, 'error') })
watch(chatError, (e) => { if (e) showToast(e, 'error') })

onMounted(() => { if (!loaded.value) loadData() })
onActivated(async () => {
  if (!loaded.value) return

  await Promise.all([
    fetchMyReservations('trainer'),
    fetchMembers(),
    fetchDayWorkoutPlans(selectedDate.value),
  ])

  if (reservationsStore.isStale() || membersStore.isStale()) {
    const pending = await fetchPendingRequests()
    pendingConnectionCount.value = (pending || []).length
  }
})
</script>

<style src="./TrainerHomeView.css" scoped></style>
