<!-- 회원 운동 매뉴얼 목록 — 트레이너가 등록한 매뉴얼을 읽기 전용으로 열람 -->
<template>
  <div class="manual-list">

    <!-- ── Header ── -->
    <header class="manual-list__header">
      <h1 class="manual-list__header-title">운동 매뉴얼</h1>
    </header>

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
          placeholder="매뉴얼 검색"
        />
        <button
          v-if="searchQuery"
          class="manual-list__search-clear"
          @click="searchQuery = ''"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Category Tabs ── -->
    <div class="manual-list__categories">
      <button
        v-for="cat in categories"
        :key="cat.value"
        class="manual-list__chip"
        :class="{ 'manual-list__chip--active': selectedCategory === cat.value }"
        @click="selectedCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="manual-list__state">
      <AppSkeleton type="rect" width="100%" height="80px" :count="3" />
    </div>

    <!-- ── Card Grid ── -->
    <div v-else class="manual-list__grid">

      <template v-if="filteredManuals.length > 0">
        <div
          v-for="manual in filteredManuals"
          :key="manual.id"
          class="manual-list__card"
          @click="router.push({ name: 'member-manual-detail', params: { id: manual.id } })"
        >
          <!-- Thumbnail -->
          <div class="manual-list__card-thumb">
            <img
              v-if="getThumbUrl(manual)"
              :src="getThumbUrl(manual)"
              :alt="manual.title"
              class="manual-list__card-thumb-img"
            />
            <div v-else class="manual-list__card-thumb-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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
              <span class="manual-list__card-level">{{ manual.trainer?.name || '트레이너' }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- ── Empty State ── -->
      <div v-else class="manual-list__empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
        <p>등록된 매뉴얼이 없습니다</p>
      </div>

    </div>

    <!-- ── Bottom nav spacer ── -->
    <div style="height: calc(var(--nav-height) + 16px);" />


  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useManuals } from '@/composables/useManuals'
import { useToast } from '@/composables/useToast'
import { getYoutubeThumbnailUrl } from '@/utils/youtube'
import AppSkeleton from '@/components/AppSkeleton.vue'

const router = useRouter()
const { manuals, loading, fetchManuals, error } = useManuals()
const { showToast, showError, showSuccess } = useToast()

const searchQuery = ref('')
const selectedCategory = ref('전체')

const categories = [
  { label: '전체', value: '전체' },
  { label: '재활', value: '재활' },
  { label: '근력', value: '근력' },
  { label: '다이어트', value: '다이어트' },
  { label: '스포츠', value: '스포츠' },
  { label: '코어', value: '코어' },
  { label: '유연성', value: '유연성' },
]

function getThumbUrl(manual) {
  if (!manual.media || manual.media.length === 0) {
    return getYoutubeThumbnailUrl(manual.youtube_url)
  }
  const img = manual.media.find(m => m.file_type?.startsWith('image/'))
  return img?.file_url || getYoutubeThumbnailUrl(manual.youtube_url)
}

const filteredManuals = computed(() => {
  let result = manuals.value
  if (selectedCategory.value !== '전체') {
    result = result.filter(m => m.category === selectedCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(m => m.title.toLowerCase().includes(q))
  }
  return result
})

watch(error, (val) => {
  if (val) showError(val)
})

onMounted(() => {
  fetchManuals()
})
</script>

<style src="./MemberManualView.css" scoped></style>
