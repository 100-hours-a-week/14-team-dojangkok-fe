'use client';

import { useEffect, useRef } from 'react';
import styles from './ActionSheet.module.css';

export interface ActionSheetOption {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  icon?: string;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
}

export default function ActionSheet({
  isOpen,
  onClose,
  options,
}: ActionSheetProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // 약간의 지연을 두고 이벤트 리스너 추가 (메뉴가 열릴 때 즉시 닫히는 것 방지)
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOptionClick = (option: ActionSheetOption) => {
    option.onClick();
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div ref={menuRef} className={styles.popover}>
        {options.map((option, index) => (
          <button
            key={index}
            className={`${styles.option} ${
              option.destructive ? styles.destructive : ''
            }`}
            onClick={() => handleOptionClick(option)}
          >
            {option.icon && (
              <span className="material-symbols-outlined">{option.icon}</span>
            )}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
