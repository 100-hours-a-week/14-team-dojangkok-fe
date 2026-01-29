import { apiClient } from './client';
import { HomeNotesResponse } from '@/types/homeNote';

/**
 * 집 노트 목록 조회
 * @param cursor - 페이지네이션 커서 (옵션)
 * @param limit - 페이지당 항목 수 (기본값: 10)
 * @returns 집 노트 목록
 */
export async function getHomeNotes(
  cursor?: string,
  limit: number = 10
): Promise<HomeNotesResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', limit.toString());

  const queryString = params.toString();
  const endpoint = queryString
    ? `/v1/home-notes?${queryString}`
    : '/v1/home-notes';

  return apiClient<HomeNotesResponse>(endpoint, {
    method: 'GET',
    requiresAuth: true,
  });
}
