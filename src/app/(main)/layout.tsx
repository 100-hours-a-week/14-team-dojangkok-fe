import { LayoutProvider } from '@/contexts/LayoutContext';
import { BottomNav } from '@/components/common';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutProvider hasBottomNav={true}>
      {children}
      <BottomNav />
    </LayoutProvider>
  );
}
