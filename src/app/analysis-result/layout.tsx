import { ProtectedRoute } from '@/components/auth';

export default function AnalysisResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
