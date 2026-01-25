'use client';

import { useState } from 'react';
import ImageViewerModal from '../ImageViewerModal';
import styles from './ImageGrid.module.css';

interface ImageItem {
  id: string;
  url: string;
}

interface ImageGridProps {
  images: ImageItem[];
  onDelete?: (id: string) => void;
  onImageClick?: (url: string) => void;
  title?: string;
  showCount?: boolean;
  enableViewer?: boolean;
  emptyText?: string;
}

export default function ImageGrid({
  images,
  onDelete,
  onImageClick,
  title = '첨부된 파일',
  showCount = true,
  enableViewer = true,
  emptyText = '첨부된 파일이 없습니다',
}: ImageGridProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  const handleImageClick = (url: string) => {
    // 외부 핸들러가 있으면 호출
    onImageClick?.(url);

    // 뷰어가 활성화되어 있으면 내부 뷰어 오픈
    if (enableViewer) {
      const index = images.findIndex((img) => img.url === url);
      if (index !== -1) {
        setSelectedImageIndex(index);
      }
    }
  };

  const handleCloseViewer = () => {
    setSelectedImageIndex(null);
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };
  if (images.length === 0) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.emptyState}>{emptyText}</div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {showCount && (
            <span className={styles.count}>{images.length}장 첨부됨</span>
          )}
        </div>
        <div className={styles.grid}>
          {images.map((image) => (
            <div key={image.id} className={styles.imageItem}>
              {onDelete && (
                <button
                  className={styles.deleteButton}
                  onClick={() => onDelete(image.id)}
                >
                  <span
                    className={`material-symbols-outlined ${styles.deleteIcon}`}
                  >
                    close
                  </span>
                </button>
              )}
              <div
                className={styles.imageWrapper}
                style={{ backgroundImage: `url("${image.url}")` }}
                onClick={() => handleImageClick(image.url)}
              >
                <div className={styles.imageOverlay} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {enableViewer && (
        <ImageViewerModal
          isOpen={selectedImageIndex !== null}
          images={images.map((img) => img.url)}
          currentIndex={selectedImageIndex ?? 0}
          onClose={handleCloseViewer}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
        />
      )}
    </>
  );
}
