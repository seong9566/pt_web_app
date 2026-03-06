<!-- 운동 배정 페이지 — 회원 선택, 날짜 선택, 운동 내용 입력, 저장 및 이력 조회 -->
<template>
  <div class="today-workout">

    <!-- ── Header ── -->
    <div class="today-workout__header">
      <button class="today-workout__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="today-workout__title">오늘의 운동</h1>
      <div class="today-workout__header-spacer" />
    </div>

    <!-- ── Body (scrollable) ── -->
    <div class="today-workout__body">

      <!-- ① 회원 선택 -->
      <section class="today-workout__section">
        <h2 class="today-workout__section-title">회원 선택</h2>
        <p v-if="membersLoading" class="today-workout__placeholder">회원 목록 불러오는 중...</p>
        <p v-else-if="membersError" class="today-workout__error-inline">{{ membersError }}</p>
        <p v-else-if="members.length === 0" class="today-workout__empty">연결된 회원이 없습니다</p>
        <div v-else class="today-workout__member-list">
          <button
            v-for="member in members"
            :key="member.id"
            class="today-workout__member-item"
            :class="{ 'today-workout__member-item--active': selectedMemberId === member.id }"
            @click="selectMember(member.id)"
          >
            <div class="today-workout__avatar">
              <img v-if="member.photo" :src="member.photo" :alt="member.name" class="today-workout__avatar-img" />
              <span v-else class="today-workout__avatar-initial">{{ member.name.charAt(0) }}</span>
            </div>
            <span class="today-workout__member-name">{{ member.name }}</span>
            <svg
              v-if="selectedMemberId === member.id"
              class="today-workout__member-check"
              width="20" height="20" viewBox="0 0 24 24" fill="none"
            >
              <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      <template v-if="selectedMemberId">

        <!-- ② 날짜 선택 -->
        <section class="today-workout__section">
          <h2 class="today-workout__section-title">날짜 선택</h2>
          <input
            type="date"
            class="today-workout__date-input"
            v-model="selectedDate"
            @change="onDateChange"
          />
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
                  <input
                    class="today-workout__exercise-input today-workout__exercise-input--num"
                    v-model.number="exercise.sets"
                    type="number"
                    min="1"
                    max="99"
                  />
                </div>
                <div class="today-workout__exercise-field">
                  <label class="today-workout__exercise-label">횟수</label>
                  <input
                    class="today-workout__exercise-input today-workout__exercise-input--num"
                    v-model.number="exercise.reps"
                    type="number"
                    min="1"
                    max="999"
                  />
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
              <span class="today-workout__history-date">{{ formatDate(plan.date) }}</span>
              <span class="today-workout__history-content">{{ formatHistoryPreview(plan.exercises) }}</span>
            </div>
          </div>
        </section>

        <!-- 저장 버튼 (nav 위 sticky) -->
        <div class="today-workout__save-wrap">
          <button
            class="today-workout__save-btn"
            :disabled="isSaving || exercises.every(e => !e.name.trim())"
            @click="handleSave"
          >
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
        </div>

      </template>

      <!-- 하단 네비게이션 스페이서 -->
      <div style="height: calc(var(--nav-height) + 16px);" />

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { useMembers } from '@/composables/useMembers'

const router = useRouter()
const route = useRoute()

// ── 컴포저블 ──
const { members, loading: membersLoading, error: membersError, fetchMembers } = useMembers()
const {
  workoutPlans,
  currentPlan,
  loading,
  error,
  fetchWorkoutPlan,
  fetchWorkoutPlans,
  saveWorkoutPlan,
} = useWorkoutPlans()

// ── 상태 ──
const selectedMemberId = ref(null)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const exercises = ref([{ name: '', sets: 3, reps: 10, memo: '' }])
const saveSuccess = ref(false)
const isSaving = ref(false)
const historyLoading = ref(false)

// ── 초기화 ──
onMounted(async () => {
  await fetchMembers()
  if (route.query.memberId) {
    if (route.query.date) selectedDate.value = route.query.date
    await selectMember(route.query.memberId)
  }
})

// ── 회원 선택 ──
async function selectMember(memberId) {
  if (selectedMemberId.value === memberId) return
  selectedMemberId.value = memberId
  saveSuccess.value = false
  exercises.value = [{ name: '', sets: 3, reps: 10, memo: '' }]
  await loadPlanAndHistory()
}

// ── 날짜 변경 ──
async function onDateChange() {
  if (!selectedMemberId.value) return
  saveSuccess.value = false
  await fetchWorkoutPlan(selectedMemberId.value, selectedDate.value)
  exercises.value = currentPlan.value?.exercises?.length
    ? currentPlan.value.exercises.map(e => ({ ...e }))
    : [{ name: '', sets: 3, reps: 10, memo: '' }]
}

// ── 날짜별 계획 + 전체 이력 로드 ──
async function loadPlanAndHistory() {
  if (!selectedMemberId.value) return
  historyLoading.value = true
  await fetchWorkoutPlan(selectedMemberId.value, selectedDate.value)
  exercises.value = currentPlan.value?.exercises?.length
    ? currentPlan.value.exercises.map(e => ({ ...e }))
    : [{ name: '', sets: 3, reps: 10, memo: '' }]
  await fetchWorkoutPlans(selectedMemberId.value)
  historyLoading.value = false
}

// ── 저장 ──
async function handleSave() {
  const validExercises = exercises.value.filter(e => e.name.trim())
  if (!selectedMemberId.value || validExercises.length === 0 || isSaving.value) return
  isSaving.value = true
  saveSuccess.value = false
  const success = await saveWorkoutPlan(
    selectedMemberId.value,
    selectedDate.value,
    validExercises
  )
  isSaving.value = false
  if (success) {
    saveSuccess.value = true
    await fetchWorkoutPlans(selectedMemberId.value)
  }
}

// ── 운동 항목 추가 ──
function addExercise() {
  if (exercises.value.length >= 20) return
  exercises.value.push({ name: '', sets: 3, reps: 10, memo: '' })
}

// ── 운동 항목 제거 ──
function removeExercise(index) {
  if (exercises.value.length <= 1) return
  exercises.value.splice(index, 1)
}

// ── 이력 미리보기 포맷 ──
function formatHistoryPreview(exArr) {
  if (!exArr || exArr.length === 0) return '운동 없음'
  const names = exArr.slice(0, 2).map(e => e.name).filter(Boolean).join(', ')
  if (!names) return '운동 없음'
  return exArr.length > 2 ? `${names} 외 ${exArr.length - 2}개` : names
}

// ── 날짜 포맷 (YYYY-MM-DD → YYYY년 M월 D일) ──
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}
</script>

<style src="./TodayWorkoutView.css" scoped></style>
