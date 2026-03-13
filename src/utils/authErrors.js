/**
 * 인증 에러 메시지 파싱
 * error 객체(message 필드) 또는 error code(string)를 기반으로 한글 메시지 반환
 */
export function parseAuthError(error) {
  if (!error) return null

  // error code(string) 기반 매핑 (로그인/회원가입 에러)
  const codeMap = {
    invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
    user_already_registered: '이미 가입된 이메일입니다.',
    weak_password: '비밀번호가 너무 약합니다. 6자 이상으로 다시 시도해주세요.',
    email_address_invalid: '올바른 이메일 형식을 입력해주세요. (예: example@email.com)',
    validation_failed: '입력한 정보가 올바르지 않습니다. 다시 확인해주세요.',
    over_request_rate_limit: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  }

  // string으로 전달된 경우 (error.code)
  if (typeof error === 'string') {
    return codeMap[error] ?? null
  }

  // error 객체의 code 필드 확인
  if (error.code && codeMap[error.code]) {
    return codeMap[error.code]
  }

  const message = error.message || ''

  // 이메일 형식 오류
  if (message.includes('Email address') && message.includes('is invalid')) {
    return '올바른 이메일 형식이 아닙니다.'
  }

  // 이미 사용 중인 이메일
  if (message.includes('email already in use') || message.includes('A user with this email address has already been registered')) {
    return '이미 사용 중인 이메일입니다.'
  }

  // 이메일 변경 진행 중
  if (message.includes('email change already in progress')) {
    return '이메일 변경이 진행 중입니다. 잠시 후 다시 시도해주세요.'
  }

  // API 키 오류
  if (message.includes('Invalid API key') || message.includes('apikey')) {
    return '서비스 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  // 기본 fallback
  return null
}
