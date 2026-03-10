<template>
  <div class="today-workout">

    <!-- Header -->
    <div class="today-workout__header">
      <button class="today-workout__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="today-workout__title">오늘의 운동</h1>
      <div class="today-workout__header-spacer" />
    </div>

    <div v-if="hasActiveConnection === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 16px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="var(--color-gray-600)" stroke-width="1.6"/>
        <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M16 4L20 8M20 4L16 8" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">연결되지 않은 회원입니다</p>
      <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">회원 목록에서 연결된 회원을 선택해주세요</p>
      <button style="margin-top: 8px; padding: 14px 32px; background: var(--color-blue-primary); color: white; border: none; border-radius: var(--radius-medium); font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); cursor: pointer;" @click="router.back()">뒤로가기</button>
    </div>

    <div v-else-if="hasActiveConnection === null" style="display:flex;align-items:center;justify-content:center;padding:60px 20px;">
      <p style="color:var(--color-gray-600);font-size:var(--fs-body2);">불러오는 중...</p>
    </div>

    <div v-else class="today-workout__body">

      <!-- ① 회원 프로필 -->
      <section v-if="memberProfile" class="today-workout__profile">
        <div class="today-workout__profile-avatar">
          <img v-if="memberProfile.photo" :src="memberProfile.photo" :alt="memberProfile.name" class="today-workout__profile-avatar-img" />
          <span v-else class="today-workout__profile-avatar-initial">{{ memberProfile.name.charAt(0) }}</span>
        </div>
        <div class="today-workout__profile-info">
          <span class="today-workout__profile-name">{{ memberProfile.name }}</span>
          <span class="today-workout__profile-meta">
            <template v-if="memberProfile.age">{{ memberProfile.age }}세</template>
            <template v-if="memberProfile.age && memberProfile.gender"> · </template>
            <template v-if="memberProfile.gender">{{ memberProfile.gender }}</template>
            <template v-if="!memberProfile.age && !memberProfile.gender">정보 없음</template>
          </span>
        </div>
      </section>

      <!-- ② 날짜 선택 (칩 버튼) -->
      <section v-if="reservationDates.length > 0" class="today-workout__section">
        <h2 class="today-workout__section-title">예약된 PT</h2>
        <div class="today-workout__date-chips">
          <button
            v-for="date in reservationDates"
            :key="date"
            class="today-workout__date-chip"
            :class="{ 'today-workout__date-chip--active': selectedDate === date }"
            @click="selectDate(date)"
          >
            {{ date === todayStr ? '오늘' : formatChipDate(date) }}
          </button>
        </div>
      </section>

      <!-- ③ 운동 내용 -->
      <section class="today-workout__section">
        <h2 class="today-workout__section-title">운동 내용</h2>

        <!-- UPSERT 경고 배너 -->
        <div v-if="currentPlan" class="today-workout__warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 20H22L12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M12 9V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="12" cy="17" r="1" fill="currentColor"/>
          </svg>
          <span>이미 배정된 운동이 있습니다. 덮어쓰시겠습니까?</span>
        </div>

        <!-- 운동 항목 리스트 -->
        <div class="today-workout__exercise-list">
          <div
            v-for="(exercise, index) in exercises"
            :key="index"
            class="today-workout__exercise-item"
          >
            <div class="today-workout__exercise-header">
              <span class="today-workout__exercise-num">운동 {{ index + 1 }}</span>
              <button
                v-if="exercises.length > 1"
                class="today-workout__exercise-remove"
                @click="removeExercise(index)"
                type="button"
              >✕</button>
            </div>
            <div class="today-workout__exercise-row">
              <label class="today-workout__exercise-label">운동명</label>
              <input
                class="today-workout__exercise-input"
                v-model="exercise.name"
                placeholder="예: 스쿼트"
                type="text"
              />
            </div>
            <div class="today-workout__exercise-row today-workout__exercise-row--inline">
              <div class="today-workout__exercise-field">
                <label class="today-workout__exercise-label">세트</label>
                <div class="today-workout__stepper">
                  <button
                    class="today-workout__stepper-btn"
                    type="button"
                    @click="decrementField(exercise, 'sets', 1)"
                    :disabled="exercise.sets <= 1"
                  >−</button>
                  <span class="today-workout__stepper-value">{{ exercise.sets }}</span>
                  <button
                    class="today-workout__stepper-btn"
                    type="button"
                    @click="incrementField(exercise, 'sets', 99)"
                  >+</button>
                </div>
              </div>
              <div class="today-workout__exercise-field">
                <label class="today-workout__exercise-label">횟수</label>
                <div class="today-workout__stepper">
                  <button
                    class="today-workout__stepper-btn"
                    type="button"
                    @click="decrementField(exercise, 'reps', 1)"
                    :disabled="exercise.reps <= 1"
                  >−</button>
                  <span class="today-workout__stepper-value">{{ exercise.reps }}</span>
                  <button
                    class="today-workout__stepper-btn"
                    type="button"
                    @click="incrementField(exercise, 'reps', 999)"
                  >+</button>
                </div>
              </div>
            </div>
            <div class="today-workout__exercise-row">
              <label class="today-workout__exercise-label">메모 <span class="today-workout__exercise-optional">(선택)</span></label>
              <input
                class="today-workout__exercise-input"
                v-model="exercise.memo"
                placeholder="예: 깊게 앉기"
                type="text"
              />
            </div>
          </div>
        </div>

        <!-- 운동 추가 버튼 -->
        <button
          class="today-workout__exercise-add"
          @click="addExercise"
          type="button"
          :disabled="exercises.length >= 20"
        >
          <span>+</span> 운동 추가
        </button>

        <p v-if="error" class="today-workout__error-inline">{{ error }}</p>
        <p v-if="saveSuccess" class="today-workout__success-inline">저장되었습니다</p>
      </section>

      <!-- ④ 배정 이력 -->
      <section class="today-workout__section">
        <h2 class="today-workout__section-title">배정 이력</h2>
        <p v-if="historyLoading" class="today-workout__placeholder">불러오는 중...</p>
        <p v-else-if="workoutPlans.length === 0" class="today-workout__empty">배정 이력이 없습니다</p>
        <div v-else class="today-workout__history">
          <div
            v-for="plan in workoutPlans"
            :key="plan.id"
            class="today-workout__history-item"
          >
            <div class="today-workout__history-top">
              <div class="today-workout__history-info" @click="toggleHistoryExpand(plan.id)">
                <span class="today-workout__history-date">{{ formatDate(plan.date) }}</span>
                <span class="today-workout__history-content">{{ formatHistoryPreview(plan.exercises) }}</span>
              </div>
              <div class="today-workout__history-actions">
                <button
                  class="today-workout__history-copy"
                  type="button"
                  @click="copyFromHistory(plan)"
                >전체 복사</button>
                <button
                  class="today-workout__history-toggle"
                  type="button"
                  @click="toggleHistoryExpand(plan.id)"
                  :class="{ 'today-workout__history-toggle--open': expandedHistoryId === plan.id }"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="expandedHistoryId === plan.id" class="today-workout__history-exercises">
              <div
                v-for="(ex, ei) in plan.exercises"
                :key="ei"
                class="today-workout__history-exercise"
              >
                <div class="today-workout__history-exercise-info">
                  <span class="today-workout__history-exercise-name">{{ ex.name || '(이름 없음)' }}</span>
                  <span class="today-workout__history-exercise-detail">{{ ex.sets ?? 3 }}세트 × {{ ex.reps ?? 10 }}회</span>
                </div>
                <button
                  class="today-workout__history-exercise-add"
                  type="button"
                  :disabled="exercises.length >= 20"
                  @click="copySingleExercise(ex)"
                >+</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 저장 버튼 -->
      <div class="today-workout__save-wrap">
        <button
          class="today-workout__save-btn"
          :disabled="isSaving || exercises.every(e => !e.name.trim())"
          @click="handleSave"
        >
          {{ isSaving ? '저장 중...' : '저장' }}
        </button>
      </div>

      <div style="height: calc(var(--nav-height) + 16px);" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isActiveConnection } from '@/composables/useConnection'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const {
  workoutPlans,
  currentPlan,
  memberProfile,
  reservationDates,
  loading,
  error,
  fetchWorkoutPlan,
  fetchWorkoutPlans,
  saveWorkoutPlan,
  fetchMemberProfile,
  fetchMemberReservationDates,
} = useWorkoutPlans()

const _now = new Date()
const todayStr = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`
const selectedDate = ref(route.query.date || todayStr)
const exercises = ref([{ name: '', sets: 3, reps: 10, memo: '' }])
const saveSuccess = ref(false)
const isSaving = ref(false)
const historyLoading = ref(false)
const expandedHistoryId = ref(null)
const hasActiveConnection = ref(null)



onMounted(async () => {
  const memberId = route.query.memberId
  if (!memberId || !auth.user?.id) {
    router.back()
    return
  }
  hasActiveConnection.value = await isActiveConnection(auth.user.id, memberId)
  if (!hasActiveConnection.value) return
  await Promise.all([
    fetchMemberProfile(memberId),
    fetchMemberReservationDates(memberId),
  ])
  await loadPlanAndHistory()
})

async function selectDate(date) {
  if (hasActiveConnection.value !== true) return
  if (selectedDate.value === date) return
  selectedDate.value = date
  saveSuccess.value = false
  const memberId = route.query.memberId
  if (!memberId) return
  await fetchWorkoutPlan(memberId, date)
  exercises.value = currentPlan.value?.exercises?.length
    ? currentPlan.value.exercises.map(e => ({ ...e }))
    : [{ name: '', sets: 3, reps: 10, memo: '' }]
}

async function loadPlanAndHistory() {
  if (hasActiveConnection.value !== true) return
  const memberId = route.query.memberId
  if (!memberId) return
  historyLoading.value = true
  await fetchWorkoutPlan(memberId, selectedDate.value)
  exercises.value = currentPlan.value?.exercises?.length
    ? currentPlan.value.exercises.map(e => ({ ...e }))
    : [{ name: '', sets: 3, reps: 10, memo: '' }]
  await fetchWorkoutPlans(memberId)
  historyLoading.value = false
}

async function handleSave() {
  if (hasActiveConnection.value !== true) return
  const memberId = route.query.memberId
  const validExercises = exercises.value.filter(e => e.name.trim())
  if (!memberId || validExercises.length === 0 || isSaving.value) return
  isSaving.value = true
  saveSuccess.value = false
  const success = await saveWorkoutPlan(memberId, selectedDate.value, validExercises)
  isSaving.value = false
  if (success) {
    saveSuccess.value = true
    await fetchWorkoutPlans(memberId)
  }
}

function addExercise() {
  if (exercises.value.length >= 20) return
  exercises.value.push({ name: '', sets: 3, reps: 10, memo: '' })
}

/** 이전 배정 이력의 운동을 현재 펼집 영역에 복사 */
function copyFromHistory(plan) {
  if (!plan.exercises || plan.exercises.length === 0) return
  exercises.value = plan.exercises.map(e => ({
    name: e.name || '',
    sets: e.sets ?? 3,
    reps: e.reps ?? 10,
    memo: e.memo || '',
  }))
  saveSuccess.value = false
}

function toggleHistoryExpand(planId) {
  expandedHistoryId.value = expandedHistoryId.value === planId ? null : planId
}

function copySingleExercise(exercise) {
  if (exercises.value.length >= 20) return
  exercises.value.push({
    name: exercise.name || '',
    sets: exercise.sets ?? 3,
    reps: exercise.reps ?? 10,
    memo: exercise.memo || '',
  })
  saveSuccess.value = false
}

function removeExercise(index) {
  if (exercises.value.length <= 1) return
  exercises.value.splice(index, 1)
}

function incrementField(exercise, field, max) {
  if (exercise[field] < max) exercise[field]++
}

function decrementField(exercise, field, min) {
  if (exercise[field] > min) exercise[field]--
}

function formatHistoryPreview(exArr) {
  if (!exArr || exArr.length === 0) return '운동 없음'
  const names = exArr.slice(0, 2).map(e => e.name).filter(Boolean).join(', ')
  if (!names) return '운동 없음'
  return exArr.length > 2 ? `${names} 외 ${exArr.length - 2}개` : names
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

function formatChipDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dateObj = new Date(dateStr + 'T00:00:00')
  const dayName = dayNames[dateObj.getDay()]
  return `${Number(m)}/${Number(d)}(${dayName})`
}
</script>

<style src="./TodayWorkoutView.css" scoped></style>
