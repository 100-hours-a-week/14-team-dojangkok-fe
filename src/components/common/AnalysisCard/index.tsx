'use client';

import { AnalysisResult } from '@/app/(main)/storage/types';
import styles from './AnalysisCard.module.css';

interface AnalysisCardProps {
  result: AnalysisResult;
  onClick: (id: string) => void;
  onOptionClick: (id: string, event: React.MouseEvent) => void;
}

export default function AnalysisCard({
  result,
  onClick,
  onOptionClick,
}: AnalysisCardProps) {
  const handleClick = () => {
    onClick(result.id);
  };

  const handleOptionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOptionClick(result.id, e);
  };

  return (
    <article className={styles.card} onClick={handleClick}>
      <div className={styles.colorBar} />
      <div className={styles.content}>
        <div className={styles.info}>
          <h3 className={styles.title}>{result.address}</h3>
          <p className={styles.date}>{result.date}</p>
        </div>
        <button
          className={styles.optionButton}
          onClick={handleOptionClick}
          aria-label="옵션"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>
    </article>
  );
}
