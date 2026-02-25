import { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/common';
import { PropertyFormData, ValidationErrors } from '../page';
import { getEasyContractList } from '@/lib/api/contract';
import { EasyContractListItem } from '@/types/contract';
import styles from './steps.module.css';

interface Step4Props {
  formData: PropertyFormData;
  updateFormData: (data: Partial<PropertyFormData>) => void;
  errors: ValidationErrors;
}

export default function Step4ImagesAndDescription({
  formData,
  updateFormData,
  errors,
}: Step4Props) {
  const [contracts, setContracts] = useState<EasyContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 계약서 목록 불러오기
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
    if (value === '') {
      updateFormData({ homeNoteId: undefined });
    } else {
      updateFormData({ homeNoteId: Number(value) });
    }
  };

  const handleImageUpload = (files: FileList) => {
    const imageFiles = Array.from(files);
    updateFormData({ images: [...formData.images, ...imageFiles] });
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData({ images: newImages });
  };

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>사진과 설명을 추가해주세요</h2>

      {/* 제목 */}
      <div className={styles.section}>
        <label className={styles.label}>
          제목<span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
          placeholder="매물 제목을 입력하세요"
          value={formData.title}
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
          value={formData.description}
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
        <label className={styles.label}>
          매물 사진<span className={styles.required}>*</span>
        </label>
        <ImageUploader
          onUpload={handleImageUpload}
          accept="image/*"
          multiple
          mainText="사진 추가"
          subText="JPG, PNG 지원"
        />
        <p className={styles.error}>{errors.images || '\u00A0'}</p>

        {formData.images.length > 0 && (
          <div className={styles.imagePreviewGrid}>
            {formData.images.map((image, index) => (
              <div key={index} className={styles.imagePreview}>
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                />
                <button
                  className={styles.imageRemoveButton}
                  onClick={() => removeImage(index)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
