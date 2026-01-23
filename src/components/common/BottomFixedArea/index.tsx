'use client';

import { useLayout } from '@/contexts/LayoutContext';
import styles from './BottomFixedArea.module.css';

interface BottomFixedAreaProps {
  children: React.ReactNode;
}

export default function BottomFixedArea({ children }: BottomFixedAreaProps) {
  const { hasBottomNav } = useLayout();

  return (
    <div
      className={styles.container}
      style={{ bottom: hasBottomNav ? '80px' : '0' }}
    >
      {children}
    </div>
  );
}
