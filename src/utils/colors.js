/**
 * 회원별 캘린더 색상 팔레트
 * 밝은 톤으로 어두운 텍스트와 함께 사용
 */
export const MEMBER_COLORS = [
  '#FFD43B', '#4DABF7', '#69DB7C', '#FF8787',
  '#DA77F2', '#FFA94D', '#38D9A9', '#748FFC',
  '#E599F7', '#63E6BE', '#F06595', '#A9E34B',
]

/**
 * 인덱스 기반 자동 색상 배정 (모듈로 순환)
 * @param {number} index - 회원 인덱스
 * @returns {string} hex 색상 코드
 */
export function getAutoColor(index) {
  return MEMBER_COLORS[index % MEMBER_COLORS.length]
}

/**
 * 유효한 회원 색상인지 확인
 * @param {string} color - hex 색상 코드
 * @returns {boolean}
 */
export function isValidMemberColor(color) {
  return MEMBER_COLORS.includes(color)
}
