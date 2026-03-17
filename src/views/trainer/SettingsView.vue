<!-- 트레이너 설정 페이지. 프로필 정보, 근무시간 설정 링크, 로그아웃 -->
<template>
  <div class="settings">

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

       <!-- ── 내 계정 ── -->
       <section class="settings__group">
         <h2 class="settings__group-title">내 계정</h2>
         <div class="settings__card">
           <button class="settings__row" @click="handleNav('profile-view')">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
                <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M18 3L20 5L22 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="settings__row-label">내 프로필 보기</span>
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
           <div class="settings__divider" />
           <button class="settings__row" @click="handleNav('work-hours')">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>
                <path d="M3 9H21" stroke="currentColor" stroke-width="1.8"/>
                <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="12" cy="15" r="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 13V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="settings__row-label">근무 시간 설정</span>
            <svg class="settings__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="settings__divider" />
          <button class="settings__row" @click="handleNav('invite')">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M16 21V19C16 16.7909 13.3137 15 10 15C6.68629 15 4 16.7909 4 19V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="10" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
                <path d="M20 11V17M17 14H23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="settings__row-label">초대 코드 관리</span>
            <svg class="settings__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

        <section class = "settings__group">
        <h2 class="settings__group-title">메뉴얼</h2>  
        <div class="settings__card">
          <button class="settings__row" @click="handleNav('manual')">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="settings__row-label">메뉴얼 관리</span>
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
        <span class="settings__version">Version 1.0.0</span>
      </div>

      <div style="height: calc(var(--nav-height) + 16px);" />

    </div>

  </div>

  <AppBottomSheet v-model="showDeleteSheet" title="계정 삭제">
    <p class="settings__sheet-desc">30일 후 계정이 완전히 삭제됩니다. 30일 이내에 로그인하면 삭제를 취소할 수 있습니다.<br>'탈퇴'를 입력하세요.</p>
    <input v-model="deleteConfirmInput" class="settings__sheet-input" placeholder="탈퇴" type="text" />
    <button
      class="settings__sheet-btn settings__sheet-btn--delete"
      :disabled="deleteConfirmInput !== '탈퇴' || deleting"
      @click="handleDeleteAccount"
    >{{ deleting ? '삭제 중...' : '삭제' }}</button>
  </AppBottomSheet>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfile } from '@/composables/useProfile'
import { useConfirm } from '@/composables/useConfirm'
import AppBottomSheet from '@/components/AppBottomSheet.vue'

const router = useRouter()
const auth = useAuthStore()
const { softDeleteAccount } = useProfile()
const { confirm } = useConfirm()

const roleBadge = computed(() => {
  return auth.role === 'trainer' ? '트레이너' : '회원'
})

const showDeleteSheet = ref(false)
const deleteConfirmInput = ref('')
const deleting = ref(false)

function handleNav(target) {
  if (target === 'work-hours') {
    router.push({ name: 'trainer-work-time' })
  } else if (target === 'manual') {
    router.push({ name: 'trainer-manual' })
  } else if (target === 'profile-edit') {
    router.push({ name: 'trainer-profile-edit' })
  } else if (target === 'account') {
    router.push({ name: 'account-manage' })
  } else if (target === 'invite') {
    router.push({ name: 'invite-manage' })
  } else if (target === 'profile-view') {
    router.push({ name: 'trainer-profile-view' })
  }
}

async function handleDeleteAccount() {
  if (deleteConfirmInput.value !== '탈퇴') return
  deleting.value = true
  const ok = await softDeleteAccount()
  if (ok) {
    showDeleteSheet.value = false
    router.push({ name: 'login' })
  } else {
    deleting.value = false
  }
}

async function handleLogout() {
  if (await confirm('로그아웃 하시겠습니까?')) {
    await auth.signOut()
    router.push({ name: 'login' })
  }
}
</script>

<style src="./SettingsView.css" scoped></style>
