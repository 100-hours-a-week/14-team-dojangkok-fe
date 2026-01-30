'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/contexts/LayoutContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { uploadFiles, createEasyContract } from '@/lib/api/contract';
import { ApiError } from '@/lib/api/client';
import dynamic from 'next/dynamic';
import {
  Header,
  ImageUploader,
  MainButton,
  BottomFixedArea,
  Modal,
} from '@/components/common';

const ImageGrid = dynamic(() => import('@/components/common/ImageGrid'), {
  ssr: false,
});

interface ImageItem {
  id: string;
  url: string;
  file: File;
}

export default function HomePage() {
  const router = useRouter();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const { setNavigationGuard } = useLayout();
  const {
    analysisState,
    startAnalysis,
    completeAnalysis,
    failAnalysis,
    clearAnalysis,
  } = useAnalysis();

  useEffect(() => {
    if (images.length > 0) {
      setNavigationGuard({
        message: '페이지를 이동할까요?',
        subMessage: '첨부된 이미지가 사라집니다.',
      });
    } else {
      setNavigationGuard(null);
    }

    return () => {
      setNavigationGuard(null);
    };
  }, [images.length, setNavigationGuard]);

  const handleUpload = (files: FileList) => {
    const MAX_IMAGES = 5;
    const remainingSlots = MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {
      alert('이미지는 최대 5장까지만 업로드할 수 있습니다.');
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newImages: ImageItem[] = filesToAdd.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    }));

    setImages((prev) => [...prev, ...newImages]);

    if (files.length > remainingSlots) {
      alert(
        `최대 5장까지만 업로드할 수 있어 ${remainingSlots}장만 추가되었습니다.`
      );
    }
  };

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAnalyzeClick = () => {
    // 이미 분석이 진행 중이거나 완료 대기 중이면 경고 모달
    if (
      analysisState.status === 'PROCESSING' ||
      analysisState.status === 'COMPLETED'
    ) {
      setIsWarningModalOpen(true);
      return;
    }

    // 일반 분석 요청
    setIsModalOpen(true);
  };

  const handleConfirmAnalyze = () => {
    // 1. 즉시 전역 상태를 PROCESSING으로 설정 (임시 ID)
    startAnalysis(0);

    // 2. 모달 닫고 로딩 페이지로 이동
    setIsModalOpen(false);
    setNavigationGuard(null);
    router.push('/loading-analysis');

    // 3. 백그라운드에서 API 호출 (페이지 이동과 독립적으로 실행)
    (async () => {
      try {
        // 파일 업로드 (Presigned URL → S3 → 완료 알림)
        const files = images.map((img) => img.file);
        const fileAssetIds = await uploadFiles(files);

        // 쉬운 계약서 생성 및 분석 (API 응답 시 이미 분석 완료)
        const response = await createEasyContract(fileAssetIds);
        const easyContractId = response.data.easy_contract_id;

        // 분석 완료 처리
        completeAnalysis(easyContractId);
      } catch (err) {
        console.error('분석 요청 실패:', err);
        if (err instanceof ApiError) {
          failAnalysis(0, err.message);
        } else {
          failAnalysis(0, '분석 요청에 실패했습니다.');
        }
      }
    })();
  };

  return (
    <>
      <Header title="도장콕" />
      <main style={{ padding: 16, paddingBottom: 180 }}>
        <ImageUploader onUpload={handleUpload} />
        {images.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              color: '#888',
              marginTop: 24,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            분석할 계약서 이미지를 업로드해주세요
          </p>
        ) : (
          <ImageGrid images={images} onDelete={handleDelete} />
        )}
      </main>
      <BottomFixedArea>
        <MainButton onClick={handleAnalyzeClick} disabled={images.length === 0}>
          분석 요청하기
        </MainButton>
      </BottomFixedArea>

      {/* 분석 진행 중 플로팅 버튼 */}
      {analysisState.status === 'PROCESSING' && (
        <button
          onClick={() => router.push('/loading-analysis')}
          style={{
            position: 'fixed',
            bottom: '200px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4F46E5',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '24px',
            border: 'none',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 1000,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}
          >
            progress_activity
          </span>
          분석 진행 중
        </button>
      )}

      {/* 분석 완료 플로팅 버튼 */}
      {analysisState.status === 'COMPLETED' && analysisState.easyContractId && (
        <button
          onClick={() => {
            router.push(`/analysis-result?id=${analysisState.easyContractId}`);
            clearAnalysis();
          }}
          style={{
            position: 'fixed',
            bottom: '200px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#10B981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '24px',
            border: 'none',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 1000,
            animation: 'bounce 0.5s ease-in-out',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px' }}
          >
            check_circle
          </span>
          분석 완료!
        </button>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAnalyze}
        title="계약서 분석을 시작할까요?"
        confirmText="분석 시작"
        cancelText="취소"
      >
        <p
          style={{
            color: '#666',
            fontSize: 14,
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          분석은 1~10분 소요되며,
          <br />
          분석 상태는 홈에서 확인할 수 있어요.
        </p>
      </Modal>

      {/* 분석 진행 중 경고 모달 */}
      <Modal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onConfirm={() => {
          setIsWarningModalOpen(false);
          if (analysisState.status === 'PROCESSING') {
            router.push('/loading-analysis');
          } else if (
            analysisState.status === 'COMPLETED' &&
            analysisState.easyContractId
          ) {
            router.push(`/analysis-result?id=${analysisState.easyContractId}`);
            clearAnalysis();
          }
        }}
        title="이미 분석이 진행 중입니다"
        confirmText={
          analysisState.status === 'COMPLETED' ? '결과 확인하기' : '확인하기'
        }
        cancelText="취소"
      >
        <p
          style={{
            color: '#666',
            fontSize: 14,
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          {analysisState.status === 'PROCESSING'
            ? '현재 계약서 분석이 진행 중입니다.\n로딩 페이지에서 진행 상태를 확인하세요.'
            : '분석이 완료되었습니다.\n결과 페이지로 이동하시겠어요?'}
        </p>
      </Modal>
    </>
  );
}
