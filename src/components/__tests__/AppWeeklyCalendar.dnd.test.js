import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AppWeeklyCalendar from '@/components/AppWeeklyCalendar.vue'

const defaultProps = {
  schedules: [
    {
      id: 'sched-1',
      date: '2026-03-16',
      start_time: '09:00',
      end_time: '10:00',
      status: 'scheduled',
      member_name: '김회원',
      trainer_name: '이트레이너',
    },
  ],
  workSchedule: { startTime: '09:00', endTime: '18:00', slotDuration: 60 },
  holidays: [],
  currentWeekStart: '2026-03-16',
  role: 'trainer',
  availabilities: [],
  draggable: true,
}

describe('AppWeeklyCalendar DnD State Machine', () => {
  let wrapper

  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()

    wrapper = mount(AppWeeklyCalendar, {
      props: defaultProps,
    })
  })

  it('draggable=false일 때 pointerdown 무시 → dndState idle 유지', async () => {
    wrapper = mount(AppWeeklyCalendar, {
      props: { ...defaultProps, draggable: false },
    })

    const blockButton = wrapper.find('.weekly-calendar__block')
    expect(blockButton.exists()).toBe(true)

    await blockButton.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(wrapper.vm.dndState).toBe('idle')
  })

  it('completed 상태 블록 드래그 불가 → dndState idle 유지', async () => {
    wrapper = mount(AppWeeklyCalendar, {
      props: {
        ...defaultProps,
        schedules: [
          {
            id: 'sched-completed',
            date: '2026-03-16',
            start_time: '09:00',
            end_time: '10:00',
            status: 'completed',
            member_name: '김회원',
            trainer_name: '이트레이너',
          },
        ],
      },
    })

    const blockButton = wrapper.find('.weekly-calendar__block')
    expect(blockButton.exists()).toBe(true)

    await blockButton.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(wrapper.vm.dndState).toBe('idle')
  })

  it('cancelled 상태 블록 드래그 불가 → dndState idle 유지', async () => {
    wrapper = mount(AppWeeklyCalendar, {
      props: {
        ...defaultProps,
        schedules: [
          {
            id: 'sched-cancelled',
            date: '2026-03-16',
            start_time: '09:00',
            end_time: '10:00',
            status: 'cancelled',
            member_name: '김회원',
            trainer_name: '이트레이너',
          },
        ],
      },
    })

    const blockButton = wrapper.find('.weekly-calendar__block')
    expect(blockButton.exists()).toBe(true)

    await blockButton.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(wrapper.vm.dndState).toBe('idle')
  })

  it('pointerdown → pressing 상태 전이', async () => {
    const blockButton = wrapper.find('.weekly-calendar__block')
    expect(blockButton.exists()).toBe(true)

    await blockButton.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(wrapper.vm.dndState).toBe('pressing')
    expect(wrapper.vm.dragSchedule).not.toBeNull()
    expect(wrapper.vm.dragSchedule.id).toBe('sched-1')
  })

  it('pressing 중 5px 이상 이동 → idle 복귀', async () => {
    const blockButton = wrapper.find('.weekly-calendar__block')

    await blockButton.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(wrapper.vm.dndState).toBe('pressing')

    const gridWrapper = wrapper.find('.weekly-calendar__grid-wrapper')
    await gridWrapper.trigger('pointermove', {
      clientX: 106,
      clientY: 100,
      pointerId: 1,
    })

    expect(wrapper.vm.dndState).toBe('idle')
  })

  it('pointercancel → idle 복귀', async () => {
    const blockButton = wrapper.find('.weekly-calendar__block')

    await blockButton.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    expect(wrapper.vm.dndState).toBe('pressing')

    const gridWrapper = wrapper.find('.weekly-calendar__grid-wrapper')
    await gridWrapper.trigger('pointercancel', {
      pointerId: 1,
    })

    expect(wrapper.vm.dndState).toBe('idle')
    expect(wrapper.vm.dragSchedule).toBeNull()
  })

  it('schedule-drop emit 페이로드 검증', async () => {
    const blockButton = wrapper.find('.weekly-calendar__block')

    await blockButton.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    await new Promise(resolve => setTimeout(resolve, 350))

    expect(wrapper.vm.dndState).toBe('dragging')

    wrapper.vm.dropTarget = { date: '2026-03-17', time: '10:00' }

    const gridWrapper = wrapper.find('.weekly-calendar__grid-wrapper')
    await gridWrapper.trigger('pointerup', {
      pointerId: 1,
    })

    expect(wrapper.emitted('schedule-drop')).toBeTruthy()
    const emittedPayload = wrapper.emitted('schedule-drop')[0][0]

    expect(emittedPayload).toHaveProperty('scheduleId', 'sched-1')
    expect(emittedPayload).toHaveProperty('fromDate', '2026-03-16')
    expect(emittedPayload).toHaveProperty('fromTime', '09:00')
    expect(emittedPayload).toHaveProperty('toDate', '2026-03-17')
    expect(emittedPayload).toHaveProperty('toTime', '10:00')
  })

  it('같은 슬롯 드롭 차단 → schedule-drop 미발생', async () => {
    const blockButton = wrapper.find('.weekly-calendar__block')

    await blockButton.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    await new Promise(resolve => setTimeout(resolve, 350))

    expect(wrapper.vm.dndState).toBe('dragging')

    wrapper.vm.dropTarget = null

    const gridWrapper = wrapper.find('.weekly-calendar__grid-wrapper')
    await gridWrapper.trigger('pointerup', {
      pointerId: 1,
    })

    expect(wrapper.emitted('schedule-drop')).toBeFalsy()
  })

  it('드롭 타겟 없이 pointerup → schedule-drop 미발생', async () => {
    const blockButton = wrapper.find('.weekly-calendar__block')

    await blockButton.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })

    await new Promise(resolve => setTimeout(resolve, 350))

    expect(wrapper.vm.dndState).toBe('dragging')

    wrapper.vm.dropTarget = null

    const gridWrapper = wrapper.find('.weekly-calendar__grid-wrapper')
    await gridWrapper.trigger('pointerup', {
      pointerId: 1,
    })

    expect(wrapper.emitted('schedule-drop')).toBeFalsy()
    expect(wrapper.vm.dndState).toBe('idle')
  })
})
