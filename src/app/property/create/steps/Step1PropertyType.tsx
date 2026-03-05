import { PropertyFormData, ValidationErrors } from '../page';
import styles from './steps.module.css';

interface Step1Props {
  formData: PropertyFormData;
  updateFormData: (data: Partial<PropertyFormData>) => void;
  errors: ValidationErrors;
}

const PROPERTY_TYPES = [
  { label: '원룸', icon: 'single_bed' },
  { label: '투룸 이상', icon: 'bedroom_parent' },
  { label: '오피스텔', icon: 'corporate_fare' },
  { label: '아파트', icon: 'apartment' },
  { label: '상가', icon: 'storefront' },
  { label: '주택', icon: 'house' },
];

export default function Step1PropertyType({
  formData,
  updateFormData,
  errors,
}: Step1Props) {
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>
        어떤 유형의 매물을
        <br />
        등록하시나요?
      </h2>
      <p className={styles.stepDescription}>
        매물 유형을 선택해주세요<span className={styles.required}>*</span>
      </p>

      <div className={styles.optionGrid}>
        {PROPERTY_TYPES.map((type) => (
          <button
            key={type.label}
            className={`${styles.optionCard} ${
              formData.propertyType === type.label
                ? styles.optionCardActive
                : ''
            }`}
            onClick={() => updateFormData({ propertyType: type.label })}
          >
            <span className={`material-symbols-outlined ${styles.optionIcon}`}>
              {type.icon}
            </span>
            <span className={styles.optionLabel}>{type.label}</span>
          </button>
        ))}
      </div>
      <p className={styles.error}>{errors.propertyType || '\u00A0'}</p>
    </div>
  );
}
