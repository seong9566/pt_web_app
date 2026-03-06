import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkoutPlans } from '@/composables/useWorkoutPlans'

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

describe('useWorkoutPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchWorkoutPlan은 member_id와 date로 필터링하여 currentPlan을 설정한다', async () => {
    const builder = createBuilder()
    builder.maybeSingle.mockResolvedValue({ data: { id: 'wp1', content: '스쿼트 3세트' }, error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchWorkoutPlan, currentPlan } = useWorkoutPlans()
    await fetchWorkoutPlan('member-1', '2026-03-01')

    expect(builder.eq).toHaveBeenCalledWith('member_id', 'member-1')
    expect(builder.eq).toHaveBeenCalledWith('date', '2026-03-01')
    expect(currentPlan.value.id).toBe('wp1')
  })

  it('fetchWorkoutPlan 결과가 없으면 currentPlan이 null이다', async () => {
    const builder = createBuilder()
    builder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchWorkoutPlan, currentPlan } = useWorkoutPlans()
    await fetchWorkoutPlan('member-1', '2026-03-01')

    expect(currentPlan.value).toBeNull()
  })

  it('saveWorkoutPlan은 upsert를 호출하고 성공 시 true를 반환한다', async () => {
    const upsertBuilder = createBuilder()
    const fetchBuilder = createBuilder()
    upsertBuilder.upsert.mockResolvedValue({ error: null })
    fetchBuilder.maybeSingle.mockResolvedValue({ data: { id: 'wp1' }, error: null })
    mockEnv.supabase.from
      .mockReturnValueOnce(upsertBuilder)
      .mockReturnValueOnce(fetchBuilder)

    const { saveWorkoutPlan } = useWorkoutPlans()
    const result = await saveWorkoutPlan('member-1', '2026-03-01', '스쿼트')

    expect(result).toBe(true)
    expect(upsertBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        trainer_id: 'trainer-1',
        member_id: 'member-1',
        date: '2026-03-01',
        content: '스쿼트',
      }),
      { onConflict: 'trainer_id,member_id,date' }
    )
  })

  it('saveWorkoutPlan DB 오류 시 false를 반환하고 error를 설정한다', async () => {
    const builder = createBuilder()
    builder.upsert.mockResolvedValue({ error: { message: '저장 실패' } })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { saveWorkoutPlan, error } = useWorkoutPlans()
    const result = await saveWorkoutPlan('member-1', '2026-03-01', '스쿼트')

    expect(result).toBe(false)
    expect(error.value).toBe('저장 실패')
  })

  it('deleteWorkoutPlan 성공 시 로컬 workoutPlans 배열에서 해당 id를 제거한다', async () => {
    const builder = createBuilder()
    builder.eq.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { workoutPlans, deleteWorkoutPlan } = useWorkoutPlans()
    workoutPlans.value = [{ id: 'wp1' }, { id: 'wp2' }]
    await deleteWorkoutPlan('wp1')

    expect(workoutPlans.value).toHaveLength(1)
    expect(workoutPlans.value[0].id).toBe('wp2')
  })
})
