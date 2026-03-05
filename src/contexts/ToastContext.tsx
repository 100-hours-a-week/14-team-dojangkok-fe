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
  ) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
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
      return id;
    },
    []
  );

  const success = useCallback(
    (message: string, duration: number = 3000) =>
      toast(message, 'success', duration),
    [toast]
  );

  const error = useCallback(
    (message: string, duration: number = 3000) =>
      toast(message, 'error', duration),
    [toast]
  );

  const info = useCallback(
    (message: string, duration: number = 3000) =>
      toast(message, 'info', duration),
    [toast]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismiss = useCallback((id: string) => removeToast(id), [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
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
