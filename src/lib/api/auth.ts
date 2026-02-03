import { apiClient } from './client';
import {
  OAuthTokenResponse,
  MemberProfileResponse,
  TokenRefreshResponse,
  UpdateNicknameResponse,
  LifestyleResponse,
} from '@/types/auth';

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

export async function updateNickname(
  nickname: string
): Promise<UpdateNicknameResponse> {
  return apiClient<UpdateNicknameResponse>('/v1/members/nickname', {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
    requiresAuth: true,
  });
}

export async function updateLifestyleTags(
  tags: string[]
): Promise<LifestyleResponse> {
  return apiClient<LifestyleResponse>('/v1/lifestyles', {
    method: 'POST',
    body: JSON.stringify({ lifestyle_items: tags }),
    requiresAuth: true,
  });
}

export async function refreshToken(): Promise<TokenRefreshResponse> {
  return apiClient<TokenRefreshResponse>('/v1/auth/refresh', {
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

export async function getLifestyleTags(): Promise<LifestyleResponse> {
  return apiClient<LifestyleResponse>('/v1/lifestyles', {
    method: 'GET',
    requiresAuth: true,
  });
}
