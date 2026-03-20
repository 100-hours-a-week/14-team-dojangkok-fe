'use client';

import styles from './FloatingAddButton.module.css';

interface FloatingAddButtonProps {
  onClick: () => void;
  withBottomNav?: boolean;
  icon?: string;
  ariaLabel?: string;
}

export default function FloatingAddButton({
  onClick,
  withBottomNav = false,
  icon = 'add',
  ariaLabel = '새 집노트 추가',
}: FloatingAddButtonProps) {
  return (
    <button
      className={`${styles.fab} ${withBottomNav ? styles.withBottomNav : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}
