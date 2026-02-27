<template>
  <div class="member-profile">
    <div class="member-profile__nav">
      <button class="member-profile__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="member-profile__nav-title">프로필 입력</h2>
      <div style="width: 40px" />
    </div>
    <div class="member-profile__content">
      <div class="member-profile__photo-wrap">
        <div class="member-profile__photo">
          <img src="@/assets/icons/person.svg" alt="avatar" width="32" height="32" />
        </div>
        <button class="member-profile__photo-edit">
          <img src="@/assets/icons/pencil.svg" alt="edit" width="14" height="14" />
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
            <AppInput
              v-model="form.phone"
              placeholder="010-0000-0000"
              type="tel"
            />
          </div>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">신체 정보</h3>
        <div class="member-profile__body-row">
          <div class="member-profile__body-field">
            <label class="member-profile__label">나이</label>
            <div class="body-input-wrap">
              <input
                class="body-input"
                type="number"
                v-model="form.age"
                placeholder="0"
              /><span class="body-input__unit">세</span>
            </div>
          </div>
          <div class="member-profile__body-field">
            <label class="member-profile__label">키</label>
            <div class="body-input-wrap">
              <input
                class="body-input"
                type="number"
                v-model="form.height"
                placeholder="0"
              /><span class="body-input__unit">cm</span>
            </div>
          </div>
          <div class="member-profile__body-field">
            <label class="member-profile__label">몸무게</label>
            <div class="body-input-wrap">
              <input
                class="body-input"
                type="number"
                v-model="form.weight"
                placeholder="0"
              /><span class="body-input__unit">kg</span>
            </div>
          </div>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">운동 목표</h3>
        <div class="member-profile__chips">
          <button
            v-for="goal in goals"
            :key="goal.id"
            class="goal-chip"
            :class="{ 'goal-chip--selected': selectedGoals.includes(goal.id) }"
            @click="toggleGoal(goal.id)"
          >
            {{ goal.label }}
          </button>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">부상 및 특이사항</h3>
        <textarea
          class="member-profile__textarea"
          v-model="form.notes"
          placeholder="허리 디스크, 관절 통증 등 주의해야 할 사항을 입력해주세요."
          rows="4"
        />
      </section>
      <div style="height: 100px" />
    </div>
    <div class="member-profile__footer">
      <AppButton @click="handleComplete">작성 완료 ✓</AppButton>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import AppInput from "@/components/AppInput.vue";
import AppButton from "@/components/AppButton.vue";
const router = useRouter();
const route = useRoute();
const form = ref({
  name: "",
  phone: "",
  age: "",
  height: "",
  weight: "",
  notes: "",
});
const goals = [
  { id: "weight-loss", label: "체중 감량" },
  { id: "muscle-gain", label: "근력 증가" },
  { id: "endurance", label: "체력 증진" },
  { id: "body-profile", label: "바디 프로필" },
];
const selectedGoals = ref([]);
function toggleGoal(id) {
  const idx = selectedGoals.value.indexOf(id);
  if (idx === -1) selectedGoals.value.push(id);
  else selectedGoals.value.splice(idx, 1);
}

function handleComplete() {
  if (route.query.fromInvite === "true") {
    router.push("/home");
  } else {
    router.push("/search");
  }
}
</script>
<style src="./MemberProfileView.css" scoped></style>
