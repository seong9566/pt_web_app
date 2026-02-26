<template>
  <div class="role-select">
    <div class="role-select__header">
      <button class="role-select__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="role-select__progress"><ProgressBar :current-step="1" :total-steps="2" /></div>
    </div>
    <div class="role-select__content">
      <h1 class="role-select__title">어떤 역할로<br />사용하시겠어요?</h1>
      <p class="role-select__desc">나중에 역할을 변경하려면 고객센터에 문의해야 하므로<br />신중하게 선택해 주세요.</p>
      <div class="role-select__cards">
        <button class="role-card" :class="{ 'role-card--selected': selectedRole === 'trainer' }" @click="selectedRole = 'trainer'">
          <div class="role-card__icon-wrap">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none"><rect x="6" y="20" width="8" height="8" rx="3" fill="#007AFF"/><rect x="34" y="20" width="8" height="8" rx="3" fill="#007AFF"/><rect x="10" y="16" width="6" height="16" rx="2" fill="#007AFF"/><rect x="32" y="16" width="6" height="16" rx="2" fill="#007AFF"/><rect x="16" y="22" width="16" height="4" rx="2" fill="#007AFF"/></svg>
          </div>
          <div class="role-card__text">
            <span class="role-card__name">트레이너 (전문가용)</span>
            <span class="role-card__desc">회원을 관리하고 운동 계획을 작성하며 진행 상황을 추적하고 싶습니다.</span>
          </div>
        </button>
        <button class="role-card" :class="{ 'role-card--selected': selectedRole === 'member' }" @click="selectedRole = 'member'">
          <div class="role-card__icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#007AFF"/><path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <div class="role-card__text">
            <span class="role-card__name">회원 (일반 사용자용)</span>
            <span class="role-card__desc">내 운동 기록을 확인하고 통계를 추적하며 트레이너와 소통하고 싶습니다.</span>
          </div>
        </button>
      </div>
    </div>
    <div class="role-select__footer">
      <AppButton @click="handleNext" :disabled="!selectedRole">다음 →</AppButton>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProgressBar from '@/components/ProgressBar.vue'
import AppButton from '@/components/AppButton.vue'
const router = useRouter()
const selectedRole = ref(null)
function handleNext() {
  if (selectedRole.value === 'trainer') router.push('/onboarding/trainer-profile')
  else if (selectedRole.value === 'member') router.push('/onboarding/member-profile')
}
</script>
<style scoped>
.role-select { min-height: 100vh; display: flex; flex-direction: column; background-color: var(--color-white); padding-bottom: 100px; }
.role-select__header { display: flex; align-items: center; padding: 16px var(--side-margin); gap: 12px; }
.role-select__back { flex-shrink: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; border-radius: 50%; }
.role-select__back:active { background-color: var(--color-gray-100); }
.role-select__progress { flex: 1; padding-right: 40px; }
.role-select__content { flex: 1; padding: 24px var(--side-margin) 0; display: flex; flex-direction: column; gap: 24px; }
.role-select__title { font-size: var(--fs-display); font-weight: var(--fw-display); color: var(--color-gray-900); line-height: 1.4; margin: 0; }
.role-select__desc { font-size: var(--fs-body2); color: var(--color-gray-600); line-height: 1.6; margin: 0; }
.role-select__cards { display: flex; flex-direction: column; gap: 12px; }
.role-card { display: flex; align-items: center; gap: 16px; padding: 20px; background-color: var(--color-white); border: 1.5px solid var(--color-gray-200); border-radius: var(--radius-large); cursor: pointer; text-align: left; width: 100%; box-shadow: var(--shadow-card); transition: border-color 0.15s; font-family: inherit; }
.role-card--selected { border-color: var(--color-blue-primary); background-color: var(--color-blue-light); }
.role-card__icon-wrap { width: 52px; height: 52px; background-color: var(--color-blue-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.role-card--selected .role-card__icon-wrap { background-color: var(--color-white); }
.role-card__text { display: flex; flex-direction: column; gap: 6px; }
.role-card__name { font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900); }
.role-card__desc { font-size: var(--fs-caption); color: var(--color-gray-600); line-height: 1.5; }
.role-select__footer { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: var(--app-max-width); padding: 16px var(--side-margin); background-color: var(--color-white); border-top: 1px solid var(--color-gray-200); }
</style>
