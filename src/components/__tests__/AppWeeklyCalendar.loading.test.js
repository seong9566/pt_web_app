import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AppWeeklyCalendar from '@/components/AppWeeklyCalendar.vue'

const defaultProps = {
  schedules: [],
  workSchedule: { startTime: '09:00', endTime: '18:00', slotDuration: 60 },
  holidays: [],
  currentWeekStart: '2026-03-16',
  role: 'trainer',
  availabilities: [],
  draggable: false,
}

const validSchedule = {
  id: 'sched-1',
  date: '2026-03-16',
  start_time: '09:00',
  end_time: '10:00',
  status: 'scheduled',
  member_name: '김회원',
  trainer_name: '이트레이너',
}

describe('AppWeeklyCalendar Loading State', () => {
  let wrapper

  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()
  })

  it('loading=true, schedules=[] → empty-text 없음, loading-overlay 존재', async () => {
    wrapper = mount(AppWeeklyCalendar, {
      props: { ...defaultProps, loading: true, schedules: [] },
    })

    const emptyText = wrapper.find('.weekly-calendar__empty-text')
    const loadingOverlay = wrapper.find('.weekly-calendar__loading-overlay')

    expect(emptyText.exists()).toBe(false)
    expect(loadingOverlay.exists()).toBe(true)
  })

  it('loading=false, schedules=[] → empty-text 존재, 텍스트 "이번 주 일정이 없습니다"', async () => {
    wrapper = mount(AppWeeklyCalendar, {
      props: { ...defaultProps, loading: false, schedules: [] },
    })

    const emptyText = wrapper.find('.weekly-calendar__empty-text')
    const loadingOverlay = wrapper.find('.weekly-calendar__loading-overlay')

    expect(emptyText.exists()).toBe(true)
    expect(emptyText.text()).toBe('이번 주 일정이 없습니다')
    expect(loadingOverlay.exists()).toBe(false)
  })

  it('loading=false, schedules=[valid] → 스케줄 블록 렌더링, empty-text 없음, overlay 없음', async () => {
    wrapper = mount(AppWeeklyCalendar, {
      props: { ...defaultProps, loading: false, schedules: [validSchedule] },
    })

    const blocks = wrapper.findAll('.weekly-calendar__block')
    const emptyText = wrapper.find('.weekly-calendar__empty-text')
    const loadingOverlay = wrapper.find('.weekly-calendar__loading-overlay')

    expect(blocks.length).toBeGreaterThan(0)
    expect(emptyText.exists()).toBe(false)
    expect(loadingOverlay.exists()).toBe(false)
  })

  it('loading=true, schedules=[valid] → 스케줄 블록 존재 (stale), overlay 존재', async () => {
    wrapper = mount(AppWeeklyCalendar, {
      props: { ...defaultProps, loading: true, schedules: [validSchedule] },
    })

    const blocks = wrapper.findAll('.weekly-calendar__block')
    const loadingOverlay = wrapper.find('.weekly-calendar__loading-overlay')

    expect(blocks.length).toBeGreaterThan(0)
    expect(loadingOverlay.exists()).toBe(true)
  })

  it('loading prop 미전달 → default false, schedules=[]일 때 empty-text 표시', async () => {
    wrapper = mount(AppWeeklyCalendar, {
      props: { ...defaultProps, schedules: [] },
      // loading prop 미전달 → default false
    })

    const emptyText = wrapper.find('.weekly-calendar__empty-text')
    const loadingOverlay = wrapper.find('.weekly-calendar__loading-overlay')

    expect(emptyText.exists()).toBe(true)
    expect(emptyText.text()).toBe('이번 주 일정이 없습니다')
    expect(loadingOverlay.exists()).toBe(false)
  })

  it('aria-busy 바인딩 → loading=true이면 "true", setProps(loading=false) 후 "false"', async () => {
    wrapper = mount(AppWeeklyCalendar, {
      props: { ...defaultProps, loading: true },
    })

    const section = wrapper.find('.weekly-calendar')
    expect(section.attributes('aria-busy')).toBe('true')

    await wrapper.setProps({ loading: false })

    expect(section.attributes('aria-busy')).toBe('false')
  })
})
