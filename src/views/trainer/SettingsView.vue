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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="settings__profile-info">
          <span class="settings__profile-name">{{ user.name }}</span>
          <span class="settings__profile-email">{{ user.email }}</span>
        </div>
        <span class="settings__profile-badge">{{ roleBadge }}</span>
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
        </div>
      </section>

        <section class = "settings__group">
        <h2 class="settings__group-title">메뉴얼</h2>  
        <div class="settings__card">
          <button class="settings__row" @click="handleNav('manual')">
            <span class="settings__row-icon">
              <span style="display: block; width: 22px; height: 22px; background-color: currentColor;" :style="{ maskImage: `url(${IconManual})`, WebkitMaskImage: `url(${IconManual})`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }" />
            </span>
            <span class="settings__row-label">메뉴얼 관리</span>
            <svg class="settings__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        </section>

      <!-- ── 앱 설정 ── -->
       <!-- TODO: 추후 연결 시 알림 추가  -->
      <!-- <section class="settings__group">
        <h2 class="settings__group-title">앱 설정</h2>
        <div class="settings__card">
          <button class="settings__row settings__row--toggle" @click="toggleNotification">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="settings__row-label">알림 설정</span>
            <span
              class="settings__toggle"
              :class="{ 'settings__toggle--on': notificationOn }"
            >
              <span class="settings__toggle-knob" />
            </span>
          </button>
        </div>
      </section> -->

      <!-- ── 지원 ── -->
      <!-- TODO: 추후 연결 시 고객센터 추가 -->
      <!-- <section class="settings__group">
        <h2 class="settings__group-title">지원</h2>
        <div class="settings__card">
          <button class="settings__row" @click="handleNav('support')">
            <span class="settings__row-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                <path d="M9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9C15 10.3062 14.1652 11.4174 13 11.8293V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="12" cy="16.5" r="0.75" fill="currentColor"/>
              </svg>
            </span>
            <span class="settings__row-label">고객센터</span>
            <svg class="settings__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </section> -->

      <!-- ── 로그아웃 + 버전 ── -->
      <div class="settings__footer">
        <button class="settings__logout" @click="handleLogout">로그아웃</button>
        <span class="settings__version">Version 2.4.0</span>
      </div>

      <div style="height: calc(var(--nav-height) + 16px);" />

    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import IconManual from '@/assets/icons/menual.svg'

const router = useRouter()
const auth = useAuthStore()

// 실제 구현 시 API에서 사용자 정보 fetch
// 현재는 mock 데이터 사용
const user = {
  name: '박트레이너',
  email: 'trainer@ptapp.com',
}

const roleBadge = computed(() => {
  return auth.role === 'trainer' ? '트레이너' : '회원'
})

// ── 알림 토글 ──
const notificationOn = ref(true)

function toggleNotification() {
  notificationOn.value = !notificationOn.value
}

// ── 네비게이션 (미구현 페이지 placeholder) ──
function handleNav(target) {
  if (target === 'work-hours') {
    router.push({ name: 'trainer-work-time' })
  } else if (target === 'manual') {
    router.push({ name: 'trainer-manual' })
  } else {
    alert('준비 중입니다')
  }
}

// ── 로그아웃 ──
function handleLogout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    auth.clearRole()
    router.push({ name: 'login' })
  }
}
</script>

<style src="./SettingsView.css" scoped></style>
