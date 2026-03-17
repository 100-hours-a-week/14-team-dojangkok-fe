import { ProtectedRoute } from '@/components/auth';

export default function PropertyProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
