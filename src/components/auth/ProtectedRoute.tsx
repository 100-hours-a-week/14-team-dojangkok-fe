'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 즉시 리다이렉트
      router.replace('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // 로딩 중이거나 미인증 상태면 아무것도 렌더링하지 않음
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
