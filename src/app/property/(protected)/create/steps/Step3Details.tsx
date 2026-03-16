import { useState, useEffect } from 'react';
import { DaumPostcodeEmbed } from 'react-daum-postcode';
import { PropertyFormData, ValidationErrors } from '../page';
import styles from './steps.module.css';

interface Step3Props {
  formData: PropertyFormData;
  updateFormData: (data: Partial<PropertyFormData>) => void;
  errors: ValidationErrors;
}

export default function Step3Details({
  formData,
  updateFormData,
  errors,
}: Step3Props) {
  // 평 ↔ m² 변환 상수
  const PYEONG_TO_M2 = 3.3058;
  const M2_TO_PYEONG = 0.3025;

  // 지상/지하 선택 (층수의 절댓값 사용)
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  const [floorType, setFloorType] = useState<'ground' | 'basement'>(
    formData.floor < 0 ? 'basement' : 'ground'
  );
  const [floorNumber, setFloorNumber] = useState<string>(
    String(Math.abs(formData.floor) || 1)
  );
  const [floorError, setFloorError] = useState<string>('');

  // 평수 입력을 위한 로컬 state
  const [pyeongInput, setPyeongInput] = useState<string>('');

  // formData.area가 변경되면 평수 계산하여 표시
  useEffect(() => {
    if (!formData.area) {
      setPyeongInput('');
      return;
    }
    const m2Value = Number(formData.area);
    if (!isNaN(m2Value)) {
      const pyeong = Math.round(m2Value * M2_TO_PYEONG * 100) / 100;
      setPyeongInput(String(pyeong));
    }
  }, [formData.area]);

  useEffect(() => {
    const num = Number(floorNumber);
    if (floorNumber && (isNaN(num) || num <= 0)) {
      setFloorError('올바른 숫자를 입력해주세요');
      return;
    }
    const decimalMatch = floorNumber.match(/\.(\d+)/);
    if (decimalMatch && decimalMatch[1].length > 1) {
      setFloorError('층수는 소수점 1자리까지 입력 가능합니다');
      return;
    }
    setFloorError('');

    const validNumber = num > 0 ? num : 1;
    const actualFloor = floorType === 'basement' ? -validNumber : validNumber;
    updateFormData({ floor: actualFloor });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorType, floorNumber]);

  const handleFloorNumberChange = (value: string) => {
    const num = Number(value);
    if (!isNaN(num) && num > 200) {
      setFloorNumber('200');
      return;
    }
    setFloorNumber(value);
  };

  const toNumeric = (value: string) =>
    value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

  const handlePyeongChange = (value: string) => {
    const filtered = toNumeric(value);
    setPyeongInput(filtered);
    const pyeong = Number(filtered);
    if (!isNaN(pyeong) && pyeong > 0) {
      const m2 = Math.round(pyeong * PYEONG_TO_M2 * 100) / 100;
      updateFormData({ area: String(m2) });
    } else {
      updateFormData({ area: filtered });
    }
  };

  const handleM2Change = (value: string) => {
    updateFormData({ area: toNumeric(value) });
  };
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>매물 상세 정보를 입력해주세요</h2>

      {/* 주소 */}
      <div className={styles.section}>
        <label className={styles.label}>
          주소<span className={styles.required}>*</span>
        </label>
        <button
          type="button"
          className={`${styles.input} ${styles.addressButton} ${errors.address ? styles.inputError : ''}`}
          onClick={() => setIsAddressOpen(true)}
        >
          {formData.address || '주소 검색'}
        </button>
        <p className={styles.error}>{errors.address || '\u00A0'}</p>
      </div>

      {/* 주소 검색 바텀 시트 */}
      {isAddressOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setIsAddressOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: 430,
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16 }}>주소 검색</span>
              <button
                onClick={() => setIsAddressOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  color: '#6b7280',
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <DaumPostcodeEmbed
              onComplete={(data) => {
                updateFormData({ address: data.roadAddress });
                setIsAddressOpen(false);
              }}
              style={{ width: '100%', height: 700 }}
            />
          </div>
        </div>
      )}

      {/* 상세 주소 */}
      <div className={styles.section}>
        <label className={styles.label}>
          상세 주소<span className={styles.required}>*</span>{' '}
          <span className={styles.optional}>(최대 100자)</span>
        </label>
        <input
          type="text"
          className={`${styles.input} ${errors.detailedAddress ? styles.inputError : ''}`}
          placeholder="예: 101동 202호"
          maxLength={100}
          value={formData.detailedAddress ?? ''}
          onChange={(e) => updateFormData({ detailedAddress: e.target.value })}
        />
        <p className={styles.error}>{errors.detailedAddress || '\u00A0'}</p>
      </div>

      {/* 면적 */}
      <div className={styles.section}>
        <label className={styles.label}>
          면적<span className={styles.required}>*</span>
        </label>
        <div className={styles.areaInputs}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              className={`${styles.input} ${errors.area ? styles.inputError : ''}`}
              placeholder="0"
              value={pyeongInput}
              onChange={(e) => handlePyeongChange(e.target.value)}
            />
            <span className={styles.inputUnit}>평</span>
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              className={`${styles.input} ${errors.area ? styles.inputError : ''}`}
              placeholder="0"
              value={formData.area}
              onChange={(e) => handleM2Change(e.target.value)}
            />
            <span className={styles.inputUnit}>m²</span>
          </div>
        </div>
        <p className={styles.error}>{errors.area || '\u00A0'}</p>
      </div>

      {/* 층수 */}
      <div className={styles.section}>
        <label className={styles.label}>
          층수<span className={styles.required}>*</span>
        </label>
        <div className={styles.floorInputs}>
          <div className={styles.chipGroup}>
            <button
              type="button"
              className={`${styles.chip} ${
                floorType === 'ground' ? styles.chipActive : ''
              }`}
              onClick={() => setFloorType('ground')}
            >
              지상
            </button>
            <button
              type="button"
              className={`${styles.chip} ${
                floorType === 'basement' ? styles.chipActive : ''
              }`}
              onClick={() => setFloorType('basement')}
            >
              지하
            </button>
          </div>
          <div className={styles.inputWithPreview}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                inputMode="numeric"
                className={`${styles.input} ${floorError ? styles.inputError : ''}`}
                placeholder="1"
                value={floorNumber}
                onChange={(e) => handleFloorNumberChange(e.target.value)}
              />
              <span className={styles.inputUnit}>층</span>
            </div>
            {floorNumber && !floorError && (
              <span className={styles.floorPreview}>
                {floorType === 'basement'
                  ? `B${floorNumber}`
                  : `${floorNumber}F`}
              </span>
            )}
          </div>
        </div>
        <p
          className={
            Number(floorNumber) >= 200
              ? styles.priceMaxReached
              : styles.priceMax
          }
        >
          {Number(floorNumber) >= 200 ? '최대 200층입니다.' : '최대 200층'}
        </p>
        <p className={styles.error}>{floorError || '\u00A0'}</p>
      </div>
    </div>
  );
}
