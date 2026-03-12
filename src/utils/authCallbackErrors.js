/**
 * OAuth / PKCE 콜백 과정에서 발생한 에러를 사용자용 메시지로 변환한다.
 */
export function parseAuthCallbackError(error) {
  if (!error) return null

  const message = typeof error === 'string'
    ? error
    : error.message || error.error_description || error.description || ''

  if (!message) {
    return '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'
  }

  const normalized = message.toLowerCase()

  if (
    normalized.includes('code verifier') ||
    normalized.includes('pkce') ||
    normalized.includes('bad_code_verifier')
  ) {
    return '로그인 인증 확인에 실패했습니다. 로그인부터 다시 시도해 주세요.'
  }

  if (
    normalized.includes('invalid grant') ||
    normalized.includes('grant_type=pkce') ||
    normalized.includes('invalid request')
  ) {
    return '로그인 요청이 만료되었거나 이미 사용되었습니다. 다시 로그인해 주세요.'
  }

  if (
    normalized.includes('expired') ||
    normalized.includes('otp_expired')
  ) {
    return '로그인 유효 시간이 지났습니다. 다시 로그인해 주세요.'
  }

  if (
    normalized.includes('access denied') ||
    normalized.includes('provider') ||
    normalized.includes('oauth')
  ) {
    return '외부 로그인 인증에 실패했습니다. 다시 시도해 주세요.'
  }

  return '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'
}
