import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { AnalysisProvider } from '@/contexts/AnalysisContext';
import './globals.css';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: '도장콕',
  description: '계약서 분석 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <AnalysisProvider>
            <div className={styles.wrapper}>
              <div className={styles.container}>{children}</div>
            </div>
          </AnalysisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
