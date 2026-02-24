'use client';

import styles from './SearchBar.module.css';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onClick?: () => void;
}

export default function SearchBar({
  placeholder = '검색',
  value = '',
  onChange,
  onClick,
}: SearchBarProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={`${styles.container} ${isClickable ? styles.clickable : ''}`}
      onClick={isClickable ? onClick : undefined}
    >
      <span className={`material-symbols-outlined ${styles.icon}`}>
        search
      </span>
      <input
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={isClickable}
      />
    </div>
  );
}
