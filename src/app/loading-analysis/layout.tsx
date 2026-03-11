import { ProtectedRoute } from '@/components/auth';

export default function LoadingAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
