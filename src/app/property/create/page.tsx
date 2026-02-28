'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header, MainButton } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import styles from './create.module.css';

import Step1PropertyType from './steps/Step1PropertyType';
import Step2PriceInfo from './steps/Step2PriceInfo';
import Step3Details from './steps/Step3Details';
import Step4ImagesAndDescription from './steps/Step4ImagesAndDescription';

import {
  createPropertyPost,
  updatePropertyPost,
  getPropertyPost,
  getPresignedUrl,
  uploadToS3,
  completePropertyFileUpload,
  attachFilesToPost,
  deletePropertyFile,
  type PropertyPostCreateRequestDto,
  type PropertyPostUpdateRequestDto,
} from '@/lib/api/property';
import {
  PROPERTY_TYPE_MAP,
  RENT_TYPE_MAP,
  PROPERTY_TYPE_LABELS,
  RENT_TYPE_LABELS,
} from '@/types/property';

function resolveContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return map[ext ?? ''] ?? 'image/jpeg';
}

export interface PropertyFormData {
  propertyType: string;
  priceType: string;
  deposit: number | string;
  monthlyRent: number | string;
  area: number | string;
  floor: number;
  isBasement: boolean;
  maintenanceFee: number | string;
  address: string;
  detailedAddress: string;
  title: string;
  description: string;
  homeNoteId?: number;
  images: File[];
}

export interface UploadedImage {
  file?: File;
  fileAssetId: number;
  url: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export default function PropertyCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit')
    ? Number(searchParams.get('edit'))
    : null;
  const isEditMode = editId !== null;

  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<PropertyFormData>({
    propertyType: '',
    priceType: '',
    deposit: '',
    monthlyRent: '',
    area: '',
    floor: 1,
    isBasement: false,
    maintenanceFee: '',
    address: '',
    detailedAddress: '',
    title: '',
    description: '',
    homeNoteId: undefined,
    images: [],
  });

  const totalSteps = 4;

  useEffect(() => {
    if (!isEditMode || !editId) return;
    const load = async () => {
      try {
        const res = await getPropertyPost(editId);
        const p = res.data;
        setFormData({
          propertyType: PROPERTY_TYPE_LABELS[p.property_type] ?? '',
          priceType: RENT_TYPE_LABELS[p.rent_type] ?? '',
          deposit: p.price_main,
          monthlyRent: p.price_monthly ?? '',
          area: p.exclusive_area_m2,
          floor: p.is_basement ? -p.floor : p.floor,
          isBasement: p.is_basement,
          maintenanceFee: p.maintenance_fee,
          address: '',
          detailedAddress: p.address ?? '',
          title: p.title,
          description: p.content,
          homeNoteId: undefined,
          images: [],
        });
        const existingImages: UploadedImage[] = p.images
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => ({
            fileAssetId: img.file_asset_id,
            url: img.presigned_url,
          }));
        setUploadedImages(existingImages);
      } catch {
        showError('매물 정보를 불러오는데 실패했습니다.');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleBackClick = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (
    step: number,
    data: PropertyFormData = formData
  ): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!data.propertyType) {
          newErrors.propertyType = '매물 유형을 선택해주세요';
        }
        break;
      case 2:
        if (!data.priceType) {
          newErrors.priceType = '거래 유형을 선택해주세요';
        }
        if (!data.deposit || data.deposit === '') {
          newErrors.deposit = '보증금을 입력해주세요';
        } else if (isNaN(Number(data.deposit)) || Number(data.deposit) <= 0) {
          newErrors.deposit = '올바른 숫자를 입력해주세요';
        }
        if (data.priceType === '월세' || data.priceType === '반전세') {
          if (!data.monthlyRent || data.monthlyRent === '') {
            newErrors.monthlyRent = '월세를 입력해주세요';
          } else if (
            isNaN(Number(data.monthlyRent)) ||
            Number(data.monthlyRent) <= 0
          ) {
            newErrors.monthlyRent = '올바른 숫자를 입력해주세요';
          }
        }
        if (data.maintenanceFee && data.maintenanceFee !== '') {
          if (
            isNaN(Number(data.maintenanceFee)) ||
            Number(data.maintenanceFee) < 0
          ) {
            newErrors.maintenanceFee = '올바른 숫자를 입력해주세요';
          }
        }
        break;
      case 3:
        if (!data.address || data.address.trim() === '') {
          newErrors.address = '주소를 입력해주세요';
        }
        if (data.detailedAddress && data.detailedAddress.length > 100) {
          newErrors.detailedAddress = '상세 주소는 100자 이하로 입력해주세요';
        }
        if (!data.area || data.area === '') {
          newErrors.area = '면적을 입력해주세요';
        } else if (isNaN(Number(data.area)) || Number(data.area) <= 0) {
          newErrors.area = '면적은 0보다 큰 값으로 입력해주세요';
        }
        if (data.floor === 0) {
          newErrors.floor = '층수를 입력해주세요';
        }
        break;
      case 4:
        if (!data.title || data.title.trim() === '') {
          newErrors.title = '제목을 입력해주세요';
        } else if (data.title.length > 50) {
          newErrors.title = '제목은 50자 이하로 입력해주세요';
        }
        if (data.description && data.description.trim() === '') {
          newErrors.description = '설명을 입력하시거나 비워두세요';
        }
        const imageFiles = uploadedImages.map((img) => img.file);
        if (imageFiles.length > 10) {
          newErrors.images = '최대 10장까지 업로드 가능합니다';
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

  const handleImageUpload = async (files: FileList) => {
    const imageFiles = Array.from(files);
    // ... 파일 유효성 검사
    const newImages = [...uploadedImages];
    for (const file of imageFiles) {
      try {
        const contentType = resolveContentType(file);
        const presignedResponse = await getPresignedUrl(0, {
          // propertyId 0으로 임시 전송
          file_name: file.name,
          size_bytes: file.size,
          content_type: contentType,
        });
        const successItem = presignedResponse.data.success_file_items[0];
        if (!successItem) throw new Error('Presigned URL 발급 실패');

        await uploadToS3(successItem.presigned_url, file, contentType);
        await completePropertyFileUpload(successItem.file_asset_id);

        newImages.push({
          file,
          fileAssetId: successItem.file_asset_id,
          url: URL.createObjectURL(file),
        });
      } catch {
        showError(`${file.name} 업로드에 실패했습니다.`);
      }
    }
    setUploadedImages(newImages);
  };

  const handleImageRemove = async (fileAssetId: number, url: string) => {
    if (isEditMode) {
      // 수정 모드: submit 시점에 삭제 API 호출
      setPendingDeleteIds((prev) => [...prev, fileAssetId]);
    } else {
      // 생성 모드: 즉시 삭제 API 호출
      if (fileAssetId) {
        try {
          await deletePropertyFile(fileAssetId);
        } catch {
          // 삭제 실패 시에도 UI에서는 제거
        }
      }
    }
    setUploadedImages((prev) =>
      prev.filter((img) => img.fileAssetId !== fileAssetId)
    );
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  };

  const buildCreateRequest = (): PropertyPostCreateRequestDto => {
    return {
      title: formData.title || '제목 미입력',
      address_main: formData.address,
      address_detail: formData.detailedAddress.trim() || '상세주소 미입력',
      price_main: Number(formData.deposit),
      price_monthly:
        formData.priceType === '월세' || formData.priceType === '반전세'
          ? Number(formData.monthlyRent)
          : undefined,
      content: formData.description.trim() || '상세 설명이 없습니다.',
      property_type: PROPERTY_TYPE_MAP[formData.propertyType],
      rent_type: RENT_TYPE_MAP[formData.priceType],
      exclusive_area_m2: Number(formData.area),
      is_basement: formData.floor < 0,
      floor: formData.floor,
      maintenance_fee: formData.maintenanceFee
        ? Number(formData.maintenanceFee)
        : 0,
      easy_contract_id: formData.homeNoteId,
    };
  };

  const handleSubmit = async () => {
    const newErrors = validateStep(4);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && editId) {
        const updateRequest: PropertyPostUpdateRequestDto = {
          title: formData.title,
          price_main: Number(formData.deposit),
          price_monthly:
            formData.priceType === '월세' || formData.priceType === '반전세'
              ? Number(formData.monthlyRent)
              : undefined,
          content: formData.description.trim() || '상세 설명이 없습니다.',
          easy_contract_id: formData.homeNoteId,
        };
        await updatePropertyPost(editId, updateRequest);

        if (pendingDeleteIds.length > 0) {
          await Promise.all(
            pendingDeleteIds.map((id) => deletePropertyFile(id))
          );
        }

        const newImages = uploadedImages.filter((img) => img.file);
        if (newImages.length > 0) {
          await attachFilesToPost(
            editId,
            newImages.map((img) => img.fileAssetId)
          );
        }

        success('매물이 수정되었습니다!');
        router.replace(`/property/${editId}`);
      } else {
        const response = await createPropertyPost(buildCreateRequest());
        const propertyPostId = response.data.property_post_id;

        if (uploadedImages.length > 0) {
          await attachFilesToPost(
            propertyPostId,
            uploadedImages.map((img) => img.fileAssetId)
          );
        }

        success('매물이 성공적으로 등록되었습니다!');
        router.replace(`/property/${propertyPostId}`);
      }
    } catch (error: unknown) {
      showError(
        (error as { message?: string })?.message ||
          (isEditMode
            ? '매물 수정에 실패했습니다.'
            : '매물 등록에 실패했습니다.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (data: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
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
    const prefix = isEditMode ? '매물 수정 - ' : '';
    switch (currentStep) {
      case 1:
        return `${prefix}매물 유형`;
      case 2:
        return `${prefix}거래 정보`;
      case 3:
        return `${prefix}매물 상세`;
      case 4:
        return `${prefix}사진 및 설명`;
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
            images={uploadedImages}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
          />
        )}
      </main>

      <footer className={styles.footer}>
        <MainButton
          onClick={currentStep < totalSteps ? handleNext : handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isEditMode
              ? '수정 중...'
              : '등록 중...'
            : currentStep < totalSteps
              ? '다음'
              : isEditMode
                ? '수정하기'
                : '등록하기'}
        </MainButton>
      </footer>
    </div>
  );
}
