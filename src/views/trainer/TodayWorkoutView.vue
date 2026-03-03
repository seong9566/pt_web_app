<!-- [미구현] 오늘의 운동 페이지. 운동 루틴 리스트 + 세트/랩 구성 (목 데이터) -->
<template>
  <div class="today-workout">

    <!-- ── Header ── -->
    <div class="today-workout__header">
      <button class="today-workout__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="today-workout__title">{{ selectedMember }}</h1>
    </div>

    <!-- ── Body ── -->
    <div class="today-workout__body">

      <!-- 날짜 선택 (캘린더) -->
      <section class="today-workout__section">
        <div class="today-workout__calendar-card">
          <AppCalendar :model-value="selectedDate" @update:model-value="onDateSelect" />
        </div>
      </section>

      <!-- 운동 루틴 -->
      <section class="today-workout__section">
        <h2 class="today-workout__section-title">운동 루틴</h2>

        <div class="today-workout__routines">
          <div
            v-for="(routine, idx) in routines"
            :key="idx"
            class="today-workout__routine-item"
            @click="openEditSheet(idx)"
          >
            <div class="today-workout__routine-info">
              <p class="today-workout__routine-name">{{ routine.name }}</p>
              <p class="today-workout__routine-detail">{{ routine.reps }}회 · {{ routine.sets }}세트</p>
            </div>
            <button class="today-workout__routine-remove" @click.stop="removeRoutine(idx)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <button class="today-workout__add-btn" @click="openAddSheet()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            운동 추가하기
          </button>
        </div>
      </section>

      <!-- 개인 메모 -->
      <section class="today-workout__section">
        <h2 class="today-workout__section-title">개인 메모 <span class="today-workout__hint">(선택사항)</span></h2>
        <textarea
          class="today-workout__textarea"
          v-model="memo"
          placeholder="나만의 메모를 남겨보세요..."
        />
      </section>

    </div>

    <!-- ── Footer (Auto-save Indicator) ── -->
    <div class="today-workout__footer">
      <div class="today-workout__auto-save">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 12L19 12M13 6L19 12L13 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>작성 시 자동 저장됩니다</span>
      </div>
    </div>

    <!-- ── Add Routine Bottom Sheet ── -->
    <AppBottomSheet v-model="showAddRoutineSheet" title="운동 추가">
      <div class="workout-add-form">
        <div class="workout-add-field">
          <label class="workout-add-label">운동 명</label>
          <input class="workout-add-input" type="text" v-model="newExerciseName" placeholder="예) 스쿼트, 벤치 프레스" />
        </div>

        <div class="workout-add-row">
          <!-- 횟수 입력 -->
          <div class="workout-add-field">
            <label class="workout-add-label">1세트당 횟수</label>
            <div class="workout-add-stepper">
              <button class="workout-add-stepper__btn" @click="decrementReps" :disabled="newReps <= 1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
              <div class="workout-add-stepper__value">
                <input class="workout-add-stepper__input" type="number" inputmode="numeric" v-model.number="newReps" min="1" @keydown="preventMinus" />
                <small>회</small>
              </div>
              <button class="workout-add-stepper__btn" @click="incrementReps">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 세트 입력 -->
          <div class="workout-add-field">
            <label class="workout-add-label">총 세트 수</label>
            <div class="workout-add-stepper">
              <button class="workout-add-stepper__btn" @click="decrementSets" :disabled="newSets <= 1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
              <div class="workout-add-stepper__value">
                <input class="workout-add-stepper__input" type="number" inputmode="numeric" v-model.number="newSets" min="1" @keydown="preventMinus" />
                <small>세트</small>
              </div>
              <button class="workout-add-stepper__btn" @click="incrementSets">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button class="workout-add-submit" @click="confirmAddRoutine" :disabled="!newExerciseName">
          목록에 추가하기
        </button>
      </div>
    </AppBottomSheet>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppCalendar from '@/components/AppCalendar.vue'
import AppBottomSheet from '@/components/AppBottomSheet.vue'

const router = useRouter()
const route = useRoute()

const pad = (n) => String(n).padStart(2, '0')

// ── Date ──
const today = new Date()
const selectedDate = ref(
  `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
)

function onDateSelect(dateStr) {
  selectedDate.value = dateStr
}

// ── Member ──
const selectedMember = ref(route.query.member || '김지수')

// ── Routines ──
const routines = ref([
  { name: '벤치 프레스', reps: 10, sets: 5 },
  { name: '체스트 프레스', reps: 10, sets: 5 },
])

function removeRoutine(idx) {
  routines.value.splice(idx, 1)
  // 자동 저장 로직 추가 가능
}

// ── Add/Edit Routine Bottom Sheet ──
const showAddRoutineSheet = ref(false)
const editingIndex = ref(-1)

const newExerciseName = ref('')
const newReps = ref(10)
const newSets = ref(3)

function openAddSheet() {
  editingIndex.value = -1
  newExerciseName.value = ''
  newReps.value = 10
  newSets.value = 3
  showAddRoutineSheet.value = true
}

function openEditSheet(idx) {
  editingIndex.value = idx
  const r = routines.value[idx]
  newExerciseName.value = r.name
  newReps.value = r.reps
  newSets.value = r.sets
  showAddRoutineSheet.value = true
}

function incrementReps() { newReps.value++ }
function decrementReps() { if (newReps.value > 1) newReps.value-- }

function incrementSets() { newSets.value++ }
function decrementSets() { if (newSets.value > 1) newSets.value-- }

function preventMinus(e) {
  if (e.key === '-' || e.key === 'e' || e.key === '.' || e.key === '+') {
    e.preventDefault()
  }
}

function confirmAddRoutine() {
  if (!newExerciseName.value.trim()) return

  const item = {
    name: newExerciseName.value.trim(),
    reps: newReps.value,
    sets: newSets.value
  }

  if (editingIndex.value > -1) {
    routines.value[editingIndex.value] = item
  } else {
    routines.value.push(item)
  }

  // 자동 저장 로직 추가 가능

  // Reset inputs and close
  editingIndex.value = -1
  newExerciseName.value = ''
  newReps.value = 10
  newSets.value = 3
  showAddRoutineSheet.value = false
}

// ── Memo ──
const memo = ref('')

</script>

<style src="./TodayWorkoutView.css" scoped></style>
