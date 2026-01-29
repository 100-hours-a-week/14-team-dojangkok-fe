import { apiClient } from './client';
import { OAuthTokenResponse, MemberProfileResponse } from '@/types/auth';

export async function exchangeCodeForToken(
  code: string
): Promise<OAuthTokenResponse> {
  return apiClient<OAuthTokenResponse>('/v1/auth/token', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getMemberProfile(): Promise<MemberProfileResponse> {
  return apiClient<MemberProfileResponse>('/v1/members/me', {
    method: 'GET',
    requiresAuth: true,
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

export async function refreshToken(): Promise<OAuthTokenResponse> {
  return apiClient<OAuthTokenResponse>('/v1/auth/refresh', {
    method: 'POST',
  });
}

export async function logout(): Promise<void> {
  return apiClient<void>('/v1/auth/logout', {
    method: 'POST',
    requiresAuth: true,
  });
}

export async function deleteAccount(): Promise<void> {
  return apiClient<void>('/v1/members/me', {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export async function getLifestyleTags(): Promise<{ tags: string[] }> {
  return apiClient<{ tags: string[] }>('/v1/lifestyles', {
    method: 'GET',
    requiresAuth: true,
  });
}
