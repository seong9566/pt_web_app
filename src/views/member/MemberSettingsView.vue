<!-- 회원 설정 페이지. 프로필 정보 표시, 트레이너 연결 상태, 로그아웃 -->
<template>
  <div class="settings">
    <AppPullToRefresh @refresh="handleRefresh">

    <!-- ── Header ── -->
    <div class="settings__header">
      <h1 class="settings__header-title">설정</h1>
    </div>

    <div class="settings__body">

      <!-- ── 로그인 프로필 카드 ── -->
      <section class="settings__profile">
        <div class="settings__profile-avatar">
          <img v-if="auth.profile?.photo_url" :src="auth.profile.photo_url" alt="프로필" class="settings__profile-avatar-img" />
          <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="settings__profile-info">
          <span class="settings__profile-name">{{ auth.profile?.name || '사용자' }}</span>
          <span class="settings__profile-email">{{ auth.user?.email || '' }}</span>
        </div>
        <span class="settings__profile-badge">{{ roleBadge }}</span>
      </section>

      <!-- ── 내 수강권 ── -->
      <section v-if="hasActiveConnection === true" class="settings__group">
        <h2 class="settings__group-title">내 회원권</h2>
        <div class="settings__card settings__pt-card">
          <div class="settings__pt-info">
            <span class="settings__pt-label">남은 PT 횟수</span>
            <div class="settings__pt-count">
              <span class="settings__pt-count-remain">{{ remainingCount }}</span>
              <span class="settings__pt-count-total"> / {{ totalCount }}회</span>
            </div>
          </div>
          <div class="settings__pt-progress-wrap">
            <div
              class="settings__pt-progress-bar"
              :style="{ width: ptCountPct + '%' }"
            />
          </div>
          <p class="settings__pt-desc">
            {{ trainerName ? `현재 ${trainerName}님과 함께하고 있습니다.` : '트레이너를 연결하면 PT 횟수가 표시됩니다.' }}
          </p>
        </div>
      </section>

      <!-- ── 내 계정 ── -->
      <section class="settings__group">
        <h2 class="settings__group-title">내 계정</h2>
        <div class="settings__card">
          <button class="settings__row" @click="handleNav('profile-edit')">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
                <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="settings__row-label">내 프로필 수정</span>
            <svg class="settings__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="settings__divider" />
          <button class="settings__row" @click="router.push({ name: 'member-payments' })">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M7 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="settings__row-label">수납 내역</span>
            <svg class="settings__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="settings__divider" />
          <button class="settings__row" @click="handleNav('account')">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/>
                <path d="M2 19C2 16.7909 5.13401 15 9 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="17" cy="10" r="3" stroke="currentColor" stroke-width="1.6"/>
                <path d="M13 19C13 17.3431 14.7909 16 17 16C19.2091 16 21 17.3431 21 19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="settings__row-label">계정 관리</span>
            <svg class="settings__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      <!-- ── 연결 관리 ── -->
      <section v-if="hasActiveConnection !== null" class="settings__group">
        <h2 class="settings__group-title">연결 관리</h2>
        <div class="settings__card">
          <button v-if="trainerName" class="settings__row" @click="goChat">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="settings__row-label">채팅하기</span>
            <svg class="settings__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-if="trainerName" class="settings__divider" />
          <button v-if="trainerName" class="settings__row" @click="showDisconnectSheet = true">
            <span class="settings__row-icon settings__row-icon--danger">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M10 17L15 12M15 12L10 7M15 12H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="settings__row-label settings__row-label--danger">트레이너 연결 해제</span>
          </button>
          <button v-else class="settings__row" @click="router.push({ name: 'trainer-search' })">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
                <path d="M16 16L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="settings__row-label">트레이너 연결하기</span>
            <svg class="settings__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      <!-- ── 계정 관리 ── -->
      <section class="settings__group">
        <h2 class="settings__group-title">계정 관리</h2>
        <div class="settings__card">
          <button class="settings__row" @click="showDeleteSheet = true">
            <span class="settings__row-icon settings__row-icon--danger">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="settings__row-label settings__row-label--danger">계정 삭제</span>
          </button>
        </div>
      </section>

      <!-- ── 로그아웃 + 버전 ── -->
      <div class="settings__footer">
        <button class="settings__logout" @click="handleLogout">로그아웃</button>
        <span class="settings__version">Version 2.4.0</span>
      </div>

      <div style="height: calc(var(--nav-height) + 16px);" />

    </div>
    </AppPullToRefresh>

  </div>

  <AppBottomSheet v-model="showDisconnectSheet" title="트레이너 연결 해제">
    <p class="settings__sheet-desc">정말 연결을 해제하시겠습니까?</p>
    <div class="settings__sheet-actions">
      <button class="settings__sheet-btn settings__sheet-btn--cancel" @click="showDisconnectSheet = false">취소</button>
      <button class="settings__sheet-btn settings__sheet-btn--confirm" @click="handleDisconnect">확인</button>
    </div>
  </AppBottomSheet>

  <AppBottomSheet v-model="showDeleteSheet" title="계정 삭제">
    <p class="settings__sheet-desc">30일 후 계정이 완전히 삭제됩니다. 30일 이내에 로그인하면 삭제를 취소할 수 있습니다.<br>'탈퇴'를 입력하세요.</p>
    <input v-model="deleteConfirmInput" class="settings__sheet-input" placeholder="탈퇴" type="text" />
    <button
      class="settings__sheet-btn settings__sheet-btn--delete"
      :disabled="deleteConfirmInput !== '탈퇴' || deleting"
      @click="handleDeleteAccount"
    >{{ deleting ? '삭제 중...' : '삭제' }}</button>
  </AppBottomSheet>

  <AppToast v-model="showToast" :message="toastMessage" :type="toastType" />
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'

defineOptions({ name: 'MemberSettingsView' })
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfile } from '@/composables/useProfile'
import { usePtSessions } from '@/composables/usePtSessions'
import { useReservations } from '@/composables/useReservations'
import { usePtSessionsStore } from '@/stores/ptSessions'
import { useReservationsStore } from '@/stores/reservations'
import { useChatBadgeStore } from '@/stores/chatBadge'
import { useToast } from '@/composables/useToast'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppPullToRefresh from '@/components/AppPullToRefresh.vue'
import AppToast from '@/components/AppToast.vue'
import '@/views/trainer/SettingsView.css'

const router = useRouter()
const auth = useAuthStore()
const { disconnectTrainer, softDeleteAccount, fetchConnectedTrainerName } = useProfile()
const { remainingCount, totalCount, fetchMemberOwnPtCount } = usePtSessions()
const { checkTrainerConnection } = useReservations()
const ptSessionsStore = usePtSessionsStore()
const reservationsStore = useReservationsStore()
const chatBadgeStore = useChatBadgeStore()
const { showToast, toastMessage, toastType, showSuccess } = useToast()

const roleBadge = computed(() => {
  return auth.role === 'trainer' ? '트레이너' : '회원'
})

const trainerName = ref('')
const hasActiveConnection = ref(null)
const loaded = ref(false)

async function loadData() {
  const connected = await checkTrainerConnection()
  hasActiveConnection.value = connected
  if (!connected) {
    trainerName.value = ''
    loaded.value = true
    return
  }
  await fetchMemberOwnPtCount()
  const name = await fetchConnectedTrainerName()
  trainerName.value = name || ''
  loaded.value = true
}

async function handleRefresh() {
  await loadData()
}

onMounted(() => { if (!loaded.value) loadData() })
onActivated(() => { if (loaded.value && (ptSessionsStore._dirty || reservationsStore.isStale())) loadData() })

const ptCountPct = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((remainingCount.value / totalCount.value) * 100)
})

const showDisconnectSheet = ref(false)
const showDeleteSheet = ref(false)
const deleteConfirmInput = ref('')
const deleting = ref(false)

function handleNav(target) {
  if (target === 'profile-edit') {
    router.push({ name: 'member-profile-edit' })
  } else if (target === 'account') {
    router.push({ name: 'account-manage' })
  }
}

function goChat() {
  router.push({ name: 'member-chat' })
}

async function handleDisconnect() {
  const ok = await disconnectTrainer()
  if (ok) {
    showDisconnectSheet.value = false
    reservationsStore.$reset()
    ptSessionsStore.$reset()
    chatBadgeStore.$reset()
    showSuccess('트레이너 연결이 해제되었습니다')
    await loadData()
  }
}

async function handleDeleteAccount() {
  if (deleteConfirmInput.value !== '탈퇴') return
  deleting.value = true
  const ok = await softDeleteAccount()
  if (ok) {
    showDeleteSheet.value = false
    router.push('/login')
  } else {
    deleting.value = false
  }
}

async function handleLogout() {
  if (!confirm('로그아웃 하시겠습니까?')) return
  await auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
/* SettingsView.css를 공유하되 회원 전용 항목은 여기서 추가 */
.settings__pt-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings__pt-info {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.settings__pt-label {
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-bold);
  color: var(--color-gray-900);
}

.settings__pt-count {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.settings__pt-count-remain {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-blue-primary);
}

.settings__pt-count-total {
  font-size: var(--fs-body2);
  color: var(--color-gray-600);
}

.settings__pt-progress-wrap {
  height: 6px;
  background-color: var(--color-gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.settings__pt-progress-bar {
  height: 100%;
  background-color: var(--color-blue-primary);
  border-radius: 3px;
  transition: width 0.6s ease;
}

.settings__pt-desc {
  font-size: var(--fs-caption);
  color: var(--color-gray-600);
  margin: 0;
}

</style>
