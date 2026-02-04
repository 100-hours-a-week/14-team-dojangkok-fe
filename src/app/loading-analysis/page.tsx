'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/common/Header';
import Modal from '@/components/common/Modal';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

export default function AnalyzingPage() {
  const router = useRouter();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { analysisState, clearAnalysis } = useAnalysis();

  // 분석 완료 시 자동으로 결과 페이지로 이동
  useEffect(() => {
    if (analysisState.status === 'COMPLETED' && analysisState.easyContractId) {
      router.replace(`/analysis-result?id=${analysisState.easyContractId}`);
      clearAnalysis(); // 상태 초기화
    } else if (analysisState.status === 'FAILED') {
      // 실패 시 사용자에게 Toast 알림 표시
      const errorMessage =
        analysisState.error || '쉬운 계약서 생성에 실패했어요.';
      toast.error(errorMessage);
      clearAnalysis();
      // 홈으로 리다이렉트
      router.replace('/');
    }
  }, [analysisState, router, clearAnalysis, toast]);

  const handleCancel = () => {
    setIsModalOpen(true);
  };

  const handleGoHome = () => {
    setIsModalOpen(false);
    router.push('/');
  };

  const handleContinueWaiting = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <Header title="계약서 분석" showBackButton onBackClick={handleCancel} />

      <main className={styles.main}>
        <div className={styles.loaderWrapper}>
          <div className={styles.loaderTrack} />
          <div className={styles.loaderSpinner} />
          <div className={styles.loaderIcon}>
            <span className="material-symbols-outlined filled">
              find_in_page
            </span>
          </div>
          <div className={styles.loaderPing} />
        </div>

        <div className={styles.textWrapper}>
          <h1 className={styles.title}>
            계약서를 꼼꼼하게
            <br />
            분석하고 있어요
          </h1>
          <p className={styles.subtitle}>잠시만 기다려 주세요 (1~10분 소요)</p>
        </div>

        <div className={styles.infoBox}>
          <div className={styles.infoIcon}>
            <span className="material-symbols-outlined">info</span>
          </div>
          <div className={styles.infoText}>
            <p className={styles.infoTitle}>화면을 나가도 분석은 계속돼요!</p>
            <p className={styles.infoDescription}>
              홈 화면에서 진행 상태를 확인할 수 있어요.
            </p>
          </div>
        </div>
      </main>

      <div className={styles.backgroundBlur} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleContinueWaiting}
        onConfirm={handleGoHome}
        title="페이지를 나가시겠어요?"
        confirmText="홈으로 가기"
        cancelText="계속 대기하기"
      >
        <p className={styles.modalDescription}>
          화면을 나가더라도 분석은 백그라운드에서 계속 진행되며, 홈 화면에서
          상태를 확인할 수 있어요.
        </p>
      </Modal>
    </div>
  );
}
