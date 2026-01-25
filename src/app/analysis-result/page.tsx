'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Header, BottomFixedArea, MainButton, Modal } from '@/components/common';
import styles from './page.module.css';

// TODO: 실제로는 API에서 받아올 데이터
const MOCK_MARKDOWN_RESULT = `
# 계약서 분석 결과

## 📋 계약서 개요
- **계약 유형**: 부동산 임대차 계약
- **계약 기간**: 2026년 1월 1일 ~ 2027년 12월 31일
- **보증금**: 5,000만원
- **월 임대료**: 50만원

## ⚠️ 주의사항

### 1. 특약사항 확인 필요
특약사항에 "임대인은 계약 기간 중 임대료를 인상할 수 있다"는 조항이 포함되어 있습니다. 이는 일반적이지 않은 조항으로, 협의가 필요합니다.

### 2. 중개수수료
중개수수료가 법정 상한을 초과하지 않는지 확인이 필요합니다.

## ✅ 정상 조항

### 계약금 및 잔금
- 계약금: 500만원 (계약일 지급)
- 잔금: 4,500만원 (입주일 지급)

### 수리 및 관리 책임
임대인과 임차인의 수리 책임 범위가 명확히 구분되어 있습니다.

## 💡 추가 확인 사항
1. 등기부등본 확인
2. 건물 안전진단 확인
3. 임대인 신분증 확인
`;

export default function AnalysisResultPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBackClick = () => {
    router.push('/home');
  };

  const handleRegenerate = () => {
    setIsModalOpen(true);
  };

  const handleConfirmRegenerate = () => {
    setIsModalOpen(false);
    // TODO: 실제로는 재분석 API 호출
    console.log('재분석 요청');
    router.push('/loading-analysis');
  };

  return (
    <>
      <Header title="분석 결과" showBackButton onBackClick={handleBackClick} />
      <main className={styles.main}>
        <div className={styles.markdown}>
          <ReactMarkdown>{MOCK_MARKDOWN_RESULT}</ReactMarkdown>
        </div>
      </main>
      <BottomFixedArea>
        <MainButton onClick={handleRegenerate}>다시 생성하기</MainButton>
      </BottomFixedArea>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmRegenerate}
        title="분석을 다시 생성할까요?"
        confirmText="다시 생성"
        cancelText="취소"
      >
        <p className={styles.modalDescription}>
          같은 계약서로 다시 분석을 진행합니다.
          <br />약 1분 정도 소요될 수 있어요.
        </p>
      </Modal>
    </>
  );
}
