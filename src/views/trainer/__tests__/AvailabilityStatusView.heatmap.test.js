import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import AvailabilityStatusView from '../AvailabilityStatusView.vue'

vi.mock('@/composables/useMembers', () => ({
  useMembers: () => ({
    members: ref([
      { id: 'm1', name: '김회원', photo_url: null },
      { id: 'm2', name: '이회원', photo_url: null },
      { id: 'm3', name: '박회원', photo_url: null },
    ]),
    fetchMembers: vi.fn().mockResolvedValue(undefined),
    loading: ref(false),
    error: ref(null),
  })
}))

vi.mock('@/composables/useAvailability', () => ({
  useAvailability: () => ({
    fetchMemberAvailabilities: vi.fn().mockResolvedValue([
      {
        member_id: 'm1', name: '김회원', photo_url: null,
        available_slots: { mon: ['09:00', '10:00'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
        submitted_at: '2026-03-10'
      },
      {
        member_id: 'm2', name: '이회원', photo_url: null,
        available_slots: { mon: ['09:00'], tue: ['14:00'], wed: [], thu: [], fri: [], sat: [], sun: [] },
        submitted_at: '2026-03-10'
      },
      {
        member_id: 'm3', name: '박회원', photo_url: null,
        available_slots: null,
        submitted_at: null
      },
    ]),
    loading: ref(false),
    error: ref(null),
  })
}))

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({ createNotification: vi.fn().mockResolvedValue(true) })
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ showToast: vi.fn(), showSuccess: vi.fn() })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { id: 'trainer-1' } })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ back: vi.fn() })
}))

const AppBottomSheetStub = {
  name: 'AppBottomSheet',
  props: ['modelValue', 'title'],
  emits: ['update:modelValue'],
  template: '<div v-if="modelValue" class="bottom-sheet-stub" :data-title="title"><slot /></div>',
}

describe('AvailabilityStatusView 히트맵', () => {
  let wrapper

  beforeEach(async () => {
    wrapper = mount(AvailabilityStatusView, {
      global: {
        stubs: { AppBottomSheet: AppBottomSheetStub },
      }
    })
    await flushPromises()
  })

  it('히트맵 셀 112개 렌더링 (7요일 × 16시간)', () => {
    const cells = wrapper.findAll('.availability-status__heatmap-cell')
    expect(cells).toHaveLength(112)
  })

  it('요일 헤더 7개 렌더링', () => {
    const headers = wrapper.findAll('.availability-status__heatmap-header')
    expect(headers).toHaveLength(7)
  })

  it('시간 라벨 16개 렌더링', () => {
    const times = wrapper.findAll('.availability-status__heatmap-time')
    expect(times).toHaveLength(16)
  })

  it('미등록 배너 표시 (m3가 미등록)', () => {
    const banner = wrapper.find('.availability-status__pending-banner')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('미등록')
    expect(banner.text()).toContain('1명')
  })

  it('셀 클릭 시 바텀시트 오픈', async () => {
    expect(wrapper.find('.bottom-sheet-stub').exists()).toBe(false)
    const cells = wrapper.findAll('.availability-status__heatmap-cell')
    await cells[0].trigger('click')
    expect(wrapper.find('.bottom-sheet-stub').exists()).toBe(true)
  })

  it('mon/09:00 셀은 heat-1 클래스 (2명: m1, m2)', () => {
    const cells = wrapper.findAll('.availability-status__heatmap-cell')
    // TIME_SLOTS[3] = '09:00', DAY_ORDER[0] = 'mon'
    // 행 인덱스 3, 열 인덱스 0 -> 셀 인덱스 = 3*7 + 0 = 21
    const monIdx09 = 3 * 7 + 0
    expect(cells[monIdx09].classes()).toContain('availability-status__heatmap-cell--heat-1')
  })

  it('sun/06:00 셀은 heat-0 클래스 (0명)', () => {
    const cells = wrapper.findAll('.availability-status__heatmap-cell')
    // TIME_SLOTS[0] = '06:00', DAY_ORDER[6] = 'sun'
    // 행 인덱스 0, 열 인덱스 6 -> 셀 인덱스 = 0*7 + 6 = 6
    const sunIdx06 = 0 * 7 + 6
    expect(cells[sunIdx06].classes()).toContain('availability-status__heatmap-cell--heat-0')
  })
})
