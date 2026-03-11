import { ProtectedRoute } from '@/components/auth';

export default function PropertyCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
