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
  lifestyleTags?: string[];
  isNewUser: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
