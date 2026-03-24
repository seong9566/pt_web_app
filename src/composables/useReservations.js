/**
 * 예약 관리 컴포저블
 *
 * 예약 가능 시간 슬롯 계산,
 * 예약 목록 조회, 상태 변경, 트레이너 연결 확인 기능 제공.
 */

import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'

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
  const noSlotsReason = ref(null) // 'holiday' | 'non-working-day' | 'no-schedule' | null

  async function refreshReservationsStore() {
    const store = useReservationsStore()
    store.invalidate()
    if (auth.role === 'trainer' || auth.role === 'member') {
      await store.loadReservations(auth.role, true)
    }
  }

  /** 특정 트레이너의 특정 날짜 예약 가능 시간 슬롯 조회 */
  async function fetchAvailableSlots(trainerId, dateStr) {
    loading.value = true
    error.value = null
    noSlotsReason.value = null

    try {
      if (!trainerId || !dateStr) {
        slots.value = resetSlots()
        return slots.value
      }

      const dayOfWeek = getDayOfWeek(dateStr)

      // 1 RTT: 휴일 여부, 업무 오버라이드, 기본 스케줄을 병렬 조회
      const [holidayResult, workOverrideResult, baseScheduleResult] = await Promise.allSettled([
        // 휴일 확인 (daily_schedule_overrides에서 is_working=false인 레코드)
        supabase
          .from('daily_schedule_overrides')
          .select('id')
          .eq('trainer_id', trainerId)
          .eq('date', dateStr)
          .eq('is_working', false)
          .maybeSingle(),
        // 업무 오버라이드 확인 (daily_schedule_overrides에서 is_working=true인 레코드)
        supabase
          .from('daily_schedule_overrides')
          .select('is_working, start_time, end_time')
          .eq('trainer_id', trainerId)
          .eq('date', dateStr)
          .eq('is_working', true)
          .maybeSingle(),
        // 기본 스케줄 조회 (work_schedules)
        supabase
          .from('work_schedules')
          .select('start_time, end_time, slot_duration_minutes')
          .eq('trainer_id', trainerId)
          .eq('day_of_week', dayOfWeek)
          .eq('is_enabled', true)
          .maybeSingle(),
      ])

      // 휴일이면 즉시 빈 슬롯 반환 (에러는 무시 — 기존 동작 유지)
      const holidayData = holidayResult.status === 'fulfilled' ? holidayResult.value?.data : null
      if (holidayData) {
        noSlotsReason.value = 'holiday'
        slots.value = resetSlots()
        return slots.value
      }

      // 업무 오버라이드 결과 처리
      if (workOverrideResult.status === 'rejected') {
        throw workOverrideResult.reason
      }
      const { data: workOverride, error: workOverrideError } = workOverrideResult.value
      if (workOverrideError) throw workOverrideError

      // 기본 스케줄 결과 처리
      if (baseScheduleResult.status === 'rejected') {
        throw baseScheduleResult.reason
      }
      const { data: baseSchedule, error: baseScheduleError } = baseScheduleResult.value
      if (baseScheduleError) throw baseScheduleError

      let effectiveSchedule = null

      if (workOverride && workOverride.start_time && workOverride.end_time) {
        // 오버라이드 시간 + 기본 스케줄의 슬롯 단위 조합
        effectiveSchedule = {
          start_time: workOverride.start_time,
          end_time: workOverride.end_time,
          slot_duration_minutes: baseSchedule?.slot_duration_minutes ?? 60,
        }
      }

      if (!effectiveSchedule) {
        if (!baseSchedule) {
          noSlotsReason.value = 'non-working-day'
          slotDuration.value = 60
          slots.value = resetSlots()
          return slots.value
        }

        effectiveSchedule = baseSchedule
      }

      const duration = effectiveSchedule.slot_duration_minutes ?? 60
      slotDuration.value = duration

      const startMinutes = toMinutes(effectiveSchedule.start_time)
      const endMinutes = toMinutes(effectiveSchedule.end_time)
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
        .select('start_time, end_time, status')
        .eq('trainer_id', trainerId)
        .eq('date', dateStr)
        .in('status', ['scheduled'])

      if (bookedError) throw bookedError

      const normalized = generatedSlots.map((slot) => {
        const slotStartMinutes = toMinutes(slot.start)
        const slotEndMinutes = toMinutes(slot.end)

        const overlapping = (bookedRows ?? []).filter((row) => {
          const rStart = toMinutes(row.start_time)
          const rEnd = toMinutes(row.end_time)
          return slotStartMinutes < rEnd && rStart < slotEndMinutes
        })

        const scheduledCount = overlapping.length

        let status = '가능'
        if (scheduledCount > 0) {
          status = '배정됨'
        }

        return {
          label: slot.label,
          val: slot.val,
          status,
          scheduledCount,
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

      // 슬롯이 비어있으면 no-schedule 설정
      if (slots.value.am.length === 0 && slots.value.pm.length === 0 && slots.value.evening.length === 0) {
        noSlotsReason.value = 'no-schedule'
      }

      return slots.value
    } catch (e) {
      error.value = e?.message ?? '예약 가능 시간을 불러오지 못했습니다'
      slots.value = resetSlots()
      return slots.value
    } finally {
      loading.value = false
    }
  }

  /** 트레이너가 회원에게 일정을 배정 */
  async function assignSchedule(memberId, dateStr, startTime) {
    loading.value = true
    error.value = null

    try {
      if (!auth.user?.id) {
        throw new Error('로그인이 필요합니다.')
      }

      const duration = slotDuration.value ?? 60
      const endTime = addMinutes(startTime, duration)

      const { data, error: rpcError } = await supabase.rpc('assign_schedule', {
        p_trainer_id: auth.user.id,
        p_member_id: memberId,
        p_date: dateStr,
        p_start_time: startTime,
        p_end_time: endTime,
      })

      if (rpcError) throw rpcError
      await refreshReservationsStore()
      return data
    } catch (e) {
      const ERROR_MESSAGES = {
        'Reservation time slot is already booked': '해당 시간은 이미 예약이 확정되었습니다. 다른 시간을 선택해주세요.',
        'Already requested this time slot': '해당 시간에는 이미 일정이 배정되었습니다.',
        'No active trainer-member connection': '트레이너와의 연결이 활성화되지 않았습니다.',
        'End time must be later than start time': '예약 시간이 올바르지 않습니다.',
      }
      error.value = ERROR_MESSAGES[e?.message] ?? e?.message ?? '일정 배정에 실패했습니다'
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

      const reservationsStore = useReservationsStore()
      const { reservations: storeReservations } = storeToRefs(reservationsStore)
      await reservationsStore.loadReservations(role, false)
      reservations.value = storeReservations.value

      return reservations.value
    } catch (e) {
      error.value = e?.message ?? '예약 목록을 불러오지 못했습니다'
      return reservations.value
    } finally {
      loading.value = false
    }
  }

  /** 예약 상태 변경 (하위 호환용) */
  async function updateReservationStatus(reservationId, newStatus) {
    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId)

      if (updateError) throw updateError
      await refreshReservationsStore()
      return true
    } catch (e) {
      error.value = e?.message ?? '예약 상태 변경에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }


  /** 회원이 일정 변경 요청 */
  async function requestChange(reservationId, reasonOrOptions = {}) {
    const options = typeof reasonOrOptions === 'string' ? { reason: reasonOrOptions } : (reasonOrOptions || {})
    const { reason, requestedDate, requestedStartTime, requestedEndTime } = options
    loading.value = true
    error.value = null

    try {
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('trainer_id')
        .eq('id', reservationId)
        .maybeSingle()

      if (reservationError) throw reservationError
      if (!reservation?.trainer_id) {
        throw new Error('예약 정보를 찾을 수 없습니다.')
      }

      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'change_requested',
          change_reason: reason || null,
          requested_date: requestedDate || null,
          requested_start_time: requestedStartTime || null,
          requested_end_time: requestedEndTime || null,
        })
        .eq('id', reservationId)

      if (updateError) throw updateError

      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: reservation.trainer_id,
        type: 'change_requested',
        title: '일정 변경 요청',
        body: requestedDate
          ? `회원이 ${requestedDate} ${requestedStartTime}으로 변경을 요청했습니다.`
          : '회원이 일정 변경을 요청했습니다.',
        target_id: reservationId,
        target_type: 'reservation',
      })

      if (notificationError) throw notificationError

      await refreshReservationsStore()
      return true
    } catch (e) {
      error.value = e?.message ?? '일정 변경 요청에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 트레이너가 회원의 일정 변경 요청 승인 */
  async function approveChangeRequest(reservationId) {
    loading.value = true
    error.value = null

    try {
      const { error: rpcError } = await supabase.rpc('approve_change_request', {
        p_reservation_id: reservationId,
      })

      if (rpcError) throw rpcError

      await refreshReservationsStore()
      return true
    } catch (e) {
      const ERROR_MESSAGES = {
        'Reservation not found': '예약 정보를 찾을 수 없습니다.',
        'Reservation is not in change_requested status': '변경 요청 상태가 아닙니다.',
        'No change request data': '변경 요청 시간 정보가 없습니다.',
        'No active trainer-member connection': '트레이너와의 연결이 활성화되지 않았습니다.',
        'Time slot conflict: another session exists at this time': '해당 시간에 이미 다른 일정이 있습니다.',
      }
      error.value = ERROR_MESSAGES[e?.message] ?? e?.message ?? '변경 요청 승인에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 트레이너가 회원의 일정 변경 요청 거절 */
  async function rejectChangeRequest(reservationId, rejectionReason) {
    loading.value = true
    error.value = null

    try {
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('member_id')
        .eq('id', reservationId)
        .maybeSingle()

      if (reservationError) throw reservationError
      if (!reservation?.member_id) {
        throw new Error('예약 정보를 찾을 수 없습니다.')
      }

      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'scheduled',
          rejection_reason: rejectionReason || null,
          change_reason: null,
          requested_date: null,
          requested_start_time: null,
          requested_end_time: null,
        })
        .eq('id', reservationId)

      if (updateError) throw updateError

      // 변경 거절 알림 (non-blocking)
      try {
        await supabase.from('notifications').insert({
          user_id: reservation.member_id,
          type: 'reservation_rejected',
          title: '일정 변경 거절',
          body: `변경 요청이 거절되었습니다${rejectionReason ? ': ' + rejectionReason : '.'}`,
          target_id: reservationId,
          target_type: 'reservation',
        })
      } catch (notifErr) {
        console.warn('변경 거절 알림 생성 실패:', notifErr?.message)
      }

      await refreshReservationsStore()
      return true
    } catch (e) {
      error.value = e?.message ?? '변경 요청 거절에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 회원이 본인의 일정 변경 요청 취소 */
  async function cancelChangeRequest(reservationId) {
    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'scheduled',
          requested_date: null,
          requested_start_time: null,
          requested_end_time: null,
          change_reason: null,
        })
        .eq('id', reservationId)

      if (updateError) throw updateError

      await refreshReservationsStore()
      return true
    } catch (e) {
      error.value = e?.message ?? '변경 요청 취소에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 트레이너가 기존 일정을 취소 후 재배정 */
  async function reassignSchedule(reservationId, newDate, newStartTime) {
    loading.value = true
    error.value = null

    try {
      const { error: rpcError } = await supabase.rpc('reassign_schedule', {
        p_reservation_id: reservationId,
        p_new_date: newDate,
        p_new_start_time: newStartTime,
      })

      if (rpcError) throw rpcError

      await refreshReservationsStore()
      return true
    } catch (e) {
      const ERROR_MESSAGES = {
        'Reservation not found': '예약 정보를 찾을 수 없습니다.',
        'Reservation is not in an active status': '재배정할 수 없는 예약 상태입니다.',
        'No active trainer-member connection': '트레이너와의 연결이 활성화되지 않았습니다.',
        'Time slot conflict: another session exists at this time': '해당 시간에 이미 다른 일정이 있습니다.',
      }
      error.value = ERROR_MESSAGES[e?.message] ?? e?.message ?? '일정 재배정에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 일정 취소 */
  async function cancelSchedule(reservationId) {
    loading.value = true
    error.value = null

    try {
      // 예약 정보 조회 (알림 수신자 결정용)
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('trainer_id, member_id')
        .eq('id', reservationId)
        .maybeSingle()

      if (fetchError) throw fetchError

      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)

      if (updateError) throw updateError

      // 취소 알림 (non-blocking)
      if (reservation) {
        const isTrainer = auth.user?.id === reservation.trainer_id
        const recipientId = isTrainer ? reservation.member_id : reservation.trainer_id
        const notifBody = isTrainer
          ? '트레이너가 PT 일정을 취소했습니다.'
          : '회원이 PT 일정을 취소했습니다.'

        try {
          await supabase.from('notifications').insert({
            user_id: recipientId,
            type: 'reservation_cancelled',
            title: '일정 취소',
            body: notifBody,
            target_id: reservationId,
            target_type: 'reservation',
          })
        } catch (notifErr) {
          console.warn('취소 알림 생성 실패:', notifErr?.message)
        }
      }

      await refreshReservationsStore()
      return true
    } catch (e) {
      error.value = e?.message ?? '일정 취소에 실패했습니다'
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
      return Math.max(0, (data || []).reduce((sum, s) => sum + s.change_amount, 0))
    } catch {
      return 0
    }
  }

  /**
   * 승인 되돌리기 — change_requested 상태로 복원 (Undo용)
   * @param {string} reservationId - 예약 ID
   * @param {Object} originalData - 승인 전 원본 데이터
   */
  async function revertApproval(reservationId, originalData) {
    try {
      // 현재 상태가 scheduled일 때만 복원 (다른 상태로 변경된 경우 방어)
      const { error: err, count } = await supabase
        .from('reservations')
        .update({
          status: 'change_requested',
          requested_date: originalData.requested_date,
          requested_start_time: originalData.requested_start_time,
          requested_end_time: originalData.requested_end_time,
          change_reason: originalData.change_reason,
          date: originalData.date,
          start_time: originalData.start_time,
          end_time: originalData.end_time,
        })
        .eq('id', reservationId)
        .eq('status', 'scheduled')

      if (err) {
        error.value = '승인 취소에 실패했습니다.'
        return false
      }
      return true
    } catch (e) {
      error.value = '승인 취소에 실패했습니다.'
      return false
    }
  }

  return {
    slots,
    reservations,
    loading,
    error,
    slotDuration,
    noSlotsReason,
    fetchAvailableSlots,
    assignSchedule,
    fetchMyReservations,
    updateReservationStatus,
    requestChange,
    approveChangeRequest,
    rejectChangeRequest,
    cancelChangeRequest,
    reassignSchedule,
    cancelSchedule,
    revertApproval,
    checkTrainerConnection,
    getConnectedTrainerId,
    checkPtCount,
  }
}
