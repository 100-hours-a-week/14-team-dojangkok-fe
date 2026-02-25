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
  deposit: number | string;
  monthlyRent: number | string;
  area: number | string;
  floor: number;
  maintenanceFee: number | string;
  address: string;
  detailedAddress: string;
  title: string;
  description: string;
  homeNoteId?: number;
  images: File[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export default function PropertyCreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<PropertyFormData>({
    propertyType: '',
    priceType: '',
    deposit: '',
    monthlyRent: '',
    area: '',
    floor: 1,
    maintenanceFee: '',
    address: '',
    detailedAddress: '',
    title: '',
    description: '',
    homeNoteId: undefined,
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

  const validateStep = (step: number): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!formData.propertyType) {
          newErrors.propertyType = '매물 유형을 선택해주세요';
        }
        break;
      case 2:
        if (!formData.priceType) {
          newErrors.priceType = '거래 유형을 선택해주세요';
        }
        if (!formData.deposit || formData.deposit === '') {
          newErrors.deposit = '보증금을 입력해주세요';
        } else if (isNaN(Number(formData.deposit)) || Number(formData.deposit) <= 0) {
          newErrors.deposit = '올바른 숫자를 입력해주세요';
        }
        // 월세인 경우 월세 필드 검증
        if (formData.priceType === '월세') {
          if (!formData.monthlyRent || formData.monthlyRent === '') {
            newErrors.monthlyRent = '월세를 입력해주세요';
          } else if (isNaN(Number(formData.monthlyRent)) || Number(formData.monthlyRent) <= 0) {
            newErrors.monthlyRent = '올바른 숫자를 입력해주세요';
          }
        }
        // 관리비는 선택사항이지만 입력 시 숫자 검증
        if (formData.maintenanceFee && formData.maintenanceFee !== '') {
          if (isNaN(Number(formData.maintenanceFee)) || Number(formData.maintenanceFee) < 0) {
            newErrors.maintenanceFee = '올바른 숫자를 입력해주세요';
          }
        }
        break;
      case 3:
        if (!formData.address || formData.address.trim() === '') {
          newErrors.address = '주소를 입력해주세요';
        }
        if (!formData.area || formData.area === '') {
          newErrors.area = '면적을 입력해주세요';
        } else if (isNaN(Number(formData.area)) || Number(formData.area) <= 0) {
          newErrors.area = '올바른 숫자를 입력해주세요';
        }
        break;
      case 4:
        if (!formData.title || formData.title.trim() === '') {
          newErrors.title = '제목을 입력해주세요';
        }
        if (formData.images.length === 0) {
          newErrors.images = '최소 1장의 사진을 추가해주세요';
        }
        break;
    }

    return newErrors;
  };

  const handleNext = () => {
    const newErrors = validateStep(currentStep);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
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
    // 입력 시 해당 필드 에러 제거
    const updatedFields = Object.keys(data);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedFields.forEach((field) => {
        delete newErrors[field];
      });
      return newErrors;
    });
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
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <Step2PriceInfo
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
        {currentStep === 3 && (
          <Step3Details
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
        {currentStep === 4 && (
          <Step4ImagesAndDescription
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
      </main>

      {/* 하단 버튼 */}
      <footer className={styles.footer}>
        <MainButton onClick={currentStep < totalSteps ? handleNext : handleSubmit}>
          {currentStep < totalSteps ? '다음' : '등록하기'}
        </MainButton>
      </footer>
    </div>
  );
}
