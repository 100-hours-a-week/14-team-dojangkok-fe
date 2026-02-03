'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import MainButton from '@/components/common/MainButton';
import BottomFixedArea from '@/components/common/BottomFixedArea';
import { NICKNAME_MAX_LENGTH, NICKNAME_MESSAGES } from '@/constants/nickname';
import { filterNickname, validateNickname } from '@/utils/nickname';
import { useAuth } from '@/contexts/AuthContext';
import { updateNickname as updateNicknameApi } from '@/lib/api/auth';
import styles from './Nickname.module.css';

export default function NicknamePage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 온보딩이 완료된 사용자만 홈으로 리다이렉트
  useEffect(() => {
    if (user && user.onboardingStatus === 'COMPLETE') {
      router.replace('/');
    }
  }, [user, router]);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = filterNickname(value);
    setNickname(filteredValue.slice(0, NICKNAME_MAX_LENGTH));
    setError(null);
  };

  const handleNext = async () => {
    if (!validateNickname(nickname)) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await updateNicknameApi(nickname);
      updateUser({
        nickname,
        onboardingStatus: response.data.onboarding_status
      });
      router.push('/lifestyle-tags');
    } catch (err) {
      console.error('Failed to update nickname:', err);
      setError('닉네임 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    await logout();
  };

  const isButtonDisabled = !validateNickname(nickname) || isLoading;

  return (
    <div className={styles.container}>
      <Header title="1/2" showBackButton={true} onBackClick={handleBack} />
      <main className={styles.content}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            반가워요!
            <br />
            <span className={styles.titleHighlight}>어떻게 불러드릴까요?</span>
          </h1>
          <p className={styles.subtitle}>
            서비스에서 사용할 닉네임을 입력해주세요.
          </p>
        </div>

        <div className={styles.inputWrapper}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              className={styles.input}
              placeholder="닉네임 입력"
              value={nickname}
              onChange={handleNicknameChange}
              maxLength={NICKNAME_MAX_LENGTH}
              disabled={isLoading}
            />
          </div>
          <div className={styles.charCount}>
            <span className={styles.charCountText}>
              {nickname.length}/{NICKNAME_MAX_LENGTH}
            </span>
          </div>
          <p className={styles.helperText}>
            * 최소 2자 이상 입력해주세요.
            <br />* {NICKNAME_MESSAGES.noSpecialChars}
            <br />* {NICKNAME_MESSAGES.changeable}
          </p>
          {error && <p className={styles.errorText}>{error}</p>}
        </div>
      </main>

      <BottomFixedArea>
        <MainButton onClick={handleNext} disabled={isButtonDisabled}>
          {isLoading ? '저장 중...' : '다음'}
        </MainButton>
      </BottomFixedArea>
    </div>
  );
}
