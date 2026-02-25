'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, MainButton } from '@/components/common';
import styles from './create.module.css';

// 스텝별 컴포넌트 import (추후 분리)
import Step1PropertyType from './steps/Step1PropertyType';
import Step2PriceInfo from './steps/Step2PriceInfo';
import Step3Details from './steps/Step3Details';
import Step4ImagesAndDescription from './steps/Step4ImagesAndDescription';

export interface PropertyFormData {
  propertyType: string;
  priceType: string;
  deposit: number;
  monthlyRent: number;
  area: number;
  floor: number;
  maintenanceFee: number;
  address: string;
  detailedAddress: string;
  title: string;
  description: string;
  images: File[];
}

export default function PropertyCreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>({
    propertyType: '',
    priceType: '',
    deposit: 0,
    monthlyRent: 0,
    area: 0,
    floor: 1,
    maintenanceFee: 0,
    address: '',
    detailedAddress: '',
    title: '',
    description: '',
    images: [],
  });

  const totalSteps = 4;

  const handleBackClick = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // TODO: API 호출하여 매물 등록
    console.log('Submit:', formData);
    router.push('/property');
  };

  const updateFormData = (data: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return '매물 유형';
      case 2:
        return '거래 정보';
      case 3:
        return '매물 상세';
      case 4:
        return '사진 및 설명';
      default:
        return '';
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.propertyType !== '';
      case 2:
        return formData.priceType !== '' && formData.deposit > 0;
      case 3:
        return (
          formData.area > 0 &&
          formData.address !== '' &&
          formData.detailedAddress !== ''
        );
      case 4:
        return formData.title !== '' && formData.images.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title={getStepTitle()}
        showBackButton
        onBackClick={handleBackClick}
      />

      {/* 진행 상태 바 */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      <main className={styles.main}>
        {currentStep === 1 && (
          <Step1PropertyType
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
        {currentStep === 2 && (
          <Step2PriceInfo formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 3 && (
          <Step3Details formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 4 && (
          <Step4ImagesAndDescription
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
      </main>

      {/* 하단 버튼 */}
      <footer className={styles.footer}>
        <MainButton
          onClick={currentStep < totalSteps ? handleNext : handleSubmit}
          disabled={!isStepValid()}
        >
          {currentStep < totalSteps ? '다음' : '등록하기'}
        </MainButton>
      </footer>
    </div>
  );
}
