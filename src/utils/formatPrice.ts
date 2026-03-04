/**
 * 만원 단위 숫자를 한국어 가격 표기로 변환
 * 예: 10000 → '1억', 15000 → '1억 5,000만', 500 → '500만'
 */
export function formatKRW(man: number): string {
  if (man === 0) return '0원';
  const uk = Math.floor(man / 10000);
  const remainder = man % 10000;
  if (uk > 0 && remainder > 0) {
    return `${uk}억 ${remainder.toLocaleString()}만`;
  }
  if (uk > 0) return `${uk}억`;
  return `${man.toLocaleString()}만`;
}

/**
 * 거래 유형에 따른 가격 문자열 반환
 * @param priceType - '월세' | '전세' | '반전세' | '매매'
 * @param deposit - 보증금 or 매매가 (만원 단위)
 * @param monthlyRent - 월세 (만원 단위, 월세/반전세 시)
 */
export function formatPropertyPrice(
  priceType: string,
  deposit: number,
  monthlyRent?: number
): string {
  const main = formatKRW(deposit);
  switch (priceType) {
    case '월세':
    case '반전세':
      return `${priceType} ${main}/${monthlyRent?.toLocaleString() ?? 0}만`;
    case '전세':
      return `전세 ${main}`;
    case '매매':
      return `매매 ${main}`;
    default:
      return main;
  }
}
