'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/contexts/LayoutContext';
import {
  Header,
  ImageUploader,
  ImageGrid,
  MainButton,
  BottomFixedArea,
  Modal,
} from '@/components/common';

interface ImageItem {
  id: string;
  url: string;
}

export default function HomePage() {
  const router = useRouter();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setNavigationGuard } = useLayout();

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
    const newImages: ImageItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAnalyzeClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmAnalyze = () => {
    setIsModalOpen(false);
    setNavigationGuard(null);
    console.log('분석 요청', images);
    // TODO: 실제 분석 API 호출
    router.push('/loading-analysis');
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
          분석은 약 5-10분 정도 소요되며,
          <br />
          분석 상태는 홈에서 확인할 수 있어요.
        </p>
      </Modal>
    </>
  );
}
