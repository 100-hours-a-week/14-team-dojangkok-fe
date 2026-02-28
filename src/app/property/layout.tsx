import { ProtectedRoute } from '@/components/auth';
import { LayoutProvider } from '@/contexts/LayoutContext';

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <LayoutProvider hasBottomNav={false}>{children}</LayoutProvider>
    </ProtectedRoute>
  );
}
