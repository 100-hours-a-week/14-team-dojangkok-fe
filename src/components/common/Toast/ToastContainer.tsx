'use client';

import Toast from './index';
import styles from './ToastContainer.module.css';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export default function ToastContainer({
  toasts,
  onClose,
}: ToastContainerProps) {
  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
