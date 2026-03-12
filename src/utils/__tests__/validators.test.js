import { describe, it, expect } from 'vitest'
import { isValidPhone, formatPhone, isValidEmail, isValidAge, isValidHeight, isValidWeight } from '../validators'

describe('isValidPhone', () => {
  it('유효한 번호 — 010-1234-5678', () => {
    expect(isValidPhone('010-1234-5678')).toBe(true)
  })
  it('유효한 번호 — 010-9999-0000', () => {
    expect(isValidPhone('010-9999-0000')).toBe(true)
  })
  it('무효 — 02-1234-5678 (서울 번호)', () => {
    expect(isValidPhone('02-1234-5678')).toBe(false)
  })
  it('무효 — 01012345678 (하이픈 없음)', () => {
    expect(isValidPhone('01012345678')).toBe(false)
  })
  it('무효 — 010-12345-678 (자릿수 오류)', () => {
    expect(isValidPhone('010-12345-678')).toBe(false)
  })
  it('무효 — 빈 문자열', () => {
    expect(isValidPhone('')).toBe(false)
  })
  it('무효 — abc', () => {
    expect(isValidPhone('abc')).toBe(false)
  })
})

describe('formatPhone', () => {
  it('숫자만 입력 → 010-1234-5678', () => {
    expect(formatPhone('01012345678')).toBe('010-1234-5678')
  })
  it('공백 포함 → 포맷팅', () => {
    expect(formatPhone('010 1234 5678')).toBe('010-1234-5678')
  })
  it('하이픈 포함 → 재포맷팅', () => {
    expect(formatPhone('010-1234-5678')).toBe('010-1234-5678')
  })
  it('짧은 입력 → 그대로 반환', () => {
    expect(formatPhone('0101234')).toBe('0101234')
  })
  it('빈 문자열 → 빈 문자열', () => {
    expect(formatPhone('')).toBe('')
  })
  it('null/undefined → 빈 문자열', () => {
    expect(formatPhone(null)).toBe('')
    expect(formatPhone(undefined)).toBe('')
  })
})

describe('isValidEmail', () => {
  it('유효한 이메일', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name+tag@domain.co.kr')).toBe(true)
  })
  it('무효 — @ 없음', () => {
    expect(isValidEmail('notanemail')).toBe(false)
  })
  it('무효 — 도메인 없음', () => {
    expect(isValidEmail('test@')).toBe(false)
  })
  it('무효 — 공백 포함', () => {
    expect(isValidEmail('test @example.com')).toBe(false)
  })
  it('무효 — 빈 문자열', () => {
    expect(isValidEmail('')).toBe(false)
  })
})

describe('isValidAge', () => {
  it('빈 값 → true (선택 필드)', () => {
    expect(isValidAge('')).toBe(true)
    expect(isValidAge(null)).toBe(true)
    expect(isValidAge(undefined)).toBe(true)
  })
  it('유효 — 정상 범위 정수', () => {
    expect(isValidAge(25)).toBe(true)
    expect(isValidAge(14)).toBe(true)
    expect(isValidAge(100)).toBe(true)
    expect(isValidAge('30')).toBe(true)
  })
  it('무효 — 범위 밖', () => {
    expect(isValidAge(13)).toBe(false)
    expect(isValidAge(101)).toBe(false)
    expect(isValidAge(0)).toBe(false)
  })
  it('무효 — 음수', () => {
    expect(isValidAge(-5)).toBe(false)
  })
  it('무효 — 소수점', () => {
    expect(isValidAge(25.5)).toBe(false)
  })
  it('무효 — 문자열', () => {
    expect(isValidAge('abc')).toBe(false)
  })
})

describe('isValidHeight', () => {
  it('빈 값 → true (선택 필드)', () => {
    expect(isValidHeight('')).toBe(true)
    expect(isValidHeight(null)).toBe(true)
    expect(isValidHeight(undefined)).toBe(true)
  })
  it('유효 — 정상 범위', () => {
    expect(isValidHeight(170)).toBe(true)
    expect(isValidHeight(172.5)).toBe(true)
    expect(isValidHeight(100)).toBe(true)
    expect(isValidHeight(250)).toBe(true)
    expect(isValidHeight('175')).toBe(true)
  })
  it('무효 — 범위 밖', () => {
    expect(isValidHeight(99)).toBe(false)
    expect(isValidHeight(251)).toBe(false)
  })
  it('무효 — 음수', () => {
    expect(isValidHeight(-170)).toBe(false)
  })
  it('무효 — 문자열', () => {
    expect(isValidHeight('abc')).toBe(false)
  })
})

describe('isValidWeight', () => {
  it('빈 값 → true (선택 필드)', () => {
    expect(isValidWeight('')).toBe(true)
    expect(isValidWeight(null)).toBe(true)
    expect(isValidWeight(undefined)).toBe(true)
  })
  it('유효 — 정상 범위', () => {
    expect(isValidWeight(70)).toBe(true)
    expect(isValidWeight(65.3)).toBe(true)
    expect(isValidWeight(20)).toBe(true)
    expect(isValidWeight(300)).toBe(true)
    expect(isValidWeight('80')).toBe(true)
  })
  it('무효 — 범위 밖', () => {
    expect(isValidWeight(19)).toBe(false)
    expect(isValidWeight(301)).toBe(false)
  })
  it('무효 — 음수', () => {
    expect(isValidWeight(-50)).toBe(false)
  })
  it('무효 — 문자열', () => {
    expect(isValidWeight('abc')).toBe(false)
  })
})
