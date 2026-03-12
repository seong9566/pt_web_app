import { describe, it, expect } from 'vitest'
import { isValidPhone, formatPhone, isValidEmail } from '../validators'

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
