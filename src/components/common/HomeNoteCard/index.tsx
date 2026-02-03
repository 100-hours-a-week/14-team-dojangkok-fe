'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import { HomeNote } from '@/app/(main)/home-notes/types';
import styles from './HomeNoteCard.module.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const remainingCount = note.totalFileCount - 4;

  // 2x2 그리드를 채우기 위해 빈 슬롯 계산 (2-3장인 경우)
  const emptySlots =
    hasImages && !isSingleImage && note.images.length < 4
      ? 4 - note.images.length
      : 0;

  // PDF 여부 판단
  const isPDF = (url: string) => {
    const urlLower = url.toLowerCase();
    return (
      urlLower.includes('/pdf/') ||
      urlLower.includes('.pdf?') ||
      urlLower.endsWith('.pdf')
    );
  };

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
                {isPDF(image.url) ? (
                  <div className={styles.pdfWrapper}>
                    <Document
                      file={image.url}
                      loading={
                        <div className={styles.pdfLoading}>
                          <span className="material-symbols-outlined">
                            picture_as_pdf
                          </span>
                        </div>
                      }
                      error={
                        <div className={styles.pdfError}>
                          <span className="material-symbols-outlined">
                            error
                          </span>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={1}
                        width={200}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image.url}
                    alt={`${note.title} ${index + 1}`}
                    className={styles.image}
                  />
                )}
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
