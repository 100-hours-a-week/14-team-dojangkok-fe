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
  cancelEasyContract,
} from '@/lib/api/contract';
import { EasyContractListItem } from '@/types/contract';
import { formatDate } from '@/utils/formatDate';
import { useAnalysis } from '@/contexts/AnalysisContext';
import styles from './Storage.module.css';

/**
 * API 응답을 AnalysisResult 형식으로 변환
 */
function mapToAnalysisResult(item: EasyContractListItem): AnalysisResult {
  return {
    id: String(item.easy_contract_id),
    address: item.title ?? '',
    date: formatDate(item.created_at),
    status: item.status,
  };
}

export default function StoragePage() {
  const router = useRouter();
  const { startAnalysis, analysisState } = useAnalysis();
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionSheetPosition, setActionSheetPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const selectedResult = results.find((r) => r.id === selectedResultId);

  const fetchContracts = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setError(null);
      const response = await getEasyContractList();
      const mappedResults = response.data.easyContractListItemList
        .filter((item) => item.status !== 'FAILED')
        .map(mapToAnalysisResult);
      setResults(mappedResults);
    } catch (err) {
      console.error('계약서 목록 조회 실패:', err);
      if (!silent) setError('계약서 목록을 불러오는데 실패했습니다.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // 초기 목록 조회
  useEffect(() => {
    fetchContracts();
  }, []);

  // SSE 분석 결과 수신 시 조용히 목록 갱신
  useEffect(() => {
    if (
      analysisState.easyContractId &&
      (analysisState.status === 'COMPLETED' ||
        analysisState.status === 'FAILED')
    ) {
      fetchContracts(true);
    }
  }, [analysisState.status, analysisState.easyContractId]);

  const handleResultClick = (id: string) => {
    const result = results.find((r) => r.id === id);
    if (result?.status === 'PROCESSING') {
      startAnalysis(Number(id));
      router.push('/loading-analysis');
      return;
    }
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

  const handleCancelClick = (id: string) => {
    setSelectedResultId(id);
    setIsCancelModalOpen(true);
  };

  const handleEditSubmit = async (newAddress: string) => {
    if (selectedResultId) {
      try {
        await updateEasyContractTitle(Number(selectedResultId), newAddress);
        setResults(
          results.map((r) =>
            r.id === selectedResultId ? { ...r, address: newAddress } : r
          )
        );
        setIsEditModalOpen(false);
        setSelectedResultId(null);
      } catch (err) {
        console.error('제목 수정 실패:', err);
        alert('제목 수정에 실패했습니다.');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedResultId) {
      try {
        await deleteEasyContract(Number(selectedResultId));
        setResults(results.filter((r) => r.id !== selectedResultId));
        setIsDeleteModalOpen(false);
        setSelectedResultId(null);
      } catch (err) {
        console.error('계약서 삭제 실패:', err);
        alert('계약서 삭제에 실패했습니다.');
      }
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedResultId || isCancelling) return;
    setIsCancelling(true);
    try {
      await cancelEasyContract(Number(selectedResultId));
      setResults(results.filter((r) => r.id !== selectedResultId));
      setIsCancelModalOpen(false);
      setSelectedResultId(null);
    } catch (err) {
      console.error('분석 중단 실패:', err);
      alert('분석 중단에 실패했습니다.');
    } finally {
      setIsCancelling(false);
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
                  onCancelClick={handleCancelClick}
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

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="분석을 중단할까요?"
        confirmText={isCancelling ? '중단 중...' : '중단하기'}
        cancelText="계속 분석하기"
        variant="destructive"
      >
        중단하면 분석이 취소되며{'\n'}처음부터 다시 시작해야 해요.
      </Modal>
    </>
  );
}
