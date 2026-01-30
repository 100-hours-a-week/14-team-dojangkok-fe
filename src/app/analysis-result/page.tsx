'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Header from '@/components/common/Header';
import { getEasyContract } from '@/lib/api/contract';
import { EasyContractData } from '@/types/contract';
import styles from './page.module.css';

export default function AnalysisResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contractData, setContractData] = useState<EasyContractData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContract = async () => {
      const id = searchParams.get('id');
      if (!id) {
        setError('계약서 ID가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await getEasyContract(Number(id));
        setContractData(response.data);
      } catch (err) {
        console.error('계약서 조회 실패:', err);
        setError('계약서를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContract();
  }, [searchParams]);

  const handleBackClick = () => {
    router.push('/storage');
  };

  return (
    <>
      <Header
        title={contractData?.title || '분석 결과'}
        showBackButton
        onBackClick={handleBackClick}
      />
      <main className={styles.main}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            로딩 중...
          </div>
        ) : error ? (
          <div
            style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}
          >
            {error}
          </div>
        ) : contractData?.status === 'PROCESSING' ||
          contractData?.status === 'PENDING' ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            <p>분석이 진행 중입니다...</p>
            <p style={{ fontSize: '14px', marginTop: '1rem' }}>
              잠시만 기다려주세요.
            </p>
          </div>
        ) : contractData?.status === 'FAILED' ? (
          <div
            style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}
          >
            분석에 실패했습니다.
          </div>
        ) : contractData ? (
          <div className={styles.markdown}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {contractData.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            데이터가 없습니다.
          </div>
        )}
      </main>
    </>
  );
}
