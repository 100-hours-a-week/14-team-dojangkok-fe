'use client';

import { useEffect } from 'react';
import styles from './Toast.module.css';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({
  id,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={`material-symbols-outlined ${styles.icon}`}>
        {getIcon()}
      </span>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
