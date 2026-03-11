import { ProtectedRoute } from '@/components/auth';

export default function RegistryDocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
