/**
 * 전화번호 유효성 검사 (010-XXXX-XXXX 형식)
 */
export function isValidPhone(value) {
  return /^010-\d{4}-\d{4}$/.test(value)
}

/**
 * 전화번호 자동 포맷팅
 * 숫자만 추출 후 010-XXXX-XXXX 형식으로 변환
 * 11자리 미만이면 그대로 반환
 */
export function formatPhone(value) {
  if (!value) return ''
  
  // 숫자만 추출
  const digits = value.replace(/\D/g, '')
  
  // 11자리 미만이면 그대로 반환
  if (digits.length < 11) return digits
  
  // 010-XXXX-XXXX 형식으로 포맷
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

/**
 * 이메일 유효성 검사
 */
export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
