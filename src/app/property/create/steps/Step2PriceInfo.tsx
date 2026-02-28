import { PropertyFormData, ValidationErrors } from '../page';
import styles from './steps.module.css';

interface Step2Props {
  formData: PropertyFormData;
  updateFormData: (data: Partial<PropertyFormData>) => void;
  errors: ValidationErrors;
}

const PRICE_TYPES = ['월세', '전세', '반전세', '매매'];

export default function Step2PriceInfo({
  formData,
  updateFormData,
  errors,
}: Step2Props) {
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>거래 정보를 입력해주세요</h2>

      {/* 거래 유형 */}
      <div className={styles.section}>
        <label className={styles.label}>
          거래 유형<span className={styles.required}>*</span>
        </label>
        <div className={styles.chipGroup}>
          {PRICE_TYPES.map((type) => (
            <button
              key={type}
              className={`${styles.chip} ${
                formData.priceType === type ? styles.chipActive : ''
              }`}
              onClick={() =>
                updateFormData({
                  priceType: type,
                  monthlyRent:
                    type === '월세' || type === '반전세' ? formData.monthlyRent : 0,
                })
              }
            >
              {type}
            </button>
          ))}
        </div>
        <p className={styles.error}>{errors.priceType || '\u00A0'}</p>
      </div>

      {/* 보증금 */}
      <div className={styles.section}>
        <label className={styles.label}>
          {formData.priceType === '매매' ? '매매가' : '보증금'}
          <span className={styles.required}>*</span>
        </label>
        <div className={styles.inputGroup}>
          <input
            type="number"
            min="0"
            className={`${styles.input} ${errors.deposit ? styles.inputError : ''}`}
            placeholder="0"
            value={formData.deposit ?? ''}
            onChange={(e) => updateFormData({ deposit: e.target.value })}
          />
          <span className={styles.inputUnit}>만원</span>
        </div>
        <p className={styles.error}>{errors.deposit || '\u00A0'}</p>
      </div>

      {/* 월세 (월세 또는 반전세인 경우) */}
      {(formData.priceType === '월세' || formData.priceType === '반전세') && (
        <div className={styles.section}>
          <label className={styles.label}>
            월세<span className={styles.required}>*</span>
          </label>
          <div className={styles.inputGroup}>
            <input
              type="number"
              min="0"
              className={`${styles.input} ${errors.monthlyRent ? styles.inputError : ''}`}
              placeholder="0"
              value={formData.monthlyRent ?? ''}
              onChange={(e) => updateFormData({ monthlyRent: e.target.value })}
            />
            <span className={styles.inputUnit}>만원</span>
          </div>
          <p className={styles.error}>{errors.monthlyRent || '\u00A0'}</p>
        </div>
      )}

      {/* 관리비 */}
      <div className={styles.section}>
        <label className={styles.label}>
          관리비 <span className={styles.optional}>(선택)</span>
        </label>
        <div className={styles.inputGroup}>
          <input
            type="number"
            min="0"
            className={`${styles.input} ${errors.maintenanceFee ? styles.inputError : ''}`}
            placeholder="0"
            value={formData.maintenanceFee ?? ''}
            onChange={(e) =>
              updateFormData({ maintenanceFee: e.target.value })
            }
          />
          <span className={styles.inputUnit}>만원</span>
        </div>
        <p className={styles.error}>{errors.maintenanceFee || '\u00A0'}</p>
      </div>
    </div>
  );
}
