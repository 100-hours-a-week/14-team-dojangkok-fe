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
  getPresignedUrls,
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

  const { success, error: showError, info, dismiss } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLinkedContract, setHasLinkedContract] = useState(false);
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
    document.documentElement.style.setProperty('--toast-bottom-fixed', '100px');
    return () => {
      document.documentElement.style.removeProperty('--toast-bottom-fixed');
    };
  }, []);

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
          address: p.address_main,
          detailedAddress: p.address_detail ?? '',
          title: p.title,
          description: p.content,
          homeNoteId: undefined,
          images: [],
        });
        setHasLinkedContract(p.is_verified);
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
        if (data.deposit === '' || data.deposit === undefined) {
          newErrors.deposit = '보증금을 입력해주세요';
        } else if (isNaN(Number(data.deposit)) || Number(data.deposit) < 0) {
          newErrors.deposit = '0 이상의 숫자를 입력해주세요';
        } else if (Number(data.deposit) > 10_000_000) {
          newErrors.deposit = '최대 1,000억 원까지 입력 가능합니다';
        }
        if (data.priceType === '월세' || data.priceType === '반전세') {
          if (data.monthlyRent === '' || data.monthlyRent === undefined) {
            newErrors.monthlyRent = '월세를 입력해주세요';
          } else if (
            isNaN(Number(data.monthlyRent)) ||
            Number(data.monthlyRent) < 0
          ) {
            newErrors.monthlyRent = '0 이상의 숫자를 입력해주세요';
          } else if (Number(data.monthlyRent) > 10_000) {
            newErrors.monthlyRent = '최대 1억 원까지 입력 가능합니다';
          }
        }
        if (data.maintenanceFee && data.maintenanceFee !== '') {
          if (
            isNaN(Number(data.maintenanceFee)) ||
            Number(data.maintenanceFee) < 0
          ) {
            newErrors.maintenanceFee = '0 이상의 숫자를 입력해주세요';
          } else if (Number(data.maintenanceFee) > 1_000) {
            newErrors.maintenanceFee = '최대 1,000만 원까지 입력 가능합니다';
          }
        }
        break;
      case 3:
        if (!data.address || data.address.trim() === '') {
          newErrors.address = '주소를 입력해주세요';
        }
        if (!data.detailedAddress || data.detailedAddress.trim() === '') {
          newErrors.detailedAddress = '상세 주소를 입력해주세요';
        } else if (data.detailedAddress.length > 100) {
          newErrors.detailedAddress = '상세 주소는 100자 이하로 입력해주세요';
        }
        if (!data.area || data.area === '') {
          newErrors.area = '면적을 입력해주세요';
        } else if (isNaN(Number(data.area)) || Number(data.area) <= 0) {
          newErrors.area = '면적은 0보다 큰 값으로 입력해주세요';
        } else {
          const areaDecimal = String(data.area).match(/\.(\d+)/);
          if (areaDecimal && areaDecimal[1].length > 2) {
            newErrors.area = '면적은 소수점 2자리까지 입력 가능합니다';
          }
        }
        if (data.floor === 0) {
          newErrors.floor = '층수를 입력해주세요';
        } else if (Math.abs(data.floor) > 200) {
          newErrors.floor = '최대 200층까지 입력 가능합니다';
        } else {
          const floorDecimal = String(Math.abs(data.floor)).match(/\.(\d+)/);
          if (floorDecimal && floorDecimal[1].length > 1) {
            newErrors.floor = '층수는 소수점 1자리까지 입력 가능합니다';
          }
        }
        break;
      case 4:
        if (!data.title || data.title.trim() === '') {
          newErrors.title = '제목을 입력해주세요';
        } else if (data.title.length > 50) {
          newErrors.title = '제목은 50자 이하로 입력해주세요';
        }
        if (!data.description || data.description.trim() === '') {
          newErrors.description = '상세 설명을 입력해주세요';
        }
        const imageFiles = uploadedImages.map((img) => img.file);
        if (imageFiles.length > 20) {
          newErrors.images = '최대 20장까지 업로드 가능합니다';
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
    const MAX_IMAGES = 20;
    const imageFiles = Array.from(files);

    const remaining = MAX_IMAGES - uploadedImages.length;
    if (remaining <= 0) {
      showError('이미지는 최대 20장까지 업로드할 수 있습니다.');
      return;
    }
    const filesToUpload = imageFiles.slice(0, remaining);
    if (filesToUpload.length < imageFiles.length) {
      showError(
        `최대 20장까지 업로드 가능합니다. ${filesToUpload.length}장만 업로드합니다.`
      );
    }

    const fileInfos = filesToUpload.map((file) => ({
      file_name: file.name,
      size_bytes: file.size,
      content_type: resolveContentType(file),
    }));

    const loadingId = info(
      `이미지 ${filesToUpload.length}장 업로드 중...`,
      60000
    );

    try {
      let presignedResponse;
      try {
        presignedResponse = await getPresignedUrls(fileInfos);
      } catch {
        showError('이미지 업로드 준비에 실패했습니다.');
        return;
      }

      const successItems = presignedResponse.data.success_file_items;

      // S3 병렬 업로드
      const uploadResults = await Promise.allSettled(
        successItems.map((item, i) =>
          uploadToS3(
            item.presigned_url,
            imageFiles[i],
            fileInfos[i].content_type
          )
        )
      );

      // 성공한 항목만 수집
      const completedIds: number[] = [];
      const newImages: UploadedImage[] = [];

      uploadResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          completedIds.push(successItems[i].file_asset_id);
          newImages.push({
            file: filesToUpload[i],
            fileAssetId: successItems[i].file_asset_id,
            url: URL.createObjectURL(filesToUpload[i]),
          });
        } else {
          showError(`${filesToUpload[i].name} 업로드에 실패했습니다.`);
        }
      });

      if (completedIds.length > 0) {
        try {
          await completePropertyFileUpload(completedIds);
        } catch {
          showError('업로드 완료 처리에 실패했습니다.');
          return;
        }
        setUploadedImages((prev) => [...prev, ...newImages]);
        success(`이미지 ${completedIds.length}장이 업로드되었습니다.`);
      }
    } finally {
      dismiss(loadingId);
    }
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
      title: formData.title,
      address_main: formData.address,
      address_detail: formData.detailedAddress.trim(),
      price_main: Number(formData.deposit),
      price_monthly:
        formData.priceType === '월세' || formData.priceType === '반전세'
          ? Number(formData.monthlyRent)
          : undefined,
      content: formData.description.trim(),
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
          easy_contract_id: formData.homeNoteId,
          address_main: formData.address,
          address_detail: formData.detailedAddress.trim(),
          price_main: Number(formData.deposit),
          price_monthly:
            formData.priceType === '월세' || formData.priceType === '반전세'
              ? Number(formData.monthlyRent)
              : undefined,
          content: formData.description.trim(),
          property_type: PROPERTY_TYPE_MAP[formData.propertyType],
          rent_type: RENT_TYPE_MAP[formData.priceType],
          exclusive_area_m2: Number(formData.area),
          is_basement: formData.floor < 0,
          floor: formData.floor,
          maintenance_fee: formData.maintenanceFee
            ? Number(formData.maintenanceFee)
            : 0,
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
            isEditMode={isEditMode}
            hasLinkedContract={hasLinkedContract}
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
