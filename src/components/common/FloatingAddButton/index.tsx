'use client';

import styles from './FloatingAddButton.module.css';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export default function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <button
      className={styles.fab}
      onClick={onClick}
      aria-label="새 집노트 추가"
    >
      <span className="material-symbols-outlined">add</span>
    </button>
  );
}
