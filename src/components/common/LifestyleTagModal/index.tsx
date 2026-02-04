'use client';

import { useState } from 'react';
import Modal from '../Modal';
import {
  DEFAULT_LIFESTYLE_TAGS,
  LIFESTYLE_TAG_MAX_COUNT,
  LIFESTYLE_TAG_MAX_LENGTH,
} from '@/constants/lifestyle';
import styles from './LifestyleTagModal.module.css';

interface LifestyleTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tags: string[]) => void;
  initialTags?: string[];
}

export default function LifestyleTagModal({
  isOpen,
  onClose,
  onSubmit,
  initialTags = [],
}: LifestyleTagModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [customInput, setCustomInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>(() => {
    // 초기 태그에 커스텀 태그가 있다면 allTags에 추가
    const defaultTagsArray = [...DEFAULT_LIFESTYLE_TAGS] as string[];
    const customTags = initialTags.filter(
      (tag) => !defaultTagsArray.includes(tag)
    );
    return [...DEFAULT_LIFESTYLE_TAGS, ...customTags];
  });
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  // 모달이 열릴 때 상태 초기화
  if (isOpen && !prevIsOpen) {
    const defaultTagsArray = [...DEFAULT_LIFESTYLE_TAGS] as string[];
    const customTags = initialTags.filter(
      (tag) => !defaultTagsArray.includes(tag)
    );
    setAllTags([...DEFAULT_LIFESTYLE_TAGS, ...customTags]);
    setSelectedTags(initialTags);
    setCustomInput('');
    setPrevIsOpen(true);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

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

  const handleSubmit = () => {
    onSubmit(selectedTags);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="라이프스타일 수정"
      confirmText="완료"
      cancelText="취소"
    >
      <div className={styles.content}>
        <p className={styles.description}>
          선택한 태그를 바탕으로 AI가 나만의 체크리스트를 만들어드려요. (
          {selectedTags.length}/{LIFESTYLE_TAG_MAX_COUNT})
        </p>

        <div className={styles.tagsWrapper}>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.tag} ${
                selectedTags.includes(tag) ? styles.selected : ''
              }`}
              onClick={() => handleTagClick(tag)}
              type="button"
              disabled={isTagLimitReached && !selectedTags.includes(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

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
            type="button"
            disabled={isTagLimitReached || customInput.trim() === ''}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
