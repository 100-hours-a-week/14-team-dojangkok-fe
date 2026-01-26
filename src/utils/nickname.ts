import { NICKNAME_MIN_LENGTH } from '@/constants/nickname';

/**
 * 닉네임에서 허용되지 않는 문자를 제거합니다.
 * 한글, 영문, 숫자만 허용하고 공백과 특수문자는 제거됩니다.
 */
export function filterNickname(value: string): string {
  return value.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
}

/**
 * 닉네임이 유효한지 검사합니다.
 * - 최소 2자 이상
 * - 공백 제거 후 검사
 */
export function validateNickname(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= NICKNAME_MIN_LENGTH;
}

/**
 * 닉네임에 유효하지 않은 문자가 포함되어 있는지 확인합니다.
 */
export function hasInvalidCharacters(value: string): boolean {
  return /[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value);
}
