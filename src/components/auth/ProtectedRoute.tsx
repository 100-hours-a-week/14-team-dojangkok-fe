'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/signin');
      return;
    }

    // COMPLETE가 아니면 온보딩 단계로 리다이렉트
    if (user && user.onboardingStatus !== 'COMPLETE') {
      if (user.onboardingStatus === 'NICKNAME') {
        router.replace('/nickname');
      } else if (user.onboardingStatus === 'LIFESTYLE') {
        router.replace('/lifestyle-tags');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  // COMPLETE가 아니면 렌더링하지 않음 (useEffect에서 리다이렉트 처리)
  if (user && user.onboardingStatus !== 'COMPLETE') {
    return null;
  }

  return <>{children}</>;
}
