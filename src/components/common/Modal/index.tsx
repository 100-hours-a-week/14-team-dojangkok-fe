'use client';

import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText = '확인',
  cancelText = '취소',
  children,
}: ModalProps) {
  if (!isOpen) return null;

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
          <button className={styles.confirmButton} onClick={onConfirm}>
            {confirmText}
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
