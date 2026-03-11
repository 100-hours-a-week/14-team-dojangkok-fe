import { ProtectedRoute } from '@/components/auth';

export default function PropertyMyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
