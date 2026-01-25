'use client';

import { useEffect } from 'react';
import styles from './ImageViewerModal.module.css';

interface ImageViewerModalProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function ImageViewerModal({
  isOpen,
  images,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: ImageViewerModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        onPrevious();
      } else if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onPrevious, onNext, onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPrevious) {
      onPrevious();
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) {
      onNext();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeButton} onClick={onClose}>
        <span className="material-symbols-outlined">close</span>
      </button>

      {hasPrevious && (
        <button className={styles.navButtonLeft} onClick={handlePrevious}>
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      )}

      {hasNext && (
        <button className={styles.navButtonRight} onClick={handleNext}>
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      )}

      <div
        className={styles.imageContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt={`이미지 ${currentIndex + 1}`}
          className={styles.image}
        />
      </div>

      <div className={styles.counter}>
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
