'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLayout } from '@/contexts/LayoutContext';
import styles from './BottomNav.module.css';

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
  const { navigationGuard, setPendingPath } = useLayout();

  const handleNavClick = (targetPath: string) => {
    if (pathname === targetPath) return;

    if (navigationGuard) {
      setPendingPath(targetPath);
      return;
    }
    router.push(targetPath);
  };

  return (
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
  );
}
