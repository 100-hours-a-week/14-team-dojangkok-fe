'use client';

import { HomeNote } from '@/app/(main)/home-notes/types';
import styles from './HomeNoteCard.module.css';

interface HomeNoteCardProps {
  note: HomeNote;
  onClick: (id: string) => void;
  isEditMode?: boolean;
  onDelete?: (id: string) => void;
}

export default function HomeNoteCard({
  note,
  onClick,
  isEditMode = false,
  onDelete,
}: HomeNoteCardProps) {
  const hasImages = note.images.length > 0;
  const isSingleImage = note.images.length === 1;
  const displayImages = hasImages ? note.images.slice(0, 4) : [];
  const remainingCount = note.images.length - 4;

  // 2x2 그리드를 채우기 위해 빈 슬롯 계산 (2-3장인 경우)
  const emptySlots =
    hasImages && !isSingleImage && note.images.length < 4
      ? 4 - note.images.length
      : 0;

  const handleClick = () => {
    if (!isEditMode) {
      onClick(note.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(note.id);
    }
  };

  return (
    <article
      className={`${styles.card} ${isEditMode ? styles.editMode : ''}`}
      onClick={handleClick}
    >
      <div
        className={`${styles.imageGrid} ${isSingleImage ? styles.singleImage : ''}`}
      >
        {hasImages ? (
          <>
            {displayImages.map((image, index) => (
              <div key={image.id} className={styles.imageWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={`${note.title} ${index + 1}`}
                  className={styles.image}
                />
                {index === 3 && remainingCount > 0 && (
                  <div className={styles.overlay}>
                    <span className={styles.overlayText}>
                      +{remainingCount}
                    </span>
                  </div>
                )}
                {isEditMode && index === 0 && (
                  <button
                    className={styles.deleteButton}
                    onClick={handleDelete}
                    aria-label="삭제"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                )}
              </div>
            ))}
            {Array.from({ length: emptySlots }).map((_, index) => (
              <div key={`empty-${index}`} className={styles.emptySlot} />
            ))}
          </>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyText}>이미지 없음</span>
            {isEditMode && (
              <button
                className={styles.deleteButton}
                onClick={handleDelete}
                aria-label="삭제"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
            )}
          </div>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{note.title}</h3>
        <p className={styles.date}>{note.date}</p>
      </div>
    </article>
  );
}
