/**
 * 날짜를 'YYYY년 M월 D일 HH:MM' 형식으로 변환
 * ISO 문자열 또는 Java LocalDateTime 배열([년, 월, 일, 시, 분, 초, 나노초]) 형식을 처리
 */
export function formatDate(date: string | number[]): string {
  if (Array.isArray(date)) {
    const [year, month, day, hour, minute] = date;
    return `${year}년 ${month}월 ${day}일 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일 ${hour}:${minute}`;
}
