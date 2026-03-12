<!-- 트레이너 검색 페이지 (회원용). 트레이너 검색 + 연결 요청 -->
<template>
  <div class="trainer-search">
    <div class="trainer-search__header">
      <button class="trainer-search__back" @click="router.back()" style="color: var(--color-gray-900);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="trainer-search__title">PT 트레이너 찾기</h2>
      <button class="trainer-search__filter">
        <img src="@/assets/icons/filter.svg" alt="filter" width="24" height="24" />
      </button>
    </div>
    <div class="trainer-search__search-wrap">
      <div class="trainer-search__search">
        <img src="@/assets/icons/search.svg" alt="search" width="18" height="18" />
        <input class="trainer-search__input" type="text" v-model="searchQuery" @input="handleSearchChange" placeholder="이름 검색" />
      </div>
    </div>
     <div class="trainer-search__list">
       <template v-if="loading">
         <AppSkeleton type="rect" height="170px" borderRadius="var(--radius-large)" :count="3" />
       </template>
       <div v-else-if="trainers.length === 0" style="padding: var(--side-margin); text-align: center; color: var(--color-gray-600);">
         검색 결과가 없습니다.
       </div>
       <template v-else>
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
            <div v-if="trainer.pending" class="trainer-card__badge trainer-card__badge--pending">
              요청 중
            </div>
            <div v-else-if="trainer.connected" class="trainer-card__badge trainer-card__badge--connected">
              연결됨
            </div>
            <button
              v-else
              class="trainer-card__btn trainer-card__btn--primary"
              :disabled="requestingId === trainer.id"
              @click="handleRequestConnection(trainer.id)"
            >
              {{ requestingId === trainer.id ? '요청 중...' : '연결 요청' }}
              <svg v-if="requestingId !== trainer.id" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
         </div>
       </template>
     </div>
     <div v-if="error" style="padding: 16px; margin: 16px; background-color: var(--color-red); color: var(--color-white); border-radius: var(--radius-medium); font-size: var(--fs-caption); text-align: center;">
       {{ error }}
     </div>
    <div style="height: calc(var(--nav-height) + 16px);" />
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTrainerSearch } from '@/composables/useTrainerSearch'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/AppSkeleton.vue'

const router = useRouter()
const searchQuery = ref('')
const requestingId = ref(null)

const { trainers, loading, error, searchTrainers, requestConnection } = useTrainerSearch()
const { showToast } = useToast()

/** 검색 쿼리 변경 시 debounce 적용하여 검색 */
let searchTimeout
function handleSearchChange() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchTrainers(searchQuery.value)
  }, 300)
}

/** 연결 요청 버튼 클릭 */
async function handleRequestConnection(trainerId) {
  requestingId.value = trainerId
  try {
    const success = await requestConnection(trainerId)
    if (success) {
      // 성공 시 목록 새로고침
      await searchTrainers(searchQuery.value)
    }
  } finally {
    requestingId.value = null
  }
}

/** 초기 로드: 모든 트레이너 목록 */
onMounted(() => {
  searchTrainers()
})

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>
<style src="./TrainerSearchView.css" scoped></style>
