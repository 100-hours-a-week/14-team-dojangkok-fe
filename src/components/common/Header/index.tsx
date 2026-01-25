'use client';

import styles from './Header.module.css';

type RightButtonProps =
  | { rightIcon: string; rightText?: never; onRightClick?: () => void }
  | { rightIcon?: never; rightText: string; onRightClick?: () => void }
  | { rightIcon?: never; rightText?: never; onRightClick?: never };

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightIconColor?: string;
} & RightButtonProps;

export default function Header({
  title,
  showBackButton = false,
  onBackClick,
  rightIcon,
  rightText,
  onRightClick,
  rightIconColor,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.leftArea}>
        {showBackButton && (
          <button className={styles.backButton} onClick={onBackClick}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
      </div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.rightArea}>
        {rightIcon && (
          <button
            className={styles.rightButton}
            onClick={onRightClick}
            style={rightIconColor ? { color: rightIconColor } : undefined}
          >
            <span className="material-symbols-outlined">{rightIcon}</span>
          </button>
        )}
        {rightText && (
          <button className={styles.rightButton} onClick={onRightClick}>
            <span className={styles.rightText}>{rightText}</span>
          </button>
        )}
      </div>
    </header>
  );
}
