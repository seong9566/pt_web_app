import { describe, expect, it } from 'vitest'
import { parseAuthCallbackError } from '../authCallbackErrors'

describe('parseAuthCallbackError', () => {
  it('null이면 null을 반환한다', () => {
    expect(parseAuthCallbackError(null)).toBeNull()
  })

  it('PKCE code verifier 에러를 한글로 변환한다', () => {
    expect(parseAuthCallbackError('AuthApiError: bad_code_verifier')).toBe(
      '로그인 인증 확인에 실패했습니다. 로그인부터 다시 시도해 주세요.'
    )
  })

  it('invalid grant 에러를 한글로 변환한다', () => {
    expect(parseAuthCallbackError({ message: 'invalid grant: code expired' })).toBe(
      '로그인 요청이 만료되었거나 이미 사용되었습니다. 다시 로그인해 주세요.'
    )
  })

  it('만료 에러를 한글로 변환한다', () => {
    expect(parseAuthCallbackError({ message: 'otp_expired' })).toBe(
      '로그인 유효 시간이 지났습니다. 다시 로그인해 주세요.'
    )
  })

  it('알 수 없는 에러는 기본 메시지를 반환한다', () => {
    expect(parseAuthCallbackError({ message: 'some unexpected auth failure' })).toBe(
      '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'
    )
  })
})
