import { describe, it, expect } from 'vitest'
import { parseAuthError } from '../authErrors'

describe('parseAuthError', () => {
  it('null → null', () => {
    expect(parseAuthError(null)).toBeNull()
  })
  it('이메일 형식 오류 메시지 → 한글', () => {
    expect(parseAuthError({ message: 'Email address "test@test1.com" is invalid' }))
      .toBe('올바른 이메일 형식이 아닙니다.')
  })
  it('이미 사용 중인 이메일 (already in use)', () => {
    expect(parseAuthError({ message: 'email already in use' }))
      .toBe('이미 사용 중인 이메일입니다.')
  })
  it('이미 사용 중인 이메일 (already registered)', () => {
    expect(parseAuthError({ message: 'A user with this email address has already been registered' }))
      .toBe('이미 사용 중인 이메일입니다.')
  })
  it('이메일 변경 진행 중', () => {
    expect(parseAuthError({ message: 'email change already in progress' }))
      .toBe('이메일 변경이 진행 중입니다. 메일함을 확인해주세요.')
  })
  it('알 수 없는 에러 → null', () => {
    expect(parseAuthError({ message: 'some unknown error' }))
      .toBeNull()
  })
  it('error code string — email_address_invalid', () => {
    expect(parseAuthError('email_address_invalid'))
      .toBe('올바른 이메일 형식을 입력해주세요. (예: example@email.com)')
  })
  it('error object — email_address_invalid code', () => {
    expect(parseAuthError({ code: 'email_address_invalid', message: 'Email address is invalid' }))
      .toBe('올바른 이메일 형식을 입력해주세요. (예: example@email.com)')
  })
  it('Invalid API key → 서비스 연결 에러', () => {
    expect(parseAuthError({ message: 'Invalid API key' }))
      .toBe('서비스 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
  })
  it('error code string — invalid_credentials', () => {
    expect(parseAuthError('invalid_credentials'))
      .toBe('이메일 또는 비밀번호가 올바르지 않습니다.')
  })
  it('error code string — 알 수 없는 코드 → null', () => {
    expect(parseAuthError('unknown_code')).toBeNull()
  })
})
