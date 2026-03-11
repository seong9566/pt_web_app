<!-- 회원 스케줄 페이지. 캘린더에 예약 현황(dot) 표시, 날짜별 예약 목록 조회 -->
<template>
  <div class="member-schedule">
    <AppPullToRefresh @refresh="handleRefresh">
      <!-- ── App Bar ── -->
      <div class="schedule-appbar">
        <h1 class="schedule-appbar__title">내 일정</h1>
      </div>

      <!-- 에러 메시지 -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-if="hasActiveConnection === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 8px;">
        <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">트레이너와 연결되지 않았습니다</p>
        <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">트레이너를 찾아 연결해보세요</p>
      </div>

      <div v-else-if="hasActiveConnection === null" style="padding: 60px 20px;">
        <AppSkeleton type="rect" width="100%" height="80px" :count="3" />
      </div>

      <template v-else>

      <!-- ── Monthly Calendar ── -->
      <div class="calendar-card">
        <div class="calendar-card__nav">
          <button class="calendar-card__arrow" @click="prevMonth">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-400)">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <span class="calendar-card__month"
            >{{ currentYear }}년 {{ currentMonth }}월</span
          >
          <button class="calendar-card__arrow" @click="nextMonth">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-400)">
              <path
                d="M9 6L15 12L9 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <div class="calendar-card__weekdays">
          <span
            v-for="day in weekdays"
            :key="day.label"
            class="calendar-card__weekday"
            :class="day.cls"
            >{{ day.label }}</span
          >
        </div>

        <div class="calendar-card__grid">
          <div
            v-for="cell in calendarCells"
            :key="cell.key"
            class="cal-cell"
            :class="{ 'cal-cell--empty': !cell.date }"
            @click="cell.date && selectDate(cell.date)"
          >
            <div
              v-if="cell.date"
              class="cal-cell__inner"
              :class="{ 
                'cal-cell__inner--selected': isSelected(cell.date),
                'cal-cell__inner--today': !isSelected(cell.date) && isToday(cell.date),
              }"
            >
              <span
                class="cal-cell__num"
                :class="{
                  'cal-cell__num--selected': isSelected(cell.date),
                  'cal-cell__num--today': !isSelected(cell.date) && isToday(cell.date),
                  'cal-cell__num--past': isPast(cell.date) && !isSelected(cell.date),
                  'cal-cell__num--sun': !isPast(cell.date) && cell.isSun,
                  'cal-cell__num--sat': !isPast(cell.date) && cell.isSat,
                  'cal-cell__num--off': !isPast(cell.date) && isNonWorkingDay(cell.date),
                }"
                >{{ cell.date }}</span
              >
              <div class="cal-cell__dots">
                <span
                  v-for="(dot, i) in getDots(cell.date)"
                  :key="i"
                  class="cal-cell__dot"
                  :class="`cal-cell__dot--${dot}`"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="calendar-card__legend">
          <span v-for="item in legend" :key="item.status" class="legend-item">
            <span
              class="legend-item__dot"
              :class="`legend-item__dot--${item.status}`"
            />
            {{ item.label }}
          </span>
        </div>
      </div>

      <!-- ── Selected Date Header ── -->
      <div class="schedule-date-header">
        <h2 class="schedule-date-header__title">{{ selectedDateLabel }}</h2>
        <p class="schedule-date-header__count">
          {{ selectedDaySessions.length }}개의 일정이 있습니다
        </p>
      </div>

      <!-- ── Session Cards ── -->
      <div class="schedule-list">
        <div
          v-for="session in selectedDaySessions"
          :key="session.id"
          class="scard"
          :class="`scard--${session.status}`"
          @click="
            (session.status === 'approved' || session.status === 'completed') &&
            goWorkoutDetail()
          "
          :style="
            session.status === 'approved' || session.status === 'completed'
              ? 'cursor: pointer;'
              : ''
          "
        >
          <div class="scard__border" />
          <div class="scard__body">
            <div class="scard__top">
              <h3 class="scard__title">{{ session.title }}</h3>
              <span
                class="scard__badge"
                :class="`scard__badge--${session.status}`"
              >
                {{ statusLabel(session.status) }}
              </span>
            </div>
            <div
              class="scard__time"
              :class="{
                'scard__time--approved': session.status === 'approved',
              }"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M12 6V12L16 14"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ session.time }}
            </div>
            <div class="scard__trainer-row">
              <div class="scard__trainer-info">
                <div class="scard__avatar">
                  <img v-if="session.trainerPhoto" :src="session.trainerPhoto" :alt="session.trainer" class="scard__avatar-img" />
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                      stroke="currentColor"
                      stroke-width="1.6"
                    />
                    <path
                      d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                    />
                  </svg>
                </div>
                <span class="scard__name">{{ session.trainer }}</span>
              </div>
              <button
                v-if="session.status === 'approved'"
                class="scard__cancel-btn"
                @click.stop="handleCancel(session)"
              >
                취소
              </button>
            </div>
            <!-- 배정된 운동 요약 -->
            <div v-if="session.workoutSummary" class="scard__workout-summary">
              <svg v-if="session.status === 'completed'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill="rgba(0,122,255,0.08)" stroke="var(--color-blue-primary)" stroke-width="1.4"/>
                <path d="M8 12L11 15L16 9" stroke="var(--color-blue-primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M6 4v16M18 4v16M6 12h12M3 8h3M18 8h3M3 16h3M18 16h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              <span>{{ session.workoutSummary }}</span>
            </div>
            <div v-else-if="session.status === 'approved'" class="scard__workout-summary scard__workout-summary--empty">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M6 4v16M18 4v16M6 12h12M3 8h3M18 8h3M3 16h3M18 16h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              <span>아직 운동이 배정되지 않았습니다</span>
            </div>
            <div
              v-if="session.status === 'rejected' && session.rejection_reason"
              class="scard__reject-reason"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M12 8V12M12 16H12.01"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <span>{{ session.rejection_reason }}</span>
            </div>
          </div>
        </div>

        <div
          v-if="selectedDaySessions.length === 0"
          class="schedule-list__empty"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="4"
              width="18"
              height="18"
              rx="3"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path d="M3 9H21" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M8 2V6M16 2V6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <p>등록된 일정이 없습니다</p>
        </div>
      </div>

      <div style="height: calc(var(--nav-height) + 32px)" />

      <!-- ── Floating Action Button (FAB) ── -->
      <button class="member-schedule__fab" @click="handleReserve">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
        예약하기
      </button>
      </template>
    </AppPullToRefresh>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from "vue";

defineOptions({ name: "MemberScheduleView" });
import { useRouter } from "vue-router";
import { useReservations } from "@/composables/useReservations";
import { useWorkHours } from "@/composables/useWorkHours";
import { useWorkoutPlans } from "@/composables/useWorkoutPlans";
import { useToast } from "@/composables/useToast";
import { useReservationsStore } from "@/stores/reservations";
import AppPullToRefresh from "@/components/AppPullToRefresh.vue";
import AppSkeleton from "@/components/AppSkeleton.vue";

const router = useRouter();
const reservationsStore = useReservationsStore();
const {
  reservations,
  loading,
  error,
  fetchMyReservations,
  updateReservationStatus,
  checkTrainerConnection,
  getConnectedTrainerId,
} = useReservations();
const { fetchWorkingDays } = useWorkHours();
const { fetchWorkoutPlan, currentPlan } = useWorkoutPlans();
const { showToast } = useToast();

// ── Calendar state ──
const now = new Date();
const currentYear = ref(now.getFullYear());
const currentMonth = ref(now.getMonth() + 1);
const selectedDate = ref(now.getDate());

// ── Workout plan cache (date → exercises) ──
const workoutPlanCache = ref({})

const weekdays = [
  { label: "일", cls: "calendar-card__weekday--sun" },
  { label: "월", cls: "" },
  { label: "화", cls: "" },
  { label: "수", cls: "" },
  { label: "목", cls: "" },
  { label: "금", cls: "" },
  { label: "토", cls: "calendar-card__weekday--sat" },
];

const legend = [
  { status: "pending", label: "대기중" },
  { status: "approved", label: "승인됨" },
  { status: "done", label: "완료" },
];

const loaded = ref(false);
const workingDays = ref(new Set());
const hasActiveConnection = ref(null);

async function loadData() {
  const connected = await checkTrainerConnection();
  hasActiveConnection.value = connected;
  if (!connected) {
    loaded.value = true;
    return;
  }
  await fetchMyReservations("member");
  const trainerId = await getConnectedTrainerId();
  if (trainerId) {
    workingDays.value = await fetchWorkingDays(trainerId);
  }
  // 오늘 날짜의 운동 계획 미리 로드
  await loadWorkoutForDate(currentYear.value, currentMonth.value, selectedDate.value);
  loaded.value = true;
}

async function handleRefresh() {
  await reservationsStore.loadReservations("member", true);
  await loadWorkoutForDate(currentYear.value, currentMonth.value, selectedDate.value);
}

onMounted(() => {
  if (!loaded.value) loadData();
});
onActivated(() => {
  if (loaded.value && reservationsStore.isStale()) loadData();
});

// ── 날짜에 해당하는 운동 계획 로드 ──
async function loadWorkoutForDate(year, month, day) {
  // 선택 날짜의 예약이 있는 경우에만 fetch
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (workoutPlanCache.value[dateStr] !== undefined) return;
  await fetchWorkoutPlan(undefined, dateStr); // member 자신 기준으로 조회
  workoutPlanCache.value[dateStr] = currentPlan.value ? [...(currentPlan.value.exercises || [])] : null;
}

// ── Compute dots from real reservations ──
// dotsData 키: "YYYY-MM-DD", 값: dot CSS 클래스 배열 (completed → done 변환)
const STATUS_TO_DOT = {
  pending: "pending",
  approved: "approved",
  completed: "done",
};

const dotsData = computed(() => {
  const dots = {};
  reservations.value.forEach((res) => {
    if (res.status === "cancelled") return;
    if (!dots[res.date]) {
      dots[res.date] = new Set();
    }
    dots[res.date].add(STATUS_TO_DOT[res.status] || res.status);
  });
  const result = {};
  for (const [date, statusSet] of Object.entries(dots)) {
    result[date] = [...statusSet].slice(0, 4);
  }
  return result;
});

// date: day number (1-31) → full date string으로 변환하여 dotsData 조회
function getDots(date) {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  return dotsData.value[dateStr] || [];
}

function isNonWorkingDay(date) {
  if (workingDays.value.size === 0) return false;
  const dow = new Date(
    currentYear.value,
    currentMonth.value - 1,
    date,
  ).getDay();
  return !workingDays.value.has(dow);
}

function isPast(date) {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(date).padStart(2, '0')}`
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return dateStr < todayStr
}

function isSelected(date) {
  return date === selectedDate.value;
}

function isToday(date) {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return dateStr === todayStr;
}

function selectDate(date) {
  selectedDate.value = date;
  // 선택 날짜 변경 시 운동 계획 로드
  loadWorkoutForDate(currentYear.value, currentMonth.value, date);
}

// ── Calendar cells ──
const calendarCells = computed(() => {
  const firstDay = new Date(
    currentYear.value,
    currentMonth.value - 1,
    1,
  ).getDay();
  const daysInMonth = new Date(
    currentYear.value,
    currentMonth.value,
    0,
  ).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ key: `empty-${i}`, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = (firstDay + d - 1) % 7;
    cells.push({
      key: `day-${d}`,
      date: d,
      isSun: dayOfWeek === 0,
      isSat: dayOfWeek === 6,
    });
  }
  return cells;
});

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

// ── Selected date label ──
const dayNames = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];
const selectedDateLabel = computed(() => {
  const dayOfWeek = new Date(
    currentYear.value,
    currentMonth.value - 1,
    selectedDate.value,
  ).getDay();
  return `${currentMonth.value}월 ${selectedDate.value}일 ${dayNames[dayOfWeek]}`;
});

// ── Filter reservations by selected date ──
const selectedDaySessions = computed(() => {
  const selectedDateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, "0")}-${String(selectedDate.value).padStart(2, "0")}`;
  const exercises = workoutPlanCache.value[selectedDateStr];
  const workoutSummary = exercises && exercises.length > 0
    ? exercises.filter(e => e.name).slice(0, 3).map(e => `${e.name} ${e.sets}×${e.reps}`).join(', ')
    : null;

  return reservations.value
    .filter((res) => res.date === selectedDateStr && res.status !== "cancelled")
    .map((res) => ({
      id: res.id,
      title: res.session_type || "운동 세션",
      time: `${res.start_time} - ${res.end_time}`,
      trainer: res.partner_name,
      trainerPhoto: res.partner_photo || null,
      status: res.status,
      rejection_reason: res.rejection_reason,
      workoutSummary,
    }));
});

function statusLabel(status) {
  const map = {
    pending: "대기중",
    approved: "승인됨",
    completed: "완료",
    done: "완료",
    // cancelled: "취소됨",
    rejected: "거절됨",
  };
  return map[status] || status;
}

// ── 핸들러 ──
function handleReserve() {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, "0")}-${String(selectedDate.value).padStart(2, "0")}`;
  router.push({ path: "/member/reservation", query: { date: dateStr } });
}

function goWorkoutDetail() {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, "0")}-${String(selectedDate.value).padStart(2, "0")}`;
  router.push({ name: "member-workout-detail", query: { date: dateStr } });
}

async function handleCancel(session) {
  if (confirm(`"${session.title}" 예약을 취소하시겠습니까?`)) {
    const success = await updateReservationStatus(session.id, "cancelled");
    if (success) {
      await fetchMyReservations("member");
    }
  }
}

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./MemberScheduleView.css" scoped></style>
