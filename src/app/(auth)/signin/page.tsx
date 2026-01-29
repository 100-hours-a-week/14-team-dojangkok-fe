'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 이미 로그인한 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleKakaoLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      alert('로그인 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const backendOAuthUrl = `${baseUrl}/oauth2/authorization/kakao`;
      window.location.href = backendOAuthUrl;
    } catch {
      setIsLoading(false);
      alert('로그인 연결에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 로그인 상태 확인 중이거나 이미 로그인된 경우 렌더링하지 않음
  if (authLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}>
            <span className="material-symbols-outlined">approval</span>
          </div>
        </div>

        <div className={styles.textCenter}>
          <h1 className={styles.title}>도장콕</h1>
          <p className={styles.subtitle}>
            자취방 계약, 불안하다면?
            <br />
            똑똑한 계약서 분석 서비스
          </p>
        </div>

        <div className={styles.imageWrapper}>
          <div className={styles.imageOverlay} />
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDarbVr0ke52TveIrgoKxPDAOhbRDIGfDcCsaIO6pvlA7m8OBZK-xHL3CUyPecnIdFXcNpAeYUYBgmsT2h0vlEbVpWohMRdd08XLE3k0N8hINqojjWnMKtZ2QkLaCosQoiIHvU_W_HtlhiTlMdzZRaUSqTgWGDTPI3ZUZf50UA9fPQxDvPrENZwpUOh-xF5lZexVNkh2I8pmHvSCWRyWaMD81Dp2rLDhSdFhYlfLhqXVN2VqtLmd3WYtJKhsqhjZUTy8e0PIl2f-AI"
            alt="도장콕 서비스 일러스트"
            fill
            className={styles.image}
          />
        </div>
      </div>

      <div className={styles.bottomSection}>
        <button
          className={styles.kakaoButton}
          onClick={handleKakaoLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className={styles.loadingState}>로그인 중...</div>
          ) : (
            <Image
              src="/kakao_login_large_wide.png"
              alt="카카오로 시작하기"
              width={400}
              height={60}
              className={styles.kakaoButtonImage}
            />
          )}
        </button>

        {/* <div className={styles.links}>
          <a href="#">매물 둘러보기</a>
        </div> */}

        <div className={styles.terms}>
          계속 진행함으로써 도장콕의 <a href="/terms">서비스 이용약관</a> 및{' '}
          <a href="/privacy">개인정보 처리방침</a>에 동의하게 됩니다.
        </div>
      </div>
    </div>
  );
}
