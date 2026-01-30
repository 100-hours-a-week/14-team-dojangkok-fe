'use client';

import { useState, useEffect } from 'react';
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
import {
  getEasyContractList,
  updateEasyContractTitle,
  deleteEasyContract,
} from '@/lib/api/contract';
import { EasyContractListItem } from '@/types/contract';
import styles from './Storage.module.css';

/**
 * ISO 날짜를 YYYY.MM.DD 형식으로 변환
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * API 응답을 AnalysisResult 형식으로 변환
 */
function mapToAnalysisResult(item: EasyContractListItem): AnalysisResult {
  return {
    id: String(item.easy_contract_id),
    address: item.title,
    date: formatDate(item.created_at),
  };
}

export default function StoragePage() {
  const router = useRouter();
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionSheetPosition, setActionSheetPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const selectedResult = results.find((r) => r.id === selectedResultId);

  // 쉬운 계약서 목록 조회
  useEffect(() => {
    const loadContracts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getEasyContractList();
        const mappedResults =
          response.data.easyContractListItemList.map(mapToAnalysisResult);
        setResults(mappedResults);
      } catch (err) {
        console.error('계약서 목록 조회 실패:', err);
        setError('계약서 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
  }, []);

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

  const handleEditSubmit = async (newAddress: string) => {
    if (selectedResultId) {
      try {
        // API 호출하여 제목 수정
        await updateEasyContractTitle(Number(selectedResultId), newAddress);

        // 로컬 상태 업데이트
        setResults(
          results.map((r) =>
            r.id === selectedResultId ? { ...r, address: newAddress } : r
          )
        );
        setIsEditModalOpen(false);
        setSelectedResultId(null);
      } catch (err) {
        console.error('제목 수정 실패:', err);
        // 에러 처리 (필요시 사용자에게 알림)
        alert('제목 수정에 실패했습니다.');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedResultId) {
      try {
        // API 호출하여 계약서 삭제
        await deleteEasyContract(Number(selectedResultId));

        // 로컬 상태 업데이트
        setResults(results.filter((r) => r.id !== selectedResultId));
        setIsDeleteModalOpen(false);
        setSelectedResultId(null);
      } catch (err) {
        console.error('계약서 삭제 실패:', err);
        // 에러 처리 (필요시 사용자에게 알림)
        alert('계약서 삭제에 실패했습니다.');
      }
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
        {isLoading ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>로딩 중...</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <span className={`material-symbols-outlined ${styles.emptyIcon}`}>
              error
            </span>
            <p className={styles.emptyText}>{error}</p>
          </div>
        ) : results.length > 0 ? (
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
