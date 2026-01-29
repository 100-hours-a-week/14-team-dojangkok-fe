'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, User, TokenData } from '@/types/auth';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import {
  exchangeCodeForToken,
  getMemberProfile,
  logout as logoutApi,
  deleteAccount as deleteAccountApi,
} from '@/lib/api/auth';

interface AuthContextType extends AuthState {
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
        try {
          // 실제 프로필 조회하여 유저 정보 복원
          const profileResponse = await getMemberProfile();
          const isNewUser = !profileResponse.data.nickname;

          const user: User = {
            id: profileResponse.data.member_id.toString(),
            nickname: profileResponse.data.nickname || undefined,
            profileImageUrl: profileResponse.data.profile_image_url,
            lifestyleTags: undefined,
            isNewUser,
          };

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // 프로필 조회 실패 시 토큰 제거하고 로그아웃 상태로 전환
          tokenStorage.remove();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
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

      // 프로필 조회하여 닉네임 확인
      const profileResponse = await getMemberProfile();
      const isNewUser = !profileResponse.data.nickname;

      const user: User = {
        id: profileResponse.data.member_id.toString(),
        nickname: profileResponse.data.nickname || undefined,
        profileImageUrl: profileResponse.data.profile_image_url,
        lifestyleTags: undefined,
        isNewUser,
      };

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      if (isNewUser) {
        router.replace('/nickname');
      } else {
        router.replace('/');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // 로그아웃 API 실패해도 로컬 토큰은 제거
    } finally {
      tokenStorage.remove();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.push('/signin');
    }
  };

  const deleteAccount = async () => {
    try {
      await deleteAccountApi();
      tokenStorage.remove();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.push('/signin');
    } catch (error) {
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  };

  return (
    <AuthContext.Provider
      value={{ ...authState, login, logout, deleteAccount, updateUser }}
    >
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
