/**
 * 예약 관리 컴포저블
 *
 * 예약 가능 시간 슬롯 계산, 예약 생성(RPC),
 * 예약 목록 조회, 상태 변경, 트레이너 연결 확인 기능 제공.
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/** 숫자를 2자리 문자열로 패딩 (예: 5 → '05') */
function pad2(value) {
  return String(value).padStart(2, '0')
}

/** HH:MM:SS → HH:MM 형식으로 변환 */
function trimSeconds(timeStr) {
  if (!timeStr) return '00:00'
  return timeStr.slice(0, 5)
}

/** HH:MM 형식을 분 단위로 변환 */
function toMinutes(timeStr) {
  const [hour, minute] = trimSeconds(timeStr).split(':').map(Number)
  return hour * 60 + minute
}

/** 분 단위를 HH:MM 형식으로 변환 */
function toTimeString(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  return `${pad2(hour)}:${pad2(minute)}`
}

/** 시간 문자열에 분 단위 시간 추가 */
function addMinutes(timeStr, minutesToAdd) {
  return toTimeString(toMinutes(timeStr) + minutesToAdd)
}

/** 예약 슬롯 초기화 (오전/오후/저녁 구분) */
function resetSlots() {
  return { am: [], pm: [], evening: [] }
}

/** YYYY-MM-DD 형식의 날짜에서 요일 번호(0-6) 반환 */
function getDayOfWeek(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  return localDate.getDay()
}

/** 예약 슬롯 및 예약 관리 */
export function useReservations() {
  const auth = useAuthStore()

  const slots = ref(resetSlots())
  const reservations = ref([])
  const loading = ref(false)
  const error = ref(null)
  const slotDuration = ref(60)

  /** 특정 트레이너의 특정 날짜 예약 가능 시간 슬롯 조회 */
  async function fetchAvailableSlots(trainerId, dateStr) {
    loading.value = true
    error.value = null

    try {
      if (!trainerId || !dateStr) {
        slots.value = resetSlots()
        return slots.value
      }

      // 휴일 확인
      const { data: holidayData } = await supabase
        .from('trainer_holidays')
        .select('id')
        .eq('trainer_id', trainerId)
        .eq('date', dateStr)
        .maybeSingle()
      if (holidayData) {
        slots.value = resetSlots()
        return slots.value
      }

      const dayOfWeek = getDayOfWeek(dateStr)
      const { data: schedule, error: scheduleError } = await supabase
        .from('work_schedules')
        .select('start_time, end_time, slot_duration_minutes')
        .eq('trainer_id', trainerId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_enabled', true)
        .maybeSingle()

      if (scheduleError) throw scheduleError

      if (!schedule) {
        slotDuration.value = 60
        slots.value = resetSlots()
        return slots.value
      }

      const duration = schedule.slot_duration_minutes ?? 60
      slotDuration.value = duration

      const startMinutes = toMinutes(schedule.start_time)
      const endMinutes = toMinutes(schedule.end_time)
      const generatedSlots = []

      for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
        const slotStart = toTimeString(current)
        const slotEnd = toTimeString(current + duration)
        generatedSlots.push({
          label: slotStart,
          val: slotStart,
          start: slotStart,
          end: slotEnd,
          status: '가능',
        })
      }

      const { data: bookedRows, error: bookedError } = await supabase
        .from('reservations')
        .select('start_time, end_time')
        .eq('trainer_id', trainerId)
        .eq('date', dateStr)
        .in('status', ['pending', 'approved'])

      if (bookedError) throw bookedError

      const bookedRanges = (bookedRows ?? []).map((row) => ({
        start: toMinutes(row.start_time),
        end: toMinutes(row.end_time),
      }))

      const normalized = generatedSlots.map((slot) => {
        const slotStartMinutes = toMinutes(slot.start)
        const slotEndMinutes = toMinutes(slot.end)

        const isBooked = bookedRanges.some(
          (range) => slotStartMinutes < range.end && range.start < slotEndMinutes
        )

        return {
          label: slot.label,
          val: slot.val,
          status: isBooked ? '마감' : '가능',
        }
      })

      slots.value = normalized.reduce(
        (acc, slot) => {
          const hour = Number(slot.val.slice(0, 2))
          if (hour < 12) {
            acc.am.push(slot)
          } else if (hour < 18) {
            acc.pm.push(slot)
          } else {
            acc.evening.push(slot)
          }
          return acc
        },
        { am: [], pm: [], evening: [] }
      )

      return slots.value
    } catch (e) {
      error.value = e?.message ?? '예약 가능 시간을 불러오지 못했습니다'
      slots.value = resetSlots()
      return slots.value
    } finally {
      loading.value = false
    }
  }

  /** 새로운 예약 생성 (RPC 호출) */
  async function createReservation(trainerId, dateStr, startTime, sessionType) {
    loading.value = true
    error.value = null

    try {
      const duration = slotDuration.value ?? 60
      const endTime = addMinutes(startTime, duration)

      const { data, error: rpcError } = await supabase.rpc('create_reservation', {
        p_trainer_id: trainerId,
        p_date: dateStr,
        p_start_time: startTime,
        p_end_time: endTime,
        p_session_type: sessionType,
      })

      if (rpcError) throw rpcError
      return data
    } catch (e) {
      error.value = e?.message ?? '예약 생성에 실패했습니다'
      return null
    } finally {
      loading.value = false
    }
  }

  /** 현재 사용자의 예약 목록 조회 (역할에 따라 trainer_id 또는 member_id 필터) */
  async function fetchMyReservations(role) {
    loading.value = true
    error.value = null

    try {
      if (!auth.user?.id) {
        reservations.value = []
        return reservations.value
      }

      const filterColumn = role === 'trainer' ? 'trainer_id' : 'member_id'
      const { data, error: fetchError } = await supabase
        .from('reservations')
        .select(`
          id,
          trainer_id,
          member_id,
          date,
          start_time,
          end_time,
          status,
          session_type,
          created_at,
          trainer_profile:trainer_id(name),
          member_profile:member_id(name)
        `)
        .eq(filterColumn, auth.user.id)
        .order('date', { ascending: false })
        .order('start_time', { ascending: true })

      if (fetchError) throw fetchError

      reservations.value = (data ?? []).map((item) => {
        const partnerName = role === 'trainer'
          ? item.member_profile?.name
          : item.trainer_profile?.name

        return {
          id: item.id,
          trainer_id: item.trainer_id,
          member_id: item.member_id,
          date: item.date,
          start_time: trimSeconds(item.start_time),
          end_time: trimSeconds(item.end_time),
          status: item.status,
          session_type: item.session_type,
          created_at: item.created_at,
          partner_name: partnerName ?? '이름 없음',
        }
      })

      return reservations.value
    } catch (e) {
      error.value = e?.message ?? '예약 목록을 불러오지 못했습니다'
      reservations.value = []
      return reservations.value
    } finally {
      loading.value = false
    }
  }

  /** 예약 상태 변경 (pending → approved → completed 등) */
  async function updateReservationStatus(reservationId, newStatus) {
    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId)

      if (updateError) throw updateError
      return true
    } catch (e) {
      error.value = e?.message ?? '예약 상태 변경에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 현재 회원이 활성 트레이너와 연결되어 있는지 확인 */
  async function checkTrainerConnection() {
    if (!auth.user?.id) return false
    try {
      const { data } = await supabase
        .from('trainer_members')
        .select('trainer_id')
        .eq('member_id', auth.user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()
      return !!data
    } catch {
      return false
    }
  }

  /** 현재 회원이 연결된 트레이너 ID 조회 */
  async function getConnectedTrainerId() {
    if (!auth.user?.id) return null
    try {
      const { data } = await supabase
        .from('trainer_members')
        .select('trainer_id')
        .eq('member_id', auth.user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()
      return data?.trainer_id ?? null
    } catch {
      return null
    }
  }

  /** 잔여 PT 횟수 확인 (예약 전 클라이언트 검증) */
  async function checkPtCount(trainerId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: err } = await supabase
        .from('pt_sessions')
        .select('change_amount')
        .eq('member_id', user.id)
        .eq('trainer_id', trainerId)
      if (err) return 0
      return (data || []).reduce((sum, s) => sum + s.change_amount, 0)
    } catch {
      return 0
    }
  }

  return {
    slots,
    reservations,
    loading,
    error,
    slotDuration,
    fetchAvailableSlots,
    createReservation,
    fetchMyReservations,
    updateReservationStatus,
    checkTrainerConnection,
    getConnectedTrainerId,
    checkPtCount,
  }
}
