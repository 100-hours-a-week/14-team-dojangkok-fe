'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import MainButton from '@/components/common/MainButton';
import BottomFixedArea from '@/components/common/BottomFixedArea';
import { NICKNAME_MAX_LENGTH, NICKNAME_MESSAGES } from '@/constants/nickname';
import { validateNickname, hasInvalidCharacters } from '@/utils/nickname';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { updateNickname as updateNicknameApi } from '@/lib/api/auth';
import styles from './Nickname.module.css';

export default function NicknamePage() {
  const router = useRouter();
  const { updateUser, logout } = useAuth();
  const toast = useToast();
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 브라우저 뒤로가기 감지하여 로그아웃 처리
  useEffect(() => {
    const handlePopState = async () => {
      await logout();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [logout]);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value.slice(0, NICKNAME_MAX_LENGTH));
  };

  const handleNext = async () => {
    // 유효하지 않은 문자 포함 여부 확인
    if (hasInvalidCharacters(nickname)) {
      toast.error(NICKNAME_MESSAGES.noSpecialChars);
      return;
    }

    // 최소 길이 검증
    if (!validateNickname(nickname)) {
      toast.error('닉네임은 최소 2자 이상 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await updateNicknameApi(nickname);
      updateUser({
        nickname,
        onboardingStatus: response.data.onboarding_status,
      });
      router.push('/lifestyle-tags');
    } catch (err) {
      console.error('Failed to update nickname:', err);
      toast.error('닉네임 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    await logout();
  };

  const isButtonDisabled = isLoading;

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
