import { tokenStorage } from '@/lib/auth/tokenStorage';
import { TokenData } from '@/types/auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  skipTokenRefresh?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * 토큰 유효성 검증 및 갱신
 * @returns 유효한 토큰이 있으면 true, 갱신 실패 시 false
 */
export async function ensureValidToken(): Promise<boolean> {
  const tokenData = tokenStorage.get();

  // 토큰이 없거나 만료되지 않았으면 검증 통과
  if (!tokenData) {
    return false;
  }

  if (!tokenStorage.isExpired(tokenData)) {
    return true;
  }

  // 토큰이 만료되었으면 갱신 시도
  const newToken = await refreshAccessToken();
  return newToken !== null;
}

async function refreshAccessToken(): Promise<string | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEBUG] Refresh token attempt started');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (process.env.NODE_ENV === 'development') {
        console.warn('[DEBUG] Token refresh failed:', {
          status: response.status,
          error: errorData,
        });
      }

      // INVALID_REFRESH_TOKEN 또는 TOKEN_REUSE_DETECTED 시 즉시 로그아웃
      if (
        errorData.code === 'INVALID_REFRESH_TOKEN' ||
        errorData.code === 'TOKEN_REUSE_DETECTED'
      ) {
        tokenStorage.remove();
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        }
      }

      return null;
    }

    const data = await response.json();
    const tokenData: TokenData = {
      accessToken: data.data.token.access_token,
      expiresAt: Date.now() + data.data.token.expires_in * 1000,
    };

    tokenStorage.save(tokenData);

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Token refresh succeeded');
    }

    return tokenData.accessToken;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEBUG] Token refresh error:', error);
    }
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    requiresAuth = false,
    skipTokenRefresh = false,
    headers = {},
    ...fetchOptions
  } = options;

  const makeRequest = async (accessToken?: string): Promise<Response> => {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (headers && typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          defaultHeaders[key] = value;
        }
      });
    }

    if (requiresAuth && accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

    return fetch(url, {
      ...fetchOptions,
      headers: defaultHeaders,
      credentials: 'include',
    });
  };

  try {
    let accessToken = requiresAuth
      ? (tokenStorage.getAccessToken() ?? undefined)
      : undefined;
    let response = await makeRequest(accessToken);

    // 401 에러 시 토큰 갱신 시도
    if (response.status === 401 && requiresAuth && !skipTokenRefresh) {
      // 에러 데이터 먼저 파싱 (치명적 에러 체크용)
      const errorData = await response.json().catch(() => ({}));

      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] 401 detected, error code:', errorData.code);
      }

      // 치명적인 에러 코드 체크 (즉시 로그아웃 필요)
      if (
        errorData.code === 'INVALID_REFRESH_TOKEN' ||
        errorData.code === 'TOKEN_REUSE_DETECTED'
      ) {
        tokenStorage.remove();
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        }
        throw new ApiError(
          401,
          errorData.message || '인증이 만료되었습니다. 다시 로그인해주세요.',
          errorData.code
        );
      }

      // 일반 401이면 토큰 갱신 시도
      if (!refreshPromise) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Creating new refresh promise');
        }

        // 갱신 프로미스 생성 및 저장
        refreshPromise = refreshAccessToken().finally(() => {
          // 프로미스는 일정 시간 후 초기화 (다른 요청들이 사용할 수 있도록)
          setTimeout(() => {
            refreshPromise = null;
          }, 100);
        });
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Reusing existing refresh promise');
        }
      }

      // 모든 요청이 같은 프로미스 대기
      const newToken = await refreshPromise;

      if (newToken) {
        accessToken = newToken;
        response = await makeRequest(accessToken);

        // 재요청도 401이면 갱신 실패로 간주 (즉시 로그아웃)
        if (response.status === 401) {
          tokenStorage.remove();
          if (typeof window !== 'undefined') {
            window.location.href = '/signin';
          }
          throw new ApiError(
            401,
            '인증이 만료되었습니다. 다시 로그인해주세요.'
          );
        }
      } else {
        // 토큰 갱신 실패 시 에러 throw
        tokenStorage.remove();
        throw new ApiError(401, '인증이 만료되었습니다. 다시 로그인해주세요.');
      }
    }

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: 'Unknown error' }));

      // 표준 백엔드 에러 형식 (code, message)
      if (errorData.code && errorData.message) {
        throw new ApiError(
          response.status,
          errorData.message,
          errorData.code,
          errorData.data
        );
      }

      // Spring Boot Validation 에러 형식
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const validationMessages = errorData.errors
          .map(
            (err: { defaultMessage?: string; message?: string }) =>
              err.defaultMessage || err.message
          )
          .filter(Boolean)
          .join(', ');
        throw new ApiError(
          response.status,
          validationMessages || '입력값을 확인해주세요.',
          'VALIDATION_ERROR',
          errorData.errors
        );
      }

      // 기타 에러
      throw new ApiError(
        response.status,
        errorData.message || response.statusText
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
