<!-- 회원 본인의 메모 목록 (읽기 전용) -->
<template>
  <div class="member-memo">

    <!-- ── Header ── -->
    <div class="member-memo__header">
      <button class="member-memo__back" @click="safeBack(route.path)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-900)">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="member-memo__title">내 메모</h1>
      <div style="width: 40px;" />
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="member-memo__error">{{ error }}</div>

    <div class="member-memo__body">

      <div v-if="hasActiveConnection === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 8px;">
        <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">트레이너와 연결되지 않았습니다</p>
        <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">트레이너를 찾아 연결해보세요</p>
      </div>

      <div v-else-if="hasActiveConnection === null" style="padding: 60px 20px;">
        <AppSkeleton type="rect" width="100%" height="80px" :count="3" />
      </div>

      <template v-else>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="member-memo__loading">
        <AppSkeleton type="rect" width="100%" height="80px" :count="3" />
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="memos.length === 0" class="memo-list__empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>작성된 메모가 없습니다</p>
      </div>

      <!-- 메모 목록 -->
      <div v-else class="memo-list">
        <div
          v-for="memo in memos"
          :key="memo.id"
          class="memo-card"
        >
          <!-- Date row -->
          <div class="memo-card__top">
            <div class="memo-card__date-wrap">
              <span class="memo-card__dot" :class="`memo-card__dot--${memo.dotColor}`" />
              <span class="memo-card__date">{{ memo.date }}</span>
            </div>
            <span class="memo-card__time">{{ memo.time }}</span>
          </div>

          <!-- Tags -->
          <div v-if="memo.tags && memo.tags.length" class="memo-card__tags">
            <span v-for="tag in memo.tags" :key="tag" class="memo-tag">{{ tag }}</span>
          </div>

          <!-- Content -->
          <p class="memo-card__text">{{ memo.content }}</p>
        </div>
      </div>
      </template>

    </div>

    <div class="nav-spacer" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { safeBack } from '@/utils/navigation'
import { useMemos } from '@/composables/useMemos'
import { useReservations } from '@/composables/useReservations'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/AppSkeleton.vue'

const router = useRouter()
const route = useRoute()
const { memos, loading, error, getMemberMemos } = useMemos()
const { checkTrainerConnection } = useReservations()
const { showToast } = useToast()
const hasActiveConnection = ref(null)

onMounted(async () => {
  const connected = await checkTrainerConnection()
  hasActiveConnection.value = connected
  if (!connected) {
    return
  }
  await getMemberMemos()
})

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./MemberMemoView.css" scoped></style>
