'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common';
import {
  DEFAULT_LIFESTYLE_TAGS,
  LIFESTYLE_TAG_MAX_LENGTH,
} from '@/constants/lifestyle';
import { useAuth } from '@/contexts/AuthContext';
import { updateLifestyleTags as updateLifestyleTagsApi } from '@/lib/api/auth';
import styles from './LifestyleTags.module.css';

export default function LifestyleTagsPage() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([...DEFAULT_LIFESTYLE_TAGS]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmedInput = customInput.trim();
    if (trimmedInput && !allTags.includes(trimmedInput)) {
      setAllTags([...allTags, trimmedInput]);
      setSelectedTags([...selectedTags, trimmedInput]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddCustomTag();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await updateLifestyleTagsApi(selectedTags);
      updateUser({ lifestyleTags: selectedTags });
      router.push('/');
    } catch {
      setError('라이프스타일 태그 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <Header
        title="2/2"
        showBackButton={true}
        onBackClick={handleBack}
        rightText={isLoading ? '저장 중...' : '완료'}
        onRightClick={handleComplete}
      />

      <main className={styles.content}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            어떤 집을
            <br />
            찾고 계신가요?
          </h1>
          <p className={styles.subtitle}>
            선택한 태그를 바탕으로 AI가 나만의 체크리스트를 만들어드려요.
          </p>
          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.tagsWrapper}>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.tag} ${selectedTags.includes(tag) ? styles.selected : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </main>

      <div className={styles.bottomSection}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.customInput}
            placeholder="직접 입력하기 (최대 10자)"
            value={customInput}
            onChange={(e) =>
              setCustomInput(e.target.value.slice(0, LIFESTYLE_TAG_MAX_LENGTH))
            }
            onKeyPress={handleKeyPress}
            maxLength={LIFESTYLE_TAG_MAX_LENGTH}
          />
          <button className={styles.addButton} onClick={handleAddCustomTag}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
