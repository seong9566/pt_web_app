/**
 * 인증 에러 메시지 파싱
 * error 객체의 message 필드를 기반으로 한글 메시지 반환
 */
export function parseAuthError(error) {
  if (!error) return '이메일 변경 중 오류가 발생했습니다.'
  
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
    return '이메일 변경이 진행 중입니다. 메일함을 확인해주세요.'
  }
  
  // 기본 fallback
  return '이메일 변경 중 오류가 발생했습니다.'
}
