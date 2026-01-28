'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, User, TokenData } from '@/types/auth';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { exchangeCodeForToken } from '@/lib/api/auth';

interface AuthContextType extends AuthState {
  login: (code: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const tokenData = tokenStorage.get();

      if (tokenData) {
        setAuthState({
          user: {
            id: '',
            isNewUser: false,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = async (code: string) => {
    try {
      const response = await exchangeCodeForToken(code);

      // Access Token만 저장 (Refresh Token은 HttpOnly 쿠키로 자동 관리됨)
      const tokenData: TokenData = {
        accessToken: response.data.access_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
      };

      tokenStorage.save(tokenData);

      const user: User = {
        id: '',
        nickname: undefined,
        lifestyleTags: undefined,
        isNewUser: response.data.is_new_user,
      };

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      if (response.data.is_new_user) {
        router.push('/nickname');
      } else {
        router.push('/home');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    tokenStorage.remove();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/login');
  };

  const updateUser = (userData: Partial<User>) => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
