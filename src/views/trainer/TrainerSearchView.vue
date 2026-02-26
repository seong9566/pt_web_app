<template>
  <div class="trainer-search">
    <div class="trainer-search__header">
      <button class="trainer-search__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="trainer-search__title">PT 트레이너 찾기</h2>
      <button class="trainer-search__filter">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 6H21M7 12H17M11 18H13" stroke="#111111" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="trainer-search__search-wrap">
      <div class="trainer-search__search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#007AFF" stroke-width="1.8"/><path d="M16.5 16.5L21 21" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round"/></svg>
        <input class="trainer-search__input" type="text" v-model="searchQuery" placeholder="이름 검색" />
      </div>
    </div>
    <div class="trainer-search__list">
      <div v-for="trainer in trainers" :key="trainer.id" class="trainer-card">
        <div class="trainer-card__img">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#CCCCCC"/><path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="#CCCCCC" stroke-width="2" stroke-linecap="round"/></svg>
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
<style scoped>
.trainer-search { min-height: 100vh; background-color: var(--color-white); display: flex; flex-direction: column; }
.trainer-search__header { display: flex; align-items: center; justify-content: space-between; padding: 16px var(--side-margin); border-bottom: 1px solid var(--color-gray-200); }
.trainer-search__back, .trainer-search__filter { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; border-radius: 50%; }
.trainer-search__back:active, .trainer-search__filter:active { background-color: var(--color-gray-100); }
.trainer-search__title { font-size: var(--fs-title); font-weight: var(--fw-title); color: var(--color-gray-900); margin: 0; }
.trainer-search__search-wrap { padding: 16px var(--side-margin); }
.trainer-search__search { display: flex; align-items: center; gap: 10px; background-color: var(--color-gray-100); border-radius: 100px; padding: 12px 16px; }
.trainer-search__input { flex: 1; background: none; border: none; outline: none; font-size: var(--fs-body1); color: var(--color-gray-900); font-family: inherit; }
.trainer-search__input::placeholder { color: var(--color-gray-600); }
.trainer-search__list { flex: 1; padding: 0 var(--side-margin); display: flex; flex-direction: column; gap: 12px; }
.trainer-card { background-color: var(--color-white); border-radius: var(--radius-large); box-shadow: var(--shadow-card); border: 1px solid var(--color-gray-200); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.trainer-card__img { width: 64px; height: 64px; border-radius: var(--radius-medium); background-color: var(--color-gray-100); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.trainer-card__info { display: flex; flex-direction: column; gap: 8px; }
.trainer-card__name { font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900); margin: 0; }
.trainer-card__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.trainer-card__tag { font-size: var(--fs-caption); color: var(--color-blue-primary); background-color: var(--color-blue-light); padding: 4px 10px; border-radius: var(--radius-small); font-weight: 500; }
.trainer-card__btn { width: 100%; height: 44px; border-radius: var(--radius-medium); font-size: var(--fs-body2); font-weight: var(--fw-body1-bold); display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; font-family: inherit; }
.trainer-card__btn--primary { background-color: var(--color-blue-primary); color: var(--color-white); border: none; }
.trainer-card__btn--outline { background-color: var(--color-white); color: var(--color-gray-900); border: 1.5px solid var(--color-gray-200); }
.trainer-card__btn:active { opacity: 0.8; }
</style>
