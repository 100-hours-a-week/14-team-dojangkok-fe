'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import ImageViewerModal from '../ImageViewerModal';
import styles from './ImageGrid.module.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ImageItem {
  id: string;
  url: string;
  file?: File;
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
          {images.map((image) => {
            const isPDF = image.file?.type === 'application/pdf';
            return (
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
                {isPDF ? (
                  <div
                    className={styles.imageWrapper}
                    onClick={() => handleImageClick(image.url)}
                    style={{
                      backgroundColor: '#f3f4f6',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Document
                      file={image.url}
                      loading={
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                          }}
                        >
                          로딩 중...
                        </div>
                      }
                      error={
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: '8px',
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '32px', color: '#DC2626' }}
                          >
                            picture_as_pdf
                          </span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            PDF
                          </span>
                        </div>
                      }
                    >
                      <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
                        <Page
                          pageNumber={1}
                          width={100}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </div>
                    </Document>
                  </div>
                ) : (
                  <div
                    className={styles.imageWrapper}
                    style={{ backgroundImage: `url("${image.url}")` }}
                    onClick={() => handleImageClick(image.url)}
                  >
                    <div className={styles.imageOverlay} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {enableViewer && (
        <ImageViewerModal
          isOpen={selectedImageIndex !== null}
          images={images}
          currentIndex={selectedImageIndex ?? 0}
          onClose={handleCloseViewer}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
        />
      )}
    </>
  );
}
