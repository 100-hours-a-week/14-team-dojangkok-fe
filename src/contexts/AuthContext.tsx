'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, User, TokenData } from '@/types/auth';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import {
  exchangeCodeForToken,
  getMemberProfile,
  getLifestyleTags,
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
      // 만료 체크 없이 토큰 가져오기 (자동 삭제 방지)
      const tokenData = tokenStorage.getRaw();

      if (tokenData) {
        // 토큰이 만료되었는지 확인
        if (tokenStorage.isExpired(tokenData)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              '[AuthContext] Access token expired, attempting refresh via API call'
            );
          }
          // 토큰이 만료되었지만 삭제하지 않음
          // API 호출 시 자동 갱신될 것이므로 프로필 조회 시도
        }

        try {
          // 실제 프로필 조회하여 유저 정보 복원
          const profileResponse = await getMemberProfile();
          const isNewUser = !profileResponse.data.nickname;

          // 라이프스타일 태그 조회
          let lifestyleTags: string[] | undefined = undefined;
          try {
            const lifestyleResponse = await getLifestyleTags();
            lifestyleTags = lifestyleResponse.data.lifestyle_items.map(
              (item) => item.lifestyle_item
            );
          } catch {
            // 라이프스타일 조회 실패 시 undefined로 처리
            lifestyleTags = undefined;
          }

          const user: User = {
            id: profileResponse.data.member_id.toString(),
            nickname: profileResponse.data.nickname || undefined,
            profileImageUrl: profileResponse.data.profile_image_url,
            lifestyleTags,
            isNewUser,
          };

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // 프로필 조회 실패 시 에러 확인
          if (process.env.NODE_ENV === 'development') {
            console.warn('[AuthContext] Profile fetch failed:', error);
          }

          // ApiError의 경우 status code 확인
          const isAuthError =
            error &&
            typeof error === 'object' &&
            'status' in error &&
            error.status === 401;

          if (isAuthError) {
            // 401 에러면 토큰 제거하고 로그아웃 (refresh도 실패한 경우)
            tokenStorage.remove();
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            // 네트워크 에러 등 일시적 문제일 수 있으므로 토큰은 유지하되 미인증 상태로
            // (다음 API 호출 시 자동 재시도됨)
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
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

      // 기존 사용자는 라이프스타일 태그도 조회
      let lifestyleTags: string[] | undefined = undefined;
      if (!isNewUser) {
        try {
          const lifestyleResponse = await getLifestyleTags();
          lifestyleTags = lifestyleResponse.data.lifestyle_items.map(
            (item) => item.lifestyle_item
          );
        } catch {
          // 라이프스타일 조회 실패 시 undefined로 처리
          lifestyleTags = undefined;
        }
      }

      const user: User = {
        id: profileResponse.data.member_id.toString(),
        nickname: profileResponse.data.nickname || undefined,
        profileImageUrl: profileResponse.data.profile_image_url,
        lifestyleTags,
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
