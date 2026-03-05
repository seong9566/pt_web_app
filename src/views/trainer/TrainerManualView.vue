<!-- 트레이너 운동 매뉴얼 목록 — 검색/카테고리 필터/FAB -->
<template>
  <div class="manual-list">

    <!-- ── Header ── -->
    <div class="manual-list__header">
      <h1 class="manual-list__header-title">운동 매뉴얼</h1>
    </div>

    <!-- ── Search ── -->
    <div class="manual-list__search-wrap">
      <div class="manual-list__search">
        <svg class="manual-list__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.8"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchQuery"
          class="manual-list__search-input"
          type="text"
          placeholder="매뉴얼 검색..."
        />
        <button v-if="searchQuery" class="manual-list__search-clear" @click="searchQuery = ''">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Category Tabs ── -->
    <div class="manual-list__categories">
      <button
        v-for="cat in CATEGORIES"
        :key="cat"
        class="manual-list__chip"
        :class="{ 'manual-list__chip--active': selectedCategory === cat }"
        @click="selectedCategory = cat"
      >{{ cat }}</button>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="manual-list__loading">
      <span>로딩 중...</span>
    </div>

    <!-- ── Grid ── -->
    <div v-else class="manual-list__grid">

      <!-- Empty state -->
      <div v-if="filteredManuals.length === 0" class="manual-list__empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
        <p>등록된 매뉴얼이 없습니다</p>
      </div>

      <!-- Manual cards -->
      <div
        v-for="manual in filteredManuals"
        :key="manual.id"
        class="manual-list__card"
        @click="goToDetail(manual.id)"
      >
        <!-- Thumbnail — fetchManuals has no media JOIN, always show placeholder -->
        <div class="manual-list__card-thumb">
          <div class="manual-list__card-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
          </div>
          <span v-if="manual.category" class="manual-list__card-badge">{{ manual.category }}</span>
        </div>

        <!-- Body -->
        <div class="manual-list__card-body">
          <p class="manual-list__card-title">{{ manual.title }}</p>
          <div class="manual-list__card-meta">
            <span class="manual-list__card-duration">{{ manual.trainer?.name }}</span>
            <span class="manual-list__card-dot">·</span>
            <span class="manual-list__card-level">{{ formatDate(manual.created_at) }}</span>
          </div>

          <!-- Edit / Delete — own manuals only -->
          <div
            v-if="manual.trainer_id === auth.user?.id"
            class="manual-list__card-actions"
            @click.stop
          >
            <button
              class="manual-list__card-action-btn"
              @click="goToDetail(manual.id)"
            >수정</button>
            <button
              class="manual-list__card-action-btn manual-list__card-action-btn--danger"
              @click="handleDelete(manual)"
            >삭제</button>
          </div>
        </div>
      </div>

    </div>

    <!-- Nav spacer -->
    <div style="height: calc(var(--nav-height) + 80px);" />

    <!-- ── FAB ── -->
    <button
      class="manual-list__fab"
      @click="router.push({ name: 'trainer-manual-register' })"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span>등록하기</span>
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useManuals } from '@/composables/useManuals'

const router = useRouter()
const auth = useAuthStore()
const { manuals, loading, fetchManuals, deleteManual } = useManuals()

const CATEGORIES = ['전체', '재활', '근력', '다이어트', '스포츠', '코어', '유연성']

const searchQuery = ref('')
const selectedCategory = ref('전체')

/** 카테고리 + 검색어 클라이언트 필터 */
const filteredManuals = computed(() => {
  let list = manuals.value

  if (selectedCategory.value !== '전체') {
    const sel = selectedCategory.value
    list = list.filter(m => {
      const cat = String(m.category ?? '')
      return cat === sel || cat.includes(sel)
    })
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(m => m.title?.toLowerCase().includes(q))
  }

  return list
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function goToDetail(id) {
  router.push({ name: 'trainer-manual-detail', params: { id } })
}

async function handleDelete(manual) {
  if (!confirm(`'${manual.title}' 매뉴얼을 삭제하시겠습니까?`)) return
  await deleteManual(manual.id)
}

onMounted(() => {
  fetchManuals()
})
</script>

<style src="./TrainerManualView.css" scoped></style>
