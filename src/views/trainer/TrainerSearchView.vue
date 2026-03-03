<!-- 트레이너 검색 페이지 (회원용). 트레이너 검색 + 연결 요청 -->
<template>
  <div class="trainer-search">
    <div class="trainer-search__header">
      <button class="trainer-search__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="trainer-search__title">PT 트레이너 찾기</h2>
      <button class="trainer-search__filter">
        <img src="@/assets/icons/filter.svg" alt="filter" width="24" height="24" />
      </button>
    </div>
    <div class="trainer-search__search-wrap">
      <div class="trainer-search__search">
        <img src="@/assets/icons/search.svg" alt="search" width="18" height="18" />
        <input class="trainer-search__input" type="text" v-model="searchQuery" placeholder="이름 검색" />
      </div>
    </div>
    <div class="trainer-search__list">
      <div v-for="trainer in trainers" :key="trainer.id" class="trainer-card">
        <div class="trainer-card__img">
          <img src="@/assets/icons/person.svg" alt="avatar" width="32" height="32" />
        </div>
        <div class="trainer-card__info">
          <p class="trainer-card__name">{{ trainer.name }}</p>
          <div class="trainer-card__tags">
            <span v-for="tag in trainer.specialties" :key="tag" class="trainer-card__tag">{{ tag }}</span>
          </div>
        </div>
        <button class="trainer-card__btn" :class="trainer.connected ? 'trainer-card__btn--outline' : 'trainer-card__btn--primary'">
          {{ trainer.connected ? '프로필 보기' : '연동 요청하기' }}
          <svg v-if="!trainer.connected" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
    <div style="height: calc(var(--nav-height) + 16px);" />
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const searchQuery = ref('')
const trainers = [
  { id: 1, name: '김민수 트레이너', specialties: ['근력 증가', '스포츠 퍼포먼스'], connected: false },
  { id: 2, name: '이지영 트레이너', specialties: ['다이어트/식단', '체력 증진'], connected: true },
  { id: 3, name: '박성훈 트레이너', specialties: ['재활/교정'], connected: false },
  { id: 4, name: '최유나 트레이너', specialties: ['근력 증가', '바디 프로필'], connected: false },
]
</script>
<style src="./TrainerSearchView.css" scoped></style>
