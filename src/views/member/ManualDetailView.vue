<!-- 매뉴얼 상세 보기 — 제목, 설명, 트레이너 정보, 미디어 갤러리, 유튜브 임베드 -->
<template>
  <div class="manual-detail">

    <!-- ── 삭제 확인 Dialog ── -->
    <AppBottomSheet v-model="showDeleteDialog" title="매뉴얼 삭제">
      <div class="detail-delete-dialog">
        <p class="detail-delete-dialog__text">
          <strong>{{ manual?.title }}</strong> 매뉴얼을 삭제하시겠습니까?
        </p>
        <div class="detail-delete-dialog__actions">
          <button class="detail-delete-dialog__btn detail-delete-dialog__btn--cancel" @click="showDeleteDialog = false">취소</button>
          <button class="detail-delete-dialog__btn detail-delete-dialog__btn--confirm" @click="confirmDelete">삭제</button>
        </div>
      </div>
    </AppBottomSheet>

    <!-- Loading -->
    <div v-if="loading" class="manual-detail__loading">
      <AppSkeleton type="rect" width="100%" height="180px" />
      <div style="display: flex; align-items: flex-start; gap: var(--spacing-item); width: 100%;">
        <AppSkeleton type="circle" width="64px" height="64px" />
        <div style="flex: 1;">
          <AppSkeleton type="line" :count="3" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="manual-detail__fallback">
      <button class="manual-detail__back manual-detail__back--dark" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <p class="manual-detail__fallback-text">{{ error }}</p>
    </div>

    <!-- Not found -->
    <template v-else-if="!manual">
      <div class="manual-detail__fallback">
        <button class="manual-detail__back manual-detail__back--dark" @click="router.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <p class="manual-detail__fallback-text">매뉴얼을 찾을 수 없습니다</p>
      </div>
    </template>

    <!-- Main content -->
    <template v-else>

      <!-- Hero -->
      <div class="manual-detail__hero">
        <img
          v-if="heroPhotoUrl"
          :src="heroPhotoUrl"
          :alt="manual.title"
          class="manual-detail__hero-img"
        />
        <div v-else class="manual-detail__hero-placeholder" />
        <div class="manual-detail__hero-overlay" />
        <button class="manual-detail__back-btn" @click="router.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="manual-detail__hero-bottom">
          <span v-if="manual.category" class="manual-detail__badge">{{ manual.category }}</span>
          <h1 class="manual-detail__title">{{ manual.title }}</h1>
        </div>
      </div>

      <!-- Body -->
      <div class="manual-detail__body">

        <!-- Trainer meta -->
        <div class="manual-detail__trainer">
          <img
            v-if="manual.trainer?.photo_url"
            :src="manual.trainer.photo_url"
            :alt="manual.trainer?.name"
            class="manual-detail__trainer-avatar"
          />
          <img
            v-else
            :src="personIcon"
            alt="트레이너"
            class="manual-detail__trainer-avatar manual-detail__trainer-avatar--placeholder"
          />
          <span class="manual-detail__trainer-name">{{ manual.trainer?.name || '-' }}</span>
        </div>

        <!-- 설명 -->
        <section class="manual-detail__section">
          <h2 class="manual-detail__section-title">설명</h2>
          <p class="manual-detail__desc">{{ manual.description }}</p>
        </section>

        <!-- 미디어 갤러리 -->
        <section v-if="visibleMedia.length > 0" class="manual-detail__section">
          <h2 class="manual-detail__section-title">미디어</h2>
          <div class="manual-detail__media-grid">
            <div
              v-for="(item, idx) in visibleMedia"
              :key="item.id || idx"
              class="manual-detail__media-box"
            >
              <video
                v-if="item.file_type?.startsWith('video/')"
                controls
                :src="item.file_url"
                class="manual-detail__media-video"
              />
              <img v-else :src="item.file_url" :alt="manual.title" />
              <span class="manual-detail__media-type">
                {{ item.file_type?.startsWith('video/') ? '영상' : '사진' }}
              </span>
            </div>
          </div>
        </section>

        <!-- YouTube -->
        <section v-if="manual.youtube_url && youtubeVideoId" class="manual-detail__section">
          <h2 class="manual-detail__section-title">유튜브</h2>
          <div class="manual-detail__youtube-embed">
            <iframe
              :src="'https://www.youtube.com/embed/' + youtubeVideoId"
              frameborder="0"
              allowfullscreen
              class="manual-detail__youtube-iframe"
            />
          </div>
        </section>

        <div style="height: 96px;" />

      </div>

      <!-- ── 트레이너 전용 하단 액션 바 ── -->
      <div
        v-if="auth.user?.id === manual.trainer_id"
        class="manual-detail__action-bar"
      >
        <button
          class="manual-detail__action-bar-btn manual-detail__action-bar-btn--edit"
          @click="router.push({ name: 'trainer-manual-edit', params: { id: manual.id } })"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          수정
        </button>
        <button
          class="manual-detail__action-bar-btn manual-detail__action-bar-btn--delete"
          @click="showDeleteDialog = true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          삭제
        </button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useManuals } from '@/composables/useManuals'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { extractYoutubeVideoId } from '@/utils/youtube'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import personIcon from '@/assets/icons/person.svg'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const { currentManual: manual, loading, error, fetchManual, deleteManual } = useManuals()
const { showToast } = useToast()

const showDeleteDialog = ref(false)

const visibleMedia = computed(() => {
  if (!manual.value?.media) return []
  return manual.value.media.filter(m => m.sort_order !== -1)
})

const heroPhotoUrl = computed(() => {
  const sorted = [...visibleMedia.value].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const photo = sorted.find(m => !m.file_type?.startsWith('video/'))
  return photo?.file_url || null
})

const youtubeVideoId = computed(() => extractYoutubeVideoId(manual.value?.youtube_url))

async function confirmDelete() {
  showDeleteDialog.value = false
  const ok = await deleteManual(manual.value.id)
  if (ok) router.back()
}

onMounted(() => {
  fetchManual(route.params.id)
})

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./ManualDetailView.css" scoped></style>
