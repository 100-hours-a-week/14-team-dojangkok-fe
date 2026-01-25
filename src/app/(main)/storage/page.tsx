'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Header,
  AnalysisCard,
  ActionSheet,
  TextFieldModal,
  Modal,
} from '@/components/common';
import { AnalysisResult } from './types';
import { ActionSheetOption } from '@/components/common/ActionSheet';
import styles from './Storage.module.css';

const mockResults: AnalysisResult[] = [
  {
    id: '1',
    address: '서울특별시 강남구 테헤란로 123',
    date: '2024.01.15',
  },
  {
    id: '2',
    address: '서울특별시 서초구 강남대로 456',
    date: '2024.01.10',
  },
  {
    id: '3',
    address: '서울특별시 송파구 올림픽로 789',
    date: '2024.01.05',
  },
];

export default function StoragePage() {
  const router = useRouter();
  const [results, setResults] = useState<AnalysisResult[]>(mockResults);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionSheetPosition, setActionSheetPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const selectedResult = results.find((r) => r.id === selectedResultId);

  const handleResultClick = (id: string) => {
    router.push(`/analysis-result?id=${id}`);
  };

  const handleOptionClick = (id: string, event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const maxWidth = 430;
    const containerPadding = Math.max(0, (viewportWidth - maxWidth) / 2);

    setSelectedResultId(id);
    setActionSheetPosition({
      top: rect.bottom + 4,
      right: containerPadding + (viewportWidth - containerPadding - rect.right),
    });
    setIsActionSheetOpen(true);
  };

  const handleEditClick = () => {
    setIsActionSheetOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsActionSheetOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = (newAddress: string) => {
    if (selectedResultId) {
      setResults(
        results.map((r) =>
          r.id === selectedResultId ? { ...r, address: newAddress } : r
        )
      );
      setIsEditModalOpen(false);
      setSelectedResultId(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedResultId) {
      setResults(results.filter((r) => r.id !== selectedResultId));
      setIsDeleteModalOpen(false);
      setSelectedResultId(null);
    }
  };

  const actionSheetOptions: ActionSheetOption[] = [
    {
      label: '이름 수정',
      icon: 'edit',
      onClick: handleEditClick,
    },
    {
      label: '삭제',
      icon: 'delete',
      onClick: handleDeleteClick,
      destructive: true,
    },
  ];

  return (
    <>
      <Header title="보관함" />
      <main className={styles.container}>
        {results.length > 0 ? (
          <>
            <p className={styles.count}>총 {results.length}건</p>
            <div className={styles.list}>
              {results.map((result) => (
                <AnalysisCard
                  key={result.id}
                  result={result}
                  onClick={handleResultClick}
                  onOptionClick={handleOptionClick}
                />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <span className={`material-symbols-outlined ${styles.emptyIcon}`}>
              folder_open
            </span>
            <p className={styles.emptyText}>분석 결과가 없습니다</p>
          </div>
        )}
      </main>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        options={actionSheetOptions}
        position={actionSheetPosition || undefined}
      />

      <TextFieldModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        title="이름 수정"
        initialValue={selectedResult?.address || ''}
        placeholder="주소를 입력하세요"
        maxLength={50}
        confirmText="수정하기"
        cancelText="취소"
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="분석 결과 삭제"
        confirmText="삭제하기"
        cancelText="취소"
        variant="destructive"
      >
        이 분석 결과를 삭제하시겠습니까?
      </Modal>
    </>
  );
}
