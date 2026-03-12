import { ProtectedRoute } from '@/components/auth';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
