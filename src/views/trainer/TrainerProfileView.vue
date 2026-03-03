<!-- 트레이너 프로필 생성 (온보딩). 이름, 사진, 전문 분야 선택 → DB 저장 -->
<template>
  <div class="trainer-profile">
    <div class="trainer-profile__header">
      <button class="trainer-profile__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="trainer-profile__progress">
        <ProgressBar :current-step="2" :total-steps="2" />
      </div>
    </div>
    <div class="trainer-profile__content">
      <div class="trainer-profile__intro">
        <h1 class="trainer-profile__title">
          트레이너 프로필을<br />완성해 주세요
        </h1>
        <p class="trainer-profile__subtitle">
          회원들에게 보여질 프로필 사진과<br />전문 분야를 입력해 주세요.
        </p>
      </div>
      <div class="trainer-profile__photo-wrap">
        <div class="trainer-profile__photo">
          <img src="@/assets/icons/person.svg" alt="photo" width="32" height="32" />
          <span class="trainer-profile__photo-label">사진 등록</span>
        </div>
        <button class="trainer-profile__photo-edit">
          <img src="@/assets/icons/pencil.svg" alt="edit" width="14" height="14" />
        </button>
      </div>
      <div class="trainer-profile__field">
        <label class="trainer-profile__label">이름 (활동명)</label>
        <AppInput v-model="name" placeholder="예: 김헬스" />
      </div>
      <div class="trainer-profile__field">
        <label class="trainer-profile__label">전문 분야</label>
        <div class="trainer-profile__chips">
          <button
            v-for="spec in specialties"
            :key="spec.id"
            class="spec-chip"
            :class="{ 'spec-chip--selected': selectedSpecialties.includes(spec.id) }"
            @click="toggleSpecialty(spec.id)"
          >
            <img :src="spec.icon" class="spec-chip__icon" alt="" width="20" height="20" />
            <span class="spec-chip__label">{{ spec.label }}</span>
          </button>
        </div>
      </div>
    </div>
    <div class="trainer-profile__footer">
      <AppButton @click="router.push('/trainer/home')">완료 ✓</AppButton>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProgressBar from '@/components/ProgressBar.vue'
import AppButton from "@/components/AppButton.vue";
import AppInput from "@/components/AppInput.vue";

import rehabIcon from '@/assets/icons/medication.svg'
import strengthIcon from '@/assets/icons/trainer.svg'
import dietIcon from '@/assets/icons/food.svg'
import sportsIcon from '@/assets/icons/sports.svg'

const router = useRouter()
const name = ref("");

const specialties = [
  {
    id: 'rehab',
    label: '재활/교정',
    icon: rehabIcon,
  },
  {
    id: 'strength',
    label: '근력 증가',
    icon: strengthIcon,
  },
  {
    id: 'diet',
    label: '다이어트/식단',
    icon: dietIcon,
  },
  {
    id: 'sports',
    label: '스포츠 퍼포먼스',
    icon: sportsIcon,
  },
]

const selectedSpecialties = ref([])

const toggleSpecialty = (id) => {
  const index = selectedSpecialties.value.indexOf(id)
  if (index === -1) {
    selectedSpecialties.value.push(id)
  } else {
    selectedSpecialties.value.splice(index, 1)
  }
}
</script>
<style src="./TrainerProfileView.css" scoped></style>
