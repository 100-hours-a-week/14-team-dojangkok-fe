'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // 미인증 사용자 → /signin
    if (!isAuthenticated) {
      router.replace('/signin');
      return;
    }

    // COMPLETE 사용자 → /
    if (user?.onboardingStatus === 'COMPLETE') {
      router.replace('/');
      return;
    }

    const status = user?.onboardingStatus;

    // NICKNAME 사용자가 /lifestyle-tags 접근 시 → /nickname
    if (status === 'NICKNAME' && pathname !== '/nickname') {
      router.replace('/nickname');
      return;
    }

    // LIFESTYLE 사용자가 /nickname, /lifestyle-tags가 아닌 곳 접근 시 → /lifestyle-tags
    if (
      status === 'LIFESTYLE' &&
      pathname !== '/nickname' &&
      pathname !== '/lifestyle-tags'
    ) {
      router.replace('/lifestyle-tags');
      return;
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // 로딩 중이거나 리다이렉트 중일 때는 렌더링하지 않음
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.onboardingStatus === 'COMPLETE') {
    return null;
  }

  // 올바른 온보딩 단계일 때만 렌더링
  return <>{children}</>;
}
