import { ProtectedRoute } from '@/components/auth';

export default function PropertySearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
