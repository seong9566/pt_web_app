<template>
  <div class="account-manage">

    <!-- ── 헤더 ── -->
    <div class="account-manage__header">
      <button class="account-manage__header-back" @click="safeBack(route.path)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h2 class="account-manage__header-title">계정 관리</h2>
      <div style="width: 40px" />
    </div>

    <div class="account-manage__body">
      <template v-if="auth.loading">
        <section class="account-manage__provider-info">
          <AppSkeleton type="circle" width="44px" height="44px" />
          <div style="width: 100%;">
            <AppSkeleton type="line" width="72px" />
            <AppSkeleton type="line" width="120px" />
          </div>
        </section>

        <section class="account-manage__section">
          <AppSkeleton type="line" width="96px" />
          <AppSkeleton type="line" width="180px" />
          <AppSkeleton type="rect" height="52px" borderRadius="var(--radius-medium)" :count="2" />
        </section>

        <section class="account-manage__section">
          <AppSkeleton type="line" width="96px" />
          <AppSkeleton type="rect" height="52px" borderRadius="var(--radius-medium)" :count="3" />
        </section>

        <div class="nav-spacer" />
      </template>

      <template v-else>
        <!-- ── 로그인 방식 표시 ── -->
        <section class="account-manage__provider-info">
          <div class="account-manage__provider-icon">
            <svg v-if="isEmailUser" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/>
              <path d="M2 8L12 13L22 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C7.03 2 3 5.58 3 10c0 2.8 1.52 5.26 3.86 6.83L6 21l4.47-2.3C10.96 18.89 11.47 19 12 19c4.97 0 9-3.58 9-8S16.97 2 12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="account-manage__provider-text">
            <span class="account-manage__provider-label">로그인 방식</span>
            <span class="account-manage__provider-value">{{ isEmailUser ? '이메일' : '카카오' }}</span>
          </div>
        </section>

        <!-- ── 카카오 사용자 안내 ── -->
        <section v-if="!isEmailUser" class="account-manage__kakao-notice">
          <p class="account-manage__kakao-notice-text">
            카카오 계정으로 로그인 중입니다. 이메일/비밀번호 변경이 불가합니다.
          </p>
        </section>

        <!-- ── 이메일 변경 (이메일 사용자만) ── -->
        <section v-if="isEmailUser" class="account-manage__section">
          <h3 class="account-manage__section-title">이메일 변경</h3>
          <p class="account-manage__current-value">현재 이메일: {{ auth.user?.email }}</p>
          <div class="account-manage__field">
            <label class="account-manage__label">새 이메일</label>
            <input
              v-model="newEmail"
              type="email"
              class="account-manage__input"
              placeholder="새 이메일을 입력해주세요"
            />
          </div>
          <p v-if="emailError" class="account-manage__error">{{ emailError }}</p>
          <div v-if="emailSuccess" class="account-manage__success-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink: 0; margin-top: 1px;">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>{{ emailSuccess }}</p>
          </div>
          <button
            class="account-manage__btn"
            :disabled="emailLoading"
            @click="handleEmailChange"
          >
            {{ emailLoading ? '처리 중...' : '이메일 변경' }}
          </button>
        </section>

        <!-- ── 비밀번호 변경 (이메일 사용자만) ── -->
        <section v-if="isEmailUser" class="account-manage__section">
          <h3 class="account-manage__section-title">비밀번호 변경</h3>
          <div class="account-manage__field">
            <label class="account-manage__label">새 비밀번호</label>
            <input
              v-model="newPassword"
              type="password"
              class="account-manage__input"
              placeholder="새 비밀번호 (6자 이상)"
            />
          </div>
          <div class="account-manage__field">
            <label class="account-manage__label">비밀번호 확인</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="account-manage__input"
              placeholder="비밀번호를 다시 입력해주세요"
            />
          </div>
          <p v-if="passwordError" class="account-manage__error">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="account-manage__success">{{ passwordSuccess }}</p>
          <button
            class="account-manage__btn"
            :disabled="passwordLoading"
            @click="handlePasswordChange"
          >
            {{ passwordLoading ? '처리 중...' : '비밀번호 변경' }}
          </button>
        </section>

        <div class="nav-spacer" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { safeBack } from '@/utils/navigation'
import { useAuthStore } from '@/stores/auth'
import AppSkeleton from '@/components/AppSkeleton.vue'
import { useProfile } from '@/composables/useProfile'
import { useToast } from '@/composables/useToast'
import { isValidEmail } from '@/utils/validators'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { error: profileError, updateUserEmail, updateUserPassword } = useProfile()
const { showToast } = useToast()

const isEmailUser = computed(() => auth.user?.app_metadata?.provider === 'email')

const newEmail = ref('')
const emailLoading = ref(false)
const emailError = ref('')
const emailSuccess = ref('')

const newPassword = ref('')
const confirmPassword = ref('')
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

async function handleEmailChange() {
   emailError.value = ''
   emailSuccess.value = ''

   if (!newEmail.value.trim()) {
     emailError.value = '새 이메일을 입력해주세요.'
     return
   }

   if (!isValidEmail(newEmail.value)) {
     emailError.value = '올바른 이메일 형식이 아닙니다'
     return
   }

   emailLoading.value = true

    const success = await updateUserEmail(newEmail.value)
    if (success) {
      emailSuccess.value = '이메일이 변경되었습니다.'
      newEmail.value = ''
   } else {
      emailError.value = profileError.value || '이메일 변경 중 오류가 발생했습니다.'
    }

   emailLoading.value = false
}

async function handlePasswordChange() {
   passwordError.value = ''
   passwordSuccess.value = ''

   if (!newPassword.value) {
     passwordError.value = '새 비밀번호를 입력해주세요.'
     return
   }

   if (newPassword.value.length < 6) {
     passwordError.value = '비밀번호는 6자 이상이어야 합니다.'
     return
   }

   if (newPassword.value !== confirmPassword.value) {
     passwordError.value = '비밀번호가 일치하지 않습니다.'
     return
   }

   passwordLoading.value = true

   const success = await updateUserPassword(newPassword.value)
   if (success) {
     passwordSuccess.value = '비밀번호가 변경되었습니다.'
     newPassword.value = ''
     confirmPassword.value = ''
   } else {
     passwordError.value = profileError.value || '비밀번호 변경 중 오류가 발생했습니다.'
   }

   passwordLoading.value = false
}

watch(profileError, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./AccountManageView.css" scoped></style>
