<!-- 회원용 운동 상세 뷰 — 날짜별 배정된 운동 확인 -->
<template>
  <div class="workout-detail">

    <!-- ── Header ── -->
    <div class="workout-detail__header">
      <button class="workout-detail__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="workout-detail__title">오늘의 운동</h1>
      <div class="workout-detail__header-spacer" />
    </div>

    <!-- ── Body ── -->
    <div class="workout-detail__body">

      <div v-if="hasActiveConnection === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 8px;">
        <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">트레이너와 연결되지 않았습니다</p>
        <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">트레이너를 찾아 연결해보세요</p>
      </div>

      <div v-else-if="hasActiveConnection === null" style="padding: 60px 20px;">
        <AppSkeleton type="rect" width="100%" height="80px" :count="3" />
      </div>

      <template v-else>

      <!-- 날짜 네비게이션 -->
      <div class="workout-detail__date-nav">
        <button
          class="workout-detail__date-arrow"
          :disabled="!prevDate"
          @click="prevDate && goToDate(prevDate)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="workout-detail__date-label">{{ formatDate(selectedDate) }}</span>
        <button
          class="workout-detail__date-arrow"
          :disabled="!nextDate"
          @click="nextDate && goToDate(nextDate)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="workout-detail__loading">
        <AppSkeleton type="rect" width="100%" height="80px" :count="3" />
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!currentPlan || !currentPlan.exercises || currentPlan.exercises.length === 0" class="workout-detail__empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.6"/>
          <path d="M3 9H21" stroke="currentColor" stroke-width="1.6"/>
          <path d="M8 2V6M16 2V6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M8 14H11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <p class="workout-detail__empty-text">배정된 운동이 없습니다</p>
      </div>

      <!-- 운동 카드 리스트 -->
      <div v-else class="workout-detail__exercise-list">
        <div
          v-for="(exercise, index) in currentPlan.exercises"
          :key="index"
          class="workout-detail__exercise-card"
        >
          <div class="workout-detail__exercise-name">{{ exercise.name }}</div>
          <div class="workout-detail__exercise-info">{{ exercise.sets }}세트 × {{ exercise.reps }}회</div>
          <div v-if="exercise.memo" class="workout-detail__exercise-memo">메모: {{ exercise.memo }}</div>
        </div>
      </div>

      <!-- 하단 스페이서 -->
      <div style="height: 32px;" />
      </template>
    </div>

    <AppToast v-model="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { useReservations } from '@/composables/useReservations'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppToast from '@/components/AppToast.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const { workoutPlans, currentPlan, loading, fetchWorkoutPlan, fetchWorkoutPlans, error } = useWorkoutPlans()
const { checkTrainerConnection } = useReservations()
const { showToast, toastMessage, toastType, showError } = useToast()
const hasActiveConnection = ref(null)

watch(error, (val) => {
  if (val) showError(val)
})

const selectedDate = ref(route.query.date || new Date().toISOString().split('T')[0])

const sortedDates = computed(() =>
  workoutPlans.value.map(p => p.date).sort()
)

const prevDate = computed(() => {
  const idx = sortedDates.value.indexOf(selectedDate.value)
  if (idx <= 0) return null
  return sortedDates.value[idx - 1]
})

const nextDate = computed(() => {
  const idx = sortedDates.value.indexOf(selectedDate.value)
  if (idx === -1 || idx >= sortedDates.value.length - 1) return null
  return sortedDates.value[idx + 1]
})

async function goToDate(date) {
  selectedDate.value = date
  await fetchWorkoutPlan(auth.user.id, date)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

onMounted(async () => {
  const connected = await checkTrainerConnection()
  hasActiveConnection.value = connected
  if (!connected) {
    return
  }
  await fetchWorkoutPlans(auth.user.id)
  await fetchWorkoutPlan(auth.user.id, selectedDate.value)
})
</script>

<style src="./MemberWorkoutDetailView.css" scoped></style>
