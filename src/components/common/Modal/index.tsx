'use client';

import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText = '확인',
  cancelText = '취소',
  confirmDisabled = false,
  variant = 'default',
  children,
}: ModalProps) {
  if (!isOpen) return null;

  const confirmButtonClass =
    variant === 'destructive'
      ? styles.confirmButtonDestructive
      : styles.confirmButton;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
          </div>
        )}
        <div className={styles.content}>{children}</div>
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            {cancelText}
          </button>
          <button
            className={confirmButtonClass}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
