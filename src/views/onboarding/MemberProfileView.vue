<template>
  <div class="member-profile">
    <div class="member-profile__nav">
      <button class="member-profile__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="member-profile__nav-title">프로필 입력</h2>
      <div style="width: 40px;" />
    </div>
    <div class="member-profile__content">
      <div class="member-profile__photo-wrap">
        <div class="member-profile__photo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="#999999" stroke-width="1.5"/><path d="M3 9C3 7.89543 3.89543 7 5 7H6.5L8 5H16L17.5 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" stroke="#999999" stroke-width="1.5"/></svg>
        </div>
        <button class="member-profile__photo-edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 19V12" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5L21.5 5.5L12 15L9 15L9 12L18.5 2.5Z" stroke="#007AFF" stroke-width="2" stroke-linejoin="round"/></svg>
        </button>
        <p class="member-profile__photo-label">프로필 사진 등록</p>
      </div>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">기본 정보</h3>
        <div class="member-profile__fields">
          <div class="member-profile__field">
            <label class="member-profile__label">이름</label>
            <AppInput v-model="form.name" placeholder="홍길동" />
          </div>
          <div class="member-profile__field">
            <label class="member-profile__label">연락처</label>
            <AppInput v-model="form.phone" placeholder="010-0000-0000" type="tel" />
          </div>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">신체 정보</h3>
        <div class="member-profile__body-row">
          <div class="member-profile__body-field">
            <label class="member-profile__label">나이</label>
            <div class="body-input-wrap"><input class="body-input" type="number" v-model="form.age" placeholder="0" /><span class="body-input__unit">세</span></div>
          </div>
          <div class="member-profile__body-field">
            <label class="member-profile__label">키</label>
            <div class="body-input-wrap"><input class="body-input" type="number" v-model="form.height" placeholder="0" /><span class="body-input__unit">cm</span></div>
          </div>
          <div class="member-profile__body-field">
            <label class="member-profile__label">몸무게</label>
            <div class="body-input-wrap"><input class="body-input" type="number" v-model="form.weight" placeholder="0" /><span class="body-input__unit">kg</span></div>
          </div>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">운동 목표</h3>
        <div class="member-profile__chips">
          <button v-for="goal in goals" :key="goal.id" class="goal-chip" :class="{ 'goal-chip--selected': selectedGoals.includes(goal.id) }" @click="toggleGoal(goal.id)">{{ goal.label }}</button>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">부상 및 특이사항</h3>
        <textarea class="member-profile__textarea" v-model="form.notes" placeholder="허리 디스크, 관절 통증 등 주의해야 할 사항을 입력해주세요." rows="4" />
      </section>
      <div style="height: 100px;" />
    </div>
    <div class="member-profile__footer">
      <AppButton @click="router.push('/search')">작성 완료 ✓</AppButton>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppInput from '@/components/AppInput.vue'
import AppButton from '@/components/AppButton.vue'
const router = useRouter()
const form = ref({ name: '', phone: '', age: '', height: '', weight: '', notes: '' })
const goals = [
  { id: 'weight-loss', label: '체중 감량' },
  { id: 'muscle-gain', label: '근력 증가' },
  { id: 'endurance', label: '체력 증진' },
  { id: 'body-profile', label: '바디 프로필' },
]
const selectedGoals = ref([])
function toggleGoal(id) {
  const idx = selectedGoals.value.indexOf(id)
  if (idx === -1) selectedGoals.value.push(id)
  else selectedGoals.value.splice(idx, 1)
}
</script>
<style scoped>
.member-profile { min-height: 100vh; display: flex; flex-direction: column; background-color: var(--color-white); }
.member-profile__nav { display: flex; align-items: center; justify-content: space-between; padding: 16px var(--side-margin); border-bottom: 1px solid var(--color-gray-200); }
.member-profile__back { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; border-radius: 50%; }
.member-profile__back:active { background-color: var(--color-gray-100); }
.member-profile__nav-title { font-size: var(--fs-title); font-weight: var(--fw-title); color: var(--color-gray-900); margin: 0; }
.member-profile__content { flex: 1; padding: 24px var(--side-margin) 0; display: flex; flex-direction: column; gap: 28px; overflow-y: auto; }
.member-profile__photo-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; align-self: center; }
.member-profile__photo { width: 88px; height: 88px; border-radius: 50%; background-color: var(--color-gray-100); border: 2px dashed var(--color-gray-200); display: flex; align-items: center; justify-content: center; }
.member-profile__photo-edit { position: absolute; bottom: 24px; right: -4px; width: 28px; height: 28px; border-radius: 50%; background-color: var(--color-white); border: 1.5px solid var(--color-gray-200); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--shadow-card); }
.member-profile__photo-label { font-size: var(--fs-caption); color: var(--color-gray-600); margin: 0; }
.member-profile__section { display: flex; flex-direction: column; gap: 12px; }
.member-profile__section-title { font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900); margin: 0; }
.member-profile__fields { display: flex; flex-direction: column; gap: 10px; }
.member-profile__field { display: flex; flex-direction: column; gap: 6px; }
.member-profile__label { font-size: var(--fs-body2); color: var(--color-gray-600); }
.member-profile__body-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.member-profile__body-field { display: flex; flex-direction: column; gap: 6px; }
.body-input-wrap { position: relative; display: flex; align-items: center; }
.body-input { width: 100%; background-color: var(--color-gray-100); border: none; border-radius: var(--radius-medium); padding: var(--input-padding-v) 32px var(--input-padding-v) var(--input-padding-h); font-size: var(--fs-body2); color: var(--color-gray-900); outline: none; font-family: inherit; }
.body-input:focus { box-shadow: 0 0 0 2px var(--color-blue-primary); }
.body-input__unit { position: absolute; right: 10px; font-size: var(--fs-caption); color: var(--color-gray-600); pointer-events: none; }
.member-profile__chips { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.goal-chip { padding: 14px 16px; background-color: var(--color-white); border: 1.5px solid var(--color-gray-200); border-radius: var(--radius-medium); font-size: var(--fs-body2); font-weight: var(--fw-body1-bold); color: var(--color-gray-900); cursor: pointer; text-align: center; font-family: inherit; transition: border-color 0.15s, background-color 0.15s; }
.goal-chip--selected { border-color: var(--color-blue-primary); background-color: var(--color-blue-light); color: var(--color-blue-primary); }
.member-profile__textarea { width: 100%; background-color: var(--color-gray-100); border: none; border-radius: var(--radius-medium); padding: var(--input-padding-v) var(--input-padding-h); font-size: var(--fs-body2); color: var(--color-gray-900); outline: none; resize: none; font-family: inherit; line-height: 1.6; }
.member-profile__textarea::placeholder { color: var(--color-gray-600); }
.member-profile__textarea:focus { box-shadow: 0 0 0 2px var(--color-blue-primary); }
.member-profile__footer { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: var(--app-max-width); padding: 16px var(--side-margin); background-color: var(--color-white); border-top: 1px solid var(--color-gray-200); }
</style>
