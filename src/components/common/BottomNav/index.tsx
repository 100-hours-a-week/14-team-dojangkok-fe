'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/common/Modal';
import styles from './BottomNav.module.css';

const PROTECTED_PATHS = ['/', '/storage', '/home-notes', '/mypage'];

interface NavItem {
  path: string;
  icon: string;
  iconFilled: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', icon: 'home', iconFilled: 'home', label: '홈' },
  {
    path: '/storage',
    icon: 'folder_open',
    iconFilled: 'folder',
    label: '보관함',
  },
  {
    path: '/home-notes',
    icon: 'edit_note',
    iconFilled: 'edit_note',
    label: '집노트',
  },
  {
    path: '/property',
    icon: 'apartment',
    iconFilled: 'apartment',
    label: '매물',
  },
  {
    path: '/mypage',
    icon: 'person',
    iconFilled: 'person',
    label: '마이페이지',
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { navigationGuard, setPendingPath } = useNavigationGuard();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--toast-bottom-nav', '88px');
    return () => {
      document.documentElement.style.removeProperty('--toast-bottom-nav');
    };
  }, []);

  const handleNavClick = (targetPath: string) => {
    if (pathname === targetPath) return;

    if (!isAuthenticated && PROTECTED_PATHS.includes(targetPath)) {
      setShowLoginModal(true);
      return;
    }

    if (navigationGuard) {
      setPendingPath(targetPath);
      return;
    }
    router.push(targetPath);
  };

  return (
    <>
      <Modal
        isOpen={showLoginModal}
        title="로그인이 필요해요"
        confirmText="로그인하러 가기"
        cancelText="취소"
        onConfirm={() => router.push('/signin')}
        onClose={() => setShowLoginModal(false)}
      >
        로그인 페이지로 이동할까요?
      </Modal>
      <nav className={styles.nav}>
      <div
        className={styles.navContainer}
        style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)` }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              <span
                className={`material-symbols-outlined ${styles.navIcon} ${isActive ? 'filled' : ''}`}
              >
                {isActive ? item.iconFilled : item.icon}
              </span>
              <span
                className={`${styles.navLabel} ${isActive ? styles.navLabelActive : ''}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
}
