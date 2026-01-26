'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, MainButton, BottomFixedArea } from '@/components/common';
import { NICKNAME_MAX_LENGTH, NICKNAME_MESSAGES } from '@/constants/nickname';
import { filterNickname, validateNickname } from '@/utils/nickname';
import styles from './Nickname.module.css';

export default function NicknamePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = filterNickname(value);
    setNickname(filteredValue.slice(0, NICKNAME_MAX_LENGTH));
  };

  const handleNext = () => {
    if (validateNickname(nickname)) {
      // TODO: 닉네임 저장 및 다음 페이지로 이동
      router.push('/lifestyle-tags');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isButtonDisabled = !validateNickname(nickname);

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
            />
          </div>
          <div className={styles.charCount}>
            <span className={styles.charCountText}>
              {nickname.length}/{NICKNAME_MAX_LENGTH}
            </span>
          </div>
          <p className={styles.helperText}>
            * {NICKNAME_MESSAGES.noSpecialChars}
            <br />* {NICKNAME_MESSAGES.changeable}
          </p>
        </div>
      </main>

      <BottomFixedArea>
        <MainButton onClick={handleNext} disabled={isButtonDisabled}>
          다음
        </MainButton>
      </BottomFixedArea>
    </div>
  );
}
