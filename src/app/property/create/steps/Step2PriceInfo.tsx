import { PropertyFormData } from '../page';
import styles from './steps.module.css';

interface Step2Props {
  formData: PropertyFormData;
  updateFormData: (data: Partial<PropertyFormData>) => void;
}

const PRICE_TYPES = ['월세', '전세', '매매'];

export default function Step2PriceInfo({
  formData,
  updateFormData,
}: Step2Props) {
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>거래 정보를 입력해주세요</h2>

      {/* 거래 유형 */}
      <div className={styles.section}>
        <label className={styles.label}>거래 유형</label>
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
                  monthlyRent: type === '월세' ? formData.monthlyRent : 0,
                })
              }
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 보증금 */}
      <div className={styles.section}>
        <label className={styles.label}>
          {formData.priceType === '매매' ? '매매가' : '보증금'}
        </label>
        <div className={styles.inputGroup}>
          <input
            type="number"
            className={styles.input}
            placeholder="0"
            value={formData.deposit || ''}
            onChange={(e) =>
              updateFormData({ deposit: Number(e.target.value) })
            }
          />
          <span className={styles.inputUnit}>만원</span>
        </div>
      </div>

      {/* 월세 (월세인 경우만) */}
      {formData.priceType === '월세' && (
        <div className={styles.section}>
          <label className={styles.label}>월세</label>
          <div className={styles.inputGroup}>
            <input
              type="number"
              className={styles.input}
              placeholder="0"
              value={formData.monthlyRent || ''}
              onChange={(e) =>
                updateFormData({ monthlyRent: Number(e.target.value) })
              }
            />
            <span className={styles.inputUnit}>만원</span>
          </div>
        </div>
      )}

      {/* 관리비 */}
      <div className={styles.section}>
        <label className={styles.label}>관리비</label>
        <div className={styles.inputGroup}>
          <input
            type="number"
            className={styles.input}
            placeholder="0"
            value={formData.maintenanceFee || ''}
            onChange={(e) =>
              updateFormData({ maintenanceFee: Number(e.target.value) })
            }
          />
          <span className={styles.inputUnit}>만원</span>
        </div>
      </div>
    </div>
  );
}
