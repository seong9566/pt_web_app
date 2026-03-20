<template>
  <div class="today-workout">

    <!-- Header -->
    <div class="today-workout__header">
      <button class="today-workout__back" @click="safeBack(route.path)">
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
      <div style="margin-top: 8px;">
        <AppButton variant="primary" @click="safeBack(route.path)">뒤로가기</AppButton>
      </div>
    </div>

    <div v-else-if="hasActiveConnection === null" class="today-workout__connection-loading">
      <AppSkeleton type="circle" width="64px" height="64px" />
      <AppSkeleton type="line" :count="3" />
    </div>

    <div v-else class="today-workout__body">

      <!-- ① 회원 프로필 -->
      <section v-if="loading && !memberProfile" class="today-workout__profile today-workout__profile--loading">
        <AppSkeleton type="circle" width="64px" height="64px" />
        <AppSkeleton type="line" :count="2" />
      </section>
      <section v-else-if="memberProfile" class="today-workout__profile">
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
            v-for="reservation in reservationDates"
            :key="reservation.id"
            class="today-workout__date-chip"
            :class="{ 'today-workout__date-chip--active': selectedReservationId === reservation.id }"
            @click="selectReservation(reservation)"
          >
            {{ reservation.date === todayStr ? '오늘' : formatChipLabel(reservation, reservationDates) }}
          </button>
        </div>
      </section>

      <!-- ③ 운동 내용 -->
      <section class="today-workout__section">
        <h2 class="today-workout__section-title">운동 내용</h2>

        <!-- 기존 운동 요약 카드 (View-first) -->
        <div v-if="currentPlan && !editMode" class="today-workout__existing-card">
          <div class="today-workout__existing-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/>
            </svg>
            <span>배정 완료</span>
          </div>
          <div class="today-workout__existing-body">
            <span v-if="currentPlan.category" class="today-workout__existing-category">{{ currentPlan.category }}</span>
            <span class="today-workout__existing-summary">{{ formatHistoryPreview(currentPlan.exercises) }}</span>
          </div>
          <div class="today-workout__existing-actions">
            <button class="today-workout__existing-btn today-workout__existing-btn--edit" type="button" @click="enterEditMode(true)">
              수정하기
            </button>
            <button class="today-workout__existing-btn today-workout__existing-btn--new" type="button" @click="enterEditMode(false)">
              새로 작성
            </button>
          </div>
        </div>

        <!-- 편집 폼 (신규 또는 편집 모드) -->
        <template v-if="!currentPlan || editMode">
          <div class="today-workout__category-chips">
            <button
              v-for="cat in WORKOUT_CATEGORIES"
              :key="cat"
              class="today-workout__category-chip"
              :class="{ 'today-workout__category-chip--active': selectedCategory === cat }"
              type="button"
              @click="selectedCategory = cat"
            >{{ cat }}</button>
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
        </template>
      </section>

      <!-- ④ 배정 이력 -->
      <section class="today-workout__section">
        <h2 class="today-workout__section-title">배정 이력</h2>
        <div v-if="historyLoading" class="today-workout__placeholder today-workout__placeholder--skeleton">
          <AppSkeleton type="line" :count="3" />
        </div>
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

      <!-- 저장 버튼 (편집 모드일 때만) -->
      <template v-if="!currentPlan || editMode">
        <div class="today-workout__save-wrap">
          <button
            class="today-workout__save-btn"
            :disabled="isSaving || exercises.every(e => !e.name.trim()) || !selectedCategory"
            @click="handleSave"
          >
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </template>

      <div style="height: calc(var(--nav-height) + 16px);" />
    </div>

    <!-- 덮어쓰기 확인 바텀시트 -->
    <AppBottomSheet v-model="showConfirmSheet" title="운동 배정 확인">
      <div class="today-workout__confirm">
        <div class="today-workout__confirm-info">
          <span class="today-workout__confirm-name">{{ memberProfile?.name }} 회원</span>
          <span class="today-workout__confirm-date">{{ formatDate(selectedDate) }}</span>
        </div>
        <div class="today-workout__confirm-preview">
          <span v-if="selectedCategory" class="today-workout__confirm-category">{{ selectedCategory }}</span>
          <span>{{ formatHistoryPreview(exercises.filter(e => e.name.trim())) }}</span>
        </div>
        <div class="today-workout__confirm-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 20H22L12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M12 9V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="12" cy="17" r="1" fill="currentColor"/>
          </svg>
          <span>기존 배정을 덮어씁니다</span>
        </div>
        <div class="today-workout__confirm-actions">
          <button class="today-workout__confirm-btn today-workout__confirm-btn--cancel" type="button" @click="showConfirmSheet = false">취소</button>
          <button class="today-workout__confirm-btn today-workout__confirm-btn--save" type="button" :disabled="isSaving" @click="confirmSave">
            {{ isSaving ? '저장 중...' : '배정하기' }}
          </button>
        </div>
      </div>
    </AppBottomSheet>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { safeBack } from '@/utils/navigation'
import AppButton from '@/components/AppButton.vue'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import { isActiveConnection } from '@/composables/useConnection'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useWorkoutPlansStore } from '@/stores/workoutPlans'
import AppSkeleton from '@/components/AppSkeleton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { showToast, showError, showSuccess } = useToast()

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
const WORKOUT_CATEGORIES = ['가슴', '어깨', '등', '팔', '하체', '코어', '전신', '유산소', '스트레칭']
const selectedDate = ref(route.query.date || todayStr)
const selectedReservationId = ref(null)
const selectedCategory = ref('')
const exercises = ref([{ name: '', sets: 3, reps: 10, memo: '' }])
const isSaving = ref(false)
const historyLoading = ref(false)
const expandedHistoryId = ref(null)
const hasActiveConnection = ref(null)
const editMode = ref(false)
const showConfirmSheet = ref(false)
const initialSnapshot = ref(null)
// 저장 성공 직후 route leave 가드 우회용
const justSaved = ref(false)

/** 폼 변경 여부 감지 */
const isDirty = computed(() => {
  // 아직 편집 시작 안했으면 dirty 아님
  if (!editMode.value && currentPlan.value) return false
  if (!initialSnapshot.value) return false
  return JSON.stringify({ exercises: exercises.value, category: selectedCategory.value }) !== initialSnapshot.value
})

/** 현재 폼 상태를 스냅샷으로 저장 */
function takeSnapshot() {
  initialSnapshot.value = JSON.stringify({ exercises: exercises.value, category: selectedCategory.value })
}

/** View-first → 편집 모드 전환 */
function enterEditMode(keepExisting) {
  editMode.value = true
  if (keepExisting) {
    // 기존 데이터 유지 (이미 pre-fill 됨)
  } else {
    // 새로 작성
    exercises.value = [{ name: '', sets: 3, reps: 10, memo: '' }]
    selectedCategory.value = ''
  }
  takeSnapshot()
}

onMounted(async () => {
  const memberId = route.query.memberId
  if (!memberId || !auth.user?.id) {
    safeBack(route.path)
    return
  }
  hasActiveConnection.value = await isActiveConnection(auth.user.id, memberId)
  if (!hasActiveConnection.value) return
  await Promise.all([
    fetchMemberProfile(memberId),
    fetchMemberReservationDates(memberId),
  ])
  // reservationId 우선, 없으면 reservationDates 첫 번째로 fallback
  const reservationId = route.query.reservationId
  if (reservationId) {
    selectedReservationId.value = reservationId
    const matched = reservationDates.value.find(r => r.id === reservationId)
    if (matched) selectedDate.value = matched.date
  } else if (reservationDates.value.length > 0) {
    const first = reservationDates.value[0]
    selectedReservationId.value = first.id
    selectedDate.value = first.date
  }
  await loadPlanAndHistory()
})

async function selectReservation(reservation) {
  if (hasActiveConnection.value !== true) return
  if (selectedReservationId.value === reservation.id) return
  // 미저장 변경 경고
  if (isDirty.value && !window.confirm('저장하지 않은 변경사항이 있습니다. 다른 예약으로 이동하시겠습니까?')) return
  selectedReservationId.value = reservation.id
  selectedDate.value = reservation.date
  editMode.value = false
  await fetchWorkoutPlan(reservation.id)
  exercises.value = currentPlan.value?.exercises?.length
    ? currentPlan.value.exercises.map(e => ({ ...e }))
    : [{ name: '', sets: 3, reps: 10, memo: '' }]
  selectedCategory.value = currentPlan.value?.category || ''
  takeSnapshot()
}

async function loadPlanAndHistory() {
  if (hasActiveConnection.value !== true) return
  const memberId = route.query.memberId
  if (!memberId) return
  historyLoading.value = true
  await fetchWorkoutPlan(selectedReservationId.value)
  exercises.value = currentPlan.value?.exercises?.length
    ? currentPlan.value.exercises.map(e => ({ ...e }))
    : [{ name: '', sets: 3, reps: 10, memo: '' }]
  selectedCategory.value = currentPlan.value?.category || ''
  // 기존 운동 없으면 바로 편집 모드
  if (!currentPlan.value) editMode.value = true
  takeSnapshot()
  await fetchWorkoutPlans(memberId)
  historyLoading.value = false
}

/** 저장 버튼 클릭 → 덮어쓰기면 확인 바텀시트, 신규면 바로 저장 */
function handleSave() {
  if (hasActiveConnection.value !== true) return
  const memberId = route.query.memberId
  const validExercises = exercises.value.filter(e => e.name.trim())
  if (!memberId || validExercises.length === 0 || isSaving.value) return
  // 기존 배정이 있으면 확인 바텀시트
  if (currentPlan.value) {
    showConfirmSheet.value = true
  } else {
    executeSave()
  }
}

/** 확인 바텀시트에서 "배정하기" 클릭 */
async function confirmSave() {
  showConfirmSheet.value = false
  await executeSave()
}

/** 실제 저장 실행 */
async function executeSave() {
  const memberId = route.query.memberId
  const validExercises = exercises.value.filter(e => e.name.trim())
  if (!memberId || validExercises.length === 0 || isSaving.value) return
  isSaving.value = true
  const success = await saveWorkoutPlan(selectedReservationId.value, memberId, selectedDate.value, validExercises, selectedCategory.value)
  isSaving.value = false
  if (success) {
    showSuccess('저장되었습니다')
    useWorkoutPlansStore().invalidate()
    takeSnapshot()
    justSaved.value = true
    await fetchWorkoutPlans(memberId)
    const currentPath = route.fullPath
    setTimeout(() => {
      // 아직 같은 페이지에 있을 때만 뒤로가기
      if (router.currentRoute.value.fullPath === currentPath) {
        safeBack(route.path)
      }
    }, 800)
  }
}

function addExercise() {
  if (exercises.value.length >= 20) return
  exercises.value.push({ name: '', sets: 3, reps: 10, memo: '' })
}

/** 이전 배정 이력의 운동을 현재 폼에 복사 (작성 중 내용이 있으면 확인) */
function copyFromHistory(plan) {
  if (!plan.exercises || plan.exercises.length === 0) return
  const hasContent = exercises.value.some(e => e.name.trim())
  if (hasContent && !window.confirm('현재 작성 중인 내용이 사라집니다. 복사하시겠습니까?')) return
  // 편집 모드가 아니면 진입
  editMode.value = true
  exercises.value = plan.exercises.map(e => ({
    name: e.name || '',
    sets: e.sets ?? 3,
    reps: e.reps ?? 10,
    memo: e.memo || '',
  }))
  selectedCategory.value = plan.category || ''
  takeSnapshot()
}

function toggleHistoryExpand(planId) {
  expandedHistoryId.value = expandedHistoryId.value === planId ? null : planId
}

function copySingleExercise(exercise) {
  if (exercises.value.length >= 20) return
  // 편집 모드가 아니면 진입
  if (!editMode.value) enterEditMode(true)
  exercises.value.push({
    name: exercise.name || '',
    sets: exercise.sets ?? 3,
    reps: exercise.reps ?? 10,
    memo: exercise.memo || '',
  })
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

function formatChipLabel(reservation, allReservations) {
  const sameDay = allReservations.filter(r => r.date === reservation.date)
  if (sameDay.length > 1) {
    const [month, day] = reservation.date.split('-').slice(1)
    return `${parseInt(month)}/${parseInt(day)} ${reservation.start_time}`
  }
  const [month, day] = reservation.date.split('-').slice(1)
  return `${parseInt(month)}/${parseInt(day)}`
}

/** 미저장 변경사항 이탈 방지 */
onBeforeRouteLeave((to, from, next) => {
  if (justSaved.value) {
    next()
    return
  }
  if (isDirty.value && !window.confirm('저장하지 않은 변경사항이 있습니다. 나가시겠습니까?')) {
    next(false)
  } else {
    next()
  }
})

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./TodayWorkoutView.css" scoped></style>
