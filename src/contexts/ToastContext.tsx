'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import ToastContainer from '@/components/common/Toast/ToastContainer';

interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
}

interface ToastContextType {
  toast: (
    message: string,
    type?: 'info' | 'success' | 'error',
    duration?: number
  ) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (
      message: string,
      type: 'info' | 'success' | 'error' = 'info',
      duration: number = 3000
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const success = useCallback(
    (message: string, duration: number = 3000) => {
      toast(message, 'success', duration);
    },
    [toast]
  );

  const error = useCallback(
    (message: string, duration: number = 3000) => {
      toast(message, 'error', duration);
    },
    [toast]
  );

  const info = useCallback(
    (message: string, duration: number = 3000) => {
      toast(message, 'info', duration);
    },
    [toast]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
