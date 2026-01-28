import { TokenData } from '@/types/auth';

const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  save(tokenData: TokenData): void {
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
    } catch (error) {
      console.error('Failed to save token:', error);
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
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  },

  remove(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },

  isExpired(tokenData: TokenData): boolean {
    return Date.now() >= tokenData.expiresAt;
  },

  getAccessToken(): string | null {
    const tokenData = this.get();
    return tokenData?.accessToken || null;
  },
};
