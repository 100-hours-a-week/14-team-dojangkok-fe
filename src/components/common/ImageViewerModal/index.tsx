'use client';

import { useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import styles from './ImageViewerModal.module.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ImageItem {
  id: string;
  url: string;
  file?: File;
}

interface ImageViewerModalProps {
  isOpen: boolean;
  images: ImageItem[];
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

  const currentItem = images[currentIndex];
  const isPDF = currentItem.file?.type === 'application/pdf';
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
        {isPDF ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
            }}
          >
            <Document
              file={currentItem.url}
              loading={
                <div
                  style={{
                    color: 'white',
                    fontSize: '16px',
                  }}
                >
                  PDF 로딩 중...
                </div>
              }
              error={
                <div
                  style={{
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '48px', color: '#DC2626' }}
                  >
                    picture_as_pdf
                  </span>
                  <span>PDF를 불러올 수 없습니다</span>
                </div>
              }
            >
              <Page
                pageNumber={1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentItem.url}
            alt={`이미지 ${currentIndex + 1}`}
            className={styles.image}
          />
        )}
      </div>

      <div className={styles.counter}>
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
