'use client';

import { useRouter } from 'next/navigation';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import BottomNav from '@/components/common/BottomNav';
import Modal from '@/components/common/Modal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function NavigationGuardModal() {
  const router = useRouter();
  const { navigationGuard, pendingPath, setPendingPath, setNavigationGuard } =
    useNavigationGuard();

  const handleConfirm = () => {
    if (pendingPath) {
      setNavigationGuard(null);
      router.push(pendingPath);
    }
    setPendingPath(null);
  };

  const handleCancel = () => {
    setPendingPath(null);
  };

  return (
    <Modal
      isOpen={!!pendingPath}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={navigationGuard?.message ?? '페이지를 이동할까요?'}
      confirmText="이동"
      cancelText="취소"
    >
      {navigationGuard?.subMessage && (
        <p
          style={{
            color: '#666',
            fontSize: 14,
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          {navigationGuard.subMessage}
        </p>
      )}
    </Modal>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
      <BottomNav />
      <NavigationGuardModal />
    </ProtectedRoute>
  );
}
