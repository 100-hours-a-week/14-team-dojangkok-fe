'use client';

import { useEffect } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import styles from './BottomFixedArea.module.css';

interface BottomFixedAreaProps {
  children: React.ReactNode;
}

export default function BottomFixedArea({ children }: BottomFixedAreaProps) {
  const { hasBottomNav } = useLayout();
  const bottom = hasBottomNav ? '80px' : '0';

  useEffect(() => {
    // 버튼 영역 높이(padding 20px * 2 + 버튼 ~52px) + bottom 오프셋
    const toastBottom = hasBottomNav ? '180px' : '100px';
    document.documentElement.style.setProperty(
      '--toast-bottom-fixed',
      toastBottom
    );
    return () => {
      document.documentElement.style.removeProperty('--toast-bottom-fixed');
    };
  }, [hasBottomNav]);

  return (
    <div className={styles.container} style={{ bottom }}>
      {children}
    </div>
  );
}
