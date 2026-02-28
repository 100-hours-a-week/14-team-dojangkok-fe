'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/contexts/LayoutContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useToast } from '@/contexts/ToastContext';
import { uploadFiles, deleteUploadedFile } from '@/lib/api/contract';
import { ApiError } from '@/lib/api/client';
import { validateEasyContractFiles } from '@/utils/fileValidation';
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
  fileAssetId?: number; // 업로드된 파일의 서버 ID
}

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { setNavigationGuard } = useLayout();
  const { analysisState, clearAnalysis } = useAnalysis();

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

  const handleUpload = async (files: FileList) => {
    if (isUploading) return;

    const MAX_IMAGES = 5;
    const currentCount = images.length;
    const filesToAdd = Array.from(files);

    // 현재 개수 + 선택한 파일 개수가 최대치를 초과하면 전체 거부
    if (currentCount + filesToAdd.length > MAX_IMAGES) {
      toast.error(
        `최대 5장까지만 선택할 수 있습니다. (현재: ${currentCount}장, 선택: ${filesToAdd.length}장)`
      );
      return;
    }

    // 프론트엔드 검증 (파일 선택 시점)
    const validationError = validateEasyContractFiles(filesToAdd);
    if (validationError) {
      toast.error(validationError.message);
      return;
    }

    try {
      setIsUploading(true);

      // 즉시 API 호출하여 파일 업로드 (Presigned URL → S3 → 완료 알림)
      const fileAssetIds = await uploadFiles(filesToAdd);

      // 업로드된 파일 정보를 상태에 저장
      const newImages: ImageItem[] = filesToAdd.map((file, index) => ({
        id: fileAssetIds[index].toString(),
        url: URL.createObjectURL(file),
        file,
        fileAssetId: fileAssetIds[index],
      }));

      setImages((prev) => [...prev, ...newImages]);
      toast.success(`${filesToAdd.length}개 업로드 완료`);
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('이미지 업로드에 실패했습니다.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const fileAssetId = parseInt(id, 10);
    setImages((prev) => prev.filter((img) => img.id !== id));
    try {
      await deleteUploadedFile(fileAssetId);
    } catch {
      toast.error('파일 삭제에 실패했습니다.');
    }
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

    // 업로드된 파일 ID 확인
    const fileAssetIds = images
      .map((img) => img.fileAssetId)
      .filter((id): id is number => id !== undefined);

    // 계약서 파일 ID를 sessionStorage에 저장 후 등기부등본 페이지로 이동
    sessionStorage.setItem(
      'contractFileAssetIds',
      JSON.stringify(fileAssetIds)
    );
    setNavigationGuard(null);
    router.push('/registry-document');
  };

  return (
    <>
      <Header title="도장콕" />
      <main style={{ paddingBottom: 180 }}>
        {/* 서비스 소개 카드 */}
        <div style={{ padding: '20px 16px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: 16,
              background:
                'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 50%, #ECFDF5 100%)',
              border: '1px solid #D1FAE5',
              padding: '20px 24px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* AI 기능 배지 */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 9999,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 12 }}
              >
                auto_awesome
              </span>
              AI 기능
            </div>

            {/* 아이콘 */}
            <div
              style={{
                marginBottom: 16,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
                borderRadius: 9999,
                backgroundColor: '#D1FAE5',
                color: '#10b981',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 32 }}
              >
                task_alt
              </span>
            </div>

            {/* 제목 */}
            <h1
              style={{
                color: '#111418',
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.3,
                marginBottom: 12,
                paddingRight: 80,
                margin: 0,
              }}
            >
              도장 찍기 전에, 도장콕!
            </h1>

            {/* 설명 박스 */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: 12,
                border: '1px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: '#10b981',
                    fontSize: 16,
                    marginTop: 2,
                  }}
                >
                  check_circle
                </span>
                <p
                  style={{
                    color: '#4B5563',
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  계약서 내용을 쉬운 말로 읽어봐요
                </p>
              </div>
            </div>

            {/* 장식용 원형 */}
            <div
              style={{
                position: 'absolute',
                bottom: -24,
                right: -24,
                width: 96,
                height: 96,
                backgroundColor: 'rgba(167, 243, 208, 0.2)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* 이미지 업로더 */}
        <div style={{ padding: '0 16px' }}>
          <ImageUploader
            onUpload={handleUpload}
            mainText={
              isUploading
                ? '이미지 업로드 중...'
                : '계약서 이미지를 첨부해주세요'
            }
            subText="JPG, PNG, PDF 지원 · 한장 당 15MB, 최대 5장"
          />
        </div>

        {/* 이미지 그리드 */}
        {images.length > 0 && (
          <div style={{ padding: '12px 16px 0 16px' }}>
            <ImageGrid images={images} onDelete={handleDelete} />
          </div>
        )}
      </main>
      <BottomFixedArea>
        <MainButton
          onClick={handleAnalyzeClick}
          disabled={images.length === 0 || isUploading}
        >
          {isUploading ? '이미지 업로드 중...' : '다음'}
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
