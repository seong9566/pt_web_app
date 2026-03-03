<!-- 회원 설정 페이지. 프로필 정보 표시, 트레이너 연결 상태, 로그아웃 -->
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

      <!-- ── 내 수강권 ── -->
      <section class="settings__group">
        <h2 class="settings__group-title">내 회원권</h2>
        <div class="settings__card settings__pt-card">
          <div class="settings__pt-info">
            <span class="settings__pt-label">남은 PT 횟수</span>
            <div class="settings__pt-count">
              <span class="settings__pt-count-remain">{{ ptCount.remain }}</span>
              <span class="settings__pt-count-total"> / {{ ptCount.total }}회</span>
            </div>
          </div>
          <div class="settings__pt-progress-wrap">
            <div
              class="settings__pt-progress-bar"
              :style="{ width: ptCountPct + '%' }"
            />
          </div>
          <p class="settings__pt-desc">
            현재 {{ ptCount.trainer }} 트레이너님과 함께하고 있습니다.
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import '@/views/trainer/SettingsView.css'

const router = useRouter()
const auth = useAuthStore()

// 실제 구현 시 API에서 사용자 정보 fetch
// 현재는 mock 데이터 사용
const user = {
  name: '김회원',
  email: 'member@ptapp.com',
}

const roleBadge = computed(() => {
  return auth.role === 'trainer' ? '트레이너' : '회원'
})

// 내 수강권 Mock
const ptCount = { remain: 8, total: 20, trainer: '이선생' }
const ptCountPct = computed(() => {
  if (!ptCount.total) return 0
  return Math.round((ptCount.remain / ptCount.total) * 100)
})

// ── 네비게이션 ──
function handleNav(target) {
  if (target === 'profile-edit') {
    router.push({ name: 'member-profile' })
  } else {
    // router.push({ name: target })
    alert('이동: ' + target)
  }
}

// ── 로그아웃 ──
function handleLogout() {
  auth.logout()
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
