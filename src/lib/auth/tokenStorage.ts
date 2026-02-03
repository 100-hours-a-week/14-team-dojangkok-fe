import { TokenData } from '@/types/auth';

const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  save(tokenData: TokenData): void {
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
    } catch {
      // Silent fail
    }
  },

  get(): TokenData | null {
    try {
      const data = localStorage.getItem(TOKEN_KEY);
      if (!data) return null;

      const tokenData: TokenData = JSON.parse(data);

      if (this.isExpired(tokenData)) {
        this.remove();
        return null;
      }

      return tokenData;
    } catch {
      return null;
    }
  },

  /**
   * 만료 체크 없이 토큰 데이터를 가져옴 (초기화 및 갱신 로직용)
   */
  getRaw(): TokenData | null {
    try {
      const data = localStorage.getItem(TOKEN_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  remove(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Silent fail
    }
  },

  isExpired(tokenData: TokenData): boolean {
    // 5분(300초) 버퍼를 두고 만료 체크 (API 요청 중 만료 방지)
    const BUFFER_TIME = 5 * 60 * 1000; // 5분 = 300,000ms
    return Date.now() >= tokenData.expiresAt - BUFFER_TIME;
  },

  getAccessToken(): string | null {
    const tokenData = this.get();
    return tokenData?.accessToken || null;
  },
};
