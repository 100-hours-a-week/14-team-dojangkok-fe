'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function NotFound() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // 미인증 상태면 로그인 페이지로, 인증 상태면 홈으로
      const redirectPath = isAuthenticated ? '/' : '/signin';
      router.replace(redirectPath);
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 16 }}>
        404
      </h1>
      <p style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
        페이지를 찾을 수 없습니다
      </p>
      <p style={{ fontSize: 14, color: '#999' }}>잠시 후 리다이렉트됩니다...</p>
    </div>
  );
}
