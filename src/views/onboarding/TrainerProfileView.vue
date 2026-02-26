<template>
  <div class="trainer-profile">
    <div class="trainer-profile__header">
      <button class="trainer-profile__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="trainer-profile__progress"><ProgressBar :current-step="2" :total-steps="2" /></div>
    </div>
    <div class="trainer-profile__content">
      <div class="trainer-profile__intro">
        <h1 class="trainer-profile__title">트레이너 프로필을<br />완성해 주세요</h1>
        <p class="trainer-profile__subtitle">회원들에게 보여질 프로필 사진과<br />전문 분야를 입력해 주세요.</p>
      </div>
      <div class="trainer-profile__photo-wrap">
        <div class="trainer-profile__photo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="#999999" stroke-width="1.5"/><path d="M3 9C3 7.89543 3.89543 7 5 7H6.5L8 5H16L17.5 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" stroke="#999999" stroke-width="1.5"/></svg>
          <span class="trainer-profile__photo-label">사진 등록</span>
        </div>
        <button class="trainer-profile__photo-edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 19V12" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5L21.5 5.5L12 15L9 15L9 12L18.5 2.5Z" stroke="#007AFF" stroke-width="2" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="trainer-profile__field">
        <label class="trainer-profile__label">이름 (활동명)</label>
        <AppInput v-model="name" placeholder="예: 김헬스" />
      </div>
      <div class="trainer-profile__field">
        <label class="trainer-profile__label">전문 분야</label>
        <div class="trainer-profile__chips">
          <button v-for="spec in specialties" :key="spec.id" class="spec-chip" :class="{ 'spec-chip--selected': selectedSpecs.includes(spec.id) }" @click="toggleSpec(spec.id)">
            <span class="spec-chip__icon" v-html="spec.icon" />
            <span class="spec-chip__label">{{ spec.label }}</span>
          </button>
        </div>
      </div>
    </div>
    <div class="trainer-profile__footer">
      <AppButton @click="router.push('/search')">완료 ✓</AppButton>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProgressBar from '@/components/ProgressBar.vue'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
const router = useRouter()
const name = ref('')
const selectedSpecs = ref([])
const specialties = [
  { id: 'rehab', label: '재활/교정', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L12 22M7 7H17M7 17H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>` },
  { id: 'strength', label: '근력 증가', icon: `<svg width="20" height="20" viewBox="0 0 48 48" fill="none"><rect x="6" y="20" width="8" height="8" rx="3" fill="currentColor"/><rect x="34" y="20" width="8" height="8" rx="3" fill="currentColor"/><rect x="10" y="16" width="6" height="16" rx="2" fill="currentColor"/><rect x="32" y="16" width="6" height="16" rx="2" fill="currentColor"/><rect x="16" y="22" width="16" height="4" rx="2" fill="currentColor"/></svg>` },
  { id: 'diet', label: '다이어트/식단', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 8 6 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 6 12 2 12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 14V22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>` },
  { id: 'sports', label: '스포츠 퍼포먼스', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 4L17 8L7 18L3 18L3 14L13 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14.5 5.5L18.5 9.5" stroke="currentColor" stroke-width="1.8"/></svg>` },
]
function toggleSpec(id) {
  const idx = selectedSpecs.value.indexOf(id)
  if (idx === -1) selectedSpecs.value.push(id)
  else selectedSpecs.value.splice(idx, 1)
}
</script>
<style scoped>
.trainer-profile { min-height: 100vh; display: flex; flex-direction: column; background-color: var(--color-white); padding-bottom: 100px; }
.trainer-profile__header { display: flex; align-items: center; padding: 16px var(--side-margin); gap: 12px; }
.trainer-profile__back { flex-shrink: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; border-radius: 50%; }
.trainer-profile__back:active { background-color: var(--color-gray-100); }
.trainer-profile__progress { flex: 1; padding-right: 40px; }
.trainer-profile__content { flex: 1; padding: 16px var(--side-margin) 0; display: flex; flex-direction: column; gap: 28px; }
.trainer-profile__intro { display: flex; flex-direction: column; gap: 8px; }
.trainer-profile__title { font-size: var(--fs-display); font-weight: var(--fw-display); color: var(--color-gray-900); line-height: 1.4; margin: 0; }
.trainer-profile__subtitle { font-size: var(--fs-body2); color: var(--color-gray-600); line-height: 1.6; margin: 0; }
.trainer-profile__photo-wrap { position: relative; width: 100px; height: 100px; align-self: center; }
.trainer-profile__photo { width: 100px; height: 100px; border-radius: 50%; border: 2px dashed var(--color-gray-200); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background-color: var(--color-gray-100); }
.trainer-profile__photo-label { font-size: var(--fs-caption); color: var(--color-gray-600); }
.trainer-profile__photo-edit { position: absolute; bottom: 0; right: 0; width: 28px; height: 28px; border-radius: 50%; background-color: var(--color-white); border: 1.5px solid var(--color-gray-200); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--shadow-card); }
.trainer-profile__field { display: flex; flex-direction: column; gap: 10px; }
.trainer-profile__label { font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900); }
.trainer-profile__chips { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.spec-chip { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 16px; background-color: var(--color-white); border: 1.5px solid var(--color-gray-200); border-radius: var(--radius-medium); cursor: pointer; text-align: left; font-family: inherit; transition: border-color 0.15s, background-color 0.15s; }
.spec-chip--selected { border-color: var(--color-blue-primary); background-color: var(--color-blue-light); color: var(--color-blue-primary); }
.spec-chip__icon { display: flex; color: var(--color-gray-600); }
.spec-chip--selected .spec-chip__icon { color: var(--color-blue-primary); }
.spec-chip__label { font-size: var(--fs-body2); font-weight: var(--fw-body1-bold); color: var(--color-gray-900); }
.spec-chip--selected .spec-chip__label { color: var(--color-blue-primary); }
.trainer-profile__footer { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: var(--app-max-width); padding: 16px var(--side-margin); background-color: var(--color-white); border-top: 1px solid var(--color-gray-200); }
</style>
