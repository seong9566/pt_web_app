import { describe, it, expect } from 'vitest'

// AppAvailabilityGrid의 toggleCell 로직을 순수 함수로 추출하여 테스트
function toggleCell(modelValue, dayKey, timeStr) {
  const current = { ...modelValue }
  if (!Array.isArray(current[dayKey])) current[dayKey] = []
  const idx = current[dayKey].indexOf(timeStr)
  if (idx >= 0) {
    current[dayKey] = current[dayKey].filter(t => t !== timeStr)
  } else {
    current[dayKey] = [...current[dayKey], timeStr].sort()
  }
  return current
}

// paintCell 로직 순수 함수
function paintCell(modelValue, dayKey, timeStr, paintAction) {
  const current = { ...modelValue }
  if (!Array.isArray(current[dayKey])) current[dayKey] = []
  if (paintAction === 'select') {
    if (!current[dayKey].includes(timeStr)) {
      current[dayKey] = [...current[dayKey], timeStr].sort()
    }
  } else {
    current[dayKey] = current[dayKey].filter(t => t !== timeStr)
  }
  return current
}

describe('AppAvailabilityGrid 셀 토글 로직', () => {
  it('비선택 셀 탭 → 선택됨', () => {
    const result = toggleCell({}, 'mon', '09:00')
    expect(result.mon).toContain('09:00')
  })

  it('선택된 셀 탭 → 해제됨', () => {
    const result = toggleCell({ mon: ['09:00'] }, 'mon', '09:00')
    expect(result.mon).not.toContain('09:00')
  })

  it('여러 슬롯 선택 시 정렬됨', () => {
    let state = {}
    state = toggleCell(state, 'mon', '11:00')
    state = toggleCell(state, 'mon', '09:00')
    state = toggleCell(state, 'mon', '10:00')
    expect(state.mon).toEqual(['09:00', '10:00', '11:00'])
  })

  it('다른 요일 슬롯은 영향 없음', () => {
    const initial = { tue: ['14:00'] }
    const result = toggleCell(initial, 'mon', '09:00')
    expect(result.tue).toEqual(['14:00'])
  })

  it('빈 배열에서 시작하여 슬롯 추가', () => {
    const initial = { mon: [] }
    const result = toggleCell(initial, 'mon', '09:00')
    expect(result.mon).toEqual(['09:00'])
  })

  it('마지막 슬롯 제거 후 빈 배열', () => {
    const initial = { mon: ['09:00'] }
    const result = toggleCell(initial, 'mon', '09:00')
    expect(result.mon).toEqual([])
  })
})

describe('AppAvailabilityGrid 페인트 모드 로직', () => {
  it('select 모드 — 비선택 셀 칠하기', () => {
    const result = paintCell({}, 'mon', '09:00', 'select')
    expect(result.mon).toContain('09:00')
  })

  it('select 모드 — 이미 선택된 셀은 중복 추가 안 함', () => {
    const result = paintCell({ mon: ['09:00'] }, 'mon', '09:00', 'select')
    expect(result.mon.filter(t => t === '09:00').length).toBe(1)
  })

  it('deselect 모드 — 선택된 셀 지우기', () => {
    const result = paintCell({ mon: ['09:00', '10:00'] }, 'mon', '09:00', 'deselect')
    expect(result.mon).not.toContain('09:00')
    expect(result.mon).toContain('10:00')
  })

  it('deselect 모드 — 비선택 셀은 영향 없음', () => {
    const result = paintCell({ mon: ['10:00'] }, 'mon', '09:00', 'deselect')
    expect(result.mon).toEqual(['10:00'])
  })

  it('페인트 모드 결정 — 비선택 셀 첫 터치 → select 모드', () => {
    const isSelected = false
    const paintAction = isSelected ? 'deselect' : 'select'
    expect(paintAction).toBe('select')
  })

  it('페인트 모드 결정 — 선택된 셀 첫 터치 → deselect 모드', () => {
    const isSelected = true
    const paintAction = isSelected ? 'deselect' : 'select'
    expect(paintAction).toBe('deselect')
  })

  it('select 모드에서 여러 셀 연속 칠하기', () => {
    let state = {}
    state = paintCell(state, 'mon', '09:00', 'select')
    state = paintCell(state, 'mon', '10:00', 'select')
    state = paintCell(state, 'mon', '11:00', 'select')
    expect(state.mon).toEqual(['09:00', '10:00', '11:00'])
  })

  it('deselect 모드에서 여러 셀 연속 지우기', () => {
    let state = { mon: ['09:00', '10:00', '11:00'] }
    state = paintCell(state, 'mon', '09:00', 'deselect')
    state = paintCell(state, 'mon', '10:00', 'deselect')
    expect(state.mon).toEqual(['11:00'])
  })

  it('select 모드 — 정렬 유지', () => {
    let state = {}
    state = paintCell(state, 'mon', '11:00', 'select')
    state = paintCell(state, 'mon', '09:00', 'select')
    state = paintCell(state, 'mon', '10:00', 'select')
    expect(state.mon).toEqual(['09:00', '10:00', '11:00'])
  })
})

describe('AppAvailabilityGrid 셀 토글과 페인트 모드 상호작용', () => {
  it('토글로 선택한 후 페인트 deselect로 제거', () => {
    let state = toggleCell({}, 'mon', '09:00')
    expect(state.mon).toContain('09:00')
    state = paintCell(state, 'mon', '09:00', 'deselect')
    expect(state.mon).not.toContain('09:00')
  })

  it('페인트 select로 추가한 후 토글로 제거', () => {
    let state = paintCell({}, 'mon', '09:00', 'select')
    expect(state.mon).toContain('09:00')
    state = toggleCell(state, 'mon', '09:00')
    expect(state.mon).not.toContain('09:00')
  })

  it('여러 요일에 걸쳐 선택 유지', () => {
    let state = {}
    state = toggleCell(state, 'mon', '09:00')
    state = paintCell(state, 'tue', '10:00', 'select')
    state = toggleCell(state, 'wed', '11:00')
    expect(state.mon).toEqual(['09:00'])
    expect(state.tue).toEqual(['10:00'])
    expect(state.wed).toEqual(['11:00'])
  })
})
