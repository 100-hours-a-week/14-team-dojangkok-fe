'use client';

import styles from './FloatingAddButton.module.css';

interface FloatingAddButtonProps {
  onClick: () => void;
  withBottomNav?: boolean;
}

export default function FloatingAddButton({
  onClick,
  withBottomNav = false,
}: FloatingAddButtonProps) {
  return (
    <button
      className={`${styles.fab} ${withBottomNav ? styles.withBottomNav : ''}`}
      onClick={onClick}
      aria-label="새 집노트 추가"
    >
      <span className="material-symbols-outlined">add</span>
    </button>
  );
}
