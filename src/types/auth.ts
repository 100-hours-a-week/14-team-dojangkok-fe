export type OnboardingStatus = 'NICKNAME' | 'LIFESTYLE' | 'COMPLETE';

export interface OAuthTokenResponse {
  code: string;
  message: string;
  data: {
    token: {
      access_token: string;
      expires_in: number;
    };
    onboarding_status: OnboardingStatus;
  };
}

export interface TokenData {
  accessToken: string;
  expiresAt: number;
  // refreshToken은 HttpOnly 쿠키로 자동 관리됨
}

export interface TokenRefreshResponse {
  code: string;
  message: string;
  data: {
    token: {
      access_token: string;
      expires_in: number;
    };
  };
}

export interface User {
  id: string;
  nickname?: string;
  profileImageUrl?: string;
  lifestyleTags?: string[];
  onboardingStatus: OnboardingStatus;
}

export interface MemberProfileResponse {
  code: string;
  message: string;
  data: {
    member_id: number;
    nickname: string | null;
    profile_image_url: string;
    onboarding_status: OnboardingStatus;
  };
}

export interface UpdateNicknameResponse {
  code: string;
  message: string;
  data: {
    member_id: number;
    nickname: string;
    onboarding_status: OnboardingStatus;
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
    member_id: number;
    onboarding_status: OnboardingStatus;
    lifestyle_items: LifestyleItem[];
  };
}
