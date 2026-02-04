'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import {
  DEFAULT_LIFESTYLE_TAGS,
  LIFESTYLE_TAG_MAX_COUNT,
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

  const isTagLimitReached = selectedTags.length >= LIFESTYLE_TAG_MAX_COUNT;

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (isTagLimitReached) {
        return prev;
      }
      return [...prev, tag];
    });
  };

  const handleAddCustomTag = () => {
    const trimmedInput = customInput.trim();
    if (trimmedInput && !allTags.includes(trimmedInput) && !isTagLimitReached) {
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
      const response = await updateLifestyleTagsApi(selectedTags);

      const actualTags = response.data.lifestyle_items.map(
        (item) => item.lifestyle_item
      );

      updateUser({
        lifestyleTags: actualTags,
        onboardingStatus: response.data.onboarding_status,
      });
      router.push('/');
    } catch (err) {
      console.error('라이프스타일 태그 저장 실패:', err);
      setError('라이프스타일 태그 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/nickname');
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
            선택한 태그를 바탕으로 AI가 나만의 체크리스트를 만들어드려요. (
            {selectedTags.length}/{LIFESTYLE_TAG_MAX_COUNT})
          </p>
          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.tagsWrapper}>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.tag} ${
                selectedTags.includes(tag) ? styles.selected : ''
              }`}
              onClick={() => handleTagClick(tag)}
              disabled={isTagLimitReached && !selectedTags.includes(tag)}
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
            placeholder={
              isTagLimitReached
                ? '태그는 15개까지 선택할 수 있어요'
                : '직접 입력하기 (최대 10자)'
            }
            value={customInput}
            onChange={(e) =>
              setCustomInput(e.target.value.slice(0, LIFESTYLE_TAG_MAX_LENGTH))
            }
            onKeyPress={handleKeyPress}
            maxLength={LIFESTYLE_TAG_MAX_LENGTH}
            disabled={isTagLimitReached}
          />
          <button
            className={styles.addButton}
            onClick={handleAddCustomTag}
            disabled={isTagLimitReached || customInput.trim() === ''}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
