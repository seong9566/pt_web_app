import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkHours } from '@/composables/useWorkHours'

const mockEnv = vi.hoisted(() => {
  const authStore = { user: { id: 'trainer-1' } }
  return {
    authStore,
    supabase: { from: vi.fn() },
  }
})

vi.mock('@/stores/auth', () => ({ useAuthStore: () => mockEnv.authStore }))
vi.mock('@/lib/supabase', () => ({ supabase: mockEnv.supabase }))

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    in: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return builder
}

describe('useWorkHours', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchWorkHours DB 데이터 없으면 기본값(7요일 모두 disabled, 09:00-18:00)을 설정한다', async () => {
    const builder = createBuilder()
    builder.order.mockResolvedValue({ data: [], error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchWorkHours, days, selectedUnit } = useWorkHours()
    await fetchWorkHours()

    expect(days.value).toHaveLength(7)
    expect(days.value.every(d => d.enabled === false)).toBe(true)
    expect(days.value[0].id).toBe('mon')
    expect(days.value[0].start).toBe('09:00')
    expect(days.value[0].end).toBe('18:00')
    expect(selectedUnit.value).toBe(60)
  })

  it('fetchWorkHours DB 데이터 있으면 selectedUnit을 slot_duration_minutes로 설정한다', async () => {
    const builder = createBuilder()
    builder.order.mockResolvedValue({
      data: [{
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '18:00:00',
        is_enabled: true,
        slot_duration_minutes: 30,
      }],
      error: null,
    })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchWorkHours, selectedUnit } = useWorkHours()
    await fetchWorkHours()

    expect(selectedUnit.value).toBe(30)
  })

  it('saveWorkHours는 DAY_ID_TO_NUM 변환 후 upsert를 호출하고 true를 반환한다', async () => {
    const builder = createBuilder()
    builder.upsert.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { saveWorkHours } = useWorkHours()
    const daysList = [{ id: 'mon', label: '월요일', enabled: true, start: '09:00', end: '18:00' }]
    const result = await saveWorkHours(daysList, 60)

    expect(result).toBe(true)
    expect(builder.upsert).toHaveBeenCalledWith(
      [{ trainer_id: 'trainer-1', day_of_week: 1, start_time: '09:00', end_time: '18:00', is_enabled: true, slot_duration_minutes: 60 }],
      { onConflict: 'trainer_id,day_of_week' }
    )
  })
})
