import { apiClient } from './client';
import { OAuthTokenResponse } from '@/types/auth';

export async function exchangeCodeForToken(
  code: string
): Promise<OAuthTokenResponse> {
  return apiClient<OAuthTokenResponse>('/v1/auth/token', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function updateNickname(nickname: string): Promise<void> {
  return apiClient<void>('/v1/members/nickname', {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
    requiresAuth: true,
  });
}

export async function updateLifestyleTags(tags: string[]): Promise<void> {
  return apiClient<void>('/v1/lifestyles', {
    method: 'POST',
    body: JSON.stringify({ tags }),
    requiresAuth: true,
  });
}
