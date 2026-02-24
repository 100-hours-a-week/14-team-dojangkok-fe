'use client';

import { ReactNode } from 'react';
import styles from './FilterChip.module.css';

interface FilterChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  showDropdown?: boolean;
  badge?: ReactNode;
}

export default function FilterChip({
  children,
  active = false,
  onClick,
  showDropdown = false,
  badge,
}: FilterChipProps) {
  return (
    <button
      className={`${styles.chip} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      <span className={styles.label}>{children}</span>
      {badge && <span className={styles.badge}>{badge}</span>}
      {showDropdown && (
        <span className={`material-symbols-outlined ${styles.dropdownIcon}`}>
          expand_more
        </span>
      )}
    </button>
  );
}
