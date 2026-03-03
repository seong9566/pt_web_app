<!-- [미구현] 트레이너 매뉴얼 관리 페이지. 매뉴얼 리스트/필터/검색 (목 데이터) -->
<template>
  <div class="manual-list">

    <!-- ── Header ── -->
    <div class="manual-list__header">
      <button class="manual-list__header-btn" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="manual-list__header-title">운동 매뉴얼 목록</h1>
      <button class="manual-list__header-btn" @click="handleMore">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5"  r="1.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <!-- ── Search ── -->
    <div class="manual-list__search-wrap">
      <div class="manual-list__search">
        <svg class="manual-list__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
          <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchQuery"
          class="manual-list__search-input"
          type="text"
          placeholder="운동 이름 검색"
        />
        <button v-if="searchQuery" class="manual-list__search-clear" @click="searchQuery = ''">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Category Chips ── -->
    <div class="manual-list__categories">
      <button
        v-for="cat in categories"
        :key="cat"
        class="manual-list__chip"
        :class="{ 'manual-list__chip--active': selectedCategory === cat }"
        @click="selectedCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- ── Grid ── -->
    <div class="manual-list__grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="manual-list__card"
        @click="handleCardClick(item)"
      >
        <div class="manual-list__card-thumb" :style="{ background: item.gradient }">
          <span class="manual-list__card-badge">{{ item.category }}</span>
        </div>
        <div class="manual-list__card-body">
          <p class="manual-list__card-title">{{ item.title }}</p>
          <div class="manual-list__card-meta">
            <span class="manual-list__card-duration">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                <path d="M12 7V12L15 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ item.duration }}{{ item.unit }}
            </span>
            <span class="manual-list__card-dot">•</span>
            <span class="manual-list__card-level">{{ item.difficulty }}</span>
          </div>
        </div>
      </div>

      <!-- 검색 결과 없을 때 -->
      <div v-if="filteredItems.length === 0" class="manual-list__empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>검색 결과가 없습니다</p>
      </div>
    </div>

    <div style="height: 100px;" />

    <!-- ── FAB ── -->
    <button class="manual-list__fab" @click="handleAdd">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      매뉴얼 추가
    </button>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── 검색 / 필터 ──
const searchQuery     = ref('')
const selectedCategory = ref('전체')

const categories = ['전체', '재활', '근력', '다이어트', '스포츠', '코어', '유연성']

// ── Mock 데이터 ──
const manuals = ref([
  {
    id: 1,
    title: '허리 재활 운동',
    category: '재활',
    duration: 15,
    unit: '분',
    difficulty: '초급',
    gradient: 'linear-gradient(145deg, #c9a97a 0%, #a07850 45%, #7a5c38 100%)',
  },
  {
    id: 2,
    title: '전신 파워 루틴',
    category: '근력',
    duration: 45,
    unit: '분',
    difficulty: '고급',
    gradient: 'linear-gradient(145deg, #3a4a5c 0%, #2c3a4a 50%, #1e2d3d 100%)',
  },
  {
    id: 3,
    title: 'HIIT 유산소 폭발',
    category: '스포츠',
    duration: 20,
    unit: '분',
    difficulty: '중급',
    gradient: 'linear-gradient(145deg, #5aaee8 0%, #3a8dcf 45%, #1a6ab0 100%)',
  },
  {
    id: 4,
    title: '케토 식단 플랜',
    category: '다이어트',
    duration: 4,
    unit: '주',
    difficulty: '영양',
    gradient: 'linear-gradient(145deg, #5aaa5a 0%, #3a8a3a 45%, #2a6e2a 100%)',
  },
  {
    id: 5,
    title: '어깨 가동성 훈련',
    category: '재활',
    duration: 10,
    unit: '분',
    difficulty: '쉬움',
    gradient: 'linear-gradient(145deg, #e8d5b8 0%, #c8b898 50%, #a89878 100%)',
  },
  {
    id: 6,
    title: '코어 강화 운동',
    category: '코어',
    duration: 30,
    unit: '분',
    difficulty: '중급',
    gradient: 'linear-gradient(145deg, #2e3a4e 0%, #1e2c3e 50%, #12202e 100%)',
  },
  {
    id: 7,
    title: '스쿼트 심화 과정',
    category: '근력',
    duration: 35,
    unit: '분',
    difficulty: '중급',
    gradient: 'linear-gradient(145deg, #5c4a3a 0%, #4a3828 50%, #38281a 100%)',
  },
  {
    id: 8,
    title: '전신 유연성 스트레칭',
    category: '유연성',
    duration: 25,
    unit: '분',
    difficulty: '초급',
    gradient: 'linear-gradient(145deg, #a8c8e8 0%, #88a8c8 50%, #6888a8 100%)',
  },
])

// ── 필터 로직 ──
const filteredItems = computed(() => {
  return manuals.value.filter(item => {
    const matchCategory =
      selectedCategory.value === '전체' || item.category === selectedCategory.value
    const matchSearch =
      !searchQuery.value || item.title.includes(searchQuery.value)
    return matchCategory && matchSearch
  })
})

// ── 핸들러 ──
function handleCardClick(item) {
  alert(`준비 중입니다: ${item.title}`)
}

function handleAdd() {
  router.push({ name: 'trainer-manual-register' })
}

function handleMore() {
  alert('준비 중입니다')
}
</script>

<style src="./TrainerManualView.css" scoped></style>
