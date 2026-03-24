/**
 * 앱 초기 진입 시 모든 탭 데이터를 프리로드하는 컴포저블
 *
 * 역할별로 각 탭이 사용하는 Pinia 스토어를 한꺼번에 로드하여
 * 탭 전환 시 네트워크 대기 없이 즉시 화면을 표시할 수 있도록 함.
 *
 * main.js에서 auth.initialize() 완료 후 비동기로 실행 (라우터 대기 차단 없음).
 */
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'
import { useMembersStore } from '@/stores/members'
import { useWorkHoursStore } from '@/stores/workHours'
import { useScheduleOverridesStore } from '@/stores/scheduleOverrides'
import { useWorkoutPlansStore } from '@/stores/workoutPlans'
import { usePtSessionsStore } from '@/stores/ptSessions'
import { useAvailabilityStore } from '@/stores/availability'
import { getActiveTrainerId } from '@/composables/useConnection'

/** 현재 월 키 반환 (예: '2026-03') */
function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** 오늘 날짜 문자열 반환 (예: '2026-03-24') */
function getToday() {
  return new Date().toISOString().slice(0, 10)
}

/** 이번 주 월요일 날짜 반환 (예: '2026-03-23') */
function getCurrentWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().slice(0, 10)
}

/**
 * 모든 탭의 초기 데이터를 프리로드
 * - 역할(trainer/member)에 따라 필요한 스토어를 병렬 로드
 * - 실패해도 앱 동작에 영향 없음 (Promise.allSettled 사용)
 */
export async function preloadAllTabData() {
  const auth = useAuthStore()
  if (!auth.user?.id || !auth.role) return

  if (auth.role === 'trainer') {
    await preloadTrainerData(auth)
  } else {
    await preloadMemberData(auth)
  }
}

/**
 * 트레이너 탭 프리로드
 * - Home: 예약, 회원, 운동계획
 * - Members: 회원 목록 (Home과 공유)
 * - Schedule: 예약(공유), 근무시간, 오버라이드, 가용시간, 운동계획(공유)
 * - Chat: 배지는 BottomNav에서 처리
 * - Settings: 추가 데이터 없음
 */
async function preloadTrainerData(auth) {
  const trainerId = auth.user.id
  const today = getToday()
  const month = getCurrentMonthKey()
  const weekStart = getCurrentWeekStart()

  const reservationsStore = useReservationsStore()
  const membersStore = useMembersStore()
  const workHoursStore = useWorkHoursStore()
  const scheduleOverridesStore = useScheduleOverridesStore()
  const workoutPlansStore = useWorkoutPlansStore()
  const availabilityStore = useAvailabilityStore()

  await Promise.allSettled([
    reservationsStore.loadReservations('trainer'),      // Home, Schedule 공통
    membersStore.loadMembers(),                          // Home, Members, Schedule 공통
    workHoursStore.loadWorkHours(trainerId),             // Schedule: 본인 근무시간
    scheduleOverridesStore.loadOverrides(trainerId, month), // Schedule: 월별 오버라이드
    workoutPlansStore.loadDayWorkoutPlans(trainerId, today), // Home, Schedule: 오늘 운동계획
    availabilityStore.loadMemberAvailabilities(trainerId, weekStart), // Schedule: 회원 가용시간
  ])
}

/**
 * 회원 탭 프리로드
 * - Home: 예약, PT 횟수
 * - Schedule: 예약(공유), 근무시간, 오버라이드
 * - Chat: 배지는 BottomNav에서 처리
 * - Manual: composable 로컬 상태 (스토어 캐시 없음)
 * - Settings: PT 횟수 (공유)
 */
async function preloadMemberData(auth) {
  const reservationsStore = useReservationsStore()
  const ptSessionsStore = usePtSessionsStore()

  // 1단계: trainerId 불필요한 데이터 병렬 로드
  const [, , trainerResult] = await Promise.allSettled([
    reservationsStore.loadReservations('member'),   // Home, Schedule 공통
    ptSessionsStore.loadMemberOwnPtCount(),          // Home, Settings 공통
    getActiveTrainerId(auth.user.id),                // 연결된 트레이너 조회
  ])

  // 2단계: 트레이너 연결 시 관련 데이터 추가 로드
  const trainerId = trainerResult.status === 'fulfilled' ? trainerResult.value : null
  if (!trainerId) return

  const month = getCurrentMonthKey()
  const workHoursStore = useWorkHoursStore()
  const scheduleOverridesStore = useScheduleOverridesStore()

  await Promise.allSettled([
    workHoursStore.loadWorkHours(trainerId),                  // Schedule: 트레이너 근무시간
    scheduleOverridesStore.loadOverrides(trainerId, month),   // Schedule: 월별 오버라이드
  ])
}
