import { ProtectedRoute } from '@/components/auth';

export default function HomeNoteDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
