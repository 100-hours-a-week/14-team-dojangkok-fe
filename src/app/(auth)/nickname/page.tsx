'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, MainButton, BottomFixedArea } from '@/components/common';
import styles from './Nickname.module.css';

export default function NicknamePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const maxLength = 10;

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 특수문자와 공백 제거 (한글, 영문, 숫자만 허용)
    const filteredValue = value.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
    setNickname(filteredValue.slice(0, maxLength));
  };

  const handleNext = () => {
    if (nickname.length > 0) {
      // TODO: 닉네임 저장 및 다음 페이지로 이동
      router.push('/lifestyle-tags');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isButtonDisabled = nickname.length === 0;

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
              maxLength={maxLength}
            />
          </div>
          <div className={styles.charCount}>
            <span className={styles.charCountText}>
              {nickname.length}/{maxLength}
            </span>
          </div>
          <p className={styles.helperText}>
            * 공백과 특수문자는 사용할 수 없어요.
            <br />* 나중에 마이페이지에서 언제든지 변경할 수 있어요.
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
