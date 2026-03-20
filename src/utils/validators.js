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
 * TLD 최소 2자 이상 + 전체 길이 254자 제한 (RFC 5321)
 */
export function isValidEmail(value) {
  if (!value || value.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

/**
 * 나이 유효성 검사
 * 빈 값은 통과 (선택 필드), 입력된 경우 14~100 사이 정수만 허용
 */
export function isValidAge(value) {
  if (value === '' || value === null || value === undefined) return true
  const num = Number(value)
  if (isNaN(num) || !Number.isInteger(num)) return false
  return num >= 14 && num <= 100
}

/**
 * 키 유효성 검사
 * 빈 값은 통과 (선택 필드), 입력된 경우 100~250 사이 숫자 허용
 */
export function isValidHeight(value) {
  if (value === '' || value === null || value === undefined) return true
  const num = Number(value)
  if (isNaN(num)) return false
  return num >= 100 && num <= 250
}

/**
 * 몸무게 유효성 검사
 * 빈 값은 통과 (선택 필드), 입력된 경우 20~300 사이 숫자 허용
 */
export function isValidWeight(value) {
  if (value === '' || value === null || value === undefined) return true
  const num = Number(value)
  if (isNaN(num)) return false
  return num >= 20 && num <= 300
}
