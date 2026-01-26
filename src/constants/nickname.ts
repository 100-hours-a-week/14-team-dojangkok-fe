/**
 * 닉네임 관련 상수
 */

export const NICKNAME_MAX_LENGTH = 10;
export const NICKNAME_MIN_LENGTH = 2;

export const NICKNAME_MESSAGES = {
  success: '사용 가능한 닉네임입니다',
  tooShort: '닉네임은 최소 2자 이상이어야 합니다',
  invalidChars: '한글, 영문, 숫자만 사용할 수 있습니다',
  noSpecialChars: '공백과 특수문자는 사용할 수 없어요.',
  changeable: '나중에 마이페이지에서 언제든지 변경할 수 있어요.',
} as const;
