'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AuthSuccess.module.css';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // React Strict Mode에서 중복 실행 방지
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('인증에 실패했습니다');
        setTimeout(() => router.replace('/signin'), 3000);
        return;
      }

      if (!code) {
        setError('인증 코드를 찾을 수 없습니다');
        setTimeout(() => router.replace('/signin'), 3000);
        return;
      }

      try {
        await login(code);
      } catch {
        setError('로그인에 실패했습니다');
        setTimeout(() => router.replace('/signin'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorWrapper}>
            <div className={styles.errorIcon}>
              <span className="material-symbols-outlined">error</span>
            </div>
            <h1 className={styles.errorTitle}>{error}</h1>
            <p className={styles.errorDescription}>다시 시도해주세요</p>
            <p className={styles.redirectMessage}>
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}>
            <div className={styles.spinner}></div>
            <span className="material-symbols-outlined">approval</span>
          </div>
        </div>
        <h1 className={styles.title}>로그인 중입니다</h1>
        <p className={styles.description}>잠시만 기다려주세요</p>
        <div className={styles.progressDots}>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoIcon}>
                <div className={styles.spinner}></div>
                <span className="material-symbols-outlined">approval</span>
              </div>
            </div>
            <h1 className={styles.title}>로그인 중입니다</h1>
            <p className={styles.description}>잠시만 기다려주세요</p>
            <div className={styles.progressDots}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
          </div>
        </div>
      }
    >
      <AuthSuccessContent />
    </Suspense>
  );
}
