import { ImageUploader } from '@/components/common';
import { PropertyFormData } from '../page';
import styles from './steps.module.css';

interface Step4Props {
  formData: PropertyFormData;
  updateFormData: (data: Partial<PropertyFormData>) => void;
}

export default function Step4ImagesAndDescription({
  formData,
  updateFormData,
}: Step4Props) {
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
        <label className={styles.label}>제목</label>
        <input
          type="text"
          className={styles.input}
          placeholder="매물 제목을 입력하세요"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
        />
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

      {/* 이미지 업로드 */}
      <div className={styles.section}>
        <label className={styles.label}>매물 사진</label>
        <ImageUploader
          onUpload={handleImageUpload}
          accept="image/*"
          multiple
          mainText="사진 추가"
          subText="JPG, PNG 지원"
        />

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
