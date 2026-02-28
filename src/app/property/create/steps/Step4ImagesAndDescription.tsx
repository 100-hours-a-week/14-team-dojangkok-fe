'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ImageUploader } from '@/components/common';
import { PropertyFormData, ValidationErrors, UploadedImage } from '../page';
import { getEasyContractList } from '@/lib/api/contract';
import { EasyContractListItem } from '@/types/contract';
import styles from './steps.module.css';

const ImageGrid = dynamic(() => import('@/components/common/ImageGrid'), {
  ssr: false,
});

interface Step4Props {
  formData: PropertyFormData;
  updateFormData: (data: Partial<PropertyFormData>) => void;
  errors: ValidationErrors;
  images: UploadedImage[];
  onImageUpload: (files: FileList) => void;
  onImageRemove: (fileAssetId: number, url: string) => void;
}

export default function Step4ImagesAndDescription({
  formData,
  updateFormData,
  errors,
  images,
  onImageUpload,
  onImageRemove,
}: Step4Props) {
  const [contracts, setContracts] = useState<EasyContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const imageGridRef = useRef<HTMLDivElement>(null);

  const prevImageCount = useRef(images.length);

  useEffect(() => {
    // 이미지가 새로 추가되었을 때만 스크롤
    if (images.length > prevImageCount.current) {
      setTimeout(() => {
        imageGridRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
    prevImageCount.current = images.length;
  }, [images.length]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setIsLoading(true);
        const response = await getEasyContractList();
        setContracts(response.data.easyContractListItemList);
      } catch (error) {
        console.error('Failed to fetch contracts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateFormData({ homeNoteId: value ? Number(value) : undefined });
  };

  const imageGridItems = images.map((img) => ({
    id: String(img.fileAssetId),
    url: img.url,
    file: img.file,
  }));

  const handleGridRemove = (id: string) => {
    const numericId = Number(id);
    const imageToRemove = images.find((img) => img.fileAssetId === numericId);
    if (imageToRemove) {
      onImageRemove(numericId, imageToRemove.url);
    }
  };

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>사진과 설명을 추가해주세요</h2>

      {/* 제목 */}
      <div className={styles.section}>
        <div className={styles.labelWithCounter}>
          <label className={styles.label}>
            제목<span className={styles.required}>*</span>
          </label>
          <span
            className={`${styles.charCounter} ${
              formData.title.length > 50 ? styles.charCounterError : ''
            }`}
          >
            {formData.title.length}/50
          </span>
        </div>
        <input
          type="text"
          className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
          placeholder="매물 제목을 입력하세요"
          value={formData.title ?? ''}
          maxLength={50}
          onChange={(e) => updateFormData({ title: e.target.value })}
        />
        <p className={styles.error}>{errors.title || '\u00A0'}</p>
      </div>

      {/* 설명 */}
      <div className={styles.section}>
        <label className={styles.label}>상세 설명</label>
        <textarea
          className={styles.textarea}
          placeholder="매물에 대한 상세 설명을 입력하세요"
          rows={6}
          value={formData.description ?? ''}
          onChange={(e) => updateFormData({ description: e.target.value })}
        />
      </div>

      {/* 계약서 연결 */}
      <div className={styles.section}>
        <label className={styles.label}>
          계약서 연결 <span className={styles.optional}>(선택)</span>
        </label>
        <select
          className={styles.select}
          value={formData.homeNoteId || ''}
          onChange={handleContractChange}
          disabled={isLoading}
        >
          <option value="">계약서를 선택하세요</option>
          {contracts.map((contract) => (
            <option
              key={contract.easy_contract_id}
              value={contract.easy_contract_id}
            >
              {contract.title}
            </option>
          ))}
        </select>
      </div>

      {/* 이미지 업로드 */}
      <div className={styles.section}>
        <label className={styles.label}>매물 사진</label>
        <ImageUploader
          onUpload={onImageUpload}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          mainText="사진 추가"
          subText="JPG, PNG, WEBP 지원 (최대 10장, 5MB 이하)"
        />
        <p className={styles.error}>{errors.images || '\u00A0'}</p>

        {imageGridItems.length > 0 && (
          <div style={{ marginTop: 12 }} ref={imageGridRef}>
            <ImageGrid images={imageGridItems} onDelete={handleGridRemove} />
          </div>
        )}
      </div>
    </div>
  );
}
