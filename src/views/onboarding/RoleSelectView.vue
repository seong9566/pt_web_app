<!-- 역할 선택 페이지. 트레이너 또는 회원 중 선택 → 프로필 생성 페이지로 이동 -->
<template>
  <div class="role-select">
    <div class="role-select__header">
      <button class="role-select__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="#111111"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div class="role-select__progress">
        <ProgressBar :current-step="1" :total-steps="2" />
      </div>
    </div>
    <div class="role-select__content">
      <h1 class="role-select__title">어떤 역할로<br />사용하시겠어요?</h1>
      <p class="role-select__desc">
        나중에 역할을 변경하려면 고객센터에 문의해야 하므로<br />신중하게 선택해
        주세요.
      </p>
      <div class="role-select__cards">
        <button class="role-card" :class="{ 'role-card--selected': selectedRole === 'trainer' }" @click="selectedRole = 'trainer'">
          <div class="role-card__icon-wrap">
            <img src="@/assets/icons/trainer.svg" alt="trainer icon" width="28" height="28" />
          </div>
          <div class="role-card__text">
            <span class="role-card__name">트레이너 (전문가용)</span>
            <span class="role-card__desc">회원을 관리하고 운동 계획을 작성하며 진행 상황을 추적하고 싶습니다.</span>
          </div>
        </button>
        <button class="role-card" :class="{ 'role-card--selected': selectedRole === 'member' }" @click="selectedRole = 'member'">
          <div class="role-card__icon-wrap">
            <img src="@/assets/icons/person.svg" alt="member icon" width="28" height="28" />
          </div>
          <div class="role-card__text">
            <span class="role-card__name">회원 (일반 사용자용)</span>
            <span class="role-card__desc"
              >내 운동 기록을 확인하고 통계를 추적하며 트레이너와 소통하고
              싶습니다.</span
            >
          </div>
        </button>
      </div>
      <button
        class="role-select__invite-link"
        @click="router.push('/invite/enter')"
      >
        초대 코드를 받으셨나요?
      </button>
    </div>
    <p v-if="errorMsg" class="role-select__error" style="color: var(--color-red); font-size: var(--fs-body2); text-align: center; margin-bottom: 12px;">{{ errorMsg }}</p>
    <div class="role-select__footer">
      <AppButton @click="handleNext" :disabled="!selectedRole || isLoading">{{ isLoading ? '저장 중...' : '다음 →' }}</AppButton>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ProgressBar from "@/components/ProgressBar.vue";
import AppButton from "@/components/AppButton.vue";
import { useAuthStore } from "@/stores/auth";
import { useProfile } from "@/composables/useProfile";

const router = useRouter();
const auth = useAuthStore();
const { saveRole } = useProfile();
const selectedRole = ref(null);
const isLoading = ref(false)
const errorMsg = ref('')

/** 역할 선택 후 다음 단계로 진행 */
async function handleNext() {
  if (!selectedRole.value) return
  isLoading.value = true
  errorMsg.value = ''

  const { loading, error } = await saveRole(auth.user.id, selectedRole.value)

  if (error.value) {
    errorMsg.value = error.value
    isLoading.value = false
    return
  }

  auth.setRole(selectedRole.value)
  isLoading.value = false

  if (selectedRole.value === 'trainer')
    router.push('/trainer/profile')
  else if (selectedRole.value === 'member')
    router.push('/onboarding/member-profile')
}
</script>
<style src="./RoleSelectView.css" scoped></style>
