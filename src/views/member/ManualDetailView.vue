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
      <p class="manual-detail__loading-text">로딩 중...</p>
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
        <section v-if="manual.media && manual.media.length > 0" class="manual-detail__section">
          <h2 class="manual-detail__section-title">미디어</h2>
          <div class="manual-detail__media-grid">
            <div
              v-for="(item, idx) in manual.media"
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

        <!-- Trainer actions -->
        <div
          v-if="auth.user?.id === manual.trainer_id"
          class="manual-detail__actions"
        >
          <button
            class="manual-detail__action-btn manual-detail__action-btn--outline"
            @click="router.push({ name: 'trainer-manual-edit', params: { id: manual.id } })"
          >수정</button>
          <button
            class="manual-detail__action-btn manual-detail__action-btn--danger"
            @click="showDeleteDialog = true"
          >삭제</button>
        </div>

        <div style="height: 32px;" />

      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useManuals } from '@/composables/useManuals'
import { useAuthStore } from '@/stores/auth'
import { extractYoutubeVideoId } from '@/utils/youtube'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import personIcon from '@/assets/icons/person.svg'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const { currentManual: manual, loading, error, fetchManual, deleteManual } = useManuals()

const showDeleteDialog = ref(false)

const heroPhotoUrl = computed(() => {
  if (!manual.value?.media) return null
  const sorted = [...manual.value.media].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
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
</script>

<style src="./ManualDetailView.css" scoped></style>
