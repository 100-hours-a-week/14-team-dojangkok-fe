import { PropertyFormData, ValidationErrors } from '../page';
import { formatKRW } from '@/utils/formatPrice';
import styles from './steps.module.css';

const MAX_DEPOSIT = 10_000_000;
const MAX_MONTHLY_RENT = 10_000;
const MAX_MAINTENANCE_FEE = 1_000;

type HintState = 'empty' | 'value' | 'max';

function getHint(
  value: string | number,
  max: number,
  maxLabel: string
): { text: string; state: HintState } {
  const num = Number(value);
  if (!num || isNaN(num) || num <= 0) return { text: maxLabel, state: 'empty' };
  if (num >= max) return { text: `${maxLabel}입니다.`, state: 'max' };
  return { text: `${formatKRW(num)} 원`, state: 'value' };
}

function hintClass(state: HintState, s: Record<string, string>): string {
  if (state === 'max') return s.priceMaxReached;
  if (state === 'value') return s.priceHint;
  return s.priceMax;
}

function clamp(value: string, max: number): number | string {
  const num = Number(value);
  if (!isNaN(num) && num > max) return max;
  return value;
}

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
                    type === '월세' || type === '반전세'
                      ? formData.monthlyRent
                      : 0,
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
            max={MAX_DEPOSIT}
            className={`${styles.input} ${errors.deposit ? styles.inputError : ''}`}
            placeholder="0"
            value={formData.deposit ?? ''}
            onChange={(e) =>
              updateFormData({ deposit: clamp(e.target.value, MAX_DEPOSIT) })
            }
          />
          <span className={styles.inputUnit}>만원</span>
        </div>
        {(() => {
          const h = getHint(formData.deposit, MAX_DEPOSIT, '최대 1,000억 원');
          return <p className={hintClass(h.state, styles)}>{h.text}</p>;
        })()}
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
              max={MAX_MONTHLY_RENT}
              className={`${styles.input} ${errors.monthlyRent ? styles.inputError : ''}`}
              placeholder="0"
              value={formData.monthlyRent ?? ''}
              onChange={(e) =>
                updateFormData({
                  monthlyRent: clamp(e.target.value, MAX_MONTHLY_RENT),
                })
              }
            />
            <span className={styles.inputUnit}>만원</span>
          </div>
          {(() => {
            const h = getHint(
              formData.monthlyRent,
              MAX_MONTHLY_RENT,
              '최대 1억 원'
            );
            return <p className={hintClass(h.state, styles)}>{h.text}</p>;
          })()}
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
            max={MAX_MAINTENANCE_FEE}
            className={`${styles.input} ${errors.maintenanceFee ? styles.inputError : ''}`}
            placeholder="0"
            value={formData.maintenanceFee ?? ''}
            onChange={(e) =>
              updateFormData({
                maintenanceFee: clamp(e.target.value, MAX_MAINTENANCE_FEE),
              })
            }
          />
          <span className={styles.inputUnit}>만원</span>
        </div>
        {(() => {
          const h = getHint(
            formData.maintenanceFee,
            MAX_MAINTENANCE_FEE,
            '최대 1,000만 원'
          );
          return <p className={hintClass(h.state, styles)}>{h.text}</p>;
        })()}
        <p className={styles.error}>{errors.maintenanceFee || '\u00A0'}</p>
      </div>
    </div>
  );
}
