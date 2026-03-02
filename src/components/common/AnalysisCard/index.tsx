'use client';

import { AnalysisResult } from '@/app/(main)/storage/types';
import styles from './AnalysisCard.module.css';

interface AnalysisCardProps {
  result: AnalysisResult;
  onClick: (id: string) => void;
  onOptionClick: (id: string, event: React.MouseEvent) => void;
  onCancelClick?: (id: string) => void;
}

export default function AnalysisCard({
  result,
  onClick,
  onOptionClick,
  onCancelClick,
}: AnalysisCardProps) {
  const isProcessing = result.status === 'PROCESSING';

  const handleClick = () => {
    onClick(result.id);
  };

  const handleOptionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOptionClick(result.id, e);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelClick?.(result.id);
  };

  return (
    <article
      className={`${styles.card} ${isProcessing ? styles.cardProcessing : ''}`}
      onClick={handleClick}
    >
      <div className={`${styles.colorBar} ${isProcessing ? styles.colorBarProcessing : ''}`} />
      <div className={styles.content}>
        <div className={styles.info}>
          {isProcessing ? (
            <>
              <div className={styles.processingRow}>
                <span className={styles.processingDot} />
                <span className={styles.processingLabel}>분석 중</span>
              </div>
              <p className={styles.date}>{result.date}</p>
            </>
          ) : (
            <>
              <h3 className={styles.title}>{result.address || '제목 없음'}</h3>
              <p className={styles.date}>{result.date}</p>
            </>
          )}
        </div>
        {isProcessing ? (
          <button
            className={styles.cancelButton}
            onClick={handleCancelClick}
            aria-label="분석 취소"
          >
            취소
          </button>
        ) : (
          <button
            className={styles.optionButton}
            onClick={handleOptionClick}
            aria-label="옵션"
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        )}
      </div>
    </article>
  );
}
