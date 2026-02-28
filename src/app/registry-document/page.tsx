'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useToast } from '@/contexts/ToastContext';
import {
  uploadFiles,
  createEasyContract,
  deleteUploadedFile,
} from '@/lib/api/contract';
import { ApiError, ensureValidToken } from '@/lib/api/client';
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
  fileAssetId?: number;
}

export default function RegistryDocumentPage() {
  const router = useRouter();
  const toast = useToast();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBackModalOpen, setIsBackModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [contractFileIds, setContractFileIds] = useState<number[]>([]);
  const { startAnalysis, failAnalysis } = useAnalysis();

  useEffect(() => {
    const stored = sessionStorage.getItem('contractFileAssetIds');
    if (!stored) {
      router.replace('/');
      return;
    }
    setContractFileIds(JSON.parse(stored));
  }, [router]);

  const handleBackClick = () => {
    if (images.length > 0) {
      setIsBackModalOpen(true);
    } else {
      router.push('/');
    }
  };

  const handleUpload = async (files: FileList) => {
    if (isUploading) return;

    const MAX_IMAGES = 5;
    const currentCount = images.length;
    const filesToAdd = Array.from(files);

    if (currentCount + filesToAdd.length > MAX_IMAGES) {
      toast.error(
        `최대 5장까지만 선택할 수 있습니다. (현재: ${currentCount}장, 선택: ${filesToAdd.length}장)`
      );
      return;
    }

    const validationError = validateEasyContractFiles(filesToAdd);
    if (validationError) {
      toast.error(validationError.message);
      return;
    }

    try {
      setIsUploading(true);

      const fileAssetIds = await uploadFiles(filesToAdd);

      const newImages: ImageItem[] = filesToAdd.map((file, index) => ({
        id: fileAssetIds[index].toString(),
        url: URL.createObjectURL(file),
        file,
        fileAssetId: fileAssetIds[index],
      }));

      setImages((prev) => [...prev, ...newImages]);
      toast.success(`${filesToAdd.length}개 업로드 완료`);
    } catch (err) {
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
    setIsModalOpen(true);
  };

  const handleConfirmAnalyze = async () => {
    const isTokenValid = await ensureValidToken();
    if (!isTokenValid) {
      setIsModalOpen(false);
      toast.error('로그인이 만료되었습니다. 다시 로그인해주세요.');
      setTimeout(() => {
        router.push('/signin');
      }, 1500);
      return;
    }

    const registryFileIds = images
      .map((img) => img.fileAssetId)
      .filter((id): id is number => id !== undefined);

    if (images.length > 0 && registryFileIds.length !== images.length) {
      toast.error(
        '일부 이미지가 아직 업로드 중입니다. 잠시 후 다시 시도해주세요.'
      );
      return;
    }

    sessionStorage.removeItem('contractFileAssetIds');

    startAnalysis(0);
    setIsModalOpen(false);
    router.push('/loading-analysis');

    (async () => {
      try {
        const response = await createEasyContract(
          contractFileIds,
          registryFileIds
        );
        const easyContractId = response.data.easy_contract_id;
        // 실제 ID로 업데이트 — 완료는 SSE easy-contract-result 이벤트가 처리
        startAnalysis(easyContractId);
      } catch (err) {
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
      <Header
        title="등기부등본 첨부"
        showBackButton
        onBackClick={handleBackClick}
      />
      <main style={{ paddingBottom: 180 }}>
        {/* 서비스 소개 카드 */}
        <div style={{ padding: '20px 16px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: 16,
              background:
                'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #EFF6FF 100%)',
              border: '1px solid #BFDBFE',
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
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 9999,
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
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
                backgroundColor: '#DBEAFE',
                color: '#3B82F6',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 32 }}
              >
                article
              </span>
            </div>

            {/* 제목 */}
            <h1
              style={{
                color: '#111418',
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.3,
                paddingRight: 80,
                margin: '0 0 12px 0',
              }}
            >
              등기부등본도 함께 분석해요
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
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#3B82F6', fontSize: 16, marginTop: 2 }}
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
                  등기부등본으로 권리관계를 꼼꼼히 확인해요
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
                backgroundColor: 'rgba(191, 219, 254, 0.2)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* 업로더 헤더 */}
        <div
          style={{
            padding: '4px 16px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111418' }}>
            등기부등본
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#6366F1',
              backgroundColor: '#EEF2FF',
              padding: '2px 8px',
              borderRadius: 9999,
            }}
          >
            선택
          </span>
        </div>

        {/* 이미지 업로더 */}
        <div style={{ padding: '0 16px' }}>
          <ImageUploader
            onUpload={handleUpload}
            mainText={
              isUploading
                ? '이미지 업로드 중...'
                : '등기부등본 이미지를 첨부해주세요'
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
        <MainButton onClick={handleAnalyzeClick} disabled={isUploading}>
          {isUploading ? '이미지 업로드 중...' : '분석 요청하기'}
        </MainButton>
      </BottomFixedArea>

      {/* 분석 확인 모달 */}
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

      {/* 뒤로가기 확인 모달 */}
      <Modal
        isOpen={isBackModalOpen}
        onClose={() => setIsBackModalOpen(false)}
        onConfirm={() => {
          setIsBackModalOpen(false);
          router.push('/');
        }}
        title="이전 페이지로 이동할까요?"
        confirmText="이동"
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
          첨부된 이미지가 사라집니다.
        </p>
      </Modal>
    </>
  );
}
