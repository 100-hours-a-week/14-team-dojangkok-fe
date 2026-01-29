export interface OAuthTokenResponse {
  code: string;
  message: string;
  data: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    is_new_user: boolean;
  };
}

export interface TokenData {
  accessToken: string;
  expiresAt: number;
  // refreshToken은 HttpOnly 쿠키로 자동 관리됨
}

export interface User {
  id: string;
  nickname?: string;
  profileImageUrl?: string;
  lifestyleTags?: string[];
  isNewUser: boolean;
}

export interface MemberProfileResponse {
  code: string;
  message: string;
  data: {
    member_id: number;
    nickname: string | null;
    profile_image_url: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  data?: unknown;
}

// 백엔드 에러 코드 상수
export const ERROR_CODES = {
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

// 라이프스타일 관련 타입
export interface LifestyleItem {
  lifestyle_item: string;
  lifestyle_item_id: number;
}

export interface LifestyleResponse {
  code: string;
  message: string;
  data: {
    lifestyle_items: LifestyleItem[];
    member_id: number;
  };
}
