'use client';

import styles from './MainButton.module.css';

interface MainButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: string;
}

export default function MainButton({
  children,
  onClick,
  disabled = false,
  icon,
}: MainButtonProps) {
  return (
    <button className={styles.button} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      {icon && (
        <span className={`material-symbols-outlined ${styles.buttonIcon}`}>
          {icon}
        </span>
      )}
    </button>
  );
}
