<!-- 회원 본인의 메모 목록 (읽기 전용) -->
<template>
  <div class="member-memo">

    <!-- ── Header ── -->
    <div class="member-memo__header">
      <button class="member-memo__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="member-memo__title">내 메모</h1>
      <div style="width: 40px;" />
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="member-memo__error">{{ error }}</div>

    <div class="member-memo__body">

      <!-- 로딩 상태 -->
      <div v-if="loading" class="member-memo__loading">
        로딩 중...
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

    </div>

    <div style="height: calc(var(--nav-height) + 16px);" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMemos } from '@/composables/useMemos'

const router = useRouter()
const { memos, loading, error, getMemberMemos } = useMemos()

onMounted(async () => {
  await getMemberMemos()
})
</script>

<style src="./MemberMemoView.css" scoped></style>
