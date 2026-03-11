import { ProtectedRoute } from '@/components/auth';

export default function PropertyFilterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
