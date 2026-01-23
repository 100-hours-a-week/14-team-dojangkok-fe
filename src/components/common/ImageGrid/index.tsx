'use client';

import styles from './ImageGrid.module.css';

interface ImageItem {
  id: string;
  url: string;
}

interface ImageGridProps {
  images: ImageItem[];
  onDelete?: (id: string) => void;
  title?: string;
  showCount?: boolean;
}

export default function ImageGrid({
  images,
  onDelete,
  title = '첨부된 파일',
  showCount = true,
}: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.emptyState}>첨부된 파일이 없습니다</div>
      </div>
    );
  }

  return (
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
            >
              <div className={styles.imageOverlay} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
